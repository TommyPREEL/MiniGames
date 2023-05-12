import React, { useState, useEffect } from 'react';
import AdminDashboardOrders from '../components/AdminDashboardOrders';
import AdminDashboardProducts from '../components/AdminDashboardProducts';
import { TabMenu } from 'primereact/tabmenu';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {

    const items = [
        {label: 'Orders', icon: 'pi pi-fw pi-shopping-cart'},
        {label : 'Products', icon: 'pi pi-fw pi-tags'}
        // {label: 'Categories', icon: 'pi pi-fw pi-calendar'} // categories
    ];

    const access = () => {
        if(localStorage.getItem('user')){
            if(JSON.parse(localStorage.getItem('user')).is_admin === 0) {
                return <Navigate to='/access_denied'></Navigate>
            }
        }else{
            return <Navigate to='/access_denied'></Navigate>
        }       
    }

    const [tabIndex, setTabIndex] = useState(0)

    function handleTabChange(index){
        setTabIndex(index)
    }

    return (
        <div>
            {access()}
            <div className="card">
                <TabMenu activeIndex={tabIndex} style={{margin:10}} model={items} onTabChange={(e) => handleTabChange(e.index)}/>
            </div>
            {tabIndex === 0 ? <AdminDashboardOrders/> : <AdminDashboardProducts/>}
        </div>
    );
}