import { unlinkSwuStatsAsync } from '@/app/_utils/ServerAndLocalStorageUtils';
import { getSwuStatsAuthUrl } from '@/app/_utils/swuStatsUtils';
import LinkServiceButton from './LinkServiceButton';

type Props = {
    linked: boolean;
    onLinkChange: (linkStatus: boolean) => void;
};

function LinkSwuStatsButton({ linked, onLinkChange }: Props) {
    return (
        <LinkServiceButton
            serviceName="SWUstats"
            linked={linked}
            onLinkChange={onLinkChange}
            getAuthUrl={getSwuStatsAuthUrl}
            unlinkService={unlinkSwuStatsAsync}
        />
    );
}

export default LinkSwuStatsButton;