import React from "react";
import './News.css';

const NewsColumn: React.FC = () => {

	const boxStyle = {
		height: "80vh",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		mr: "1.8em",
	};

	return (
		<>
			<div className="container + ' ' + blue-bg">
					<p><b>Karabast is an open-source, fan-made platform.</b></p>
					<p>It is an educational tool only, meant to facilitate researching decks and strategies that is supportive of in-person play. As such, direct competition through the form of automated tournaments or rankings will not be added.</p>
					<p>This tool is free to use and is published non-commercially. Payment is not required to access any functionality.</p>
			</div>

			<div className="container + ' ' + black-bg">
				<h2>News</h2>
				<div className="newspost">
					<img src="/beta.png" alt="Welcome to the Karabast 2.0 Beta" />
					<h3>Welcome to the Karabast Beta!</h3>
					<p>This is it, the beta version of the new Karabast! We’re thrilled to have you on board. Dive in, explore what’s new, and help shape the future of Karabast with us!</p>
					<p> <a target="_blank" href="https://discord.gg/hKRaqHND4v">Join our Discord for the latest progress updates and timelines</a>. If you have coding experience we are always open to new contributors. Info on how to help out can also be found on <a target="_blank" href="https://discord.gg/hKRaqHND4v">Discord</a>.</p>
				</div>
			</div>
		</>
	);
};

export default NewsColumn;
