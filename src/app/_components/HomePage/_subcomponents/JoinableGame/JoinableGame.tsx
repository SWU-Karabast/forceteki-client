import React, { useEffect, useState} from "react";
import { Box, Button, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
interface Lobby {
	id: string;
	name: string;
}

const JoinableGame: React.FC = () => {
	//const randomGameId = Math.floor(Math.random() * 10000);
	const router = useRouter();
	const [lobbies, setLobbies] = useState<Lobby[]>([]);
	useEffect(() => {
		// Fetch unfilled lobbies from the server
		const fetchLobbies = async () => {
			try {
				const response = await fetch('http://localhost:9500/api/unfilled-lobbies');
				if (!response.ok) {
					throw new Error(`Error fetching lobbies: ${response.statusText}`);
				}
				const data: Lobby[] = await response.json();
				setLobbies(data);
			} catch (error) {
				console.error('Error fetching lobbies:', error);
			}
		};

		fetchLobbies();
	}, []);

	const joinLobby = async (lobbyId: string) => {
		try {
			const response = await fetch('http://localhost:9500/api/join-lobby', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ lobbyId, userId: 'ThisIsTheWay' }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Error joining lobby:', errorData.message);
				alert(errorData.message);
				return;
			}
			alert('Successfully joined the lobby');
			router.push("/lobby?player=ThisIsTheWay");
		} catch (error) {
			console.error('Error joining lobby:', error);
		}
	};

	//------------------------STYLES------------------------//

	const styles = {
		box: {
			width: "100%",
			display: "flex",
			justifyContent: "space-between",
			alignContent: "center",
			alignItems: "center",
			mb: "1rem",
		},
		matchType: {
		  	margin: 0,
		},
	};

	return (
		<>
			{lobbies.map((lobby) => (
				<Box sx={styles.box} key={lobby.id}>
					<Typography variant="body1" sx={styles.matchType}>{lobby.name}</Typography>
					<Button onClick={() => joinLobby(lobby.id)}>Join Game</Button>
				</Box>
			))}
		</>
	);
};

export default JoinableGame;
