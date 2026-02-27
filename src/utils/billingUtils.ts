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

/**
 * Calculates the total for a single cart item.
 * Handles unit normalization (e.g. 500g on a kg-priced product → 0.5 × price)
 */
export const calculateItemTotal = (
    product: Product,
    quantity: number,
    customerType: CustomerType,
    inputUnit?: string,
) => {
    // Normalize quantity to product's base unit to prevent 1000x pricing errors
    const unit = inputUnit ?? product.unit;
    const { normalizedQty } = normalizeQuantity(quantity, unit, product.unit);

    const basePrice = product.price;
    const key = CUSTOMER_TYPE_MAP[customerType];
    const discountFactor = key ? CUSTOMER_TYPES[key].pricing : 1.0;
    const discountedPrice = basePrice * discountFactor;
    const gstAmount = (discountedPrice * product.gstPercent) / 100;
    const unitPriceWithGst = discountedPrice + gstAmount;

    return {
        normalizedQty,
        discountedPrice,
        gstAmount,
        unitPriceWithGst,
        totalPrice: unitPriceWithGst * normalizedQty,
    };
};

/**
 * Calculates totals for the entire cart.
 */
export const calculateCartTotals = (
    items: { product: Product; quantity: number }[],
    customerType: CustomerType,
) => {
    let subtotal = 0;
    let totalGst = 0;
    let grandTotal = 0;

    items.forEach(item => {
        const { normalizedQty, discountedPrice, gstAmount } = calculateItemTotal(
            item.product,
            item.quantity,
            customerType,
        );
        subtotal += discountedPrice * normalizedQty;
        totalGst += gstAmount * normalizedQty;
        grandTotal += (discountedPrice + gstAmount) * normalizedQty;
    });

    return { subtotal, totalGst, grandTotal };
};

export const formatCurrency = (amount: number): string => {
    return `\u20b9${amount.toFixed(2)}`;
};
