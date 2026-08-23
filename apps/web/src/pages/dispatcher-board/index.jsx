import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Grid, Stack, Typography } from '@mui/material';

import { getWorkOrders, getAssignmentOptions, updateWorkOrder } from 'api/workOrder';

import SiteMap from 'components/map/SiteMap';

export default function DispatcherBoard() {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [assignmentOptions, setAssignmentOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [error, setError] = useState('');

  async function loadWorkOrders() {
    try {
      setLoading(true);
      setError('');

      const data = await getWorkOrders({
        limit: 50
      });

      setWorkOrders(data.items ?? data.workOrders ?? data);

      const orders = data.items ?? data.workOrders ?? data;

      if (orders?.length > 0 && !selectedWorkOrder) {
        setSelectedWorkOrder(orders[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignmentOptions(workOrder) {
    try {
      setOptionsLoading(true);
      setError('');

      const data = await getAssignmentOptions(workOrder.id);

      setAssignmentOptions(data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load assignment options');
      setAssignmentOptions(null);
    } finally {
      setOptionsLoading(false);
    }
  }

  useEffect(() => {
    loadWorkOrders();
  }, []);

  useEffect(() => {
    if (selectedWorkOrder) {
      loadAssignmentOptions(selectedWorkOrder);
    }
  }, [selectedWorkOrder]);

  async function handleAssign(technicianId) {
    if (!selectedWorkOrder) {
      return;
    }

    try {
      setAssigning(technicianId);
      setError('');

      await updateWorkOrder(selectedWorkOrder.id, {
        technicianId
      });

      await loadWorkOrders();

      const refreshedWorkOrder = await getWorkOrders({
        limit: 50
      });

      const orders = refreshedWorkOrder.items ?? refreshedWorkOrder.workOrders ?? refreshedWorkOrder;

      const updated = orders.find((order) => order.id === selectedWorkOrder.id);

      if (updated) {
        setSelectedWorkOrder(updated);
        await loadAssignmentOptions(updated);
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Assignment failed');
    } finally {
      setAssigning(null);
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dispatcher Board
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Work orders */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Work Orders
              </Typography>

              <Stack spacing={1}>
                {workOrders.length === 0 ? (
                  <Typography color="text.secondary">No work orders found.</Typography>
                ) : (
                  workOrders.map((workOrder) => (
                    <Button
                      key={workOrder.id}
                      variant={selectedWorkOrder?.id === workOrder.id ? 'contained' : 'outlined'}
                      onClick={() => setSelectedWorkOrder(workOrder)}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1">{workOrder.reference}</Typography>

                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          {workOrder.title}
                        </Typography>
                      </Box>
                    </Button>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Assignment panel */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              {selectedWorkOrder ? (
                <>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    Work Order Location
                  </Typography>

                  {selectedWorkOrder.site?.latitude != null && selectedWorkOrder.site?.longitude != null ? (
                    <SiteMap
                      sites={[
                        {
                          id: selectedWorkOrder.site.id,
                          name: selectedWorkOrder.site.name,
                          address: selectedWorkOrder.site.address,
                          city: selectedWorkOrder.site.city,
                          latitude: selectedWorkOrder.site.latitude,
                          longitude: selectedWorkOrder.site.longitude
                        }
                      ]}
                    />
                  ) : (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                      Location coordinates are not available for this work order.
                    </Alert>
                  )}

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h5">Assignment</Typography>

                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    {selectedWorkOrder.reference} — {selectedWorkOrder.title}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {optionsLoading ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : assignmentOptions ? (
                    <>
                      {/* Weather */}
                      {assignmentOptions.weather && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Weather forecast available for this outdoor work order.
                        </Alert>
                      )}

                      {/* Available */}
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Available Technicians
                      </Typography>

                      {assignmentOptions.available?.length === 0 ? (
                        <Alert severity="warning">No technicians are currently available.</Alert>
                      ) : (
                        <Stack spacing={2}>
                          {assignmentOptions.available?.map((technician) => (
                            <Card key={technician.id} variant="outlined">
                              <CardContent>
                                <Stack
                                  direction={{
                                    xs: 'column',
                                    sm: 'row'
                                  }}
                                  justifyContent="space-between"
                                  spacing={2}
                                >
                                  <Box>
                                    <Typography variant="h6">{technician.name}</Typography>

                                    <Typography variant="body2" color="text.secondary">
                                      {technician.employeeCode}
                                    </Typography>

                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      {technician.assignedMinutesToday} / {technician.maxWorkingMinutesPerDay} minutes assigned
                                    </Typography>

                                    {technician.estimatedTravelMinutes != null && (
                                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        Travel: {technician.estimatedTravelMinutes} min
                                      </Typography>
                                    )}

                                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                      {technician.skills?.map((skill) => (
                                        <Chip key={skill.id} label={skill.code} size="small" />
                                      ))}
                                    </Stack>
                                  </Box>

                                  <Button
                                    variant="contained"
                                    onClick={() => handleAssign(technician.id)}
                                    disabled={assigning === technician.id}
                                  >
                                    {assigning === technician.id ? 'Assigning...' : 'Assign'}
                                  </Button>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      )}

                      {/* Not available */}
                      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                        Not Available
                      </Typography>

                      <Stack spacing={2}>
                        {assignmentOptions.notAvailable?.map((technician) => (
                          <Card key={technician.id} variant="outlined">
                            <CardContent>
                              <Typography variant="h6">{technician.name}</Typography>

                              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                {technician.reason}
                              </Typography>

                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {technician.assignedMinutesToday} / {technician.maxWorkingMinutesPerDay} minutes assigned
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>

                      {/* Equipment */}
                      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                        Equipment
                      </Typography>

                      <Stack spacing={1}>
                        {assignmentOptions.equipment?.map((equipment) => (
                          <Box
                            key={equipment.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1
                            }}
                          >
                            <Box>
                              <Typography>
                                {equipment.code} — {equipment.name}
                              </Typography>

                              {equipment.reason && (
                                <Typography variant="body2" color="error">
                                  {equipment.reason}
                                </Typography>
                              )}
                            </Box>

                            <Chip
                              label={equipment.available ? 'Available' : 'Unavailable'}
                              color={equipment.available ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                        ))}
                      </Stack>
                    </>
                  ) : null}
                </>
              ) : (
                <Typography color="text.secondary">Select a work order to view assignment options.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
