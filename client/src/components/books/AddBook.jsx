import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Save,
  Cancel,
  Book,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../../contexts/AlertContext.jsx';
import axios from 'axios';

const AddBook = () => {
  const navigate = useNavigate();
  const { showError, showSuccess, handleApiError } = useAlert();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    publicationYear: '',
    totalCopies: 1,
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/books/categories');
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Author validation
    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    } else if (formData.author.length > 100) {
      newErrors.author = 'Author must be less than 100 characters';
    }

    // ISBN validation (optional but if provided, should be valid)
    if (formData.isbn && !/^[0-9\-X]+$/.test(formData.isbn.replace(/\s/g, ''))) {
      newErrors.isbn = 'Please enter a valid ISBN';
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    } else if (formData.category.length > 100) {
      newErrors.category = 'Category must be less than 100 characters';
    }

    // Publication year validation
    if (formData.publicationYear) {
      const year = parseInt(formData.publicationYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1000 || year > currentYear) {
        newErrors.publicationYear = `Please enter a valid year between 1000 and ${currentYear}`;
      }
    }

    // Total copies validation
    const copies = parseInt(formData.totalCopies);
    if (isNaN(copies) || copies < 1 || copies > 1000) {
      newErrors.totalCopies = 'Total copies must be between 1 and 1000';
    }

    // Description validation
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || null,
        category: formData.category.trim(),
        publication_year: formData.publicationYear ? new Date(formData.publicationYear, 0, 1).toISOString() : null,
        total_copies: parseInt(formData.totalCopies),
        description: formData.description.trim() || null,
      };

      const response = await axios.post('/api/books', bookData);
      
      showSuccess(`Book "${bookData.title}" has been added successfully!`);
      navigate('/books');
    } catch (err) {
      console.error('Error adding book:', err);
      handleApiError(err, 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/books');
  };

  const isFormValid = formData.title.trim() && 
                     formData.author.trim() && 
                     formData.category.trim() && 
                     formData.totalCopies &&
                     Object.keys(errors).length === 0;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Book
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Add a new book to the library collection
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="title"
                label="Book Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.title}
                helperText={errors.title}
                inputProps={{ maxLength: 200 }}
              />
            </Grid>
            
            {/* Author */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="author"
                label="Author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.author}
                helperText={errors.author}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            
            {/* ISBN */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="isbn"
                label="ISBN (Optional)"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.isbn}
                helperText={errors.isbn || 'Enter ISBN-10 or ISBN-13'}
                placeholder="978-0-123456-78-9"
              />
            </Grid>
            
            {/* Category */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  name="category"
                  onChange={handleChange}
                  disabled={loading}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem value="Other">
                    <em>Other (specify in description)</em>
                  </MenuItem>
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            {/* Publication Year */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="publicationYear"
                label="Publication Year (Optional)"
                name="publicationYear"
                type="number"
                value={formData.publicationYear}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.publicationYear}
                helperText={errors.publicationYear}
                inputProps={{ 
                  min: 1000, 
                  max: new Date().getFullYear(),
                  step: 1 
                }}
              />
            </Grid>
            
            {/* Total Copies */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="totalCopies"
                label="Total Copies"
                name="totalCopies"
                type="number"
                value={formData.totalCopies}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.totalCopies}
                helperText={errors.totalCopies || 'Number of copies to add to the library'}
                inputProps={{ min: 1, max: 1000, step: 1 }}
              />
            </Grid>
            
            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                label="Description (Optional)"
                name="description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.description}
                helperText={errors.description || `${formData.description.length}/1000 characters`}
                inputProps={{ maxLength: 1000 }}
                placeholder="Brief description of the book, plot summary, or additional notes..."
              />
            </Grid>
          </Grid>
          
          {/* Action Buttons */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={handleCancel}
              disabled={loading}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              disabled={!isFormValid || loading}
              size="large"
            >
              {loading ? 'Adding Book...' : 'Add Book'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Help Section */}
      <Paper sx={{ mt: 3, p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom color="primary">
          <Book sx={{ mr: 1, verticalAlign: 'middle' }} />
          Tips for Adding Books
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          • <strong>Title:</strong> Enter the complete title of the book as it appears on the cover.
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          • <strong>Author:</strong> Use the format "Last Name, First Name" for consistency.
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          • <strong>ISBN:</strong> Optional but recommended for unique identification. Can be ISBN-10 or ISBN-13.
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          • <strong>Category:</strong> Choose the most appropriate category. If none fit, select "Other" and specify in the description.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • <strong>Copies:</strong> Enter the total number of copies you're adding to the library inventory.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AddBook;