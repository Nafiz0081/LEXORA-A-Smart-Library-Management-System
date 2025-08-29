import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LibraryBooks,
  People,
  Assignment,
  Warning,
  TrendingUp,
  BookmarkBorder,
  PersonAdd,
  Add,
  Search,
  History,
  AccountBalance,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useAlert } from '../../contexts/AlertContext.jsx';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLibrarian, isMember } = useAuth();
  const { showError } = useAlert();
  
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isLibrarian()) {
        // Fetch librarian dashboard data
        const [statsResponse, activityResponse] = await Promise.all([
          axios.get('/api/reports/stats'),
          axios.get('/api/borrowings?limit=5&sort=created_at&order=desc')
        ]);
        
        setStats(statsResponse.data);
        setRecentActivity(activityResponse.data.borrowings || []);
      } else if (isMember()) {
        // Fetch member dashboard data
        const [loansResponse, statsResponse] = await Promise.all([
          axios.get(`/api/members/${user.member_id}/loans`),
          axios.get(`/api/members/${user.member_id}/stats`)
        ]);
        
        setRecentActivity(loansResponse.data.loans || []);
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'returned':
        return 'success';
      case 'overdue':
        return 'error';
      case 'renewed':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {getGreeting()}, {user?.full_name || user?.username}!
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Welcome to your LEXORA dashboard
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {isLibrarian() && stats && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <LibraryBooks color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Books
                      </Typography>
                      <Typography variant="h5">
                        {stats.totalBooks || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <People color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Members
                      </Typography>
                      <Typography variant="h5">
                        {stats.totalMembers || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Assignment color="info" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Active Loans
                      </Typography>
                      <Typography variant="h5">
                        {stats.activeLoans || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Warning color="error" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Overdue Books
                      </Typography>
                      <Typography variant="h5">
                        {stats.overdueBooks || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
        
        {isMember() && stats && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Assignment color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Active Loans
                      </Typography>
                      <Typography variant="h5">
                        {stats.activeLoans || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <TrendingUp color="success" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Borrowed
                      </Typography>
                      <Typography variant="h5">
                        {stats.totalBorrows || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Warning color="warning" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Overdue Books
                      </Typography>
                      <Typography variant="h5">
                        {stats.overdueBooks || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <AccountBalance color="error" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Outstanding Fines
                      </Typography>
                      <Typography variant="h5">
                        ${stats.outstandingFines || '0.00'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {isLibrarian() && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => navigate('/books/add')}
                      sx={{ py: 1.5 }}
                    >
                      Add Book
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PersonAdd />}
                      onClick={() => navigate('/members/add')}
                      sx={{ py: 1.5 }}
                    >
                      Add Member
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assignment />}
                      onClick={() => navigate('/borrowings/issue')}
                      sx={{ py: 1.5 }}
                    >
                      Issue Book
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<TrendingUp />}
                      onClick={() => navigate('/reports')}
                      sx={{ py: 1.5 }}
                    >
                      View Reports
                    </Button>
                  </Grid>
                </>
              )}
              
              {isMember() && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Search />}
                      onClick={() => navigate('/catalog')}
                      sx={{ py: 1.5 }}
                    >
                      Browse Books
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<BookmarkBorder />}
                      onClick={() => navigate('/my-loans')}
                      sx={{ py: 1.5 }}
                    >
                      My Loans
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<History />}
                      onClick={() => navigate('/my-history')}
                      sx={{ py: 1.5 }}
                    >
                      Borrowing History
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AccountBalance />}
                      onClick={() => navigate('/my-fines')}
                      sx={{ py: 1.5 }}
                    >
                      My Fines
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isLibrarian() ? 'Recent Borrowings' : 'My Recent Activity'}
            </Typography>
            {recentActivity.length > 0 ? (
              <Box>
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <Box
                    key={activity.borrowing_id || index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: index < recentActivity.length - 1 ? '1px solid #eee' : 'none'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {activity.book_title || activity.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {isLibrarian() && activity.member_name && `${activity.member_name} • `}
                        {formatDate(activity.issue_date || activity.created_at)}
                      </Typography>
                    </Box>
                    <Chip
                      label={activity.status}
                      color={getStatusColor(activity.status)}
                      size="small"
                    />
                  </Box>
                ))}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    size="small"
                    onClick={() => navigate(isLibrarian() ? '/borrowings' : '/my-loans')}
                  >
                    View All
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                No recent activity
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;