/* Quand je crée un produit, je n'ai pas d'id, donc je ne peux pas en créer un puis le supprimer ou modifier juste après
* Je dois refresh la page entre temps
* Pas de refresh après l'update de mon product
*/

import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from 'primereact/inputnumber';
import { useNavigate } from 'react-router-dom';
import 'primereact/resources/themes/lara-light-indigo/theme.css';   // theme
import 'primereact/resources/primereact.css';                       // core css
import 'primeicons/primeicons.css';                                 // icons
import 'primeflex/primeflex.css';                                   // css utility
import { Toast } from 'primereact/toast';

export default function AdminDashboardProducts() {

    const toast = React.useRef(null);

    // Empty product object (to be able to display products editions)
    const emptyProduct = {
        id: null,
        name: null,
        price: null,
        description: null,
        quantity: null,
        img: null
    }

    // Navigate
    let navigate = useNavigate();

    // Products list
    const [products, setProducts] = useState([{}]);

    // Product
    const [product, setProduct] = useState(emptyProduct)

    // Update products list
    const [update, setUpdate] = useState(false)

    // Edit and delete buttons
    const modificationButtons = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editProduct(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteProduct(rowData)} />
            </React.Fragment>
        );
    };

    // Load all the products from the database in products state
    useEffect(() => {
        fetch("/products").then((response) => response.json()).then(
          data => {
            setProducts(data.products);
          }
        )
      }, [update]);


    /*
    * Create a Product
    */
    const [visible, setVisible] = useState(false);
    const [inputTextProductName, setInputTextProductName] = useState('');
    const [inputTextProductDescription, setInputTextProductDescription] = useState('');
    const [inputNumberProductPrice, setInputNumberProductPrice] = useState(0);
    const [inputNumberProductQuantity, setInputNumberProductQuantity] = useState(1);

    // Cancel button
    function handleClickNoAdd(){
        setVisible(false);
        setInputTextProductName('');
        setInputTextProductDescription('');
        setInputNumberProductPrice(0);
        setInputNumberProductQuantity(1);
    }

    // Save button
    function handleClickYesAdd(){
        if(inputTextProductName === '' || inputTextProductDescription === '' || inputNumberProductPrice === 0 || inputNumberProductPrice === null || inputNumberProductQuantity === null){
            toast.current.show({severity:'error', summary: 'Error', detail:'Please fill all fields', life: 3000});
        }else{
            let inputs = {
                name: inputTextProductName,
                description: inputTextProductDescription,
                price: inputNumberProductPrice,
                quantity : inputNumberProductQuantity
            }
            console.log(inputs)
            fetch('/products/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inputs)
        
            })
            .then(response =>

                response.json()
            )
            .then(dataBack => {
                setVisible(false);
                console.log(dataBack.message)
                if(dataBack.message === 'Product created'){
                    setUpdate(!update)
                }
            })
            .catch(error => {
            console.error(error);
            });
        }
    }

    // Footer create product dialog
    const footerContent = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={handleClickNoAdd} className="p-button-text"/>
            <Button label="Save" icon="pi pi-check" onClick={handleClickYesAdd} autoFocus/>
        </React.Fragment>
    );

    /*
    * Edit a product
    */
    const [editProductDialog, setEditProductDialog] = useState(false);
    const [editInputTextProductName, setEditInputTextProductName] = useState('');
    const [editInputTextProductDescription, setEditInputTextProductDescription] = useState('');
    const [editInputNumberProductPrice, setEditInputNumberProductPrice] = useState(0);
    const [editInputNumberProductQuantity, setEditInputNumberProductQuantity] = useState(1);

    // Cancel button
    function handleClickNoUpdate(){
        setEditProductDialog(false);
    }

    // Save button
    const handleClickYesUpdate = () =>{
        if(editInputTextProductName === '' || editInputTextProductDescription === '' || editInputNumberProductPrice === 0 || editInputNumberProductPrice === null || editInputNumberProductQuantity === null){
            toast.current.show({severity:'error', summary: 'Error', detail:'Please fill all fields', life: 3000});
        }else{
            let inputs = {
                name: editInputTextProductName,
                description: editInputTextProductDescription,
                price: editInputNumberProductPrice,
                quantity : editInputNumberProductQuantity
              }
            console.log(inputs)
            fetch(`/products/update/${product.id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(inputs)
        
            })
            .then(response => response.json())
            .then(dataBack => {
                setEditProductDialog(false);
                if(dataBack.message === 'Product updated') {
                    setUpdate(!update)
                }
            })
            .catch(error => {
              console.error(error);
            });
        }
        
    }

    // Open the edition dialog
    const editProduct = (product) => {
        setProduct({ ...product });
        setEditInputTextProductName(product.name);
        setEditInputTextProductDescription(product.description);
        setEditInputNumberProductPrice(product.price);
        setEditInputNumberProductQuantity(product.quantity);
        setEditProductDialog(true);
    };

    // Change the quantity value
    function handleChangeInputNumberQuantity(event){
        setEditInputNumberProductQuantity(event.target.value);
    }

    // Change the price value
    function handleChangeInputNumberPrice(event){
        setEditInputNumberProductPrice(event.target.value);
    }

    // Change the price value
    const editProductDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={handleClickNoUpdate} />
            <Button label="Save" icon="pi pi-check" onClick={handleClickYesUpdate} />
        </React.Fragment>
    );

    /*
    * Delete a product
    */

    // Delete dialog state
    const [deleteProductDialog, setDeleteProductDialog] = useState(false);

    // Delete dialog open
    const confirmDeleteProduct = (product) => {
        setProduct(product);
        setDeleteProductDialog(true);
    };

    // Delete dialog close
    const hideDeleteProductDialog = () => {
        setDeleteProductDialog(false);
    };

    // Delete the product
    const deleteProduct = () => {
        let _products = products.filter((val) => val.id !== product.id);
        fetch(`/products/delete/${product.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            } 
          })
          .then(response => response.json())
          .then(dataBack => {
              console.log(dataBack)
              if(dataBack.message === 'Product deleted'){
                setUpdate(!update)
              }
          })
          .catch(error => {
            console.error(error);
          });
        setProducts(_products);
        setDeleteProductDialog(false);
        setProduct(emptyProduct);
    };

    // Delete product dialog footer
    const deleteProductDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteProductDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteProduct} />
        </React.Fragment>
    );

    const bodyPrice = (rowData) => {
        const price = rowData.price;

        return (
            <div className="flex align-items-center gap-2">
                <span>${price}</span>
            </div>
        );
    };

    return (
        <div>
            <Toast ref={toast} />
            <Button onClick={() => setVisible(true)} label="New" icon="pi pi-plus" className="mr-2" />
            <Dialog header="Create a product" visible={visible} style={{ width: '50vw' }} onHide={() => setVisible(false)} footer={footerContent}>
                <div>
                    <div className="flex-auto">
                        <label htmlFor="name" className="font-bold block mb-2">Name</label>
                        <InputText id="name" value={inputTextProductName} onChange={(e) => setInputTextProductName(e.target.value)} />
                    </div>
                    <div className="flex-auto">
                        <label htmlFor="description" className="font-bold block mb-2">Description</label>
                        <InputTextarea id="description" value={inputTextProductDescription} onChange={(e) => setInputTextProductDescription(e.target.value)} rows={5} cols={30} />
                    </div>
                    <div className="flex-auto">
                        <label htmlFor="price" className="font-bold block mb-2">Unit Price</label>
                        <InputNumber inputId="price" value={inputNumberProductPrice} onValueChange={(e) => setInputNumberProductPrice(e.value)} mode="currency" currency="USD" locale="en-US" />
                    </div>
                    <div className="flex-auto">
                        <label htmlFor="quantity" className="font-bold block mb-2">Quantity</label>
                        <InputNumber inputId="quantity" value={inputNumberProductQuantity} onValueChange={(e) => setInputNumberProductQuantity(e.value)} />
                    </div>
                </div>
            </Dialog>
            <Dialog header="Update a product" visible={editProductDialog} style={{ width: '50vw' }} onHide={() => setEditProductDialog(false)} footer={editProductDialogFooter}>
                <div>
                    <div className="flex-auto">
                        <label htmlFor="name" className="font-bold block mb-2">Name</label>
                        <InputText id="name" defaultValue={product.name} onChange={(e) => setEditInputTextProductName(e.target.value)} />
                    </div>
                    <div className="flex-auto">
                        <label htmlFor="description" className="font-bold block mb-2">Description</label>
                        <InputTextarea id="description" defaultValue={product.description} onChange={(e) => setEditInputTextProductDescription(e.target.value)} rows={5} cols={30} />
                    </div>
                    <div className="flex-auto">
                        <label htmlFor="price" className="font-bold block mb-2">Unit Price</label>
                        <InputNumber inputId="price" value={product.price} onValueChange={(event) => handleChangeInputNumberPrice(event)} mode="currency" currency="USD" locale="en-US" />
                    </div>
                    <div className="flex-auto">
                        <label htmlFor="quantity" className="font-bold block mb-2">Quantity</label>
                        <InputNumber inputId="quantity" value={product.quantity} onValueChange={(event) => handleChangeInputNumberQuantity(event)} />
                    </div>
                </div>
            </Dialog>
            <Dialog visible={deleteProductDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={deleteProductDialogFooter} onHide={hideDeleteProductDialog}>
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {product && (
                        <span>
                            Are you sure you want to delete <b>{product.name}</b>?
                        </span>
                    )}
                </div>
            </Dialog>
            <DataTable value={products} paginator rows={5} rowsPerPageOptions={[5, 10, 25, 50]} tableStyle={{ minWidth: '50rem' }}>
                <Column field="name" header="Name" style={{ width: '20%' }}></Column>
                <Column body={bodyPrice} header="Unit Price" style={{ width: '20%' }}></Column>
                <Column field="description" header="Description" style={{ width: '20%' }}></Column>
                <Column field="quantity" header="Quantity" style={{ width: '20%' }}></Column>
                <Column body={modificationButtons} header="Modification" style={{ width: '20%' }}></Column>
            </DataTable>
        </div>
    );
}