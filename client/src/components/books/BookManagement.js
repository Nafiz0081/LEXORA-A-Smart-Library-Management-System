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
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  FilterList,
  Book,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../../contexts/AlertContext';
import axios from 'axios';

const BookManagement = () => {
  const navigate = useNavigate();
  const { showError, showSuccess, handleApiError } = useAlert();
  
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBooks, setTotalBooks] = useState(0);
  
  // Dialog states
  const [selectedBook, setSelectedBook] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchBooks();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (page === 0) {
        fetchBooks();
      } else {
        setPage(0);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedCategory, authorFilter, availabilityFilter]);

  useEffect(() => {
    fetchBooks();
  }, [page, rowsPerPage]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/books/categories');
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchBooks = async () => {
    try {
      setSearchLoading(true);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        author: authorFilter || undefined,
        available: availabilityFilter === 'available' ? 'true' : undefined,
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await axios.get('/api/books', { params });
      const data = response.data;
      
      setBooks(data.books || []);
      setTotalBooks(data.total || 0);
    } catch (err) {
      console.error('Error fetching books:', err);
      handleApiError(err, 'Failed to fetch books');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleViewBook = async (bookId) => {
    try {
      const response = await axios.get(`/api/books/${bookId}`);
      setSelectedBook(response.data.book);
      setViewDialogOpen(true);
    } catch (err) {
      console.error('Error fetching book details:', err);
      handleApiError(err, 'Failed to fetch book details');
    }
  };

  const handleEditBook = (bookId) => {
    navigate(`/books/edit/${bookId}`);
  };

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;
    
    try {
      setDeleteLoading(true);
      await axios.delete(`/api/books/${bookToDelete.book_id}`);
      showSuccess(`Book "${bookToDelete.title}" has been deleted successfully.`);
      setDeleteDialogOpen(false);
      setBookToDelete(null);
      fetchBooks();
    } catch (err) {
      console.error('Error deleting book:', err);
      handleApiError(err, 'Failed to delete book');
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setAuthorFilter('');
    setAvailabilityFilter('all');
    setPage(0);
  };

  const getAvailabilityStatus = (book) => {
    const available = book.total_copies - book.loaned_copies;
    return {
      available: available > 0,
      count: available,
      total: book.total_copies
    };
  };

  const formatPublicationYear = (year) => {
    if (!year) return 'Unknown';
    return new Date(year).getFullYear();
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
            Book Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage your library's book collection
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/books/add')}
          size="large"
        >
          Add New Book
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search books..."
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
          
          {/* Category Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Author Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Author"
              placeholder="Filter by author"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
            />
          </Grid>
          
          {/* Availability Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Availability</InputLabel>
              <Select
                value={availabilityFilter}
                label="Availability"
                onChange={(e) => setAvailabilityFilter(e.target.value)}
              >
                <MenuItem value="all">All Books</MenuItem>
                <MenuItem value="available">Available Only</MenuItem>
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

      {/* Books Table */}
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Books ({totalBooks})
          </Typography>
          {searchLoading && <CircularProgress size={20} />}
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>ISBN</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Availability</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {books.map((book) => {
                const availability = getAvailabilityStatus(book);
                return (
                  <TableRow key={book.book_id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {book.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>
                      <Chip
                        label={book.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {book.isbn || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatPublicationYear(book.publication_year)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={availability.available ? 'Available' : 'Not Available'}
                          color={availability.available ? 'success' : 'error'}
                          size="small"
                          icon={availability.available ? <CheckCircle /> : <Cancel />}
                        />
                        <Typography variant="caption" color="textSecondary">
                          ({availability.count}/{availability.total})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewBook(book.book_id)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Book">
                          <IconButton
                            size="small"
                            onClick={() => handleEditBook(book.book_id)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Book">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(book)}
                            disabled={book.loaned_copies > 0}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
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
          count={totalBooks}
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

      {/* View Book Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedBook && (
          <>
            <DialogTitle>
              <Typography variant="h5" component="div">
                {selectedBook.title}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                by {selectedBook.author}
              </Typography>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedBook.description || 'No description available.'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Category
                    </Typography>
                    <Chip
                      label={selectedBook.category}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Publication Year
                    </Typography>
                    <Typography variant="body1">
                      {formatPublicationYear(selectedBook.publication_year)}
                    </Typography>
                  </Box>
                  
                  {selectedBook.isbn && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        ISBN
                      </Typography>
                      <Typography variant="body1">
                        {selectedBook.isbn}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Copies
                    </Typography>
                    <Typography variant="body1">
                      {selectedBook.total_copies}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Loaned Copies
                    </Typography>
                    <Typography variant="body1">
                      {selectedBook.loaned_copies}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Available Copies
                    </Typography>
                    <Typography variant="body1">
                      {selectedBook.total_copies - selectedBook.loaned_copies}
                    </Typography>
                  </Box>
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
                  handleEditBook(selectedBook.book_id);
                }}
              >
                Edit Book
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
          {bookToDelete && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This action cannot be undone.
              </Alert>
              <Typography variant="body1">
                Are you sure you want to delete the book "{bookToDelete.title}" by {bookToDelete.author}?
              </Typography>
              {bookToDelete.loaned_copies > 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  This book cannot be deleted because it has {bookToDelete.loaned_copies} active loan(s).
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
            disabled={deleteLoading || (bookToDelete && bookToDelete.loaned_copies > 0)}
          >
            {deleteLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookManagement;