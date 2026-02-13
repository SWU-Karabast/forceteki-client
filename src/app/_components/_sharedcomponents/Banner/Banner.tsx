import React from 'react';
import { Box, Typography } from '@mui/material';
import { s3ImageURL } from '@/app/_utils/s3Utils';

const KarabastBanner: React.FC = () => {
    const styles = {
        titleheader: { 
            fontSize: { xs: '2.5rem', md: '3.2rem' }, 
            fontWeight: 400, 
            marginBottom: '5px' 
        },
        subheader: { 
            marginBottom: 0, 
        },
        bannerContainerStyle: {
            position: 'absolute',
            height: { xs: '450px', md: '316px' },
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 2%',
            zIndex: -1,
            overflow: 'hidden',
        },
        textBoxStyle: {
            position: 'absolute',
            top: 0,
            left: 0,
            margin: { xs: '1rem 0 0 1.5rem' },
            width: { xs: '80%', md: '20%' },
            zIndex: 10,
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 0, 0, 0.5)',
        },
        homeBanner: {
            width: { xs: '100%', md: 'calc(100% - 240px)' },
            minWidth: '400px',
            height: '100%',
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: -1,
            mask: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%) 100% 50% / 100% 100% repeat-x',
            display: 'flex',
        },
        banner: {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            clipPath: {
                xs: 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0% 100%)',
                md: 'polygon(150px 0, 100% 0, calc(100% - 150px) 100%, 0% 100%)',
            },
            flex: 1,
        },
        block1: {
            backgroundImage: `url(${s3ImageURL('ui/banner-sec-andor.webp')})`,
            marginRight: { xs: '-7px', md: '-152px' },
        },
        block2: {
            backgroundImage: `url(${s3ImageURL('ui/banner-sec-padme.webp')})`,
        },
        block3: {
            backgroundImage: `url(${s3ImageURL('ui/banner-sec-palp.webp')})`,
            marginLeft: { xs: '-7px', md: '-152px' },
        },
        block4: {
            backgroundImage: `url(${s3ImageURL('ui/banner-sec-yularen.webp')})`,
            marginLeft: { xs: '-7px', md: '-152px' },
        },
    };

    return (
        <Box sx={styles.bannerContainerStyle}>
            <Box sx={styles.textBoxStyle}>
                <Typography variant="h1" sx={styles.titleheader}>KARABAST</Typography>
                <Typography variant="body1" sx={styles.subheader}>The Fan-Made, Open-Source</Typography>
                <Typography variant="body1">Star Wars Unlimited Simulator</Typography>
            </Box>
            <Box sx={styles.homeBanner}>
                <Box sx={[styles.banner, styles.block1]} />
                <Box sx={[styles.banner, styles.block2]} />
                <Box sx={[styles.banner, styles.block3]} />
                <Box sx={[styles.banner, styles.block4]} />
            </Box>
        </Box>
    );
};

export default KarabastBanner;
