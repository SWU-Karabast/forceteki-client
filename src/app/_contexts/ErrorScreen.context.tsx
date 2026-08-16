'use client';
import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import ErrorCardOverlay, { IErrorScreenAction } from '@/app/_components/_sharedcomponents/Error/ErrorCardOverlay';

export interface IErrorScreenRequest {
    title: string;
    message: string;

    /** Raw technical detail (e.g. a server message) shown under the main copy. */
    detail?: string;

    /**
     * Recovery options offered to the user. Each receives a `dismiss` callback so an
     * action can close the screen as well as do its own work. Defaults to a single
     * "Dismiss" button when omitted.
     */
    actions?: (dismiss: () => void) => IErrorScreenAction[];
}

interface IErrorScreenContext {
    showErrorScreen: (request: IErrorScreenRequest) => void;
    hideErrorScreen: () => void;
}

const ErrorScreenContext = createContext<IErrorScreenContext | undefined>(undefined);

/**
 * Provides the full-screen error card used in place of browser `alert()` dialogs.
 * Lives above both the game board and the standalone pages so any of them can raise
 * an error without knowing where it will be drawn.
 */
export const ErrorScreenProvider = ({ children }: { children: ReactNode }) => {
    const [request, setRequest] = useState<IErrorScreenRequest | null>(null);

    const hideErrorScreen = useCallback(() => setRequest(null), []);
    const showErrorScreen = useCallback((next: IErrorScreenRequest) => setRequest(next), []);

    const actions = useMemo(() => {
        if (!request) {
            return [];
        }

        return request.actions
            ? request.actions(hideErrorScreen)
            : [{ label: 'Dismiss', onClick: hideErrorScreen }];
    }, [request, hideErrorScreen]);

    const value = useMemo(
        () => ({ showErrorScreen, hideErrorScreen }),
        [showErrorScreen, hideErrorScreen]
    );

    return (
        <ErrorScreenContext.Provider value={value}>
            {children}
            <ErrorCardOverlay
                open={request !== null}
                title={request?.title ?? ''}
                message={request?.message ?? ''}
                detail={request?.detail}
                actions={actions}
            />
        </ErrorScreenContext.Provider>
    );
};

export const useErrorScreen = () => {
    const context = useContext(ErrorScreenContext);
    if (!context) {
        throw new Error('useErrorScreen must be used within an ErrorScreenProvider');
    }
    return context;
};
