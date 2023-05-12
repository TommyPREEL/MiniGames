import React from 'react';
import { Routes, Route } from 'react-router-dom';

import AdminDashboard from '../pages/AdminDashboard';
import ErrorPage from '../pages/ErrorPage';
      
function RouteAdmin() {
  return (
    <>
       <Routes>
        <Route path="/" element={<AdminDashboard/>} />
        <Route path="*" element={<ErrorPage/>} />
       </Routes>
    </>
  );
}

export default RouteAdmin;