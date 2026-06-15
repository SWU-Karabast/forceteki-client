'use client';
import React, { useState, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { parseReplayFile } from '@/app/_utils/replayParser';
import { ParsedReplay } from '@/app/_contexts/Replay.context';

interface FileUploadProps {
    onReplayLoaded: (replay: ParsedReplay, rawContent: string) => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB (compressed upload cap)
// Ceiling on the DECOMPRESSED .swureplay so a zip bomb can't expand to
// gigabytes and OOM/freeze the tab after passing the compressed-size check.
const MAX_DECOMPRESSED_SIZE = 250 * 1024 * 1024; // 250 MB

const FileUpload: React.FC<FileUploadProps> = ({ onReplayLoaded }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback(async (file: File) => {
        setError(null);

        if (file.size > MAX_FILE_SIZE) {
            setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 100 MB.`);
            return;
        }

        setLoading(true);

        try {
            let rawContent: string;
            let replay: ParsedReplay;

            if (file.name.endsWith('.swureplay')) {
                rawContent = await file.text();
                replay = parseReplayFile(rawContent);
            } else if (file.name.endsWith('.zip')) {
                const buffer = await file.arrayBuffer();
                const { unzip, strFromU8 } = await import('fflate');
                // Async unzip runs decompression off the main thread (in a worker
                // when available) so a large archive doesn't freeze the UI.
                const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
                    unzip(new Uint8Array(buffer), (err, data) => (err ? reject(err) : resolve(data)));
                });
                const replayFilename = Object.keys(unzipped).find((name) => name.endsWith('.swureplay'));
                if (!replayFilename) {
                    setError('No .swureplay file found in zip.');
                    return;
                }
                const decompressed = unzipped[replayFilename];
                if (decompressed.length > MAX_DECOMPRESSED_SIZE) {
                    setError(`Replay too large once unzipped (${(decompressed.length / 1024 / 1024).toFixed(0)} MB). Max is ${MAX_DECOMPRESSED_SIZE / 1024 / 1024} MB.`);
                    return;
                }
                rawContent = strFromU8(decompressed);
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
        <Box sx={{ width: '100%' }}>
            <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleClick}
                sx={{
                    width: '100%',
                    height: '200px',
                    border: '2px solid',
                    borderColor: isDragging ? 'var(--initiative-blue)' : error ? '#f44336' : 'rgba(114,134,160,0.4)',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background-color 0.2s',
                    backgroundColor: isDragging ? 'rgba(0,186,255,0.08)' : 'rgba(0,0,0,0.2)',
                    '&:hover': {
                        borderColor: 'var(--initiative-blue)',
                        backgroundColor: 'rgba(0,186,255,0.05)',
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
                    <Typography variant="body1" sx={{ color: 'var(--initiative-blue)', mb: 0 }}>
                        Loading replay...
                    </Typography>
                ) : (
                    <>
                        <Typography variant="h3" sx={{ color: 'rgba(255,255,255,0.8)', mb: 0, fontWeight: 700 }}>
                            Drop a .swureplay or .zip file here
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                            or click to browse
                        </Typography>
                    </>
                )}
                {error && (
                    <Typography variant="body2" sx={{ color: '#f44336', mt: 1 }}>
                        {error}
                    </Typography>
                )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    Max upload: 100 MB
                </Typography>
                <PreferenceButton
                    variant="warning"
                    text="Browse Files"
                    buttonFnc={handleClick}
                    sx={{ px: 3 }}
                />
            </Box>
        </Box>
    );
};

export default FileUpload;
