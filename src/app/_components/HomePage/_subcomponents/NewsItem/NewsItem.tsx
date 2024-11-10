import React from "react";
import { NewsItemProps } from "../../HomePageTypes";

const NewsItem: React.FC<NewsItemProps> = ({ article }) => {

	return (
		<>
			<div className="newspost">
      			<img src="/beta.png" alt="Welcome to the Karabast 2.0 Beta" />
     			<h2>"Welcome to the Karabast 2.0 Beta!"</h2>
      			<p>"Welcome to the Karabast 2.0 beta! We’re thrilled to have you on board as we unveil the latest features and enhancements. Your participation is invaluable, and we can’t wait to hear your feedback. Dive in, explore what’s new, and help shape the future of Karabast with us!</p>
				<p> <a target="_blank" href="https://discord.gg/hKRaqHND4v">Join our Discord for the latest progress updates and timelines</a>. If you have coding experience we are always open to new contributors. Info on how to help out can also be found on <a target="_blank" href="https://discord.gg/hKRaqHND4v">Discord</a>. We appreciate everyone's patience as we work on this new Karabast experience, and look forward to playing games with you when we launch!</p>
    		</div>
		</>
	);
};

export default NewsItem;
