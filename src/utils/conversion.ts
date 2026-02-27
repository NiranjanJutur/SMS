/**
 * Unit conversion utility for grocery products.
 * Standardizes units to a base for accurate price calculation.
 */

export type WeightUnit = 'kg' | 'g' | 'pcs' | 'packets';

interface ConversionRule {
    base: WeightUnit;
    factor: number; // Factor to convert unit TO base (e.g., g -> kg is 0.001)
}

const CONVERSION_TABLE: Record<string, ConversionRule> = {
    'g': { base: 'kg', factor: 0.001 },
    'gram': { base: 'kg', factor: 0.001 },
    'grams': { base: 'kg', factor: 0.001 },
    'kg': { base: 'kg', factor: 1 },
    'kilogram': { base: 'kg', factor: 1 },
    'pcs': { base: 'pcs', factor: 1 },
    'piece': { base: 'pcs', factor: 1 },
    'pieces': { base: 'pcs', factor: 1 },
    'packets': { base: 'pcs', factor: 1 },
    'pkt': { base: 'pcs', factor: 1 },
};

/**
 * Normalizes quantity based on unit.
 * Example: (500, 'g') -> returns 0.5 (kg)
 */
export const normalizeQuantity = (qty: number, unit: string): { normalizedQty: number, baseUnit: string } => {
    const normalizedUnit = unit.toLowerCase().trim();
    const rule = CONVERSION_TABLE[normalizedUnit];

    if (!rule) {
        return { normalizedQty: qty, baseUnit: unit };
    }

    return {
        normalizedQty: qty * rule.factor,
        baseUnit: rule.base
    };
};
