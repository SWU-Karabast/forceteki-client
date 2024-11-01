import React, { forwardRef } from "react";
import { Drawer, Box, IconButton, Typography } from "@mui/material";
import { Settings, Close } from "@mui/icons-material";
import Chat from "@/app/_components/_sharedcomponents/Chat/Chat";
import { ChatDrawerProps } from "@/app/_components/Gameboard/GameboardTypes";

const ChatDrawer = forwardRef<HTMLDivElement, ChatDrawerProps>(
	function ChatDrawer(
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
	) {
		//------------------------STYLES------------------------//

		const drawerStyle = {
			flexShrink: 0,
			"& .MuiDrawer-paper": {
				backgroundColor: "#000000CC",
				color: "#fff",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
			},
		};
		const headerBoxStyle = {
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
		};

		const imagePlaceholderBoxStyle = {
			backgroundColor: "#333",
			height: "150px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		};

		return (
			<Drawer
				anchor="right"
				open={sidebarOpen}
				onClose={toggleSidebar}
				variant="persistent"
				sx={drawerStyle}
				PaperProps={{
					ref: ref,
				}}
			>
				<Box sx={{ p: 2 }}>
					<Box sx={headerBoxStyle}>
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
						<Box sx={imagePlaceholderBoxStyle}>
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
