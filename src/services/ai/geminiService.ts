import { Product } from '../../models/Product';
import { SlipOCRResult } from '../../models/Slip';

const GEMINI_API_KEY = 'AIzaSyB0ZeFaq3-1dhw2ALuyq1XojZ1bvdRscgA';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const callGemini = async (parts: object[], responseSchema: object): Promise<any> => {
    const body = {
        contents: [{ parts }],
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema,
        },
    };
    const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    if (!text) { return null; }
    return JSON.parse(text);
};

// Schema: recognizeProduct
const PRODUCT_SCHEMA = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        category: { type: 'string' },
        price: { type: 'number' },
        unit: { type: 'string' },
    },
    required: ['name', 'category', 'price', 'unit'],
};

// Schema: extractSlipData
const SLIP_SCHEMA = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    qty: { type: 'number' },
                },
                required: ['name', 'qty'],
            },
        },
    },
    required: ['name', 'items'],
};

// Schema: parseCommandAI
const COMMAND_SCHEMA = {
    type: 'object',
    properties: {
        action: { type: 'string', enum: ['ADD', 'RESTOCK', 'REMOVE'] },
        item: { type: 'string' },
        qty: { type: 'number' },
        unit: { type: 'string' },
    },
    required: ['action', 'item', 'qty', 'unit'],
};

export const recognizeProduct = async (imageBase64: string): Promise<Partial<Product> | null> => {
    try {
        return await callGemini(
            [
                { text: 'Identify this grocery product and return structured data.' },
                { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
            ],
            PRODUCT_SCHEMA,
        );
    } catch (e) {
        console.error('recognizeProduct error:', e);
        return null;
    }
};

export const extractSlipData = async (imageBase64: string): Promise<SlipOCRResult | null> => {
    try {
        return await callGemini(
            [
                { text: 'Transcribe this handwritten grocery list into structured data.' },
                { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
            ],
            SLIP_SCHEMA,
        );
    } catch (e) {
        console.error('extractSlipData error:', e);
        return null;
    }
};

export const parseCommandAI = async (command: string): Promise<any | null> => {
    try {
        return await callGemini(
            [{ text: `Convert this voice command to a structured grocery action.\nCommand: "${command}"` }],
            COMMAND_SCHEMA,
        );
    } catch (e) {
        console.error('parseCommandAI error:', e);
        return null;
    }
};
