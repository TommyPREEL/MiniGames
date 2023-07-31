import React from 'react';

const PlayerList = ({ players }) => {
  return (
    <div>
      <h2>Liste des joueurs :</h2>
      <ul>
        {players.map((player, index) => (
          <li key={index}>
            {player.name} - {player.role}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;
