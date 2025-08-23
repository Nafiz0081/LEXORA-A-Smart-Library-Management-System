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
  IconButton,
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
  Tooltip,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  Visibility,
  Assignment,
  AssignmentReturn,
  Autorenew,
  Payment,
  FilterList,
  Book,
  Person,
  CalendarToday,
  Warning,
  CheckCircle,
  Schedule,
  AccountBalance,
} from '@mui/icons-material';
import { useAlert } from '../../contexts/AlertContext';
import axios from 'axios';

const BorrowingManagement = () => {
  const { showError, showSuccess, handleApiError } = useAlert();
  
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Tab state
  const [currentTab, setCurrentTab] = useState(0);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overdueFilter, setOverdueFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBorrowings, setTotalBorrowings] = useState(0);
  
  // Dialog states
  const [selectedBorrowing, setSelectedBorrowing] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [payFineDialogOpen, setPayFineDialogOpen] = useState(false);
  
  // Issue book form
  const [issueForm, setIssueForm] = useState({
    member_id: '',
    book_id: '',
  });
  
  // Pay fine form
  const [fineAmount, setFineAmount] = useState('');

  const tabs = [
    { label: 'All Borrowings', value: 'all' },
    { label: 'Active Loans', value: 'Borrowed' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Returned', value: 'Returned' },
  ];

  useEffect(() => {
    fetchBorrowings();
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
  }, [searchTerm, statusFilter, overdueFilter, currentTab]);

  useEffect(() => {
    fetchBorrowings();
  }, [page, rowsPerPage]);

  const fetchBorrowings = async () => {
    try {
      setSearchLoading(true);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
      };
      
      // Handle tab-based filtering
      if (currentTab === 1) {
        params.status = 'Borrowed';
      } else if (currentTab === 2) {
        params.overdue = 'true';
      } else if (currentTab === 3) {
        params.status = 'Returned';
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (overdueFilter !== 'all' && currentTab !== 2) {
        params.overdue = overdueFilter;
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

  const handleIssueBook = async () => {
    if (!issueForm.member_id || !issueForm.book_id) {
      showError('Please provide both Member ID and Book ID');
      return;
    }
    
    try {
      setActionLoading(true);
      await axios.post('/api/borrowings/issue', {
        member_id: parseInt(issueForm.member_id),
        book_id: parseInt(issueForm.book_id),
      });
      
      showSuccess('Book issued successfully!');
      setIssueDialogOpen(false);
      setIssueForm({ member_id: '', book_id: '' });
      fetchBorrowings();
    } catch (err) {
      console.error('Error issuing book:', err);
      handleApiError(err, 'Failed to issue book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnBook = async (borrowingId) => {
    try {
      setActionLoading(true);
      await axios.post(`/api/borrowings/${borrowingId}/return`);
      
      showSuccess('Book returned successfully!');
      setReturnDialogOpen(false);
      setSelectedBorrowing(null);
      fetchBorrowings();
    } catch (err) {
      console.error('Error returning book:', err);
      handleApiError(err, 'Failed to return book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewBook = async (borrowingId) => {
    try {
      setActionLoading(true);
      await axios.post(`/api/borrowings/${borrowingId}/renew`);
      
      showSuccess('Book renewed successfully!');
      setRenewDialogOpen(false);
      setSelectedBorrowing(null);
      fetchBorrowings();
    } catch (err) {
      console.error('Error renewing book:', err);
      handleApiError(err, 'Failed to renew book');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayFine = async (borrowingId) => {
    if (!fineAmount || parseFloat(fineAmount) <= 0) {
      showError('Please enter a valid fine amount');
      return;
    }
    
    try {
      setActionLoading(true);
      await axios.post(`/api/borrowings/${borrowingId}/pay-fine`, {
        amount: parseFloat(fineAmount),
      });
      
      showSuccess('Fine paid successfully!');
      setPayFineDialogOpen(false);
      setSelectedBorrowing(null);
      setFineAmount('');
      fetchBorrowings();
    } catch (err) {
      console.error('Error paying fine:', err);
      handleApiError(err, 'Failed to pay fine');
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setOverdueFilter('all');
    setPage(0);
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Borrowing Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage book loans, returns, and renewals
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Assignment />}
          onClick={() => setIssueDialogOpen(true)}
          size="large"
        >
          Issue Book
        </Button>
      </Box>

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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by member name, book title, or ID..."
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
          
          {/* Status Filter */}
          {currentTab === 0 && (
            <Grid item xs={12} sm={6} md={2}>
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
          
          {/* Overdue Filter */}
          {currentTab !== 2 && (
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Overdue</InputLabel>
                <Select
                  value={overdueFilter}
                  label="Overdue"
                  onChange={(e) => setOverdueFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="true">Overdue Only</MenuItem>
                  <MenuItem value="false">Not Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {/* Clear Filters */}
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={clearFilters}
              sx={{ py: 1.5 }}
            >
              Clear Filters
            </Button>
          </Grid>
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
                <TableCell>ID</TableCell>
                <TableCell>Member</TableCell>
                <TableCell>Book</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Fine</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {borrowings.map((borrowing) => (
                <TableRow key={borrowing.borrowing_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #{borrowing.borrowing_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {borrowing.member_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ID: {borrowing.member_id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {borrowing.book_title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        by {borrowing.book_author}
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
                      color={isOverdue(borrowing.due_date) && borrowing.status === 'Borrowed' ? 'error' : 'textSecondary'}
                    >
                      {formatDate(borrowing.due_date)}
                    </Typography>
                    {isOverdue(borrowing.due_date) && borrowing.status === 'Borrowed' && (
                      <Chip
                        label="Overdue"
                        color="error"
                        size="small"
                        icon={<Warning />}
                        sx={{ mt: 0.5 }}
                      />
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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewBorrowing(borrowing.borrowing_id)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      {borrowing.status === 'Borrowed' && (
                        <>
                          <Tooltip title="Return Book">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setSelectedBorrowing(borrowing);
                                setReturnDialogOpen(true);
                              }}
                            >
                              <AssignmentReturn />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Renew Book">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedBorrowing(borrowing);
                                setRenewDialogOpen(true);
                              }}
                            >
                              <Autorenew />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      {borrowing.fine_amount > 0 && (
                        <Tooltip title="Pay Fine">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => {
                              setSelectedBorrowing(borrowing);
                              setFineAmount(borrowing.fine_amount.toString());
                              setPayFineDialogOpen(true);
                            }}
                          >
                            <Payment />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
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
          rowsPerPageOptions={[5, 10, 25, 50]}
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
                {/* Member Information */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Member Information
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Name
                        </Typography>
                        <Typography variant="body1">
                          {selectedBorrowing.member_name}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Member ID
                        </Typography>
                        <Typography variant="body1">
                          #{selectedBorrowing.member_id}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {selectedBorrowing.member_email}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Book Information */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        <Book sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Book Information
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Title
                        </Typography>
                        <Typography variant="body1">
                          {selectedBorrowing.book_title}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Author
                        </Typography>
                        <Typography variant="body1">
                          {selectedBorrowing.book_author}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Book ID
                        </Typography>
                        <Typography variant="body1">
                          #{selectedBorrowing.book_id}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Borrowing Details */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Borrowing Details
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
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Issue Book Dialog */}
      <Dialog
        open={issueDialogOpen}
        onClose={() => setIssueDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Issue Book
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Member ID"
                type="number"
                value={issueForm.member_id}
                onChange={(e) => setIssueForm(prev => ({ ...prev, member_id: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Book ID"
                type="number"
                value={issueForm.book_id}
                onChange={(e) => setIssueForm(prev => ({ ...prev, book_id: e.target.value }))}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleIssueBook}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Issue Book'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Book Dialog */}
      <Dialog
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Return Book
        </DialogTitle>
        <DialogContent>
          {selectedBorrowing && (
            <Typography variant="body1">
              Are you sure you want to return "{selectedBorrowing.book_title}" borrowed by {selectedBorrowing.member_name}?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={() => handleReturnBook(selectedBorrowing?.borrowing_id)}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Return Book'}
          </Button>
        </DialogActions>
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
            <Typography variant="body1">
              Are you sure you want to renew "{selectedBorrowing.book_title}" for {selectedBorrowing.member_name}?
            </Typography>
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
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Renew Book'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pay Fine Dialog */}
      <Dialog
        open={payFineDialogOpen}
        onClose={() => setPayFineDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Pay Fine
        </DialogTitle>
        <DialogContent>
          {selectedBorrowing && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Pay fine for "{selectedBorrowing.book_title}" borrowed by {selectedBorrowing.member_name}
              </Typography>
              <TextField
                fullWidth
                label="Fine Amount"
                type="number"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText={`Outstanding fine: $${selectedBorrowing.fine_amount}`}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayFineDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => handlePayFine(selectedBorrowing?.borrowing_id)}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Pay Fine'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BorrowingManagement;