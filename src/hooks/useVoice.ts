import { useState } from 'react';
import { parseCommandAI } from '../services/ai/geminiService';

// Mock service for Voice-to-Text parsing
export const useVoice = () => {
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');

    const startListening = async (): Promise<string> => {
        setIsListening(true);
        // Simulate speech recognition
        return new Promise((resolve) => {
            setTimeout(() => {
                setIsListening(false);
                const text = 'Add 2 kg Basmati Rice';
                setRecognizedText(text);
                resolve(text);
            }, 2000);
        });
    };

    const stopListening = () => {
        setIsListening(false);
    };

    const parseCommand = async (text: string) => {
        const aiResult = await parseCommandAI(text);
        if (aiResult) { return aiResult; }

        // Simple mock fallback
        if (text.toLowerCase().includes('add')) {
            return {
                action: 'ADD',
                item: 'Basmati Rice',
                qty: 2,
                unit: 'kg',
            };
        }
        return null;
    };

    return {
        isListening,
        recognizedText,
        startListening,
        stopListening,
        parseCommand,
    };
};
