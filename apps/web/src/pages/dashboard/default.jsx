import { useEffect, useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';

// project imports
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import UniqueVisitorCard from 'sections/dashboard/default/UniqueVisitorCard';
import MonthlyBarChart from 'sections/dashboard/default/MonthlyBarChart';
import ReportAreaChart from 'sections/dashboard/default/ReportAreaChart';
import SaleReportCard from 'sections/dashboard/default/SaleReportCard';
import { getWorkOrders } from 'api/workOrder';

export default function DashboardDefault() {
  const [workOrders, setWorkOrders] = useState([]);

  useEffect(() => {
    async function loadWorkOrders() {
      try {
        const data = await getWorkOrders();
        setWorkOrders(data.items || []);
      } catch (error) {
        console.error('Failed to load work orders:', error);
      }
    }

    loadWorkOrders();
  }, []);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid sx={{ mb: -2.25 }} size={12}>
        <Typography variant="h5">Dashboard</Typography>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Total Work Orders"
          count={String(workOrders.length)}
          percentage={0}
          extra="Current"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="High Priority"
          count={String(workOrders.filter((w) => w.priority === 'HIGH').length)}
          percentage={0}
          extra="Priority"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Open Orders"
          count={String(workOrders.filter((w) => w.status === 'OPEN').length)}
          percentage={0}
          extra="Status"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Completed"
          count="0"
          percentage={0}
          extra="Status"
        />
      </Grid>

      {/* row 2 */}
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <UniqueVisitorCard />
      </Grid>

      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <MainCard>
          <Box>
            <Typography variant="h5">
              Work Order Summary
            </Typography>
          </Box>

          <MonthlyBarChart />
        </MainCard>
      </Grid>

      {/* row 3 */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="h5">
          Recent Work Orders
        </Typography>

        <MainCard sx={{ mt: 2 }}>
          <List>
            {workOrders.length === 0 ? (
              <ListItem>
                <ListItemText primary="No work orders found" />
              </ListItem>
            ) : (
              workOrders.map((order) => (
                <ListItem key={order.id} divider>
                  <ListItemText
                    primary={order.title}
                    secondary={
                      <>
                        {order.description}
                        <br />
                        Status: {order.status}
                        <br />
                        Priority: {order.priority}
                      </>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </MainCard>
      </Grid>
            {/* row 4 */}
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <SaleReportCard />
      </Grid>

      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <MainCard sx={{ mt: 2 }}>
          <Typography variant="h5">
            Analytics Report
          </Typography>

          <List>
            <ListItem divider>
              <ListItemText
                primary="Active Work Orders"
                secondary={workOrders.length}
              />
            </ListItem>

            <ListItem divider>
              <ListItemText
                primary="High Priority Orders"
                secondary={
                  workOrders.filter(
                    (order) => order.priority === 'HIGH'
                  ).length
                }
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="Current Status"
                secondary="Connected to Backend API"
              />
            </ListItem>
          </List>

          <ReportAreaChart />
        </MainCard>
      </Grid>
    </Grid>
  );
}