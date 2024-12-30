// ResourcesOverlay.tsx

import React from 'react';
import {
    Modal,
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { IResourcesOverlayProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import GameCard from '@/app/_components/_sharedcomponents/Cards/GameCard/GameCard';

const ResourcesOverlay: React.FC<IResourcesOverlayProps> = ({
    isModalOpen,
    handleModalToggle,
}) => {
    const { gameState, connectedPlayer } = useGame();
    const mainContainerStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1em',
        p: '1em',
        justifyContent: 'center',
        textWrap: 'wrap',
    };
    return (
        <Modal
            open={isModalOpen}
            onClose={handleModalToggle}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#00000080',
            }}
        >
            <Card
                sx={{
                    position: 'relative',
                    width: '80%',
                    height: '60%',
                    p: 2,
                    backgroundColor: '#000000B3',
                    textAlign: 'center',
                }}
            >
                <CardContent>
                    <Typography variant="h6" color="#fff">
                        Your Resources
                    </Typography>
                    <Typography variant="caption" color="#fff">
                        Your Resources
                    </Typography>
                    <Box sx={mainContainerStyle}>
                        {gameState.players[connectedPlayer].cardPiles['resources'].map((card: ICardData) => (
                            <GameCard
                                key={card.uuid}
                                card={card}
                            />
                        ))}
                    </Box>
                </CardContent>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                    }}
                >
                    <IconButton onClick={handleModalToggle}>
                        <Close sx={{ color: '#fff' }} />
                    </IconButton>
                </Box>
            </Card>
        </Modal>
    );
};

export default ResourcesOverlay;
