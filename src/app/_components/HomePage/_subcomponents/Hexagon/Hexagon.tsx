import React from "react";
import { Box } from "@mui/material";

const Hexagon: React.FC<HexagonProps> = ({
	backgroundColor,
}: {
	backgroundColor: string;
}) => {
	return (
		<Box
			sx={{
				width: "1rem",
				height: "1rem",
				backgroundColor,
				clipPath:
					"polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
				my: "0.15rem",
			}}
		/>
	);
};

export default Hexagon;
