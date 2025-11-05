import * as React from 'react';
import { useState } from 'react';
import { useGame } from '@/app/_contexts/Game.context';
import EndGameOptionsQuickMatch
    from '@/app/_components/_sharedcomponents/Preferences/_subComponents/EndGameOptionsQuickMatch';
import EndGameOptionsCustom from '../_subComponents/EndGameOptionsCustom';
import BugReportDialog from '@/app/_components/_sharedcomponents/Preferences/_subComponents/BugReportDialog';
import { MatchType } from '@/app/_constants/constants';

function EndGameTab() {
    // handle change based on what the match is.
    const { lobbyState } = useGame();
    const isQuickMatch = lobbyState && lobbyState.gameType ? lobbyState.gameType === MatchType.Quick : false;
    const [bugReportOpen, setBugReportOpen] = useState<boolean>(false);

    const handleOpenBugReport = () => {
        setBugReportOpen(true);
    };

    const handleCloseBugReport = () => {
        setBugReportOpen(false);
    };

    return <>
        {
            isQuickMatch
                ? <EndGameOptionsQuickMatch handleOpenBugReport={handleOpenBugReport} />
                : <EndGameOptionsCustom handleOpenBugReport={handleOpenBugReport} />
        }
        <BugReportDialog
            open={bugReportOpen}
            onClose={handleCloseBugReport}
        />
    </>
}
export default EndGameTab;
