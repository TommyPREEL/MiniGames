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

function AdminDashboardOrders() {

    const [dialog, setDialog] = useState(false);
    const [update, setUpdate] = useState(false)
    const toast = useRef(null);
    const [tempStatus, setTempStatus] = useState()

    const emptyOrder = {
        id: 0,
        id_users: 0,
        orders_date: 't',
        status: 't',
        total_price: 0,
        username: 't'
    }

    const [backendData, setBackendData] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(emptyOrder);

    useEffect(() => {
        fetch("/orders").then((response) => response.json()).then(data => {
            setBackendData(data.orders);
          }
        )
      }, [update]);

    const [statuses] = useState(['CANCELLED', 'DELIVERED', 'PAID', 'VALIDATED']);

    const getStatus = (status) => {
        switch (status) {
            case 'CANCELLED':
                return 'danger';

            case 'DELIVERED':
                return 'success';

            case 'PAID':
                return 'info';

            case 'VALIDATED':
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
            <Dropdown value={options.value} options={statuses} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={statusItemTemplate} placeholder="Select One" className="p-column-filter" showClear style={{ minWidth: '12rem' }} />
        );
    };

    const onRowSelect = (event) => {
        setSelectedOrder(event.data)
        setTempStatus(event.data.status)
        setDialog(true)
    };
    // Cancel button
    function handleClickNo(){
        setDialog(false);
        setSelectedOrder(emptyOrder)
    }

    // Save button
    const handleClickYes = () =>{
        if(!tempStatus){
            toast.current.show({severity:'error', summary: 'Error', detail:'Select a status', life: 3000});
        }else{
            let inputs = {
                status: tempStatus
            }
            fetch(`orders/update/${selectedOrder.id}`, {
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
        <DataTable value={backendData} selectionMode="single" selection={selectedOrder} onSelectionChange={(e) => setSelectedOrder(e.value)} dataKey="id"
        onRowSelect={onRowSelect} metaKeySelection={false} paginator rows={10} filterDisplay="row" emptyMessage="No order found.">
            <Column field="orders_date" header="Order date" filter showFilterMenu={false} filterPlaceholder='2023-1-1' style={{ minWidth: '12rem' }} />
            <Column field="username" header="Username" filter showFilterMenu={false} filterPlaceholder='John Doe' style={{ minWidth: '12rem' }} />
            <Column field="total_price" body={bodyPrice} header="Total price" filter showFilterMenu={false} filterPlaceholder='100.00' style={{ minWidth: '12rem' }} />
            <Column field="status" header="Status" showFilterMenu={false} filterMenuStyle={{ width: '14rem' }} style={{ minWidth: '12rem' }} body={statusBodyTemplate} filter filterElement={statusRowFilterTemplate} />
        </DataTable>
    </div>
  );
}
export default AdminDashboardOrders;