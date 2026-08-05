// material-ui
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { useAuth } from "contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// assets
import { EditOutlined } from "@ant-design/icons";
import { ProfileOutlined } from "@ant-design/icons";
import { LogoutOutlined } from "@ant-design/icons";
import { UserOutlined } from "@ant-design/icons";
import { WalletOutlined } from "@ant-design/icons";

// ==============================|| HEADER PROFILE - PROFILE TAB ||============================== //

export default function ProfileTab() {

  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
      <ListItemButton>
        <ListItemIcon>
          <EditOutlined />
        </ListItemIcon>
        <ListItemText primary="Edit Profile" />
      </ListItemButton>
      <ListItemButton>
        <ListItemIcon>
          <UserOutlined />
        </ListItemIcon>
        <ListItemText primary="View Profile" />
      </ListItemButton>

      <ListItemButton>
        <ListItemIcon>
          <ProfileOutlined />
        </ListItemIcon>
        <ListItemText primary="Social Profile" />
      </ListItemButton>
            <ListItemButton>
        <ListItemIcon>
          <WalletOutlined />
        </ListItemIcon>
        <ListItemText primary="Billing" />
      </ListItemButton>

      <ListItemButton
        onClick={async () => {
          await logout();
          navigate("/free/login");
        }}
      >
        <ListItemIcon>
          <LogoutOutlined />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItemButton>
    </List>
  );
}