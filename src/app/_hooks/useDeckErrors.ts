// _hooks/useDeckErrors.ts
import { useState, useCallback } from 'react';
import { IDeckValidationFailures } from '@/app/_validators/DeckValidation/DeckValidationTypes';

export interface DeckErrorState {
    summary: string | null;
    details: IDeckValidationFailures | string | undefined;
    title: string;
    modalType: 'error' | 'warning';
    isJsonDeck: boolean;
    modalOpen: boolean;
}

export const useDeckErrors = () => {
    const [errorState, setErrorState] = useState<DeckErrorState>({
        summary: null,
        details: undefined,
        title: 'Deck Validation Error',
        modalType: 'error',
        isJsonDeck: false,
        modalOpen: false,
    });

    const setError = useCallback((
        summary: string | null,
        details?: IDeckValidationFailures | string,
        title?: string,
        modalType?: 'error' | 'warning'
    ) => {
        setErrorState(prev => ({
            ...prev,
            summary,
            details,
            title: title || 'Deck Validation Error',
            modalType: modalType || 'error',
            modalOpen: false,
        }));
    }, []);

    const clearErrorsFunc = useCallback(() => {
        setErrorState({
            summary: null,
            details: undefined,
            title: 'Deck Validation Error',
            modalType: 'error',
            isJsonDeck: false,
            modalOpen: false,
        });
    }, []);

    const setIsJsonDeck = useCallback((isJson: boolean) => {
        setErrorState(prev => ({ ...prev, isJsonDeck: isJson }));
    }, []);

    const setModalOpen = useCallback((open: boolean) => {
        setErrorState(prev => ({ ...prev, modalOpen: open }));
    }, []);

    return {
        errorState,
        setError,
        clearErrorsFunc,
        setIsJsonDeck,
        setModalOpen,
    };
};