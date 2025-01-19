import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type KeyItem = {
    label: string;
    width?: string; // for variable-width keys like 'Shift' or 'Space'
    height?: string; // for variable-height keys like arrow keys
    highlighted?: boolean;
    subKeys?: KeyItem[];
};

const KeyboardLayout: React.FC = () => {
    // Which keys should be highlighted
    const highlightedKeys = new Set(['W', 'U', 'I', 'A', 'H', 'L', 'C', 'M','SPACE BAR','ESC']);

    // Define each row of keys
    const row0: KeyItem[] = [
        { label: 'ESC', width: '6%' }, { label: '', width:'88%' }, { label: '' },
    ];

    const row1: KeyItem[] = [
        { label: '1', width: '11%' },
        { label: '2' }, { label: '3' }, { label: '4' }, { label: '5' }, { label: '6' },
        { label: '7' }, { label: '8' }, { label: '9' }, { label: '0' }, { label: '-' },
        { label: '*' }, { label: '=' }, { label: 'del', width: '5%' },
    ];

    const row2: KeyItem[] = [
        { label: 'Tab', width: '8%' },
        { label: 'Q' }, { label: 'W' }, { label: 'E' }, { label: 'R' }, { label: 'T' },
        { label: 'Y' }, { label: 'U' }, { label: 'I' }, { label: 'O' }, { label: 'P' },
        { label: '[' }, { label: ']' }, { label: '\\', width: '8%' },
    ];

    const row3: KeyItem[] = [
        { label: 'Caps', width: '11%' },
        { label: 'A' }, { label: 'S' }, { label: 'D' }, { label: 'F' }, { label: 'G' },
        { label: 'H' }, { label: 'J' }, { label: 'K' }, { label: 'L' },
        { label: ';' }, { label: '\'' }, { label: 'Enter', width: '12%' },
    ];

    const row4: KeyItem[] = [
        { label: 'Shift', width: '15%' },
        { label: 'Z' }, { label: 'X' }, { label: 'C' }, { label: 'V' }, { label: 'B' },
        { label: 'N' }, { label: 'M' }, { label: ',' }, { label: '.' }, { label: '/' },
        { label: 'Shift', width: '15%' },
    ];

    const row5: KeyItem[] = [
        { label: 'Ctrl', width: '6%' },
        { label: 'Alt', width: '6%' },
        { label: 'Cmd', width: '6%' },
        { label: 'Space Bar', width: '40%' },
        { label: 'Cmd', width: '6%' },
        { label: 'Alt', width: '6%' },
        { label: 'Fn', width: '6%' },
        { label: 'Ctrl', width: '6%' },
        { label: '←', width: '6%', height: '1.25rem' },
        { label: 'UpDown', width: '6%', height: '2.5rem', subKeys: [
            { label: '↑' },
            { label: '↓' },
        ] },
        { label: '→', width: '6%', height: '1.25rem' },
    ];

    const rows = [row0, row1, row2, row3, row4, row5];

    // Base styles for the keyboard container & each key
    const styles = {
        container: {
            display: 'inline-flex',
            flexDirection: 'column' as const,
            gap: '0.5rem',
            background: 'linear-gradient(180deg, #374145 0%, #191919 100%)',
            boxShadow: '0px 1.42px 0px 0px #191A1F',
            borderRadius: '8px',
            padding: '0.5rem',
            width:'80%',
            maxWidth:'59rem',
            minWidth:'35rem'
        },
        row: {
            display: 'flex',
            gap: '0.5rem',
        },
        key: (highlighted: boolean, label: string, width?: string, height?: string) => ({
            display: 'flex',
            alignSelf: 'end',
            alignItems: 'center',
            justifyContent: 'center',
            visibility: label === 'empty' ? 'hidden' : 'visible',
            width: width || '7%',
            height: height || '2.5rem',
            borderRadius: '4px',
            border: highlighted ? '2px solid black':'2px solid #161a1c',
            background: highlighted ? 'linear-gradient(180deg, #191A20 0%,#222226 100%)' :'linear-gradient(180deg, #22262A 0%,#26292D 100%)',
            boxShadow: highlighted ? '0 0px 6px 0px rgba(22, 192, 231, 0.7)' : 'none',
            cursor: 'pointer',
            fontFamily: 'sans-serif',
            '&:hover': {
                border:'2px solid black',
                background: 'linear-gradient(180deg, #191A20 0%,#222226 100%)',
                boxShadow: '0 0px 6px 0px rgba(22, 192, 231, 0.7)',
            }
        }),
        // style for subKeys
        verticalKeyStack: (width?: string) => ({
            width: width || '7%',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'space-between',
            // maybe total height = 5rem so each arrow is ~2.5rem
            height: '2.5rem',
            borderRadius: '4px',
            border: '2px solid #161a1c',
            fontFamily: 'sans-serif',
            cursor: 'pointer',
            background: 'linear-gradient(180deg, #22262A 0%,#26292D 100%)',

        }),
        verticalSubKey: (highlighted: boolean) => ({
            // Each subKey is half the parent's height
            flex: '1 1 50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height:'1.25rem',
            borderBottom: '1px solid #161a1c',
            // The last subKey won't need a bottom border, so you can handle that conditionally if you like
            // highlight styles:
            background: highlighted
                ? 'linear-gradient(180deg, #191A20 0%,#222226 100%)'
                : 'transparent',
            boxShadow: highlighted
                ? '0 0px 6px 0px rgba(22, 192, 231, 0.7)'
                : 'none',
            '&:last-of-type': {
                borderBottom: 'none',
            },
            '&:hover': {
                border:'2px solid black',
                background: 'linear-gradient(180deg, #191A20 0%,#222226 100%)',
                boxShadow: '0 0px 6px 0px rgba(22, 192, 231, 0.7)',
            }
        })
    };

    return (
        <Box sx={styles.container}>
            {rows.map((row, rowIndex) => (
                <Box key={`row-${rowIndex}`} sx={styles.row}>
                    {row.map((keyItem, i) => {
                        // If this item has "subKeys", we treat it as a vertical stack
                        if (keyItem.subKeys && keyItem.subKeys.length > 0) {
                            return (
                                <Box key={i} sx={styles.verticalKeyStack(keyItem.width)}>
                                    {keyItem.subKeys.map((sub, subIndex) => {
                                        const isSubHighlighted = highlightedKeys.has(sub.label.toUpperCase());
                                        return (
                                            <Box
                                                key={`${i}-sub-${subIndex}`}
                                                sx={styles.verticalSubKey(isSubHighlighted)}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: isSubHighlighted ? 'white' : '#505356',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {sub.label}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            );
                        } else {
                            // normal single key
                            const isHighlighted = highlightedKeys.has(keyItem.label.toUpperCase());
                            return (
                                <Box
                                    key={`${rowIndex}-${i}`}
                                    sx={styles.key(isHighlighted, keyItem.label, keyItem.width, keyItem.height)}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: isHighlighted ? 'white' : '#505356',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {keyItem.label}
                                    </Typography>
                                </Box>
                            );
                        }
                    })}
                </Box>
            ))}
        </Box>
    );
};

export default KeyboardLayout;