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
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  FilterList,
  Person,
  Block,
  CheckCircle,
  Email,
  Phone,
  Home,
  CalendarToday,
  Assignment,
  AccountBalance,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../../contexts/AlertContext.jsx';
import axios from 'axios';

const MemberManagement = () => {
  const navigate = useNavigate();
  const { showError, showSuccess, handleApiError } = useAlert();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalMembers, setTotalMembers] = useState(0);
  
  // Dialog states
  const [selectedMember, setSelectedMember] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [memberToToggle, setMemberToToggle] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (page === 0) {
        fetchMembers();
      } else {
        setPage(0);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [page, rowsPerPage]);

  const fetchMembers = async () => {
    try {
      setSearchLoading(true);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await axios.get('/api/members', { params });
      const data = response.data;
      
      setMembers(data.members || []);
      setTotalMembers(data.total || 0);
    } catch (err) {
      console.error('Error fetching members:', err);
      handleApiError(err, 'Failed to fetch members');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleViewMember = async (memberId) => {
    try {
      const response = await axios.get(`/api/members/${memberId}`);
      setSelectedMember(response.data.member);
      setViewDialogOpen(true);
    } catch (err) {
      console.error('Error fetching member details:', err);
      handleApiError(err, 'Failed to fetch member details');
    }
  };

  const handleEditMember = (memberId) => {
    navigate(`/members/edit/${memberId}`);
  };

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleStatusToggleClick = (member) => {
    setMemberToToggle(member);
    setStatusDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    
    try {
      setActionLoading(true);
      await axios.delete(`/api/members/${memberToDelete.member_id}`);
      showSuccess(`Member "${memberToDelete.full_name}" has been deleted successfully.`);
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      fetchMembers();
    } catch (err) {
      console.error('Error deleting member:', err);
      handleApiError(err, 'Failed to delete member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggleConfirm = async () => {
    if (!memberToToggle) return;
    
    try {
      setActionLoading(true);
      const action = memberToToggle.status === 'Active' ? 'suspend' : 'activate';
      await axios.patch(`/api/members/${memberToToggle.member_id}/${action}`);
      
      const newStatus = memberToToggle.status === 'Active' ? 'Suspended' : 'Active';
      showSuccess(`Member "${memberToToggle.full_name}" has been ${action}d successfully.`);
      
      setStatusDialogOpen(false);
      setMemberToToggle(null);
      fetchMembers();
    } catch (err) {
      console.error('Error updating member status:', err);
      handleApiError(err, 'Failed to update member status');
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
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
      case 'active':
        return 'success';
      case 'suspended':
        return 'error';
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Member Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage library members and their accounts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/members/add')}
          size="large"
        >
          Add New Member
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search members by name, email, or member ID..."
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
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Members</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Clear Filters */}
          <Grid item xs={12} sm={6} md={3}>
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

      {/* Members Table */}
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Members ({totalMembers})
          </Typography>
          {searchLoading && <CircularProgress size={20} />}
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Join Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.member_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #{member.member_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {member.full_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {member.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {member.phone || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {formatDate(member.join_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={member.status}
                      color={getStatusColor(member.status)}
                      size="small"
                      icon={member.status === 'Active' ? <CheckCircle /> : <Block />}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewMember(member.member_id)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Member">
                        <IconButton
                          size="small"
                          onClick={() => handleEditMember(member.member_id)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={member.status === 'Active' ? 'Suspend Member' : 'Activate Member'}>
                        <IconButton
                          size="small"
                          color={member.status === 'Active' ? 'warning' : 'success'}
                          onClick={() => handleStatusToggleClick(member)}
                        >
                          {member.status === 'Active' ? <Block /> : <CheckCircle />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Member">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(member)}
                          disabled={member.active_loans > 0 || member.outstanding_fines > 0}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalMembers}
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

      {/* View Member Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedMember && (
          <>
            <DialogTitle>
              <Typography variant="h5" component="div">
                {selectedMember.full_name}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Member ID: #{selectedMember.member_id}
              </Typography>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                {/* Personal Information */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Personal Information
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Full Name
                        </Typography>
                        <Typography variant="body1">
                          {selectedMember.full_name}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <Email sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {selectedMember.email}
                        </Typography>
                      </Box>
                      
                      {selectedMember.phone && (
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                          <Phone sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {selectedMember.phone}
                          </Typography>
                        </Box>
                      )}
                      
                      {selectedMember.address && (
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
                          <Home sx={{ mr: 1, fontSize: 16, color: 'text.secondary', mt: 0.5 }} />
                          <Typography variant="body2">
                            {selectedMember.address}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Joined: {formatDate(selectedMember.join_date)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mr: 1 }}>
                          Status:
                        </Typography>
                        <Chip
                          label={selectedMember.status}
                          color={getStatusColor(selectedMember.status)}
                          size="small"
                          icon={selectedMember.status === 'Active' ? <CheckCircle /> : <Block />}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Library Activity */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Library Activity
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Active Loans
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {selectedMember.active_loans || 0}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Total Books Borrowed
                        </Typography>
                        <Typography variant="h6">
                          {selectedMember.total_borrows || 0}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Overdue Books
                        </Typography>
                        <Typography variant="h6" color={selectedMember.overdue_books > 0 ? 'error' : 'text.primary'}>
                          {selectedMember.overdue_books || 0}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountBalance sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">
                            Outstanding Fines
                          </Typography>
                          <Typography variant="h6" color={selectedMember.outstanding_fines > 0 ? 'error' : 'success'}>
                            ${selectedMember.outstanding_fines || '0.00'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => {
                  setViewDialogOpen(false);
                  handleEditMember(selectedMember.member_id);
                }}
              >
                Edit Member
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          {memberToDelete && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This action cannot be undone.
              </Alert>
              <Typography variant="body1">
                Are you sure you want to delete member "{memberToDelete.full_name}"?
              </Typography>
              {(memberToDelete.active_loans > 0 || memberToDelete.outstanding_fines > 0) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  This member cannot be deleted because they have active loans or outstanding fines.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={actionLoading || (memberToDelete && (memberToDelete.active_loans > 0 || memberToDelete.outstanding_fines > 0))}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Toggle Confirmation Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {memberToToggle?.status === 'Active' ? 'Suspend Member' : 'Activate Member'}
        </DialogTitle>
        <DialogContent>
          {memberToToggle && (
            <Typography variant="body1">
              Are you sure you want to {memberToToggle.status === 'Active' ? 'suspend' : 'activate'} member "{memberToToggle.full_name}"?
              {memberToToggle.status === 'Active' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Suspended members will not be able to borrow new books.
                </Alert>
              )}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            color={memberToToggle?.status === 'Active' ? 'warning' : 'success'}
            variant="contained"
            onClick={handleStatusToggleConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : (memberToToggle?.status === 'Active' ? 'Suspend' : 'Activate')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MemberManagement;