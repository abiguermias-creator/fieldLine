import { useEffect, useState } from 'react';

import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

import MainCard from 'components/MainCard';

import { getEquipment, createEquipment, updateEquipment, deleteEquipment, deactivateEquipment, activateEquipment } from 'api/equipment';

export default function Equipment() {
  const [equipment, setEquipment] = useState([]);

  const [form, setForm] = useState({
    code: '',
    name: '',
    category: '',
    description: ''
  });

  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState('');

  async function loadEquipment() {
    try {
      const data = await getEquipment();

      setEquipment(data || []);
    } catch (error) {

      setMessage(error.response?.data?.message || error.message || 'Failed to load equipment');
    }
  }

  useEffect(() => {
    loadEquipment();
  }, []);

  function handleFormChange(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function resetForm() {
    setForm({
      code: '',
      name: '',
      category: '',
      description: ''
    });

    setEditingId(null);
  }

  async function handleSubmit() {
    try {
      const data = {
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim() || undefined
      };

      if (!data.code || !data.name || !data.category) {
        setMessage('Code, name, and category are required.');
        return;
      }

      if (editingId) {
        await updateEquipment(editingId, data);

        setMessage('Equipment updated successfully');
      } else {
        await createEquipment(data);

        setMessage('Equipment created successfully');
      }

      resetForm();

      await loadEquipment();
    } catch (error) {

      setMessage(error.response?.data?.message || error.message || 'Failed to save equipment');
    }
  }

  function handleEdit(item) {
    setEditingId(item.id);

    setForm({
      code: item.code || '',
      name: item.name || '',
      category: item.category || '',
      description: item.description || ''
    });

    setMessage('');
  }

  async function handleDelete(id) {
    try {
      await deleteEquipment(id);

      setMessage('Equipment deleted successfully');

      if (editingId === id) {
        resetForm();
      }

      await loadEquipment();
    } catch (error) {

      setMessage(error.response?.data?.message || error.message || 'Failed to delete equipment');
    }
  }

  async function handleDeactivate(id) {
    try {
      await deactivateEquipment(id);

      setMessage('Equipment deactivated successfully');

      await loadEquipment();
    } catch (error) {

      setMessage(error.response?.data?.message || error.message || 'Failed to deactivate equipment');
    }
  }

  async function handleActivate(id) {
    try {
      await activateEquipment(id);

      setMessage('Equipment activated successfully');

      await loadEquipment();
    } catch (error) {

      setMessage(error.response?.data?.message || error.message || 'Failed to activate equipment');
    }
  }

  return (
    <MainCard>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Equipment
      </Typography>

      <Stack spacing={2} sx={{ mb: 4 }}>
        <TextField label="Equipment Code" value={form.code} onChange={(e) => handleFormChange('code', e.target.value)} fullWidth />

        <TextField label="Equipment Name" value={form.name} onChange={(e) => handleFormChange('name', e.target.value)} fullWidth />

        <TextField label="Category" value={form.category} onChange={(e) => handleFormChange('category', e.target.value)} fullWidth />

        <TextField
          label="Description"
          value={form.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
          multiline
          rows={3}
          fullWidth
        />

        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleSubmit}>
            {editingId ? 'Update Equipment' : 'Create Equipment'}
          </Button>

          {editingId && (
            <Button variant="outlined" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </Stack>

        {message && <Typography>{message}</Typography>}
      </Stack>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Equipment List
      </Typography>

      <List>
        {equipment.length === 0 ? (
          <ListItem>
            <ListItemText primary="No equipment found" />
          </ListItem>
        ) : (
          equipment.map((item) => (
            <ListItem
              key={item.id}
              divider
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ListItemText
                primary={item.name || 'Unnamed Equipment'}
                secondary={
                  <>
                    Code: {item.code || 'No code'}
                    <br />
                    Category: {item.category || 'No category'}
                    <br />
                    Description: {item.description || 'No description'}
                    <br />
                    Status: {item.isActive ? 'Active' : 'Inactive'}
                  </>
                }
              />

              <Stack direction="row" spacing={1}>
                <Button onClick={() => handleEdit(item)}>Edit</Button>

                {item.isActive ? (
                  <Button onClick={() => handleDeactivate(item.id)}>Deactivate</Button>
                ) : (
                  <Button onClick={() => handleActivate(item.id)}>Activate</Button>
                )}

                <Button color="error" onClick={() => handleDelete(item.id)}>
                  Delete
                </Button>
              </Stack>
            </ListItem>
          ))
        )}
      </List>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2">Total equipment: {equipment.length}</Typography>
      </Box>
    </MainCard>
  );
}
