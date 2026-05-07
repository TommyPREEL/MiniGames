const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// ─── WebSocket helpers ────────────────────────────────────────────────────────
function wsHandshake(req, socket) {
  const key = req.headers['sec-websocket-key'];
  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
}

function wsSend(socket, data) {
  if (socket.destroyed) return;
  const msg = Buffer.from(JSON.stringify(data));
  const len = msg.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81; header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81; header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  try { socket.write(Buffer.concat([header, msg])); } catch(e) {}
}

function wsParseFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  const masked = !!(buf[1] & 0x80);
  let len = buf[1] & 0x7f;
  let offset = 2;
  if (len === 126) { if (buf.length < 4) return null; len = buf.readUInt16BE(2); offset = 4; }
  else if (len === 127) { if (buf.length < 10) return null; len = Number(buf.readBigUInt64BE(2)); offset = 10; }
  if (buf.length < offset + (masked ? 4 : 0) + len) return null;
  let payload;
  if (masked) {
    const mask = buf.slice(offset, offset + 4);
    payload = Buffer.alloc(len);
    for (let i = 0; i < len; i++) payload[i] = buf[offset + 4 + i] ^ mask[i % 4];
  } else {
    payload = buf.slice(offset, offset + len);
  }
  // Handle control frames
  if (opcode === 0x8) return '__ws_close__';  // close frame
  if (opcode === 0x9) return '__ws_ping__';   // ping from client → send pong
  if (opcode === 0xa) return '__ws_pong__';   // pong reply from client
  return payload.toString();
}

function wsSendPing(socket) {
  if (socket.destroyed) return;
  try { socket.write(Buffer.from([0x89, 0x00])); } catch(e) {} // opcode 0x9 = ping, 0 length
}

function wsSendPong(socket) {
  if (socket.destroyed) return;
  try { socket.write(Buffer.from([0x8a, 0x00])); } catch(e) {} // opcode 0xa = pong
}

// ─── Game state ───────────────────────────────────────────────────────────────
const rooms = {}; // roomCode -> room
const disconnectTimers = {}; // playerId -> timeout

// ─── Millionaire constants ─────────────────────────────────────────────────────
const PRIZE_LADDER = [100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];
const MILL_SAFE_HAVENS = [4, 9];

// ─── Game data (loaded from data/ folder) ────────────────────────────────────
const PROFILER_CRITERIA  = require('./games/profiler/data/criteria.json');
const FAKE_ARTIST_WORDS  = require('./games/fake-artist/data/words.json');
const WAVELENGTH_PAIRS   = require('./games/wavelength/data/pairs.json');
const INSIDER_WORDS      = require('./games/insider/data/words.json');
const FA_COLORS = ['#f472b6','#38bdf8','#4ade80','#facc15','#fb923c','#a78bfa','#f87171','#34d399','#e879f9','#22d3ee'];
function getInsiderWord(category) {
  const list = category === 'random'
    ? Object.values(INSIDER_WORDS).flat()
    : (INSIDER_WORDS[category] || INSIDER_WORDS.objects);
  return list[Math.floor(Math.random() * list.length)];
}

// ─── Hot Takes helpers ────────────────────────────────────────────────────────
function sendHotTakesPrompt(room) {
  const idx = room.htCurrentRound;
  const prompt = room.htPrompts[idx];
  room.htVotes = {};
  broadcast(room, {
    type: 'hottakes_prompt',
    round: idx + 1,
    total: room.htPrompts.length,
    text: prompt.text,
    category: prompt.category,
    timeLimit: 15,
  });
  room.htTimerDuration = 16000;
  room.htTimerStartedAt = Date.now();
  room.htTimer = setTimeout(() => revealHotTakesPrompt(room), 16000);
}

function revealHotTakesPrompt(room) {
  clearTimeout(room.htTimer);
  if (room.phase !== 'playing') return;
  const idx = room.htCurrentRound;
  const agreeNames = [];
  const disagreeNames = [];
  for (const [id, vote] of Object.entries(room.htVotes)) {
    if (room.players[id]) {
      (vote === 'agree' ? agreeNames : disagreeNames).push(room.players[id].name);
    }
  }
  const agreeCount = agreeNames.length;
  const disagreeCount = disagreeNames.length;
  let pointEarners = [];
  if (agreeCount !== disagreeCount) {
    pointEarners = agreeCount > disagreeCount ? agreeNames : disagreeNames;
    for (const name of pointEarners) {
      room.htScores[name] = (room.htScores[name] || 0) + 1;
    }
  }
  broadcast(room, {
    type: 'hottakes_reveal',
    round: idx + 1,
    agreeNames,
    disagreeNames,
    pointEarners,
    scores: { ...room.htScores },
  });
  room.htCurrentRound++;
  if (room.htCurrentRound >= room.htPrompts.length) {
    room.htEndTimer = setTimeout(() => {
      broadcast(room, { type: 'hottakes_over', scores: { ...room.htScores } });
      room.phase = 'result';
      // Accumulate hub scores
      if (room.hubScores) {
        const totalRounds = room.htPrompts.length;
        for (const [name, votes] of Object.entries(room.htScores)) {
          const pts = totalRounds > 0 ? Math.round((votes / totalRounds) * 1000) : 0;
          room.hubScores[name] = (room.hubScores[name] || 0) + pts;
        }
        broadcast(room, { type: 'hub_scores_updated', hubScores: { ...room.hubScores } });
      }
    }, 4000);
  } else {
    room.htNextTimer = setTimeout(() => sendHotTakesPrompt(room), 4000);
  }
}

function sendMillQuestion(room) {
  const qi = room.millCurrentQi;
  const q = room.millQuestions[qi];
  room.millAnswers = {};
  broadcast(room, {
    type: 'millionaire_question',
    qi, q: q.q, a: q.a, b: q.b, c: q.c, d: q.d,
    value: PRIZE_LADDER[qi],
    isSafeHaven: MILL_SAFE_HAVENS.includes(qi),
    timeLimit: 20,
  });
  room.millTimerDuration = 21000;
  room.millTimerStartedAt = Date.now();
  room.millTimer = setTimeout(() => revealMillQuestion(room), 21000);
}

function revealMillQuestion(room) {
  clearTimeout(room.millTimer);
  if (room.phase !== 'playing') return;
  const qi = room.millCurrentQi;
  const q = room.millQuestions[qi];
  const correct = q.ans;
  if (!room.millEliminated) room.millEliminated = [];
  const newlyEliminated = [];
  // Award points to correct answers, eliminate wrong/no-answer players
  for (const [id, player] of Object.entries(room.players)) {
    if (room.millEliminated.includes(player.name)) continue;
    if (room.millAnswers[id] === correct) {
      room.millScores[player.name] = (room.millScores[player.name] || 0) + PRIZE_LADDER[qi];
    } else {
      newlyEliminated.push(player.name);
      room.millEliminated.push(player.name);
    }
  }
  // Build name->answer map
  const playerAnswers = {};
  for (const [id, ans] of Object.entries(room.millAnswers)) {
    if (room.players[id]) playerAnswers[room.players[id].name] = ans;
  }
  broadcast(room, {
    type: 'millionaire_reveal', qi, correct,
    scores: { ...room.millScores }, playerAnswers,
    newlyEliminated, allEliminated: [...room.millEliminated],
  });
  room.millCurrentQi++;
  const activePlayers = Object.values(room.players)
    .filter(p => !room.millEliminated.includes(p.name));
  if (room.millCurrentQi >= 15 || activePlayers.length === 0) {
    room.millEndTimer = setTimeout(() => {
      broadcast(room, { type: 'millionaire_over', scores: { ...room.millScores } });
      room.phase = 'result';
      // Accumulate hub scores
      if (room.hubScores) {
        for (const [name, prize] of Object.entries(room.millScores)) {
          const pts = Math.round((prize / 1000000) * 1000);
          room.hubScores[name] = (room.hubScores[name] || 0) + pts;
        }
        broadcast(room, { type: 'hub_scores_updated', hubScores: { ...room.hubScores } });
      }
    }, 3500);
  } else {
    room.millNextTimer = setTimeout(() => sendMillQuestion(room), 3500);
  }
}

function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function broadcast(room, data, exceptSocket = null) {
  for (const player of Object.values(room.players)) {
    if (player.socket && !player.socket.destroyed && player.socket !== exceptSocket)
      wsSend(player.socket, data);
  }
}

function doElimination(room, targetName) {
  room.eliminated.push(targetName);
  room.elimVotes = {};
  const spyNames = room.spyIds.map(id => room.players[id]?.name).filter(Boolean);
  const activePlayers = Object.values(room.players)
    .map(p => p.name)
    .filter(n => !room.eliminated.includes(n));
  const activeSpyCount = spyNames.filter(n => !room.eliminated.includes(n)).length;
  const allSpiesCaught = activeSpyCount === 0;
  const spyWins = !allSpiesCaught && activeSpyCount * 2 >= activePlayers.length;
  if (allSpiesCaught || spyWins) {
    broadcast(room, {
      type: 'game_over',
      civWin: allSpiesCaught,
      spyNames,
      civilianWord: room.civilianWord,
      undercoverWord: room.undercoverWord,
      eliminated: targetName,
      roles: Object.fromEntries(
        Object.entries(room.players).map(([id, p]) => [p.name, room.spyIds.includes(id) ? 'spy' : 'civilian'])
      ),
    });
    room.phase = 'result';
    // Accumulate hub scores
    if (room.hubScores) {
      for (const [id, p] of Object.entries(room.players)) {
        const isSpy = room.spyIds.includes(id);
        let pts = 0;
        if (allSpiesCaught) pts = isSpy ? 0 : 800;   // civs win: civilians get 800
        else if (spyWins)   pts = isSpy ? 1000 : 0;  // spy wins: spy gets 1000
        room.hubScores[p.name] = (room.hubScores[p.name] || 0) + pts;
      }
      broadcast(room, { type: 'hub_scores_updated', hubScores: { ...room.hubScores } });
    }
  } else {
    room.round++;
    room.speakIndex = 0;
    room.softVotes = {};
    const activeIds = shuffle(Object.entries(room.players)
      .filter(([,p]) => !room.eliminated.includes(p.name))
      .map(([id]) => id));
    room.speakOrder = activeIds.map(id => room.players[id].name);
    broadcast(room, {
      type: 'phase_play',
      speakOrder: room.speakOrder,
      speakIndex: 0,
      round: room.round,
      eliminated: room.eliminated,
      eliminatedPlayer: targetName,
    });
  }
}

// ─── Insider helpers ──────────────────────────────────────────────────────────
function insiderTimeUp(room) {
  if (room.phase !== 'playing' || !room.insiderId) return;
  clearTimeout(room.insiderAccusationTimer); room.insiderAccusationTimer = null;
  room.phase = 'result';
  const insiderName = room.players[room.insiderId]?.name || '?';
  // Civilians failed to find the word — nobody wins
  const scores = {};
  broadcast(room, { type: 'insider_over', insider: insiderName, insiderCaught: false, timeOut: true, scores, word: room.insiderWord, votes: {}, tally: {}, hubScores: { ...(room.hubScores || {}) } });
}

function resolveInsiderVotes(room) {
  clearTimeout(room.insiderAccusationTimer); room.insiderAccusationTimer = null;
  room.phase = 'result';
  const insiderName = room.players[room.insiderId]?.name || '?';
  const votes = room.insiderVotes || {};
  const tally = {};
  for (const target of Object.values(votes)) tally[target] = (tally[target] || 0) + 1;
  let maxVotes = 0, accused = null;
  for (const [name, count] of Object.entries(tally)) { if (count > maxVotes) { maxVotes = count; accused = name; } }
  const insiderCaught = accused === insiderName;
  const scores = {};
  if (insiderCaught) {
    for (const [voter, target] of Object.entries(votes)) if (target === insiderName) scores[voter] = (scores[voter] || 0) + 800;
  } else {
    scores[insiderName] = 1000;
  }
  if (room.hubScores) {
    for (const [name, pts] of Object.entries(scores)) room.hubScores[name] = (room.hubScores[name] || 0) + pts;
    broadcast(room, { type: 'hub_scores_updated', hubScores: { ...room.hubScores } });
  }
  broadcast(room, { type: 'insider_over', insider: insiderName, insiderCaught, accused, tally, scores, word: room.insiderWord, votes, hubScores: { ...(room.hubScores || {}) } });
}

function roomState(room) {
  return {
    type: 'room_state',
    code: room.code,
    host: room.players[room.host]?.name || '',
    players: Object.values(room.players).map(p => p.name),
    phase: room.phase,
    mode: room.mode,
    gameType: room.gameType,
    hubScores: { ...(room.hubScores || {}) },
  };
}

function hubState(room) {
  return {
    type: 'hub_state',
    code: room.code,
    host: room.players[room.host]?.name || '',
    players: Object.values(room.players).map(p => p.name),
    readySet: Object.values(room.players).filter(p => p.ready).map(p => p.name),
    hubScores: { ...(room.hubScores || {}) },
    gameType: room.gameType,
    gameConfig: { ...(room.gameConfig || {}) },
    isPrivate: !!room.isPrivate,
    lastRecap: room.lastRecap || null,
  };
}

function handleMessage(socket, raw, playerId) {
  let msg;
  try { msg = JSON.parse(raw); } catch(e) { return; }

  // Find this player's room
  let room = null, playerName = null;
  for (const r of Object.values(rooms)) {
    if (r.players[playerId]) { room = r; playerName = r.players[playerId].name; break; }
  }

  switch (msg.type) {

    case 'ping': break; // client heartbeat, ignore

    case 'emoji': {
      if (!room) break;
      const allowed = ['😂','🔥','😱','👀','🤔','💀','👑','🎯','❤️','🤡'];
      if (!allowed.includes(msg.emoji)) break;
      broadcast(room, { type: 'emoji', name: room.players[playerId]?.name || '?', emoji: msg.emoji }, socket);
      break;
    }

    case 'create_room': {
      const code = generateCode();
      const name = (msg.name || 'Player').trim().slice(0, 20);
      rooms[code] = {
        code,
        host: playerId,
        players: { [playerId]: { name, socket, ready: false } },
        phase: 'lobby',
        mode: msg.mode || 'characters',
        gameType: msg.gameType || 'undercover',
        gameData: null,
        eliminated: [],
        speakOrder: [],
        speakIndex: 0,
        round: 1,
        departed: {},
        hubScores: {},
        gameConfig: { mode: 'characters', theme: 'videogames', rounds: 10 },
      };
      wsSend(socket, { type: 'joined', code, name, isHost: true });
      wsSend(socket, roomState(rooms[code]));
      console.log(`Room ${code} created by ${name}`);
      break;
    }

    case 'create_hub_room': {
      const code = generateCode();
      const name = (msg.name || 'Player').trim().slice(0, 20);
      rooms[code] = {
        code,
        host: playerId,
        players: { [playerId]: { name, socket, ready: false, online: true } },
        phase: 'hub',
        mode: 'characters',
        gameType: 'hub',
        gameData: null,
        eliminated: [],
        speakOrder: [],
        speakIndex: 0,
        round: 1,
        departed: {},
        hubScores: { [name]: 0 },
        gameConfig: { mode: 'characters', theme: 'videogames', rounds: 10 },
        isPrivate: true,
      };
      wsSend(socket, { type: 'hub_joined', code, name, isHost: true });
      wsSend(socket, hubState(rooms[code]));
      console.log(`Hub room ${code} created by ${name}`);
      break;
    }

    case 'join_hub_room': {
      const hjCode = (msg.code || '').toUpperCase().trim();
      const hjName = (msg.name || 'Player').trim().slice(0, 20);
      const hjRoom = rooms[hjCode];
      if (!hjRoom) { wsSend(socket, { type: 'hub_error', msg: 'Room not found.' }); return; }
      if (hjRoom.phase !== 'hub') { wsSend(socket, { type: 'hub_error', msg: 'Game already in progress.' }); return; }
      const takenNames = Object.values(hjRoom.players).map(p => p.name.toLowerCase());
      if (takenNames.includes(hjName.toLowerCase())) { wsSend(socket, { type: 'hub_error', msg: 'Name already taken.' }); return; }
      hjRoom.players[playerId] = { name: hjName, socket, ready: false, online: true };
      if (!hjRoom.hubScores[hjName]) hjRoom.hubScores[hjName] = 0;
      wsSend(socket, { type: 'hub_joined', code: hjCode, name: hjName, isHost: false });
      broadcast(hjRoom, hubState(hjRoom));
      broadcast(hjRoom, { type: 'player_joined', name: hjName }, socket);
      console.log(`${hjName} joined hub room ${hjCode}`);
      break;
    }

    case 'hub_rejoin': {
      const hrCode = (msg.code || '').toUpperCase().trim();
      const hrName = (msg.name || '').trim();
      const hrRoom = rooms[hrCode];
      if (!hrRoom) { wsSend(socket, { type: 'hub_error', msg: 'Room not found or expired.' }); return; }
      let existingId = null;
      for (const [id, p] of Object.entries(hrRoom.players)) {
        if (p.name.toLowerCase() === hrName.toLowerCase()) { existingId = id; break; }
      }
      if (!existingId && hrRoom.departed) {
        for (const [id, d] of Object.entries(hrRoom.departed)) {
          if (d.name.toLowerCase() === hrName.toLowerCase()) {
            hrRoom.players[playerId] = { name: d.name, socket, ready: false, online: true };
            delete hrRoom.departed[id];
            existingId = playerId;
            break;
          }
        }
      }
      if (!existingId) { wsSend(socket, { type: 'hub_error', msg: 'Player not found in room.' }); return; }
      if (disconnectTimers[existingId]) { clearTimeout(disconnectTimers[existingId]); delete disconnectTimers[existingId]; }
      if (existingId !== playerId) {
        hrRoom.players[playerId] = { ...hrRoom.players[existingId], socket, online: true };
        delete hrRoom.players[existingId];
        if (hrRoom.host === existingId) hrRoom.host = playerId;
      } else {
        hrRoom.players[playerId].socket = socket;
        hrRoom.players[playerId].online = true;
      }
      const hrIsHost = hrRoom.host === playerId;
      wsSend(socket, { type: 'hub_joined', code: hrCode, name: hrName, isHost: hrIsHost });
      broadcast(hrRoom, hubState(hrRoom));
      console.log(`${hrName} rejoined hub room ${hrCode}`);
      break;
    }

    case 'chat_message': {
      if (!room || room.phase !== 'hub') return;
      const chatText = (msg.text || '').trim().slice(0, 200);
      if (!chatText) return;
      broadcast(room, { type: 'chat_message', name: playerName, text: chatText });
      break;
    }

    case 'kick_player': {
      if (!room || room.phase !== 'hub') return;
      if (room.host !== playerId) return; // only host can kick
      const kickName = (msg.name || '').trim();
      if (!kickName || kickName === playerName) return; // can't kick yourself
      const kickEntry = Object.entries(room.players).find(([, p]) => p.name === kickName);
      if (!kickEntry) return;
      const [kickId, kickPlayer] = kickEntry;
      // Notify the kicked player first
      if (kickPlayer.socket) wsSend(kickPlayer.socket, { type: 'kicked' });
      // Clear any pending disconnect timer
      if (disconnectTimers[kickId]) { clearTimeout(disconnectTimers[kickId]); delete disconnectTimers[kickId]; }
      delete room.players[kickId];
      delete room.hubScores[kickName];
      broadcast(room, hubState(room));
      broadcast(room, { type: 'player_left', name: kickName });
      console.log(`${kickName} was kicked from hub room ${room.code} by ${playerName}`);
      break;
    }

    case 'set_ready': {
      if (!room || room.phase !== 'hub') return;
      const readyVal = !!msg.ready;
      room.players[playerId].ready = readyVal;
      broadcast(room, hubState(room));
      break;
    }

    case 'list_lobbies': {
      const lobbies = Object.values(rooms)
        .filter(r => r.phase === 'hub' && !r.isPrivate)
        .map(r => ({
          code: r.code,
          host: r.players[r.host]?.name || '?',
          playerCount: Object.keys(r.players).length,
          gameType: r.gameType,
        }));
      wsSend(socket, { type: 'lobby_list', lobbies });
      break;
    }

    case 'set_lobby_privacy': {
      if (!room || room.host !== playerId) return;
      room.isPrivate = !!msg.isPrivate;
      broadcast(room, { type: 'lobby_privacy_updated', isPrivate: room.isPrivate });
      break;
    }

    case 'set_game_config': {
      if (!room || room.host !== playerId) return;
      if (!room.gameConfig) room.gameConfig = {};
      if (msg.mode !== undefined) { room.gameConfig.mode = msg.mode; room.mode = msg.mode; }
      if (msg.theme !== undefined) room.gameConfig.theme = msg.theme;
      if (msg.rounds !== undefined) room.gameConfig.rounds = msg.rounds;
      broadcast(room, { type: 'config_updated', gameConfig: { ...room.gameConfig } });
      break;
    }

    case 'launch_game': {
      if (!room || room.host !== playerId) return;
      if (msg.mode !== undefined) { room.gameConfig = room.gameConfig || {}; room.gameConfig.mode = msg.mode; room.mode = msg.mode; }
      if (msg.theme !== undefined) { room.gameConfig = room.gameConfig || {}; room.gameConfig.theme = msg.theme; }
      if (msg.rounds !== undefined) { room.gameConfig = room.gameConfig || {}; room.gameConfig.rounds = msg.rounds; }
      room.gameType = msg.gameType;
      room.phase = 'hub_waiting';
      // Snapshot scores before the game so we can compute deltas later
      room.preGameScores = { ...room.hubScores };
      room.lastRecap = null;
      broadcast(room, {
        type: 'game_launching',
        gameType: msg.gameType,
        code: room.code,
        gameConfig: { ...(room.gameConfig || {}) },
        players: Object.values(room.players).map(p => p.name),
        host: room.players[room.host]?.name || '',
      });
      console.log(`Hub room ${room.code} launching ${msg.gameType}`);
      break;
    }

    case 'return_to_hub': {
      if (!room || room.host !== playerId) return;
      if (room.millTimer) { clearTimeout(room.millTimer); room.millTimer = null; }
      if (room.htTimer) { clearTimeout(room.htTimer); room.htTimer = null; }
      if (room.insiderTimer) { clearTimeout(room.insiderTimer); room.insiderTimer = null; }
      if (room.insiderAccusationTimer) { clearTimeout(room.insiderAccusationTimer); room.insiderAccusationTimer = null; }
      // Build recap: delta scores per player for this game
      const pre = room.preGameScores || {};
      const recapEntries = Object.entries(room.hubScores || {})
        .map(([name, total]) => ({ name, pts: total - (pre[name] || 0) }))
        .filter(e => e.pts !== 0)
        .sort((a, b) => b.pts - a.pts);
      room.lastRecap = recapEntries.length ? { game: room.gameType, scores: recapEntries } : null;
      room.preGameScores = null;
      room.insiderPhase = null;
      room.profilerPhase = null;
      room.faPhase = null;
      room.wlPhase = null;
      room.paused = false;
      room.phase = 'hub';
      room.gameType = 'hub';
      room.eliminated = [];
      room.speakOrder = [];
      room.speakIndex = 0;
      room.round = 1;
      room.departed = {};
      for (const p of Object.values(room.players)) p.ready = false;
      broadcast(room, {
        type: 'game_launching',
        gameType: 'hub',
        code: room.code,
        gameConfig: { ...(room.gameConfig || {}) },
        players: Object.values(room.players).map(p => p.name),
        host: room.players[room.host]?.name || '',
        hubScores: { ...room.hubScores },
      });
      console.log(`Hub room ${room.code} returned to hub`);
      break;
    }

    case 'join_room': {
      const code = (msg.code || '').toUpperCase().trim();
      const name = (msg.name || 'Player').trim().slice(0, 20);
      if (!rooms[code]) { wsSend(socket, { type: 'error', msg: 'Room not found.' }); return; }
      const r = rooms[code];
      // Allow rejoining by name if player is already in the room (hub flow)
      const existingEntry = Object.entries(r.players).find(([,p]) => p.name.toLowerCase() === name.toLowerCase());
      if (existingEntry) {
        const [eid] = existingEntry;
        if (disconnectTimers[eid]) { clearTimeout(disconnectTimers[eid]); delete disconnectTimers[eid]; }
        r.players[playerId] = { ...r.players[eid], socket, online: true };
        delete r.players[eid];
        if (r.host === eid) r.host = playerId;
        if (r.spyIds) r.spyIds = r.spyIds.map(id => id === eid ? playerId : id);
        const rIsHost = r.host === playerId;
        wsSend(socket, { type: 'joined', code, name, isHost: rIsHost });
        broadcast(r, roomState(r));
        console.log(`${name} rejoined room ${code} (hub flow)`);
        break;
      }
      if (r.phase !== 'lobby') { wsSend(socket, { type: 'error', msg: 'Game already started.' }); return; }
      const takenNames = Object.values(r.players).map(p => p.name.toLowerCase());
      if (takenNames.includes(name.toLowerCase())) { wsSend(socket, { type: 'error', msg: 'Name already taken in this room.' }); return; }
      r.players[playerId] = { name, socket, ready: false };
      wsSend(socket, { type: 'joined', code, name, isHost: false });
      broadcast(r, roomState(r));
      console.log(`${name} joined room ${code}`);
      break;
    }

    case 'set_mode': {
      if (!room || room.host !== playerId) return;
      room.mode = msg.mode;
      broadcast(room, roomState(room));
      break;
    }

    case 'start_game': {
      if (!room || room.host !== playerId) return;
      const playerList = Object.values(room.players);
      if (playerList.length < 3) { wsSend(socket, { type: 'error', msg: 'Need at least 3 players.' }); return; }

      const pairs = msg.pairs; // sent from host client
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      const civilian = Math.random() < 0.5 ? pair[0] : pair[1];
      const undercover = civilian === pair[0] ? pair[1] : pair[0];

      const ids = Object.keys(room.players);
      const spyCount = Math.max(1, Math.floor(ids.length / 3));
      room.spyIds = shuffle(ids).slice(0, spyCount);

      room.phase = 'reveal';
      room.eliminated = [];
      room.softVotes = {};
      room.round = 1;
      room.speakIndex = 0;
      room.civilianWord = civilian;
      room.undercoverWord = undercover;

      // Shuffle speak order
      room.speakOrder = shuffle(ids).map(id => room.players[id].name);

      // Send each player their own word privately
      for (const [id, player] of Object.entries(room.players)) {
        wsSend(player.socket, {
          type: 'game_start',
          word: room.spyIds.includes(id) ? undercover : civilian,
          speakOrder: room.speakOrder,
          round: 1,
          players: Object.values(room.players).map(p => p.name),
          phase: 'reveal',
        });
      }
      console.log(`Room ${room.code} game started`);
      break;
    }

    case 'ready': {
      if (!room) return;
      room.players[playerId].ready = true;
      const onlinePlayers = Object.values(room.players).filter(p => p.socket && !p.socket.destroyed);
      const readyNames = Object.values(room.players).filter(p => p.ready).map(p => p.name);
      const all = onlinePlayers.length > 0 && onlinePlayers.every(p => p.ready);
      broadcast(room, { type: 'player_ready', name: playerName, readyPlayers: readyNames, totalPlayers: onlinePlayers.length });
      if (all) {
        for (const p of Object.values(room.players)) p.ready = false;
        room.phase = 'play';
        room.speakIndex = 0;
        broadcast(room, {
          type: 'phase_play',
          speakOrder: room.speakOrder,
          speakIndex: 0,
          round: room.round,
          eliminated: room.eliminated,
        });
      }
      break;
    }

    case 'force_ready': {
      if (!room || room.host !== playerId) return;
      for (const p of Object.values(room.players)) p.ready = false;
      room.phase = 'play';
      room.speakIndex = 0;
      broadcast(room, {
        type: 'phase_play',
        speakOrder: room.speakOrder,
        speakIndex: 0,
        round: room.round,
        eliminated: room.eliminated,
      });
      console.log(`Room ${room.code} force-started by host`);
      break;
    }

    case 'soft_vote': {
      if (!room) return;
      const svTarget = String(msg.target || '').trim();
      if (!svTarget) return;
      room.softVotes = room.softVotes || {};
      room.softVotes[playerId] = svTarget;
      const namedVotes = {};
      for (const [pid, tgt] of Object.entries(room.softVotes)) {
        if (room.players[pid]) namedVotes[room.players[pid].name] = tgt;
      }
      broadcast(room, { type: 'vote_update', votes: namedVotes });
      break;
    }

    case 'next_speaker': // kept for compat but now speaker submits
    case 'submit_clue': {
      if (!room) return;
      // Only the current speaker can submit their clue
      const currentSpeaker = room.speakIndex < room.speakOrder.length ? room.speakOrder[room.speakIndex] : null;
      if (playerName !== currentSpeaker && room.host !== playerId) return;
      const clue = typeof msg.clue === 'string' ? msg.clue.trim().slice(0, 60) : '';
      if (!clue) return; // must type something
      room.speakIndex++;
      room.elimVotes = {}; // reset votes for next vote phase
      broadcast(room, { type: 'speaker_update', speakIndex: room.speakIndex, lastPlayer: currentSpeaker, lastClue: clue });
      break;
    }

    case 'cast_vote': {
      if (!room) return;
      const cvTarget = String(msg.target || '').trim();
      if (!cvTarget) return;
      // Only alive players can vote, and can't vote for themselves
      const isAlive = !room.eliminated.includes(playerName);
      if (!isAlive) return;
      room.elimVotes = room.elimVotes || {};
      room.elimVotes[playerId] = cvTarget;
      // Build named vote map for broadcast
      const namedElimVotes = {};
      for (const [pid, tgt] of Object.entries(room.elimVotes)) {
        if (room.players[pid]) namedElimVotes[room.players[pid].name] = tgt;
      }
      const alivePlayers = Object.values(room.players)
        .filter(p => !room.eliminated.includes(p.name) && p.socket && !p.socket.destroyed);
      const allVoted = alivePlayers.every(p => {
        const pid = Object.entries(room.players).find(([,v]) => v === p)?.[0];
        return pid && room.elimVotes[pid];
      });
      broadcast(room, { type: 'elim_vote_update', votes: namedElimVotes, total: alivePlayers.length });
      if (allVoted) {
        // Tally votes
        const tally = {};
        for (const tgt of Object.values(room.elimVotes)) {
          tally[tgt] = (tally[tgt] || 0) + 1;
        }
        const maxVotes = Math.max(...Object.values(tally));
        const topNames = Object.keys(tally).filter(n => tally[n] === maxVotes);
        // If tie, host decides (send tie_break message)
        if (topNames.length > 1) {
          broadcast(room, { type: 'tie_break', tied: topNames, tally });
        } else {
          doElimination(room, topNames[0]);
        }
      }
      break;
    }

    case 'resolve_tie': {
      if (!room || room.host !== playerId) return;
      const tieName = String(msg.target || '').trim();
      if (!tieName) return;
      doElimination(room, tieName);
      break;
    }

    case 'vote_eliminate': {
      // Legacy: host direct eliminate (kept as fallback)
      if (!room || room.host !== playerId) return;
      doElimination(room, msg.target);
      break;
    }

    case 'extra_round': {
      if (!room || room.host !== playerId) return;
      const activeIds = shuffle(Object.entries(room.players)
        .filter(([,p]) => !room.eliminated.includes(p.name))
        .map(([id]) => id));
      room.speakOrder = activeIds.map(id => room.players[id].name);
      room.speakIndex = 0;
      room.softVotes = {};
      room.elimVotes = {};
      broadcast(room, {
        type: 'extra_speaking_round',
        speakOrder: room.speakOrder,
        speakIndex: 0,
      });
      console.log(`Room ${room.code} extra speaking round started by host`);
      break;
    }

    case 'cancel_round': {
      if (!room || room.host !== playerId) return;
      if (room.millTimer) { clearTimeout(room.millTimer); room.millTimer = null; }
      if (room.htTimer) { clearTimeout(room.htTimer); room.htTimer = null; }
      if (room.insiderTimer) { clearTimeout(room.insiderTimer); room.insiderTimer = null; }
      if (room.insiderAccusationTimer) { clearTimeout(room.insiderAccusationTimer); room.insiderAccusationTimer = null; }
      room.insiderPhase = null;
      room.profilerPhase = null;
      room.faPhase = null;
      room.wlPhase = null;
      room.paused = false;
      room.phase = 'lobby';
      room.eliminated = [];
      room.speakOrder = [];
      room.speakIndex = 0;
      room.round = 1;
      room.gameData = null;
      room.spyIds = [];
      room.softVotes = {};
      room.elimVotes = {};
      room.departed = {};
      for (const p of Object.values(room.players)) p.ready = false;
      broadcast(room, roomState(room));
      broadcast(room, { type: 'back_to_lobby' });
      console.log(`Room ${room.code} round cancelled by host`);
      break;
    }

    case 'leave_room': {
      if (!room || !room.players[playerId]) return;
      const leaveName = room.players[playerId].name;
      if (disconnectTimers[playerId]) { clearTimeout(disconnectTimers[playerId]); delete disconnectTimers[playerId]; }
      delete room.players[playerId];
      if (Object.keys(room.players).length === 0) {
        delete rooms[room.code];
      } else {
        if (room.host === playerId) {
          room.host = Object.keys(room.players)[0];
          broadcast(room, { type: 'new_host', name: room.players[room.host].name });
        }
        if (room.gameType === 'hub' || room.phase === 'hub') {
          broadcast(room, hubState(room));
        } else {
          broadcast(room, roomState(room));
        }
        broadcast(room, { type: 'player_left', name: leaveName });
      }
      console.log(`${leaveName} explicitly left room ${room.code}`);
      break;
    }

    case 'new_game': {
      if (!room || room.host !== playerId) return;
      if (room.millTimer) { clearTimeout(room.millTimer); room.millTimer = null; }
      if (room.htTimer) { clearTimeout(room.htTimer); room.htTimer = null; }
      if (room.insiderTimer) { clearTimeout(room.insiderTimer); room.insiderTimer = null; }
      if (room.insiderAccusationTimer) { clearTimeout(room.insiderAccusationTimer); room.insiderAccusationTimer = null; }
      room.insiderPhase = null;
      room.profilerPhase = null;
      room.faPhase = null;
      room.wlPhase = null;
      room.paused = false;
      room.phase = 'lobby';
      room.eliminated = [];
      room.speakOrder = [];
      room.speakIndex = 0;
      room.round = 1;
      room.gameData = null;
      room.departed = {};
      for (const p of Object.values(room.players)) p.ready = false;
      broadcast(room, roomState(room));
      broadcast(room, { type: 'back_to_lobby' });
      break;
    }

    case 'start_millionaire': {
      if (!room || room.host !== playerId || room.gameType !== 'millionaire') return;
      const qs = msg.questions;
      if (!Array.isArray(qs) || qs.length < 15) return;
      room.phase = 'playing';
      room.paused = false;
      room.millQuestions = qs.slice(0, 15);
      room.millScores = {};
      room.millEliminated = [];
      Object.values(room.players).forEach(p => { room.millScores[p.name] = 0; });
      room.millCurrentQi = 0;
      room.millAnswers = {};
      sendMillQuestion(room);
      console.log(`Room ${room.code} millionaire game started`);
      break;
    }

    case 'millionaire_answer': {
      if (!room || room.gameType !== 'millionaire' || room.phase !== 'playing') return;
      if (room.paused) return;
      if (msg.qi !== room.millCurrentQi) return;
      if (room.millAnswers[playerId]) return; // already answered
      const ans = msg.ans;
      if (!['a','b','c','d'].includes(ans)) return;
      if (room.millEliminated && room.millEliminated.includes(room.players[playerId]?.name)) return;
      room.millAnswers[playerId] = ans;
      // If all active (non-eliminated) online players answered, reveal immediately
      const onlineIds = Object.entries(room.players)
        .filter(([,p]) => p.socket && !p.socket.destroyed && !(room.millEliminated||[]).includes(p.name))
        .map(([id]) => id);
      if (onlineIds.every(id => room.millAnswers[id])) {
        clearTimeout(room.millTimer);
        revealMillQuestion(room);
      }
      break;
    }

    case 'mil_fifty_fifty': {
      if (!room || room.gameType !== 'millionaire' || room.phase !== 'playing') return;
      const qi5 = room.millCurrentQi;
      const q5 = room.millQuestions[qi5];
      if (!q5) return;
      const wrong5 = ['a','b','c','d'].filter(l => l !== q5.ans);
      const shuffled5 = wrong5.sort(() => Math.random() - 0.5);
      const toHide5 = shuffled5.slice(0, 2);
      const player5 = room.players[playerId];
      if (player5 && player5.socket) {
        player5.socket.send(JSON.stringify({ type: 'mil_fifty_fifty_result', hide: toHide5 }));
      }
      break;
    }

    case 'pause_game': {
      if (!room || room.host !== playerId) return;
      if (room.paused) return;
      room.paused = true;
      if (room.gameType === 'millionaire' && room.millTimer) {
        clearTimeout(room.millTimer); room.millTimer = null;
        const elapsed = Date.now() - (room.millTimerStartedAt || Date.now());
        room.millPauseTimeLeft = Math.max(1000, (room.millTimerDuration || 21000) - elapsed);
      }
      if (room.gameType === 'hottakes' && room.htTimer) {
        clearTimeout(room.htTimer); room.htTimer = null;
        const elapsed = Date.now() - (room.htTimerStartedAt || Date.now());
        room.htPauseTimeLeft = Math.max(1000, (room.htTimerDuration || 16000) - elapsed);
      }
      broadcast(room, { type: 'game_paused' });
      break;
    }

    case 'resume_game': {
      if (!room || room.host !== playerId) return;
      if (!room.paused) return;
      room.paused = false;
      if (room.gameType === 'millionaire') {
        const ms = room.millPauseTimeLeft || 5000;
        broadcast(room, { type: 'game_resumed', timeLeft: Math.ceil(ms / 1000), timeLeftMs: ms });
        room.millTimerStartedAt = Date.now();
        room.millTimerDuration = ms;
        room.millTimer = setTimeout(() => revealMillQuestion(room), ms);
      }
      if (room.gameType === 'hottakes') {
        const ms = room.htPauseTimeLeft || 5000;
        broadcast(room, { type: 'game_resumed', timeLeft: Math.ceil(ms / 1000), timeLeftMs: ms });
        room.htTimerStartedAt = Date.now();
        room.htTimerDuration = ms;
        room.htTimer = setTimeout(() => revealHotTakesPrompt(room), ms);
      }
      break;
    }

    case 'start_hottakes': {
      if (!room || room.host !== playerId || room.gameType !== 'hottakes') return;
      const prompts = msg.prompts;
      if (!Array.isArray(prompts) || prompts.length < 1) return;
      room.phase = 'playing';
      room.paused = false;
      room.htPrompts = prompts;
      room.htScores = {};
      Object.values(room.players).forEach(p => { room.htScores[p.name] = 0; });
      room.htCurrentRound = 0;
      room.htVotes = {};
      sendHotTakesPrompt(room);
      console.log(`Room ${room.code} hot takes game started (${prompts.length} rounds)`);
      break;
    }

    case 'hottakes_vote': {
      if (!room || room.gameType !== 'hottakes' || room.phase !== 'playing') return;
      if (room.paused) return;
      if (msg.round !== room.htCurrentRound + 1) return;
      if (room.htVotes[playerId]) return; // already voted
      const vote = msg.vote;
      if (!['agree', 'disagree'].includes(vote)) return;
      room.htVotes[playerId] = vote;
      // Broadcast vote count (without revealing who voted what yet)
      const totalVoted = Object.keys(room.htVotes).length;
      const totalPlayers = Object.values(room.players).filter(p => p.socket && !p.socket.destroyed).length;
      broadcast(room, { type: 'hottakes_vote_count', voted: totalVoted, total: totalPlayers });
      // If all online players voted, reveal immediately
      const onlineIds = Object.entries(room.players)
        .filter(([,p]) => p.socket && !p.socket.destroyed)
        .map(([id]) => id);
      if (onlineIds.every(id => room.htVotes[id])) {
        clearTimeout(room.htTimer);
        revealHotTakesPrompt(room);
      }
      break;
    }

    case 'start_insider': {
      if (!room || room.host !== playerId || room.gameType !== 'insider') return;
      const playerIds = Object.keys(room.players);
      if (playerIds.length < 4) { wsSend(socket, { type: 'error', msg: 'Need at least 4 players.' }); return; }
      const word = getInsiderWord(msg.category || 'random');
      const nonHostIds = playerIds.filter(id => id !== room.host);
      const insiderId = nonHostIds[Math.floor(Math.random() * nonHostIds.length)];
      room.phase = 'playing';
      room.insiderWord = word;
      room.insiderId = insiderId;
      room.insiderQuestions = [];
      room.insiderVotes = {};
      room.insiderQCounter = 0;
      room.insiderPhase = 'questions';
      for (const [id, player] of Object.entries(room.players)) {
        const isInsider = id === insiderId;
        const isMaster = id === room.host;
        wsSend(player.socket, {
          type: 'insider_start',
          role: isMaster ? 'master' : (isInsider ? 'insider' : 'civilian'),
          word: (isMaster || isInsider) ? word : null,
          players: Object.values(room.players).map(p => p.name),
          host: room.players[room.host]?.name || '',
          category: msg.category || 'random',
        });
      }
      room.insiderTimerEnd = Date.now() + 186000;
      room.insiderTimer = setTimeout(() => insiderTimeUp(room), 186000); // 3 min + 6s role reveal
      console.log(`Room ${room.code} insider game started, word: ${word}`);
      break;
    }

    case 'insider_ask': {
      if (!room || room.insiderPhase !== 'questions') return;
      if (room.host === playerId) return; // master doesn't ask
      const question = (msg.question || '').trim().slice(0, 150);
      if (!question) return;
      const qId = ++room.insiderQCounter;
      const q = { id: qId, player: playerName, question, answer: null };
      room.insiderQuestions.push(q);
      broadcast(room, { type: 'insider_question', id: qId, player: playerName, question });
      break;
    }

    case 'insider_answer': {
      if (!room || room.host !== playerId || room.insiderPhase !== 'questions') return;
      const q = room.insiderQuestions.find(q => q.id === msg.questionId);
      if (!q || q.answer) return;
      const answer = ['yes','no','maybe'].includes(msg.answer) ? msg.answer : null;
      if (!answer) return;
      q.answer = answer;
      broadcast(room, { type: 'insider_answered', id: q.id, answer });
      break;
    }

    case 'insider_guess': {
      if (!room || room.insiderPhase !== 'questions' || room.host === playerId || room.insiderId === playerId) return;
      const guess = (msg.word || '').trim().toLowerCase();
      const target = room.insiderWord.toLowerCase();
      if (guess === target || target.includes(guess) || guess.includes(target)) {
        clearTimeout(room.insiderTimer); room.insiderTimer = null;
        room.insiderPhase = 'accusation';
        room.insiderWordGuessedBy = playerName;
        room.insiderAccTimerEnd = Date.now() + 45000;
        broadcast(room, { type: 'insider_word_guessed', guesser: playerName, word: room.insiderWord });
        room.insiderAccusationTimer = setTimeout(() => resolveInsiderVotes(room), 45000);
      } else {
        broadcast(room, { type: 'insider_wrong_guess', player: playerName, word: msg.word });
      }
      break;
    }

    case 'insider_vote': {
      if (!room || room.insiderPhase !== 'accusation' || room.host === playerId) return;
      const targetName = String(msg.target || '').trim();
      if (!Object.values(room.players).find(p => p.name === targetName)) return;
      if (targetName === playerName) return; // can't vote self
      room.insiderVotes[playerName] = targetName;
      const nonHostCount = Object.values(room.players).filter(p => Object.keys(room.players).find(id => room.players[id] === p && id !== room.host)).length;
      broadcast(room, { type: 'insider_vote_update', votes: { ...room.insiderVotes }, total: nonHostCount });
      if (Object.keys(room.insiderVotes).length >= nonHostCount) {
        clearTimeout(room.insiderAccusationTimer);
        resolveInsiderVotes(room);
      }
      break;
    }

    // ─── FAKE ARTIST ─────────────────────────────────────────────────────────────

    case 'start_fake_artist': {
      if (!room || room.host !== playerId || room.gameType !== 'fake_artist') return;
      const pIds = Object.keys(room.players);
      if (pIds.length < 3) { wsSend(socket, { type: 'error', msg: 'Need at least 3 players.' }); return; }
      const category = msg.category || 'objects';
      const wordList = FAKE_ARTIST_WORDS[category] || FAKE_ARTIST_WORDS.objects;
      const word = wordList[Math.floor(Math.random() * wordList.length)];
      const shuffledIds = shuffle([...pIds]);
      const fakeArtistId = shuffledIds[0];
      const turnOrder = shuffle([...pIds]);
      const colorMap = {};
      shuffledIds.forEach((id, i) => { colorMap[id] = FA_COLORS[i % FA_COLORS.length]; });
      room.faWord = word;
      room.faCategory = category;
      room.fakeArtistId = fakeArtistId;
      room.faTurnOrder = turnOrder;
      room.faTurnIdx = 0;
      room.faRound = 1;
      room.faPhase = 'drawing';
      room.faStrokes = [];
      room.faVotes = {};
      room.faColorMap = colorMap;
      room.phase = 'playing';
      for (const [id, player] of Object.entries(room.players)) {
        wsSend(player.socket, {
          type: 'fa_start',
          word: id === fakeArtistId ? null : word,
          category,
          isFake: id === fakeArtistId,
          turnOrder: turnOrder.map(i => room.players[i]?.name),
          myColor: colorMap[id],
          colorMap: Object.fromEntries(Object.entries(colorMap).map(([i, c]) => [room.players[i]?.name, c])),
          currentDrawer: room.players[turnOrder[0]]?.name,
          round: 1,
        });
      }
      console.log(`Room ${room.code} fake artist started, word: "${word}" category: ${category}`);
      break;
    }

    case 'fa_draw': {
      if (!room || room.faPhase !== 'drawing') return;
      if (room.faTurnOrder[room.faTurnIdx] !== playerId) return;
      broadcast(room, { type: 'fa_draw', points: msg.points, color: room.faColorMap[playerId] }, socket);
      break;
    }

    case 'fa_end_stroke': {
      if (!room || room.faPhase !== 'drawing') return;
      if (room.faTurnOrder[room.faTurnIdx] !== playerId) return;
      if (msg.points && msg.points.length > 1) {
        room.faStrokes.push({ points: msg.points, color: room.faColorMap[playerId], drawer: playerName });
      }
      room.faTurnIdx++;
      if (room.faTurnIdx >= room.faTurnOrder.length) {
        room.faTurnIdx = 0;
        room.faRound++;
        if (room.faRound > 2) {
          room.faPhase = 'voting';
          broadcast(room, { type: 'fa_stroke_done', stroke: room.faStrokes[room.faStrokes.length - 1] || null, currentDrawer: null, round: room.faRound });
          broadcast(room, { type: 'fa_vote_start', players: Object.values(room.players).map(p => p.name) });
          break;
        }
      }
      const nextDrawer = room.players[room.faTurnOrder[room.faTurnIdx]]?.name;
      broadcast(room, { type: 'fa_stroke_done', stroke: room.faStrokes[room.faStrokes.length - 1] || null, currentDrawer: nextDrawer, round: room.faRound });
      break;
    }

    case 'fa_vote': {
      if (!room || room.faPhase !== 'voting') return;
      if (room.fakeArtistId === playerId) return;
      const faTarget = String(msg.target || '').trim();
      if (!Object.values(room.players).find(p => p.name === faTarget)) return;
      room.faVotes[playerName] = faTarget;
      const nonFakeCount = Object.keys(room.players).filter(id => id !== room.fakeArtistId).length;
      broadcast(room, { type: 'fa_vote_update', votes: { ...room.faVotes }, total: nonFakeCount });
      if (Object.keys(room.faVotes).length >= nonFakeCount) {
        const tally = {};
        for (const t of Object.values(room.faVotes)) tally[t] = (tally[t] || 0) + 1;
        const fakeArtistName = room.players[room.fakeArtistId]?.name;
        const maxVotes = Math.max(...Object.values(tally));
        const topVoted = Object.keys(tally).filter(n => tally[n] === maxVotes);
        const caught = topVoted.length === 1 && topVoted[0] === fakeArtistName;
        if (caught) {
          room.faPhase = 'guessing';
          broadcast(room, { type: 'fa_caught', fakeArtist: fakeArtistName, tally, votes: room.faVotes });
        } else {
          room.phase = 'result'; room.faPhase = 'result';
          const fakeScores = { [fakeArtistName]: 1000 };
          if (room.hubScores) { room.hubScores[fakeArtistName] = (room.hubScores[fakeArtistName] || 0) + 1000; broadcast(room, { type: 'hub_scores_updated', hubScores: { ...room.hubScores } }); }
          broadcast(room, { type: 'fa_result', fakeArtist: fakeArtistName, word: room.faWord, fakeWins: true, reason: 'escaped', tally, votes: room.faVotes, scores: fakeScores, hubScores: { ...(room.hubScores || {}) } });
        }
      }
      break;
    }

    case 'fa_fake_guess': {
      if (!room || room.faPhase !== 'guessing' || room.fakeArtistId !== playerId) return;
      const faGuess = (msg.word || '').trim().toLowerCase();
      const faTarget2 = room.faWord.toLowerCase();
      const correct = faGuess === faTarget2 || faTarget2.includes(faGuess) || faGuess.includes(faTarget2);
      room.phase = 'result'; room.faPhase = 'result';
      const fakeArtistName = room.players[room.fakeArtistId]?.name;
      const scores = {};
      if (correct) {
        scores[fakeArtistName] = 800;
        if (room.hubScores) room.hubScores[fakeArtistName] = (room.hubScores[fakeArtistName] || 0) + 800;
      } else {
        for (const [id, p] of Object.entries(room.players)) {
          if (id !== room.fakeArtistId) { scores[p.name] = 600; if (room.hubScores) room.hubScores[p.name] = (room.hubScores[p.name] || 0) + 600; }
        }
      }
      if (room.hubScores) broadcast(room, { type: 'hub_scores_updated', hubScores: { ...room.hubScores } });
      broadcast(room, { type: 'fa_result', fakeArtist: fakeArtistName, word: room.faWord, fakeWins: correct, reason: correct ? 'guessed_word' : 'artists_win', tally: {}, votes: room.faVotes, scores, hubScores: { ...(room.hubScores || {}) } });
      break;
    }

    // ─── WAVELENGTH ───────────────────────────────────────────────────────────────

    case 'start_wavelength': {
      if (!room || room.host !== playerId || room.gameType !== 'wavelength') return;
      const wlIds = Object.keys(room.players);
      if (wlIds.length < 2) { wsSend(socket, { type: 'error', msg: 'Need at least 2 players.' }); return; }
      room.wlOrder = shuffle([...wlIds]);
      room.wlRound = 1;
      room.wlTotalRounds = room.wlOrder.length;
      room.wlPsychicTurn = 0;
      room.wlPsychicId = room.wlOrder[0];
      room.wlScores = {};
      for (const id of wlIds) room.wlScores[id] = 0;
      room.wlPhase = 'clue';
      room.wlGuesses = {};
      room.phase = 'playing';
      const wlPair = WAVELENGTH_PAIRS[Math.floor(Math.random() * WAVELENGTH_PAIRS.length)];
      const wlTarget = Math.floor(Math.random() * 71) + 15;
      room.wlPair = wlPair; room.wlTarget = wlTarget; room.wlClue = null;
      for (const [id, player] of Object.entries(room.players)) {
        const isPsychic = id === room.wlPsychicId;
        wsSend(player.socket, {
          type: 'wl_start',
          round: room.wlRound,
          totalRounds: room.wlTotalRounds,
          psychic: room.players[room.wlPsychicId]?.name,
          isPsychic,
          pair: wlPair,
          target: isPsychic ? wlTarget : null,
          scores: Object.fromEntries(Object.entries(room.wlScores).map(([pid, v]) => [room.players[pid]?.name, v]).filter(([n]) => !!n)),
        });
      }
      console.log(`Room ${room.code} wavelength started`);
      break;
    }

    case 'wl_give_clue': {
      if (!room || room.wlPhase !== 'clue' || room.wlPsychicId !== playerId) return;
      const wlClue = (msg.clue || '').trim().slice(0, 60);
      if (!wlClue) return;
      room.wlClue = wlClue;
      room.wlPhase = 'guessing';
      room.wlGuesses = {};
      const expected = Object.keys(room.players).filter(id => id !== room.wlPsychicId && room.players[id]?.socket).length;
      broadcast(room, { type: 'wl_clue_given', clue: wlClue, pair: room.wlPair, expected });
      break;
    }

    case 'wl_slider': {
      // Kept for backwards compatibility with older clients that still emit slider updates.
      break;
    }

    case 'wl_lock': {
      if (!room || room.wlPhase !== 'guessing') return;
      if (room.wlPsychicId === playerId) return;
      if (room.wlGuesses[playerId] !== undefined) return;

      const wlPos2 = Math.round(Math.max(0, Math.min(100, Number(msg.pos) || 50)));
      room.wlGuesses[playerId] = wlPos2;

      const expectedIds = Object.keys(room.players).filter(id => id !== room.wlPsychicId && room.players[id]?.socket);
      const expected = expectedIds.length;
      const received = Object.keys(room.wlGuesses).filter(id => expectedIds.includes(id)).length;

      broadcast(room, { type: 'wl_guess_progress', expected, received });
      if (received < expected) break;

      room.wlPhase = 'reveal';

      const diffs = {};
      let roundPenalty = 0;
      for (const id of expectedIds) {
        const guess = room.wlGuesses[id];
        const d = Math.abs(guess - room.wlTarget);
        diffs[id] = d;
        roundPenalty += d;
        room.wlScores[id] = (room.wlScores[id] || 0) + d;
      }

      const nameDiffs = Object.fromEntries(Object.entries(diffs).map(([id, d]) => [room.players[id]?.name, d]).filter(([n]) => !!n));
      const scoreByName = Object.fromEntries(Object.entries(room.wlScores).map(([id, v]) => [room.players[id]?.name, v]).filter(([n]) => !!n));

      const won = room.wlRound >= room.wlTotalRounds;
      if (won) {
        room.phase = 'result';
        const minScore = Math.min(...Object.values(room.wlScores));
        const winnerIds = Object.keys(room.wlScores).filter(id => room.wlScores[id] === minScore);
        const wlScores = {};
        winnerIds.forEach(id => {
          const n = room.players[id]?.name;
          if (n) {
            wlScores[n] = 500;
            if (room.hubScores) room.hubScores[n] = (room.hubScores[n] || 0) + 500;
          }
        });
        if (room.hubScores) broadcast(room, { type: 'hub_scores_updated', hubScores: { ...room.hubScores } });
        broadcast(room, {
          type: 'wl_reveal',
          target: room.wlTarget,
          guesses: Object.fromEntries(Object.entries(room.wlGuesses).map(([id, g]) => [room.players[id]?.name, g]).filter(([n]) => !!n)),
          diffs: nameDiffs,
          roundPenalty,
          scores: scoreByName,
          won: true,
          winners: winnerIds.map(id => room.players[id]?.name).filter(Boolean),
          winningScore: minScore,
          wlScores,
          hubScores: { ...(room.hubScores || {}) },
        });
      } else {
        broadcast(room, {
          type: 'wl_reveal',
          target: room.wlTarget,
          guesses: Object.fromEntries(Object.entries(room.wlGuesses).map(([id, g]) => [room.players[id]?.name, g]).filter(([n]) => !!n)),
          diffs: nameDiffs,
          roundPenalty,
          scores: scoreByName,
          won: false,
        });
      }
      break;
    }

    case 'wl_next_round': {
      if (!room || room.host !== playerId || room.wlPhase !== 'reveal') return;
      room.wlRound++;
      room.wlPsychicTurn = (room.wlPsychicTurn + 1) % room.wlOrder.length;
      room.wlPsychicId = room.wlOrder[room.wlPsychicTurn];
      const wlPair2 = WAVELENGTH_PAIRS[Math.floor(Math.random() * WAVELENGTH_PAIRS.length)];
      const wlTarget2 = Math.floor(Math.random() * 71) + 15;
      room.wlPair = wlPair2;
      room.wlTarget = wlTarget2;
      room.wlClue = null;
      room.wlGuesses = {};
      room.wlPhase = 'clue';
      for (const [id, player] of Object.entries(room.players)) {
        const isPsychic = id === room.wlPsychicId;
        wsSend(player.socket, {
          type: 'wl_new_round',
          psychic: room.players[room.wlPsychicId]?.name,
          isPsychic,
          pair: wlPair2,
          target: isPsychic ? wlTarget2 : null,
          round: room.wlRound,
          totalRounds: room.wlTotalRounds,
          scores: Object.fromEntries(Object.entries(room.wlScores).map(([pid, v]) => [room.players[pid]?.name, v]).filter(([n]) => !!n)),
        });
      }
      break;
    }

    // ─── PROFILER ─────────────────────────────────────────────────────────────────

    case 'start_profiler': {
      if (!room || room.host !== playerId || room.gameType !== 'profiler') return;
      const pIds = Object.keys(room.players);
      if (pIds.length < 2) { wsSend(socket, { type: 'error', msg: 'Need at least 2 players.' }); return; }
      const shuffledIds = shuffle([...pIds]);
      const half = Math.ceil(shuffledIds.length / 2);
      room.profilerTeamA = shuffledIds.slice(0, half);
      room.profilerTeamB = shuffledIds.slice(half);
      const criteriaPool = shuffle([...PROFILER_CRITERIA]);
      room.profilerCriteriaA = criteriaPool[0];
      room.profilerCriteriaB = criteriaPool[1];
      room.profilerActiveTurn = 'A';
      room.profilerPhase = 'proposing';
      room.profilerLog = [];
      room.profilerPendingChar = null;
      room.profilerVotes = {};
      room.phase = 'playing';
      for (const [id, player] of Object.entries(room.players)) {
        const isA = room.profilerTeamA.includes(id);
        wsSend(player.socket, {
          type: 'profiler_start',
          myTeam: isA ? 'A' : 'B',
          myCriteria: isA ? room.profilerCriteriaA : room.profilerCriteriaB,
          teamA: room.profilerTeamA.map(i => room.players[i]?.name).filter(Boolean),
          teamB: room.profilerTeamB.map(i => room.players[i]?.name).filter(Boolean),
          activeTurn: 'A',
        });
      }
      console.log(`Room ${room.code} profiler started — A:"${room.profilerCriteriaA}" B:"${room.profilerCriteriaB}"`);
      break;
    }

    case 'profiler_propose': {
      if (!room || room.phase !== 'playing' || room.profilerPhase !== 'proposing') return;
      const isActive = room.profilerActiveTurn === 'A'
        ? room.profilerTeamA.includes(playerId)
        : room.profilerTeamB.includes(playerId);
      if (!isActive) return;
      const char = (msg.character || '').trim().slice(0, 80);
      if (!char) return;
      room.profilerPendingChar = { char, proposer: playerName };
      room.profilerVotes = {};
      room.profilerPhase = 'voting';
      broadcast(room, { type: 'profiler_proposed', character: char, proposer: playerName, activeTurn: room.profilerActiveTurn });
      break;
    }

    case 'profiler_vote': {
      if (!room || room.phase !== 'playing' || room.profilerPhase !== 'voting') return;
      const isOpposing = room.profilerActiveTurn === 'A'
        ? room.profilerTeamB.includes(playerId)
        : room.profilerTeamA.includes(playerId);
      if (!isOpposing) return;
      if (Object.keys(room.profilerVotes).length > 0) return; // first click wins
      const answer = (msg.answer === 'yes' || msg.answer === true) ? 'yes' : 'no';
      const proposingTeam = room.profilerActiveTurn;
      const entry = { char: room.profilerPendingChar.char, proposer: room.profilerPendingChar.proposer, answer, answerer: playerName };
      room.profilerLog.push(entry);
      room.profilerVotes = {};
      room.profilerPendingChar = null;
      room.profilerActiveTurn = room.profilerActiveTurn === 'A' ? 'B' : 'A';
      room.profilerPhase = 'proposing';
      broadcast(room, { type: 'profiler_answered', ...entry, proposingTeam, activeTurn: room.profilerActiveTurn, log: room.profilerLog });
      break;
    }

    case 'profiler_guess_criteria': {
      if (!room || room.phase !== 'playing' || room.profilerPhase !== 'proposing') return;
      const isActive = room.profilerActiveTurn === 'A'
        ? room.profilerTeamA.includes(playerId)
        : room.profilerTeamB.includes(playerId);
      if (!isActive) return;
      const guess = (msg.guess || '').trim().toLowerCase();
      const target = (room.profilerActiveTurn === 'A' ? room.profilerCriteriaB : room.profilerCriteriaA).toLowerCase();
      const correct = guess.length >= 3 && (guess === target || target.includes(guess) || guess.includes(target));
      if (correct) {
        room.phase = 'result';
        const winTeam = room.profilerActiveTurn;
        const winnerIds = winTeam === 'A' ? room.profilerTeamA : room.profilerTeamB;
        const scores = {};
        winnerIds.forEach(id => {
          const n = room.players[id]?.name;
          if (n) {
            scores[n] = 500;
            if (room.hubScores) room.hubScores[n] = (room.hubScores[n] || 0) + 500;
          }
        });
        if (room.hubScores) broadcast(room, { type: 'hub_scores_updated', hubScores: { ...room.hubScores } });
        broadcast(room, {
          type: 'profiler_over',
          winner: winTeam,
          guesser: playerName,
          criteriaA: room.profilerCriteriaA,
          criteriaB: room.profilerCriteriaB,
          scores,
          hubScores: { ...(room.hubScores || {}) },
        });
      } else {
        room.profilerActiveTurn = room.profilerActiveTurn === 'A' ? 'B' : 'A';
        broadcast(room, { type: 'profiler_wrong_guess', guesser: playerName, guess: msg.guess, activeTurn: room.profilerActiveTurn });
      }
      break;
    }

    case 'rejoin_room': {
      const rjCode = (msg.code || '').toUpperCase().trim();
      const rjName = (msg.name || '').trim();
      const rj = rooms[rjCode];
      if (!rj) { wsSend(socket, { type: 'error', msg: 'Room not found or expired.' }); return; }
      let existingId = null;
      for (const [id, p] of Object.entries(rj.players)) {
        if (p.name.toLowerCase() === rjName.toLowerCase()) { existingId = id; break; }
      }
      // Check departed players if not found among active players
      let fromDeparted = false;
      if (!existingId && rj.departed) {
        for (const [id, d] of Object.entries(rj.departed)) {
          if (d.name.toLowerCase() === rjName.toLowerCase()) { existingId = id; fromDeparted = true; break; }
        }
      }
      if (!existingId) { wsSend(socket, { type: 'error', msg: 'Player not found in room.' }); return; }
      if (disconnectTimers[existingId]) { clearTimeout(disconnectTimers[existingId]); delete disconnectTimers[existingId]; }
      if (fromDeparted) {
        // Restore departed player back into active players
        const dep = rj.departed[existingId];
        rj.players[playerId] = { name: dep.name, socket, ready: false, online: true };
        delete rj.departed[existingId];
        if (dep.wasHost && Object.keys(rj.players).length === 1) rj.host = playerId;
        if (rj.spyIds && dep.wasSpy) rj.spyIds.push(playerId);
        // Game-specific ID re-keying for departed player
        if (rj.fakeArtistId === existingId) rj.fakeArtistId = playerId;
        if (rj.faTurnOrder) rj.faTurnOrder = rj.faTurnOrder.map(id => id === existingId ? playerId : id);
        if (rj.faColorMap && rj.faColorMap[existingId] !== undefined) { rj.faColorMap[playerId] = rj.faColorMap[existingId]; delete rj.faColorMap[existingId]; }
        if (rj.insiderId === existingId) rj.insiderId = playerId;
        if (rj.profilerTeamA) rj.profilerTeamA = rj.profilerTeamA.map(id => id === existingId ? playerId : id);
        if (rj.profilerTeamB) rj.profilerTeamB = rj.profilerTeamB.map(id => id === existingId ? playerId : id);
        if (rj.wlOrder) rj.wlOrder = rj.wlOrder.map(id => id === existingId ? playerId : id);
        if (rj.wlScores && rj.wlScores[existingId] !== undefined) { rj.wlScores[playerId] = rj.wlScores[existingId]; delete rj.wlScores[existingId]; }
        if (rj.wlGuesses && rj.wlGuesses[existingId] !== undefined) { rj.wlGuesses[playerId] = rj.wlGuesses[existingId]; delete rj.wlGuesses[existingId]; }
        if (rj.wlPsychicId === existingId) rj.wlPsychicId = playerId;
      } else {
        // Re-key player under the new connection's playerId
        rj.players[playerId] = { ...rj.players[existingId], socket, online: true };
        delete rj.players[existingId];
        if (rj.host === existingId) rj.host = playerId;
        if (rj.spyIds) rj.spyIds = rj.spyIds.map(id => id === existingId ? playerId : id);
        // Game-specific ID re-keying
        if (rj.fakeArtistId === existingId) rj.fakeArtistId = playerId;
        if (rj.faTurnOrder) rj.faTurnOrder = rj.faTurnOrder.map(id => id === existingId ? playerId : id);
        if (rj.faColorMap && rj.faColorMap[existingId] !== undefined) { rj.faColorMap[playerId] = rj.faColorMap[existingId]; delete rj.faColorMap[existingId]; }
        if (rj.insiderId === existingId) rj.insiderId = playerId;
        if (rj.profilerTeamA) rj.profilerTeamA = rj.profilerTeamA.map(id => id === existingId ? playerId : id);
        if (rj.profilerTeamB) rj.profilerTeamB = rj.profilerTeamB.map(id => id === existingId ? playerId : id);
        if (rj.wlOrder) rj.wlOrder = rj.wlOrder.map(id => id === existingId ? playerId : id);
        if (rj.wlScores && rj.wlScores[existingId] !== undefined) { rj.wlScores[playerId] = rj.wlScores[existingId]; delete rj.wlScores[existingId]; }
        if (rj.wlGuesses && rj.wlGuesses[existingId] !== undefined) { rj.wlGuesses[playerId] = rj.wlGuesses[existingId]; delete rj.wlGuesses[existingId]; }
        if (rj.wlPsychicId === existingId) rj.wlPsychicId = playerId;
      }
      const rjIsHost = rj.host === playerId;
      wsSend(socket, { type: 'joined', code: rjCode, name: rjName, isHost: rjIsHost });
      if (rj.phase === 'lobby') {
        broadcast(rj, roomState(rj));
      } else if (rj.gameType === 'fake_artist' && rj.faPhase) {
        const nameMap = Object.fromEntries(Object.entries(rj.players).map(([id, p]) => [id, p.name]));
        const isFakeArtist = rj.fakeArtistId === playerId;
        const colorMapByName = Object.fromEntries(Object.entries(rj.faColorMap || {}).map(([id, c]) => [nameMap[id], c]));
        wsSend(socket, {
          type: 'fa_rejoin',
          faPhase: rj.faPhase,
          strokes: rj.faStrokes || [],
          isFake: isFakeArtist,
          word: isFakeArtist ? null : rj.faWord,
          category: rj.faCategory,
          myColor: rj.faColorMap?.[playerId],
          colorMap: colorMapByName,
          turnOrder: (rj.faTurnOrder || []).map(id => nameMap[id]).filter(Boolean),
          currentDrawer: nameMap[rj.faTurnOrder?.[rj.faTurnIdx]],
          round: rj.faRound,
          players: Object.values(rj.players).map(p => p.name),
          code: rjCode,
          isHost: rjIsHost,
          name: rjName,
        });
        broadcast(rj, { type: 'player_online', name: rjName }, socket);
      } else if (rj.gameType === 'insider' && rj.insiderPhase) {
        const isInsider = rj.insiderId === playerId;
        const isMaster = rj.host === playerId;
        wsSend(socket, {
          type: 'insider_rejoin',
          code: rjCode, name: rjName, isHost: rjIsHost,
          insiderPhase: rj.insiderPhase,
          role: isMaster ? 'master' : (isInsider ? 'insider' : 'civilian'),
          word: (isMaster || isInsider) ? rj.insiderWord : null,
          players: Object.values(rj.players).map(p => p.name),
          host: rj.players[rj.host]?.name || '',
          questions: rj.insiderQuestions || [],
          votes: rj.insiderVotes || {},
          remainingMs: rj.insiderPhase === 'questions' ? Math.max(0, (rj.insiderTimerEnd || 0) - Date.now()) : Math.max(0, (rj.insiderAccTimerEnd || 0) - Date.now()),
          wordGuessedBy: rj.insiderWordGuessedBy || null,
        });
        broadcast(rj, { type: 'player_online', name: rjName }, socket);
      } else if (rj.gameType === 'profiler' && rj.profilerPhase) {
        const isA = rj.profilerTeamA.includes(playerId);
        const nameMap = Object.fromEntries(Object.entries(rj.players).map(([id, p]) => [id, p.name]));
        wsSend(socket, {
          type: 'profiler_rejoin',
          code: rjCode, name: rjName, isHost: rjIsHost,
          myTeam: isA ? 'A' : 'B',
          myCriteria: isA ? rj.profilerCriteriaA : rj.profilerCriteriaB,
          teamA: rj.profilerTeamA.map(id => nameMap[id]).filter(Boolean),
          teamB: rj.profilerTeamB.map(id => nameMap[id]).filter(Boolean),
          activeTurn: rj.profilerActiveTurn,
          profilerPhase: rj.profilerPhase,
          log: rj.profilerLog || [],
          pendingChar: rj.profilerPendingChar || null,
          players: Object.values(rj.players).map(p => p.name),
        });
        broadcast(rj, { type: 'player_online', name: rjName }, socket);
      } else if (rj.gameType === 'wavelength' && rj.wlPhase) {
        const nameMap = Object.fromEntries(Object.entries(rj.players).map(([id, p]) => [id, p.name]));
        const isPsychic = rj.wlPsychicId === playerId;
        const scoreByName = Object.fromEntries(Object.entries(rj.wlScores || {}).map(([id, v]) => [nameMap[id], v]).filter(([n]) => !!n));
        const expected = Object.keys(rj.players).filter(id => id !== rj.wlPsychicId && rj.players[id]?.socket).length;
        const received = Object.keys(rj.wlGuesses || {}).length;
        wsSend(socket, {
          type: 'wl_rejoin',
          code: rjCode, name: rjName, isHost: rjIsHost,
          isPsychic,
          psychic: nameMap[rj.wlPsychicId],
          pair: rj.wlPair,
          target: isPsychic ? rj.wlTarget : null,
          clue: rj.wlClue,
          wlPhase: rj.wlPhase,
          round: rj.wlRound || 1,
          totalRounds: rj.wlTotalRounds || Object.keys(rj.players).length,
          scores: scoreByName,
          expected,
          received,
          players: Object.values(rj.players).map(p => p.name),
        });
        broadcast(rj, { type: 'player_online', name: rjName }, socket);
      } else {
        const isSpy = rj.spyIds && rj.spyIds.includes(playerId);
        wsSend(socket, {
          type: 'rejoin_ack',
          phase: rj.phase,
          code: rjCode,
          isHost: rjIsHost,
          name: rjName,
          word: isSpy ? rj.undercoverWord : rj.civilianWord,
          players: Object.values(rj.players).map(p => p.name),
          speakOrder: rj.speakOrder,
          speakIndex: rj.speakIndex,
          round: rj.round,
          eliminated: rj.eliminated,
          mode: rj.mode,
        });
        broadcast(rj, { type: 'player_online', name: rjName }, socket);
      }
      console.log(`${rjName} rejoined room ${rjCode}`);
      break;
    }
  }
}

// ─── HTTP + WS server ─────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const reqPath = req.url.split('?')[0];
  if (reqPath === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  let filePath = path.join(__dirname, reqPath === '/' ? 'index.html' : reqPath);
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); res.end(); return; }
  // Serve index.html for directory paths
  if (filePath.endsWith('/') || !path.extname(filePath)) {
    filePath = path.join(filePath, 'index.html');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' }[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

const clients = {};
let clientCounter = 0;

server.on('upgrade', (req, socket, head) => {
  if (req.headers.upgrade?.toLowerCase() !== 'websocket') { socket.destroy(); return; }
  wsHandshake(req, socket);

  const playerId = 'p' + (++clientCounter);
  clients[playerId] = socket;
  console.log(`Client connected: ${playerId}`);

  // Heartbeat: send ping every 25s to keep connection alive
  const heartbeat = setInterval(() => wsSendPing(socket), 25000);

  let buf = Buffer.alloc(0);
  socket.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const text = wsParseFrame(buf);
      if (text === null) break;
      // Calculate consumed bytes to advance buffer
      let len = buf[1] & 0x7f;
      let fOffset = 2;
      if (len === 126) { len = buf.readUInt16BE(2); fOffset = 4; }
      else if (len === 127) { len = Number(buf.readBigUInt64BE(2)); fOffset = 10; }
      const masked = !!(buf[1] & 0x80);
      const frameLen = fOffset + (masked ? 4 : 0) + len;
      buf = buf.slice(frameLen);
      // Handle control frames
      if (text === '__ws_pong__') continue;
      if (text === '__ws_ping__') { wsSendPong(socket); continue; }
      if (text === '__ws_close__') { socket.end(); continue; }
      handleMessage(socket, text, playerId);
    }
  });

  socket.on('close', () => {
    clearInterval(heartbeat);
    delete clients[playerId];
    for (const [code, room] of Object.entries(rooms)) {
      if (room.players[playerId]) {
        const name = room.players[playerId].name;
        room.players[playerId].socket = null;
        room.players[playerId].online = false;
        const gracePeriod = (room.phase === 'lobby' || room.phase === 'hub') ? 3 * 60 * 1000 : 5 * 60 * 1000;
        console.log(`${name} disconnected from room ${code} (grace period: ${gracePeriod/1000}s)`);
        broadcast(room, { type: 'player_offline', name });
        disconnectTimers[playerId] = setTimeout(() => {
          if (!rooms[code] || !room.players[playerId]) return;
          // Save player data for late rejoin
          const wasSpy = room.spyIds && room.spyIds.includes(playerId);
          const wasHost = room.host === playerId;
          if (!room.departed) room.departed = {};
          room.departed[playerId] = { name, wasSpy, wasHost };
          delete room.players[playerId];
          if (room.spyIds) room.spyIds = room.spyIds.filter(id => id !== playerId);
          delete disconnectTimers[playerId];
          console.log(`${name} removed from room ${code} (timeout — saved to departed)`);
          if (Object.keys(room.players).length === 0) {
            delete rooms[code];
            console.log(`Room ${code} deleted`);
          } else {
            if (room.host === playerId) {
              room.host = Object.keys(room.players)[0];
              broadcast(room, { type: 'new_host', name: room.players[room.host].name });
            }
            if (room.gameType === 'hub' || room.phase === 'hub') {
              broadcast(room, hubState(room));
            } else {
              broadcast(room, roomState(room));
            }
            broadcast(room, { type: 'player_left', name });
          }
        }, gracePeriod);
        break;
      }
    }
  });

  socket.on('error', () => {});
});

server.listen(PORT, () => {
  console.log(`\n🎮 Minigames server running on http://localhost:${PORT}`);
  console.log(`   Open index.html in your browser or visit http://localhost:${PORT}\n`);
});
