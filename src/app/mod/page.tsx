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
import { CosmeticOption } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/app/_contexts/User.context';
import { isMod } from '@/app/_utils/ModerationUtils';

interface ImageDimensions {
    width: number;
    height: number;
}

interface ValidationRules {
    cardback: { width: number; height: number };
    background: { width: number; height: number };
    playmat: { width: number; height: number };
}

const ModPage = () => {
    const { user } = useUser();
    const [cosmetics, setCosmetics] = useState<CosmeticOption[]>([]);
    const [filteredCosmetics, setFilteredCosmetics] = useState<CosmeticOption[]>([]);
    const [availableTypes, setAvailableTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Check if user has mod access
    const hasModAccess = user ? isMod(user) : false;

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
    const [cosmeticType, setCosmeticType] = useState<'cardback' | 'background' | 'playmat'>('cardback');
    const [cosmeticTitle, setCosmeticTitle] = useState('');
    const [cosmeticId, setCosmeticId] = useState(() => uuidv4()); // Initialize with GUID
    const [isDarkened, setIsDarkened] = useState(true); // Default to darkened for backgrounds

    // Validation rules for different cosmetic types
    const validationRules: ValidationRules = {
        cardback: { width: 718, height: 1000 }, // based on default cardback image size
        background: { width: 1920, height: 1080 }, // 16:9 ratio
        playmat: { width: 2680, height: 1200 } // Custom playmat ratio
    };

    useEffect(() => {
        fetchCosmetics();
    }, []);

    // Apply filters whenever filter criteria change
    useEffect(() => {
        let results = cosmetics;

        // Apply type filter if not "All"
        if (typeFilter !== 'All') {
            results = results.filter((cosmetic: CosmeticOption) =>
                cosmetic.type.toLowerCase() === typeFilter.toLowerCase()
            );
        }

        // Apply search query filter if not empty
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            results = results.filter((cosmetic: CosmeticOption) => {
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
            const response = await fetch('/api/admin/cosmetics');

            if (!response.ok) {
                throw new Error(`Error fetching cosmetics: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setCosmetics(data.cosmetics || []);

                // Extract unique types for the filter dropdown
                const types = data.cosmetics?.reduce((acc: string[], cosmetic: CosmeticOption) => {
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

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file');
            return;
        }

        setSelectedFile(file);
        setUploadError(null);

        // Create preview and get dimensions
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgUrl = e.target?.result as string;
            setImagePreview(imgUrl);

            // Get image dimensions
            const img = new window.Image();
            img.onload = () => {
                setImageDimensions({ width: img.width, height: img.height });
            };
            img.src = imgUrl;
        };
        reader.readAsDataURL(file);

        // Auto-generate GUID for cosmetic ID
        setCosmeticId(uuidv4());
    };

    const scaleAndCropImage = (file: File, targetWidth: number, targetHeight: number): Promise<File> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new window.Image();

            img.onload = () => {
                const { width: imgWidth, height: imgHeight } = img;

                // Calculate scale to ensure image covers target dimensions
                const scaleX = targetWidth / imgWidth;
                const scaleY = targetHeight / imgHeight;
                const scale = Math.max(scaleX, scaleY);

                // Calculate scaled dimensions
                const scaledWidth = imgWidth * scale;
                const scaledHeight = imgHeight * scale;

                // Calculate crop offsets to center the image
                const offsetX = (scaledWidth - targetWidth) / 2;
                const offsetY = (scaledHeight - targetHeight) / 2;

                // Set canvas to target dimensions
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                // Draw scaled and cropped image
                ctx?.drawImage(
                    img,
                    -offsetX, -offsetY,
                    scaledWidth, scaledHeight
                );

                // Determine output format - convert PNG/JPEG to WebP, keep WebP as is
                const isWebPInput = file.type === 'image/webp';
                const outputType = isWebPInput ? 'image/webp' : 'image/webp';
                const quality = isWebPInput ? 0.95 : 0.85; // Slightly lower quality for conversions

                // Generate new filename with correct extension
                const originalName = file.name.split('.').slice(0, -1).join('.');
                const newFileName = isWebPInput ? file.name : `${originalName}.webp`;

                // Convert canvas to blob and create new file
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

        // Check if image is larger than target or within tolerance for cropping
        const widthDiff = imageDimensions.width - rules.width;
        const heightDiff = imageDimensions.height - rules.height;

        // Need processing if:
        // 1. Image is larger than target
        // 2. Image is within tolerance range (1-30px off)
        return (widthDiff > 0 || heightDiff > 0) ||
               (Math.abs(widthDiff) <= tolerance && Math.abs(heightDiff) <= tolerance);
    };

    const validateImage = (): string | null => {
        if (!imageDimensions) return 'Image dimensions not available';

        const rules = validationRules[cosmeticType];
        const tolerance = 30;

        // Check if dimensions are exact match
        if (imageDimensions.width === rules.width && imageDimensions.height === rules.height) {
            return null;
        }

        // Check if image can be processed (scaled/cropped)
        const widthDiff = imageDimensions.width - rules.width;
        const heightDiff = imageDimensions.height - rules.height;

        // Allow if image is larger (can be scaled down) or within tolerance (can be cropped)
        if (widthDiff >= 0 && heightDiff >= 0) {
            return null; // Will be processed
        }

        // Allow if within tolerance range
        if (Math.abs(widthDiff) <= tolerance && Math.abs(heightDiff) <= tolerance) {
            return null; // Will be processed
        }

        // Image is too small or too far off
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

            // Convert to WebP if it's PNG/JPEG, or process if it needs scaling/cropping
            const shouldConvertToWebP = selectedFile.type === 'image/png' || selectedFile.type === 'image/jpeg';
            if (needsProcessing() || shouldConvertToWebP) {
                const rules = validationRules[cosmeticType];
                const targetWidth = imageDimensions?.width && !needsProcessing() ? imageDimensions.width : rules.width;
                const targetHeight = imageDimensions?.height && !needsProcessing() ? imageDimensions.height : rules.height;

                fileToUpload = await scaleAndCropImage(selectedFile, targetWidth, targetHeight);

                // Update preview with processed image
                const processedUrl = URL.createObjectURL(fileToUpload);
                setImagePreview(processedUrl);
                setImageDimensions({ width: targetWidth, height: targetHeight });
            }

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('cosmeticId', cosmeticId);
            formData.append('cosmeticTitle', cosmeticTitle);
            formData.append('cosmeticType', cosmeticType);
            formData.append('isDarkened', String(isDarkened));

            // Upload to S3 and save to DynamoDB
            const response = await fetch('/api/admin/cosmetics/upload-file', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload cosmetic');
            }

            setUploadSuccess(true);

            // Refresh cosmetics list
            await fetchCosmetics();

            // Reset form after successful upload
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
        setCosmeticType('cardback');
        setCosmeticTitle('');
        setCosmeticId(uuidv4()); // Generate new GUID when resetting form
        setIsDarkened(true); // Reset to default darkened state
        setUploadError(null);
        setUploadSuccess(false);
    };

    const handleCleanupAction = async (action: 'all' | 'reset') => {
        setCleanupLoading(true);
        setCleanupError(null);
        setCleanupSuccess(false);

        try {
            const response = await fetch(`/api/admin/cosmetics/cleanup?action=${action}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Cleanup operation failed');
            }

            const data = await response.json();
            setCleanupSuccess(true);

            // Refresh cosmetics list
            await fetchCosmetics();

            // Close dialog after success
            setTimeout(() => {
                setCleanupDialogOpen(false);
                setCleanupSuccess(false);
            }, 2000);
        } catch (error) {
            console.error('Cleanup error:', error);
            setCleanupError(error instanceof Error ? error.message : 'Cleanup failed');
        } finally {
            setCleanupLoading(false);
        }
    };

    const handleDeleteSingleCosmetic = async (cosmeticId: string) => {
        if (!confirm(`Are you sure you want to delete the cosmetic "${cosmeticId}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/cosmetics/cleanup?action=single&id=${cosmeticId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Delete operation failed');
            }

            // Refresh cosmetics list
            await fetchCosmetics();
        } catch (error) {
            console.error('Delete error:', error);
            alert(`Failed to delete cosmetic: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
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

    // Access control - redirect if not logged in or not authorized
    if (!user) {
        return (
            <Box sx={{ ...styles.pageContainer, justifyContent: 'center', alignItems: 'center' }}>
                <Alert severity="warning" sx={{ mb: 2 }}>You must be logged in to access mod tools.</Alert>
                <PreferenceButton variant="standard" text="Back to Home" buttonFnc={() => router.push('/')} />
            </Box>
        );
    }

    if (!hasModAccess) {
        return (
            <Box sx={{ ...styles.pageContainer, justifyContent: 'center', alignItems: 'center' }}>
                <Alert severity="error" sx={{ mb: 2 }}>Access denied. You do not have permission to access mod tools.</Alert>
                <PreferenceButton variant="standard" text="Back to Home" buttonFnc={() => router.push('/')} />
            </Box>
        );
    }

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
                                        {process.env.NODE_ENV === 'development' && (
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
                                            {filteredCosmetics.map((cosmetic: CosmeticOption) => (
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
                                                        {process.env.NODE_ENV === 'development' && (
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
                            onChange={(e) => setCosmeticType(e.target.value as 'cardback' | 'background' | 'playmat')}
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

                    {/* Show darkened toggle only for background type */}
                    {cosmeticType === 'background' && (
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
                                        display: 'block'
                                    }}
                                />
                                {/* Apply darkening overlay if it's a background type and darkened is enabled */}
                                {cosmeticType === 'background' && isDarkened && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: 'rgba(10, 10, 10, 0.57)',
                                        borderRadius: '8px',
                                        pointerEvents: 'none'
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
                            onClick={() => handleCleanupAction('all')}
                            disabled={cleanupLoading}
                            fullWidth
                        >
                            Clear All Cosmetics
                        </Button>

                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => handleCleanupAction('reset')}
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
        </Box>
    );
};

export default ModPage;