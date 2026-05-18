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
        title: 'A Lawless Time Premier Format',
        content: `
        <p>Set 7, A Lawless Time, is now legal in Premier! Year 1 sets can still be played in Open format.</p>
    
        <p style="margin-bottom:0;">Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> for progress updates and announcements! If you have coding experience, we are always open to new contributors.</p><p></p>
	  `,
        date: '3/7/26',
        image: s3ImageURL('ui/law-news-banner.webp'),
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
    key:'updatedTimers01',
    title: 'Updated Game Timers',
    content:`
    We've reworked how game timers work to help keep matches moving and prevent indefinite stalling.<br/><br/>

    <b>What's changed:</b> Previously, each player had a per-action timer that reset on any button click or chat message. Now, each player has <b>20 seconds per action</b> backed by a <b>2 minute time bank</b>. When a player's 20 seconds runs out, their timer begins drawing from their bank. The bank does not refill — if a player's bank runs out, that player concedes the game.<br/><br/>

    <b>A few things to note:</b><br/>
    - This only applies to <b>public games</b>. Private games remain untimed.<br/>
    - We'll be actively monitoring the values for both the per-action timer and the time bank, and may adjust them based on how games play out.<br/>
    <br/>
    Have feedback? Let us know in our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a>!`,
    endDate: '2027-05-06', // The date should be year-month-day
    image:'/timerexplainer.png'
}
