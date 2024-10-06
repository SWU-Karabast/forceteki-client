import { Paper } from "@mui/material";
import Grid from "@mui/material/Grid2";

const GroundUnitsBoard: React.FC<GroundUnitsBoardProps> = ({ sidebarOpen }) => {
  return (
    <Paper
      sx={{
        height: "60vh",
        width: sidebarOpen ? "32vw" : "36vw",
        marginLeft: ".3vw",
      }}
    >
      <Grid
        container
        direction="column"
        sx={{
          height: "100%",
          justifyContent: "space-between", // Ensures rows take available space equally
        }}
      >
        <Grid
          sx={{
            flexGrow: 1, // Allows this row to grow and take available height
            width: "100%",
            display: "flex", // Flex to make the Paper fill the row
          }}
        >
          <Paper sx={{ width: "100%", height: "100%", backgroundColor: "red" }}>
            Opponent Row
          </Paper>
        </Grid>
        <Grid
          sx={{
            flexGrow: 1, // Same as above for this row
            width: "100%",
            display: "flex",
          }}
        >
          <Paper
            sx={{ width: "100%", height: "100%", backgroundColor: "blue" }}
          >
            Player Row
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default GroundUnitsBoard;
