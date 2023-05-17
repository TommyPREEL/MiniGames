/* import dependencies */
import React from 'react';
import { Routes, Route } from 'react-router-dom';

/* import components*/
import Header from '../components/Header';

/* import pages */
import Home from '../pages/Home';
import Settings from '../pages/Settings';
import ErrorPage from '../pages/ErrorPage';
import Notifications from '../pages/Notifications';

/* import routes */
import RouteAdmin from './RouteAdmin';
import RouteChallenges from './RouteChallenges';
import RouteTournaments from './RouteTournaments';

function RoutesIndex() {
  return (
    <>
    <Header />
    <Routes>
      <Route path="/home" element={<Home/>} />
      <Route path="/challenges/*" element={<RouteChallenges/>} />
      <Route path="/tournaments/*" element={<RouteTournaments/>} />
      <Route path="/notifications" element={<Notifications/>} />
      <Route path="/admin/*" element={<RouteAdmin/>} />
      <Route path="/settings" element={<Settings/>} />
      <Route path="*" element={<ErrorPage/>} />
    </Routes>
    </>
  );
}

export default RoutesIndex;