import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  Book,
  People,
  Assignment,
  Assessment,
  LibraryBooks,
  PersonAdd,
  Login,
  Logout,
  Settings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, logout, isLibrarian } = useAuth();
  const { showSuccess } = useAlert();

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully');
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!isAuthenticated) {
      return [
        { text: 'Book Catalog', path: '/catalog', icon: <LibraryBooks /> },
        { text: 'Login', path: '/login', icon: <Login /> },
        { text: 'Register', path: '/register', icon: <PersonAdd /> },
      ];
    }

    const commonItems = [
      { text: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
      { text: 'Book Catalog', path: '/catalog', icon: <LibraryBooks /> },
      { text: 'My Loans', path: '/my-loans', icon: <Assignment /> },
    ];

    if (isLibrarian()) {
      return [
        ...commonItems,
        { divider: true },
        { text: 'Manage Books', path: '/manage-books', icon: <Book /> },
        { text: 'Manage Members', path: '/manage-members', icon: <People /> },
        { text: 'Manage Borrowings', path: '/manage-borrowings', icon: <Assignment /> },
        { text: 'Reports', path: '/reports', icon: <Assessment /> },
      ];
    }

    return commonItems;
  };

  const navigationItems = getNavigationItems();

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" component="div">
          LEXORA
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Smart Library System
        </Typography>
      </Box>
      <List>
        {navigationItems.map((item, index) => {
          if (item.divider) {
            return <Divider key={index} sx={{ my: 1 }} />;
          }
          
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem
              button
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              sx={{
                bgcolor: isActive ? 'primary.light' : 'transparent',
                color: isActive ? 'primary.contrastText' : 'inherit',
                '&:hover': {
                  bgcolor: isActive ? 'primary.light' : 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ color: isActive ? 'primary.contrastText' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" elevation={2}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 600,
            }}
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          >
            LEXORA
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navigationItems.map((item, index) => {
                if (item.divider) return null;
                
                const isActive = location.pathname === item.path;
                
                return (
                  <Button
                    key={item.text}
                    color="inherit"
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      bgcolor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    {item.text}
                  </Button>
                );
              })}
            </Box>
          )}

          {isAuthenticated && (
            <Box sx={{ ml: 2 }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
              >
                <MenuItem onClick={() => { handleNavigation('/profile'); handleProfileMenuClose(); }}>
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;