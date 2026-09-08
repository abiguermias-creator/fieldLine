import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TRANSITIONS } from '@fieldline/shared';

import {
  Alert,
  Box,
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
  getWorkOrderById,
  updateWorkOrder,
  cancelWorkOrder,
  getAssignmentOptions,
  unassignWorkOrder,
  moveWorkOrderStatus,
  markWorkOrderWaitingOnParts,
  createWorkLog,
  getWorkLogs,
  getWorkOrderPhotos,
  uploadWorkOrderPhoto,
} from 'api/workOrder';
import { getSkills } from 'api/skills';
import { useAuth } from 'contexts/AuthContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || '';

const STATUS_LABELS = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  EN_ROUTE: 'En route',
  ON_SITE: 'On site',
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

function getSlaStatus(
  value,
  completed,
  responseMet = false
) {
  if (!value) {
    return 'Not applicable';
  }

  if (responseMet) {
    return 'Met';
  }

  if (completed) {
    return 'Met';
  }

  const minutesRemaining =
    (new Date(value).getTime() - Date.now()) /
    60000;

  if (minutesRemaining <= 0) {
    return 'Breached';
  }

  if (minutesRemaining < 30) {
    return 'At risk';
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

  const { user } = useAuth();
  const isSupervisor = user?.role === 'SUPERVISOR';

  const [workOrder, setWorkOrder] = useState(null);
  const [skills, setSkills] = useState([]);
  const [assignmentOptions, setAssignmentOptions] = useState(null);

const [workLogs, setWorkLogs] = useState([]);
const [loadingWorkLogs, setLoadingWorkLogs] = useState(true);
const [workOrderPhotos, setWorkOrderPhotos] = useState([]);
const [loadingPhotos, setLoadingPhotos] = useState(true);
const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
const [photoUploading, setPhotoUploading] = useState(false);
const [photoError, setPhotoError] = useState('');
const [photoSuccess, setPhotoSuccess] = useState('');
const [workLogNote, setWorkLogNote] = useState('');
const [workLogMinutes, setWorkLogMinutes] = useState('');
const [workLogParts, setWorkLogParts] = useState('');
const [workLogSaving, setWorkLogSaving] = useState(false);
const [workLogError, setWorkLogError] = useState('');
const [workLogSuccess, setWorkLogSuccess] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingAssignmentOptions, setLoadingAssignmentOptions] =
    useState(true);

  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusActionSaving, setStatusActionSaving] = useState(false);
  const [statusActionError, setStatusActionError] = useState('');

   const [waitingOnPartsDialogOpen, setWaitingOnPartsDialogOpen] =
  useState(false);
const [waitingOnPartsDescription, setWaitingOnPartsDescription] =
  useState('');
const [waitingOnPartsSaving, setWaitingOnPartsSaving] =
  useState(false);
const [waitingOnPartsError, setWaitingOnPartsError] =
  useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSaving, setOverrideSaving] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsOutdoor, setEditIsOutdoor] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editSkillIds, setEditSkillIds] = useState([]);
  const [editEstimatedDuration, setEditEstimatedDuration] =
    useState('');
    const [editScheduledAt, setEditScheduledAt] = useState('');
const [editScheduledEndAt, setEditScheduledEndAt] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] =
  useState('');
  const [unassignDialogOpen, setUnassignDialogOpen] =
  useState(false);
const [unassignReason, setUnassignReason] =
  useState('');
const [unassignError, setUnassignError] =
  useState('');
const [unassignSaving, setUnassignSaving] =
  useState(false);
const [assigningTechnician, setAssigningTechnician] =
  useState(false);
const [assignmentError, setAssignmentError] =
  useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] =
  useState('');
const [assigningEquipment, setAssigningEquipment] =
  useState(false);
const [equipmentAssignmentError, setEquipmentAssignmentError] =
  useState('');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
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

  async function loadAssignmentOptions() {
    if (!id) {
      return;
    }

    try {
      setLoadingAssignmentOptions(true);

      const data = await getAssignmentOptions(id);
setAssignmentOptions(data);
    } catch {
setAssignmentOptions(null);
    } finally {
      setLoadingAssignmentOptions(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      if (!id) {
        return;
      }

      await loadWorkOrder();
      await loadAssignmentOptions();
      await loadWorkLogs();
      await loadWorkOrderPhotos();

      try {
        setLoadingSkills(true);

        const response = await getSkills();

        setSkills(
          response.items ||
            response ||
            []
        );
      } catch {
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

    setEditDescription(workOrder.description || '');
    setEditIsOutdoor(Boolean(workOrder.isOutdoor));
    setEditStatus(workOrder.status || '');
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
    setEditScheduledAt(
  workOrder.scheduledAt
    ? new Date(workOrder.scheduledAt)
        .toISOString()
        .slice(0, 16)
    : ''
);

setEditScheduledEndAt(
  workOrder.scheduledEndAt
    ? new Date(workOrder.scheduledEndAt)
        .toISOString()
        .slice(0, 16)
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
    isOutdoor: editIsOutdoor,
    status: editStatus,
    priority: editPriority,
    skillIds: editSkillIds,
    estimatedDuration,
    scheduledAt:
  editStatus === 'TRIAGED' && editScheduledAt
    ? new Date(editScheduledAt).toISOString()
    : undefined,

scheduledEndAt:
  editStatus === 'TRIAGED' && editScheduledEndAt
    ? new Date(editScheduledEndAt).toISOString()
    : undefined
  }
);

      setWorkOrder(updated);
      setEditing(false);

      setSuccessMessage(
        'Work order updated successfully.'
      );

      await loadWorkOrder();
        } catch (err) {

      if (
        err.response?.status === 409 &&
        err.response?.data?.code === 'DAILY_HOURS_EXCEEDED'
      ) {
        setSaveError(err.response.data.message);

        if (isSupervisor) {
          setOverrideReason('');
          setOverrideDialogOpen(true);
        }

        return;
      }

      if (err.response?.status === 409) {
  setSaveError(
    err.response?.data?.message ||
      'The work order could not be updated because the assignment changed.'
  );

  await loadWorkOrder();
  await loadAssignmentOptions();

  return;
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

  async function loadWorkLogs() {
  try {
    setLoadingWorkLogs(true);
    setWorkLogError('');

    const data = await getWorkLogs(id);

    setWorkLogs(data?.logs || []);
  } catch (err) {
    setWorkLogError(
      err?.response?.data?.message ||
        'Failed to load work logs.'
    );
  } finally {
    setLoadingWorkLogs(false);
  }
}

  async function handleCreateWorkLog() {
    if (!workOrder) {
      return;
    }

    if (!workLogNote.trim()) {
      setWorkLogError('Note is required.');
      return;
    }

    const minutes = Number(workLogMinutes);

    if (!Number.isInteger(minutes) || minutes <= 0) {
      setWorkLogError(
        'Minutes spent must be a whole number greater than zero.'
      );
      return;
    }

    try {
      setWorkLogSaving(true);
      setWorkLogError('');
      setWorkLogSuccess('');

      await createWorkLog(workOrder.id, {
        note: workLogNote.trim(),
        minutesSpent: minutes,
        partsUsed: workLogParts.trim() || undefined
      });

      setWorkLogNote('');
      setWorkLogMinutes('');
      setWorkLogParts('');

      await loadWorkLogs();

      setWorkLogSuccess('Work log added successfully.');
    } catch (err) {

      setWorkLogError(
        err?.response?.data?.message ||
          'Failed to add work log.'
      );
    } finally {
      setWorkLogSaving(false);
    }
  }

  async function loadWorkOrderPhotos() {
  try {
    setLoadingPhotos(true);
    setPhotoError('');

    const data = await getWorkOrderPhotos(id);

    setWorkOrderPhotos(data || []);
  } catch (err) {

    setPhotoError(
      err?.response?.data?.message ||
        'Failed to load photos.'
    );
  } finally {
    setLoadingPhotos(false);
  }
}

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoError('');
    setPhotoSuccess('');

    if (!file.type.startsWith('image/')) {
      setSelectedPhotoFile(null);
      setPhotoPreviewUrl('');
      setPhotoError('Only image files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectedPhotoFile(null);
      setPhotoPreviewUrl('');
      setPhotoError('Photo must be 10 MB or smaller.');
      return;
    }

    if (photoPreviewUrl) {
  URL.revokeObjectURL(photoPreviewUrl);
}

setSelectedPhotoFile(file);
setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUploadPhoto() {
    if (!workOrder || !selectedPhotoFile) {
      return;
    }

    try {
      setPhotoUploading(true);
      setPhotoError('');
      setPhotoSuccess('');

      await uploadWorkOrderPhoto(
        workOrder.id,
        selectedPhotoFile
      );

      setSelectedPhotoFile(null);

if (photoPreviewUrl) {
  URL.revokeObjectURL(photoPreviewUrl);
}

setPhotoPreviewUrl('');

setPhotoSuccess(
  'Photo uploaded successfully.'
);

      await loadWorkOrderPhotos();
    } catch (err) {

      setPhotoError(
        err?.response?.data?.message ||
          'Failed to upload photo. You can retry.'
      );
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleDailyHoursOverride() {
    if (!workOrder || !overrideReason.trim()) {
      return;
    }

    try {
      setOverrideSaving(true);
      setSaveError('');

      const updated = await updateWorkOrder(workOrder.id, {
        title: editTitle.trim(),
        description: editDescription,
        status: editStatus,
        priority: editPriority,
        skillIds: editSkillIds,
        estimatedDuration:
          editEstimatedDuration !== ''
            ? Number(editEstimatedDuration)
            : null,
        scheduledAt: editScheduledAt
          ? new Date(editScheduledAt).toISOString()
          : null,
        scheduledEndAt: editScheduledEndAt
          ? new Date(editScheduledEndAt).toISOString()
          : null,
        overrideDailyHours: true,
        overrideReason: overrideReason.trim()
      });

      setWorkOrder(updated);
      setOverrideDialogOpen(false);
      setOverrideReason('');
      setEditing(false);

      setSuccessMessage(
        'Work order updated with daily hours override.'
      );

      await loadWorkOrder();
    } catch (err) {

      setSaveError(
        err.response?.data?.message ||
          'Failed to override daily working hours.'
      );
    } finally {
      setOverrideSaving(false);
    }
  }

  async function handleAssignTechnician() {
  if (!workOrder || !selectedTechnicianId) {
    return;
  }

  try {
    setAssigningTechnician(true);
    setAssignmentError('');
    setSuccessMessage('');

    const updated = await updateWorkOrder(
      workOrder.id,
      {
        technicianId: selectedTechnicianId
      }
    );

    setWorkOrder(updated);
    setSelectedTechnicianId('');

    setSuccessMessage(
      'Technician assigned successfully.'
    );

    await loadAssignmentOptions();
  } catch (err) {

    setAssignmentError(
      err.response?.data?.message ||
        'Failed to assign technician.'
    );
  } finally {
    setAssigningTechnician(false);
  }
}

async function handleMoveWorkOrderStatus() {
  if (!workOrder) {
    return;
  }

  try {
    setStatusActionSaving(true);
    setStatusActionError('');
    setSuccessMessage('');

    const action =
  workOrder.status === 'ON_HOLD'
    ? 'resume'
    : workOrder.status === 'IN_PROGRESS'
      ? 'complete'
      : undefined;

            const updated = await moveWorkOrderStatus(
        workOrder.id,
        action
      );

      setWorkOrder(updated);

      setSuccessMessage(
        'Work order status updated successfully.'
      );
    } catch (err) {

    setStatusActionError(
      err.response?.data?.message ||
        'Failed to update work order status.'
    );
  } finally {
    setStatusActionSaving(false);
  }
}

async function handleMarkWaitingOnParts() {
  if (!workOrder) {
    return;
  }

  if (!waitingOnPartsDescription.trim()) {
    setWaitingOnPartsError(
      'Description is required.'
    );
    return;
  }

  try {
    setWaitingOnPartsSaving(true);
    setWaitingOnPartsError('');
    setSuccessMessage('');

    const updated =
      await markWorkOrderWaitingOnParts(
        workOrder.id,
        waitingOnPartsDescription.trim(),
      );

    setWorkOrder(updated);
    setWaitingOnPartsDialogOpen(false);
    setWaitingOnPartsDescription('');

    setSuccessMessage(
      'Work order marked as waiting on parts.'
    );
  } catch (err) {

    setWaitingOnPartsError(
      err.response?.data?.message ||
        'Failed to mark work order as waiting on parts.'
    );
  } finally {
    setWaitingOnPartsSaving(false);
  }
}

async function handleUnassign() {
  if (!workOrder) {
    return;
  }

  if (!unassignReason.trim()) {
    setUnassignError(
      'Unassignment reason is required.'
    );
    return;
  }

  try {
    setUnassignSaving(true);
    setUnassignError('');
    setSuccessMessage('');

    const updated = await unassignWorkOrder(
      workOrder.id,
      unassignReason.trim(),
    );

    setWorkOrder(updated);
    setUnassignDialogOpen(false);
    setUnassignReason('');

    setSuccessMessage(
      'Technician unassigned successfully.',
    );

    await loadAssignmentOptions();
  } catch (err) {

    setUnassignError(
      err.response?.data?.message ||
        'Failed to unassign technician.',
    );
  } finally {
    setUnassignSaving(false);
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

  async function handleAssignEquipment() {
  if (!workOrder || !selectedEquipmentId) {
    return;
  }

  try {
    setAssigningEquipment(true);
    setEquipmentAssignmentError('');
    setSuccessMessage('');

    const updated = await updateWorkOrder(
      workOrder.id,
      {
        equipmentId: selectedEquipmentId
      }
    );

    setWorkOrder(updated);
    setSelectedEquipmentId('');

    setSuccessMessage(
      'Equipment assigned successfully.'
    );

    await loadAssignmentOptions();
  } catch (err) {

    setEquipmentAssignmentError(
      err.response?.data?.message ||
        'Failed to assign equipment.'
    );
  } finally {
    setAssigningEquipment(false);
  }
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

    const isAssignedTechnician =
  user?.role === 'TECHNICIAN' &&
  workOrder.technician?.user?.id === user?.id;

    const technicianNextStatus =
    TRANSITIONS[workOrder.status]?.find((status) =>
      ['EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED'].includes(status)
    );

const statusActionLabel =
  {
    EN_ROUTE: 'On my way',
    ON_SITE: 'I have arrived',
    IN_PROGRESS: 'Start work',
    COMPLETED: 'Mark complete'
  }[technicianNextStatus];

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

  const availableTechnicians =
    assignmentOptions?.available || [];

  const unavailableTechnicians =
    assignmentOptions?.notAvailable || [];

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

      {statusActionError && (
  <Alert severity="error">
    {statusActionError}
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
  <InputLabel>Status</InputLabel>

  <Select
    value={editStatus}
    label="Status"
    onChange={(event) =>
      setEditStatus(event.target.value)
    }
  >
    <MenuItem value="NEW">New</MenuItem>
    <MenuItem value="TRIAGED">Triaged</MenuItem>
    <MenuItem value="ASSIGNED">Assigned</MenuItem>
    <MenuItem value="SCHEDULED">Scheduled</MenuItem>
    <MenuItem value="IN_PROGRESS">In progress</MenuItem>
    <MenuItem value="COMPLETED">Completed</MenuItem>
    <MenuItem value="CLOSED">Closed</MenuItem>
    <MenuItem value="CANCELLED">Cancelled</MenuItem>
  </Select>
</FormControl>

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

          <TextField
  label="Scheduled Start"
  type="datetime-local"
  value={editScheduledAt}
  onChange={(event) =>
    setEditScheduledAt(event.target.value)
  }
  fullWidth
  InputLabelProps={{
    shrink: true
  }}
/>

<TextField
  label="Scheduled End"
  type="datetime-local"
  value={editScheduledEndAt}
  onChange={(event) =>
    setEditScheduledEndAt(event.target.value)
  }
  fullWidth
  InputLabelProps={{
    shrink: true
  }}
/>
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

                <Stack
  direction="row"
  spacing={1}
  alignItems="center"
  flexWrap="wrap"
>
  <Typography>
    <strong>Status:</strong>{' '}
    <Chip
      label={status}
      size="small"
    />
  </Typography>

 {isAssignedTechnician &&
  statusActionLabel && (
    <>
      <Button
        variant="contained"
        size="small"
        onClick={handleMoveWorkOrderStatus}
        disabled={statusActionSaving || waitingOnPartsSaving}
      >
        {statusActionSaving
          ? 'Updating...'
          : statusActionLabel}
      </Button>

      {statusActionError && (
  <Typography color="error">
    {statusActionError}
  </Typography>
)}

      {workOrder.status === 'IN_PROGRESS' && (
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setWaitingOnPartsError('');
            setWaitingOnPartsDescription('');
            setWaitingOnPartsDialogOpen(true);
          }}
          disabled={statusActionSaving || waitingOnPartsSaving}
        >
          Waiting on parts
        </Button>
      )}
      {workOrder.status === 'IN_PROGRESS' && (
  <Button
    variant="outlined"
    size="small"
    onClick={async () => {
      try {
        setStatusActionSaving(true);
        setStatusActionError('');
        setSuccessMessage('');

        const action = 'hold';

const updated =
  await moveWorkOrderStatus(
    workOrder.id,
    action
  );

        setWorkOrder(updated);

        setSuccessMessage(
          'Work order put on hold.'
        );
      } catch (err) {

        setStatusActionError(
          err.response?.data?.message ||
            'Failed to put work order on hold.'
        );
      } finally {
        setStatusActionSaving(false);
      }
    }}
    disabled={
      statusActionSaving ||
      waitingOnPartsSaving
    }
  >
    On hold
  </Button>
)}
    </>
  )}
</Stack>

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

                {workOrder.dailyHoursOverride && (
  <Stack spacing={0.5}>
    <Typography>
      <strong>Override:</strong>{' '}
      <Chip
        label="Daily hours override"
        color="warning"
        size="small"
      />
    </Typography>

    {workOrder.dailyHoursOverrideReason && (
      <Typography
        variant="body2"
        color="text.secondary"
      >
        Reason: {workOrder.dailyHoursOverrideReason}
      </Typography>
    )}
  </Stack>
)}

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

                {workOrder.technicianId && (
  <Button
    variant="outlined"
    color="error"
    onClick={() => {
      setUnassignReason('');
      setUnassignError('');
      setUnassignDialogOpen(true);
    }}
  >
    Unassign technician
  </Button>
)}

          <FormControl fullWidth>
  <InputLabel>Assign Technician</InputLabel>

  <Select
    value={selectedTechnicianId}
    label="Assign Technician"
    onChange={(event) => {
      setSelectedTechnicianId(event.target.value);
      setAssignmentError('');
    }}
    disabled={
      assigningTechnician ||
      loadingAssignmentOptions ||
      isLocked
    }
  >
    <MenuItem value="">
      <em>Select technician</em>
    </MenuItem>

    {availableTechnicians
      .filter(
        (option) =>
          option.hasRequiredSkills === true
      )
      .map((option) => (
        <MenuItem
          key={option.id}
          value={option.id}
        >
          {option.name ||
            option.technician?.user?.fullName ||
            option.technicianName ||
            option.user?.fullName ||
            'Unknown technician'}
        </MenuItem>
      ))}
  </Select>
</FormControl>

{assignmentError && (
  <Alert severity="error">
    {assignmentError}
  </Alert>
)}

<Button
  variant="contained"
  onClick={handleAssignTechnician}
  disabled={
    !selectedTechnicianId ||
    assigningTechnician ||
    isLocked
  }
>
  {assigningTechnician
    ? 'Assigning...'
    : 'Assign Technician'}
</Button>

                <Typography>
                  <strong>Equipment:</strong>{' '}
                  {equipment}
                </Typography>

          <FormControl fullWidth>
  <InputLabel>Assign Equipment</InputLabel>

  <Select
    value={selectedEquipmentId}
    label="Assign Equipment"
    onChange={(event) => {
      setSelectedEquipmentId(event.target.value);
      setEquipmentAssignmentError('');
    }}
    disabled={
      assigningEquipment ||
      loadingAssignmentOptions ||
      isLocked
    }
  >
    <MenuItem value="">
      <em>Select equipment</em>
    </MenuItem>

    {(assignmentOptions?.equipment || [])
      .filter(
        (option) =>
          option.available === true
      )
      .map((option) => (
        <MenuItem
          key={option.id}
          value={option.id}
        >
          {option.code} - {option.name}
        </MenuItem>
      ))}
  </Select>
</FormControl>

{equipmentAssignmentError && (
  <Alert severity="error">
    {equipmentAssignmentError}
  </Alert>
)}

<Button
  variant="contained"
  onClick={handleAssignEquipment}
  disabled={
    !selectedEquipmentId ||
    assigningEquipment ||
    isLocked
  }
>
  {assigningEquipment
    ? 'Assigning...'
    : 'Assign Equipment'}
</Button>

              <Divider />

<Typography variant="subtitle1">
  <strong>Assignment Options</strong>
</Typography>

{loadingAssignmentOptions ? (
  <Typography color="text.secondary">
    Loading assignment options...
  </Typography>
) : !assignmentOptions ? (
  <Alert severity="error">
    Failed to load assignment options.
  </Alert>
) : (
  <Stack spacing={2}>

    {assignmentOptions.weather && (
      <Alert
        severity={
          assignmentOptions.weather.warning
            ? 'warning'
            : 'info'
        }
      >
        <Typography variant="subtitle2">
          Weather forecast
        </Typography>

        <Typography variant="body2">
          Scheduled window:{' '}
          {formatDate(
            assignmentOptions.weather.window.start
          )}{' '}
          –{' '}
          {formatDate(
            assignmentOptions.weather.window.end
          )}
        </Typography>

        <Typography variant="body2">
          Rain probability:{' '}
          {Math.round(
            assignmentOptions.weather.maxRainProbability
          )}
          %
        </Typography>

        <Typography variant="body2">
          Rain:{' '}
          {assignmentOptions.weather.maxRainMm.toFixed(1)}
          {' '}mm
        </Typography>

        <Typography variant="body2">
          Wind:{' '}
          {Math.round(
            assignmentOptions.weather.maxWindKmh
          )}
          {' '}km/h
        </Typography>

        {assignmentOptions.weather.warning && (
          <Typography
            variant="body2"
            sx={{ mt: 0.5 }}
          >
            <strong>
              Warning:
            </strong>{' '}
            {assignmentOptions.weather.warning}
          </Typography>
        )}
      </Alert>
    )}

    {availableTechnicians.length === 0 ? (
      <Alert severity="info">
        No technicians available for assignment.
      </Alert>
    ) : (
      <>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Available technicians
        </Typography>

        <Stack spacing={1.5}>
          {availableTechnicians.map((option) => {
            const technicianName =
              option.name ||
              option.technician?.user?.fullName ||
              option.technicianName ||
              option.user?.fullName ||
              'Unknown technician';

            const assignedMinutes = Math.round(
              option.assignedMinutesToday || 0
            );

            const maxMinutes =
              option.maxWorkingMinutesPerDay || 0;

            const remainingMinutes = Math.max(
              0,
              option.remainingMinutesToday ??
                maxMinutes - assignedMinutes
            );

            const hasRequiredSkills =
              option.hasRequiredSkills === true;

            return (
              <Stack
                key={option.id}
                spacing={1}
                sx={{
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                >
                  <Typography>
                    <strong>{technicianName}</strong>
                  </Typography>

                  <Chip
                    label="Available"
                    color="success"
                    size="small"
                  />
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Employee code:{' '}
                  {option.employeeCode || 'N/A'}
                </Typography>

                <Typography variant="body2">
                  <strong>Assigned today:</strong>{' '}
                  {assignedMinutes} / {maxMinutes} minutes
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Remaining today:{' '}
                  {remainingMinutes} minutes
                </Typography>

                <Typography variant="body2">
                  <strong>Required skills:</strong>{' '}
                  <Chip
                    label={
                      hasRequiredSkills
                        ? 'Yes'
                        : 'No'
                    }
                    color={
                      hasRequiredSkills
                        ? 'success'
                        : 'error'
                    }
                    size="small"
                    sx={{ ml: 0.5 }}
                  />
                </Typography>

                {option.missingSkills?.length > 0 && (
                  <Typography
                    variant="body2"
                    color="error"
                  >
                    Missing skills:{' '}
                    {option.missingSkills.join(', ')}
                  </Typography>
                )}

                {option.expiredSkills?.length > 0 && (
                  <Typography
                    variant="body2"
                    color="error"
                  >
                    Expired certifications:{' '}
                    {option.expiredSkills.join(', ')}
                  </Typography>
                )}

                <Typography variant="body2">
                  <strong>Travel:</strong>{' '}
                  {option.estimatedTravelMinutes !==
                    null &&
                  option.estimatedTravelMinutes !==
                    undefined
                    ? `${option.estimatedTravelMinutes} min`
                    : 'Travel could not be checked'}

                  {option.travelSource && (
                    <>
                      {' '}
                      (
                      {option.travelSource === 'routing'
                        ? 'routing'
                        : option.travelSource ===
                          'straight-line-fallback'
                        ? 'straight-line fallback'
                        : 'unavailable'}
                      )
                    </>
                  )}
                </Typography>

                {option.travelDistanceKm !== null &&
                  option.travelDistanceKm !==
                    undefined && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Distance:{' '}
                      {option.travelDistanceKm} km
                    </Typography>
                  )}
              </Stack>
            );
          })}
        </Stack>
      </>
    )}

    {unavailableTechnicians.length > 0 && (
      <>
        <Divider />

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Not available
        </Typography>

        <Stack spacing={1.5}>
          {unavailableTechnicians.map((option) => {
            const technicianName =
              option.name ||
              option.technician?.user?.fullName ||
              option.technicianName ||
              option.user?.fullName ||
              'Unknown technician';

            const assignedMinutes = Math.round(
              option.assignedMinutesToday || 0
            );

            const maxMinutes =
              option.maxWorkingMinutesPerDay || 0;

            const remainingMinutes = Math.max(
              0,
              option.remainingMinutesToday ??
                maxMinutes - assignedMinutes
            );

            const hasRequiredSkills =
              option.hasRequiredSkills === true;

            return (
              <Stack
                key={option.id}
                spacing={1}
                sx={{
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                >
                  <Typography>
                    <strong>{technicianName}</strong>
                  </Typography>

                  <Chip
                    label="Not available"
                    color="error"
                    size="small"
                  />
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Employee code:{' '}
                  {option.employeeCode || 'N/A'}
                </Typography>

                <Typography
                  variant="body2"
                  color="error"
                >
                  <strong>Reason:</strong>{' '}
                  {option.reason ||
                    'Not available for assignment'}
                </Typography>

                <Typography variant="body2">
                  <strong>Assigned today:</strong>{' '}
                  {assignedMinutes} / {maxMinutes} minutes
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Remaining today:{' '}
                  {remainingMinutes} minutes
                </Typography>

                <Typography variant="body2">
                  <strong>Required skills:</strong>{' '}
                  <Chip
                    label={
                      hasRequiredSkills
                        ? 'Yes'
                        : 'No'
                    }
                    color={
                      hasRequiredSkills
                        ? 'success'
                        : 'error'
                    }
                    size="small"
                    sx={{ ml: 0.5 }}
                  />
                </Typography>

                {option.missingSkills?.length > 0 && (
                  <Typography
                    variant="body2"
                    color="error"
                  >
                    Missing skills:{' '}
                    {option.missingSkills.join(', ')}
                  </Typography>
                )}

                {option.expiredSkills?.length > 0 && (
                  <Typography
                    variant="body2"
                    color="error"
                  >
                    Expired certifications:{' '}
                    {option.expiredSkills.join(', ')}
                  </Typography>
                )}

                <Typography variant="body2">
                  <strong>Travel:</strong>{' '}
                  {option.estimatedTravelMinutes !==
                    null &&
                  option.estimatedTravelMinutes !==
                    undefined
                    ? `${option.estimatedTravelMinutes} min`
                    : 'Unavailable'}

                  {option.travelSource && (
                    <>
                      {' '}
                      (
                      {option.travelSource === 'routing'
                        ? 'routing'
                        : option.travelSource ===
                          'straight-line-fallback'
                        ? 'straight-line fallback'
                        : 'unavailable'}
                      )
                    </>
                  )}
                </Typography>

                {option.travelDistanceKm !== null &&
                  option.travelDistanceKm !==
                    undefined && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Distance:{' '}
                      {option.travelDistanceKm} km
                    </Typography>
                  )}
              </Stack>
            );
          })}
        </Stack>
      </>
    )}
  </Stack>
)}
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
  <strong>Address:</strong>{' '}
  {workOrder.site?.address ? (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        workOrder.site.address
      )}`}
      target="_blank"
      rel="noreferrer"
    >
      {workOrder.site.address}
    </a>
  ) : (
    'Not provided'
  )}
</Typography>

<Typography>
  <strong>Contact:</strong>{' '}
  {workOrder.client?.contactName ||
    'Not provided'}
</Typography>

<Typography>
  <strong>Phone:</strong>{' '}
  {workOrder.client?.phone ? (
    <a href={`tel:${workOrder.client.phone}`}>
      {workOrder.client.phone}
    </a>
  ) : (
    'Not provided'
  )}
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
  false,
  Boolean(
  workOrder.events?.some(
    (event) =>
      event.eventType === 'RESPONSE_SLA_MET'
  )
)
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
  <Stack spacing={2}>
    {user?.role === 'TECHNICIAN' &&
      isAssignedTechnician && (
        <>
          <Typography variant="subtitle1">
            Add work log
          </Typography>

          <TextField
            label="Note"
            value={workLogNote}
            onChange={(event) =>
              setWorkLogNote(event.target.value)
            }
            multiline
            minRows={3}
            fullWidth
            disabled={workLogSaving}
          />

          <TextField
            label="Minutes spent"
            type="number"
            value={workLogMinutes}
            onChange={(event) =>
              setWorkLogMinutes(event.target.value)
            }
            fullWidth
            disabled={workLogSaving}
            inputProps={{ min: 1, step: 1 }}
          />

          <TextField
            label="Parts used"
            value={workLogParts}
            onChange={(event) =>
              setWorkLogParts(event.target.value)
            }
            multiline
            minRows={2}
            fullWidth
            disabled={workLogSaving}
          />

          {workLogSuccess && (
            <Alert severity="success">
              {workLogSuccess}
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={handleCreateWorkLog}
            disabled={
              workLogSaving ||
              !workLogNote.trim() ||
              !workLogMinutes
            }
          >
            {workLogSaving
              ? 'Adding...'
              : 'Add Work Log'}
          </Button>

          <Divider />
        </>
      )}

    {loadingWorkLogs ? (
      <Typography>
        Loading work logs...
      </Typography>
    ) : workLogError &&
      workLogs.length === 0 ? (
      <Alert severity="error">
        {workLogError}
      </Alert>
    ) : workLogs.length === 0 ? (
      <Alert severity="info">
        No work logs recorded yet.
      </Alert>
    ) : (
      <Stack spacing={2}>
        {workLogs.map((log) => (
          <Stack
            key={log.id}
            spacing={0.5}
          >
            <Typography>
              <strong>
                {log.technician?.user?.fullName ||
                  log.technician?.employeeCode ||
                  'Technician'}
              </strong>
            </Typography>

            <Typography>
              {log.note}
            </Typography>

            <Typography variant="body2">
              {log.minutesSpent} minutes
              {log.partsUsed
                ? ` • Parts used: ${log.partsUsed}`
                : ''}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {log.createdAt
                ? new Date(
                    log.createdAt
                  ).toLocaleString()
                : ''}
            </Typography>
          </Stack>
        ))}
      </Stack>
    )}
  </Stack>
</MainCard>
          </Grid>

          <Grid item xs={12} md={6}>
  <MainCard title="Photos">
    <Stack spacing={2}>
      {user?.role === 'TECHNICIAN' && (
        <>
          <Button
            variant="outlined"
            component="label"
            disabled={photoUploading}
          >
            Select Photo
            <input
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePhotoChange}
            />
          </Button>

          {photoPreviewUrl && (
            <Box>
              <Typography variant="body2">
                Selected photo:
              </Typography>

              <img
                src={photoPreviewUrl}
                alt="Selected preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 240,
                  objectFit: 'contain',
                  borderRadius: 8
                }}
              />
            </Box>
          )}

          {photoError && (
            <Alert severity="error">
              {photoError}
            </Alert>
          )}

          {photoSuccess && (
            <Alert severity="success">
              {photoSuccess}
            </Alert>
          )}

          {selectedPhotoFile && (
            <Button
              variant="contained"
              onClick={handleUploadPhoto}
              disabled={photoUploading}
            >
              {photoUploading
                ? 'Uploading...'
                : 'Upload Photo'}
            </Button>
          )}

          <Divider />
        </>
      )}

      {loadingPhotos ? (
  <Typography>
    Loading photos...
  </Typography>
) : workOrderPhotos.length === 0 ? (
        <Alert severity="info">
          No photos attached yet.
        </Alert>
      ) : (
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
        >
          {workOrderPhotos.map((photo) => (
            <Box key={photo.id}>
              <img
                src={`${API_BASE_URL}${photo.filePath}`}
                alt={photo.fileName || 'Work order photo'}
                style={{
                  width: 140,
                  height: 140,
                  objectFit: 'cover',
                  borderRadius: 8
                }}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
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
        open={overrideDialogOpen}
        onClose={() => {
          if (!overrideSaving) {
            setOverrideDialogOpen(false);
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Override Daily Working Hours
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              This work order exceeds the technician's
              maximum daily working hours.
            </Alert>

            <Typography>
              {saveError}
            </Typography>

            <TextField
              label="Override reason"
              value={overrideReason}
              onChange={(event) =>
                setOverrideReason(event.target.value)
              }
              multiline
              rows={4}
              fullWidth
              required
              disabled={overrideSaving}
              helperText="A written reason is required for a supervisor override."
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              if (!overrideSaving) {
                setOverrideDialogOpen(false);
              }
            }}
            disabled={overrideSaving}
          >
            Cancel
          </Button>

          <Button
            onClick={handleDailyHoursOverride}
            variant="contained"
            color="warning"
            disabled={
              overrideSaving ||
              !overrideReason.trim()
            }
          >
            {overrideSaving
              ? 'Overriding...'
              : 'Override & Save'}
          </Button>
        </DialogActions>
      </Dialog>

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

      <Dialog
  open={unassignDialogOpen}
  onClose={() => {
    if (!unassignSaving) {
      setUnassignDialogOpen(false);
    }
  }}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    Unassign technician
  </DialogTitle>

  <DialogContent>
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Typography>
        Please provide a reason for unassigning this technician.
      </Typography>

      <TextField
        label="Reason"
        value={unassignReason}
        onChange={(event) =>
          setUnassignReason(event.target.value)
        }
        fullWidth
        multiline
        minRows={3}
        required
        error={Boolean(unassignError)}
        helperText={unassignError}
      />
    </Stack>
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => setUnassignDialogOpen(false)}
      disabled={unassignSaving}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      color="error"
      onClick={handleUnassign}
      disabled={
        unassignSaving ||
        !unassignReason.trim()
      }
    >
      {unassignSaving
        ? 'Unassigning...'
        : 'Unassign'}
    </Button>
  </DialogActions>
</Dialog>

<Dialog
  open={waitingOnPartsDialogOpen}
  onClose={() => {
    if (!waitingOnPartsSaving) {
      setWaitingOnPartsDialogOpen(false);
    }
  }}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    Waiting on parts
  </DialogTitle>

  <DialogContent>
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Typography>
        Please describe which parts are needed before
        work can continue.
      </Typography>

      <TextField
        label="Parts description"
        value={waitingOnPartsDescription}
        onChange={(event) => {
          setWaitingOnPartsDescription(
            event.target.value
          );
          setWaitingOnPartsError('');
        }}
        multiline
        minRows={3}
        fullWidth
        required
        error={Boolean(waitingOnPartsError)}
        helperText={waitingOnPartsError}
        disabled={waitingOnPartsSaving}
      />
    </Stack>
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => {
        if (!waitingOnPartsSaving) {
          setWaitingOnPartsDialogOpen(false);
        }
      }}
      disabled={waitingOnPartsSaving}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      onClick={handleMarkWaitingOnParts}
      disabled={
        waitingOnPartsSaving ||
        !waitingOnPartsDescription.trim()
      }
    >
      {waitingOnPartsSaving
        ? 'Saving...'
        : 'Mark waiting on parts'}
    </Button>
  </DialogActions>
</Dialog>
    </Stack>
  );
}




