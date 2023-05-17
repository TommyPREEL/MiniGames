import * as React from 'react';
import { Card } from 'primereact/card';
import './challengesCard.css';

function ChallengesCard({ props, handleClick }) {
  const cardClassName = props.isSelected ? 'selected-card' : 'normal-card';
  return (
    <Card
      title={props.label}
      subTitle={props.description}
      style={{ maxWidth: '345px' }}
      className={cardClassName}
      onClick={() => handleClick(props.id_mini_games)}
    ></Card>
  );
}
export default ChallengesCard;
