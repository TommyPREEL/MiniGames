import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Badge } from 'primereact/badge';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  darkTheme,
  lightTheme,
  ProjectContext,
} from '../context/ProjectContext';

let pages = ['Challenges', 'Tournaments', 'AmongLegends'];
let settings = ['Notifications', 'Settings', 'Logout'];

function Header() {
  const { theme, setTheme, user, setUser, handleLogout } =
    React.useContext(ProjectContext);

  const toggleTheme = () => {
    setTheme(theme === lightTheme ? darkTheme : lightTheme);
    console.log(theme);
  };
  const navigate = useNavigate();
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  // window.location.reload();
  React.useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user')));
  }, []);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  function handleClickPage(page) {
    switch (page) {
      case 'Home':
        navigate('/');
        break;
      case 'Challenges':
        navigate('/challenges');
        break;
      case 'Tournaments':
        navigate('/tournaments');
        break;
      case 'Notifications':
        navigate('/notifications');
        break;
      case 'AmongLegends':
        navigate('/amongLegends');
        break;
      default:
        navigate('/errorPage');
    }
  }

  function handleActionSelectedOnUser(setting) {
    switch (setting) {
      // case 'Log in':
      //   navigate('/users/connect');
      //   break;
      // case 'Sign up':
      //   navigate('/users/register');
      //   break;
      case 'Settings':
        navigate('/settings');
        break;
      case 'Logout':
        handleLogout();
        navigate('/');
        break;
      default:
        navigate('/errorPage');
    }
  }

  function handleClickAdmin() {
    navigate('/admin');
  }

  let welcome;
  let admin;
  if (user) {
    if (user.is_admin === 1) {
      admin = (
        <div
          onClick={handleClickAdmin}
          style={{
            marginRight: 10,
            cursor: 'pointer',
            backgroundColor: 'white',
            color: '#1976d2',
            padding: 10,
            borderRadius: '20px',
          }}
        >
          Admin Dashboard
        </div>
      );
    }
    welcome = (
      <div style={{ marginRight: 10 }}>
        {/* {JSON.parse(localStorage.getItem('user')).username} */}
        {JSON.parse(localStorage.getItem('user')).username}
      </div>
    );
  }

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          ></Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pages.map((page) => (
                <MenuItem key={page} onClick={() => handleClickPage(page)}>
                  <Typography textAlign="center">{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Typography
            variant="h5"
            noWrap
            component="a"
            href=""
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          ></Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                onClick={() => handleClickPage(page)}
                key={page}
                style={{ fontWeight: 'bold' }}
                // onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page}
              </Button>
            ))}
          </Box>
          {/* <button onClick={toggleTheme}>Toggle Theme</button> */}
          {admin}
          {welcome}
          <Box sx={{ flexGrow: 0 }}>
            <div
              style={{ cursor: 'pointer' }}
              className="header-notifications-block"
              onClick={() => handleClickPage('Notifications')}
            >
              <IconButton sx={{ p: 0 }} style={{ marginLeft: 10 }}>
                <i className="pi pi-bell"></i>
              </IconButton>
              <Badge
                severity="danger"
                value="2"
                style={{ position: 'relative', left: -10, top: -10 }}
              />
            </div>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <AccountCircle />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography
                    textAlign="center"
                    onClick={() => handleActionSelectedOnUser(setting)}
                  >
                    {setting}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default Header;
