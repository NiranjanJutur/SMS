export interface Product {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    price: number;
    gstPercent: 0 | 5 | 12 | 18 | 28;
    currentStock: number;
    minThreshold: number;
    unit: string;
    packSize?: number;         // how many base-unit items are in 1 container (e.g. 12 pcs/box, 25 kg/bag)
    supplierId: string;
    supplierPhone: string;
    purchasePrice: number;
    competitorPriceNote?: string;
    isWeightBased: boolean;
    expiryDate?: string;
    isActive: boolean;
}
