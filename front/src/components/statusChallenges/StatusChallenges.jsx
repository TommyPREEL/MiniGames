import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';

function StatusChallenges() {
  const [dialog, setDialog] = useState(false);
  const [update, setUpdate] = useState(false);
  const toast = useRef(null);
  const [tempStatus, setTempStatus] = useState();

  const emptyOrder = {
    id: 0,
    id_users: 0,
    orders_date: 't',
    status: 't',
    total_price: 0,
    username: 't',
  };

  const [selectedOrder, setSelectedOrder] = useState(emptyOrder);
  const [challengesList, setChallengesList] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  useEffect(() => {
    let inputs = {
      id_user: JSON.parse(localStorage.getItem('user')).id_users,
    };
    fetch(`http://localhost:5000/api/challenges/list`, {
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
  }, [update]);

  //   useEffect(() => {
  //     fetch('/orders')
  //       .then((response) => response.json())
  //       .then((data) => {
  //         setBackendData(data.orders);
  //       });
  //   }, [update]);

  const [statuses] = useState(['FINISHED', 'WAITING']);

  const getStatus = (status) => {
    switch (status) {
      case 'FINISHED':
        return 'success';

      case 'WAITING':
        return 'warning';

      default:
        return null;
    }
  };

  const bodyPrice = (rowData) => {
    const price = rowData.total_price;

    return (
      <div className="flex align-items-center gap-2">
        <span>${price}</span>
      </div>
    );
  };

  const statusBodyTemplate = (rowData) => {
    return <Tag value={rowData.status} severity={getStatus(rowData.status)} />;
  };

  const statusItemTemplate = (option) => {
    return <Tag value={option} severity={getStatus(option)} />;
  };

  const statusRowFilterTemplate = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={statuses}
        onChange={(e) => options.filterApplyCallback(e.value)}
        itemTemplate={statusItemTemplate}
        placeholder="Select One"
        className="p-column-filter"
        showClear
        style={{ minWidth: '12rem' }}
      />
    );
  };
  const handleClickCloseDialog = () => {
    setDialog(false);
    setSelectedChallenge(null);
  };
  const [dialogContent, setDialogContent] = useState(null);
  const [dialogFooter, setDialogFooter] = useState(null);

  const onRowSelect = (event) => {
    setSelectedChallenge(event.data);
    localStorage.setItem('selectedChallenge', JSON.stringify(event.data));
    console.log(selectedChallenge);
    switch (event.data.status) {
      case 'WAITING':
        console.log(event.data.challenger);
        if (
          event.data.challenger ===
          JSON.parse(localStorage.getItem('user')).username
        ) {
          setDialogContent(() => (
            <div>
              <div className="flex-auto">
                <p className="font-bold block mb-2">Waiting for response...</p>
              </div>
            </div>
          ));
          // Footer dialog
          setDialogFooter(() => (
            <React.Fragment>
              <Button
                label="Ok, I'll wait..."
                icon="pi pi-check"
                autoFocus
                severity="success"
                onClick={handleClickCloseDialog}
              />
            </React.Fragment>
          ));
        } else {
          setDialogContent(() => (
            <div>
              <div className="flex-auto">
                <label htmlFor="challenger" className="font-bold block mb-2">
                  Challenger
                </label>
                <InputText
                  id="challenger"
                  defaultValue={event.data.challenger}
                  disabled
                />
              </div>
              <div className="flex-auto">
                <label htmlFor="mini_game" className="font-bold block mb-2">
                  Mini Game
                </label>
                <InputText
                  id="mini_game"
                  defaultValue={event.data.mini_game}
                  disabled
                />
              </div>
              <div className="flex-auto">
                <label htmlFor="winner" className="font-bold block mb-2">
                  Winner
                </label>
                <InputText
                  id="winner"
                  defaultValue={event.data.winner}
                  disabled
                />
              </div>
              <p className="font-bold block mb-2">
                Could you confirm that this information is correct ?
              </p>
            </div>
          ));
          // Footer dialog
          setDialogFooter(() => (
            <React.Fragment>
              <Button
                label="No, liar !"
                icon="pi pi-times"
                onClick={handleClickNoWaiting}
                severity="danger"
              />
              <Button
                label="Yes, sure !"
                icon="pi pi-check"
                onClick={handleClickYesWaiting}
                autoFocus
                severity="success"
              />
            </React.Fragment>
          ));
        }
        break;
      case 'FINISHED':
        setDialogContent(() => (
          <div>
            <div className="flex-auto">
              <p className="font-bold block mb-2">
                Winner : {event.data.winner}
              </p>
            </div>
          </div>
        ));
        // Footer dialog
        setDialogFooter(() => (
          <React.Fragment>
            <Button
              label="Okey !"
              icon="pi pi-check"
              autoFocus
              severity="success"
              onClick={handleClickCloseDialog}
            />
          </React.Fragment>
        ));
        break;
      default:
        dialogContent = <div>Easter problegg</div>;
        break;
    }
    console.log(JSON.parse(localStorage.getItem('selectedChallenge')));
    // setSelectedOrder(event.data);

    // setTempStatus(event.data.status);
    setDialog(true);
  };

  // Cancel button for waiting challenge
  function handleClickNoWaiting() {
    let inputs = {
      challenge: JSON.parse(localStorage.getItem('selectedChallenge')), //selectedChallenge,
    };
    fetch(`http://localhost:5000/api/challenges/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputs),
    })
      .then((response) => response.json())
      .then((dataBack) => {
        setDialog(false);
        localStorage.removeItem('selectedChallenge');
        // if (dataBack.message) {
        setDialog(false);
        setUpdate(!update);
        setSelectedChallenge(null);
        // }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // Cancel button
  function handleClickNo() {
    setDialog(false);
    setSelectedOrder(emptyOrder);
  }

  function handleClickYesWaiting() {
    let inputs = {
      challenge: JSON.parse(localStorage.getItem('selectedChallenge')), //selectedChallenge,
    };
    fetch(`http://localhost:5000/api/challenges/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputs),
    })
      .then((response) => response.json())
      .then((dataBack) => {
        setDialog(false);
        localStorage.removeItem('selectedChallenge');
        if (dataBack.message) {
          setDialog(false);
          setUpdate(!update);
          setSelectedChallenge(null);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // Save button
  const handleClickYes = () => {
    if (!tempStatus) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Select a status',
        life: 3000,
      });
    } else {
      let inputs = {
        status: tempStatus,
      };
      fetch(`orders/update/${selectedOrder.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs),
      })
        .then((response) => response.json())
        .then((dataBack) => {
          setDialog(false);
          if (dataBack.message === 'Order updated') {
            setDialog(false);
            setUpdate(!update);
            setSelectedOrder(emptyOrder);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <Dialog
        header="Challenge time !"
        visible={dialog}
        style={{ width: '50vw' }}
        onHide={handleClickNo}
        footer={dialogFooter}
      >
        {dialogContent}
      </Dialog>
      <DataTable
        value={challengesList}
        selectionMode="single"
        selection={selectedOrder}
        onSelectionChange={(e) => setSelectedOrder(e.value)}
        dataKey="id"
        onRowSelect={onRowSelect}
        metaKeySelection={false}
        paginator
        rows={10}
        filterDisplay="row"
        emptyMessage="No challenge found."
      >
        <Column
          field="challenger"
          header="Challenger"
          filter
          showFilterMenu={false}
          filterPlaceholder="Tommy PREEL"
          style={{ minWidth: '12rem' }}
        />
        <Column
          field="challenged"
          header="Challenged"
          filter
          showFilterMenu={false}
          filterPlaceholder="Tommy PREEL"
          style={{ minWidth: '12rem' }}
        />
        <Column
          field="mini_game"
          header="Mini Game"
          filter
          showFilterMenu={false}
          filterPlaceholder="Shifumi"
          style={{ minWidth: '12rem' }}
        />
        <Column
          field="winner"
          header="Winner"
          filter
          showFilterMenu={false}
          filterPlaceholder="Tommy PREEL"
          style={{ minWidth: '12rem' }}
        />
        <Column
          field="status"
          header="Status"
          showFilterMenu={false}
          filterMenuStyle={{ width: '14rem' }}
          style={{ minWidth: '12rem' }}
          body={statusBodyTemplate}
          filter
          filterElement={statusRowFilterTemplate}
        />
        <Column
          field="date"
          header="Date"
          filter
          showFilterMenu={false}
          filterPlaceholder="09/07/2023"
          style={{ minWidth: '12rem' }}
        />
      </DataTable>
    </div>
  );
}
export default StatusChallenges;
