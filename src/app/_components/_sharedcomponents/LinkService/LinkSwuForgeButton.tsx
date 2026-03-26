import { useCallback } from 'react';
import { unlinkSwuforgeAsync } from '@/app/_utils/ServerAndLocalStorageUtils';
import LinkServiceButton from './LinkServiceButton';
import { getSwuforgeAuthUrl } from '@/app/_utils/StatsUtils';

type Props = {
    linked: boolean;
    onLinkChange: (linkStatus: boolean) => void;
    userId: string;
};

function LinkSwuForgeButton({ linked, onLinkChange, userId }: Props) {
    const getAuthUrl = useCallback(() => {
        return getSwuforgeAuthUrl(userId);
    }, [userId])

    return (
        <LinkServiceButton
            serviceName="SWU Forge"
            linked={linked}
            onLinkChange={onLinkChange}
            getAuthUrl={getAuthUrl}
            unlinkService={unlinkSwuforgeAsync}
        />
    );
}

export default LinkSwuForgeButton;
