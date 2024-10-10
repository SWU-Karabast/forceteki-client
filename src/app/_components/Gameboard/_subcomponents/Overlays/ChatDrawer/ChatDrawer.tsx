import React, { forwardRef } from "react";
import { Drawer, Box, IconButton } from "@mui/material";
import { Settings, Close } from "@mui/icons-material";
import Chat from "@/app/_components/Chat/Chat";

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
						backgroundColor: "rgba(0,0,0,0.8)",
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
				<Box sx={{ padding: 2 }}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<h3 style={{ margin: 0 }}>ROUND {currentRound}</h3>
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
						<p style={{ fontWeight: "bold" }}>Last Played</p>
						<Box
							sx={{
								backgroundColor: "#333",
								height: "150px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<p style={{ color: "#888" }}>Image Placeholder</p>
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
