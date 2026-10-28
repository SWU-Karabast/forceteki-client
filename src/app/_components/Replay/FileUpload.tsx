'use client';
import React, { useState, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { parse, SwuPgnDocument, type ParseNotes } from '@/lib/swupgn';
import { noEventsMessage, replayTooHeavy } from '@/app/_utils/replayHandoff';
import { replayErrorMessage } from '@/app/_utils/swupgnFileIssues';

interface FileUploadProps {
    onReplayLoaded: (doc: SwuPgnDocument, content: string) => void;
}

// A real replay is a few hundred KB, zipped or not.
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (upload cap)
// Ceiling on the DECOMPRESSED .swupgn, enforced while it inflates (extractReplayFromZip), so a
// zip bomb stops here instead of expanding to gigabytes. Near the plain upload cap: a zip should
// not admit a file several times larger than the viewer accepts unzipped.
const MAX_DECOMPRESSED_SIZE = 16 * 1024 * 1024; // 16 MB

const FileUpload: React.FC<FileUploadProps> = ({ onReplayLoaded }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback(async (file: File) => {
        setError(null);

        if (file.size > MAX_FILE_SIZE) {
            setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
            return;
        }

        setLoading(true);
        const name = file.name.toLowerCase();

        try {
            let rawContent: string;
            let doc: SwuPgnDocument & ParseNotes;

            if (name.endsWith('.swupgn')) {
                rawContent = await file.text();
                doc = parse(rawContent);
            } else if (name.endsWith('.zip')) {
                const buffer = await file.arrayBuffer();
                const [{ strFromU8 }, { extractReplayFromZip, ReplayTooLargeError }] = await Promise.all([
                    import('fflate'), import('@/app/_utils/unzipReplay'),
                ]);
                let decompressed: Uint8Array | null;
                try {
                    decompressed = await extractReplayFromZip(new Uint8Array(buffer), MAX_DECOMPRESSED_SIZE);
                } catch (zipErr) {
                    if (zipErr instanceof ReplayTooLargeError) {
                        setError(zipErr.message);
                        return;
                    }
                    throw zipErr;
                }
                if (!decompressed) {
                    setError('No .swupgn file found in zip.');
                    return;
                }
                rawContent = strFromU8(decompressed);
                doc = parse(rawContent);
            } else {
                setError('Please upload a .swupgn or .zip file.');
                return;
            }

            if (doc.events.length === 0) {
                setError(noEventsMessage(doc));
                return;
            }
            const heavy = replayTooHeavy(doc);
            if (heavy) {
                setError(heavy);
                return;
            }
            onReplayLoaded(doc, rawContent);
        } catch (err) {
            // By the §24 code, never the message: a parse message is free text and may quote the file.
            setError(replayErrorMessage(err, 'Failed to parse file.'));
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
        // Cleared so choosing the same file again (after an error, or a fix) fires onChange.
        e.target.value = '';
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
                    accept=".swupgn,.zip"
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
                            Drop a .swupgn or .zip file here
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                            or click to browse
                        </Typography>
                    </>
                )}
                {error && (
                    <Typography variant="body2" role="alert" sx={{ color: 'error.main', mt: 1 }}>
                        {error}
                    </Typography>
                )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    Max upload: {MAX_FILE_SIZE / 1024 / 1024} MB
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
