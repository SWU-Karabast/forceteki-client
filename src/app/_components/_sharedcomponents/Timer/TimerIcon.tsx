import { TimerOutlined } from '@mui/icons-material';
import { SvgIconOwnProps, SxProps } from '@mui/material';
import { Theme } from '@mui/system';

const TimerIcon = ({ color, sx }: { color?: SvgIconOwnProps['color'], sx?: SxProps<Theme> }) => 
    <TimerOutlined 
        color={color} 
        fontSize="medium" 
        sx={{ mt: '2px', color, ...sx }}
    />;

export default TimerIcon;