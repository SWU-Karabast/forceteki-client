import { IAnnouncement, IArticle } from '@/app/_components/HomePage/HomePageTypes';

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
        title: 'Icons Preview is Complete',
        content: `
        <p>All Icons 2027 Edition cards are now fully implemented and available in the <strong>Next Set Preview</strong> card pool. These cards will join Premier when the set releases on November 20th.</p>

        <p style="margin-bottom:0;">Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> with any questions or feedback.</p><p></p>
	  `,
        date: '11/15/26',
        image: '/icons-preview.webp',
        imageAlt: 'Icons 2027 Edition key art: Kylo Ren and Rey dueling with lightsabers',
        imagePosition: 'center 40%',
    },
    {
        title: 'Homeworlds Suspensions: A Brightening Reality',
        content: `
        <p>In line with the recent suspension announcement, the following cards are suspended in the <strong>Premier</strong> format, effective immediately:</p>

        <ul>
            <li>Chimaera, A Frightening Reality</li>
            <li>Koska Reeves, Warrior of Mandalore</li>
            <li>Neel, The Cutest Boy</li>
            <li>Aggressive Negotiations</li>
        </ul>

        <p style="margin-bottom:0;">Decks that include a suspended card can no longer be used in Premier. Join our <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a> with any questions. Have fun in the new meta!</p><p></p>
	  `,
        date: '11/9/26',
        image: '/homeworlds-suspension.webp',
        imageAlt: 'Suspended immediately: Chimaera, Koska Reeves, Neel and Aggressive Negotiations',
        imagePosition: 'center top',
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
