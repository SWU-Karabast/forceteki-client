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
        title: 'Undo Button in Private Lobbies - Beta Test',
        content: `
        <p>We are doing a beta test of the Undo button! Create a private lobby and enable the "Undo" option in the lobby settings to test. See the <a target="_blank" href="https://discord.com/channels/1220057752961814568/1225597332301680640/1422673270649655316" style="color:lightblue;">official announcement</a> in our Discord for full details. Please help us test so we can turn it on for all games soon!</p>
    
        <p style="margin-bottom:0;">Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> for progress updates and announcements! If you have coding experience, we are always open to new contributors.</p><p></p>
	  `,
        date: '10/3/25',
        image: '/undo-announcement.webp',
        imageAlt: 'News Announcement',
    },
    {
        title: 'Force Throw Ban',
        content: `
        <p>Force Throw is officially no longer legal in Premier or Next Set Preview formats. See the <a target="_blank" href="https://starwarsunlimited.com/articles/throwing-the-meta-for-a-loop" style="color:lightblue;">official FFG announcement</a>. It will continue to be playable in the Open format.</p>
    
        <p style="margin-bottom:0;">Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> for progress updates and announcements! If you have coding experience, we are always open to new contributors.</p><p></p>
	  `,
        date: '9/23/25',
        image: s3ImageURL('ui/forcethrow.webp'),
        imageAlt: 'News Announcement',
    }
];

export const announcement: IAnnouncement = {
    key:'swuStats',
    title: 'New Feature - SWUStats Integration',
    content:`
    Track your wins, losses, and match‑up win‑rates on our partner site, <strong>SWUSTATS</strong>! By adding a deck on swustats and importing it into Karabast you are able to retrieve in-depth information on your deck&#39;s performance.<br/><br/> 
    
    You can link your Karabast account to your SWUStats account so your stats will appear under "Owner" for your decks. Just go to the <a target="_blank" href="https://karabast.net/Preferences" style="color:lightblue;">Preferences page</a> to link!`,
    endDate: '2025-10-08', // The date should be year-month-day
    image:'/swuImage.webp'
}