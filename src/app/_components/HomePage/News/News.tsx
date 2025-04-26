import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import NewsItem from '../_subcomponents/NewsItem/NewsItem';
import { articles } from '@/app/_constants/mockData';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const NewsColumn: React.FC = async () => {
    let secret = 'value_0';

    try {
        const client = new SecretsManagerClient({ region: 'us-east-1' });
        const command = new GetSecretValueCommand({ SecretId: 'DUMMY_SECRET' });
        const response = await client.send(command);
    
        secret = response.SecretString ? JSON.parse(response.SecretString) : 'value_1';
    } catch (error) {
        console.log('Error fetching secret:', error);
        secret = 'value_2';
    }

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
                    <Typography variant="bodyBold">Pardon our dust!</Typography>
                    <Typography variant="body1">We are working on bringing you important platform features. This will often result in a brief maintenance downtime which we are doing in the mornings EST. These will become less frequent as we get closer to being feature complete.{secret}</Typography>
                    <Typography variant="body1">We appreciate your patience as we make Karabast the best it can be!</Typography>
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
