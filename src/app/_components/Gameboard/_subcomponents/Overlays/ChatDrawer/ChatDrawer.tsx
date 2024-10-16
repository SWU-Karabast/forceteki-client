import React, { forwardRef } from "react";
import { Drawer, Box, IconButton, Typography } from "@mui/material";
import { Settings, Close } from "@mui/icons-material";
import Chat from "@/app/_components/_sharedcomponents/Chat/Chat";

const ChatDrawer = forwardRef<HTMLDivElement, ChatDrawerProps>(
	(
		{
			sidebarOpen,
			toggleSidebar,
			chatHistory,
			chatMessage,
			setChatMessage,
			handleChatSubmit,
			currentRound,
		},
		ref
	) => {
		return (
			<Drawer
				anchor="right"
				open={sidebarOpen}
				onClose={toggleSidebar}
				variant="persistent"
				sx={{
					flexShrink: 0,
					"& .MuiDrawer-paper": {
						backgroundColor: "#000000CC",
						color: "#fff",
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
					},
				}}
				PaperProps={{
					ref: ref,
				}}
			>
				<Box sx={{ p: 2 }}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography variant="h3" sx={{ m: 0 }}>
							ROUND {currentRound}
						</Typography>
						<Box>
							<IconButton>
								<Settings sx={{ color: "#fff" }} />
							</IconButton>
							<IconButton onClick={toggleSidebar}>
								<Close sx={{ color: "#fff" }} />
							</IconButton>
						</Box>
					</Box>

					<Box sx={{ mt: 1 }}>
						<Typography style={{ fontWeight: "bold" }}>Last Played</Typography>
						<Box
							sx={{
								backgroundColor: "#333",
								height: "150px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Typography style={{ color: "#888" }}>
								Image Placeholder
							</Typography>
						</Box>
					</Box>

					{/* Use the ChatComponent here */}
					<Chat
						chatHistory={chatHistory}
						chatMessage={chatMessage}
						setChatMessage={setChatMessage}
						handleChatSubmit={handleChatSubmit}
					/>
				</Box>
			</Drawer>
		);
	}
);

export default ChatDrawer;
