import React, { useState } from 'react';
import PlayerList from '../../components/amongLegendsPlayers/AmongLegendsPlayers';

function AmongLegends() {
  const [players, setPlayers] = useState([]);
  const [roomCode, setRoomCode] = useState(0);

  const handleCreateRoom = () => {
    return Math.floor(1000 + Math.random() * 9000);
  };

  const handleJoinRoom = () => {};
  return (
    <div>
      <button onClick={handleCreateRoom}>Créer une salle</button>
      <div>{roomCode && <p>Code de la salle : {roomCode}</p>}</div>
      <PlayerList players={players} />
    </div>
  );
}
export default AmongLegends;
