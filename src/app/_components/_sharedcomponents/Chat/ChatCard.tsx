import React from 'react';
import { Box, Popover, PopoverOrigin } from '@mui/material';
import { IChatObject } from './ChatTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle } from '../Cards/CardTypes';
import { useLeaderCardFlipPreview } from '@/app/_hooks/useLeaderPreviewFlip';

interface IChatCardProps {
    chatObject: IChatObject;
    children: React.ReactNode;
    isPlayerCard: boolean;
}

const ChatCard: React.FC<IChatCardProps> = ({ chatObject, children, isPlayerCard }) => {
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);

    const hasSetId = chatObject.setId && chatObject.setId.set && chatObject.setId.number;

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
        
        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            // Create a mock card object for s3CardImageURL that matches ISetCode interface
            const mockCard = {
                setId: chatObject.setId!,
                type: 'unit',
                id: chatObject.id
            };
            const imageUrl = s3CardImageURL(mockCard, CardStyle.Plain);
            setPreviewImage(`url(${imageUrl})`);
        }, 200);
    };
    
    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setAnchorElement(null);
        setPreviewImage(null);
    };

    const popoverConfig = (): { anchorOrigin: PopoverOrigin, transformOrigin: PopoverOrigin } => {
        return { 
            anchorOrigin: {
                vertical: 'center',
                horizontal: 'left',
            },
            transformOrigin: {
                vertical: 'center',
                horizontal: 'right',
            } 
        };
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
                data-card-type="unit"
            >
                {children}
            </span>
            
            {hasSetId && (
                <Popover
                    id="chat-card-popover"
                    sx={{ pointerEvents: 'none' }}
                    open={open}
                    anchorEl={anchorElement}
                    onClose={handlePreviewClose}
                    disableRestoreFocus
                    slotProps={{ paper: { sx: { backgroundColor: 'transparent', boxShadow: 'none' }, tabIndex: -1 } }}
                    {...popoverConfig()}
                >
                    <Box sx={{ ...styles.cardPreview, backgroundImage: previewImage }} />
                </Popover>
            )}
        </>
    );
};

export default ChatCard;
