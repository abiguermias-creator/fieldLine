import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import MainCard from 'components/MainCard';
import {
  cancelWorkOrder,
  getWorkOrderById,
  updateWorkOrder
} from 'api/workOrder';
import { getSkills } from 'api/skills';

const STATUS_LABELS = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled'
};

const PRIORITY_LABELS = {
  P1: 'P1 - Emergency',
  P2: 'P2 - Urgent',
  P3: 'P3 - Standard',
  P4: 'P4 - Scheduled'
};

function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
}

function getSlaStatus(value, completed) {
  if (!value) {
    return 'Not applicable';
  }

  if (completed) {
    return 'Completed';
  }

  const target = new Date(value).getTime();

  if (target < Date.now()) {
    return 'Overdue';
  }

  return 'On track';
}

function formatEventType(eventType) {
  const labels = {
    STATUS_CHANGED: 'changed the status',
    PRIORITY_CHANGED: 'changed the priority',
    TECHNICIAN_ASSIGNED: 'assigned a technician',
    EQUIPMENT_ASSIGNED: 'assigned equipment',
    WORK_ORDER_CREATED: 'created this work order',
    FIELD_CHANGED: 'changed a field',
    SKILLS_CHANGED: 'changed the required skills',
    WORK_ORDER_CANCELLED: 'cancelled this work order'
  };

  return (
    labels[eventType] ||
    eventType
      ?.toLowerCase()
      .replaceAll('_', ' ') ||
    'updated this work order'
  );
}

export default function WorkOrderDetail() {
  const { id } = useParams();

  const [workOrder, setWorkOrder] = useState(null);
  const [skills, setSkills] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(true);

  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] =
    useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editSkillIds, setEditSkillIds] = useState([]);
  const [editEstimatedDuration, setEditEstimatedDuration] =
    useState('');

  const [cancelDialogOpen, setCancelDialogOpen] =
    useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  async function loadWorkOrder() {
    try {
      setLoading(true);
      setError('');
      setNotFound(false);

      const data = await getWorkOrderById(id);

      if (!data) {
        setNotFound(true);
        return;
      }

      setWorkOrder(data);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to load work order.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      if (!id) {
        return;
      }

      await loadWorkOrder();

      try {
        setLoadingSkills(true);

        const response = await getSkills();

        setSkills(
          response.items ||
            response ||
            []
        );
      } catch (err) {
        console.error(err);
        setSkills([]);
      } finally {
        setLoadingSkills(false);
      }
    }

    loadData();
  }, [id]);

  function startEditing() {
    if (!workOrder) {
      return;
    }

    if (
      workOrder.status === 'CLOSED' ||
      workOrder.status === 'CANCELLED'
    ) {
      return;
    }

    setEditTitle(workOrder.title || '');

    setEditDescription(
      workOrder.description || ''
    );

    setEditPriority(workOrder.priority || '');

    setEditSkillIds(
      (workOrder.workOrderSkills || []).map(
        (item) => item.skillId
      )
    );

    setEditEstimatedDuration(
      workOrder.estimatedDuration !== null &&
        workOrder.estimatedDuration !== undefined
        ? String(workOrder.estimatedDuration)
        : ''
    );

    setSaveError('');
    setSuccessMessage('');
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setSaveError('');
  }

  async function handleSave() {
    if (!workOrder) {
      return;
    }

    if (!editTitle.trim()) {
      setSaveError('Title is required.');
      return;
    }

    if (editTitle.trim().length < 2) {
      setSaveError(
        'Title must be at least 2 characters.'
      );
      return;
    }

    if (editTitle.trim().length > 200) {
      setSaveError(
        'Title must not exceed 200 characters.'
      );
      return;
    }

    let estimatedDuration = null;

    if (editEstimatedDuration !== '') {
      const parsedDuration = Number(
        editEstimatedDuration
      );

      if (
        !Number.isInteger(parsedDuration) ||
        parsedDuration <= 0
      ) {
        setSaveError(
          'Estimated duration must be a positive whole number.'
        );
        return;
      }

      estimatedDuration = parsedDuration;
    }

    try {
      setSaving(true);
      setSaveError('');
      setSuccessMessage('');

      const updated = await updateWorkOrder(
        workOrder.id,
        {
          title: editTitle.trim(),
          description: editDescription,
          priority: editPriority,
          skillIds: editSkillIds,
          estimatedDuration
        }
      );

      setWorkOrder(updated);
      setEditing(false);

      setSuccessMessage(
        'Work order updated successfully.'
      );

      await loadWorkOrder();
    } catch (err) {
      console.error(err);

      if (err.response?.status === 409) {
        setSaveError(
          err.response?.data?.message ||
            'Closed or cancelled work orders cannot be edited.'
        );
      } else {
        setSaveError(
          err.response?.data?.message ||
            'Failed to update work order.'
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function openCancelDialog() {
    if (!workOrder) {
      return;
    }

    if (
      workOrder.status === 'COMPLETED' ||
      workOrder.status === 'CLOSED' ||
      workOrder.status === 'CANCELLED'
    ) {
      return;
    }

    setCancelReason('');
    setCancelError('');
    setCancelDialogOpen(true);
  }

  function closeCancelDialog() {
    if (cancelling) {
      return;
    }

    setCancelDialogOpen(false);
    setCancelReason('');
    setCancelError('');
  }

  async function handleCancelWorkOrder() {
    if (!workOrder) {
      return;
    }

    const reason = cancelReason.trim();

    if (!reason) {
      setCancelError(
        'A cancellation reason is required.'
      );
      return;
    }

    try {
      setCancelling(true);
      setCancelError('');
      setSuccessMessage('');

      await cancelWorkOrder(
        workOrder.id,
        reason
      );

      setCancelDialogOpen(false);
      setCancelReason('');

      setSuccessMessage(
        'Work order cancelled successfully.'
      );

      await loadWorkOrder();
    } catch (err) {
      console.error(err);

      if (err.response?.status === 409) {
        setCancelError(
          err.response?.data?.message ||
            'This work order cannot be cancelled.'
        );
      } else {
        setCancelError(
          err.response?.data?.message ||
            'Failed to cancel work order.'
        );
      }
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <Stack spacing={3}>
        <Typography variant="h4">
          Loading work order...
        </Typography>
      </Stack>
    );
  }

  if (notFound) {
    return (
      <Stack spacing={3}>
        <Alert severity="error">
          Work order not found.
        </Alert>

        <Button
          component={Link}
          to="/work-orders"
          variant="contained"
        >
          Back to Work Orders
        </Button>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={3}>
        <Alert severity="error">
          {error}
        </Alert>

        <Button
          component={Link}
          to="/work-orders"
          variant="contained"
        >
          Back to Work Orders
        </Button>
      </Stack>
    );
  }

  if (!workOrder) {
    return null;
  }

  const isLocked =
    workOrder.status === 'CLOSED' ||
    workOrder.status === 'CANCELLED';

  const isCancellationBlocked =
    workOrder.status === 'COMPLETED' ||
    workOrder.status === 'CLOSED' ||
    workOrder.status === 'CANCELLED';

  const technician =
    workOrder.technician?.user?.fullName ||
    'Unassigned';

  const equipment =
    workOrder.equipment?.name ||
    'Unassigned';

  const status =
    STATUS_LABELS[workOrder.status] ||
    workOrder.status;

  const priority =
    PRIORITY_LABELS[workOrder.priority] ||
    workOrder.priority;

  const events = workOrder.events || [];

  const selectedSkillNames = (
    workOrder.workOrderSkills || []
  )
    .map((item) => item.skill?.name)
    .filter(Boolean);

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <div>
          <Typography variant="h4">
            {workOrder.reference}
          </Typography>

          <Typography color="text.secondary">
            {workOrder.title}
          </Typography>
        </div>

        <Stack
          direction="row"
          spacing={1}
        >
          {!isLocked && !editing && (
            <Button
              variant="contained"
              onClick={startEditing}
            >
              Edit Work Order
            </Button>
          )}

          {!isCancellationBlocked && !editing && (
            <Button
              variant="outlined"
              color="error"
              onClick={openCancelDialog}
            >
              Cancel Work Order
            </Button>
          )}

          <Button
            component={Link}
            to="/work-orders"
            variant="outlined"
          >
            Back to Work Orders
          </Button>
        </Stack>
      </Stack>

      {successMessage && (
        <Alert severity="success">
          {successMessage}
        </Alert>
      )}

      {saveError && (
        <Alert severity="error">
          {saveError}
        </Alert>
      )}

      {editing ? (
        <MainCard title="Edit Work Order">
          <Stack spacing={3}>
            <TextField
              label="Title"
              value={editTitle}
              onChange={(event) =>
                setEditTitle(
                  event.target.value
                )
              }
              required
              fullWidth
              inputProps={{
                maxLength: 200
              }}
              helperText={`${editTitle.length}/200 characters`}
            />

            <TextField
              label="Description"
              value={editDescription}
              onChange={(event) =>
                setEditDescription(
                  event.target.value
                )
              }
              multiline
              rows={4}
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>
                Priority
              </InputLabel>

              <Select
                value={editPriority}
                label="Priority"
                onChange={(event) =>
                  setEditPriority(
                    event.target.value
                  )
                }
              >
                <MenuItem value="P1">
                  P1 - Emergency
                </MenuItem>

                <MenuItem value="P2">
                  P2 - Urgent
                </MenuItem>

                <MenuItem value="P3">
                  P3 - Standard
                </MenuItem>

                <MenuItem value="P4">
                  P4 - Scheduled
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>
                Required Skills
              </InputLabel>

              <Select
                multiple
                value={editSkillIds}
                label="Required Skills"
                onChange={(event) =>
                  setEditSkillIds(
                    event.target.value
                  )
                }
                disabled={loadingSkills}
                renderValue={(selected) =>
                  selected
                    .map((skillId) => {
                      const skill =
                        skills.find(
                          (item) =>
                            item.id ===
                            skillId
                        );

                      return (
                        skill?.name ||
                        skillId
                      );
                    })
                    .join(', ')
                }
              >
                {skills.map((skill) => (
                  <MenuItem
                    key={skill.id}
                    value={skill.id}
                  >
                    {skill.code} - {skill.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Estimated Duration (minutes)"
              type="number"
              value={
                editEstimatedDuration
              }
              onChange={(event) =>
                setEditEstimatedDuration(
                  event.target.value
                )
              }
              fullWidth
              inputProps={{
                min: 1,
                step: 1
              }}
            />

            <Stack
              direction="row"
              spacing={2}
            >
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </Button>

              <Button
                variant="outlined"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </MainCard>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <MainCard title="Work Order Details">
              <Stack spacing={2}>
                <Typography>
                  <strong>Reference:</strong>{' '}
                  {workOrder.reference}
                </Typography>

                <Typography>
                  <strong>Title:</strong>{' '}
                  {workOrder.title}
                </Typography>

                <Typography>
                  <strong>Description:</strong>{' '}
                  {workOrder.description ||
                    'No description'}
                </Typography>

                <Typography>
                  <strong>Status:</strong>{' '}
                  <Chip
                    label={status}
                    size="small"
                  />
                </Typography>

                <Typography>
                  <strong>Priority:</strong>{' '}
                  {priority}
                </Typography>

                <Typography>
                  <strong>Required skills:</strong>{' '}
                  {selectedSkillNames.length > 0
                    ? selectedSkillNames.join(', ')
                    : 'None'}
                </Typography>

                <Typography>
                  <strong>Estimated duration:</strong>{' '}
                  {workOrder.estimatedDuration
                    ? `${workOrder.estimatedDuration} minutes`
                    : 'Not set'}
                </Typography>

                {workOrder.cancellationReason && (
                  <Typography>
                    <strong>
                      Cancellation reason:
                    </strong>{' '}
                    {workOrder.cancellationReason}
                  </Typography>
                )}

                <Typography>
                  <strong>Created:</strong>{' '}
                  {formatDate(
                    workOrder.createdAt
                  )}
                </Typography>

                <Typography>
                  <strong>Updated:</strong>{' '}
                  {formatDate(
                    workOrder.updatedAt
                  )}
                </Typography>

                <Typography>
                  <strong>Scheduled:</strong>{' '}
                  {formatDate(
                    workOrder.scheduledAt
                  )}
                </Typography>

                <Typography>
                  <strong>Agreed date:</strong>{' '}
                  {formatDate(
                    workOrder.agreedDate
                  )}
                </Typography>
              </Stack>
            </MainCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <MainCard title="Assignment">
              <Stack spacing={2}>
                <Typography>
                  <strong>Technician:</strong>{' '}
                  {technician}
                </Typography>

                <Typography>
                  <strong>Equipment:</strong>{' '}
                  {equipment}
                </Typography>
              </Stack>
            </MainCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <MainCard title="Client">
              <Stack spacing={2}>
                <Typography>
                  <strong>Name:</strong>{' '}
                  {workOrder.client?.name ||
                    'Unknown'}
                </Typography>

                <Typography>
                  <strong>Email:</strong>{' '}
                  {workOrder.client?.email ||
                    'Not provided'}
                </Typography>

                <Typography>
                  <strong>Phone:</strong>{' '}
                  {workOrder.client?.phone ||
                    'Not provided'}
                </Typography>

                <Typography>
                  <strong>Contact:</strong>{' '}
                  {workOrder.client?.contactName ||
                    'Not provided'}
                </Typography>

                <Typography>
                  <strong>Address:</strong>{' '}
                  {workOrder.client?.address ||
                    'Not provided'}
                </Typography>
              </Stack>
            </MainCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <MainCard title="Site">
              <Stack spacing={2}>
                <Typography>
                  <strong>Name:</strong>{' '}
                  {workOrder.site?.name ||
                    'Unknown'}
                </Typography>

                <Typography>
                  <strong>Address:</strong>{' '}
                  {workOrder.site?.address ||
                    'Not provided'}
                </Typography>

                <Typography>
                  <strong>City:</strong>{' '}
                  {workOrder.site?.city ||
                    'Not provided'}
                </Typography>

                <Typography>
                  <strong>Access notes:</strong>{' '}
                  {workOrder.site?.accessNotes ||
                    'No access notes'}
                </Typography>

                <Typography>
                  <strong>Coordinates:</strong>{' '}
                  {workOrder.site?.latitude &&
                  workOrder.site?.longitude
                    ? `${workOrder.site.latitude}, ${workOrder.site.longitude}`
                    : 'Not set'}
                </Typography>
              </Stack>
            </MainCard>
          </Grid>

          <Grid item xs={12}>
            <MainCard title="SLA Targets">
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                >
                  <Typography>
                    <strong>
                      Response target:
                    </strong>{' '}
                    {formatDate(
                      workOrder.slaRespondBy
                    )}
                  </Typography>

                  <Chip
                    label={getSlaStatus(
                      workOrder.slaRespondBy,
                      workOrder.status ===
                        'COMPLETED'
                    )}
                    size="small"
                  />
                </Stack>

                <Divider />

                <Stack
                  direction="row"
                  justifyContent="space-between"
                >
                  <Typography>
                    <strong>
                      Resolution target:
                    </strong>{' '}
                    {formatDate(
                      workOrder.slaResolveBy
                    )}
                  </Typography>

                  <Chip
                    label={getSlaStatus(
                      workOrder.slaResolveBy,
                      workOrder.status ===
                        'COMPLETED'
                    )}
                    size="small"
                  />
                </Stack>
              </Stack>
            </MainCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <MainCard title="Work Logs">
              <Alert severity="info">
                No work logs recorded yet.
              </Alert>
            </MainCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <MainCard title="Photos">
              <Alert severity="info">
                No photos attached yet.
              </Alert>
            </MainCard>
          </Grid>

          <Grid item xs={12}>
            <MainCard title="Event Timeline">
              {events.length === 0 ? (
                <Alert severity="info">
                  No timeline events recorded yet.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {events.map((event) => (
                    <Stack
                      key={event.id}
                      spacing={0.5}
                    >
                      <Typography>
                        {event.actor?.fullName ||
                          'System'}{' '}
                        {formatEventType(
                          event.eventType
                        )}
                        {event.newValue
                          ? ` to ${event.newValue}`
                          : ''}
                        {event.createdAt
                          ? ` at ${new Date(
                              event.createdAt
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit'
                              }
                            )}`
                          : ''}
                      </Typography>

                      {event.oldValue && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Previous value:{' '}
                          {event.oldValue}
                        </Typography>
                      )}
                    </Stack>
                  ))}
                </Stack>
              )}
            </MainCard>
          </Grid>
        </Grid>
      )}

      <Dialog
        open={cancelDialogOpen}
        onClose={closeCancelDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Cancel Work Order
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              This will mark the work order as
              CANCELLED and end its active
              assignment.
            </Alert>

            <TextField
              label="Cancellation reason"
              value={cancelReason}
              onChange={(event) =>
                setCancelReason(
                  event.target.value
                )
              }
              multiline
              rows={4}
              fullWidth
              required
              error={Boolean(cancelError)}
              helperText={
                cancelError ||
                'Please provide a reason for cancelling this work order.'
              }
              disabled={cancelling}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={closeCancelDialog}
            disabled={cancelling}
          >
            Keep Work Order
          </Button>

          <Button
            onClick={handleCancelWorkOrder}
            variant="contained"
            color="error"
            disabled={cancelling}
          >
            {cancelling
              ? 'Cancelling...'
              : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}