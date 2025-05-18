import { Button } from '@mui/material';

interface IGradientBorderButtonProps {
    fillColor?: string;
    onClickHandler: () => void;
    children: React.ReactNode;
}

const GradientBorderButton: React.FC<IGradientBorderButtonProps> = ({ fillColor = '#1E2D32', onClickHandler, children }) => {
    return (
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
                    cursor: 'normal',
                },
                cursor: 'pointer',
            }}
            onClick={onClickHandler}
        >
            {children}
        </Button>
    );
};

export default GradientBorderButton;