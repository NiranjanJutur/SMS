export type PaymentType = 'CASH' | 'UPI' | 'CARD' | 'UDHAAR' | 'SPLIT';
export type OrderType = 'in_store' | 'takeaway' | 'delivery' | 'wholesale';

export interface TransactionItem {
    productId: string;
    name: string;
    qty: number;
    unit: string;
    price: number;
    gst: number;
    total: number;
}

export interface Transaction {
    id: string;
    billNo: string;
    items: TransactionItem[];
    subtotal: number;
    totalGST: number;
    grandTotal: number;
    paymentType: PaymentType;
    paymentSplit?: { cash: number; upi: number; card: number; udhaar: number };
    customerId?: string;
    customerName?: string;
    cashierId: string;
    cashierName?: string;
    orderType?: OrderType;
    deliveryAddress?: string;
    billPdfUrl?: string;
    timestamp: string;
    isReturn: boolean;
}
