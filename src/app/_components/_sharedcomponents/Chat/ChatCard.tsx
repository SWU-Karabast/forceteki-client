import React from 'react';
import { Box, Popover } from '@mui/material';
import { IChatObject } from './ChatTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';
import { CardStyle, CardType } from '../Cards/CardTypes';
import { useLeaderCardFlipPreview } from '@/app/_hooks/useLeaderPreviewFlip';
import { useGame } from '@/app/_contexts/Game.context';

interface IChatCardProps {
    chatObject: IChatObject;
    children: React.ReactNode;
    isPlayerCard: boolean;
}

const ChatCard: React.FC<IChatCardProps> = ({ chatObject, children }) => {
    const { hoveredChatCard } = useGame();
    const locale = useCardImageLocale();
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const open = Boolean(anchorElement);

    const hasSetId = chatObject.setId?.set && chatObject.setId.number;
    const isBaseCard = chatObject.printedType === CardType.Base;
    const isToken = !!chatObject.printedType?.includes('token');
    const canPreview = hasSetId || (isToken && !!chatObject.id);

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
    });

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        if (!canPreview) return;

        const target = event.currentTarget;
        
        setAnchorElement(target);
        const imageUrl = s3CardImageURL({
            setId: chatObject.setId!,
            type: isBaseCard ? 'base' : isToken ? chatObject.printedType! : 'unit',
            id: chatObject.id
        }, locale, CardStyle.Plain);
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
            cursor: canPreview ? 'pointer' : 'default',
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
                onMouseEnter={canPreview ? handlePreviewOpen : undefined}
                onMouseLeave={canPreview ? handlePreviewClose : undefined}
                data-card-id={hasSetId ? `${chatObject.setId!.set}_${chatObject.setId!.number}` : isToken ? chatObject.id : undefined}
                data-card-type={isBaseCard ? 'base' : 'unit'}
            >
                {children}
            </span>
            
            {canPreview && (
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
