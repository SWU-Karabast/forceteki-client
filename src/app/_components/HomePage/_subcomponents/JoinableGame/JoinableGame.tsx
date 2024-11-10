import React from "react";
const JoinableGame: React.FC = () => {
	const randomGameId = Math.floor(Math.random() * 10000);

	const boxStyle = {
		width: "100%",
		display: "flex",
		justifyContent: "space-between",
		alignContent: "center",
		alignItems: "center",
		mb: ".5em",
		pr: ".5em",
	};

	return (
		<div className="game-item">
			<p>Game #{randomGameId}</p>
			<button className="button">Join Game</button>
		</div>
	);
};

export default JoinableGame;
