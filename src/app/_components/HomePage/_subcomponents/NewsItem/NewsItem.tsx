import React from 'react';
import {
    CardContent,
    CardMedia,
    Divider,
    Typography,
    Box,
} from '@mui/material';
import { INewsItemProps } from '../../HomePageTypes';
import parse from 'html-react-parser';

const NewsItem: React.FC<INewsItemProps> = ({ article }) => {
    const styles = {
        box: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            mt: '1rem',
        },
        divider: {
            mt: '.5vh',
            mb: '1vh',
        },
        contentText: {
            color: '#fff',
        },
        newsImage: {
            borderRadius: '.5rem',
            maxHeight: '15rem',
        },
    };

    return (
        <>
            <CardMedia
                component="img"
                height="auto"
                image={article.image}
                alt={article.imageAlt}
                sx={styles.newsImage}
            />
            <CardContent>
                <Box sx={styles.box}>
                    <Typography variant="h3">{article.title}</Typography>
                    <Typography variant="h3" sx={{ fontWeight:400 }}>{article.date}</Typography>
                </Box>
                <Divider sx={styles.divider} />
                <Box sx={styles.contentText} className="news-content">
                    {parse(article.content)}
                </Box>
            </CardContent>
        </>
    );
};

export default NewsItem;
