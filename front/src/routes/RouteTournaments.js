import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Tournaments from '../pages/Tournaments';
import ErrorPage from '../pages/ErrorPage';
      
function RouteTournaments() {
  return (
    <>
       <Routes>
        <Route path="/" element={<Tournaments/>} />
        <Route path="*" element={<ErrorPage/>} />
       </Routes>
    </>
  );
}

export default RouteTournaments;