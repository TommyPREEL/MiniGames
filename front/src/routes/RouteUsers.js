import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Register from '../components/Register';
import Login from '../components/Login';
import ErrorPage from '../pages/ErrorPage';
      
function RouteUsers() {
  return (
    <>
       <Routes>
        <Route path="/register" element={<Register/>} />
        <Route path="/connect" element={<Login/>} />
        <Route path="*" element={<ErrorPage/>} />
       </Routes>
    </>
  );
}

export default RouteUsers;