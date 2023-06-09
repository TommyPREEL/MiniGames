import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate, Navigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { ProjectContext } from '../context/ProjectContext';

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {'Copyright © '}
      Tommy PREEL {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const theme = createTheme();

function Login() {
  const toast = React.useRef(null);

  const navigate = useNavigate();

  const projectContext = React.useContext(ProjectContext);

  const { setUser, user, handleLogin } = projectContext;

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get('username') === '' || data.get('password') === '') {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all fields',
        life: 3000,
      });
    } else {
      let inputs = {
        username: data.get('username'),
        password: data.get('password'),
      };
      fetch(`http://vps-222d59be.vps.ovh.net:5000/api/users/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs),
      })
        .then((response) => response.json())
        .then((dataBack) => {
          setUser(JSON.stringify(dataBack));
          handleLogin(JSON.stringify(dataBack));
          navigate('/');
        })
        .catch((error) => {
          console.error(error);
          toast.current.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Bad credentials',
            life: 3000,
          });
        });
    }
  };

  const handleClickRegister = () => {
    navigate('/register');
  };
  const access = () => {
    if (localStorage.getItem('user')) return <Navigate to="/"></Navigate>;
  };

  return (
    <ThemeProvider theme={theme}>
      {access()}
      <Toast ref={toast} />
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            {/* <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            /> */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Grid container>
              {/* <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid> */}
              <Grid item>
                <p onClick={handleClickRegister} variant="body2">
                  {"Don't have an account? Sign Up"}
                </p>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Copyright sx={{ mt: 8, mb: 4 }} />
      </Container>
    </ThemeProvider>
  );
}

export default Login;
