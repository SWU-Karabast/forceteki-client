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
        notice: {
            mb: '1.5rem',
            overflow:'visible',
        },
        boxNews: {
            height: '100%',
        },
    };

    return (
        <Box sx={styles.box}>

            <Card variant="black" sx={styles.boxNews}>
                <Box>
                    <Typography variant="h2" sx={{ p: '0.4rem', borderBottom: '1px solid #404040' }}>
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
