'use client';

import { useState, useRef } from 'react';

export interface DistributionEntry {
    uuid: string;
    amount: number;
}

export interface IDistributionPromptData {
    type: string;
    valueDistribution: DistributionEntry[];
}

export function useDistributionPrompt() {
    const [distributionPromptData, setDistributionPromptData] = useState<IDistributionPromptData | null>(null);
    const distributionPromptDataRef = useRef<IDistributionPromptData | null>(null);

    const setDistributionPrompt = (uuid: string, amount: number, promptData: any): void => {
        const totalAmount = promptData.amount;

        setDistributionPromptData((prevData) => {
            if (!prevData) return null;
            const targets = prevData.valueDistribution;
            const currentTotal = targets.reduce((sum, item) => sum + item.amount, 0);
            if (currentTotal + amount > totalAmount) return prevData;
    

            const newTargetData = targets.map(item =>
                item.uuid === uuid ? { ...item, amount: item.amount + amount } : item
            ).filter(item => item.amount > 0);
    
            if (!targets.some(item => item.uuid === uuid) && amount > 0) {
                newTargetData.push({ uuid, amount });
            }

            const updatedStateData = { ...prevData, valueDistribution: newTargetData }
            distributionPromptDataRef.current = updatedStateData;
    
            return updatedStateData;
        });
    }

    const initDistributionPrompt = (promptData: any) => {
        if (distributionPromptDataRef.current) {
            setDistributionPromptData(distributionPromptDataRef.current);
        } else {
            setDistributionPromptData({ type: promptData.type, valueDistribution: [] });
        }
    }

    const clearDistributionPrompt = () => {
        setDistributionPromptData(null);
        distributionPromptDataRef.current = null;
    }

    return { distributionPromptData, setDistributionPrompt, clearDistributionPrompt, initDistributionPrompt };
}
