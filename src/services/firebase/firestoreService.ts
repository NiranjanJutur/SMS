import * as LocalService from '../local/localDataService';
// NOTE: Firebase import removed to prevent crash in React Native.
// The Firebase JS SDK uses browser APIs (indexedDB, etc.) that don't exist in RN.
// To re-enable Firebase, use @react-native-firebase instead of the web SDK.

// TOGGLE: Change this to 'FIREBASE' once you have connected your keys
const DATA_MODE: 'LOCAL' | 'FIREBASE' = 'LOCAL';
// ^ Set a logical default. Keeping local by default to ensure app keeps working.

export const {
    getProducts,
    addProduct,
    updateStock,
    getCustomers,
    addCustomer,
    updateCustomerBalance,
    addTransaction,
    getTransactions,
} = LocalService;

// Additional exports for non-overlapping methods
export const getCustomer = LocalService.getCustomer;
export const getCustomerTransactions = LocalService.getCustomerTransactions;
export const updateProduct = LocalService.updateProduct;
