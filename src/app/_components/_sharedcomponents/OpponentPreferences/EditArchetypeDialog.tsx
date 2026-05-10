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
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { Aspect, BaseConstraint, IBaseTypeOption, OpponentArchetype } from '@/app/_constants/constants';
import {
    ASPECT_OPTIONS,
    BaseConstraintKind,
    LeaderOption,
    aspectHasIcon,
    aspectIconUrl,
    baseTypeFilter,
    baseTypeLabel,
    capitalize,
    displayBaseLabel,
    getConstraintKind,
    leaderLabel,
} from './utils';

interface IEditArchetypeDialogProps {
    draft: OpponentArchetype;
    leaders: LeaderOption[];
    baseTypes: IBaseTypeOption[];
    baseTypesByJoinedIds: Map<string, IBaseTypeOption>;
    leaderById: Map<string, LeaderOption>;
    setDraft: (next: OpponentArchetype) => void;
    onCancel: () => void;
    onCommit: () => void;
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
}) => {
    const kind = getConstraintKind(draft.baseConstraint);
    const selectedLeader = leaderById.get(draft.leaderId) ?? null;
    const selectedBaseTypeKey = draft.baseConstraint?.kind === 'baseType'
        ? draft.baseConstraint.baseIds.slice().sort().join('|')
        : null;
    const selectedBaseType = selectedBaseTypeKey ? (baseTypesByJoinedIds.get(selectedBaseTypeKey) ?? null) : null;
    const selectedAspect = draft.baseConstraint?.kind === 'aspect' ? draft.baseConstraint.aspect : Aspect.Vigilance;

    const leaderImageUrl = selectedLeader
        ? s3CardImageURL({ id: selectedLeader.id, count: 0 } as never, CardStyle.PlainLeader)
        : null;
    const uniqueBaseImageUrl = selectedBaseType && selectedBaseType.baseIds.length === 1
        ? s3CardImageURL({ id: selectedBaseType.representativeId, count: 0 } as never)
        : null;

    const onLeaderChange = (next: LeaderOption | null) => {
        if (!next) return;
        setDraft({ ...draft, leaderId: next.id });
    };
    const onKindChange = (nextKind: BaseConstraintKind) => {
        if (nextKind === 'any') {
            const { baseConstraint, ...rest } = draft;
            void baseConstraint;
            setDraft(rest);
            return;
        }
        if (nextKind === 'aspect') {
            setDraft({ ...draft, baseConstraint: { kind: 'aspect', aspect: selectedAspect } });
            return;
        }
        const firstType = baseTypes[0];
        if (!firstType) return;
        const next: BaseConstraint = { kind: 'baseType', baseIds: firstType.baseIds, label: firstType.label };
        setDraft({ ...draft, baseConstraint: next });
    };
    const onAspectChange = (nextAspect: Aspect) => {
        setDraft({ ...draft, baseConstraint: { kind: 'aspect', aspect: nextAspect } });
    };
    const onBaseTypeChange = (next: IBaseTypeOption | null) => {
        if (!next) return;
        setDraft({ ...draft, baseConstraint: { kind: 'baseType', baseIds: next.baseIds, label: next.label } });
    };

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
        },
        previewBadgeIcon: {
            width: '5rem',
            height: '5rem',
            objectFit: 'contain' as const,
        },
        previewBadgeIconStack: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        },
        previewAnyBase: {
            background: 'linear-gradient(135deg, #1a2530 0%, #08111a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
        },
        previewAnyBaseText: {
            color: 'rgba(255, 255, 255, 0.55)',
            fontSize: '12rem',
            fontWeight: 400,
            margin: 0,
            lineHeight: 0.6,
            transform: 'translateY(0.18em)',
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
        optionSet: {
            color: '#aaaaaa',
            fontSize: '0.85em',
            lineHeight: 1.2,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            flexShrink: 0,
            marginLeft: 'auto',
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
                        ) : kind === 'aspect' ? (
                            <Box sx={styles.previewBadge}>
                                <Box
                                    component="img"
                                    src={aspectIconUrl(selectedAspect)}
                                    alt={selectedAspect}
                                    sx={styles.previewBadgeIcon}
                                />
                            </Box>
                        ) : kind === 'baseType' && selectedBaseType && selectedBaseType.aspects.some(aspectHasIcon) ? (
                            <Box sx={styles.previewBadge}>
                                <Box sx={styles.previewBadgeIconStack}>
                                    {selectedBaseType.aspects.filter(aspectHasIcon).map((aspect) => (
                                        <Box
                                            key={aspect}
                                            component="img"
                                            src={aspectIconUrl(aspect)}
                                            alt={aspect}
                                            sx={styles.previewBadgeIcon}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ ...styles.previewBadge, ...styles.previewAnyBase }}>
                                <Typography sx={styles.previewAnyBaseText}>*</Typography>
                            </Box>
                        )}
                        <Box sx={styles.previewCaption}>
                            <Typography sx={styles.previewCaptionText}>
                                {kind === 'any'
                                    ? 'Any base'
                                    : kind === 'aspect'
                                        ? `Any ${capitalize(selectedAspect)} base`
                                        : selectedBaseType
                                            ? displayBaseLabel(selectedBaseType.label)
                                            : 'Any base'}
                            </Typography>
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
                        renderOption={(props, option) => {
                            const { key: _key, ...optionProps } = props as React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
                            void _key;
                            const thumbUrl = s3CardImageURL({ id: option.id, count: 0 } as never, CardStyle.PlainLeader);
                            return (
                                <Box component="li" key={option.id} {...optionProps} sx={styles.optionRow}>
                                    <Box sx={{ ...styles.optionLeaderThumb, backgroundImage: `url(${thumbUrl})` }} />
                                    <Typography component="span" sx={styles.optionLabel}>{leaderLabel(option)}</Typography>
                                </Box>
                            );
                        }}
                    />
                </Box>

                <Box sx={styles.fieldGroup}>
                    <Typography sx={styles.fieldLabel}>Base</Typography>
                    <RadioGroup row value={kind} onChange={(_, value) => onKindChange(value as BaseConstraintKind)}>
                        <FormControlLabel
                            value="any"
                            control={<Radio size="small" sx={styles.radio} />}
                            label={<Typography sx={styles.radioLabel}>Any base</Typography>}
                        />
                        <FormControlLabel
                            value="aspect"
                            control={<Radio size="small" sx={styles.radio} />}
                            label={<Typography sx={styles.radioLabel}>Any base of aspect</Typography>}
                        />
                        <FormControlLabel
                            value="baseType"
                            control={<Radio size="small" sx={styles.radio} />}
                            label={<Typography sx={styles.radioLabel}>Specific base type</Typography>}
                        />
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
                                    {capitalize(value as string)}
                                </Box>
                            )}
                        >
                            {ASPECT_OPTIONS.map((aspect) => (
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
                            getOptionLabel={(option) => displayBaseLabel(baseTypeLabel(option))}
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
                                        startAdornment: selectedBaseType?.aspects.some(aspectHasIcon) ? (
                                            <Box sx={styles.inputAspectAdornmentStack}>
                                                {selectedBaseType.aspects.filter(aspectHasIcon).map((aspect) => (
                                                    <Box
                                                        key={aspect}
                                                        component="img"
                                                        src={aspectIconUrl(aspect)}
                                                        alt={aspect}
                                                        sx={styles.inputAspectAdornment}
                                                    />
                                                ))}
                                            </Box>
                                        ) : null,
                                    }}
                                />
                            )}
                            sx={styles.field}
                            renderOption={(props, option) => {
                                const { key: _key, ...optionProps } = props as React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
                                void _key;
                                return (
                                    <Box component="li" key={option.id} {...optionProps} sx={styles.optionRow}>
                                        {option.aspects.some(aspectHasIcon) && (
                                            <Box sx={styles.optionAspectStack}>
                                                {option.aspects.filter(aspectHasIcon).map((aspect) => (
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
                                            {displayBaseLabel(option.label)}
                                        </Typography>
                                        {option.set && (
                                            <Typography component="span" sx={styles.optionSet}>{option.set}</Typography>
                                        )}
                                    </Box>
                                );
                            }}
                        />
                    </Box>
                )}

                <Box sx={styles.actions}>
                    <PreferenceButton variant="standard" text="Cancel" buttonFnc={onCancel} />
                    <PreferenceButton variant="standard" text="Done" buttonFnc={onCommit} />
                </Box>
            </Box>
        </Box>
    );
};

export default EditArchetypeDialog;
