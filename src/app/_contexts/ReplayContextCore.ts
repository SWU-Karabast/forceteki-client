import { createContext } from 'react';
import type { IReplayContextType } from '@/app/_contexts/Replay.context';

// The bare ReplayContext, apart from its provider: useGame reads it on every game page, and
// importing it from Replay.context pulled the whole replay engine into the live-game bundle.
// Keep this module free of runtime imports beyond React (the type import is erased).
export const ReplayContext = createContext<IReplayContextType | null>(null);
