import { IAnnouncement, IArticle } from '@/app/_components/HomePage/HomePageTypes';
import { s3ImageURL } from '../_utils/s3Utils';

export const playerMatches = [
    {
        player1: {
            playerImage: 'leaders/iden.webp',
            hexagonColors: ['#4689E1', '#454545', '#298F4A'],
        },
        player2: {
            playerImage: 'leaders/boba.webp',
            hexagonColors: ['#F7B440', '#454545', '#298F4A'],
        },
    },
    {
        player1: {
            playerImage: 'leaders/han.webp',
            hexagonColors: ['#F7B440', '#FAFADB', '#F7B440'],
        },
        player2: {
            playerImage: 'leaders/leia.webp',
            hexagonColors: ['#298F4A', '#FAFADB', '#C82134'],
        },
    },
    {
        player1: {
            playerImage: 'leaders/luke.webp',
            hexagonColors: ['#4689E1', '#FAFADB', '#4689E1'],
        },
        player2: {
            playerImage: 'leaders/palpatine.webp',
            hexagonColors: ['#298F4A', '#454545', '#3357FF'],
        },
    },
    {
        player1: {
            playerImage: 'leaders/sabine.webp',
            hexagonColors: ['#C82134', '#FAFADB', '#298F4A'],
        },
        player2: {
            playerImage: 'leaders/vader.webp',
            hexagonColors: ['#C82134', '#454545', '#298F4A'],
        },
    },
    {
        player1: {
            playerImage: 'leaders/leia.webp',
            hexagonColors: ['#298F4A', '#FAFADB', '#FF3357'],
        },
        player2: {
            playerImage: 'leaders/luke.webp',
            hexagonColors: ['#4689E1', '#FAFADB', '#298F4A'],
        },
    },
    {
        player1: {
            playerImage: 'leaders/boba.webp',
            hexagonColors: ['#F7B440', '#454545', '#F7B440'],
        },
        player2: {
            playerImage: 'leaders/iden.webp',
            hexagonColors: ['#4689E1', '#454545', '#298F4A'],
        },
    },
    {
        player1: {
            playerImage: 'leaders/leia.webp',
            hexagonColors: ['#298F4A', '#FAFADB', '#298F4A'],
        },
        player2: {
            playerImage: 'leaders/boba.webp',
            hexagonColors: ['#F7B440', '#454545', '#298F4A'],
        },
    },
    {
        player1: {
            playerImage: 'leaders/sabine.webp',
            hexagonColors: ['#C82134', '#FAFADB', '#F7B440'],
        },
        player2: {
            playerImage: 'leaders/boba.webp',
            hexagonColors: ['#F7B440', '#454545', '#F7B440'],
        },
    },
];

export const articles: IArticle[] = [
    {
        title: 'A Lawless Time Preview Format with Mock Bases + Set Rotation',
        content: `
        <p>Next Set Preview format for A Lawless Time is now live! There are a couple important features attached to this:</p>

        <p>- <b>Mock Bases:</b> Since we don't yet have the common bases for A Lawless Time other than Daimyo\'s Palace, we've created mock bases that simulate the intended gameplay experience. These mock bases can be used in Next Set Preview lobbies until the official bases are available.</p>

        <p>- <b>Format Rotation:</b> Set 7 is the first format after set rotation. Next Set Preview format will enforce this rule and cards from sets 1 - 3 will not be legal. They can continue to be used alongside the set 7 preview cards in Open format.</p>
    
        <p style="margin-bottom:0;">Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> for progress updates and announcements! If you have coding experience, we are always open to new contributors.</p><p></p>
	  `,
        date: '1/27/26',
        image: s3ImageURL('ui/law-banner.webp'),
        imageAlt: 'News Announcement',
    },
    {
        title: 'Best of Three Format Available!',
        content: `
        <p>Best of three matches are now available! Logged-in players can now compete in a best of three series to determine the winner. Just choose "Premier Best-of-Three" or "Open Best-of-Three" from the format dropdown. Anonymous accounts can participate in best-of-three private lobbies only.</p>
    
        <p style="margin-bottom:0;">Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> for progress updates and announcements! If you have coding experience, we are always seeking new contributors.</p><p></p>
	  `,
        date: '12/18/25',
        image: '/bo3-news.png',
        imageAlt: 'News Announcement',
    }
];

export const announcement: IAnnouncement = {
    key:'callForVolunteers01',
    title: 'Dev Volunteers Needed',
    content:`
    The Karabast dev team is entirely volunteer-based and we are looking for more help! As the SWU community has grown, so have the needs of the Karabast platform, and some existing volunteers have needed to step back for personal reasons.<br/><br/> 
    
    So, we are seeking additional developers to join our team so that we can efficiently bring <b>new features, bug fixes, and new cards</b> to the community! We are particularly seeking contributors who have any of the following skill sets, but all help is welcomed:<br/><br/>
    - Senior-level backend experience with JavaScript / TypeScript<br/>
    - Anyone with design experience, especially related to UI/UX<br/>
    - Senior- or junior-level frontend experience with React<br/>
    <br/>
    If you're interested, please reach out in our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a>!`,
    endDate: '2025-12-21', // The date should be year-month-day
    image:'/karabastdevlogoedited.png'
}
