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
            background: 'linear-gradient(to right, rgba(255, 215, 0, 1), rgba(255, 215, 0, 0.5))',
            height: '3px',
            border: 'none',
        },
        contentText: {
            color: '#fff',
        },
        newsImage: {
            maxHeight: '15rem',
            cursor: article.link ? 'pointer' : 'default',
            borderRadius: '.5rem',
            mt: '0.5rem',
        },
        dateText: {
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.45)',
            fontSize: { xs: '1.5rem', md: '0.9rem' },
        },
    };

    return (
        <Box>
            <CardMedia
                component="img"
                height="auto"
                image={article.image}
                alt={article.imageAlt}
                sx={styles.newsImage}
                onClick={article.link ? () => window.open(article.link, '_blank') : undefined}
            />
            <CardContent>
                <Box sx={styles.box}>
                    <Typography variant="h3" sx={{ fontSize: { xs: '1.9rem', md: '1.15rem' } }}>{article.title}</Typography>
                    <Typography variant="h3" sx={styles.dateText}>{article.date}</Typography>
                </Box>
                <Divider sx={styles.divider} />
                <Box sx={styles.contentText} className="news-content">
                    {parse(article.content)}
                </Box>
            </CardContent>
        </Box>
    );
};

export default NewsItem;
