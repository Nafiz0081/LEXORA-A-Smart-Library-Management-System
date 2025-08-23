import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  FilterList,
  Book,
  Person,
  Category,
  CheckCircle,
  Cancel,
  Visibility,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import axios from 'axios';

const BookCatalog = () => {
  const { isAuthenticated, isMember } = useAuth();
  const { showError, showSuccess } = useAlert();
  
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const booksPerPage = 12;

  useEffect(() => {
    fetchCategories();
    fetchBooks();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (currentPage === 1) {
        fetchBooks();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedCategory, authorFilter, availabilityFilter]);

  useEffect(() => {
    fetchBooks();
  }, [currentPage]);

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
        page: currentPage,
        limit: booksPerPage,
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
      setTotalPages(data.totalPages || 1);
      setTotalBooks(data.total || 0);
    } catch (err) {
      console.error('Error fetching books:', err);
      showError('Failed to fetch books');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleBookClick = async (bookId) => {
    try {
      const response = await axios.get(`/api/books/${bookId}`);
      setSelectedBook(response.data.book);
      setDialogOpen(true);
    } catch (err) {
      console.error('Error fetching book details:', err);
      showError('Failed to fetch book details');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBook(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setAuthorFilter('');
    setAvailabilityFilter('all');
    setCurrentPage(1);
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Book Catalog
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Discover and explore our collection of {totalBooks} books
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search books by title, author, or ISBN..."
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
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
      </Box>

      {/* Results Info */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          {searchLoading ? 'Searching...' : `Showing ${books.length} of ${totalBooks} books`}
        </Typography>
        {searchLoading && <CircularProgress size={20} />}
      </Box>

      {/* Books Grid */}
      {books.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {books.map((book) => {
              const availability = getAvailabilityStatus(book);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={book.book_id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => handleBookClick(book.book_id)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" component="h3" gutterBottom noWrap>
                          {book.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          by {book.author}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={book.category}
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={<Category />}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          Published: {formatPublicationYear(book.publication_year)}
                        </Typography>
                        {book.isbn && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            ISBN: {book.isbn}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Chip
                          label={availability.available ? 'Available' : 'Not Available'}
                          color={availability.available ? 'success' : 'error'}
                          size="small"
                          icon={availability.available ? <CheckCircle /> : <Cancel />}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {availability.count}/{availability.total} copies
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookClick(book.book_id);
                        }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, page) => setCurrentPage(page)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Book sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No books found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search criteria or filters
          </Typography>
        </Box>
      )}

      {/* Book Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
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
                      icon={<Category />}
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
                      Availability
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={getAvailabilityStatus(selectedBook).available ? 'Available' : 'Not Available'}
                        color={getAvailabilityStatus(selectedBook).available ? 'success' : 'error'}
                        size="small"
                        icon={getAvailabilityStatus(selectedBook).available ? <CheckCircle /> : <Cancel />}
                      />
                      <Typography variant="body2" color="textSecondary">
                        ({getAvailabilityStatus(selectedBook).count}/{getAvailabilityStatus(selectedBook).total} copies)
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseDialog}>
                Close
              </Button>
              {isAuthenticated && isMember() && getAvailabilityStatus(selectedBook).available && (
                <Button
                  variant="contained"
                  onClick={() => {
                    // This would typically navigate to a borrowing request page
                    // For now, we'll just show a message
                    showSuccess('Please visit the library to borrow this book.');
                    handleCloseDialog();
                  }}
                >
                  Request to Borrow
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default BookCatalog;