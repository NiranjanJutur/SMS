import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEYS } from '../../config/api_keys';
import { Product } from '../../models/Product';
import { SlipOCRResult } from '../../models/Slip';

const genAI = new GoogleGenerativeAI(API_KEYS.GEMINI_API_KEY);

/**
 * Recognizes a product from an image URI (Base64 or File)
 */
export const recognizeProduct = async (imageBase64: string): Promise<Partial<Product> | null> => {
    if (API_KEYS.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        console.warn('Gemini API Key missing. Returning mock result.');
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });
        const prompt = `Identify this grocery product. Return JSON with name, category, price_est, and unit.
        Format: {"name": "Product Name", "category": "Category", "price": 0, "unit": "kg/pcs"}`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }
        ]);

        const text = result.response.text();
        return JSON.parse(text);
    } catch (error) {
        console.error('Gemini Product Recognition Error:', error);
    }
    return null;
};

/**
 * Extracts a grocery list from an image of a handwritten slip
 */
export const extractSlipData = async (imageBase64: string): Promise<SlipOCRResult | null> => {
    if (API_KEYS.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        console.warn('Gemini API Key missing.');
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });
        const prompt = `Transcribe this handwritten grocery list into structured JSON. 
        Extract customer name, phone, and items with quantities.
        Format: {"name": "Customer Name", "phone": "Phone", "items": [{"name": "Item", "qty": 0}]}`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }
        ]);

        const text = result.response.text();
        return JSON.parse(text);
    } catch (error) {
        console.error('Gemini Slip Extraction Error:', error);
    }
    return null;
};

/**
 * Parses a voice/text command into a structured action
 */
export const parseCommandAI = async (command: string): Promise<any | null> => {
    if (API_KEYS.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });
        const prompt = `Convert this voice command into a structured JSON for a grocery app.
        Example: "Add 2kg rice" -> {"action": "ADD", "item": "Rice", "qty": 2, "unit": "kg"}
        Example: "Restock 50 packets of milk" -> {"action": "RESTOCK", "item": "Milk", "qty": 50, "unit": "pcs"}
        Command: "${command}"`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text);
    } catch (error) {
        console.error('Gemini Command Parsing Error:', error);
    }
    return null;
};
