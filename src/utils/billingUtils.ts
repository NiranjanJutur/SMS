import { Product } from '../models/Product';
import { CustomerType } from '../models/Customer';
import { CUSTOMER_TYPES } from '../config/constants';
import { normalizeQuantity } from './conversion';

type CustomerTypesKey = keyof typeof CUSTOMER_TYPES;

const CUSTOMER_TYPE_MAP: Record<string, CustomerTypesKey> = {
    house: 'HOUSE_FAMILY',
    small_shop: 'SMALL_RETAILER',
    hotel: 'HOTEL_RESTAURANT',
    function: 'FUNCTION_EVENT',
    wholesale: 'WHOLESALE_BUYER',
    vip: 'VIP_REGULAR',
};

export const calculateItemTotal = (product: Product, quantity: number, customerType: CustomerType) => {
    const { normalizedQty } = normalizeQuantity(quantity, product.unit);
    const basePrice = product.price;
    const key = CUSTOMER_TYPE_MAP[customerType];
    const discountFactor = key ? CUSTOMER_TYPES[key].pricing : 1.0;
    const discountedPrice = basePrice * discountFactor;

    const gstAmount = (discountedPrice * product.gstPercent) / 100;
    const totalPrice = discountedPrice + gstAmount;

    return {
        discountedPrice,
        gstAmount,
        totalPrice: totalPrice * quantity,
        unitPriceWithGst: totalPrice
    };
};

export const calculateCartTotals = (items: { product: Product, quantity: number }[], customerType: CustomerType) => {
    let subtotal = 0;
    let totalGst = 0;
    let grandTotal = 0;

    items.forEach(item => {
        const { discountedPrice, gstAmount } = calculateItemTotal(item.product, item.quantity, customerType);
        subtotal += discountedPrice * item.quantity;
        totalGst += gstAmount * item.quantity;
        grandTotal += (discountedPrice + gstAmount) * item.quantity;
    });

    return {
        subtotal,
        totalGst,
        grandTotal
    };
};

export const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
};
