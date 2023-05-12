import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Challenges from '../pages/Challenges';
import ErrorPage from '../pages/ErrorPage';
      
function RouteChallenges() {
  return (
    <>
       <Routes>
        <Route path="/" element={<Challenges/>} />
        <Route path="*" element={<ErrorPage/>} />
       </Routes>
    </>
  );
}

export default RouteChallenges;