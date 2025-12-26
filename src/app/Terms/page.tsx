'use client';
import React from 'react';
import { Box, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';
import { s3ImageURL } from '@/app/_utils/s3Utils';
import { useRouter } from 'next/navigation';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

const tosBlocks = [
    { type: 'title', text: 'Karabast.net – Terms of Service' },
    { type: 'heading', text: 'Introduction' },
    { type: 'p', text: 'By accessing or using karabast.net (“the Site”), you agree to these Terms of Service (“Terms”). If you do not agree, you may not use the Site.' },
    { type: 'p', text: 'karabast.net is a free, non-commercial, open-source fan project designed for online playtesting of Star Wars Unlimited card game decks. It is not affiliated with, endorsed by, or associated with Disney, Lucasfilm Ltd., Fantasy Flight Games, or any other rights holders. All related trademarks and intellectual property remain the property of their respective owners.' },
    { type: 'heading', text: 'Eligibility & Accounts' },
    { type: 'ol', items: [
        'Users must be at least 18 years of age to use the Site.',
        'Users may access the Site without creating an account. Anonymous users will have restricted features, including disabled chat.',
        'Registered accounts may be created through third-party logins (Discord or Google).',
        'Offensive usernames are prohibited. The Site reserves the right to reject, suspend, or require renaming of usernames that violate community standards.',
    ] },
    { type: 'heading', text: 'Code of Conduct' },
    { type: 'ol', items: [
        'The Site reserves the right to mute, suspend, or otherwise restrict accounts that violate the rules below, at its sole discretion, for any duration deemed appropriate.',
        'Users must not use slurs or vulgarity in text chat or in usernames.',
        'Harassment or abusive behavior towards other users in text chat is prohibited.',
        'Impersonation of other users, moderators, or administrators is prohibited.'
    ] },
    { type: 'heading', text: 'Decks' },
    { type: 'ol', items: [
        'Users may create or import decks for use on the Site.',
        'User deck information is private and not distributed outside of gameplay. The Site does not claim ownership of decks, nor does it share or publish deck data beyond what occurs during play sessions unless explicitly permitted by the user for the purpose of tracking play statistics.'
    ] },
    { type: 'heading', text: 'Intellectual Property' },
    { type: 'ol', items: [
        'Star Wars Intellectual Property: All Star Wars names, images, card designs, and related intellectual property are the property of their respective owners. karabast.net makes no claim of ownership and operates solely as a non-commercial fan project.',
        'Site Code: The software powering karabast.net is open source and available on GitHub under its applicable license: github.com/SWU-Karabast/forceteki.'
    ] },
    { type: 'heading', text: 'Privacy & Data Use' },
    { type: 'ol', items: [
        'Minimal Data Collection: karabast.net does not collect or store personal information beyond what is necessary to operate the Site. Login is handled via Discord or Google; passwords are never stored by the Site.',
        'Chat Data: Chat is not recorded in logs during normal gameplay. If a user files a \'Report Player\' complaint, the relevant chat session may be captured temporarily for moderation review.',
        'Bug Reports: User-submitted bug reports may include the current game state and technical details such as screen resolution. This data is used only to diagnose and resolve issues.',
        'Deck Data: User deck information is private and not distributed outside of gameplay. Deck contents are visible only during play, and only to opponents and spectators in that match unless a private lobby is used.',
        'Statistics & SWUStats Integration: The Site may send anonymized game and card play statistics to third-party services such as SWUStats.net. This is entirely optional and only occurs if users provide their SWUStats deck link or key. Use of such a link constitutes implicit consent for the Site to share user deck and play data with SWUStats.net. Otherwise, data is not shared outside of the Site.',
        'No Advertising or Tracking: The Site does not use Google Analytics, advertising networks, or third-party trackers. Cookies or similar technologies may be used only for login and session management.',
        'Data Sharing: The Site does not sell, rent, or otherwise share user data with third parties, except as noted above, where required by law, or where users have given consent. The Site may expand integrations to additional third-party services in the future (e.g., new deck statistics providers), but will not share game data without user consent.',
        'Data Retention: Data related to moderation may be retained only as long as necessary to address the relevant issue. Deck data may be deleted from the user\'s account but may be retained in logs for a period of time.'
    ] },
    { type: 'heading', text: 'Disclaimer of Warranties' },
    { type: 'ol', items: [
        'The Site is provided on an \'AS IS\' and \'AS AVAILABLE\' basis without warranties of any kind.',
        'The Site does not guarantee uninterrupted availability and may be unavailable at times due to maintenance, code deployments, or other reasons.'
    ] },
    { type: 'heading', text: 'Limitation of Liability' },
    { type: 'p', text: 'To the fullest extent permitted by applicable law, karabast.net and its contributors shall not be liable for any damages arising from or related to your use of the Site.' },
    { type: 'heading', text: 'Termination' },
    { type: 'p', text: 'The Site reserves the right to restrict, suspend, or terminate access for any user who violates these Terms or engages in conduct deemed harmful to the Site or its community.' },
    { type: 'heading', text: 'Changes to Terms' },
    { type: 'p', text: 'These Terms may be updated periodically. The latest version will always be posted on this page. Continued use of the Site constitutes acceptance of any modifications.' }
] as const;

const TermsOfService: React.FC = () => {
    const router = useRouter();
    const handleExit = () => router.push('/');

    const styles = {
        page: {
            minHeight: '100vh',
            backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column' as const,
        },
        headerBar: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            position: 'relative' as const,
            padding: '0 32px 24px 32px',
            zIndex: 2,
        },
        backButton: {
            position: 'absolute' as const,
            left: '0',
            top: '-60px',
            zIndex: 3,
        },
        brand: {
            fontSize: '3.0em',
            fontWeight: 600,
            color: 'white',
            letterSpacing: 1,
            cursor: 'pointer',
        },
        container: {
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '24px',
        },
        cardWrapper: {
            position: 'relative' as const,
            width: 'min(100%, 1000px)',
        },
        card: {
            width: 'min(100%, 1000px)',
            maxHeight: 'calc(100vh - 160px)',
            background: 'rgba(0,0,0,1)',
            backdropFilter: 'blur(6px)',
            borderRadius: '18px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            color: 'white',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column' as const,
        },
        scroll: {
            overflowY: 'auto' as const,
            paddingRight: '8px',
            flex: 1,
            minHeight: 0,
        },
        sectionTitle: { fontWeight: 700, mt: 2 },
        paragraph: { opacity: 0.95, mt: 1 },
        list: { pl: 3, mt: 1, listStyleType: 'decimal', listStylePosition: 'outside' },
        li: { display: 'list-item', listStyleType: 'decimal', pl: 1 },
    };

    return (
        <Box sx={styles.page}>
            <Box sx={styles.headerBar}>
                <Typography sx={styles.brand} onClick={handleExit}>KARABAST</Typography>
            </Box>

            <Box sx={styles.container}>
                <Box sx={styles.cardWrapper}>
                    <Box sx={styles.backButton}>
                        <PreferenceButton
                            variant={'standard'}
                            text="Back"
                            buttonFnc={handleExit}
                        />
                    </Box>
                    <Box sx={styles.card}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Terms of Service
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={styles.scroll}>
                            {tosBlocks.map((block, idx) => {
                                if (block.type === 'title') {
                                    return <Typography key={idx} variant="h5" fontWeight={700} gutterBottom>{block.text}</Typography>;
                                }
                                if (block.type === 'heading') {
                                    return <Typography key={idx} variant="h6" sx={styles.sectionTitle}>{block.text}</Typography>;
                                }
                                if (block.type === 'p') {
                                    return <Typography key={idx} variant="body1" sx={styles.paragraph} paragraph>{block.text}</Typography>;
                                }
                                if (block.type === 'ol') {
                                    return (
                                        <List key={idx} component="ol" sx={styles.list}>
                                            {block.items.map((it, i) => {
                                                // Check if the item starts with a short phrase followed by a colon
                                                const colonIndex = it.indexOf(':');
                                                if (colonIndex > 0 && colonIndex < 50) { // Reasonable limit for "short phrase"
                                                    const beforeColon = it.substring(0, colonIndex);
                                                    const afterColon = it.substring(colonIndex);
                                                    return (
                                                        <ListItem key={i} component="li" sx={styles.li}>
                                                            <ListItemText
                                                                primary={
                                                                    <>
                                                                        <Typography component="span" sx={{ fontWeight: 'bold' }}>
                                                                            {beforeColon}
                                                                        </Typography>
                                                                        {afterColon}
                                                                    </>
                                                                }
                                                            />
                                                        </ListItem>
                                                    );
                                                } else {
                                                    return (
                                                        <ListItem key={i} component="li" sx={styles.li}>
                                                            <ListItemText primary={it} />
                                                        </ListItem>
                                                    );
                                                }
                                            })}
                                        </List>
                                    );
                                }
                                return null;
                            })}
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                    Karabast is in no way affiliated with Disney or Fantasy Flight Games. Star Wars characters, cards, logos, and art are property of their respective owners.
                </Typography>
            </Box>
        </Box>
    );
};

export default TermsOfService;
