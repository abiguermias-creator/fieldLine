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

import {
  getClients,
  createClient,
  deleteClient,
  deactivateClient
} from 'api/clients';


export default function Clients() {

  const [clients, setClients] = useState([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactName: ''
  });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1
  });

  const [message, setMessage] = useState('');


  async function loadClients() {
    try {
      const data = await getClients(page, search);

      setClients(data.data || []);
      setPagination(data.pagination);

    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  }


  useEffect(() => {
    loadClients();
  }, [page, search]);


  async function handleCreateClient() {

    try {

      const result = await createClient(form);

      if (result.warning) {
        setMessage(result.warning);
      } else {
        setMessage('Client created successfully');
      }


      setForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        contactName: ''
      });


      loadClients();


    } catch (error) {

      console.error(error);
      setMessage('Failed to create client');

    }
  }



  async function handleDeleteClient(id) {

    try {

      await deleteClient(id);

      setMessage('Client deleted successfully');

      loadClients();


    } catch (error) {

      setMessage(
        error.response?.data?.message ||
        error.message
      );

    }
  }



  async function handleDeactivateClient(id) {

    try {

      await deactivateClient(id);

      setMessage('Client deactivated successfully');

      loadClients();


    } catch (error) {

      setMessage(
        error.response?.data?.message ||
        error.message
      );

    }
  }



  return (

    <MainCard>

      <Typography variant="h4" sx={{ mb: 3 }}>
        Clients
      </Typography>


      <Stack spacing={2} sx={{ mb: 3 }}>


        <TextField
          label="Client Name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value
            })
          }
        />


        <TextField
          label="Email"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value
            })
          }
        />


        <TextField
          label="Phone"
          value={form.phone}
          onChange={(e) =>
            setForm({
              ...form,
              phone: e.target.value
            })
          }
        />


        <TextField
          label="Address"
          value={form.address}
          onChange={(e) =>
            setForm({
              ...form,
              address: e.target.value
            })
          }
        />


        <TextField
          label="Contact Name"
          value={form.contactName}
          onChange={(e) =>
            setForm({
              ...form,
              contactName: e.target.value
            })
          }
        />


        <Button
          variant="contained"
          onClick={handleCreateClient}
        >
          Create Client
        </Button>


        {message && (
          <Typography>
            {message}
          </Typography>
        )}


      </Stack>



      <TextField
        label="Search clients"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        sx={{ mb: 2 }}
      />



      <List>

        {clients.length === 0 ? (

          <ListItem>
            <ListItemText primary="No clients found" />
          </ListItem>


        ) : (


          clients.map((client) => (

            <ListItem
              key={client.id}
              divider
            >

              <ListItemText

                primary={client.name}

                secondary={
                  <>
                    Email: {client.email || 'No email'}
                    <br />
                    Phone: {client.phone || 'No phone'}
                    <br />
                    Status: {client.isActive ? 'Active' : 'Inactive'}
                  </>
                }

              />


              <Button
  color="error"
  onClick={() => handleDeleteClient(client.id)}
>
  Delete
</Button>

{client.isActive ? (
  <Button onClick={() => handleDeactivateClient(client.id)}>
    Deactivate
  </Button>
) : (
  <Button onClick={() => handleActivateClient(client.id)}>
    Activate
  </Button>
)}

            </ListItem>

          ))

        )}

      </List>



      <Box sx={{ mt: 3 }}>

        <Typography>
          Page {pagination.page} of {pagination.totalPages}
        </Typography>


        <Button
          disabled={page >= pagination.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>


      </Box>


    </MainCard>

  );
}