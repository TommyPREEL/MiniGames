// import logo from './logo.svg';
import './App.css';
import RoutesIndex from './routes/index';
import { lightTheme, ProjectContext } from './context/ProjectContext';
import React, { useState } from 'react';
import RouteConnect from './routes/RouteConnect';
import { useNavigate } from 'react-router-dom';

function App() {

  const [theme, setTheme] = React.useState(lightTheme);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const onLogout = () => {
  fetch(`http://192.168.1.11:5000/api/users/logout`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  localStorage.removeItem('user');
  navigate('/');
}
  return (
    <div className="App" style={theme}>
      <ProjectContext.Provider value={{user, setUser, theme, setTheme}}>
        {(localStorage.getItem('user')) ? <RoutesIndex onLogout={onLogout}/> : <RouteConnect onLogout={onLogout}/>}
      </ProjectContext.Provider>
    </div>
  );
}

export default App;
