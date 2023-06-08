// import logo from './logo.svg';
import './App.css';
import RoutesIndex from './routes/index';
import { lightTheme, ProjectContext } from './context/ProjectContext';
import React, { useState, useEffect, Redirect } from 'react';
import RoutesConnect from './routes/RoutesConnect';
import { useNavigate, Routes, Route } from 'react-router-dom';

function App() {

  const [theme, setTheme] = useState(lightTheme);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setUser(localStorage.getItem('user'));
    setIsLoggedIn(user ? true : false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  const handleLogin = (userConnected) => {
    localStorage.setItem('user', userConnected);
    setUser(user);
    // setIsLoggedIn(true);
  };

//   const onLogout = () => {
//   fetch(`http://192.168.1.11:5000/api/users/logout`, {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   });
//   localStorage.removeItem('user');
//   navigate('/');
// }

//   const onLogin = () => {
//     navigate('/home');
//   }

// const router = () => {
//   if(isLoggedIn) {
//     return <RoutesIndex />
//   } else {
//     return <RoutesConnect />
//   }
// }

  return (
    <div className="App" style={theme}>
      <ProjectContext.Provider value={{user, setUser, theme, setTheme, handleLogout, handleLogin}}>
        {/* <Routes>
          <Route exact path="/" element={<RoutesIndex/>} />
          <Route path="*" element={<RoutesConnect/>} />
          <Route path="/login" element={<RoutesConnect />}>
            {isLoggedIn ? <Redirect to="/" /> : <RoutesConnect />}
            {isLoggedIn ? <Redirect to="/" /> : <RoutesConnect />}
          </Route>
          <Route path="*" element={<RoutesIndex />}>
            {isLoggedIn ? (<RoutesIndex onLogout={handleLogout} />) : (<Redirect to="/login" />)}
          </Route>

<Route exact path="/login">
          {isLoggedIn ? <Redirect to="/" /> : <RoutesConnect />}
        </Route>
        <Route path="*">
          {isLoggedIn ? (
            <RoutesIndex onLogout={handleLogout} />
          ) : (
            <Redirect to="/login" />
          )}
        </Route>
        </Routes> */}
        {localStorage.getItem('user') ? <RoutesIndex /> : <RoutesConnect />}
      </ProjectContext.Provider>
    </div>
  );
}

export default App;
