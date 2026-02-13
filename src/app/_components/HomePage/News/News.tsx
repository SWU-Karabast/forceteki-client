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
            boxShadow: 'inset 2px 0 0 0 rgba(255, 215, 0, 1), inset 6px 0 12px -4px rgba(255, 215, 0, 0.4)',
            overflow: 'auto',
        },
        headerBox: {
            p: '0.4rem',
        },
    };

    return (
        <Box sx={styles.box}>

            <Card variant="black" sx={styles.boxNews}>
                <Box>
                    <Typography variant="h2" sx={{ fontSize: { xs: '2.0rem', md: '1.50rem' } }}>
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
