import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import NewsItem from '../_subcomponents/NewsItem/NewsItem';
import { articles } from '@/app/_constants/mockData';

const NewsColumn: React.FC = () => {;

    const styles = {
        box: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
        },
        boxNews: {
            height: '100%',
            borderLeft: '2px solid rgba(255, 167, 38, 0.4)',
            boxShadow: 'inset 3px 0 12px -4px rgba(255, 167, 38, 0.15)',
            overflow: 'auto',
        },
        headerBox: {
            p: '0.4rem',
            borderBottom: '1px solid transparent',
            backgroundImage: 'linear-gradient(to right, rgba(255, 167, 38, 0.3), transparent)',
            backgroundSize: '100% 1px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom',
        },
    };

    return (
        <Box sx={styles.box}>

            <Card variant="black" sx={styles.boxNews}>
                <Box>
                    <Typography variant="h2" sx={styles.headerBox}>
                        News
                    </Typography>
                </Box>
                <Box>
                    {articles.map((article, index) => (
                        <NewsItem article={article} key={index} />
                    ))}
                </Box>
            </Card>

        </Box>
    );
};

export default NewsColumn;
