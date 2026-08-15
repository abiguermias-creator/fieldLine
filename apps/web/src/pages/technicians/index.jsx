import { useEffect, useState } from 'react';

import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';

import MainCard from 'components/MainCard';

import { getSkills } from 'api/skills';

import {
  getTechnicians,
  createTechnician,
  deactivateTechnician,
  activateTechnician
} from 'api/technicians';

import {
  getTechnicianSkills,
  addTechnicianSkill,
  removeTechnicianSkill
} from 'api/technicianSkills';

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);

  const [skills, setSkills] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [technicianSkills, setTechnicianSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [certificationExpiresAt, setCertificationExpiresAt] = useState('');
  const [skillMessage, setSkillMessage] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    employeeCode: '',
    baseLocation: '',
    maxWorkingMinutesPerDay: 480,
    phone: '',
    bio: ''
  });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  const [message, setMessage] = useState('');

  async function loadTechnicians() {
    try {
      const data = await getTechnicians(page, 25, search, skillFilter);

      setTechnicians(data.items || []);

      setPagination(
        data.pagination || {
          page: 1,
          pages: 1,
          total: 0
        }
      );
    } catch (error) {
      console.error('Failed to load technicians:', error);

      setMessage(
        error.response?.data?.message ||
          'Failed to load technicians'
      );
    }
  }

  async function loadSkills() {
    try {
      const data = await getSkills();

      setSkills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load skills:', error);

      setSkillMessage(
        error.response?.data?.message ||
          'Failed to load skills'
      );
    }
  }

  useEffect(() => {
    loadTechnicians();
  }, [page, search, skillFilter]);

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadTechnicianSkills(technicianId) {
    try {
      const data = await getTechnicianSkills(technicianId);

      setTechnicianSkills(Array.isArray(data) ? data : []);
      setSkillMessage('');
    } catch (error) {
      console.error(
        'Failed to load technician skills:',
        error
      );

      setTechnicianSkills([]);

      setSkillMessage(
        error.response?.data?.message ||
          'Failed to load technician skills'
      );
    }
  }

  async function handleSelectTechnician(technician) {
    setSelectedTechnician(technician);
    setSelectedSkill('');
    setCertificationExpiresAt('');
    setSkillMessage('');

    await loadTechnicianSkills(technician.id);
  }

  async function handleCreateTechnician() {
    try {
      const data = {
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        employeeCode: form.employeeCode,
        baseLocation: form.baseLocation,
        maxWorkingMinutesPerDay:
          Number(form.maxWorkingMinutesPerDay) || 480,
        phone: form.phone || undefined,
        bio: form.bio || undefined
      };

      await createTechnician(data);

      setMessage('Technician created successfully');

      setForm({
        email: '',
        password: '',
        fullName: '',
        employeeCode: '',
        baseLocation: '',
        maxWorkingMinutesPerDay: 480,
        phone: '',
        bio: ''
      });

      await loadTechnicians();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          error.message ||
          'Failed to create technician'
      );
    }
  }

  async function handleDeactivateTechnician(id) {
    try {
      await deactivateTechnician(id);

      setMessage('Technician deactivated successfully');

      await loadTechnicians();

      if (selectedTechnician?.id === id) {
        setSelectedTechnician((current) =>
          current
            ? {
                ...current,
                user: {
                  ...current.user,
                  isActive: false
                }
              }
            : current
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          error.message ||
          'Failed to deactivate technician'
      );
    }
  }

  async function handleActivateTechnician(id) {
    try {
      await activateTechnician(id);

      setMessage('Technician activated successfully');

      await loadTechnicians();

      if (selectedTechnician?.id === id) {
        setSelectedTechnician((current) =>
          current
            ? {
                ...current,
                user: {
                  ...current.user,
                  isActive: true
                }
              }
            : current
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          error.message ||
          'Failed to activate technician'
      );
    }
  }

  async function handleAddSkill() {
    if (!selectedTechnician) {
      setSkillMessage('Select a technician first');
      return;
    }

    if (!selectedSkill) {
      setSkillMessage('Select a skill first');
      return;
    }

    try {
      await addTechnicianSkill(
        selectedTechnician.id,
        {
          skillId: selectedSkill,
          certificationExpiresAt:
            certificationExpiresAt
              ? new Date(
                  `${certificationExpiresAt}T00:00:00`
                ).toISOString()
              : null
        }
      );

      setSkillMessage('Skill added successfully');

      setSelectedSkill('');
      setCertificationExpiresAt('');

      await loadTechnicianSkills(
        selectedTechnician.id
      );
    } catch (error) {
      console.error(error);

      setSkillMessage(
        error.response?.data?.message ||
          error.message ||
          'Failed to add skill'
      );
    }
  }

  async function handleRemoveSkill(skillId) {
    if (!selectedTechnician) {
      return;
    }

    try {
      await removeTechnicianSkill(
        selectedTechnician.id,
        skillId
      );

      setSkillMessage('Skill removed successfully');

      await loadTechnicianSkills(
        selectedTechnician.id
      );
    } catch (error) {
      console.error(error);

      setSkillMessage(
        error.response?.data?.message ||
          error.message ||
          'Failed to remove skill'
      );
    }
  }

  return (
    <MainCard>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Technicians
      </Typography>

      <Stack spacing={2} sx={{ mb: 4 }}>
        <TextField
          label="Full Name"
          value={form.fullName}
          onChange={(e) =>
            setForm({
              ...form,
              fullName: e.target.value
            })
          }
        />

        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value
            })
          }
        />

        <TextField
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value
            })
          }
        />

        <TextField
          label="Employee Code"
          value={form.employeeCode}
          onChange={(e) =>
            setForm({
              ...form,
              employeeCode: e.target.value
            })
          }
        />

        <TextField
          label="Base Location"
          value={form.baseLocation}
          onChange={(e) =>
            setForm({
              ...form,
              baseLocation: e.target.value
            })
          }
        />

        <TextField
          label="Maximum Working Minutes Per Day"
          type="number"
          value={form.maxWorkingMinutesPerDay}
          onChange={(e) =>
            setForm({
              ...form,
              maxWorkingMinutesPerDay: e.target.value
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
          label="Bio"
          multiline
          rows={3}
          value={form.bio}
          onChange={(e) =>
            setForm({
              ...form,
              bio: e.target.value
            })
          }
        />

        <Button
          variant="contained"
          onClick={handleCreateTechnician}
        >
          Create Technician
        </Button>

        {message && (
          <Typography>
            {message}
          </Typography>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h5" sx={{ mb: 2 }}>
        Technician List
      </Typography>

      <TextField
        label="Search technicians"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        sx={{ mb: 2 }}
        fullWidth
      />

      <List>
        {technicians.length === 0 ? (
          <ListItem>
            <ListItemText primary="No technicians found" />
          </ListItem>
        ) : (
          technicians.map((technician) => (
            <ListItem
              key={technician.id}
              divider
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ListItemText
                primary={
                  technician.user?.fullName ||
                  'Unnamed Technician'
                }
                secondary={
                  <>
                    Email:{' '}
                    {technician.user?.email ||
                      'No email'}
                    <br />
                    Employee Code:{' '}
                    {technician.employeeCode}
                    <br />
                    Base Location:{' '}
                    {technician.baseLocation}
                    <br />
                    Maximum Working Minutes:{' '}
                    {technician.maxWorkingMinutesPerDay}
                    <br />
                    Status:{' '}
                    {technician.user?.isActive
                      ? 'Active'
                      : 'Inactive'}
                  </>
                }
              />
              <TextField
  select
  label="Filter by skill"
  value={skillFilter}
  onChange={(e) => {
    setPage(1);
    setSkillFilter(e.target.value);
  }}
  sx={{ mb: 2 }}
  fullWidth
>
  <MenuItem value="">
    All skills
  </MenuItem>

  {skills.map((skill) => (
    <MenuItem key={skill.id} value={skill.id}>
      {skill.name} ({skill.code})
    </MenuItem>
  ))}
</TextField>
              <Stack
                direction="row"
                spacing={1}
              >
                <Button
                  variant={
                    selectedTechnician?.id ===
                    technician.id
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={() =>
                    handleSelectTechnician(
                      technician
                    )
                  }
                >
                  Skills
                </Button>

                {technician.user?.isActive ? (
                  <Button
                    onClick={() =>
                      handleDeactivateTechnician(
                        technician.id
                      )
                    }
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      handleActivateTechnician(
                        technician.id
                      )
                    }
                  >
                    Activate
                  </Button>
                )}
              </Stack>
            </ListItem>
          ))
        )}
      </List>

      <Box sx={{ mt: 3 }}>
        <Typography>
          Page {pagination.page} of{' '}
          {pagination.pages}
        </Typography>

        <Button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>

        <Button
          disabled={page >= pagination.pages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </Box>

      {selectedTechnician && (
        <>
          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ mb: 2 }}>
            Manage Skills
          </Typography>

          <Typography sx={{ mb: 2 }}>
            Technician:{' '}
            <strong>
              {selectedTechnician.user?.fullName ||
                'Unnamed Technician'}
            </strong>
          </Typography>

          <Stack spacing={2}>
            <TextField
              select
              label="Select Skill"
              value={selectedSkill}
              onChange={(e) =>
                setSelectedSkill(e.target.value)
              }
              fullWidth
            >
              <MenuItem value="">
                Select a skill
              </MenuItem>

              {skills.map((skill) => (
                <MenuItem
                  key={skill.id}
                  value={skill.id}
                >
                  {skill.name} ({skill.code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Certification Expiry"
              type="date"
              value={certificationExpiresAt}
              onChange={(e) =>
                setCertificationExpiresAt(e.target.value)
              }
              InputLabelProps={{shrink: true}}
            />

            <Button
              variant="contained"
              onClick={handleAddSkill}
            >
              Add Skill
            </Button>

            {skillMessage && (
              <Typography>
                {skillMessage}
              </Typography>
            )}
          </Stack>

          <Typography
            variant="h6"
            sx={{ mt: 3, mb: 1 }}
          >
            Current Skills
          </Typography>

          <List>
            {technicianSkills.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No skills assigned"
                />
              </ListItem>
            ) : (
              technicianSkills.map(
                (technicianSkill) => {
                  const skill =
                    technicianSkill.skill;

                  const skillId =
                    technicianSkill.skillId ||
                    skill?.id;

                  return (
                    <ListItem
                      key={
                        technicianSkill.id ||
                        skillId
                      }
                      divider
                    >
                      <ListItemText
                        primary={
                          skill?.name ||
                          technicianSkill.name ||
                          'Unknown skill'
                        }
                        secondary={
                          <>
                            Code:{' '}
                            {skill?.code ||
                              technicianSkill.code ||
                              'N/A'}
                            {technicianSkill.certificationExpiresAt && (
                              <>
                                <br />
                                Certification expires:{' '}
                                {new Date(
                                  technicianSkill.certificationExpiresAt
                                ).toLocaleDateString()}
                              </>
                            )}
                          </>
                        }
                      />

                      {skillId && (
                        <Button
                          color="error"
                          onClick={() =>
                            handleRemoveSkill(
                              skillId
                            )
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </ListItem>
                  );
                }
              )
            )}
          </List>
        </>
      )}
    </MainCard>
  );
}