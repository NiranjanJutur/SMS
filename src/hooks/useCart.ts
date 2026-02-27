import { useState, useEffect } from 'react';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';
import { calculateCartTotals } from '../utils/billingUtils';
import { addTransaction, updateStock, updateCustomerBalance } from '../services/firebase/firestoreService';
import { generateGSTBillPDF } from '../services/pdf/pdfService';
import { sendWhatsAppBill } from '../services/whatsapp/whatsappService';

export interface CartItem {
    product: Product;
    quantity: number;
}

export const useCart = (currentUserId: string) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [billNo] = useState(() => `#${Date.now().toString().slice(-4)}`);

    const addItem = (product: Product, qty = 1) => {
        setItems(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                return prev.map(i =>
                    i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i,
                );
            }
            return [...prev, { product, quantity: qty }];
        });
    };

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(i => i.product.id !== productId));
    };

    const updateQty = (productId: string, qty: number) => {
        if (qty <= 0) {
            removeItem(productId);
            return;
        }
        setItems(prev =>
            prev.map(i => (i.product.id === productId ? { ...i, quantity: qty } : i)),
        );
    };

    const clearCart = () => {
        setItems([]);
        setCustomer(null);
    };

    const checkout = async (paymentType: string) => {
        const customerType = customer?.type ?? 'house';
        const totals = calculateCartTotals(items, customerType);

        const txnItems = items.map(i => ({
            productId: i.product.id,
            name: i.product.name,
            qty: i.quantity,
            unit: i.product.unit,
            price: i.product.price,
            gst: i.product.gstPercent,
            total: i.product.price * i.quantity,
        }));

        const txn = {
            billNo,
            items: txnItems,
            subtotal: totals.subtotal,
            totalGST: totals.totalGst,
            grandTotal: totals.grandTotal,
            paymentType: paymentType as any,
            customerId: customer?.id,
            cashierId: currentUserId,
            timestamp: new Date().toISOString(),
            isReturn: false,
        };

        const txnId = await addTransaction(txn);

        // Update stock
        for (const item of items) {
            const newStock = item.product.currentStock - item.quantity;
            await updateStock(item.product.id, newStock);
        }

        // Update udhaar balance if credit sale
        if (paymentType === 'UDHAAR' && customer?.id) {
            await updateCustomerBalance(customer.id, totals.grandTotal);
        }

        // Generate and send PDF
        const pdfUrl = await generateGSTBillPDF({ ...txn, id: txnId });
        if (customer?.whatsappNumber) {
            await sendWhatsAppBill(customer.whatsappNumber, billNo, pdfUrl as string);
        }

        clearCart();
        return { txnId, pdfUrl };
    };

    const totals = calculateCartTotals(items, customer?.type ?? 'house');

    return { items, customer, setCustomer, addItem, removeItem, updateQty, clearCart, checkout, totals, billNo };
};
