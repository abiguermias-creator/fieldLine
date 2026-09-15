import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// project imports
import ContainerWrapper from 'components/ContainerWrapper';

// ==============================|| FOOTER - AUTHENTICATION ||============================== //

export default function AuthFooter() {
  return (
    <ContainerWrapper>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          gap: 2,
          justifyContent: 'center',
          textAlign: 'center',
          py: 2
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'secondary.main' }}>
          © {new Date().getFullYear()} Fieldline. All rights reserved.
        </Typography>
      </Stack>
    </ContainerWrapper>
  );
}
