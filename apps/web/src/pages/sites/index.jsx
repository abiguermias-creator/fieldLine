import { useEffect, useState } from 'react';

// Material UI
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

// API
import {
  getSites,
  createSite,
  updateSite,
  deleteSite,
  deactivateSite,
  updateSiteLocation
} from 'api/site';

import { getClients } from 'api/clients';

// Map
import SiteMap from 'components/map/SiteMap';
import ManualSiteMap from 'components/map/ManualSiteMap';

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [clients, setClients] = useState([]);

  const [form, setForm] = useState({
  clientId: '',
  name: '',
  address: '',
  city: '',
  accessNotes: '',
  latitude: null,
  longitude: null
});

  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [editingSiteId, setEditingSiteId] = useState(null);

  const [page, setPage] = useState(1);
  const sitesPerPage = 5;

  useEffect(() => {
    loadSites();
    loadClients();
  }, []);

async function loadSites() {
  try {
    const data = await getSites();

    const loadedSites = data.data || data || [];

    console.log('SITES FROM API:', loadedSites);

    loadedSites.forEach((site) => {
      console.log(
        site.name,
        'isActive:',
        site.isActive,
        'latitude:',
        site.latitude,
        'longitude:',
        site.longitude
      );
    });
 console.log(
      'MANUAL PLACEMENT:',
      loadedSites.map((site) => ({
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        needsManualPlacement: site.needsManualPlacement
      }))
    );
    setSites(loadedSites);
  } catch (error) {
    console.error('Failed to load sites:', error);

    setMessage(
      error.response?.data?.message ||
        'Failed to load sites'
    );
  }
}

  async function loadClients() {
    try {
      const data = await getClients();
      setClients(data.data || data || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

async function handleCreateSite() {
  try {
    const createdSite = await createSite({
      clientId: form.clientId,
      name: form.name,
      address: form.address,
      city: form.city,
      accessNotes: form.accessNotes
    });

    const site = createdSite?.data || createdSite;

    if (
      form.latitude !== null &&
      form.latitude !== undefined &&
      form.longitude !== null &&
      form.longitude !== undefined &&
      site?.id
    ) {
      await updateSiteLocation(site.id, {
        latitude: form.latitude,
        longitude: form.longitude
      });
    }

    setMessage('Site created successfully');

    setForm({
      clientId: '',
      name: '',
      address: '',
      city: '',
      accessNotes: '',
      latitude: null,
      longitude: null
    });

    await loadSites();
    setPage(1);
  } catch (error) {
    console.error('Failed to create site:', error);

    setMessage(
      error.response?.data?.message ||
        'Failed to create site'
    );
  }
}
  
  function handleEditClick(site) {
  setEditingSiteId(site.id);

  setForm({
    clientId: site.clientId || '',
    name: site.name || '',
    address: site.address || '',
    city: site.city || '',
    accessNotes: site.accessNotes || '',
    latitude:
      site.latitude !== null &&
      site.latitude !== undefined
        ? Number(site.latitude)
        : null,
    longitude:
      site.longitude !== null &&
      site.longitude !== undefined
        ? Number(site.longitude)
        : null
  });

  setMessage('');
}

  function handleCancelEdit() {
  setEditingSiteId(null);

  setForm({
    clientId: '',
    name: '',
    address: '',
    city: '',
    accessNotes: '',
    latitude: null,
    longitude: null
  });

  setMessage('');
}
  
async function handleUpdateSite() {
  try {
    await updateSite(editingSiteId, {
      clientId: form.clientId,
      name: form.name,
      address: form.address,
      city: form.city,
      accessNotes: form.accessNotes
    });

    if (
      form.latitude !== null &&
      form.latitude !== undefined &&
      form.longitude !== null &&
      form.longitude !== undefined
    ) {
      await updateSiteLocation(editingSiteId, {
        latitude: form.latitude,
        longitude: form.longitude
      });
    }

    setMessage('Site updated successfully');

    setEditingSiteId(null);

    setForm({
      clientId: '',
      name: '',
      address: '',
      city: '',
      accessNotes: '',
      latitude: null,
      longitude: null
    });

    await loadSites();
  } catch (error) {
    console.error('Failed to update site:', error);

    setMessage(
      error.response?.data?.message ||
        'Failed to update site'
    );
  }
}

  async function handleDeleteSite(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this site?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSite(id);

      setMessage('Site deleted successfully');

      await loadSites();
    } catch (error) {
      console.error('Failed to delete site:', error);

      setMessage(
        error.response?.data?.message ||
          'Failed to delete site'
      );
    }
  }

  async function handleDeactivateSite(id) {
    const confirmed = window.confirm(
      'Are you sure you want to deactivate this site?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await deactivateSite(id);

      setMessage('Site deactivated successfully');

      await loadSites();
    } catch (error) {
      console.error('Failed to deactivate site:', error);

      setMessage(
        error.response?.data?.message ||
          'Failed to deactivate site'
      );
    }
  }

  const filteredSites = sites.filter((site) =>
    site.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSites.length / sitesPerPage)
  );

  const currentPage = Math.min(page, totalPages);

  const startIndex =
    (currentPage - 1) * sitesPerPage;

  const paginatedSites = filteredSites.slice(
    startIndex,
    startIndex + sitesPerPage
  );

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  return (
    <>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Sites
      </Typography>

      <Stack spacing={3}>
        <MainCard
          title={
            editingSiteId
              ? 'Edit Site'
              : 'Create Site'
          }
        >
          <Stack spacing={2}>
            <TextField
              select
              label="Client"
              value={form.clientId}
              onChange={(e) =>
                handleFormChange(
                  'clientId',
                  e.target.value
                )
              }
              fullWidth
            >
              {clients.map((client) => (
                <MenuItem
                  key={client.id}
                  value={client.id}
                >
                  {client.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Site Name"
              value={form.name}
              onChange={(e) =>
                handleFormChange(
                  'name',
                  e.target.value
                )
              }
              fullWidth
            />

            <TextField
              label="Address"
              value={form.address}
              onChange={(e) =>
                handleFormChange(
                  'address',
                  e.target.value
                )
              }
              fullWidth
            />

            <TextField
              label="City"
              value={form.city}
              onChange={(e) =>
                handleFormChange(
                  'city',
                  e.target.value
                )
              }
              fullWidth
            />

            <TextField
              label="Access Notes"
              value={form.accessNotes}
              onChange={(e) =>
                handleFormChange(
                  'accessNotes',
                  e.target.value
                )
              }
              multiline
              rows={3}
              fullWidth
            />
          
            <Typography variant="subtitle1">
  Site Location
</Typography>

<Typography variant="body2" color="text.secondary">
  Drag the pin to the exact site location. The
  selected coordinates will be saved as the manual
  location.
</Typography>

<ManualSiteMap
  latitude={form.latitude}
  longitude={form.longitude}
  onLocationChange={({ latitude, longitude }) => {
    setForm((prev) => ({
      ...prev,
      latitude,
      longitude
    }));
  }}
/>

{form.latitude !== null &&
  form.longitude !== null && (
    <Typography variant="body2">
      Selected coordinates: {form.latitude.toFixed(6)},{' '}
      {form.longitude.toFixed(6)}
    </Typography>
  )}

            <Stack
              direction="row"
              spacing={2}
            >
              <Button
                variant="contained"
                onClick={
                  editingSiteId
                    ? handleUpdateSite
                    : handleCreateSite
                }
              >
                {editingSiteId
                  ? 'Update Site'
                  : 'Create Site'}
              </Button>

              {editingSiteId && (
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              )}
            </Stack>

            {message && (
              <Typography color="primary">
                {message}
              </Typography>
            )}
          </Stack>
        </MainCard>

        <MainCard title="Site Map">
          <SiteMap sites={sites} />
        </MainCard>

        <MainCard title="Sites">
          <Stack spacing={2}>
            <TextField
              label="Search sites by name"
              value={search}
              onChange={(e) =>
                handleSearchChange(e.target.value)
              }
              fullWidth
            />

            <List>
              {paginatedSites.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary={
                      search
                        ? 'No sites match your search'
                        : 'No sites found'
                    }
                  />
                </ListItem>
              ) : (
                paginatedSites.map((site) => (
                  <ListItem
                    key={site.id}
                    divider
                    secondaryAction={
                      <Stack
                        direction="row"
                        spacing={1}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            handleEditClick(site)
                          }
                        >
                          Edit
                        </Button>

                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={() =>
                            handleDeactivateSite(
                              site.id
                            )
                          }
                          disabled={
                            site.isActive === false
                          }
                        >
                          Deactivate
                        </Button>

                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() =>
                            handleDeleteSite(
                              site.id
                            )
                          }
                        >
                          Delete
                        </Button>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <Typography>
                            {site.name}
                          </Typography>

                          {site.isActive === false && (
                            <Chip
                              label="Inactive"
                              color="error"
                              size="small"
                            />
                          )}

                          {site.needsManualPlacement && (
                            <Chip
                              label="Needs manual placement"
                              color="warning"
                              size="small"
                            />
                          )}

                          {site.latitude !== null &&
                            site.latitude !==
                              undefined &&
                            site.longitude !== null &&
                            site.longitude !==
                              undefined && (
                              <Chip
                                label="Located"
                                color="success"
                                size="small"
                              />
                            )}
                        </Stack>
                      }
                      secondary={
                        <>
                          Address:{' '}
                          {site.address ||
                            'Not provided'}
                          <br />

                          City:{' '}
                          {site.city ||
                            'Not provided'}
                          <br />

                          Client:{' '}
                          {site.client?.name ||
                            'No client assigned'}
                          <br />

                          Access Notes:{' '}
                          {site.accessNotes ||
                            'None'}
                          <br />

                          Latitude:{' '}
                          {site.latitude ??
                            'Not available'}
                          <br />

                          Longitude:{' '}
                          {site.longitude ??
                            'Not available'}
                        </>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>

            {filteredSites.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center'
                }}
              >
                <Button
                  variant="outlined"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setPage((prev) =>
                      Math.max(prev - 1, 1)
                    )
                  }
                >
                  Previous
                </Button>

                <Typography>
                  Page {currentPage} of {totalPages}
                </Typography>

                <Button
                  variant="outlined"
                  disabled={
                    currentPage === totalPages
                  }
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(
                        prev + 1,
                        totalPages
                      )
                    )
                  }
                >
                  Next
                </Button>
              </Box>
            )}
          </Stack>
        </MainCard>
      </Stack>
    </>
  );
}
