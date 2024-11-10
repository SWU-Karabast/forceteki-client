import React from "react";
import { GameInProgressPlayerProps } from "../../HomePageTypes";

const GameInProgressPlayer: React.FC<GameInProgressPlayerProps> = ({
  playerImage,
}) => {

  return (
	<div className="leader-thumbnail" style={{ backgroundImage: `url(/${playerImage})` }}></div>
  );
};

export default GameInProgressPlayer;