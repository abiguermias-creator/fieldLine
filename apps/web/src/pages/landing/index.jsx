import { Link } from 'react-router-dom';

// material-ui
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const capabilities = [
{
icon: <AssignmentTurnedInOutlinedIcon />,
title: 'Work Order Management',
description: 'Create, assign, track, and complete field-service work orders from one place.'
},
{
icon: <RouteOutlinedIcon />,
title: 'Intelligent Scheduling',
description: 'Schedule technicians around skills, certifications, equipment, travel time, and conflicts.'
},
{
icon: <EngineeringOutlinedIcon />,
title: 'Technician Workflow',
description: 'Give field technicians a focused workflow for daily assignments and work completion.'
},
{
icon: <SpeedOutlinedIcon />,
title: 'Operational Visibility',
description: 'Keep dispatchers and supervisors informed with structured events and real-time status.'
}
];

const roles = [
{
title: 'Clients',
description: 'Submit service requests, manage service sites, and track work performed for their organization.'
},
{
title: 'Dispatchers',
description: 'Create and manage work orders, assign technicians and equipment, and coordinate the daily workload.'
},
{
title: 'Technicians',
description: 'View daily assignments, review job details, and complete field work from a focused technician workflow.'
},
{
title: 'Supervisors',
description: 'Monitor operations, review completed work, and verify work orders before final closure.'
}
];

const engineeringHighlights = [
'Pure scheduling rules with 40+ boundary tests',
'Resilient HTTP clients with timeouts, retries, and fallbacks',
'Background jobs for durable asynchronous processing',
'Structured logging with request correlation IDs'
];

const demoAccounts = [
['Dispatcher', '[admin@fieldline.com](mailto:admin@fieldline.com)'],
['Technician', '[technician@fieldline.com](mailto:technician@fieldline.com)'],
['Supervisor', '[supervisor@fieldline.com](mailto:supervisor@fieldline.com)'],
['Client', '[client@abc.com](mailto:client@abc.com)']
];

export default function LandingPage() {
return (
<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}> <Container maxWidth="lg">
<Box sx={{ py: { xs: 4, md: 6 } }}> <Stack direction="row" alignItems="center" justifyContent="space-between"> <Typography variant="h4" fontWeight={700} color="primary.main">
Fieldline </Typography>

```
        <Button component={Link} to="/login" variant="outlined">
          Sign in
        </Button>
      </Stack>
    </Box>

    <Box
      sx={{
        py: { xs: 8, md: 14 },
        maxWidth: 900,
        mx: 'auto',
        textAlign: 'center'
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
          fontWeight: 800,
          lineHeight: 1.05,
          mb: 3
        }}
      >
        Field service operations, organized.
      </Typography>

      <Typography
        variant="h5"
        color="text.secondary"
        sx={{
          maxWidth: 750,
          mx: 'auto',
          mb: 5,
          lineHeight: 1.6,
          fontWeight: 400
        }}
      >
        Fieldline helps field-service teams manage work orders, schedule technicians, coordinate
        equipment, and keep daily operations moving.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
        <Button
          component={Link}
          to="/login"
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
        >
          Explore Live Demo
        </Button>

        <Button
          component="a"
          href="https://github.com/abiguermias-creator/fieldLine"
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          size="large"
        >
          View Source
        </Button>
      </Stack>
    </Box>

    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3
        }}
      >
        <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
          The problem Fieldline solves
        </Typography>

        <Typography color="text.secondary" lineHeight={1.8}>
          Meridian Field Services manages field work across many customer sites with a distributed
          team of technicians, vehicles, and equipment. Without a centralized operations system,
          dispatchers must coordinate schedules, technician skills, certifications, travel time,
          equipment availability, work-order priorities, and service-level commitments manually.
          Fieldline brings these workflows together so teams can make better assignment decisions,
          keep technicians productive, and maintain visibility from service request through
          completion and verification.
        </Typography>
      </Paper>
    </Box>

    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Typography variant="h3" textAlign="center" fontWeight={700} sx={{ mb: 2 }}>
        Built for field operations
      </Typography>

      <Typography
        color="text.secondary"
        textAlign="center"
        sx={{ maxWidth: 650, mx: 'auto', mb: 5 }}
      >
        A practical operations platform connecting dispatchers, technicians, supervisors,
        clients, sites, and equipment.
      </Typography>

      <Grid container spacing={3}>
        {capabilities.map((item) => (
          <Grid key={item.title} size={{ xs: 12, sm: 6 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 2
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>

                <Typography variant="h5" fontWeight={600}>
                  {item.title}
                </Typography>

                <Typography color="text.secondary" lineHeight={1.7}>
                  {item.description}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>

    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Typography variant="h3" textAlign="center" fontWeight={700} sx={{ mb: 2 }}>
        One platform, four operational roles
      </Typography>

      <Typography
        color="text.secondary"
        textAlign="center"
        sx={{ maxWidth: 700, mx: 'auto', mb: 5 }}
      >
        Each role has a focused workflow while sharing the same operational data.
      </Typography>

      <Grid container spacing={3}>
        {roles.map((role) => (
          <Grid key={role.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 2
              }}
            >
              <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                {role.title}
              </Typography>

              <Typography color="text.secondary" lineHeight={1.7}>
                {role.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>

    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Paper
        sx={{
          p: { xs: 3, md: 6 },
          borderRadius: 3
        }}
      >
        <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
          Engineering built for real operations
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 700 }}>
          Fieldline is designed with reliability and operational edge cases in mind, not just a
          polished interface.
        </Typography>

        <Stack spacing={2}>
          {engineeringHighlights.map((highlight) => (
            <Stack key={highlight} direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  flexShrink: 0
                }}
              />
              <Typography>{highlight}</Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Box>

    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3
        }}
      >
        <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
          Demo accounts
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Explore Fieldline using one of the seeded demo accounts. All demo accounts use the
          password <strong>password123</strong>.
        </Typography>

        <Grid container spacing={2}>
          {demoAccounts.map(([role, email]) => (
            <Grid key={role} size={{ xs: 12, sm: 6 }}>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Typography fontWeight={600}>{role}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {email}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Button component={Link} to="/login" variant="contained" sx={{ mt: 4 }}>
          Sign in to the demo
        </Button>
      </Paper>
    </Box>

    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3
        }}
      >
        <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
          Architecture
        </Typography>

        <Typography color="text.secondary" lineHeight={1.8}>
          Fieldline uses a React/Vite frontend with a TypeScript/Express API, PostgreSQL for
          persistent data, Redis for caching and background-job infrastructure, and resilient
          integrations for services such as geocoding, routing, and weather data. The system also
          uses structured logging, request correlation IDs, and durable asynchronous jobs to keep
          operational workflows reliable.
        </Typography>
      </Paper>
    </Box>

    <Box
      component="footer"
      sx={{
        py: 5,
        borderTop: 1,
        borderColor: 'divider',
        textAlign: 'center'
      }}
    >
      <Typography fontWeight={600}>Fieldline</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Field service operations platform.
      </Typography>

      <Button
        component="a"
        href="https://github.com/abiguermias-creator/fieldLine"
        target="_blank"
        rel="noopener noreferrer"
        size="small"
        sx={{ mt: 1 }}
      >
        View Source on GitHub
      </Button>
    </Box>
  </Container>
</Box>
);
}
