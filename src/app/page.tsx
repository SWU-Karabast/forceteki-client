'use client';
import Grid from '@mui/material/Grid2';
import { Typography } from '@mui/material';
import KarabastBanner from './_components/_sharedcomponents/Banner/Banner';
import PublicGames from './_components/HomePage/PublicGames/PublicGames';
import HomePagePlayMode from './_components/HomePage/HomePagePlayMode';
import NewsColumn from './_components/HomePage/News/News';

const Home: React.FC = () => {
    const styles = {
        gridContainer: {
            position: 'relative',
            overflow: 'hidden',
        },
        columnContainer: {
            height: { xs: 'auto', md: '100vh' },
            padding: { xs: '19.5rem 0.75rem 3rem', md: '1rem 0.75rem 3rem' },
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'flex-end' },
            gap: { xs: '1rem', md: 0 },
            // Mobile font-size overrides for homepage readability
            '& .MuiTypography-h1': {
                fontSize: { xs: '26px', md: 'inherit' },
            },
            '& .MuiTypography-h2': {
                fontSize: { xs: '22px', md: 'inherit' },
            },
            '& .MuiTypography-h3': {
                fontSize: { xs: '18px', md: 'inherit' },
            },
            '& .MuiTypography-body1': {
                fontSize: { xs: '16px', md: 'inherit' },
            },
            '& .MuiTypography-body2': {
                fontSize: { xs: '14px', md: 'inherit' },
            },
            '& .MuiButton-root': {
                fontSize: { xs: '16px', md: 'inherit' },
            },
            '& .MuiTab-root': {
                fontSize: { xs: '16px', md: 'inherit' },
            },
            // News content uses html-react-parser, so target raw HTML elements
            '& .news-content p, & .news-content li, & .news-content span': {
                fontSize: { xs: '16px', md: 'inherit' },
                lineHeight: { xs: '1.5', md: 'inherit' },
            },
        },
        column: {
            justifyContent: 'center',
            height: { xs: 'auto', md: 'calc(100% - 10.5rem)' },
            alignSelf: 'end',
            padding: '0 0.75rem',
            width: '100%',
        },
        disclaimer: {
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#FFFFFF',
        },
    };

    return (
        <Grid container sx={styles.gridContainer}>

            <KarabastBanner />

            <Grid container size={12} sx={styles.columnContainer}>
                {/* Public Games - Order 3 on Mobile, 1 on Desktop */}
                <Grid size={{ xs: 12, md: 4 }} order={{ xs: 3, md: 1 }} sx={styles.column}>
                    <PublicGames />
                </Grid>

                {/* Play Mode - Order 1 on Mobile, 2 on Desktop */}
                <Grid size={{ xs: 12, md: 4 }} order={{ xs: 1, md: 2 }} sx={styles.column}>
                    <HomePagePlayMode />
                </Grid>

                {/* News - Order 2 on Mobile, 3 on Desktop */}
                <Grid size={{ xs: 12, md: 4 }} order={{ xs: 2, md: 3 }} sx={styles.column}>
                    <NewsColumn />
                </Grid>
            </Grid>

            <Grid size={12}>
                <Typography variant="body1" sx={styles.disclaimer}>
                    Karabast is in no way affiliated with Disney or Fantasy Flight Games.
                    Star Wars characters, cards, logos, and art are property of Disney
                    and/or Fantasy Flight Games.
                </Typography>
            </Grid>
        </Grid>
    );
};

export default Home;