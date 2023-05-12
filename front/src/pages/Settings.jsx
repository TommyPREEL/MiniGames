import React, { useEffect, useState }from 'react';
import { useNavigate, Navigate } from'react-router-dom';

import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

import '../styles/Settings.css';

function Settings() {

    const navigate = useNavigate();

    const [backendData, setBackendData] = useState({});
    const [newData, setNewData] = useState({});
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [editDialog, setEditDialog] = useState(false);

    useEffect(() =>{
      if(!localStorage.getItem('user')){
        navigate('/access_denied');
      }else{
        fetch(`/users/details/${JSON.parse(localStorage.getItem('user')).id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(dataBack => {
          setBackendData(dataBack);
          setNewData(dataBack);
        })
        .catch(error => {
          console.error(error);
        });
      }
    }, [])

    function handleClickConfirm(){
        fetch(`/users/update/${backendData.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
          })
          .then(response => response.json())
          .then(dataBack => {
            localStorage.setItem('user', JSON.stringify(newData));
            navigate('/settings', { state : { message : `Updated profile !`} } );
            setEditDialog(false);
          })
          .catch(error => {
            console.error(error);
          });
    }

    // Delete account
    const deleteAccount = () => {
      fetch(`/users/delete/${JSON.parse(localStorage.getItem('user')).id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          } 
        })
        .then(response => response.json())
        .then(dataBack => {
            console.log(dataBack)
            if(dataBack.message === 'User deleted'){
              localStorage.removeItem('user');
              setDeleteDialog(false);
              navigate('/')
            }
        })
        .catch(error => {
          console.error(error);
        });
  };

    function handleOnChange(e){
        setNewData({
            ...newData,
            [e.target.name]:e.target.value
        })
        console.log(newData);
    }

  const handleClickDelete = () => {
    setDeleteDialog(true);
  };

  const handleClickEdit = () => {
    setEditDialog(true);
  };

  // Delete dialog close
  const hideDeleteDialog = () => {
    setDeleteDialog(false);
  };

  // Edit dialog close
  const hideEditDialog = () => {
    setEditDialog(false);
  };
  
  // Delete dialog footer
  const deleteDialogFooter = (
    <React.Fragment>
        <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteDialog} />
        <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteAccount} />
    </React.Fragment>
  );

  // Edit dialog footer
  const editDialogFooter = (
    <React.Fragment>
        <Button label="No" icon="pi pi-times" outlined onClick={hideEditDialog} />
        <Button label="Yes" icon="pi pi-check" severity="info" onClick={handleClickConfirm} />
    </React.Fragment>
  );

  return (
    <div class="formulaire">
      <Dialog visible={deleteDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={deleteDialogFooter} onHide={hideDeleteDialog}>
          <div className="confirmation-content">
            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>
                    Are you sure you want to delete your account ?
                </span>
          </div>
        </Dialog>
        <Dialog visible={editDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={editDialogFooter} onHide={hideEditDialog}>
          <div className="confirmation-content">
            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>
                    Do you want save the modification on your account ?
                </span>
          </div>
        </Dialog>
      <label htmlFor="firstName">First Name</label>
            <InputText
            type="text" name="firstname" defaultValue={backendData.firstname} onChange={(event) => handleOnChange(event)}
            />
      <label htmlFor="lastname">Last name</label>
            <InputText
            type="text" name="lastname" defaultValue={backendData.lastname} onChange={(event) => handleOnChange(event)}
            />
      <label htmlFor="address">Address</label>
            <InputText
              type="text" name="address" defaultValue={backendData.address} onChange={(event) => handleOnChange(event)}
            />
      <label htmlFor="password">Password</label>
            <InputText
            type="text" name="password" defaultValue={backendData.password} onChange={(event) => handleOnChange(event)}
            />
      <Button icon="pi pi-pencil" rounded outlined className="mr-2 m-2" onClick={() => handleClickEdit()}>Change profile</Button>
      <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => handleClickDelete()}> Delete account</Button>
      
    </div>
  );
}
export default Settings;