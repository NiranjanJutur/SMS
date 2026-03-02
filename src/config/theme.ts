// COLORS - Brand palette
export const COLORS = {
    PRIMARY: '#C0602A',
    SECONDARY: '#E8941A',
    SUCCESS: '#4CAF7D',
    BACKGROUND: '#FDF6EC',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    ERROR: '#C0392B',
    WARNING: '#F39C12',
    INFO: '#2980B9',
    TEXT_HEADING: '#4A2C17',
    TEXT_BODY: '#2C3E50',
    TEXT_DIM: '#7F8C8D',
    BORDER: '#DCDCDC',
};

// TYPOGRAPHY - Safe system fonts only (no custom fonts required)
// To add custom fonts later: https://reactnative.dev/docs/fonts
export const TYPOGRAPHY = {
    HEADING: 'serif' as const,
    BODY: 'sans-serif' as const,
    BODY_BOLD: 'sans-serif-medium' as const,
    MONO: 'monospace' as const,
};

export const SPACING = {
    XS: 4,
    SM: 8,
    MD: 12,
    BASE: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
};

export const RADIUS = {
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16,
    XXL: 24,
    CIRCLE: 9999,
};
