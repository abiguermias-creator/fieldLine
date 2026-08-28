import { useEffect, useState } from 'react';

import { Alert, Button, FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';

import MainCard from 'components/MainCard';
import { getSites } from 'api/site';
import { createClientRequest } from 'api/workOrder';

const priorityOptions = [
  {
    value: 'P1',
    label: 'P1 - Emergency',
    description: 'For emergencies requiring immediate attention.',
    target: 'Response within 1 hour.'
  },
  {
    value: 'P2',
    label: 'P2 - Urgent',
    description: 'For urgent issues that need quick attention.',
    target: 'Response within 4 hours.'
  },
  {
    value: 'P3',
    label: 'P3 - Standard',
    description: 'For standard service requests.',
    target: 'Response within 24 hours.'
  },
  {
    value: 'P4',
    label: 'P4 - Scheduled',
    description: 'For work that can be planned for an agreed date.',
    target: 'Response target is not set.'
  }
];

export default function ClientRequest() {
  const [sites, setSites] = useState([]);

  const [siteId, setSiteId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');

  const [p1Confirmed, setP1Confirmed] = useState(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [possibleDuplicate, setPossibleDuplicate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createdRequest, setCreatedRequest] = useState(null);

  useEffect(() => {
    async function loadSites() {
      try {
        const response = await getSites();

        setSites(response.items || response || []);
      } catch {
        setError('Failed to load your company sites.');
      } finally {
        setLoadingSites(false);
      }
    }

    loadSites();
  }, []);

  function handlePriorityChange(event) {
    const value = event.target.value;

    setPriority(value);
    setP1Confirmed(false);
  }

  async function submitRequest(confirmedDuplicate = false) {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const result = await createClientRequest({
        siteId,
        title,
        description,
        priority,
        p1Confirmed,
        duplicateConfirmed: confirmedDuplicate
      });

      setCreatedRequest(result);
      setPossibleDuplicate(null);
      setMessage('Request submitted successfully.');

      setSiteId('');
      setTitle('');
      setDescription('');
      setPriority('');
      setP1Confirmed(false);
      setDuplicateConfirmed(false);
    } catch {

      const responseData = err.response?.data;

      if (responseData?.code === 'POSSIBLE_DUPLICATE') {
        setPossibleDuplicate(responseData.duplicate);
        setDuplicateConfirmed(false);
        setError('');
        return;
      }

      setError(responseData?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setMessage('');
    setCreatedRequest(null);

    if (!siteId || !title || !priority) {
      setError('Please fill in all required fields.');
      return;
    }

    if (title.length > 200) {
      setError('Title must not exceed 200 characters.');
      return;
    }

    if (priority === 'P1' && !p1Confirmed) {
      setError('P1 is an emergency priority. Please confirm the P1 requirement before submitting.');
      return;
    }

    await submitRequest(duplicateConfirmed);
  }

  function handleDifferentProblem() {
    setDuplicateConfirmed(true);
    setPossibleDuplicate(null);

    submitRequest(true);
  }

  function handleSameProblem() {
    setPossibleDuplicate(null);
    setDuplicateConfirmed(false);

    setMessage(
      `This appears to be the same problem as ${possibleDuplicate?.reference || 'the existing work order'}. No duplicate request was created.`
    );
  }

  const selectedPriority = priorityOptions.find((option) => option.value === priority);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Create Service Request</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {message && <Alert severity="success">{message}</Alert>}

      {possibleDuplicate && (
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>
            Possible duplicate work order
          </Typography>

          <Typography variant="body2">
            We found an existing work order at this site with a similar title created recently. Is this the same problem?
          </Typography>

          <Stack spacing={1} sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Reference:</strong> {possibleDuplicate.reference || 'Unknown'}
            </Typography>

            <Typography variant="body2">
              <strong>Title:</strong> {possibleDuplicate.title || 'Unknown'}
            </Typography>

            {possibleDuplicate.status && (
              <Typography variant="body2">
                <strong>Status:</strong> {possibleDuplicate.status}
              </Typography>
            )}

            {possibleDuplicate.createdAt && (
              <Typography variant="body2">
                <strong>Created:</strong> {new Date(possibleDuplicate.createdAt).toLocaleString()}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleSameProblem} disabled={loading}>
              Same problem
            </Button>

            <Button variant="outlined" onClick={handleDifferentProblem} disabled={loading}>
              Different problem
            </Button>
          </Stack>
        </Alert>
      )}

      {createdRequest && (
        <Alert severity="success">
          <strong>Reference: {createdRequest.reference}</strong>

          {createdRequest.responseTarget && (
            <>
              <br />
              Response target:{' '}
              {new Date(createdRequest.responseTarget).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </>
          )}
        </Alert>
      )}

      <MainCard title="New Service Request">
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <FormControl fullWidth required disabled={loadingSites}>
              <InputLabel>Site</InputLabel>

              <Select value={siteId} label="Site" onChange={(event) => setSiteId(event.target.value)}>
                {sites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name}
                  </MenuItem>
                ))}
              </Select>

              <FormHelperText>Only sites belonging to your company are available.</FormHelperText>
            </FormControl>

            <TextField
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              fullWidth
              inputProps={{ maxLength: 200 }}
              helperText={`${title.length}/200 characters`}
            />

            <TextField
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              rows={4}
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>Priority</InputLabel>

              <Select value={priority} label="Priority" onChange={handlePriorityChange}>
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              {selectedPriority && (
                <FormHelperText>
                  {selectedPriority.description} {selectedPriority.target}
                </FormHelperText>
              )}
            </FormControl>

            {priority === 'P1' && (
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>P1 means Emergency.</strong>
                  <br />
                  Use P1 only when the issue requires immediate attention. The response target is within 1 hour.
                </Typography>

                <Button
                  type="button"
                  variant={p1Confirmed ? 'outlined' : 'contained'}
                  sx={{ mt: 2 }}
                  onClick={() => setP1Confirmed(!p1Confirmed)}
                >
                  {p1Confirmed ? 'P1 Confirmed' : 'Confirm P1 Emergency'}
                </Button>
              </Alert>
            )}

            <Button type="submit" variant="contained" disabled={loading || loadingSites || (priority === 'P1' && !p1Confirmed)}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Stack>
        </form>
      </MainCard>
    </Stack>
  );
}

