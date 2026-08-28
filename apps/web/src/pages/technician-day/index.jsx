import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { getMyDay, updateMyLocation } from 'api/technicians';

export default function TechnicianDay() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('idle');

  async function loadMyDay() {
    try {
      setLoading(true);
      setError('');

      const result = await getMyDay();
      setData(result);
    } catch {
      setError(err?.response?.data?.message || 'Failed to load your assignments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyDay();
  }, []);

  useEffect(() => {
    const assignments = data?.assignments || [];

    if (!data || assignments.length === 0) {
      setLocationStatus('no-active-job');
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }

    let intervalId;

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const result = await updateMyLocation(position.coords.latitude, position.coords.longitude);

            if (result?.shared) {
              setLocationStatus('sharing');
            } else if (result?.reason === 'NO_ACTIVE_JOB') {
              setLocationStatus('no-active-job');
            } else if (result?.reason === 'LOCATION_SHARING_DISABLED') {
              setLocationStatus('disabled');
            }
          } catch {
            setLocationStatus('error');
          }
        },
        (err) => {
          setLocationStatus('permission-denied');
        }
      );
    };

    const startReporting = () => {
      window.clearInterval(intervalId);

      sendLocation();

      const interval = document.hidden ? 120000 : 30000;

      intervalId = window.setInterval(sendLocation, interval);
    };

    const handleVisibilityChange = () => {
      startReporting();
    };

    startReporting();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [data]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4">My Day</Typography>

        <Paper sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>

          <Button sx={{ mt: 2 }} variant="contained" onClick={loadMyDay}>
            Try Again
          </Button>
        </Paper>
      </Stack>
    );
  }

  const technician = data?.technician;
  const assignments = data?.assignments || [];
  const tomorrowCount = data?.tomorrowCount || 0;

  function formatTime(value) {
    if (!value) return 'Not scheduled';

    return new Date(value).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function formatDate(value) {
    if (!value) return '';

    return new Date(value).toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function getPriorityLabel(priority) {
    return priority ? priority : 'No priority';
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">My Day</Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {formatDate(data?.date)}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Location:{' '}
          {locationStatus === 'sharing'
            ? 'Sharing'
            : locationStatus === 'permission-denied'
              ? 'Permission denied'
              : locationStatus === 'disabled'
                ? 'Location sharing is disabled'
                : locationStatus === 'no-active-job'
                  ? 'Not sharing — no active job'
                  : locationStatus === 'unsupported'
                    ? 'Location is not supported by this browser'
                    : locationStatus === 'error'
                      ? 'Unable to share location'
                      : 'Checking...'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-between">
          <Box>
            <Typography variant="h5">{technician?.user?.fullName || 'Technician'}</Typography>

            <Typography color="text.secondary">{technician?.employeeCode || 'No employee code'}</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Tomorrow
            </Typography>

            <Typography variant="h5">
              {tomorrowCount} assignment
              {tomorrowCount === 1 ? '' : 's'}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h5">Today's Assignments ({assignments.length})</Typography>

        {assignments.length === 0 ? (
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography>You have no assignments scheduled for today.</Typography>
          </Paper>
        ) : (
          <Paper sx={{ mt: 2 }}>
            <List disablePadding>
              {assignments.map((assignment, index) => (
                <Box key={assignment.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{ p: 3 }}
                    secondaryAction={
                      <Button component={Link} to={`/work-orders/${assignment.id}`} variant="outlined">
                        View
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 10 }}>
                          <Typography variant="h6">{assignment.reference}</Typography>

                          <Chip size="small" label={getPriorityLabel(assignment.priority)} />

                          {assignment.isOutdoor && <Chip size="small" label="Outdoor" variant="outlined" />}
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.75} sx={{ mt: 1 }}>
                          <Typography variant="body1">{assignment.title}</Typography>

                          <Typography variant="body2">
                            {formatTime(assignment.scheduledAt)}
                            {' : '}
                            {formatTime(assignment.scheduledEndAt)}
                          </Typography>

                          <Typography variant="body2">{assignment.site?.name || 'Site not specified'}</Typography>

                          <Typography variant="body2">{assignment.site?.address || 'No address available'}</Typography>

                          <Typography variant="body2">Client: {assignment.client?.name || 'No client specified'}</Typography>

                          <Typography variant="body2">Status: {assignment.status}</Typography>
                        </Stack>
                      }
                    />
                  </ListItem>

                  {index < assignments.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}

