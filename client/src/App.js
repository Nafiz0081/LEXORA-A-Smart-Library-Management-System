import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AlertSnackbar from './components/common/AlertSnackbar';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import BookCatalog from './components/books/BookCatalog';
import BookManagement from './components/books/BookManagement';
import AddBook from './components/books/AddBook';
import EditBook from './components/books/EditBook';
import MemberManagement from './components/members/MemberManagement';
import AddMember from './components/members/AddMember';
import EditMember from './components/members/EditMember';
import BorrowingManagement from './components/borrowings/BorrowingManagement';
import MemberBorrowings from './components/borrowings/MemberBorrowings';
import './App.css';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AlertProvider>
          <Router>
            <div className="App">
              <Navbar />
              <main className="main-content">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/catalog" element={<BookCatalog />} />
  
                  
                  {/* Protected Routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  

                  
                  {/* Protected Routes - Members only */}
                  <Route
                    path="/my-borrowings"
                    element={
                      <ProtectedRoute allowedRoles={['member']}>
                        <MemberBorrowings />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Protected Routes - Librarians only */}
                  <Route
                    path="/books"
                    element={
                      <ProtectedRoute allowedRoles={['librarian']}>
                        <BookManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/books/add"
                    element={
                      <ProtectedRoute allowedRoles={['librarian']}>
                        <AddBook />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/books/edit/:bookId"
                    element={
                      <ProtectedRoute allowedRoles={['librarian']}>
                        <EditBook />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/members"
                    element={
                      <ProtectedRoute allowedRoles={['librarian']}>
                        <MemberManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/members/add"
                    element={
                      <ProtectedRoute allowedRoles={['librarian']}>
                        <AddMember />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/members/edit/:memberId"
                    element={
                      <ProtectedRoute allowedRoles={['librarian']}>
                        <EditMember />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/borrowings"
                    element={
                      <ProtectedRoute allowedRoles={['librarian']}>
                        <BorrowingManagement />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <AlertSnackbar />
            </div>
          </Router>
        </AlertProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;