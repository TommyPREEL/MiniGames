import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Tournament from '../pages/Tournament';
import ErrorPage from '../pages/ErrorPage';
      
function RouteTournament() {
  return (
    <>
       <Routes>
        <Route path="/" element={<Tournament/>} />
        <Route path="*" element={<ErrorPage/>} />
       </Routes>
    </>
  );
}

export default RouteTournament;