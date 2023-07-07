import * as React from 'react';
import { Card } from 'primereact/card';

function PlayersCard({ props, handleClick }) {
  const cardClassName = props.isSelected ? 'selected-card' : 'normal-card';
  return (
    <Card
      title={props.username}
      style={{ maxWidth: '345px' }}
      className={cardClassName}
      onClick={() => handleClick(props.id_users)}
    ></Card>
  );
}
export default PlayersCard;
