import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Custom hook to detect if the device is in portrait orientation
 * @returns {Object} An object containing isPortrait and isLandscape boolean values
 */
export const useScreenOrientation = () => {
  const theme = useTheme();
  const isPortrait = useMediaQuery('(orientation: portrait)');
  
  return {
    isPortrait,
    isLandscape: !isPortrait
  };
};

export default useScreenOrientation;
