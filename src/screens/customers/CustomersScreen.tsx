import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../config/theme';
import { getCustomers, getCustomerTransactions } from '../../services/firebase/firestoreService';
import { Customer } from '../../models/Customer';
import { formatCurrency } from '../../utils/billingUtils';
import AddCustomerModal from '../../components/AddCustomerModal';

const TYPE_COLORS: Record<string, string> = {
    house: COLORS.SUCCESS,
    small_shop: COLORS.SECONDARY,
    hotel: COLORS.PRIMARY,
    function: '#9B59B6',
    wholesale: '#2980B9',
    vip: '#F39C12',
};

const CustomerCard = ({ customer, onPress }: { customer: Customer; onPress: () => void }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
        <View style={styles.cardLeft}>
            <View style={[styles.avatar, { backgroundColor: TYPE_COLORS[customer.type] || COLORS.PRIMARY }]}>
                <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerId}>📒 {customer.udhaarId}</Text>
                <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[customer.type] + '22' }]}>
                    <Text style={[styles.typeText, { color: TYPE_COLORS[customer.type] }]}>
                        {customer.type.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            </View>
        </View>
        <View style={styles.cardRight}>
            <Text style={styles.balanceLabel}>Outstanding</Text>
            <Text style={[styles.balance, customer.totalOutstanding > 0 ? styles.balanceRed : styles.balanceGreen]}>
                {formatCurrency(customer.totalOutstanding)}
            </Text>
        </View>
    </TouchableOpacity>
);

const CustomersScreen = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filtered, setFiltered] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const loadCustomers = useCallback(async () => {
        const data = await getCustomers();
        setCustomers(data);
        setFiltered(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadCustomers(); }, [loadCustomers]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(customers.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.udhaarId.toLowerCase().includes(q) ||
            c.phone.includes(q),
        ));
    }, [search, customers]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadCustomers();
        setRefreshing(false);
    };

    const showCustomerDetail = async (customer: Customer) => {
        const txns = await getCustomerTransactions(customer.id);
        const txnSummary = txns.length > 0
            ? txns.slice(0, 3).map(t => `• ${t.billNo}: ${formatCurrency(t.grandTotal)} (${t.paymentType})`).join('\n')
            : 'No transactions yet';

        Alert.alert(
            customer.name,
            `📒 ${customer.udhaarId}\n📱 ${customer.phone}\n🏷️ ${customer.type.replace('_', ' ')} · Credit: ${formatCurrency(customer.creditLimit)}\n💰 Outstanding: ${formatCurrency(customer.totalOutstanding)}\n\n── Recent Transactions ──\n${txnSummary}`,
            [{ text: 'Close', style: 'cancel' }],
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>Loading customers...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Customers</Text>
                    <Text style={styles.subtitle}>{customers.length} total</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addBtnText}>＋ Add</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search name, phone, Udhaar ID..."
                    placeholderTextColor={COLORS.TEXT_DIM}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <CustomerCard customer={item} onPress={() => showCustomerDetail(item)} />
                )}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No customers found.</Text>
                    </View>
                }
            />

            <AddCustomerModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdded={loadCustomers}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.XL },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: SPACING.BASE, backgroundColor: COLORS.WHITE,
        borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
    },
    title: { fontSize: 22, fontFamily: TYPOGRAPHY.HEADING, color: COLORS.TEXT_HEADING },
    subtitle: { fontSize: 13, color: COLORS.TEXT_DIM },
    addBtn: {
        backgroundColor: COLORS.PRIMARY, paddingHorizontal: SPACING.MD,
        paddingVertical: 8, borderRadius: RADIUS.MD,
    },
    addBtnText: { color: '#fff', fontFamily: TYPOGRAPHY.BODY_BOLD },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        margin: SPACING.BASE, backgroundColor: COLORS.WHITE,
        borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD,
        borderWidth: 1, borderColor: COLORS.BORDER,
    },
    searchIcon: { fontSize: 16, marginRight: SPACING.SM },
    searchInput: { flex: 1, height: 44, fontFamily: TYPOGRAPHY.BODY, color: COLORS.TEXT_BODY },
    list: { paddingHorizontal: SPACING.BASE, paddingBottom: SPACING.XL },
    card: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG,
        padding: SPACING.MD, marginBottom: SPACING.SM,
        elevation: 1,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.MD, flex: 1 },
    avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontFamily: TYPOGRAPHY.BODY_BOLD, fontSize: 18 },
    customerName: { fontSize: 16, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_HEADING },
    customerId: { fontSize: 12, color: COLORS.TEXT_DIM, fontFamily: TYPOGRAPHY.MONO },
    typeBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
    typeText: { fontSize: 10, fontFamily: TYPOGRAPHY.BODY_BOLD },
    cardRight: { alignItems: 'flex-end' },
    balanceLabel: { fontSize: 11, color: COLORS.TEXT_DIM, fontFamily: TYPOGRAPHY.BODY },
    balance: { fontSize: 16, fontFamily: TYPOGRAPHY.MONO, fontWeight: '700' },
    balanceRed: { color: COLORS.ERROR },
    balanceGreen: { color: COLORS.SUCCESS },
    loadingText: { color: COLORS.TEXT_DIM, fontFamily: TYPOGRAPHY.BODY },
    emptyText: { color: COLORS.TEXT_DIM },
});

export default CustomersScreen;
