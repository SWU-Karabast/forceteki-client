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

            <Card variant="blue" sx={styles.notice}>
                <CardContent>
                    <Typography variant="bodyBold">Karabast is an open-source, fan-made platform.</Typography>
                    <Typography variant="body1">It is an educational tool only, meant to facilitate researching decks and strategies that is supportive of in-person play. As such, direct competition through the form of automated tournaments or rankings will not be added.</Typography>
                    <Typography variant="body1">This tool is free to use and is published non-commercially. Payment is not required to access any functionality.</Typography>
                </CardContent>
            </Card>

            <Card variant="black" sx={styles.boxNews}>
                <Box>
                    <Typography variant="h2">
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
