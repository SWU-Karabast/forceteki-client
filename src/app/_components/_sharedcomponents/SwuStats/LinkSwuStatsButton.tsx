import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
type Props = {
    linked: boolean;
};

export default function LinkSwuStatsButton({ linked }:Props) {
    const theme = useTheme();
    const swustatsUrl = `https://swustats.net/TCGEngine/APIs/OAuth/authorize.php?response_type=code&client_id=${
        process.env.SWU_STATS_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        'http://localhost:3000/api/swustats'
    )}&scope=${encodeURIComponent('decks email profile')}`;
    const handleClick = async () => {
        window.location.href = swustatsUrl;
    }
    return (
        <Button
            variant="contained"
            onClick={handleClick}
            sx={{
                background: linked ? 'darkgreen' : theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: '12px',
                px: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                    background: linked ? '#003400' : theme.palette.primary.dark,
                    boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                },
            }}
        >
            { linked ? '⛓️‍💥 Unlink SWUstats' : '🔗 Link SWUstats' }
        </Button>
    );
}
