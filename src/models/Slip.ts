export interface SlipOCRResult {
    name?: string;
    houseNo?: string;
    phone?: string;
    items: Array<{ name: string; qty: number }>;
}

export interface Slip {
    id: string;
    imageUrl: string;
    ocrResult: SlipOCRResult;
    writtenByUserId: string;
    writtenByName: string;
    customerId?: string;
    timestamp: string;
    billId?: string;
}
