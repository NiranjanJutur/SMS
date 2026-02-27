export const ROLES = {
  OWNER: 'OWNER',
  CASHIER: 'CASHIER',
  STOCK_MANAGER: 'STOCK_MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
};

export const CUSTOMER_TYPES = {
  HOUSE_FAMILY: {
    label: 'House / Family',
    pricing: 1.0,
    creditLimit: 2000,
    icon: '🏠',
  },
  SMALL_RETAILER: {
    label: 'Small Shop / Retailer',
    pricing: 0.9,
    creditLimit: 5000,
    icon: '🏪',
  },
  HOTEL_RESTAURANT: {
    label: 'Hotel / Restaurant',
    pricing: 0.88,
    creditLimit: 10000,
    icon: '🍽️',
  },
  FUNCTION_EVENT: {
    label: 'Function / Event',
    pricing: 0.92,
    creditLimit: 15000,
    icon: '🎉',
  },
  WHOLESALE_BUYER: {
    label: 'Wholesale Buyer',
    pricing: 0.8,
    creditLimit: 25000,
    icon: '📦',
  },
  VIP_REGULAR: {
    label: 'Regular VIP',
    pricing: 1.0,
    creditLimit: 5000,
    icon: '⭐',
  },
};

export const GST_SLABS = [0, 5, 12, 18, 28];

export const PAYMENT_MODES = {
  CASH: 'CASH',
  UPI: 'UPI',
  CARD: 'CARD',
  UDHAAR: 'UDHAAR',
};
