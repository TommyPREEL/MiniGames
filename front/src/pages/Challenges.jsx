import React, { useEffect, useRef, useState } from 'react';
import StartChallenges from '../components/startChallenges/StartChallenges';
import SentChallenges from '../components/sentChallenges/SentChallenges';
import ReceivedChallenges from '../components/receivedChallenges/ReceivedChallenges';
import DoneChallenges from '../components/doneChallenges/DoneChallenges';
import AcceptedChallenges from '../components/acceptedChallenges/AcceptedChallenges';
import StatusChallenges from '../components/statusChallenges/StatusChallenges';

import { TabMenu } from 'primereact/tabmenu';

function Challenges() {
  const [activeTab, setActiveTab] = useState(0);

  const items = [
    { label: 'Start a challenge', icon: 'pi pi-fw pi-home' },
    // { label: 'Challenges sent', icon: 'pi pi-fw pi-calendar' },
    // { label: 'Challenges received', icon: 'pi pi-fw pi-calendar' },
    // { label: 'Challenges accepted', icon: 'pi pi-fw pi-calendar' },
    // { label: 'Challenges done', icon: 'pi pi-fw pi-calendar' },
    { label: 'Challenges', icon: 'pi pi-fw pi-calendar' },
  ];

  return (
    <div>
      <div className="card">
        <TabMenu
          model={items}
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
        />
      </div>
      {activeTab === 0 && <StartChallenges></StartChallenges>}
      {/* {activeTab === 1 && <SentChallenges></SentChallenges>}
      {activeTab === 2 && <ReceivedChallenges></ReceivedChallenges>}
      {activeTab === 3 && <AcceptedChallenges></AcceptedChallenges>}
      {activeTab === 4 && <DoneChallenges></DoneChallenges>} */}
      {activeTab === 1 && <StatusChallenges></StatusChallenges>}
    </div>
  );
}
export default Challenges;
