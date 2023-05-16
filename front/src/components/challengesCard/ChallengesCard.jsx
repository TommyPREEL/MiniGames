import * as React from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import './challengesCard.css';

function ChallengesCard({props, selected, onClick}) {
    // src={props.img}
  return (
    <Card title={props.label} subTitle={props.description} style={{ maxWidth: '345px'}}
    className={`card ${selected ? 'selected' : ''}`}
    onClick={onClick}
    >
    {/* <img  alt={props.description} style={{ objectFit: 'cover', height: '200px' }} /> */}
    {/* <div className="p-card-footer">
        <Button label="Buy" />
    </div> */}
    </Card>
  );
}
export default ChallengesCard;