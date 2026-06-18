import { Button, SxProps, ButtonProps as MuiButtonProps } from '@mui/material';
import { Theme } from '@mui/material/styles';

export type IGradientBorderButtonProps = Omit<MuiButtonProps, 'sx'> & {
    fillColor?: string;
    sx?: SxProps<Theme>;
};

const GradientBorderButton: React.FC<IGradientBorderButtonProps> = ({ fillColor = '#1E2D32', sx, ...otherProps }) => (
    <Button
        sx={{
            borderRadius: '15px',
            backgroundColor: '#1E2D32',
            padding: '1rem 1.5rem',

            border: '2px solid transparent',
            background:
                `linear-gradient(${fillColor}, ${fillColor}) padding-box, linear-gradient(to top, #038FC3, #595A5B) border-box`,
            '&:hover': {
                filter: 'brightness(1.2)',
            },
            '&:disabled': {
                color: '#666666',
                cursor: 'default',
            },
            cursor: 'pointer',
            ...sx
        }}
        {...otherProps}
    />
);

export default GradientBorderButton;
