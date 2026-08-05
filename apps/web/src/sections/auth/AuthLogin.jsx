import PropTypes from 'prop-types';
import React from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';

// assets
import { EyeOutlined } from "@ant-design/icons";
import { EyeInvisibleOutlined } from "@ant-design/icons";

// ============================|| JWT - LOGIN ||============================ //

export default function AuthLogin({ isDemo = false }) { 
  const navigate = useNavigate();
const location = useLocation();
const sessionExpired =
  new URLSearchParams(location.search).get("session");
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = React.useState("");
  const [checked, setChecked] = React.useState(false);

  const [showPassword, setShowPassword] = React.useState(false);

const handleClickShowPassword = () => {
  setShowPassword(!showPassword);
};

const handleMouseDownPassword = (event) => {
  event.preventDefault();
};

  return (
    <>
      <Formik
 initialValues={{
   email: '',
   password: '',
   submit: null
 }}
        validationSchema={Yup.object().shape({
          email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
          password: Yup.string()
            .required('Password is required')
            .test('no-leading-trailing-whitespace', 'Password cannot start or end with spaces', (value) => value === value.trim())
            .min(10, 'Password must be at least 10 characters')
        })}
        onSubmit={async (values, { setSubmitting }) => {
  try {
    setErrorMessage("");

    const data = await login({
      email: values.email,
      password: values.password,
    });
    const from = location.state?.from?.pathname;

   const role = data.user.role;

if (role === "DISPATCHER") {
  navigate(from || "/dashboard/default");
} 
else if (role === "TECHNICIAN") {
  navigate(from || "/dashboard/default");
} 
else if (role === "SUPERVISOR") {
  navigate(from || "/dashboard/default");
} 
else if (role === "CLIENT") {
  navigate(from || "/dashboard/default");
} 

  } catch (error) {
    setErrorMessage(
      error.response?.data?.message ?? "Login failed"
    );
  } finally {
    setSubmitting(false);
  }
}}
      >
        {({ errors, handleBlur, handleChange, touched, values, handleSubmit }) => (
            <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="email-login">Email Address</InputLabel>
                  <OutlinedInput
                    id="email-login"
                    type="email"
                    value={values.email}
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    fullWidth
                    error={Boolean(touched.email && errors.email)}
                  />
                </Stack>
                {touched.email && errors.email && (
                  <FormHelperText error id="standard-weight-helper-text-email-login">
                    {errors.email}
                  </FormHelperText>
                )}
              </Grid>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="password-login">Password</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="-password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="Enter password"
                  />
                </Stack>
                {touched.password && errors.password && (
                  <FormHelperText error id="standard-weight-helper-text-password-login">
                    {errors.password}
                  </FormHelperText>
                )}
              </Grid>
              <Grid sx={{ mt: -1 }} size={12}>
                <Stack direction="row" sx={{ gap: 2, alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(event) => setChecked(event.target.checked)}
                        name="checked"
                        color="primary"
                        size="small"
                      />
                    }
                    label={<Typography variant="h6">Keep me sign in</Typography>}
                  />
                  <Link variant="h6" component={RouterLink} to="#" color="text.primary">
                    Forgot Password?
                  </Link>
                </Stack>
              </Grid>
              <Grid size={12}>
                <AnimateButton>
                  {errorMessage && (
  <Grid size={12}>
    <FormHelperText error>
      {errorMessage}
    </FormHelperText>
  </Grid>
)}
{sessionExpired && (
  <Grid size={12}>
    <FormHelperText error>
      Your session has ended. Please login again.
    </FormHelperText>
  </Grid>
)}
                  <Button
                    type="submit"
                    fullWidth
                    size="large"
                    variant="contained"
                    color="primary"
>
                   Login
        </Button>
                </AnimateButton>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </>
  );
}

AuthLogin.propTypes = { isDemo: PropTypes.bool };
