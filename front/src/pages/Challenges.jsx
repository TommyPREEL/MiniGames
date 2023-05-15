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
        fetch('http://localhost:5000/api/challenges/search', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(response => response.json())
        .then(dataBack => {
            const dataBackArray = Object.entries(dataBack);
            let filteredPlayerList = [];
            dataBackArray.forEach((user) => {
              console.log(user[1].username)
              console.log(JSON.parse(localStorage.getItem("user")).username)
              if(user[1].username !== JSON.parse(localStorage.getItem("user")).username){
                filteredPlayerList.push(user[1])
              }
              console.log(user[1])
            })
            console.log(filteredPlayerList)
            setPlayerList(filteredPlayerList)
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

    const onRowSelect = (event) => {
      setSelectedUser(event.data)
      setSelectedChallenge(null)
      setDialog(true)
  };
  // Cancel button
  function handleClickNo(){
      setDialog(false);
      setSelectedChallenge(null)
      setSelectedUser(null)
  }

  // Save button
  const handleClickYes = () =>{
      if(!selectedChallenge){
          toast.current.show({severity:'error', summary: 'Error', detail:'Select a challenge', life: 3000});
      }else{
          let inputs = {
            challenger: "",
            challenged: "",
            challenge: selectedChallenge
          }
          fetch(`http://localhost:5000/api/challenges/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(inputs)
          })
          .then(response => response.json())
          .then(dataBack => {
              setDialog(false);
              if(dataBack.message === 'Order updated') {
                  setDialog(false)
                  setUpdate(!update)
                  setSelectedOrder(emptyOrder)
              }
          })
          .catch(error => {
            console.error(error);
          });
      }
  }

  // Footer dialog
  const dialogFooter = (
      <React.Fragment>
          <Button label="Cancel" icon="pi pi-times" outlined onClick={handleClickNo} className="p-button-text"/>
          <Button label="Save" icon="pi pi-check" onClick={handleClickYes} autoFocus/>
      </React.Fragment>
  );

return (
  <div>
      <Toast ref={toast} />
      <Dialog header="Update the order status" visible={dialog} style={{ width: '50vw' }} onHide={handleClickNo} footer={dialogFooter}>
              <div>
                  <div className="flex-auto">
                      <label htmlFor="username" className="font-bold block mb-2">Username</label>
                      <InputText id="username" defaultValue={selectedOrder.username} disabled/>
                  </div>
                  <div className="flex-auto">
                      <label htmlFor="orders_date" className="font-bold block mb-2">Orders Date</label>
                      <InputText id="orders_date" defaultValue={selectedOrder.orders_date} disabled/>
                  </div>
                  <div className="flex-auto">
                      <label htmlFor="price" className="font-bold block mb-2">Total Price</label>
                      <InputNumber inputId="price" value={selectedOrder.total_price} mode="currency" currency="USD" locale="en-US" disabled/>
                  </div>
                  <div className="flex-auto">
                  <label htmlFor="status" className="font-bold block mb-2">Status</label>
                      <Dropdown value={tempStatus} onChange={(e) => setTempStatus(e.value)} options={statuses}
                      placeholder="Select a Status" className="w-full md:w-14rem" />
                  </div>
              </div>
          </Dialog>


  return (
    <div>
      <p>Search and select a player to start a challenge :</p>

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