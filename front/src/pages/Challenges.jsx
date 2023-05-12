import React, { useEffect, useRef, useState } from 'react';
import { InputText } from "primereact/inputtext";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';

import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';

function Challenges() {

    const [player, setPlayer] = useState("");
    const [playerList, setPlayerList] = useState([]);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        // name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        // 'country.name': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        // representative: { value: null, matchMode: FilterMatchMode.IN },
        // status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
    });

      useEffect(() => {
        fetch('http://localhost:3001/api/challenges/search', {
          method: 'GET',
          headers: {
            // 'Content-Type': 'application/json',
            // 'Access-Control-Allow-Origin': '*'
          },
        //   body: JSON.stringify(inputs)
  
        })
        .then(response => response.json())
        .then(dataBack => {
            setPlayerList(dataBack)
        //   localStorage.setItem('user', JSON.stringify(dataBack));
        //   navigate('/');
        console.log(dataBack)
        console.log(JSON.stringify(dataBack))
        })
        .catch(error => {
          console.error(error);
        //   toast.current.show({severity:'error', summary: 'Error', detail:'Bad credentials', life: 3000});
        });
    }, []);




      const [selectedPlayer, setSelectedPlayer] = useState(null);
      const toast = useRef(null);

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
                <InputText type="search" value={value || ''} onChange={(e) => onGlobalFilterChange(e)} placeholder="Search a challenger" />
            </span>
        );
    };

    const header = renderHeader();

  return (
    <div>
      <p>Recherche un joueur pour lui lancer un duel :</p>

      <div className="card">
            {/* <Toast ref={toast} />
            <DataTable value={playerList} selectionMode="single" selection={selectedPlayer} onSelectionChange={(e) => setSelectedPlayer(e.value)} dataKey="id"
                    onRowSelect={test} onRowUnselect={testdisabled} metaKeySelection={false} tableStyle={{ minWidth: '50rem' }}>
                <Column field="username" header="Username"></Column>
            </DataTable> */}

            <DataTable value={playerList} paginator rows={5} header={header} filters={filters} onFilter={(e) => setFilters(e.filters)}
                    selection={selectedPlayer} onSelectionChange={(e) => setSelectedPlayer(e.value)} selectionMode="single" dataKey="id"
                    stateStorage="session" stateKey="dt-state-demo-local" emptyMessage="No player found." tableStyle={{ minWidth: '50rem' }}>
                <Column field="username" header="Username" sortable style={{ width: '25%' }}></Column>
                {/* <Column header="Country" body={countryBodyTemplate} sortable sortField="country.name" filter filterField="country.name" filterPlaceholder="Search" style={{ width: '25%' }}></Column> */}
                {/* <Column header="Agent" body={representativeBodyTemplate} sortable sortField="representative.name" filter filterField="representative"
                    showFilterMatchModes={false} filterElement={representativeFilterTemplate} filterMenuStyle={{ width: '14rem' }} style={{ width: '25%' }} ></Column> */}
            </DataTable>
        </div>
      
    </div>
  );
}
export default Challenges;