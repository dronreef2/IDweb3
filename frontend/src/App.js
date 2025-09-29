import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    // Check API status
    const checkAPI = async () => {
      try {
        const response = await fetch('http://localhost:3001/health');
        const data = await response.json();
        setApiStatus(data);
      } catch (error) {
        setApiStatus({ error: 'API not available' });
      } finally {
        setLoading(false);
      }
    };

    checkAPI();
  }, []);

  const openGuardian = () => {
    window.open('http://localhost:3000', '_blank');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            IDweb3 - Digital Identity Platform
          </Typography>
          <Button color="inherit" onClick={openGuardian}>
            Guardian UI
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h4" component="h1" gutterBottom>
                  Welcome to IDweb3
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                  Digital Identity MVP with Hedera + Guardian Integration
                </Typography>
                
                {loading ? (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box mt={2}>
                    {apiStatus?.status === 'OK' ? (
                      <Alert severity="success">
                        API is running - Service: {apiStatus.service} v{apiStatus.version}
                      </Alert>
                    ) : (
                      <Alert severity="error">
                        API Error: {apiStatus?.error || 'Unknown error'}
                      </Alert>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🆔 Identity Registration
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Create your unique digital identity with NFT or VC.
                </Typography>
                <Button variant="contained" disabled>
                  Create Identity
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📜 Credentials
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Receive and manage verifiable credentials.
                </Typography>
                <Button variant="contained" disabled>
                  View Credentials
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📋 Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  View your identity and activity history.
                </Typography>
                <Button variant="contained" disabled>
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🚀 Getting Started
                </Typography>
                <Typography variant="body1" paragraph>
                  This is the MVP version of IDweb3. To get started:
                </Typography>
                <ol>
                  <li>Set up your Hedera testnet account and update the .env file</li>
                  <li>Access the Guardian UI to configure identity policies</li>
                  <li>Use the API endpoints to create identities and credentials</li>
                  <li>Test the complete identity verification workflow</li>
                </ol>
                <Box mt={2}>
                  <Button 
                    variant="outlined" 
                    onClick={openGuardian}
                    sx={{ mr: 2 }}
                  >
                    Open Guardian UI
                  </Button>
                  <Button 
                    variant="outlined"
                    href="http://localhost:3001/health"
                    target="_blank"
                  >
                    API Health Check
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default App;