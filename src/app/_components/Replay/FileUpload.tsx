'use client';
import React, { useState, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { parseReplayFile } from '@/app/_utils/replayParser';
import { ParsedReplay } from '@/app/_contexts/Replay.context';

interface FileUploadProps {
    onReplayLoaded: (replay: ParsedReplay, rawContent: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onReplayLoaded }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback(async (file: File) => {
        if (loading) return;
        setError(null);
        setLoading(true);

        try {
            let rawContent: string;
            let replay: ParsedReplay;

            if (file.name.endsWith('.swureplay')) {
                rawContent = await file.text();
                replay = parseReplayFile(rawContent);
            } else if (file.name.endsWith('.zip')) {
                const buffer = await file.arrayBuffer();
                const { unzipSync, strFromU8 } = await import('fflate');
                const unzipped = unzipSync(new Uint8Array(buffer));
                const replayFilename = Object.keys(unzipped).find((name) => name.endsWith('.swureplay'));
                if (!replayFilename) {
                    setError('No .swureplay file found in zip.');
                    return;
                }
                rawContent = strFromU8(unzipped[replayFilename]);
                replay = parseReplayFile(rawContent);
            } else {
                setError('Please upload a .swureplay or .zip file.');
                return;
            }

            if (replay.snapshots.length === 0) {
                setError('No snapshots found in replay file.');
                return;
            }
            onReplayLoaded(replay, rawContent);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse file.');
        } finally {
            setLoading(false);
        }
    }, [onReplayLoaded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    return (
        <Box
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            sx={{
                width: '100%',
                maxWidth: '500px',
                height: '250px',
                border: '2px dashed',
                borderColor: isDragging ? '#90caf9' : error ? '#f44336' : 'rgba(255,255,255,0.3)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s',
                backgroundColor: isDragging ? 'rgba(144,202,249,0.08)' : 'rgba(255,255,255,0.03)',
                '&:hover': {
                    borderColor: '#90caf9',
                    backgroundColor: 'rgba(144,202,249,0.05)',
                },
            }}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".swureplay,.zip"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            {loading ? (
                <Typography variant="body1" sx={{ color: '#90caf9' }}>
                    Loading replay...
                </Typography>
            ) : (
                <>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                        Drop a .swureplay or .zip file here
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        or click to browse
                    </Typography>
                </>
            )}
            {error && (
                <Typography variant="body2" sx={{ color: '#f44336', mt: 2 }}>
                    {error}
                </Typography>
            )}
        </Box>
    );
};

export default FileUpload;
