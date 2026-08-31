import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import MainCard from 'components/MainCard';
import { getClients } from 'api/clients';
import { getSites } from 'api/site';
import {
  createWorkOrder,
  getWorkOrders
} from 'api/workOrder';
import { getTechnicians } from 'api/technicians';

const STATUSES = [
  'NEW',
  'TRIAGED',
  'ASSIGNED',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED',
  'CANCELLED'
];

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];

export default function WorkOrders() {
  const [clients, setClients] = useState([]);
  const [sites, setSites] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [clientId, setClientId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [createdWorkOrder, setCreatedWorkOrder] = useState(null);

  const [workOrders, setWorkOrders] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    pages: 0
  });

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');

  const [selectedStatuses, setSelectedStatuses] =
    useState([]);

  const [selectedPriorities, setSelectedPriorities] =
    useState([]);

  const [filterTechnicianId, setFilterTechnicianId] =
    useState('');

  const [filterClientId, setFilterClientId] =
    useState('');

  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  async function loadWorkOrders(currentPage = page) {
    try {
      setLoadingList(true);
      setError('');

      const response = await getWorkOrders({
        page: currentPage,
        limit: 25,
        statuses:
          selectedStatuses.length > 0
            ? selectedStatuses
            : undefined,
        priorities:
          selectedPriorities.length > 0
            ? selectedPriorities
            : undefined,
        technicianId:
          filterTechnicianId || undefined,
        clientId:
          filterClientId || undefined,
        search: search.trim() || undefined,
        createdFrom:
          createdFrom
            ? new Date(
                `${createdFrom}T00:00:00.000Z`
              ).toISOString()
            : undefined,
        createdTo:
          createdTo
            ? new Date(
                `${createdTo}T23:59:59.999Z`
              ).toISOString()
            : undefined,
        sortBy,
        sortOrder
      });

      setWorkOrders(response.items || []);

      setPagination(
        response.pagination || {
          page: currentPage,
          pageSize: 25,
          total: 0,
          pages: 0
        }
      );
    } catch {
      setError('Failed to load work orders.');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [
          clientsResponse,
          sitesResponse,
          techniciansResponse
        ] = await Promise.all([
          getClients(),
          getSites(),
          getTechnicians()
        ]);

        setClients(
          clientsResponse.items ||
            clientsResponse ||
            []
        );

        setSites(
          sitesResponse.items ||
            sitesResponse ||
            []
        );

        setTechnicians(
          techniciansResponse.items ||
            techniciansResponse ||
            []
        );
      } catch {
        setError(
          'Failed to load clients, sites, or technicians.'
        );
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    loadWorkOrders(page);
  }, [
    page,
    selectedStatuses,
    selectedPriorities,
    filterTechnicianId,
    filterClientId,
    search,
    createdFrom,
    createdTo,
    sortBy,
    sortOrder
  ]);

  const filteredSites = sites.filter(
    (site) => site.clientId === clientId
  );

  function handleClientChange(event) {
    setClientId(event.target.value);
    setSiteId('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setMessage('');
    setCreatedWorkOrder(null);

    if (
      !clientId ||
      !siteId ||
      !title ||
      !priority
    ) {
      setError(
        'Please fill in all required fields.'
      );
      return;
    }

    if (title.length > 200) {
      setError(
        'Title must not exceed 200 characters.'
      );
      return;
    }

    try {
      setLoading(true);

      const result = await createWorkOrder({
        clientId,
        siteId,
        title,
        description,
        priority
      });

      setCreatedWorkOrder(result);
      setMessage(
        'Work order created successfully.'
      );

      setClientId('');
      setSiteId('');
      setTitle('');
      setDescription('');
      setPriority('');

      setPage(1);
      await loadWorkOrders(1);
    } catch (err) {

      setError(
        err.response?.data?.message ||
          'Failed to create work order.'
      );
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearch('');
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setFilterTechnicianId('');
    setFilterClientId('');
    setCreatedFrom('');
    setCreatedTo('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  }

  function getTechnicianName(workOrder) {
    return (
      workOrder.technician?.user?.fullName ||
      'Unassigned'
    );
  }

  function getActiveFilterText() {
    const filters = [];

    if (search.trim()) {
      filters.push(`search: "${search.trim()}"`);
    }

    if (selectedStatuses.length > 0) {
      filters.push(
        `status: ${selectedStatuses.join(', ')}`
      );
    }

    if (selectedPriorities.length > 0) {
      filters.push(
        `priority: ${selectedPriorities.join(', ')}`
      );
    }

    if (filterTechnicianId) {
      const technician = technicians.find(
        (item) => item.id === filterTechnicianId
      );

      if (technician) {
        filters.push(
          `technician: ${
            technician.user?.fullName ||
            technician.fullName ||
            technician.employeeCode ||
            'Selected'
          }`
        );
      }
    }

    if (filterClientId) {
      const client = clients.find(
        (item) => item.id === filterClientId
      );

      if (client) {
        filters.push(`client: ${client.name}`);
      }
    }

    if (createdFrom) {
      filters.push(`from: ${createdFrom}`);
    }

    if (createdTo) {
      filters.push(`to: ${createdTo}`);
    }

    return filters.join(' • ');
  }

  const hasFilters =
    search.trim() ||
    selectedStatuses.length > 0 ||
    selectedPriorities.length > 0 ||
    filterTechnicianId ||
    filterClientId ||
    createdFrom ||
    createdTo;

  return (
    <Stack spacing={3}>
      <Typography variant="h4">
        Work Orders
      </Typography>

      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}

      {message && (
        <Alert severity="success">
          {message}
        </Alert>
      )}

      {createdWorkOrder && (
        <Alert severity="success">
          <strong>
            Reference:{' '}
            {createdWorkOrder.reference}
          </strong>
          <br />
          Status: {createdWorkOrder.status}
        </Alert>
      )}

      <MainCard title="New Work Order">
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <FormControl fullWidth required>
              <InputLabel>
                Client
              </InputLabel>

              <Select
                value={clientId}
                label="Client"
                onChange={
                  handleClientChange
                }
              >
                {clients.map((client) => (
                  <MenuItem
                    key={client.id}
                    value={client.id}
                  >
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              fullWidth
              required
              disabled={!clientId}
            >
              <InputLabel>
                Site
              </InputLabel>

              <Select
                value={siteId}
                label="Site"
                onChange={(event) =>
                  setSiteId(
                    event.target.value
                  )
                }
              >
                {filteredSites.map((site) => (
                  <MenuItem
                    key={site.id}
                    value={site.id}
                  >
                    {site.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              required
              fullWidth
              inputProps={{
                maxLength: 200
              }}
              helperText={`${title.length}/200 characters`}
            />

            <TextField
              label="Description"
              value={description}
              onChange={(event) =>
                setDescription(
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
                value={priority}
                label="Priority"
                onChange={(event) =>
                  setPriority(
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

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading
                ? 'Creating...'
                : 'Create Work Order'}
            </Button>
          </Stack>
        </form>
      </MainCard>

      <MainCard title="Search and Filters">
        <Stack spacing={2}>
          <TextField
            label="Search by reference or site"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>
              Status
            </InputLabel>

            <Select
              multiple
              value={selectedStatuses}
              label="Status"
              onChange={(event) => {
                setSelectedStatuses(
                  event.target.value
                );
                setPage(1);
              }}
            >
              {STATUSES.map((status) => (
                <MenuItem
                  key={status}
                  value={status}
                >
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>
              Priority
            </InputLabel>

            <Select
              multiple
              value={selectedPriorities}
              label="Priority"
              onChange={(event) => {
                setSelectedPriorities(
                  event.target.value
                );
                setPage(1);
              }}
            >
              {PRIORITIES.map((item) => (
                <MenuItem
                  key={item}
                  value={item}
                >
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>
              Technician
            </InputLabel>

            <Select
              value={filterTechnicianId}
              label="Technician"
              onChange={(event) => {
                setFilterTechnicianId(
                  event.target.value
                );
                setPage(1);
              }}
            >
              <MenuItem value="">
                All technicians
              </MenuItem>

              {technicians.map(
                (technician) => (
                  <MenuItem
                    key={technician.id}
                    value={technician.id}
                  >
                    {technician.user?.fullName ||
                      technician.fullName ||
                      technician.employeeCode ||
                      'Technician'}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>
              Client
            </InputLabel>

            <Select
              value={filterClientId}
              label="Client"
              onChange={(event) => {
                setFilterClientId(
                  event.target.value
                );
                setPage(1);
              }}
            >
              <MenuItem value="">
                All clients
              </MenuItem>

              {clients.map((client) => (
                <MenuItem
                  key={client.id}
                  value={client.id}
                >
                  {client.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack
            direction={{
              xs: 'column',
              sm: 'row'
            }}
            spacing={2}
          >
            <TextField
              label="Created from"
              type="date"
              value={createdFrom}
              onChange={(event) => {
                setCreatedFrom(
                  event.target.value
                );
                setPage(1);
              }}
              fullWidth
              InputLabelProps={{
                shrink: true
              }}
            />

            <TextField
              label="Created to"
              type="date"
              value={createdTo}
              onChange={(event) => {
                setCreatedTo(
                  event.target.value
                );
                setPage(1);
              }}
              fullWidth
              InputLabelProps={{
                shrink: true
              }}
            />
          </Stack>

          <Stack
            direction={{
              xs: 'column',
              sm: 'row'
            }}
            spacing={2}
          >
            <FormControl fullWidth>
              <InputLabel>
                Sort by
              </InputLabel>

              <Select
                value={sortBy}
                label="Sort by"
                onChange={(event) => {
                  setSortBy(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <MenuItem value="createdAt">
                  Created date
                </MenuItem>

                <MenuItem value="priority">
                  Priority
                </MenuItem>

                <MenuItem value="nearestSla">
                  Nearest SLA target
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>
                Order
              </InputLabel>

              <Select
                value={sortOrder}
                label="Order"
                onChange={(event) => {
                  setSortOrder(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <MenuItem value="desc">
                  Descending
                </MenuItem>

                <MenuItem value="asc">
                  Ascending
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {hasFilters && (
            <Button
              variant="outlined"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </Stack>
      </MainCard>

      <MainCard title="Work Order List">
        {loadingList ? (
          <Typography>
            Loading work orders...
          </Typography>
        ) : workOrders.length === 0 ? (
          <Stack spacing={2}>
            <Alert severity="info">
              No work orders found
              {hasFilters
                ? ` for the active filters: ${getActiveFilterText()}`
                : '.'}
            </Alert>

            {hasFilters && (
              <Button
                variant="outlined"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </Stack>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Reference
                    </TableCell>

                    <TableCell>
                      Client
                    </TableCell>

                    <TableCell>
                      Site
                    </TableCell>

                    <TableCell>
                      Title
                    </TableCell>

                    <TableCell>
                      Priority
                    </TableCell>

                    <TableCell>
                      Status
                    </TableCell>

                    <TableCell>
                      Assigned Technician
                    </TableCell>

                    <TableCell>
                      Created Date
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {workOrders.map(
                    (workOrder) => (
                      <TableRow
                        key={workOrder.id}
                      >
                        <TableCell>
  <Link
    to={`/work-orders/${workOrder.id}`}
    style={{
      textDecoration: 'none',
      fontWeight: 600
    }}
  >
    {workOrder.reference}
  </Link>
</TableCell>

                        <TableCell>
                          {workOrder.client
                            ?.name ||
                            'Unknown'}
                        </TableCell>

                        <TableCell>
                          {workOrder.site
                            ?.name ||
                            'Unknown'}
                        </TableCell>

                        <TableCell>
                          {workOrder.title}
                        </TableCell>

                        <TableCell>
                          {workOrder.priority}
                        </TableCell>

                        <TableCell
  sx={
    workOrder.status === 'AWAITING_PARTS'
      ? {
          fontWeight: 700,
          backgroundColor: 'warning.light',
          color: 'warning.contrastText'
        }
      : undefined
  }
>
  {workOrder.status}
</TableCell>

                        <TableCell>
                          {getTechnicianName(
                            workOrder
                          )}
                        </TableCell>

                        <TableCell>
                          {workOrder.createdAt
                            ? new Date(
                                workOrder.createdAt
                              ).toLocaleString()
                            : 'Unknown'}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                Page {pagination.page} of{' '}
                {pagination.pages || 1} ·{' '}
                {pagination.total} total work
                orders ·{' '}
                {pagination.pageSize || 25}{' '}
                per page
              </Typography>

              <Stack
                direction="row"
                spacing={1}
              >
                <Button
                  variant="outlined"
                  disabled={
                    pagination.page <= 1
                  }
                  onClick={() =>
                    setPage(
                      pagination.page - 1
                    )
                  }
                >
                  Previous
                </Button>

                <Button
                  variant="outlined"
                  disabled={
                    pagination.page >=
                    pagination.pages
                  }
                  onClick={() =>
                    setPage(
                      pagination.page + 1
                    )
                  }
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          </>
        )}
      </MainCard>
    </Stack>
  );
}

