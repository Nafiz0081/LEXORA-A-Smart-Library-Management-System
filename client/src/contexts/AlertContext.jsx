import React, { createContext, useContext, useState } from 'react';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (message, severity = 'info', duration = 6000) => {
    const id = Date.now() + Math.random();
    const newAlert = {
      id,
      message,
      severity, // 'success', 'error', 'warning', 'info'
      duration,
      timestamp: new Date(),
    };

    setAlerts(prev => [...prev, newAlert]);

    // Auto-remove alert after duration
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }

    return id;
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  // Convenience methods for different alert types
  const showSuccess = (message, duration) => {
    return showAlert(message, 'success', duration);
  };

  const showError = (message, duration = 8000) => {
    return showAlert(message, 'error', duration);
  };

  const showWarning = (message, duration) => {
    return showAlert(message, 'warning', duration);
  };

  const showInfo = (message, duration) => {
    return showAlert(message, 'info', duration);
  };

  // Handle API errors with proper formatting
  const handleApiError = (error, defaultMessage = 'An error occurred') => {
    let message = defaultMessage;
    
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }
    
    return showError(message);
  };

  // Handle API success responses
  const handleApiSuccess = (response, defaultMessage = 'Operation successful') => {
    let message = defaultMessage;
    
    if (response.data?.message) {
      message = response.data.message;
    }
    
    return showSuccess(message);
  };

  const value = {
    alerts,
    showAlert,
    removeAlert,
    clearAllAlerts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    handleApiError,
    handleApiSuccess,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};