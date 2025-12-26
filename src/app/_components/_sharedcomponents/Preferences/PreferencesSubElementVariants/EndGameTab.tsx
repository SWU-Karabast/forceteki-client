import * as React from 'react';
import { useState } from 'react';
import { useGame } from '@/app/_contexts/Game.context';
import EndGameOptions from '@/app/_components/_sharedcomponents/Preferences/_subComponents/EndGameOptions';
import BugReportDialog from '@/app/_components/_sharedcomponents/Preferences/_subComponents/BugReportDialog';
import { MatchmakingType } from '@/app/_constants/constants';

function EndGameTab() {
    // handle change based on what the match is.
    const { lobbyState } = useGame();
    const gameType = lobbyState?.gameType || MatchmakingType.PrivateLobby;
    const [bugReportOpen, setBugReportOpen] = useState<boolean>(false);

    const handleOpenBugReport = () => {
        setBugReportOpen(true);
    };

    const handleCloseBugReport = () => {
        setBugReportOpen(false);
    };

    return <>
        <EndGameOptions
            handleOpenBugReport={handleOpenBugReport}
            gameType={gameType}
        />
        <BugReportDialog
            open={bugReportOpen}
            onClose={handleCloseBugReport}
        />
    </>
}
export default EndGameTab;
