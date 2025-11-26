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
        title: 'Secrets of Power + Intro Battle: Hoth in Premier',
        content: `
        <p>The Secrets of Power and Intro Battle: Hoth sets are now legal in Premier format! We have closed down Next Set Preview format until the next preview season begins. We wish everyone luck with practicing for the new season!</p>
    
        <p style="margin-bottom:0;">Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> for progress updates and announcements! If you have coding experience, we are always open to new contributors.</p><p></p>
	  `,
        date: '11/3/25',
        image: s3ImageURL('ui/sec-banner.webp'),
        imageAlt: 'News Announcement',
    },
    {
        title: 'Undo Button in Private Lobbies - Beta Test',
        content: `
        <p>We are doing a beta test of the Undo button! Create a private lobby and enable the "Undo" option in the lobby settings to test. See the <a target="_blank" href="https://discord.com/channels/1220057752961814568/1225597332301680640/1422673270649655316" style="color:lightblue;">official announcement</a> in our Discord for full details. Please help us test so we can turn it on for all games soon!</p>
    
        <p style="margin-bottom:0;">Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> for progress updates and announcements! If you have coding experience, we are always open to new contributors.</p><p></p>
	  `,
        date: '10/3/25',
        image: '/undo-announcement.webp',
        imageAlt: 'News Announcement',
    }
];

export const announcement: IAnnouncement = {
    key:'cloudflareOutage',
    title: 'Cloudflare Outage Affecting Karabast',
    content:`
    There is currently a global outage with Cloudflare, a major internet infrastructure provider. Karabast is not affected directly, but many deckbuilder sites such as SWUDB are currently down.
    As a result, games cannot be played using deck links from affected deckbuilder sites. This includes decks that are saved to your profile.
    <br/><br/>
    For more details, see <a target="_blank" href="https://www.techradar.com/pro/live/a-cloudflare-outage-is-taking-down-parts-of-the-internet" style="color:lightblue;">news updates</a> about the outage.`,
    endDate: '2025-11-20', // The date should be year-month-day
    image:'/cloudflareOutage.png'
}
