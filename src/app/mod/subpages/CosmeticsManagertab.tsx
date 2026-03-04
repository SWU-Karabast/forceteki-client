'use client';
import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    Typography,
    MenuItem,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    Switch,
    FormControlLabel
} from '@mui/material';
import Image from 'next/image';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { IRegisteredCosmeticOption, RegisteredCosmeticType } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { v4 as uuidv4 } from 'uuid';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { useCosmetics } from '@/app/_contexts/CosmeticsContext';

interface ImageDimensions {
    width: number;
    height: number;
}

interface ValidationRules {
    cardback: { width: number; height: number };
    background: { width: number; height: number };
}

const isDev = process.env.NODE_ENV === 'development';

const CosmeticsManagerTab: React.FC = () => {
    const { cosmetics, setCosmetics, fetchCosmetics } = useCosmetics();
    const [filteredCosmetics, setFilteredCosmetics] = useState<IRegisteredCosmeticOption[]>([]);
    const [availableTypes, setAvailableTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [typeFilter, setTypeFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Upload dialog states
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Cleanup dialog states
    const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
    const [cleanupLoading, setCleanupLoading] = useState(false);
    const [cleanupError, setCleanupError] = useState<string | null>(null);
    const [cleanupSuccess, setCleanupSuccess] = useState(false);

    // Upload form states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
    const [cosmeticType, setCosmeticType] = useState<RegisteredCosmeticType>(RegisteredCosmeticType.Cardback);
    const [cosmeticTitle, setCosmeticTitle] = useState('');
    const [cosmeticId, setCosmeticId] = useState(() => uuidv4());
    const [isDarkened, setIsDarkened] = useState(true);

    const validationRules: ValidationRules = {
        cardback: { width: 718, height: 1000 },
        background: { width: 1920, height: 1080 },
    };

    const allCosmetics = React.useMemo(() => [
        ...cosmetics.cardbacks,
        ...cosmetics.backgrounds,
    ], [cosmetics]);

    useEffect(() => {
        getCosmetics();
    }, []);

    useEffect(() => {
        let results = allCosmetics;

        if (typeFilter !== 'All') {
            results = results.filter((cosmetic: IRegisteredCosmeticOption) =>
                cosmetic.type.toLowerCase() === typeFilter.toLowerCase()
            );
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            results = results.filter((cosmetic: IRegisteredCosmeticOption) => {
                const title = cosmetic.title?.toLowerCase() || '';
                const id = cosmetic.id?.toLowerCase() || '';
                return title.includes(query) || id.includes(query);
            });
        }

        setFilteredCosmetics(results);
    }, [allCosmetics, typeFilter, searchQuery]);

    useEffect(() => {
        if (allCosmetics.length > 0) {
            const types = allCosmetics.reduce((acc: string[], cosmetic: IRegisteredCosmeticOption) => {
                const type = cosmetic.type.charAt(0).toUpperCase() + cosmetic.type.slice(1);
                if (!acc.includes(type)) {
                    acc.push(type);
                }
                return acc;
            }, []) || [];

            setAvailableTypes(types);
        }
    }, [allCosmetics]);

    const getCosmetics = async () => {
        try {
            setLoading(true);
            fetchCosmetics();
        } catch (error) {
            console.error('Error fetching cosmetics:', error);
            setError(error instanceof Error ? error.message : 'Failed to load cosmetics');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file');
            return;
        }

        setSelectedFile(file);
        setUploadError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            const imgUrl = e.target?.result as string;
            setImagePreview(imgUrl);

            const img = new window.Image();
            img.onload = () => {
                setImageDimensions({ width: img.width, height: img.height });
            };
            img.src = imgUrl;
        };
        reader.readAsDataURL(file);

        setCosmeticId(uuidv4());
    };

    const scaleAndCropImage = (file: File, targetWidth: number, targetHeight: number): Promise<File> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new window.Image();

            img.onload = () => {
                const { width: imgWidth, height: imgHeight } = img;

                const scaleX = targetWidth / imgWidth;
                const scaleY = targetHeight / imgHeight;
                const scale = Math.max(scaleX, scaleY);

                const scaledWidth = imgWidth * scale;
                const scaledHeight = imgHeight * scale;
                const offsetX = (scaledWidth - targetWidth) / 2;
                const offsetY = (scaledHeight - targetHeight) / 2;

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                ctx?.drawImage(img, -offsetX, -offsetY, scaledWidth, scaledHeight);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                }, 'image/webp', 0.85);
            };

            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const handleUpload = async () => {
        if (!selectedFile || !cosmeticTitle.trim()) return;

        setUploadLoading(true);
        setUploadError(null);

        try {
            const rules = validationRules[cosmeticType as keyof ValidationRules];
            const processedFile = await scaleAndCropImage(selectedFile, rules.width, rules.height);

            const formData = new FormData();
            formData.append('file', processedFile);
            formData.append('cosmeticId', cosmeticId);
            formData.append('cosmeticType', cosmeticType);

            const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/s3bucket`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image');
            }

            const { url } = await uploadResponse.json();

            const newCosmetic: IRegisteredCosmeticOption = {
                id: cosmeticId,
                title: cosmeticTitle.trim(),
                type: cosmeticType,
                path: url,
                ...(cosmeticType === RegisteredCosmeticType.Background ? { darkened: isDarkened } : {}),
            };

            await ServerApiService.saveCosmeticAsync(newCosmetic);
            setUploadSuccess(true);
            fetchCosmetics();

            setTimeout(() => {
                resetUploadForm();
                setUploadDialogOpen(false);
            }, 1000);
        } catch (error) {
            console.error('Error uploading cosmetic:', error);
            setUploadError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDeleteSingleCosmetic = async (id: string) => {
        try {
            await ServerApiService.deleteCosmeticAsync(id);
            fetchCosmetics();
        } catch (error) {
            console.error('Error deleting cosmetic:', error);
        }
    };

    const handleDevCleanupAction = async (action: 'all' | 'reset') => {
        setCleanupLoading(true);
        setCleanupError(null);
        try {
            if (action === 'all') {
                await ServerApiService.clearAllCosmeticsAsync();
            } else {
                await ServerApiService.resetCosmeticsToDefaultAsync();
            }
            setCleanupSuccess(true);
            fetchCosmetics();
        } catch (error) {
            console.error('Cleanup error:', error);
            setCleanupError(error instanceof Error ? error.message : 'Cleanup failed');
        } finally {
            setCleanupLoading(false);
        }
    };

    const resetUploadForm = () => {
        setSelectedFile(null);
        setImagePreview(null);
        setImageDimensions(null);
        setCosmeticTitle('');
        setCosmeticId(uuidv4());
        setUploadError(null);
        setUploadSuccess(false);
        setIsDarkened(true);
    };

    // ======================== STYLES ========================
    const styles = {
        cosmeticsHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
        },
        filterRow: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
        },
        filterBox: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ml: '4rem',
        },
        cardOuter: {
            width: '100%',
            height: '400px',
            overflowY: 'auto',
        },
        cardStyle: {
            borderRadius: '1.1em',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            backgroundColor: 'transparent',
        },
        mainContainerStyle: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '1em',
            padding: '1em',
        },
        cosmeticContainer: {
            backgroundColor: '#2D3748',
            borderRadius: '0.5rem',
            width: '12rem',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            padding: '1rem',
            border: '1px solid #4A5568',
        },
        cosmeticPreview: {
            borderRadius: '0.5rem',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundColor: '#1A202C',
            width: '100%',
            height: '8rem',
            marginBottom: '0.5rem',
        },
        cosmeticInfo: {
            width: '100%',
            textAlign: 'center' as const,
        },
        resultsCount: {
            color: 'white',
            textAlign: 'center' as const,
            margin: '0.5rem 0',
        },
        dialogContent: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1rem',
            minWidth: '500px',
            minHeight: '600px',
            backgroundColor: '#2D2D2D',
            padding: '4rem',
        },
    };

    // ======================== RENDER ========================
    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>Loading cosmetics...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={() => fetchCosmetics()}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header Controls */}
            <Box sx={styles.cosmeticsHeader}>
                <Box sx={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                    {isDev && (
                        <PreferenceButton
                            variant={'standard'}
                            text="Dev Cleanup"
                            buttonFnc={() => setCleanupDialogOpen(true)}
                        />
                    )}
                    <PreferenceButton
                        variant={'standard'}
                        text="Upload New"
                        buttonFnc={() => setUploadDialogOpen(true)}
                    />
                </Box>
            </Box>

            {/* Filters */}
            <Box sx={styles.filterRow}>
                <Box sx={styles.filterBox}>
                    <Typography variant={'h3'}>Type filter</Typography>
                    <StyledTextField
                        select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        sx={{ width: 150, ml: '10px' }}
                    >
                        <MenuItem value="All">All</MenuItem>
                        {availableTypes.map((type) => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                    </StyledTextField>
                </Box>
                <Box sx={styles.filterBox}>
                    <Typography variant={'h3'}>Find cosmetic</Typography>
                    <StyledTextField
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or ID..."
                        sx={{ width: '300px', ml: '10px' }}
                    />
                </Box>
            </Box>

            <Divider sx={{ width: '100%', margin: '1rem 0' }} />

            {/* Results count */}
            <Typography variant="body1" sx={styles.resultsCount}>
                Showing {filteredCosmetics.length} of {allCosmetics.length} cosmetics
            </Typography>

            {/* Cosmetics grid */}
            <Box sx={styles.cardOuter}>
                <Card sx={styles.cardStyle}>
                    <Box sx={styles.mainContainerStyle}>
                        {filteredCosmetics.map((cosmetic: IRegisteredCosmeticOption) => (
                            <Box sx={styles.cosmeticContainer} key={cosmetic.id}>
                                <Box
                                    sx={{
                                        ...styles.cosmeticPreview,
                                        backgroundImage: `url(${cosmetic.path})`
                                    }}
                                />
                                <Box sx={styles.cosmeticInfo}>
                                    <Typography variant="body2" color="white" noWrap>
                                        {cosmetic.title}
                                    </Typography>
                                    <Typography variant="caption" color="gray">
                                        {cosmetic.type} • {cosmetic.id}
                                    </Typography>
                                    {cosmetic.title?.toLowerCase() !== 'default' && (
                                        <Button
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            onClick={() => handleDeleteSingleCosmetic(cosmetic.id)}
                                            sx={{ mt: 1, fontSize: '0.7rem' }}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        ))}
                        {filteredCosmetics.length === 0 && (
                            <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="gray">
                                    No cosmetics found
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Card>
            </Box>

            {/* Upload Dialog */}
            <Dialog
                open={uploadDialogOpen}
                onClose={() => !uploadLoading && setUploadDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { backgroundColor: '#2D2D2D', minHeight: '600px' }
                }}
            >
                <DialogTitle>Upload New Cosmetic</DialogTitle>
                <DialogContent sx={styles.dialogContent}>
                    {uploadError && (
                        <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>
                    )}
                    {uploadSuccess && (
                        <Alert severity="success" sx={{ mb: 2 }}>Cosmetic uploaded successfully!</Alert>
                    )}

                    <StyledTextField
                        label="Cosmetic Title"
                        value={cosmeticTitle}
                        onChange={(e) => setCosmeticTitle(e.target.value)}
                        disabled={uploadLoading}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Cosmetic Type</InputLabel>
                        <Select
                            value={cosmeticType}
                            onChange={(e) => setCosmeticType(e.target.value as RegisteredCosmeticType)}
                            label="Cosmetic Type"
                            disabled={uploadLoading}
                        >
                            <MenuItem value={RegisteredCosmeticType.Cardback}>Cardback</MenuItem>
                            <MenuItem value={RegisteredCosmeticType.Background}>Background</MenuItem>
                        </Select>
                    </FormControl>

                    {(cosmeticType === RegisteredCosmeticType.Background) && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isDarkened}
                                    onChange={(e) => setIsDarkened(e.target.checked)}
                                    disabled={uploadLoading}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: '#2F7DB6',
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: '#2F7DB6',
                                        },
                                    }}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2" color="white">
                                        Apply darkening effect
                                    </Typography>
                                    <Typography variant="caption" color="white">
                                        Darkens the background for better text readability in-game
                                    </Typography>
                                </Box>
                            }
                            sx={{ alignItems: 'flex-start', mb: 2 }}
                        />
                    )}

                    <Box>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            disabled={uploadLoading}
                            style={{ marginBottom: '1rem', color: 'white' }}
                        />
                        <Typography variant="caption" color="white" sx={{ display: 'block', mb: 1 }}>
                            PNG and JPEG files will be automatically converted to WebP format for better compression.
                        </Typography>
                        {imageDimensions && (
                            <Typography variant="body2" color='white'>
                                Image dimensions: {imageDimensions.width}x{imageDimensions.height}px
                            </Typography>
                        )}
                    </Box>

                    {imagePreview && (
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Box sx={{
                                position: 'relative',
                                display: 'inline-block',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}>
                                <Image
                                    src={imagePreview}
                                    alt="Preview"
                                    width={300}
                                    height={300}
                                    style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        display: 'block',
                                        opacity: 1,
                                        position: 'relative',
                                        zIndex: 1
                                    }}
                                />
                                {(cosmeticType === 'background') && isDarkened && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: 'rgba(10, 10, 10, 0.57)',
                                        borderRadius: '8px',
                                        pointerEvents: 'none',
                                        zIndex: 2
                                    }} />
                                )}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            resetUploadForm();
                            setUploadDialogOpen(false);
                        }}
                        disabled={uploadLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || !cosmeticTitle.trim() || uploadLoading || uploadSuccess}
                        variant="contained"
                    >
                        {uploadLoading ? <CircularProgress size={20} /> : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cleanup Dialog */}
            {isDev && (
                <Dialog
                    open={cleanupDialogOpen}
                    onClose={() => !cleanupLoading && setCleanupDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: { backgroundColor: '#2D2D2D', minHeight: '400px' }
                    }}
                >
                    <DialogTitle>Development Cleanup Tools</DialogTitle>
                    <DialogContent sx={{ padding: '2rem' }}>
                        {cleanupError && (
                            <Alert severity="error" sx={{ mb: 2 }}>{cleanupError}</Alert>
                        )}
                        {cleanupSuccess && (
                            <Alert severity="success" sx={{ mb: 2 }}>Cleanup completed successfully!</Alert>
                        )}

                        <Typography variant="body1" sx={{ mb: 2 }}>
                            These cleanup operations are only available in development mode:
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button
                                variant="outlined"
                                color="warning"
                                onClick={() => handleDevCleanupAction('all')}
                                disabled={cleanupLoading}
                                fullWidth
                            >
                                Clear All Cosmetics
                            </Button>

                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => handleDevCleanupAction('reset')}
                                disabled={cleanupLoading}
                                fullWidth
                            >
                                Reset to Default Cosmetics
                            </Button>
                        </Box>

                        <Typography variant="caption" color="white" sx={{ mt: 2, display: 'block' }}>
                            Warning: These operations are irreversible. Individual cosmetics can be deleted using the &quot;Delete&quot; button on each item.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setCleanupDialogOpen(false);
                                setCleanupError(null);
                                setCleanupSuccess(false);
                            }}
                            disabled={cleanupLoading}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
};

export default CosmeticsManagerTab;