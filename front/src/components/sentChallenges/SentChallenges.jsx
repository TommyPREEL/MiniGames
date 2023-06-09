import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';

import ChallengesCard from '../challengesCard/ChallengesCard';

function SentChallenges() {
  //   const [playerList, setPlayerList] = useState([]);
  //   const [selectedPlayer, setSelectedPlayer] = useState(null);
  // const [selectedChallenge, setSelectedChallenge] = useState(null);

  const toast = useRef(null);

  const [challengesList, setChallengesList] = useState([]);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    // name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    // 'country.name': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    // representative: { value: null, matchMode: FilterMatchMode.IN },
    // status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
  });

  useEffect(() => {
    let inputs = {
      id_user: JSON.parse(localStorage.getItem('user')).id_users,
    };
    fetch(`http://vps-222d59be.vps.ovh.net:5000/api/challenges/list_sent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputs),
    })
      .then((response) => response.json())
      .then((dataBack) => {
        // const dataBackArray = Object.entries(dataBack);
        // setChallengesList(dataBackArray);
        setChallengesList(dataBack);
      })
      .catch((error) => {
        console.error(error);
        //   toast.current.show({severity:'error', summary: 'Error', detail:'Bad credentials', life: 3000});
      });
  }, []);

  const onGlobalFilterChange = (event) => {
    const value = event.target.value;
    let _filters = { ...filters };

    _filters['global'].value = value;

    setFilters(_filters);
  };

  const renderHeader = () => {
    const value = filters['global'] ? filters['global'].value : '';

    return (
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={value || ''}
          onChange={(e) => onGlobalFilterChange(e)}
          placeholder="Search a challenger"
        />
      </span>
    );
  };

  const header = renderHeader();
  // const [dialog, setDialog] = useState(false);

  // const onRowSelect = (event) => {
  //   setSelectedChallenge(event.value);
  //   setDialog(true);
  // };
  // Cancel button
  //   function handleClickCancel() {
  //     setDialog(false);
  //     setSelectedChallenge(null);
  //     setSelectedPlayer(null);
  //   }

  // Save button
  //   const handleClickStart = () => {
  //     if (!selectedChallenge) {
  //       toast.current.show({
  //         severity: 'error',
  //         summary: 'Error',
  //         detail: 'Select a challenge',
  //         life: 3000,
  //       });
  //     } else {
  //       let inputs = {
  //         challenger: JSON.parse(localStorage.getItem('user')),
  //         challenged: selectedPlayer,
  //         challenge: selectedChallenge,
  //       };
  //       console.log(inputs);
  //       fetch(`http://192.168.91.120:5000/api/challenges/start`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify(inputs),
  //       })
  //         .then((response) => response.json())
  //         .then((dataBack) => {
  //           setDialog(false);
  //           if (dataBack.message === 'PASSED') {
  //             toast.current.show({
  //               severity: 'success',
  //               summary: 'Success',
  //               detail: 'Challenge sent !',
  //               life: 3000,
  //             });
  //             handleClickCancel();
  //           }
  //         })
  //         .catch((error) => {
  //           console.error(error);
  //         });
  //     }
  //   };

  // Footer dialog
  //   const dialogFooter = (
  //     <React.Fragment>
  //       <Button
  //         label="Go back"
  //         icon="pi pi-times"
  //         outlined
  //         onClick={handleClickCancel}
  //         className="p-button-text"
  //       />
  //       <Button
  //         label="Let's start !"
  //         icon="pi pi-check"
  //         onClick={handleClickStart}
  //         autoFocus
  //       />
  //     </React.Fragment>
  //   );

  //   const handleCardClick = (id) => {
  //     setChallengesList((prevList) =>
  //       prevList.map((challenge) => {
  //         if (challenge.id_mini_games === id) {
  //           if (selectedChallenge?.id_mini_games === challenge.id_mini_games) {
  //             setSelectedChallenge(null);
  //           } else {
  //             setSelectedChallenge(challenge);
  //           }
  //           return { ...challenge, isSelected: !challenge.isSelected };
  //         } else {
  //           return { ...challenge, isSelected: false };
  //         }
  //       })
  //     );
  //   };

  return (
    <div>
      <p>Here, you can find the challenges that you created</p>
      <Toast ref={toast} />
      <div className="card">
        {/* <Toast ref={toast} /> */}
        {/* <DataTable value={playerList} selectionMode="single" selection={selectedPlayer} onSelectionChange={(e) => setSelectedPlayer(e.value)} dataKey="id"
                    onRowSelect={onRowSelect} metaKeySelection={false} tableStyle={{ minWidth: '50rem' }}>
                <Column field="username" header="Username"></Column>
            </DataTable> */}

        <DataTable
          value={challengesList}
          paginator
          rows={5}
          header={header}
          filters={filters}
          onFilter={(e) => setFilters(e.filters)}
          // selection={selectedChallenge}
          // onSelectionChange={onRowSelect}
          // selectionMode="single"
          dataKey="id"
          stateStorage="session"
          stateKey="dt-state-demo-local"
          emptyMessage="No challenge found."
          tableStyle={{ minWidth: '50rem' }}
          // onRowSelect={(e) => onRowSelect(e)}(e) => setSelectedPlayer(e.value)
        >
          <Column
            field="username"
            header="Challengers"
            sortable
            style={{ width: '25%' }}
          ></Column>
          <Column
            field="label"
            header="Mini games"
            sortable
            style={{ width: '25%' }}
          ></Column>
          {/* <Column header="Country" body={countryBodyTemplate} sortable sortField="country.name" filter filterField="country.name" filterPlaceholder="Search" style={{ width: '25%' }}></Column> */}
          {/* <Column header="Agent" body={representativeBodyTemplate} sortable sortField="representative.name" filter filterField="representative"
                    showFilterMatchModes={false} filterElement={representativeFilterTemplate} filterMenuStyle={{ width: '14rem' }} style={{ width: '25%' }} ></Column> */}
        </DataTable>
      </div>
    </div>
  );
}
export default SentChallenges;
