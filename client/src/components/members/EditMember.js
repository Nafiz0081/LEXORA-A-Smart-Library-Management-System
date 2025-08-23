import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Person,
  Email,
  Phone,
  Home,
  CheckCircle,
  Block,
  Info,
  CalendarToday,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAlert } from '../../contexts/AlertContext';
import axios from 'axios';

const EditMember = () => {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const { showError, showSuccess, handleApiError } = useAlert();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [member, setMember] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchMember();
  }, [memberId]);

  const fetchMember = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/members/${memberId}`);
      const memberData = response.data.member;
      
      setMember(memberData);
      setFormData({
        email: memberData.email || '',
        full_name: memberData.full_name || '',
        phone: memberData.phone || '',
        address: memberData.address || '',
      });
    } catch (err) {
      console.error('Error fetching member:', err);
      handleApiError(err, 'Failed to fetch member details');
      navigate('/members');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters long';
    }
    
    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare data for submission
      const updateData = {
        email: formData.email.trim().toLowerCase(),
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
      };
      
      await axios.put(`/api/members/${memberId}`, updateData);
      
      showSuccess(`Member "${formData.full_name}" has been updated successfully!`);
      navigate('/members');
    } catch (err) {
      console.error('Error updating member:', err);
      
      if (err.response?.status === 409) {
        if (err.response.data.message.includes('email')) {
          setErrors({ email: 'This email is already registered by another member' });
        }
        showError('Update failed: Duplicate information');
      } else {
        handleApiError(err, 'Failed to update member');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/members');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (!member) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Member not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleCancel}
          sx={{ mb: 2 }}
        >
          Back to Members
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Member
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Update member information for {member.full_name}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Member Overview */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Member Overview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Member ID
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    #{member.member_id}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Username
                  </Typography>
                  <Typography variant="body1">
                    {member.username}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip
                    label={member.status}
                    color={getStatusColor(member.status)}
                    size="small"
                    icon={member.status === 'Active' ? <CheckCircle /> : <Block />}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Join Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {formatDate(member.join_date)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Form */}
        <Grid item xs={12}>
          <form onSubmit={handleSubmit}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      error={!!errors.full_name}
                      helperText={errors.full_name}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={!!errors.phone}
                      helperText={errors.phone || 'Optional'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      helperText="Optional"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Home color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Library Activity Summary */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Library Activity Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Active Loans
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {member.active_loans || 0}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Borrowed
                    </Typography>
                    <Typography variant="h6">
                      {member.total_borrows || 0}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Overdue Books
                    </Typography>
                    <Typography variant="h6" color={member.overdue_books > 0 ? 'error' : 'text.primary'}>
                      {member.overdue_books || 0}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Outstanding Fines
                    </Typography>
                    <Typography variant="h6" color={member.outstanding_fines > 0 ? 'error' : 'success'}>
                      ${member.outstanding_fines || '0.00'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Help Section */}
            <Alert severity="info" icon={<Info />} sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Edit Member Notes:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Username and Member ID cannot be changed</li>
                <li>Email address must be unique across all members</li>
                <li>Phone number and address are optional</li>
                <li>To change member status, use the suspend/activate buttons in the member list</li>
                <li>Password changes must be done through the member's profile or password reset</li>
              </ul>
            </Alert>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={saving}
                size="large"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                size="large"
              >
                {saving ? 'Updating...' : 'Update Member'}
              </Button>
            </Box>
          </form>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EditMember;