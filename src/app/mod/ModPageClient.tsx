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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Switch,
    FormControlLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Image from 'next/image';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useRouter } from 'next/navigation';
import { IRegisteredCosmeticOption, RegisteredCosmeticType } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { v4 as uuidv4 } from 'uuid';
import { ServerApiService } from '../_services/ServerApiService';

interface ImageDimensions {
    width: number;
    height: number;
}

interface ValidationRules {
    cardback: { width: number; height: number };
    background: { width: number; height: number };
    playmat: { width: number; height: number };
}

const isDev = process.env.NODE_ENV === 'development';

const ModPageClient = () => {
    const [cosmetics, setCosmetics] = useState<IRegisteredCosmeticOption[]>([]);
    const [filteredCosmetics, setFilteredCosmetics] = useState<IRegisteredCosmeticOption[]>([]);
    const [availableTypes, setAvailableTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
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

    // Validation rules for different cosmetic types
    const validationRules: ValidationRules = {
        cardback: { width: 718, height: 1000 },
        background: { width: 1920, height: 1080 },
        playmat: { width: 2680, height: 1200 }
    };

    useEffect(() => {
        fetchCosmetics();
    }, []);

    // Apply filters whenever filter criteria change
    useEffect(() => {
        let results = cosmetics;

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
    }, [cosmetics, typeFilter, searchQuery]);

    const fetchCosmetics = async () => {
        try {
            setLoading(true);
            const response = await ServerApiService.getCosmeticsAsync();

            if (response.length > 0) {
                setCosmetics(response);

                const types = response.reduce((acc: string[], cosmetic: IRegisteredCosmeticOption) => {
                    const type = cosmetic.type.charAt(0).toUpperCase() + cosmetic.type.slice(1);
                    if (!acc.includes(type)) {
                        acc.push(type);
                    }
                    return acc;
                }, []) || [];

                setAvailableTypes(types);
            }
        } catch (error) {
            console.error('Error fetching cosmetics:', error);
            setError(error instanceof Error ? error.message : 'Failed to load cosmetics');
        } finally {
            setLoading(false);
        }
    };

    const handleBackClick = () => {
        router.push('/');
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

                ctx?.drawImage(
                    img,
                    -offsetX, -offsetY,
                    scaledWidth, scaledHeight
                );

                const isWebPInput = file.type === 'image/webp';
                const outputType = isWebPInput ? 'image/webp' : 'image/webp';
                const quality = isWebPInput ? 0.95 : 0.85;

                const originalName = file.name.split('.').slice(0, -1).join('.');
                const newFileName = isWebPInput ? file.name : `${originalName}.webp`;

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], newFileName, {
                            type: outputType,
                            lastModified: Date.now()
                        });
                        resolve(newFile);
                    } else {
                        reject(new Error('Failed to convert canvas to blob'));
                    }
                }, outputType, quality);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    };

    const needsProcessing = (): boolean => {
        if (!imageDimensions) return false;

        const rules = validationRules[cosmeticType];
        const tolerance = 30;

        const widthDiff = imageDimensions.width - rules.width;
        const heightDiff = imageDimensions.height - rules.height;

        return (widthDiff > 0 || heightDiff > 0) ||
               (Math.abs(widthDiff) <= tolerance && Math.abs(heightDiff) <= tolerance);
    };

    const validateImage = (): string | null => {
        if (!imageDimensions) return 'Image dimensions not available';

        const rules = validationRules[cosmeticType];
        const tolerance = 30;

        if (imageDimensions.width === rules.width && imageDimensions.height === rules.height) {
            return null;
        }

        const widthDiff = imageDimensions.width - rules.width;
        const heightDiff = imageDimensions.height - rules.height;

        if (widthDiff >= 0 && heightDiff >= 0) {
            return null;
        }

        if (Math.abs(widthDiff) <= tolerance && Math.abs(heightDiff) <= tolerance) {
            return null;
        }

        return `${cosmeticType} images must be ${rules.width}x${rules.height}px (±${tolerance}px tolerance). Your image is ${imageDimensions.width}x${imageDimensions.height}px.`;
    };

    const handleUpload = async () => {
        if (!selectedFile || !cosmeticTitle.trim() || !cosmeticId.trim()) {
            setUploadError('Please fill in all fields and select an image');
            return;
        }

        const validationError = validateImage();
        if (validationError) {
            setUploadError(validationError);
            return;
        }

        setUploadLoading(true);
        setUploadError(null);

        try {
            let fileToUpload = selectedFile;

            const shouldConvertToWebP = selectedFile.type === 'image/png' || selectedFile.type === 'image/jpeg';
            if (needsProcessing() || shouldConvertToWebP) {
                const rules = validationRules[cosmeticType];
                const targetWidth = imageDimensions?.width && !needsProcessing() ? imageDimensions.width : rules.width;
                const targetHeight = imageDimensions?.height && !needsProcessing() ? imageDimensions.height : rules.height;

                fileToUpload = await scaleAndCropImage(selectedFile, targetWidth, targetHeight);

                const processedUrl = URL.createObjectURL(fileToUpload);
                setImagePreview(processedUrl);
                setImageDimensions({ width: targetWidth, height: targetHeight });
            }

            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('cosmeticId', cosmeticId);
            formData.append('cosmeticTitle', cosmeticTitle);
            formData.append('cosmeticType', cosmeticType);
            formData.append('isDarkened', String(isDarkened));

            const response = await fetch('/api/admin/cosmetics/upload-file', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload cosmetic');
            }

            setUploadSuccess(true);

            await fetchCosmetics();

            setTimeout(() => {
                resetUploadForm();
                setUploadDialogOpen(false);
            }, 2000);
        } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setUploadLoading(false);
        }
    };

    const resetUploadForm = () => {
        setSelectedFile(null);
        setImagePreview(null);
        setImageDimensions(null);
        setCosmeticType(RegisteredCosmeticType.Cardback);
        setCosmeticTitle('');
        setCosmeticId(uuidv4());
        setIsDarkened(true);
        setUploadError(null);
        setUploadSuccess(false);
    };

    const handleDevCleanupAction = async (action: 'all' | 'reset') => {
        if(!isDev) {
            return;
        }
        setCleanupLoading(true);
        setCleanupError(null);
        setCleanupSuccess(false);

        let response;
        switch(action) {
            case 'all':
                response = await ServerApiService.clearAllCosmeticsAsync();
                break;
            case 'reset':
                response = await ServerApiService.resetCosmeticsToDefaultAsync();
                break;
        }

        if (!response) {
            throw new Error('Cleanup operation failed');
        }

        setCleanupSuccess(true);
        await fetchCosmetics();

        setTimeout(() => {
            setCleanupDialogOpen(false);
            setCleanupSuccess(false);
        }, 2000);
        setCleanupLoading(false);
    };

    const handleDeleteSingleCosmetic = async (cosmeticId: string) => {
        if (!confirm(`Are you sure you want to delete the cosmetic "${cosmeticId}"? This action cannot be undone.`)) {
            return;
        }
        const response = await ServerApiService.deleteCosmeticAsync(cosmeticId);
        if (!response.success) {
            alert('Failed to delete cosmetic');
            console.error('Delete error:', response.message);
        }

        await fetchCosmetics();
    };

    const styles = {
        pageContainer: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            overflowY: 'hidden',
        },
        headerRow: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            position: 'relative' as const,
            zIndex: 1000,
        },
        backButton: {
            position: 'absolute' as const,
            left: '10px',
            height: '100%',
            zIndex: 1001,
        },
        accordionContainer: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1rem',
            flex: 1,
            overflowY: 'auto',
        },
        accordion: {
            backgroundColor: '#2D3748',
            borderRadius: '0.5rem',
            border: '1px solid #4A5568',
            '&:before': {
                display: 'none',
            },
        },
        accordionSummary: {
            backgroundColor: '#2D3748',
            borderRadius: '0.5rem 0.5rem 0 0',
            minHeight: '48px',
            '&.Mui-expanded': {
                minHeight: '48px',
            },
        },
        accordionDetails: {
            backgroundColor: '#1A202C',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1rem',
        },
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

    return (
        <Box sx={styles.pageContainer}>
            {/* Header with Back button */}
            <Box sx={styles.headerRow}>
                <Box sx={styles.backButton}>
                    <PreferenceButton
                        variant={'standard'}
                        text="Back"
                        buttonFnc={handleBackClick}
                    />
                </Box>
                <Typography variant={'h5'} color="white">
                    Mod Tools
                </Typography>
            </Box>

            {/* Collapsible Sections */}
            <Box sx={styles.accordionContainer}>
                {/* Cosmetics Manager Section */}
                <Accordion sx={styles.accordion}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                        sx={styles.accordionSummary}
                    >
                        <Typography variant="h6" color="white">
                            Cosmetics Manager
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={styles.accordionDetails}>
                        {loading ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                <CircularProgress />
                                <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>Loading cosmetics...</Typography>
                            </Box>
                        ) : error ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                                <Button variant="outlined" onClick={() => fetchCosmetics()}>
                                    Retry
                                </Button>
                            </Box>
                        ) : (
                            <>
                                {/* Cosmetics Manager Header Controls */}
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
                                    Showing {filteredCosmetics.length} of {cosmetics.length} cosmetics
                                </Typography>

                                {/* Main cosmetics area */}
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
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                            onClick={() => handleDeleteSingleCosmetic(cosmetic.id)}
                                                            sx={{ mt: 1, fontSize: '0.7rem' }}
                                                        >
                                                            Delete
                                                        </Button>
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
                            </>
                        )}
                    </AccordionDetails>
                </Accordion>

                <Accordion sx={styles.accordion} disabled>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'gray' }} />}
                        sx={styles.accordionSummary}
                    >
                        <Typography variant="h6" color="gray">
                            User Management (Coming Soon)
                        </Typography>
                    </AccordionSummary>
                </Accordion>

                <Accordion sx={styles.accordion} disabled>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'gray' }} />}
                        sx={styles.accordionSummary}
                    >
                        <Typography variant="h6" color="gray">
                            Mock Card Manager (Coming Soon)
                        </Typography>
                    </AccordionSummary>
                </Accordion>

            </Box>

            {/* Upload Dialog */}
            <Dialog
                open={uploadDialogOpen}
                onClose={() => !uploadLoading && setUploadDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { backgroundColor: '#2D2D2D' }
                }}
            >
                <DialogTitle>Upload New Cosmetic</DialogTitle>
                <DialogContent sx={styles.dialogContent}>
                    {uploadError && (
                        <Alert severity="error">{uploadError}</Alert>
                    )}
                    {uploadSuccess && (
                        <Alert severity="success">Cosmetic uploaded successfully!</Alert>
                    )}

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                            Cosmetic Type
                        </InputLabel>
                        <Select
                            value={cosmeticType}
                            onChange={(e) => setCosmeticType(e.target.value as RegisteredCosmeticType)}
                            disabled={uploadLoading}
                            label="Cosmetic Type"
                        >
                            <MenuItem value="cardback">Cardback (718x1000)</MenuItem>
                            <MenuItem value="background">Background (1920x1080px)</MenuItem>
                            <MenuItem value="playmat">Playmat (2680x1200px)</MenuItem>
                        </Select>
                    </FormControl>

                    <StyledTextField
                        label="Title"
                        value={cosmeticTitle}
                        onChange={(e) => setCosmeticTitle(e.target.value)}
                        disabled={uploadLoading}
                        fullWidth
                    />

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <StyledTextField
                            label="ID (auto-generated GUID)"
                            value={cosmeticId}
                            onChange={(e) => setCosmeticId(e.target.value)}
                            disabled={uploadLoading}
                            fullWidth
                            helperText="Auto-generated unique identifier"
                        />
                        <Button
                            variant="outlined"
                            onClick={() => setCosmeticId(uuidv4())}
                            disabled={uploadLoading}
                            sx={{ mt: 1, minWidth: 'auto', px: 2 }}
                        >
                            New ID
                        </Button>
                    </Box>

                    {/* Show darkened toggle for background and playmat types */}
                    {(cosmeticType === 'background' || cosmeticType === 'playmat') && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isDarkened}
                                    onChange={(e) => setIsDarkened(e.target.checked)}
                                    disabled={uploadLoading}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: '#1976d2',
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: '#1976d2',
                                        },
                                    }}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2" color="white">
                                        Apply darkening effect
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {cosmeticType === 'background'
                                            ? 'Darkens the background for better text readability in-game'
                                            : 'Darkens the playmat to reduce visual distraction during gameplay'
                                        }
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
                            style={{ marginBottom: '1rem' }}
                        />
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                            PNG and JPEG files will be automatically converted to WebP format for better compression.
                        </Typography>
                        {imageDimensions && (
                            <Typography variant="body2" color="textSecondary">
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
                                {cosmeticType === 'playmat' && (
                                    <Image
                                        src="/default-background.webp"
                                        alt="Background"
                                        width={300}
                                        height={300}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            zIndex: 0
                                        }}
                                    />
                                )}
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
                                        opacity: cosmeticType === 'playmat' ? 0.54 : 1,
                                        position: 'relative',
                                        zIndex: 1
                                    }}
                                />
                                {(cosmeticType === 'background' || cosmeticType === 'playmat') && isDarkened && (
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
            {
                isDev && <Dialog
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

                        <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
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
            }
        </Box>
    );
};

export default ModPageClient;
