import React from 'react';

const darkTheme = {
  backgroundColor: '#333',
  color: '#fff',
};

const lightTheme = {
  backgroundColor: '#fff',
  color: '#333',
};

const ProjectContext = React.createContext();

export { darkTheme, lightTheme, ProjectContext };