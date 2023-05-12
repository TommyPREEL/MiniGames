/* import dependencies */
import React from 'react';
import { Routes, Route } from 'react-router-dom';

/* import components */
import ErrorPage from '../components/ErrorPage';

/* import pages */
import Home from '../pages/Home';
import Settings from '../pages/Settings';

/* import routes */
import RouteUsers from './RouteUsers';
import RouteAdmin from './RouteAdmin';

function RoutesIndex() {
  return (
    <Routes>
      <Route exact path="/" element={<Home/>} />
      <Route path="/users/*" element={<RouteUsers/>} />
      <Route path="/admin/*" element={<RouteAdmin/>} />
      <Route path="/settings" element={<Settings/>} />
      <Route path="*" element={<ErrorPage/>} />
    </Routes>
  );
}

export default RoutesIndex;