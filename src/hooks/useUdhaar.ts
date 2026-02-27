import { useState, useEffect } from 'react';
import { getCustomers, getCustomerTransactions } from '../services/firebase/firestoreService';
import { Customer } from '../models/Customer';
import { Transaction } from '../models/Transaction';

export const useUdhaar = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        const data = await getCustomers();
        setCustomers(data.filter(c => c.totalOutstanding > 0));
        setLoading(false);
    };

    const totalOutstanding = customers.reduce((sum, c) => sum + c.totalOutstanding, 0);
    const topDebtors = [...customers].sort((a, b) => b.totalOutstanding - a.totalOutstanding).slice(0, 5);

    return { customers, loading, totalOutstanding, topDebtors, refresh: fetchCustomers };
};
