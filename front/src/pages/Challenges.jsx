import React, { useEffect, useRef, useState } from 'react';
import StartChallenge from '../components/startChallenge/StartChallenge';
import SentChallenge from '../components/sentChallenges/SentChallenges';

import { TabMenu } from 'primereact/tabmenu';

function Challenges() {
  const [activeTab, setActiveTab] = useState(0);

  const items = [
    { label: 'Start a challenge', icon: 'pi pi-fw pi-home' },
    { label: 'Challenges sent', icon: 'pi pi-fw pi-calendar' },
    { label: 'Challenges received', icon: 'pi pi-fw pi-calendar' },
    { label: 'Challenges done', icon: 'pi pi-fw pi-calendar' },
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
      {activeTab === 0 && <StartChallenge></StartChallenge>}
      {activeTab === 1 && <SentChallenge></SentChallenge>}
      {activeTab === 2 && <StartChallenge></StartChallenge>}
      {activeTab === 3 && <StartChallenge></StartChallenge>}
    </div>
  );
}
export default Challenges;
