import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { FilterMatchMode } from 'primereact/api';

function ReceivedChallenges() {
  const toast = useRef(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [challengesList, setChallengesList] = useState([]);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  useEffect(() => {
    let inputs = {
      id_user: JSON.parse(localStorage.getItem('user')).id_users,
    };
    fetch(`http://51.75.125.127:5000/api/challenges/list_received`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputs),
    })
      .then((response) => response.json())
      .then((dataBack) => {
        setChallengesList(dataBack);
      })
      .catch((error) => {
        console.error(error);
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: 'An error has occurred',
          life: 3000,
        });
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
          placeholder="Search a challenge done"
        />
      </span>
    );
  };

  const onRowSelect = (event) => {
    setSelectedChallenge(event.value);
    setDialog(true);
  };

  const [dialog, setDialog] = useState(false);
  const header = renderHeader();

  // Refuse button
  function handleClickRefuse() {
    setDialog(false);
    setSelectedChallenge(null);
  }

  // Cancel
  function handleClickCancel() {
    setDialog(false);
    setSelectedChallenge(null);
  }

  // Save button
  const handleClickAccept = () => {
    let inputs = {
      // challenger: selectedChallenge.id_,
      // challenged: JSON.parse(localStorage.getItem('user')),
      challenge: selectedChallenge,
    };
    console.log(inputs);
    fetch(`http://51.75.125.127:5000/api/challenges/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputs),
    })
      .then((response) => response.json())
      .then((dataBack) => {
        setDialog(false);
        if (dataBack.message === 'PASSED') {
          toast.current.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Challenge accepted !',
            life: 3000,
          });
          handleClickCancel();
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // Footer dialog
  const dialogFooter = (
    <React.Fragment>
      <Button
        label="Refuse challenge"
        icon="pi pi-times"
        severity="danger"
        onClick={handleClickRefuse}
      />
      <Button
        label="Challenge accepted!"
        icon="pi pi-check"
        onClick={handleClickAccept}
        severity="success"
        autoFocus
      />
    </React.Fragment>
  );

  return (
    <>
      {/* <div>
        <p>Here, you can find the challenges that you finished</p>
        <Toast ref={toast} />
        <div className="card">
          <DataTable
            value={challengesList}
            paginator
            rows={5}
            header={header}
            filters={filters}
            onFilter={(e) => setFilters(e.filters)}
            dataKey="id"
            stateStorage="session"
            stateKey="dt-state-demo-local"
            emptyMessage="No challenge found."
            tableStyle={{ minWidth: '50rem' }}
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
          </DataTable>
        </div>
      </div> */}

      <div>
        <p>Search and select a player to start a challenge :</p>
        <Toast ref={toast} />
        <Dialog
          header="Do you want to accept the challenge ?"
          visible={dialog}
          style={{ width: '30vw' }}
          onHide={handleClickCancel}
          footer={dialogFooter}
        ></Dialog>
        <div className="card">
          <DataTable
            value={challengesList}
            paginator
            rows={5}
            header={header}
            filters={filters}
            onFilter={(e) => setFilters(e.filters)}
            selection={selectedChallenge}
            onSelectionChange={onRowSelect}
            selectionMode="single"
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
              header="Mini Games"
              sortable
              style={{ width: '25%' }}
            ></Column>
          </DataTable>
        </div>
      </div>
    </>
  );
}
export default ReceivedChallenges;

// function StartChallenge() {
//   const [player, setPlayer] = useState('');
//   const [playerList, setPlayerList] = useState([]);
//   const [selectedPlayer, setSelectedPlayer] = useState(null);
//   const toast = useRef(null);
//   // const emptyChallengesList = {
//   // }
//   const [challengesList, setChallengesList] = useState([{}]);

//   const [filters, setFilters] = useState({
//     global: { value: null, matchMode: FilterMatchMode.CONTAINS },
//     // name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
//     // 'country.name': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
//     // representative: { value: null, matchMode: FilterMatchMode.IN },
//     // status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
//   });

// }
