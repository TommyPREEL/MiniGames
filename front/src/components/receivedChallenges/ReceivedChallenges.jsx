import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { FilterMatchMode } from 'primereact/api';

function ReceivedChallenges() {
  const toast = useRef(null);
  const [challengesList, setChallengesList] = useState([]);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  useEffect(() => {
    let inputs = {
      id_user: JSON.parse(localStorage.getItem('user')).id_users,
    };
    fetch(`http://192.168.1.11:5000/api/challenges/list_received`, {
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

  const header = renderHeader();
  return (
    <div>
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
    </div>
  );
}
export default ReceivedChallenges;
