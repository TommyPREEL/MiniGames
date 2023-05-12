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


import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

let pages = ['Products'/*, 'Categories'*/];
let settings = ['Log in', 'Sign up'];


function Header() {
  // const {user, setUser} = React.useContext(ProjectContext);
  const navigate = useNavigate();
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  React.useEffect(() => {
    if (localStorage.getItem("user") === null) {
      settings = ['Log in', 'Sign up'];
    } else {
      settings = ['My Cart', 'My orders', 'Settings', 'Logout'];
    }
  });

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

  

  function handleClickPage(page){
    switch(page){
      case 'Products':
          navigate('/products');
          break;
      case 'Categories':
          navigate('/categories');
          break;
      default:
          navigate('/erreurrr');
  }
  };

  function handleActionSelectedOnUser(setting){
    switch(setting){
        case 'Log in':
            navigate('/users/connect');
            break;
        case 'Sign up':
            navigate('/users/register');
            break;
        case 'My Cart':
          navigate('/cart');
          break;
        case 'My orders':
          navigate('/orders');
          break;
        case 'Settings':
          navigate('/settings');
          break;
        case 'Logout':
          fetch('users/logout', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          localStorage.removeItem("user");
          navigate('/users/connect');
          break;
        default:
          navigate('/erreurrr');
    }
  };
  
  function handleClickAdmin(){
    navigate('/admin');
  }

  let welcome;
  let admin;
    if(localStorage.getItem("user") !== null){
      if(JSON.parse(localStorage.getItem("user")).is_admin === 1){
        admin = <div onClick={handleClickAdmin} style={{marginRight:10, cursor:'pointer', backgroundColor:'white', color:"#1976d2", padding:10, borderRadius:'20px'}}>Admin Dashboard</div>;
      }
    welcome = <div style={{marginRight:10}}>{JSON.parse(localStorage.getItem("user")).lastname} {JSON.parse(localStorage.getItem("user")).firstname}</div>;
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
          >
          </Typography>
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
          >
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                onClick={() => handleClickPage(page)}
                key={page}
                style={{fontWeight:'bold'}}
                // onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page}
              </Button>
            ))}
          </Box>
          {admin}
          {welcome}
          <Box sx={{ flexGrow: 0 }}>
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
                  <Typography textAlign="center" onClick={() => handleActionSelectedOnUser(setting)}>{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <IconButton onClick={() => handleActionSelectedOnUser("My Cart")} sx={{ p: 0 }} style={{marginLeft:10}}>
            <ShoppingCartIcon />
          </IconButton>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default Header;