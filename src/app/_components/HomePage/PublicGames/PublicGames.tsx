import React from "react";
import JoinableGame from "../_subcomponents/JoinableGame/JoinableGame";
import GamesInProgress from "../_subcomponents/GamesInProgress/GamesInProgress";
import { PublicGamesProps } from "../HomePageTypes";
import './PublicGames.css';

const PublicGames: React.FC<PublicGamesProps> = ({ format }) => {
	//------------------------STYLES------------------------//

	return (
		<div className="container + ' ' + black-bg">
				<h2>Public Games</h2>
				<h3>{format}</h3>
				<hr/>
				<JoinableGame />
				<JoinableGame />
				<JoinableGame />
				<h3>Request-Undo {format}</h3>
				<hr/>
				<JoinableGame />
				<GamesInProgress />
		</div>
	);
};

export default PublicGames;
