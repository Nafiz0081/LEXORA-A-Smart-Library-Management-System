import React, { useState } from 'react';
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
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Person,
  Email,
  Phone,
  Home,
  Lock,
  Visibility,
  VisibilityOff,
  Info,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../../contexts/AlertContext.jsx';
import axios from 'axios';

const AddMember = () => {
  const navigate = useNavigate();
  const { showError, showSuccess, handleApiError } = useAlert();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    phone: '',
    address: '',
  });

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
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
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
      setLoading(true);
      
      // Prepare data for submission
      const memberData = {
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim().toLowerCase(),
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
      };
      
      const response = await axios.post('/api/members', memberData);
      
      showSuccess(`Member "${formData.full_name}" has been added successfully!`);
      navigate('/members');
    } catch (err) {
      console.error('Error adding member:', err);
      
      if (err.response?.status === 409) {
        if (err.response.data.message.includes('username')) {
          setErrors({ username: 'This username is already taken' });
        } else if (err.response.data.message.includes('email')) {
          setErrors({ email: 'This email is already registered' });
        }
        showError('Member registration failed: Duplicate information');
      } else {
        handleApiError(err, 'Failed to add member');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/members');
  };

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
          Add New Member
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Create a new library member account
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Account Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  <Lock sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Account Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      error={!!errors.username}
                      helperText={errors.username || 'Used for login (letters, numbers, underscores only)'}
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
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      error={!!errors.password}
                      helperText={errors.password || 'Minimum 6 characters'}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              onClick={() => setShowPassword(!showPassword)}
                              sx={{ minWidth: 'auto', p: 1 }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Personal Information */}
          <Grid item xs={12}>
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
          </Grid>

          {/* Help Section */}
          <Grid item xs={12}>
            <Alert severity="info" icon={<Info />}>
              <Typography variant="subtitle2" gutterBottom>
                Member Registration Tips:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Username must be unique and will be used for login</li>
                <li>Email address must be valid and unique</li>
                <li>Phone number and address are optional but recommended</li>
                <li>New members will have "Active" status by default</li>
                <li>Members can update their profile information after registration</li>
              </ul>
            </Alert>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
                size="large"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                size="large"
              >
                {loading ? 'Adding Member...' : 'Add Member'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default AddMember;