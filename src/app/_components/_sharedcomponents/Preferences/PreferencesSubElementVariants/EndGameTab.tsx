import * as React from 'react';
import { useGame } from '@/app/_contexts/Game.context';
import EndGameOptionsQuickMatch
    from '@/app/_components/_sharedcomponents/Preferences/_subComponents/EndGameOptionsQuickMatch';
import EndGameOptionsCustom from '../_subComponents/EndGameOptionsCustom';

function EndGameTab() {
    // TODO handle change based on what the match is.
    const { lobbyState } = useGame();
    const quickMatchType = lobbyState && lobbyState.gameType ? lobbyState.gameType === 'Quick' : false;

    return (
        <>
            {quickMatchType ? (
                <EndGameOptionsQuickMatch />
            ) : (
                <EndGameOptionsCustom />
            )}
        </>
    );
}
export default EndGameTab;
