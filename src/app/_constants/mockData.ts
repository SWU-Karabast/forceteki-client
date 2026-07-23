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
        title: '🛠️ Update: Auto-Target is here',
        content: `
        <p>Streamline your gameplay! Auto-Target skips the manual selection step whenever an action or ability has exactly one legal target —  no choice to make, no click needed.</p>

        <p>Find it in <strong>Preferences → Game Options → Gameplay</strong> from either the Home page or in a game. <em>Off by default</em>.</p>

        <p>This is the first in a series of settings we're rolling out to streamline gameplay for players who know their deck inside and out. So keep an eye on the game preferences pane in future updates!</p>
        `,
        date: '7/23/26',
        image: '/auto-target.jpg',
        imageAlt: 'Auto-Target Setting',
    },
    {
        title: 'Ashes of the Empire is now legal in Premier!',
        content: `
        <p>Ashes of the Empire (Set 8) is now legal in the Premier format! The "Next Set" card pools have been disabled in all formats until the next preview season.</p>
    
        <p style="margin-bottom:0;">Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> for progress updates and announcements! If you have coding experience, we're always looking for new contributors.</p><p></p>
	  `,
        date: '7/13/26',
        image: s3ImageURL('ui/ash-news-banner.webp'),
        imageAlt: 'News Announcement',
    },
];

export const announcement: IAnnouncement = {
    key:'introduceAutoTargetFeature',
    title: 'Introducing Auto-Target',
    content:`
    <p>Reduce prompts and streamline your gameplay with the new Auto-Target feature!</p>

    <p>When an effect, attack, or upgrade has exactly one legal target, we'll skip the selection step and resolve it automatically — no extra clicks required.</p>

    <p>
    <em>Examples:</em>
    <ul>
        <li>Attacking a lone Sentinel will automatically select the defender and initiate combat</li>
        <li>Playing an upgrade that can only target one unit will immediately attach it</li>
        <li>Mandatory ping damage will be auto-assigned if there's only one valid target</li>
    </ul>
    </p>

    <strong>How to enable:</strong> From either the Home page or in-game, go to <em>Preferences → Game Options → Gameplay</em> and toggle "Auto-Target" on<br/><br/>`,
    endDate: '2026-08-15', // The date should be year-month-day
    image:'/auto-target-setting.png'
}
