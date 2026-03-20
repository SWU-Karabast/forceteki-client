import React from 'react';
import { Box, Popover } from '@mui/material';
import { IChatObject } from './ChatTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle, CardType } from '../Cards/CardTypes';
import { useLeaderCardFlipPreview } from '@/app/_hooks/useLeaderPreviewFlip';
import { useGame } from '@/app/_contexts/Game.context';

interface IChatCardProps {
    chatObject: IChatObject;
    children: React.ReactNode;
    isPlayerCard: boolean;
}

const ChatCard: React.FC<IChatCardProps> = ({ chatObject, children, isPlayerCard }) => {
    const { hoveredChatCard } = useGame();
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const open = Boolean(anchorElement);

    const hasSetId = chatObject.setId?.set && chatObject.setId.number;
    const isBaseCard = chatObject.printedType === CardType.Base;

    const {
        aspectRatio,
        width,
    } = useLeaderCardFlipPreview({
        anchorElement,
        cardId: anchorElement?.getAttribute('data-card-id') || undefined,
        setPreviewImage,
        frontCardStyle: CardStyle.Plain,
        backCardStyle: CardStyle.PlainLeader,
        isLeader: false,
        isDeployed: true,
    });

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        if (!hasSetId) return;

        const target = event.currentTarget;
        
        setAnchorElement(target);
        const imageUrl = s3CardImageURL({
            setId: chatObject.setId!,
            type: isBaseCard ? 'base' : 'unit',
            id: chatObject.id
        }, CardStyle.Plain);
        setPreviewImage(`url(${imageUrl})`);
        hoveredChatCard.hover(chatObject.uuid);
    };
    
    const handlePreviewClose = () => {
        setAnchorElement(null);
        setPreviewImage(null);
        hoveredChatCard.clear();
    };

    const styles = {
        chatCardWrapper: {
            display: 'inline',
            cursor: hasSetId ? 'pointer' : 'default',
        },
        cardPreview: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio,
            width,
        },
    };

    return (
        <>
            <span
                style={styles.chatCardWrapper}
                onMouseEnter={hasSetId ? handlePreviewOpen : undefined}
                onMouseLeave={hasSetId ? handlePreviewClose : undefined}
                data-card-id={hasSetId ? `${chatObject.setId!.set}_${chatObject.setId!.number}` : undefined}
                data-card-type={isBaseCard ? 'base' : 'unit'}
            >
                {children}
            </span>
            
            {hasSetId && (
                <Popover
                    id="chat-card-popover"
                    sx={{ pointerEvents: 'none',
                        '& .MuiPopover-paper': { transform: 'translateX(-12px) !important' }
                    }}
                    open={open}
                    anchorEl={anchorElement}
                    onClose={handlePreviewClose}
                    disableRestoreFocus
                    slotProps={{ paper: { sx: { backgroundColor: 'transparent', boxShadow: 'none' }, tabIndex: -1 } }}
                    anchorOrigin={{
                        vertical: 'center',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'center',
                        horizontal: 'right',
                    }}
                >
                    <Box sx={{ ...styles.cardPreview, backgroundImage: previewImage }} />
                </Popover>
            )}
        </>
    );
};

export default ChatCard;
