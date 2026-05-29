import * as React from 'react';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import OutlinedInput from '@mui/material/OutlinedInput';

const styles = {
    formControl: {
        '& .MuiButton-root': {
            borderColor: 'divider',
            minWidth: 0,
            bgcolor: 'action.hover',
            '&:not(.Mui-disabled)': {
                color: 'text.primary',
            },
        },
    },
    decrementButton: {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderRight: '0px',
        '&.Mui-disabled': {
            borderRight: '0px',
        },
    },
    incrementButton: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderLeft: '0px',
        '&.Mui-disabled': {
            borderLeft: '0px',
        },
    },
    outlinedInput: {
        pr: 0,
        borderRadius: 0,
        flex: 1,
        mb: 0
    },
    input: {
        textAlign: 'center'
    }
};

/**
 * This code is taken from the examples in https://mui.com/material-ui/react-number-field/
 */
export default function NumberSpinner({
    id: idProp,
    label,
    error,
    size = 'medium',
    ...other
}: BaseNumberField.Root.Props & {
    label?: React.ReactNode;
    size?: 'small' | 'medium';
    error?: boolean;
}) {
    let id = React.useId();
    if (idProp) {
        id = idProp;
    }
    return (
        <BaseNumberField.Root
            {...other}
            render={(props, state) => (
                <FormControl
                    size={size}
                    ref={props.ref}
                    disabled={state.disabled}
                    required={state.required}
                    error={error}
                    variant="outlined"
                    sx={styles.formControl}
                >
                    {props.children}
                </FormControl>
            )}
        >
            <Box sx={{ display: 'flex' }}>
                <BaseNumberField.Decrement
                    render={
                        <Button
                            variant="outlined"
                            aria-label="Decrease"
                            size={size}
                            sx={styles.decrementButton}
                        />
                    }
                >
                    <RemoveIcon fontSize={size} />
                </BaseNumberField.Decrement>

                <BaseNumberField.Input
                    id={id}
                    render={(props, state) => (
                        <OutlinedInput
                            inputRef={props.ref}
                            value={state.inputValue}
                            onBlur={props.onBlur}
                            onChange={props.onChange}
                            onKeyUp={props.onKeyUp}
                            onKeyDown={props.onKeyDown}
                            onFocus={props.onFocus}
                            slotProps={{
                                input: {
                                    ...props,
                                    size: Math.max((other.min?.toString() || '').length, state.inputValue.length || 1) + 1,
                                    sx: styles.input,
                                },
                            }}
                            sx={styles.outlinedInput}
                        />
                    )}
                />

                <BaseNumberField.Increment
                    render={
                        <Button
                            variant="outlined"
                            aria-label="Increase"
                            size={size}
                            sx={styles.incrementButton}
                        />
                    }
                >
                    <AddIcon fontSize={size} />
                </BaseNumberField.Increment>
            </Box>
        </BaseNumberField.Root>
    );
}
