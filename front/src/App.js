// import logo from './logo.svg';
import './App.css';
import RoutesIndex from './routes/index';
import { lightTheme, ProjectContext } from './context/ProjectContext';
import React, { useState } from 'react';
import RouteConnect from './routes/RouteConnect';

function App() {

  const [theme, setTheme] = React.useState(lightTheme);
  const [user, setUser] = useState(null);

  return (
    <div className="App" style={theme}>
      <ProjectContext.Provider value={{user, setUser, theme, setTheme}}>
        {(localStorage.getItem('user')) ? <RoutesIndex /> : <RouteConnect />}
      </ProjectContext.Provider>
    </div>
  );
}

export default App;
