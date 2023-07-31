import React from 'react';
import { Routes, Route } from 'react-router-dom';

import AmongLegends from '../pages/amongLegends/AmongLegends';
import ErrorPage from '../pages/ErrorPage';
      
function RouteAmongLegends() {
  return (
    <>
       <Routes>
        <Route path="/" element={<AmongLegends/>} />
        <Route path="*" element={<ErrorPage/>} />
       </Routes>
    </>
  );
}

export default RouteAmongLegends;