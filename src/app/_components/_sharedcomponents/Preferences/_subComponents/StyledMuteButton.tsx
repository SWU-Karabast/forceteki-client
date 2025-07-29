import React, { useState, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledMuteButton = styled(IconButton)<{ disabled?: boolean }>(({ disabled }) => ({
    width: 32,
    height: 32,
    padding: 0,
    borderRadius: 4,
    border: '2px solid #00D4FF',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease-in-out',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    '&:hover': {
        backgroundColor: disabled ? 'transparent' : 'rgba(0, 212, 255, 0.1)',
        borderColor: '#00D4FF',
        boxShadow: disabled ? 'none' : '0 0 8px rgba(0, 212, 255, 0.3)',
    },
    '&.muted': {
        backgroundColor: '#00D4FF',
        borderColor: '#00D4FF',
        boxShadow: disabled ? 'none' : '0 0 8px rgba(0, 212, 255, 0.5)',
        '&:hover': {
            backgroundColor: disabled ? '#00D4FF' : '#0099CC',
            borderColor: disabled ? '#00D4FF' : '#0099CC',
        },
    },
}));

interface MuteIconProps {
    defaultChecked?: boolean;  // Changed from defaultMuted
    disabled?: boolean;        // Added disabled prop
    onChange?: (muted: boolean) => void;
}

function MuteIcon({ defaultChecked = false, disabled = false, onChange }: MuteIconProps) {
    const [isMuted, setIsMuted] = useState(defaultChecked);

    // Update internal state when defaultChecked changes
    useEffect(() => {
        setIsMuted(defaultChecked);
    }, [defaultChecked]);

    const handleToggle = () => {
        if (disabled) return; // Don't allow toggle when disabled

        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        onChange?.(newMutedState);
    };

    // SVG for unmuted (speaker with sound waves)
    const UnmutedIcon = () => (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M11 5L6 9H2V15H6L11 19V5Z"
                stroke={disabled ? '#888' : '#00D4FF'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={'none'}
            />
            <path
                d="M19.07 4.93C20.9463 6.80629 21.9999 9.34809 21.9999 12C21.9999 14.6519 20.9463 17.1937 19.07 19.07"
                stroke={disabled ? '#888' : '#00D4FF'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54"
                stroke={disabled ? '#888' : '#00D4FF'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

    // SVG for muted (speaker with X)
    const MutedIcon = () => (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M11 5L6 9H2V15H6L11 19V5Z"
                stroke={disabled ? '#444' : '#000'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={disabled ? '#444' : '#000'}
            />
            <line
                x1="23"
                y1="9"
                x2="17"
                y2="15"
                stroke={disabled ? '#444' : '#000'}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <line
                x1="17"
                y1="9"
                x2="23"
                y2="15"
                stroke={disabled ? '#444' : '#000'}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );

    return (
        <StyledMuteButton
            className={disabled ? 'muted' : isMuted ? 'muted' : ''}
            onClick={handleToggle}
            disabled={disabled}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
            {disabled ? <MutedIcon /> : isMuted ? <MutedIcon /> : <UnmutedIcon />}
        </StyledMuteButton>
    );
}

export default MuteIcon;