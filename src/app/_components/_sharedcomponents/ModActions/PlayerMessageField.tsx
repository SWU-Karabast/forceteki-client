import React from 'react';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { MAX_PLAYER_NOTICE_LENGTH } from '@/app/_utils/playerNoticeUtils';

interface IPlayerMessageFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;

    /** Shown before the character count, e.g. who will see the message */
    hint?: string;

    /** Shown instead of the hint, e.g. when a required message is missing */
    errorMessage?: string;
    disabled?: boolean;
}

/** A message a moderator writes to a player, with the length the server accepts */
const PlayerMessageField: React.FC<IPlayerMessageFieldProps> = ({ value, onChange, placeholder, hint, errorMessage, disabled }) => {
    const count = `${value.trim().length}/${MAX_PLAYER_NOTICE_LENGTH}`;
    const helperText = errorMessage ?? hint;

    return (
        <StyledTextField
            multiline
            minRows={3}
            fullWidth
            size="small"
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            inputProps={{ maxLength: MAX_PLAYER_NOTICE_LENGTH }}
            error={!!errorMessage}
            helperText={helperText ? `${helperText} (${count})` : count}
            FormHelperTextProps={{ sx: { color: errorMessage ? undefined : '#B0B0B0', mx: 0 } }}
            onChange={(e) => onChange(e.target.value)}
        />
    );
};

export default PlayerMessageField;
