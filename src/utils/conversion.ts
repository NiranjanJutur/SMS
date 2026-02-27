/**
 * Unit conversion utility for grocery products.
 * Standardizes input units to the product's base unit for accurate pricing.
 *
 * Example: product unit is 'kg', user enters 500 'g' → normalized = 0.5 kg
 * This prevents 1000x pricing errors when units mismatch.
 */

export type WeightUnit = 'kg' | 'g' | 'gm' | 'ltr' | 'ml' | 'pcs' | 'pkt';

interface ConversionRule {
    base: string;
    factor: number; // Multiply input qty by this to get base unit qty
}

const CONVERSION_TABLE: Record<string, ConversionRule> = {
    // Weight
    'g':         { base: 'kg', factor: 0.001 },
    'gm':        { base: 'kg', factor: 0.001 },
    'gram':      { base: 'kg', factor: 0.001 },
    'grams':     { base: 'kg', factor: 0.001 },
    'kg':        { base: 'kg', factor: 1 },
    'kilogram':  { base: 'kg', factor: 1 },
    'kilograms': { base: 'kg', factor: 1 },
    // Volume
    'ml':        { base: 'ltr', factor: 0.001 },
    'milliliter':{ base: 'ltr', factor: 0.001 },
    'ltr':       { base: 'ltr', factor: 1 },
    'litre':     { base: 'ltr', factor: 1 },
    'liter':     { base: 'ltr', factor: 1 },
    'l':         { base: 'ltr', factor: 1 },
    // Count
    'pcs':       { base: 'pcs', factor: 1 },
    'piece':     { base: 'pcs', factor: 1 },
    'pieces':    { base: 'pcs', factor: 1 },
    'pkt':       { base: 'pcs', factor: 1 },
    'packet':    { base: 'pcs', factor: 1 },
    'packets':   { base: 'pcs', factor: 1 },
    'bag':       { base: 'pcs', factor: 1 },
    'box':       { base: 'pcs', factor: 1 },
    'dozen':     { base: 'pcs', factor: 12 },
};

/**
 * Normalizes a quantity to the product's base unit.
 * @param qty - Raw quantity entered by user
 * @param inputUnit - Unit the user entered (e.g. 'g', '500g', 'grams')
 * @param productUnit - The product's stored base unit (e.g. 'kg')
 * @returns normalized quantity in product's base unit
 *
 * Example: normalizeQuantity(500, 'g', 'kg') → 0.5
 */
export const normalizeQuantity = (
    qty: number,
    inputUnit: string,
    productUnit?: string,
): { normalizedQty: number; baseUnit: string } => {
    const key = inputUnit.toLowerCase().trim();
    const rule = CONVERSION_TABLE[key];

    if (!rule) {
        return { normalizedQty: qty, baseUnit: inputUnit };
    }

    // If product base unit differs from the conversion's base, skip conversion
    // e.g. don't convert 'g' to 'kg' if product unit is 'pcs'
    if (productUnit && rule.base !== productUnit.toLowerCase()) {
        return { normalizedQty: qty, baseUnit: inputUnit };
    }

    return {
        normalizedQty: qty * rule.factor,
        baseUnit: rule.base,
    };
};
