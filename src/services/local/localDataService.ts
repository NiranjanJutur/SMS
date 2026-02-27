import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../../models/Product';
import { Customer, CustomerType } from '../../models/Customer';
import { Transaction } from '../../models/Transaction';

const KEYS = {
    PRODUCTS: '@familyos_products',
    CUSTOMERS: '@familyos_customers',
    TRANSACTIONS: '@familyos_transactions',
    SEEDED: '@familyos_seeded',
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_PRODUCTS: Product[] = [
    { id: 'p1', name: 'Basmati Rice', category: 'Grains', price: 150, gstPercent: 5, currentStock: 50, minThreshold: 10, unit: 'kg', imageUrl: '', supplierId: 'sup-1', supplierPhone: '9876543210', purchasePrice: 120, isWeightBased: true, isActive: true },
    { id: 'p2', name: 'Toor Dal', category: 'Pulses', price: 130, gstPercent: 5, currentStock: 30, minThreshold: 8, unit: 'kg', imageUrl: '', supplierId: 'sup-1', supplierPhone: '9876543210', purchasePrice: 100, isWeightBased: true, isActive: true },
    { id: 'p3', name: 'Amul Butter', category: 'Dairy', price: 56, gstPercent: 12, currentStock: 25, minThreshold: 5, unit: 'pcs', imageUrl: '', supplierId: 'sup-2', supplierPhone: '9876543211', purchasePrice: 48, isWeightBased: false, isActive: true },
    { id: 'p4', name: 'Aashirvaad Atta', category: 'Grains', price: 320, gstPercent: 5, currentStock: 15, minThreshold: 5, unit: 'bag', imageUrl: '', supplierId: 'sup-1', supplierPhone: '9876543210', purchasePrice: 280, isWeightBased: false, isActive: true },
    { id: 'p5', name: 'Sugar', category: 'Essentials', price: 45, gstPercent: 5, currentStock: 40, minThreshold: 10, unit: 'kg', imageUrl: '', supplierId: 'sup-3', supplierPhone: '9876543212', purchasePrice: 38, isWeightBased: true, isActive: true },
    { id: 'p6', name: 'Sunflower Oil', category: 'Oils', price: 180, gstPercent: 5, currentStock: 3, minThreshold: 5, unit: 'ltr', imageUrl: '', supplierId: 'sup-3', supplierPhone: '9876543212', purchasePrice: 155, isWeightBased: false, isActive: true },
    { id: 'p7', name: 'Red Chilli Powder', category: 'Spices', price: 220, gstPercent: 12, currentStock: 12, minThreshold: 3, unit: 'kg', imageUrl: '', supplierId: 'sup-4', supplierPhone: '9876543213', purchasePrice: 180, isWeightBased: true, isActive: true },
    { id: 'p8', name: 'Maggi Noodles', category: 'Snacks', price: 14, gstPercent: 18, currentStock: 100, minThreshold: 20, unit: 'pcs', imageUrl: '', supplierId: 'sup-5', supplierPhone: '9876543214', purchasePrice: 11, isWeightBased: false, isActive: true },
    { id: 'p9', name: 'Parle-G Biscuit', category: 'Snacks', price: 10, gstPercent: 18, currentStock: 2, minThreshold: 15, unit: 'pcs', imageUrl: '', supplierId: 'sup-5', supplierPhone: '9876543214', purchasePrice: 8, isWeightBased: false, isActive: true },
    { id: 'p10', name: 'Haldi Powder', category: 'Spices', price: 200, gstPercent: 5, currentStock: 8, minThreshold: 3, unit: 'kg', imageUrl: '', supplierId: 'sup-4', supplierPhone: '9876543213', purchasePrice: 160, isWeightBased: true, isActive: true },
];

const SEED_CUSTOMERS: Customer[] = [
    { id: 'c1', udhaarId: 'UDH-001', name: 'Rajesh Kumar', phone: '9001234567', houseNo: 'H-12', type: 'house', creditLimit: 2000, totalOutstanding: 450, whatsappNumber: '919001234567', firstPurchaseDate: '2025-01-15', slipImages: [], isActive: true },
    { id: 'c2', udhaarId: 'UDH-002', name: 'Priya Sharma', phone: '9001234568', houseNo: 'H-45', type: 'house', creditLimit: 2000, totalOutstanding: 0, whatsappNumber: '919001234568', firstPurchaseDate: '2025-02-10', slipImages: [], isActive: true },
    { id: 'c3', udhaarId: 'UDH-003', name: 'Sai Krishna Store', phone: '9001234569', type: 'small_shop', creditLimit: 5000, totalOutstanding: 1200, whatsappNumber: '919001234569', firstPurchaseDate: '2025-01-01', slipImages: [], isActive: true },
    { id: 'c4', udhaarId: 'UDH-004', name: 'Hotel Spice Garden', phone: '9001234570', type: 'hotel', creditLimit: 10000, totalOutstanding: 3500, whatsappNumber: '919001234570', firstPurchaseDate: '2024-12-01', slipImages: [], isActive: true },
    { id: 'c5', udhaarId: 'UDH-005', name: 'Meena Devi', phone: '9001234571', houseNo: 'H-78', type: 'vip', creditLimit: 5000, totalOutstanding: 200, whatsappNumber: '919001234571', firstPurchaseDate: '2024-11-20', slipImages: [], isActive: true },
];

const SEED_TRANSACTIONS: Transaction[] = [
    {
        id: 't1', billNo: '#9001',
        items: [
            { productId: 'p1', name: 'Basmati Rice', qty: 2, unit: 'kg', price: 150, gst: 5, total: 300 },
            { productId: 'p5', name: 'Sugar', qty: 1, unit: 'kg', price: 45, gst: 5, total: 45 },
        ],
        subtotal: 345, totalGST: 17.25, grandTotal: 362.25,
        paymentType: 'CASH', customerId: 'c1', cashierId: 'cashier-1',
        timestamp: new Date().toISOString(), isReturn: false,
    },
    {
        id: 't2', billNo: '#9002',
        items: [
            { productId: 'p3', name: 'Amul Butter', qty: 3, unit: 'pcs', price: 56, gst: 12, total: 168 },
        ],
        subtotal: 168, totalGST: 20.16, grandTotal: 188.16,
        paymentType: 'UPI', customerId: 'c2', cashierId: 'cashier-1',
        timestamp: new Date().toISOString(), isReturn: false,
    },
    {
        id: 't3', billNo: '#9003',
        items: [
            { productId: 'p4', name: 'Aashirvaad Atta', qty: 5, unit: 'bag', price: 320, gst: 5, total: 1600 },
            { productId: 'p6', name: 'Sunflower Oil', qty: 3, unit: 'ltr', price: 180, gst: 5, total: 540 },
        ],
        subtotal: 2140, totalGST: 107, grandTotal: 2247,
        paymentType: 'UDHAAR', customerId: 'c4', cashierId: 'cashier-1',
        timestamp: new Date().toISOString(), isReturn: false,
    },
];

// ─── Init / Seed ──────────────────────────────────────────────────────────────

export const seedDataIfNeeded = async (): Promise<void> => {
    const seeded = await AsyncStorage.getItem(KEYS.SEEDED);
    if (seeded) return;

    await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    await AsyncStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(SEED_TRANSACTIONS));
    await AsyncStorage.setItem(KEYS.SEEDED, 'true');
};

// ─── Generic helpers ──────────────────────────────────────────────────────────

const getAll = async <T>(key: string): Promise<T[]> => {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
};

const saveAll = async <T>(key: string, data: T[]): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
};

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Products ─────────────────────────────────────────────────────────────────

export const getProducts = async (): Promise<Product[]> => {
    await seedDataIfNeeded();
    return getAll<Product>(KEYS.PRODUCTS);
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
    const products = await getAll<Product>(KEYS.PRODUCTS);
    const id = genId();
    products.push({ ...product, id } as Product);
    await saveAll(KEYS.PRODUCTS, products);
    return id;
};

export const updateProduct = async (id: string, data: Partial<Product>): Promise<void> => {
    const products = await getAll<Product>(KEYS.PRODUCTS);
    const idx = products.findIndex(p => p.id === id);
    if (idx >= 0) {
        products[idx] = { ...products[idx], ...data };
        await saveAll(KEYS.PRODUCTS, products);
    }
};

export const updateStock = async (id: string, newStock: number): Promise<void> => {
    await updateProduct(id, { currentStock: newStock });
};

export const deleteProduct = async (id: string): Promise<void> => {
    const products = await getAll<Product>(KEYS.PRODUCTS);
    await saveAll(KEYS.PRODUCTS, products.filter(p => p.id !== id));
};

// ─── Customers ────────────────────────────────────────────────────────────────

export const getCustomers = async (): Promise<Customer[]> => {
    await seedDataIfNeeded();
    return getAll<Customer>(KEYS.CUSTOMERS);
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
    const customers = await getAll<Customer>(KEYS.CUSTOMERS);
    return customers.find(c => c.id === id) || null;
};

export const addCustomer = async (customer: Omit<Customer, 'id'>): Promise<string> => {
    const customers = await getAll<Customer>(KEYS.CUSTOMERS);
    const id = genId();
    customers.push({ ...customer, id } as Customer);
    await saveAll(KEYS.CUSTOMERS, customers);
    return id;
};

export const updateCustomerBalance = async (customerId: string, amountDelta: number): Promise<void> => {
    const customers = await getAll<Customer>(KEYS.CUSTOMERS);
    const idx = customers.findIndex(c => c.id === customerId);
    if (idx >= 0) {
        customers[idx].totalOutstanding += amountDelta;
        await saveAll(KEYS.CUSTOMERS, customers);
    }
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const addTransaction = async (txn: Omit<Transaction, 'id'>): Promise<string> => {
    const transactions = await getAll<Transaction>(KEYS.TRANSACTIONS);
    const id = genId();
    transactions.unshift({ ...txn, id } as Transaction);
    await saveAll(KEYS.TRANSACTIONS, transactions);
    return id;
};

export const getTransactions = async (limit = 50): Promise<Transaction[]> => {
    await seedDataIfNeeded();
    const txns = await getAll<Transaction>(KEYS.TRANSACTIONS);
    return txns.slice(0, limit);
};

export const getCustomerTransactions = async (customerId: string): Promise<Transaction[]> => {
    const txns = await getAll<Transaction>(KEYS.TRANSACTIONS);
    return txns.filter(t => t.customerId === customerId);
};
