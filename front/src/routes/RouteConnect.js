import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Register from '../components/Register';
import Login from '../components/Login';
import ErrorPage from '../pages/ErrorPage';
      
function RouteConnect(onLogin) {
  return (
    <Routes>
      <Route path="/connect" element={<Login onLogin={onLogin}/>} />
      <Route path="/register" element={<Register onLogin={onLogin}/>} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default RouteConnect;