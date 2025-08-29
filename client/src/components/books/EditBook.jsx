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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Book,
  Person,
  Category,
  CalendarToday,
  Numbers,
  Description,
  Info,
  Inventory,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAlert } from '../../contexts/AlertContext.jsx';
import axios from 'axios';

const EditBook = () => {
  const navigate = useNavigate();
  const { bookId } = useParams();
  const { showError, showSuccess, handleApiError } = useAlert();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [book, setBook] = useState(null);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category_id: '',
    publication_year: '',
    total_copies: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchBook();
  }, [bookId]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/books/categories');
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      handleApiError(err, 'Failed to fetch book categories');
    }
  };

  const fetchBook = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/books/${bookId}`);
      const bookData = response.data.book;
      
      setBook(bookData);
      setFormData({
        title: bookData.title || '',
        author: bookData.author || '',
        isbn: bookData.isbn || '',
        category_id: bookData.category_id || '',
        publication_year: bookData.publication_year || '',
        total_copies: bookData.total_copies || '',
        description: bookData.description || '',
      });
    } catch (err) {
      console.error('Error fetching book:', err);
      handleApiError(err, 'Failed to fetch book details');
      navigate('/books/manage');
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
    
    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters long';
    }
    
    // Author validation
    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    } else if (formData.author.trim().length < 2) {
      newErrors.author = 'Author name must be at least 2 characters long';
    }
    
    // ISBN validation (optional but if provided, should be valid)
    if (formData.isbn && !/^[0-9\-X]+$/.test(formData.isbn.replace(/\s/g, ''))) {
      newErrors.isbn = 'Please enter a valid ISBN';
    }
    
    // Category validation
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }
    
    // Publication year validation
    if (formData.publication_year) {
      const year = parseInt(formData.publication_year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1000 || year > currentYear) {
        newErrors.publication_year = `Please enter a valid year between 1000 and ${currentYear}`;
      }
    }
    
    // Total copies validation
    if (!formData.total_copies) {
      newErrors.total_copies = 'Total copies is required';
    } else {
      const copies = parseInt(formData.total_copies);
      if (isNaN(copies) || copies < 1) {
        newErrors.total_copies = 'Total copies must be at least 1';
      } else if (copies > 1000) {
        newErrors.total_copies = 'Total copies cannot exceed 1000';
      }
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
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || null,
        category_id: parseInt(formData.category_id),
        publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
        total_copies: parseInt(formData.total_copies),
        description: formData.description.trim() || null,
      };
      
      await axios.put(`/api/books/${bookId}`, updateData);
      
      showSuccess(`Book "${formData.title}" has been updated successfully!`);
      navigate('/books/manage');
    } catch (err) {
      console.error('Error updating book:', err);
      
      if (err.response?.status === 409) {
        if (err.response.data.message.includes('ISBN')) {
          setErrors({ isbn: 'This ISBN is already registered for another book' });
        }
        showError('Update failed: Duplicate information');
      } else {
        handleApiError(err, 'Failed to update book');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/books/manage');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAvailabilityColor = (available, total) => {
    if (available === 0) return 'error';
    if (available / total < 0.3) return 'warning';
    return 'success';
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

  if (!book) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Book not found.
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
          Back to Book Management
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Book
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Update book information for "{book.title}"
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Book Overview */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Book Overview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Book ID
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    #{book.book_id}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Category
                  </Typography>
                  <Typography variant="body1">
                    {book.category_name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Availability
                  </Typography>
                  <Chip
                    label={`${book.available_copies}/${book.total_copies} Available`}
                    color={getAvailabilityColor(book.available_copies, book.total_copies)}
                    size="small"
                    icon={book.available_copies > 0 ? <CheckCircle /> : <Cancel />}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Added Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {formatDate(book.created_at)}
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
                  <Book sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Book Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  {/* Title */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Book Title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      error={!!errors.title}
                      helperText={errors.title}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Book color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  {/* Author */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Author"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      error={!!errors.author}
                      helperText={errors.author}
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
                  
                  {/* ISBN */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ISBN"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleInputChange}
                      error={!!errors.isbn}
                      helperText={errors.isbn || 'Optional (e.g., 978-0-123456-78-9)'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Numbers color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  {/* Category */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!errors.category_id} required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category_id"
                        value={formData.category_id}
                        label="Category"
                        onChange={handleInputChange}
                        startAdornment={
                          <InputAdornment position="start">
                            <Category color="action" />
                          </InputAdornment>
                        }
                      >
                        {categories.map((category) => (
                          <MenuItem key={category.category_id} value={category.category_id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.category_id && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                          {errors.category_id}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  
                  {/* Publication Year */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Publication Year"
                      name="publication_year"
                      type="number"
                      value={formData.publication_year}
                      onChange={handleInputChange}
                      error={!!errors.publication_year}
                      helperText={errors.publication_year || 'Optional'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  {/* Total Copies */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Total Copies"
                      name="total_copies"
                      type="number"
                      value={formData.total_copies}
                      onChange={handleInputChange}
                      error={!!errors.total_copies}
                      helperText={errors.total_copies}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Inventory color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  {/* Description */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      helperText="Optional book description or summary"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                            <Description color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Current Loan Status */}
            {book.active_loans > 0 && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Active Loans Notice:
                </Typography>
                This book currently has {book.active_loans} active loan(s). 
                Reducing the total copies below the number of active loans is not allowed.
              </Alert>
            )}

            {/* Help Section */}
            <Alert severity="info" icon={<Info />} sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Edit Book Notes:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Book ID cannot be changed</li>
                <li>ISBN must be unique if provided</li>
                <li>Total copies cannot be less than currently borrowed copies</li>
                <li>Changing category will update the book's classification</li>
                <li>All changes will be reflected immediately in the system</li>
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
                {saving ? 'Updating...' : 'Update Book'}
              </Button>
            </Box>
          </form>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EditBook;