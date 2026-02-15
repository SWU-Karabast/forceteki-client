import * as React from 'react';
import { useState } from 'react';
import { useGame } from '@/app/_contexts/Game.context';
import EndGameOptions from '@/app/_components/_sharedcomponents/Preferences/_subComponents/EndGameOptions';
import BugReportDialog from '@/app/_components/_sharedcomponents/Preferences/_subComponents/BugReportDialog';
import { MatchmakingType } from '@/app/_constants/constants';
import PlayerReportDialog from "@/app/_components/_sharedcomponents/Preferences/_subComponents/PlayerReportDialog";

function EndGameTab() {
    // handle change based on what the match is.
    const { lobbyState } = useGame();
    const gameType = lobbyState?.gameType || MatchmakingType.PrivateLobby;
    const [bugReportOpen, setBugReportOpen] = useState<boolean>(false);
    const [playerReportOpen, setPlayerReportOpen] = useState<boolean>(false);

    const handleOpenBugReport = () => {
        setBugReportOpen(true);
    };

    const handleCloseBugReport = () => {
        setBugReportOpen(false);
    };

    const handleOpenPersonReport = () => {
        setPlayerReportOpen(true);
    };

    const handleClosePersonReport = () => {
        setPlayerReportOpen(false);
    };

    return <>
        <EndGameOptions
            handleOpenBugReport={handleOpenBugReport}
            handleOpenPersonReport={handleOpenPersonReport}
            gameType={gameType}
        />
        <BugReportDialog
            open={bugReportOpen}
            onClose={handleCloseBugReport}
        />
        <PlayerReportDialog
            open={playerReportOpen}
            onClose={handleClosePersonReport}
        />
    </>
}
export default EndGameTab;
