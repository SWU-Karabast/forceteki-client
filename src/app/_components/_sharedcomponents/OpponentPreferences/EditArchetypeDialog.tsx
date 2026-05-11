import React from 'react';
import {
    Autocomplete,
    Box,
    FormControlLabel,
    IconButton,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { CardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { Aspect, BaseConstraint, IBaseTypeOption, OpponentArchetype } from '@/app/_constants/constants';
import BaseTilePreview from './BaseTilePreview';
import {
    BASE_ASPECTS,
    BaseConstraintKind,
    LeaderOption,
    aspectHasIcon,
    aspectIconUrl,
    baseTileKindFor,
    baseTypeDisplayName,
    baseTypeFilter,
    capitalize,
    cardImageUrl,
    getConstraintKind,
    leaderLabel,
    pluckOptionProps,
} from './utils';

const BASE_CONSTRAINT_KIND_OPTIONS: { value: BaseConstraintKind; label: string }[] = [
    { value: 'any', label: 'Any base' },
    { value: 'aspect', label: 'Any base of aspect' },
    { value: 'baseType', label: 'Specific base type' },
];

interface IEditArchetypeDialogProps {
    draft: OpponentArchetype;
    leaders: LeaderOption[];
    baseTypes: IBaseTypeOption[];
    baseTypesByJoinedIds: Map<string, IBaseTypeOption>;
    leaderById: Map<string, LeaderOption>;
    setDraft: (next: OpponentArchetype) => void;
    onCancel: () => void;
    onCommit: () => void;
    isDuplicate: boolean;
}

const EditArchetypeDialog: React.FC<IEditArchetypeDialogProps> = ({
    draft,
    leaders,
    baseTypes,
    baseTypesByJoinedIds,
    leaderById,
    setDraft,
    onCancel,
    onCommit,
    isDuplicate,
}) => {
    const kind = getConstraintKind(draft.baseConstraint);
    const selectedLeader = leaderById.get(draft.leaderId) ?? null;
    const selectedBaseTypeKey = draft.baseConstraint?.kind === 'baseType'
        ? draft.baseConstraint.baseIds.slice().sort().join('|')
        : null;
    const selectedBaseType = selectedBaseTypeKey ? (baseTypesByJoinedIds.get(selectedBaseTypeKey) ?? null) : null;
    const selectedAspect = draft.baseConstraint?.kind === 'aspect' ? draft.baseConstraint.aspect : Aspect.Vigilance;

    const leaderImageUrl = selectedLeader ? cardImageUrl(selectedLeader.id, CardStyle.PlainLeader) : null;
    const uniqueBaseImageUrl = selectedBaseType && selectedBaseType.baseIds.length === 1
        ? cardImageUrl(selectedBaseType.id)
        : null;

    const onLeaderChange = (next: LeaderOption | null) => {
        if (!next) return;
        setDraft({ ...draft, leaderId: next.id });
    };
    const onKindChange = (nextKind: BaseConstraintKind) => {
        if (nextKind === 'any') {
            setDraft({ ...draft, baseConstraint: undefined });
            return;
        }
        if (nextKind === 'aspect') {
            setDraft({ ...draft, baseConstraint: { kind: 'aspect', aspect: selectedAspect } });
            return;
        }
        const firstType = baseTypes[0];
        if (!firstType) return;
        const next: BaseConstraint = { kind: 'baseType', baseIds: firstType.baseIds };
        setDraft({ ...draft, baseConstraint: next });
    };
    const onAspectChange = (nextAspect: Aspect) => {
        setDraft({ ...draft, baseConstraint: { kind: 'aspect', aspect: nextAspect } });
    };
    const onBaseTypeChange = (next: IBaseTypeOption | null) => {
        if (!next) return;
        setDraft({ ...draft, baseConstraint: { kind: 'baseType', baseIds: next.baseIds } });
    };

    const basePreviewCaption =
        kind === 'aspect' ? `Any ${capitalize(selectedAspect)} base` :
            kind === 'baseType' && selectedBaseType ? baseTypeDisplayName(selectedBaseType) :
                'Any base';

    const previewTileKind = baseTileKindFor(draft.baseConstraint, selectedBaseType);
    const previewTileAspects: Aspect[] = kind === 'aspect'
        ? [selectedAspect]
        : selectedBaseType?.aspects ?? [];

    // ----------------------Styles-----------------------------//
    const styles = {
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        dialog: {
            padding: '2rem',
            borderRadius: '15px',
            border: '2px solid transparent',
            background: 'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            width: '560px',
            maxWidth: '92%',
            maxHeight: '92vh',
            overflow: 'auto',
            position: 'relative' as const,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1rem',
        },
        preview: {
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '0.5rem',
            flexWrap: 'wrap' as const,
        },
        previewSlot: {
            flex: '1 1 12rem',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '0.5rem',
            minWidth: 0,
            maxWidth: '14rem',
        },
        previewImage: {
            width: '100%',
            maxWidth: '14rem',
            aspectRatio: '7 / 5',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
        },
        previewPlaceholder: {
            width: '100%',
            maxWidth: '14rem',
            aspectRatio: '7 / 5',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            border: '1px dashed rgba(255, 255, 255, 0.18)',
        },
        previewBadge: {
            width: '100%',
            maxWidth: '14rem',
            aspectRatio: '7 / 5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '3.2rem',
        },
        previewCaption: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '0.15rem',
            textAlign: 'center' as const,
        },
        previewCaptionText: {
            color: '#fff',
            fontSize: '0.95em',
            fontWeight: 500,
            margin: 0,
            lineHeight: 1.2,
        },
        previewCaptionSub: {
            color: '#bbbbbb',
            fontSize: '0.85em',
            margin: 0,
            lineHeight: 1.2,
        },
        close: {
            position: 'absolute' as const,
            top: '0.75rem',
            right: '0.75rem',
            color: '#cccccc',
        },
        title: {
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            textAlign: 'center' as const,
        },
        field: {
            flex: 1,
            '& .MuiAutocomplete-clearIndicator, & .MuiAutocomplete-popupIndicator': {
                color: '#ffffff',
            },
            '& .MuiSelect-icon': {
                color: '#ffffff',
            },
        },
        fieldGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '0.25rem',
        },
        fieldLabel: {
            color: '#aaaaaa',
            fontSize: '0.75em',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
        },
        radio: {
            color: '#fff',
            '&.Mui-checked': { color: '#fff' },
            '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
        },
        radioLabel: {
            color: '#fff',
            fontSize: '0.9em',
        },
        aspectOption: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
        },
        aspectOptionIcon: {
            width: '20px',
            height: '20px',
            objectFit: 'contain' as const,
        },
        autocompletePaper: {
            backgroundColor: '#394452',
            color: '#fff',
        },
        noOptionsText: {
            color: '#bbbbbb',
            fontSize: '0.85em',
            padding: '0.25rem 0.5rem',
        },
        optionLeaderThumb: {
            width: '3.5rem',
            height: '2.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            borderRadius: '3px',
            flexShrink: 0,
        },
        optionRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: '36px',
            py: '0.25rem',
        },
        optionLabel: {
            lineHeight: 1.2,
            margin: 0,
            minWidth: 0,
        },
        optionAspectStack: {
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            flexShrink: 0,
        },
        inputAspectAdornmentStack: {
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            ml: '4px',
        },
        inputAspectAdornment: {
            width: '22px',
            height: '22px',
            objectFit: 'contain' as const,
            mr: '2px',
            flexShrink: 0,
        },
        actions: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.5rem',
        },
        duplicateHint: {
            color: '#ff9c70',
            fontSize: '0.85em',
            textAlign: 'right' as const,
            marginTop: '0.5rem',
        },
    };

    return (
        <Box sx={styles.overlay} onClick={onCancel}>
            <Box sx={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <IconButton sx={styles.close} onClick={onCancel} aria-label="close">
                    <CloseIcon />
                </IconButton>
                <Typography sx={styles.title}>Edit archetype</Typography>

                <Box sx={styles.preview}>
                    <Box sx={styles.previewSlot}>
                        {leaderImageUrl ? (
                            <Box sx={{ ...styles.previewImage, backgroundImage: `url(${leaderImageUrl})` }} />
                        ) : (
                            <Box sx={styles.previewPlaceholder} />
                        )}
                        <Box sx={styles.previewCaption}>
                            <Typography sx={styles.previewCaptionText}>
                                {selectedLeader ? selectedLeader.name : 'Unknown leader'}
                            </Typography>
                            {selectedLeader?.subtitle && (
                                <Typography sx={styles.previewCaptionSub}>
                                    {selectedLeader.subtitle}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <Box sx={styles.previewSlot}>
                        {uniqueBaseImageUrl ? (
                            <Box sx={{ ...styles.previewImage, backgroundImage: `url(${uniqueBaseImageUrl})` }} />
                        ) : (
                            <Box sx={styles.previewBadge}>
                                <BaseTilePreview kind={previewTileKind} aspects={previewTileAspects} />
                            </Box>
                        )}
                        <Box sx={styles.previewCaption}>
                            <Typography sx={styles.previewCaptionText}>{basePreviewCaption}</Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={styles.fieldGroup}>
                    <Typography sx={styles.fieldLabel}>Leader</Typography>
                    <Autocomplete
                        options={leaders}
                        value={selectedLeader}
                        getOptionLabel={leaderLabel}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onChange={(_, value) => onLeaderChange(value)}
                        clearIcon={null}
                        renderInput={(params) => <TextField {...params} placeholder="Select leader" size="small" />}
                        sx={styles.field}
                        noOptionsText={<Typography sx={styles.noOptionsText}>No matches</Typography>}
                        slotProps={{ paper: { sx: styles.autocompletePaper } }}
                        renderOption={(props, option) => (
                            <Box
                                component="li"
                                key={option.id}
                                {...pluckOptionProps(props as React.HTMLAttributes<HTMLLIElement>)}
                                sx={styles.optionRow}
                            >
                                <Box sx={{ ...styles.optionLeaderThumb, backgroundImage: `url(${cardImageUrl(option.id, CardStyle.PlainLeader)})` }} />
                                <Typography component="span" sx={styles.optionLabel}>{leaderLabel(option)}</Typography>
                            </Box>
                        )}
                    />
                </Box>

                <Box sx={styles.fieldGroup}>
                    <Typography sx={styles.fieldLabel}>Base</Typography>
                    <RadioGroup row value={kind} onChange={(_, value) => onKindChange(value as BaseConstraintKind)}>
                        {BASE_CONSTRAINT_KIND_OPTIONS.map(({ value, label }) => (
                            <FormControlLabel
                                key={value}
                                value={value}
                                control={<Radio size="small" sx={styles.radio} />}
                                label={<Typography sx={styles.radioLabel}>{label}</Typography>}
                            />
                        ))}
                    </RadioGroup>
                </Box>

                {kind === 'aspect' && (
                    <Box sx={styles.fieldGroup}>
                        <Typography sx={styles.fieldLabel}>Aspect</Typography>
                        <Select
                            value={selectedAspect}
                            size="small"
                            fullWidth
                            onChange={(e) => onAspectChange(e.target.value as Aspect)}
                            renderValue={(value) => (
                                <Box component="span" sx={styles.aspectOption}>
                                    <Box
                                        component="img"
                                        src={aspectIconUrl(value)}
                                        alt={value}
                                        sx={styles.aspectOptionIcon}
                                    />
                                    {capitalize(value)}
                                </Box>
                            )}
                        >
                            {BASE_ASPECTS.map((aspect) => (
                                <MenuItem key={aspect} value={aspect}>
                                    <Box component="span" sx={styles.aspectOption}>
                                        <Box
                                            component="img"
                                            src={aspectIconUrl(aspect)}
                                            alt={aspect}
                                            sx={styles.aspectOptionIcon}
                                        />
                                        {capitalize(aspect)}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                )}

                {kind === 'baseType' && (
                    <Box sx={styles.fieldGroup}>
                        <Typography sx={styles.fieldLabel}>Base type</Typography>
                        <Autocomplete
                            options={baseTypes}
                            value={selectedBaseType}
                            getOptionLabel={(option) => (option ? baseTypeDisplayName(option) : '')}
                            filterOptions={baseTypeFilter}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            onChange={(_, value) => onBaseTypeChange(value)}
                            clearIcon={null}
                            noOptionsText={<Typography sx={styles.noOptionsText}>No matches</Typography>}
                            slotProps={{ paper: { sx: styles.autocompletePaper } }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select base type"
                                    size="small"
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (() => {
                                            const adornAspects = (selectedBaseType?.aspects ?? []).filter(aspectHasIcon);
                                            if (adornAspects.length === 0) return null;
                                            return (
                                                <Box sx={styles.inputAspectAdornmentStack}>
                                                    {adornAspects.map((aspect) => (
                                                        <Box
                                                            key={aspect}
                                                            component="img"
                                                            src={aspectIconUrl(aspect)}
                                                            alt={aspect}
                                                            sx={styles.inputAspectAdornment}
                                                        />
                                                    ))}
                                                </Box>
                                            );
                                        })(),
                                    }}
                                />
                            )}
                            sx={styles.field}
                            renderOption={(props, option) => {
                                const renderableAspects = (option.aspects ?? []).filter(aspectHasIcon);
                                return (
                                    <Box
                                        component="li"
                                        key={option.id}
                                        {...pluckOptionProps(props as React.HTMLAttributes<HTMLLIElement>)}
                                        sx={styles.optionRow}
                                    >
                                        {renderableAspects.length > 0 && (
                                            <Box sx={styles.optionAspectStack}>
                                                {renderableAspects.map((aspect) => (
                                                    <Box
                                                        key={aspect}
                                                        component="img"
                                                        src={aspectIconUrl(aspect)}
                                                        alt={aspect}
                                                        sx={styles.aspectOptionIcon}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                        <Typography component="span" sx={styles.optionLabel}>
                                            {baseTypeDisplayName(option)}
                                        </Typography>
                                    </Box>
                                );
                            }}
                        />
                    </Box>
                )}

                {isDuplicate && (
                    <Typography sx={styles.duplicateHint}>
                        An archetype with this leader and base is already in your list.
                    </Typography>
                )}
                <Box sx={styles.actions}>
                    <PreferenceButton variant="standard" text="Cancel" buttonFnc={onCancel} />
                    <PreferenceButton
                        variant="standard"
                        text="Done"
                        buttonFnc={onCommit}
                        disabled={!draft.leaderId || isDuplicate}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default EditArchetypeDialog;
