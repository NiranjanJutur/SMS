export type CustomerType = 'house' | 'small_shop' | 'hotel' | 'function' | 'wholesale' | 'vip';

export interface Customer {
    id: string;
    udhaarId: string;
    name: string;
    phone: string;
    houseNo?: string;
    type: CustomerType;
    creditLimit: number;
    totalOutstanding: number;
    whatsappNumber: string;
    firstPurchaseDate: string;
    slipImages: string[];
    notes?: string;
    isActive: boolean;
}
