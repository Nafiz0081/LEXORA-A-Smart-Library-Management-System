import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  Stack
} from '@mui/material';
import { useAlert } from '../../contexts/AlertContext';

function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

const AlertSnackbar = () => {
  const { alerts, removeAlert } = useAlert();

  const handleClose = (alertId) => {
    removeAlert(alertId);
  };

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      {alerts.map((alert) => (
        <Snackbar
          key={alert.id}
          open={true}
          autoHideDuration={alert.duration > 0 ? alert.duration : null}
          onClose={() => handleClose(alert.id)}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => handleClose(alert.id)}
            severity={alert.severity}
            variant="filled"
            sx={{
              width: '100%',
              boxShadow: 3,
              '& .MuiAlert-message': {
                fontSize: '0.875rem',
                lineHeight: 1.4,
              },
            }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
};

export default AlertSnackbar;