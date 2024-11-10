"use client";
import React, { useState } from "react";
import KarabastBanner from "./_components/_sharedcomponents/Banner/Banner";
import PublicGames from "./_components/HomePage/PublicGames/PublicGames";
import CreateGameForm from "./_components/_sharedcomponents/CreateGameForm/CreateGameForm";
import NewsColumn from "./_components/HomePage/News/News";
import './page.css';

const Home: React.FC = () => {
	const [format, setFormat] = useState("Premier");

	return (
		<>
		<KarabastBanner/>
		<div className="core-wrapper">
			<div className="game-browser-wrapper">
				<PublicGames format={format} />
			</div>
			<div className="create-game-wrapper">
				<CreateGameForm format={format} setFormat={setFormat} />
			</div>
			<div className="news-wrapper">
				<NewsColumn />
			</div>
		</div>
		<div className="disclaimer">
			<p>Karabast is in no way affiliated with Disney or Fantasy Flight Games. Star Wars characters, cards, logos, and art are property of Disney and/or Fantasy Flight Games.</p>
		</div>
		</>
	);
};

export default Home;