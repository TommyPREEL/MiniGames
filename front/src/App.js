// import logo from './logo.svg';
import './App.css';
import RoutesIndex from './routes/index';
import ProjectContext from './context/ProjectContext';
import Header from './components/Header';
import React, { useState } from 'react';

function App() {

  const [user, setUser] = useState(null);

  return (
    <div className="App">
      <ProjectContext.Provider value={{user, setUser}}>
        <Header />
        <RoutesIndex />
      </ProjectContext.Provider>
    </div>
  );
}

export default App;
