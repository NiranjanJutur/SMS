import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    query,
    orderBy,
    limit,
    Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { Product } from '../../models/Product';
import { Customer } from '../../models/Customer';
import { Transaction } from '../../models/Transaction';

const KEYS = {
    PRODUCTS: 'products',
    CUSTOMERS: 'customers',
    TRANSACTIONS: 'transactions',
};

export const getProducts = async (): Promise<Product[]> => {
    const colRef = collection(db, KEYS.PRODUCTS);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
    const colRef = collection(db, KEYS.PRODUCTS);
    const docRef = await addDoc(colRef, product);
    return docRef.id;
};

export const updateStock = async (productId: string, newStock: number): Promise<void> => {
    const docRef = doc(db, KEYS.PRODUCTS, productId);
    await updateDoc(docRef, { currentStock: newStock });
};

export const getCustomers = async (): Promise<Customer[]> => {
    const colRef = collection(db, KEYS.CUSTOMERS);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
};

export const addCustomer = async (customer: Omit<Customer, 'id'>): Promise<string> => {
    const colRef = collection(db, KEYS.CUSTOMERS);
    const docRef = await addDoc(colRef, customer);
    return docRef.id;
};

export const updateCustomerBalance = async (customerId: string, amount: number): Promise<void> => {
    const docRef = doc(db, KEYS.CUSTOMERS, customerId);
    // Note: In real app, use increment() for atomic updates
    // For now keeping it simple
    await updateDoc(docRef, { balance: amount });
}

export const addTransaction = async (txn: Omit<Transaction, 'id'>): Promise<string> => {
    const colRef = collection(db, KEYS.TRANSACTIONS);
    const docRef = await addDoc(colRef, {
        ...txn,
        timestamp: Timestamp.fromDate(new Date(txn.timestamp))
    });
    return docRef.id;
};

export const getTransactions = async (): Promise<Transaction[]> => {
    const colRef = collection(db, KEYS.TRANSACTIONS);
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate().toISOString()
    } as Transaction));
};
