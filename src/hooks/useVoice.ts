import { useState, useEffect, useRef } from 'react';
import { parseCommandAI } from '../services/ai/geminiService';

// Minimal interface for the parts of the Web Speech API we use
interface ISpeechRecognition {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: any) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: any) => void) | null;
    start(): void;
    stop(): void;
}

interface ISpeechRecognitionCtor {
    new(): ISpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition: ISpeechRecognitionCtor | undefined;
        webkitSpeechRecognition: ISpeechRecognitionCtor | undefined;
    }
}

export interface ParsedCommand {
    action: string;
    item: string;
    qty: number;
    unit: string;
}

export const useVoice = () => {
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [interimText, setInterimText] = useState('');
    const recognitionRef = useRef<ISpeechRecognition | null>(null);

    const hasSpeechAPI = typeof window !== 'undefined' &&
        (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined);

    const startListening = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (hasSpeechAPI) {
                const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRecognitionAPI) { reject('No API'); return; }

                const recognition = new SpeechRecognitionAPI();
                recognitionRef.current = recognition;
                recognition.lang = 'en-IN';
                recognition.continuous = false;
                recognition.interimResults = true;

                setIsListening(true);
                setInterimText('');
                setRecognizedText('');

                recognition.onresult = (event) => {
                    let interim = '';
                    let final = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            final += event.results[i][0].transcript;
                        } else {
                            interim += event.results[i][0].transcript;
                        }
                    }
                    if (interim) setInterimText(interim);
                    if (final) {
                        setRecognizedText(final);
                        setInterimText('');
                    }
                };

                recognition.onend = () => {
                    setIsListening(false);
                    const finalText = recognizedText || interimText;
                    if (finalText) {
                        resolve(finalText);
                    } else {
                        reject('No speech detected');
                    }
                };

                recognition.onerror = (e: any) => {
                    setIsListening(false);
                    reject(e.error);
                };

                recognition.start();
            } else {
                // Fallback mock for native / unsupported browsers
                setIsListening(true);
                setTimeout(() => {
                    setIsListening(false);
                    const text = 'Add 2 kg Basmati Rice';
                    setRecognizedText(text);
                    resolve(text);
                }, 2000);
            }
        });
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    const parseCommand = async (text: string): Promise<ParsedCommand | null> => {
        try {
            const aiResult = await parseCommandAI(text);
            if (aiResult) return aiResult as ParsedCommand;
        } catch { /* fall through */ }

        // Simple regex fallback: "add <qty> <unit> <item>" or "add <item>"
        const lower = text.toLowerCase().trim();
        const match = lower.match(/add\s+(\d+\.?\d*)?\s*(kg|gm|ltr|ml|pcs|dozen|bag|box|packet)?\s+(.+)/i);
        if (match) {
            return {
                action: 'ADD',
                item: match[3]?.trim() || '',
                qty: parseFloat(match[1] || '1'),
                unit: match[2] || 'pcs',
            };
        }
        if (lower.includes('add')) {
            const item = lower.replace(/^add\s+/i, '').trim();
            return { action: 'ADD', item, qty: 1, unit: 'pcs' };
        }
        return null;
    };

    return {
        isListening,
        recognizedText,
        interimText,
        hasSpeechAPI,
        startListening,
        stopListening,
        parseCommand,
    };
};
