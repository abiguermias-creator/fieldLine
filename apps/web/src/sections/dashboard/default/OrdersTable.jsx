import { useEffect, useState } from "react";
import { getWorkOrders } from "../../../api/workOrder";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
export default function OrderTable() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function loadWorkOrders() {
      try {
        const data = await getWorkOrders();
        setRows(data.items);
      } catch {
}
    }

    loadWorkOrders();
  }, []);

  return (
    <Box>
      <TableContainer
        sx={{
          width: "100%",
          overflowX: "auto",
          position: "relative",
          display: "block",
          maxWidth: "100%",
          "& td, & th": { whiteSpace: "nowrap" }
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Site</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id.slice(0, 8)}</TableCell>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.client?.name}</TableCell>
                <TableCell>{row.site?.name}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.priority}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

