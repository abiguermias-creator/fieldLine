import { useEffect, useState } from 'react';

// material-ui
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';

// assets
import { LockOutlined, UserOutlined, EnvironmentOutlined } from '@ant-design/icons';

import { getMyDay, updateMyLocationSharing } from 'api/technicians';
import { useAuth } from 'contexts/AuthContext';

//  HEADER PROFILE - SETTING TAB  //

export default function SettingTab() {
  const { user } = useAuth();
  const [locationSharing, setLocationSharing] = useState(false);
  const [updatingLocationSharing, setUpdatingLocationSharing] = useState(false);

  const isTechnician = user?.role === 'TECHNICIAN';

  useEffect(() => {
    if (!isTechnician) {
      return;
    }

    async function loadLocationSharing() {
      try {
        const data = await getMyDay();
        setLocationSharing(Boolean(data?.technician?.locationSharingEnabled));
      } catch {}
    }

    loadLocationSharing();
  }, [isTechnician]);

  async function handleLocationSharingChange(event) {
    const enabled = event.target.checked;

    try {
      setUpdatingLocationSharing(true);

      const result = await updateMyLocationSharing(enabled);

      setLocationSharing(Boolean(result?.locationSharingEnabled));
    } catch {
    } finally {
      setUpdatingLocationSharing(false);
    }
  }

  return (
    <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
      {isTechnician && (
        <ListItemButton>
          <ListItemIcon>
            <EnvironmentOutlined />
          </ListItemIcon>

          <ListItemText primary="Location Sharing" secondary={locationSharing ? 'Sharing location' : 'Location sharing off'} />

          <Switch edge="end" checked={locationSharing} onChange={handleLocationSharingChange} disabled={updatingLocationSharing} />
        </ListItemButton>
      )}

      <ListItemButton>
        <ListItemIcon>
          <UserOutlined />
        </ListItemIcon>
        <ListItemText primary="Account Settings" />
      </ListItemButton>

      <ListItemButton>
        <ListItemIcon>
          <LockOutlined />
        </ListItemIcon>
        <ListItemText primary="Privacy Center" />
      </ListItemButton>
    </List>
  );
}
