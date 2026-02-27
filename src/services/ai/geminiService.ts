import { Product } from '../../models/Product';
import { SlipOCRResult } from '../../models/Slip';

const GEMINI_API_KEY = 'AIzaSyB0ZeFaq3-1dhw2ALuyq1XojZ1bvdRscgA';

const callGemini = async (body: object): Promise<any> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    if (!text) { return null; }
    // Strip markdown code fences if present
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
};

export const recognizeProduct = async (imageBase64: string): Promise<Partial<Product> | null> => {
    try {
        return await callGemini({
            contents: [{
                parts: [
                    { text: 'Identify this grocery product. Return ONLY JSON: {"name": "Product Name", "category": "Category", "price": 0, "unit": "kg/pcs"}' },
                    { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
                ],
            }],
        });
    } catch (e) {
        console.error('recognizeProduct error:', e);
        return null;
    }
};

export const extractSlipData = async (imageBase64: string): Promise<SlipOCRResult | null> => {
    try {
        return await callGemini({
            contents: [{
                parts: [
                    { text: 'Transcribe this handwritten grocery list. Return ONLY JSON: {"name": "Customer Name", "phone": "Phone", "items": [{"name": "Item", "qty": 0}]}' },
                    { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
                ],
            }],
        });
    } catch (e) {
        console.error('extractSlipData error:', e);
        return null;
    }
};

export const parseCommandAI = async (command: string): Promise<any | null> => {
    try {
        return await callGemini({
            contents: [{
                parts: [{
                    text: `Convert this voice command to JSON. Return ONLY JSON: {"action": "ADD", "item": "Item Name", "qty": 0, "unit": "kg"}.\nCommand: "${command}"`,
                }],
            }],
        });
    } catch (e) {
        console.error('parseCommandAI error:', e);
        return null;
    }
};
