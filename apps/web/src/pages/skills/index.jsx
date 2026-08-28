import { useEffect, useState } from 'react';

import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import MainCard from 'components/MainCard';

import {
  getSkills,
  createSkill,
  deleteSkill
} from 'api/skills';

export default function Skills() {
  const [skills, setSkills] = useState([]);

  const [form, setForm] = useState({
    code: '',
    name: ''
  });

  const [message, setMessage] = useState('');

  async function loadSkills() {
    try {
      const data = await getSkills();
      setSkills(data);
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Failed to load skills'
      );
    }
  }

  useEffect(() => {
    loadSkills();
  }, []);

  async function handleCreateSkill() {
    try {
      await createSkill(form);

      setMessage('Skill created successfully');

      setForm({
        code: '',
        name: ''
      });

      loadSkills();
    }  catch (error) {

  const responseMessage = error.response?.data?.message;

  setMessage(
    responseMessage ||
    error.response?.data?.error ||
    error.message ||
    'Failed to create skill'
  );
}
  }

  async function handleDeleteSkill(id) {
    try {
      await deleteSkill(id);

      setMessage('Skill deleted successfully');

      loadSkills();
    } catch (error) {

      setMessage(
        error.response?.data?.message ||
        'Failed to delete skill'
      );
    }
  }

  return (
    <MainCard>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Skills
      </Typography>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Skill Code"
          value={form.code}
          onChange={(e) =>
            setForm({
              ...form,
              code: e.target.value
            })
          }
        />

        <TextField
          label="Skill Name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value
            })
          }
        />

        <Button
          variant="contained"
          onClick={handleCreateSkill}
        >
          Create Skill
        </Button>

        {message && (
          <Typography>
            {message}
          </Typography>
        )}
      </Stack>

      <List>
        {skills.length === 0 ? (
          <ListItem>
            <ListItemText primary="No skills found" />
          </ListItem>
        ) : (
          skills.map((skill) => (
            <ListItem
              key={skill.id}
              divider
            >
              <ListItemText
                primary={skill.name}
                secondary={`Code: ${skill.code}`}
              />

              <Button
                color="error"
                onClick={() => handleDeleteSkill(skill.id)}
              >
                Delete
              </Button>
            </ListItem>
          ))
        )}
      </List>
    </MainCard>
  );
}
