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
        title: 'Card Suspensions in Effect',
        content: `
        <p>In line with the recent suspension announcement, the following cards are suspended in the <strong>Premier</strong> format, effective immediately:</p>

        <ul>
            <li>Chimaera, A Frightening Reality</li>
            <li>Koska Reeves, Warrior of Mandalore</li>
            <li>Neel, The Cutest Boy</li>
            <li>Aggressive Negotiations</li>
        </ul>

        <p style="margin-bottom:0;">Decks that include a suspended card can no longer be used in Premier. The suspension applies to Premier only. Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> with any questions.</p><p></p>
	  `,
        date: '11/9/26',
        image: '/homeworlds-suspension.webp',
        imageAlt: 'Suspended immediately: Chimaera, Koska Reeves, Neel and Aggressive Negotiations',
        imagePosition: 'center top',
    },
    {
        title: 'Homeworlds is Released',
        content: `
        <p>Homeworlds (Set 9) cards are fully implemented and available in all game modes. Now that the set is released, these cards are part of the "Current" card pool.</p>

        <p style="margin-bottom:0;">Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> for progress updates and announcements! If you have coding experience, we're always looking for new contributors.</p><p></p>
	  `,
        date: '10/7/26',
        image: s3ImageURL('ui/homeworlds-preview-banner.webp'),
        imageAlt: 'News Announcement',
        imagePosition: 'center 35%',
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
