import React from "react";
import GameInProgressPlayer from "../GameInProgressPlayer/GameInProgressPlayer";
import { PublicGameInProgressProps } from "../../HomePageTypes";
import './PublicMatch.css';

const PublicMatch: React.FC<PublicGameInProgressProps> = ({ match }) => {

	return (
		<div className="spectate-game-block">
			<div className="leaders">
			<GameInProgressPlayer
				playerImage={match.player1.playerImage}
				hexagonColors={match.player1.hexagonColors}
			/>
			<p>vs</p>
			<GameInProgressPlayer
				playerImage={match.player2.playerImage}
				hexagonColors={match.player2.hexagonColors}
			/>
			</div>
			<button className="button">Spectate</button>
	  </div>
	);
};

export default PublicMatch;
