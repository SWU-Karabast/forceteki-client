'use client';

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import RecoveryErrorDialog, {
    IRecoveryErrorAction,
    RecoveryErrorActionVariant,
} from '@/app/_components/_sharedcomponents/Error/RecoveryErrorDialog';

interface IShowRecoveryErrorAction {
    label: string;
    onClick?: () => void;
    variant?: RecoveryErrorActionVariant;
}

interface IShowRecoveryErrorOptions {
    title?: string;
    message: ReactNode;
    actions?: IShowRecoveryErrorAction[];
}

interface IRecoveryErrorState {
    title: string;
    message: ReactNode;
    actions: IShowRecoveryErrorAction[];
}

interface IErrorRecoveryContext {
    showError: (options: IShowRecoveryErrorOptions) => void;
    dismissError: () => void;
}

const ErrorRecoveryContext = createContext<IErrorRecoveryContext | undefined>(undefined);

export const ErrorRecoveryProvider = ({ children }: { children: ReactNode }) => {
    const [errorState, setErrorState] = useState<IRecoveryErrorState | null>(null);

    const dismissError = useCallback(() => {
        setErrorState(null);
    }, []);

    const showError = useCallback((options: IShowRecoveryErrorOptions) => {
        setErrorState({
            title: options.title ?? 'Something went wrong',
            message: options.message,
            actions: options.actions?.length ? options.actions : [{ label: 'Close' }],
        });
    }, []);

    const dialogActions: IRecoveryErrorAction[] = useMemo(() => {
        return (errorState?.actions ?? []).map((action) => ({
            label: action.label,
            variant: action.variant,
            onClick: () => {
                dismissError();
                action.onClick?.();
            },
        }));
    }, [dismissError, errorState?.actions]);

    return (
        <ErrorRecoveryContext.Provider value={{ showError, dismissError }}>
            {children}
            <RecoveryErrorDialog
                open={Boolean(errorState)}
                title={errorState?.title ?? ''}
                message={errorState?.message ?? ''}
                actions={dialogActions}
                onClose={dismissError}
            />
        </ErrorRecoveryContext.Provider>
    );
};

export const useErrorRecovery = () => {
    const context = useContext(ErrorRecoveryContext);

    if (!context) {
        throw new Error('useErrorRecovery must be used within ErrorRecoveryProvider');
    }

    return context;
};
