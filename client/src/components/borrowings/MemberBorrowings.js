import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  Visibility,
  Autorenew,
  Book,
  CalendarToday,
  Warning,
  CheckCircle,
  Schedule,
  Payment,
  History,
  Assignment,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import axios from 'axios';

const MemberBorrowings = () => {
  const { user } = useAuth();
  const { showError, showSuccess, handleApiError } = useAlert();
  
  const [borrowings, setBorrowings] = useState([]);
  const [stats, setStats] = useState({
    active_loans: 0,
    total_borrowed: 0,
    overdue_books: 0,
    total_fines: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  
  // Tab state
  const [currentTab, setCurrentTab] = useState(0);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBorrowings, setTotalBorrowings] = useState(0);
  
  // Dialog states
  const [selectedBorrowing, setSelectedBorrowing] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);

  const tabs = [
    { label: 'Current Loans', value: 'current' },
    { label: 'Borrowing History', value: 'history' },
    { label: 'Overdue Books', value: 'overdue' },
  ];

  useEffect(() => {
    fetchBorrowings();
    fetchStats();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (page === 0) {
        fetchBorrowings();
      } else {
        setPage(0);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter, currentTab]);

  useEffect(() => {
    fetchBorrowings();
  }, [page, rowsPerPage]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/members/profile');
      const memberData = response.data.member;
      setStats({
        active_loans: memberData.active_loans || 0,
        total_borrowed: memberData.total_borrowed || 0,
        overdue_books: memberData.overdue_books || 0,
        total_fines: memberData.total_fines || 0
      });
    } catch (err) {
      console.error('Error fetching member stats:', err);
    }
  };

  const fetchBorrowings = async () => {
    try {
      setSearchLoading(true);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        member_id: user.id,
      };
      
      // Handle tab-based filtering
      if (currentTab === 0) {
        params.status = 'Borrowed';
      } else if (currentTab === 1) {
        // All borrowings (history)
      } else if (currentTab === 2) {
        params.status = 'Borrowed';
        params.overdue = 'true';
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await axios.get('/api/borrowings', { params });
      const data = response.data;
      
      setBorrowings(data.borrowings || []);
      setTotalBorrowings(data.total || 0);
    } catch (err) {
      console.error('Error fetching borrowings:', err);
      handleApiError(err, 'Failed to fetch borrowings');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleViewBorrowing = async (borrowingId) => {
    try {
      const response = await axios.get(`/api/borrowings/${borrowingId}`);
      setSelectedBorrowing(response.data.borrowing);
      setViewDialogOpen(true);
    } catch (err) {
      console.error('Error fetching borrowing details:', err);
      handleApiError(err, 'Failed to fetch borrowing details');
    }
  };

  const handleRenewBook = async (borrowingId) => {
    try {
      setRenewLoading(true);
      await axios.post(`/api/borrowings/${borrowingId}/renew`);
      
      showSuccess('Book renewed successfully!');
      setRenewDialogOpen(false);
      setSelectedBorrowing(null);
      fetchBorrowings();
      fetchStats();
    } catch (err) {
      console.error('Error renewing book:', err);
      handleApiError(err, 'Failed to renew book');
    } finally {
      setRenewLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'borrowed':
        return 'primary';
      case 'returned':
        return 'success';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Borrowings
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          View your current loans and borrowing history
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">
                  {stats.active_loans}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Active Loans
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" color="success.main">
                  {stats.total_borrowed}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Borrowed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" color="error.main">
                  {stats.overdue_books}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Overdue Books
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Payment color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" color="warning.main">
                  ${stats.total_fines.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Outstanding Fines
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Outstanding Fines Alert */}
      {stats.total_fines > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            You have outstanding fines totaling <strong>${stats.total_fines.toFixed(2)}</strong>. 
            Please contact the library to pay your fines.
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => {
            setCurrentTab(newValue);
            setPage(0);
          }}
          variant="fullWidth"
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search by book title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          {/* Status Filter - Only for history tab */}
          {currentTab === 1 && (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="Borrowed">Borrowed</MenuItem>
                  <MenuItem value="Returned">Returned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Borrowings Table */}
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {tabs[currentTab].label} ({totalBorrowings})
          </Typography>
          {searchLoading && <CircularProgress size={20} />}
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Book</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Fine</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {borrowings.map((borrowing) => {
                const daysUntilDue = getDaysUntilDue(borrowing.due_date);
                const isBookOverdue = isOverdue(borrowing.due_date) && borrowing.status === 'Borrowed';
                
                return (
                  <TableRow key={borrowing.borrowing_id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {borrowing.book_title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          by {borrowing.book_author}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="textSecondary">
                          ISBN: {borrowing.book_isbn}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(borrowing.issue_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={isBookOverdue ? 'error' : 'textSecondary'}
                      >
                        {formatDate(borrowing.due_date)}
                      </Typography>
                      {borrowing.status === 'Borrowed' && (
                        <Box sx={{ mt: 0.5 }}>
                          {isBookOverdue ? (
                            <Chip
                              label={`Overdue by ${Math.abs(daysUntilDue)} days`}
                              color="error"
                              size="small"
                              icon={<Warning />}
                            />
                          ) : daysUntilDue <= 3 ? (
                            <Chip
                              label={`Due in ${daysUntilDue} days`}
                              color="warning"
                              size="small"
                              icon={<Schedule />}
                            />
                          ) : (
                            <Chip
                              label={`${daysUntilDue} days left`}
                              color="success"
                              size="small"
                              icon={<CheckCircle />}
                            />
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={borrowing.status}
                        color={getStatusColor(borrowing.status)}
                        size="small"
                        icon={borrowing.status === 'Returned' ? <CheckCircle /> : <Schedule />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={borrowing.fine_amount > 0 ? 'error' : 'textSecondary'}
                        fontWeight={borrowing.fine_amount > 0 ? 'medium' : 'normal'}
                      >
                        ${borrowing.fine_amount || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewBorrowing(borrowing.borrowing_id)}
                        >
                          View
                        </Button>
                        
                        {borrowing.status === 'Borrowed' && !isBookOverdue && (
                          <Button
                            size="small"
                            color="primary"
                            startIcon={<Autorenew />}
                            onClick={() => {
                              setSelectedBorrowing(borrowing);
                              setRenewDialogOpen(true);
                            }}
                          >
                            Renew
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalBorrowings}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      {/* View Borrowing Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedBorrowing && (
          <>
            <DialogTitle>
              <Typography variant="h5" component="div">
                Borrowing Details
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Borrowing ID: #{selectedBorrowing.borrowing_id}
              </Typography>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                {/* Book Information */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        <Book sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Book Information
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Title
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {selectedBorrowing.book_title}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Author
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {selectedBorrowing.book_author}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            ISBN
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {selectedBorrowing.book_isbn}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Category
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {selectedBorrowing.book_category}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Borrowing Timeline */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Borrowing Timeline
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Issue Date
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(selectedBorrowing.issue_date)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Due Date
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(selectedBorrowing.due_date)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Status
                          </Typography>
                          <Chip
                            label={selectedBorrowing.status}
                            color={getStatusColor(selectedBorrowing.status)}
                            size="small"
                          />
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Fine Amount
                          </Typography>
                          <Typography variant="body1" color={selectedBorrowing.fine_amount > 0 ? 'error' : 'text.primary'}>
                            ${selectedBorrowing.fine_amount || '0.00'}
                          </Typography>
                        </Grid>
                        
                        {selectedBorrowing.return_date && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="textSecondary">
                              Return Date
                            </Typography>
                            <Typography variant="body1">
                              {formatDate(selectedBorrowing.return_date)}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                      
                      {/* Progress bar for current loans */}
                      {selectedBorrowing.status === 'Borrowed' && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Loan Progress
                          </Typography>
                          {(() => {
                            const issueDate = new Date(selectedBorrowing.issue_date);
                            const dueDate = new Date(selectedBorrowing.due_date);
                            const today = new Date();
                            const totalDays = Math.ceil((dueDate - issueDate) / (1000 * 60 * 60 * 24));
                            const daysPassed = Math.ceil((today - issueDate) / (1000 * 60 * 60 * 24));
                            const progress = Math.min((daysPassed / totalDays) * 100, 100);
                            const isOverdueNow = today > dueDate;
                            
                            return (
                              <>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={progress} 
                                  color={isOverdueNow ? 'error' : progress > 80 ? 'warning' : 'primary'}
                                  sx={{ height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                  {isOverdueNow 
                                    ? `Overdue by ${Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))} days`
                                    : `${Math.max(0, Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)))} days remaining`
                                  }
                                </Typography>
                              </>
                            );
                          })()}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
              {selectedBorrowing.status === 'Borrowed' && !isOverdue(selectedBorrowing.due_date) && (
                <Button
                  variant="contained"
                  startIcon={<Autorenew />}
                  onClick={() => {
                    setViewDialogOpen(false);
                    setRenewDialogOpen(true);
                  }}
                >
                  Renew Book
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Renew Book Dialog */}
      <Dialog
        open={renewDialogOpen}
        onClose={() => setRenewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Renew Book
        </DialogTitle>
        <DialogContent>
          {selectedBorrowing && (
            <>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to renew "{selectedBorrowing.book_title}"?
              </Typography>
              <Typography variant="body2" color="textSecondary">
                The due date will be extended by 14 days from the current due date.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenewDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={() => handleRenewBook(selectedBorrowing?.borrowing_id)}
            disabled={renewLoading}
          >
            {renewLoading ? <CircularProgress size={20} /> : 'Renew Book'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MemberBorrowings;