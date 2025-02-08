export const buttonStyle = {
    borderRadius: '15px',
    backgroundColor: '#1E2D32',
    padding: '1rem 1.5rem',

    border: '2px solid transparent',
    background:
    'linear-gradient(#1E2D32, #1E2D32) padding-box, linear-gradient(to top, #038FC3, #595A5B) border-box',
    '&:hover': {
        background: 'hsl(195, 25%, 16%)',
    },
    '&:disabled': {
        color: '#666666',
    },
};

export const perCardButtonStyle = {
    borderRadius: '15px',
    backgroundColor: '#1E2D32',
    padding: '.5rem 1rem',
    fontSize: '.75rem',

    border: '2px solid transparent',
    background:
    'linear-gradient(#1E2D32, #1E2D32) padding-box, linear-gradient(to top, #038FC3, #595A5B) border-box',
    '&:hover': {
        background: 'hsl(195, 25%, 16%)',
    },
    '&:disabled': {
        color: '#666666',
    },
};

export const concedeButtonStyle = {
    padding: '1rem 1.5rem',
    borderRadius: '15px',
    backgroundImage: 'linear-gradient(#1E2D32, #1E2D32)',
    border: '2px solid transparent',
    background:
    'linear-gradient(#380707, #380707) padding-box, linear-gradient(to top, #C30101, #7D0807) border-box',
};

export const contentStyle = (index: number) => ({
    padding: '2rem',
    borderRadius: '15px',
    position: 'absolute',
    border: '2px solid transparent',
    background:
    'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
    zIndex: 11 + index,
});

export const containerStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',

    flex: 1,
    height: '100%',
    width: '100%',
};

export const headerStyle = (isMinimized: boolean) => ({
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '-10px',
    marginBottom: isMinimized ? '-20px' : '0',
    position: 'relative',
});

export const footerStyle = {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
};

export const minimizeButtonStyle = {
    marginTop: '-15px',
    color: 'white',
    position: 'absolute',
    right: 0,

};

export const titleStyle = {
    color: 'white',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    textAlign: 'center',
    width: '80%'
};

export const textStyle = {
    color: '#C7C7C7',
};

export const cardButtonStyle = {
    backgroundColor: 'transparent',
    padding: '0',
    borderRadius: '8px',
};

export const selectedCardBorderStyle = (isSelected: boolean) => ({
    border: isSelected ? '2px solid #66E5FF' : '2px solid transparent',
    borderRadius: '8px',
});

export const selectedIndicatorStyle = (isSelected: boolean) => ({
    backgroundColor: isSelected ? '#66E5FF' : '#666666',
    height: '8px',
    width: '8px',
    borderRadius: '100%',
});
