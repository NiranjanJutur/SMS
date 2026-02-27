import { useState } from 'react';
import { Product } from '../../models/Product';
import { recognizeProduct } from './geminiService';

// Service for Gemini Vision integration
export const useScanner = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState<Product | null>(null);

    const scanProduct = async (imageBase64: string): Promise<Product | null> => {
        setIsScanning(true);
        try {
            const result = await recognizeProduct(imageBase64);

            if (result) {
                const mockBase: Product = {
                    id: `ai-${Date.now()}`,
                    name: result.name || 'Unknown Product',
                    category: result.category || 'Other',
                    price: result.price || 0,
                    gstPercent: 5,
                    currentStock: 0,
                    minThreshold: 5,
                    unit: result.unit || 'pcs',
                    imageUrl: '',
                    supplierId: '',
                    supplierPhone: '',
                    purchasePrice: (result.price || 0) * 0.8,
                    isWeightBased: result.unit === 'kg' || result.unit === 'gm',
                    isActive: true
                };
                setLastResult(mockBase);
                return mockBase;
            }

            // Fallback to mock for testing if no AI result
            const fallback: Product = {
                id: 'mock-1',
                name: 'Basmati Rice (AI Demo)',
                category: 'Grains',
                price: 150,
                gstPercent: 5,
                currentStock: 50,
                minThreshold: 10,
                unit: 'kg',
                imageUrl: '',
                supplierId: '',
                supplierPhone: '',
                purchasePrice: 120,
                isWeightBased: true,
                isActive: true
            };
            setLastResult(fallback);
            return fallback;
        } finally {
            setIsScanning(false);
        }
    };

    return {
        scanProduct,
        isScanning,
        lastResult
    };
};
