import { useTheme } from '@mui/material/styles';

export default function LogoMain() {
  const theme = useTheme();

  return (
    <svg
      width="150"
      height="40"
      viewBox="0 0 150 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 4L32 16L20 28L8 16L20 4Z"
        fill={theme.vars.palette.primary.main}
      />

      <path
        d="M20 10L26 16L20 22L14 16L20 10Z"
        fill={theme.vars.palette.primary.dark}
      />

      {/* Fieldline text */}
      <text
        x="40"
        y="26"
        fill={theme.vars.palette.common.black}
        fillOpacity="0.85"
        fontFamily="Arial, sans-serif"
        fontSize="20"
        fontWeight="600"
      >
        Fieldline
      </text>
    </svg>
  );
}