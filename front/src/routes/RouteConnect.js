import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Register from '../components/Register';
import Login from '../components/Login';
import ErrorPage from '../pages/ErrorPage';
      
function RouteConnect() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default RouteConnect;