import { useCallback } from 'react';
import { unlinkSwubaseAsync } from '@/app/_utils/ServerAndLocalStorageUtils';
import { getSwubaseAuthUrl } from '@/app/_utils/swubaseUtils';
import LinkServiceButton from './LinkServiceButton';

type Props = {
    linked: boolean;
    onLinkChange: (linkStatus: boolean) => void;
    userId: string;
};

function LinkSwubaseButton({ linked, onLinkChange, userId }: Props) {
    const getAuthUrl = useCallback(() => {
        return getSwubaseAuthUrl(userId);
    }, [userId])

    return (
        <LinkServiceButton
            serviceName="SWUBase"
            linked={linked}
            onLinkChange={onLinkChange}
            getAuthUrl={getAuthUrl}
            unlinkService={unlinkSwubaseAsync}
        />
    );
}

export default LinkSwubaseButton;