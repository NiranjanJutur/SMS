import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import { getCustomers, getCustomerTransactions } from '../../services/firebase/firestoreService';
import { Customer } from '../../models/Customer';
import { formatCurrency } from '../../utils/billingUtils';
import AddCustomerModal from '../../components/AddCustomerModal';

const TYPE_COLORS: Record<string, string> = {
    house: COLORS.SUCCESS, small_shop: COLORS.SECONDARY, hotel: COLORS.PRIMARY,
    function: '#9B59B6', wholesale: '#2980B9', vip: '#F39C12',
};

const CustomerCard = ({ customer, onPress }: { customer: Customer; onPress: () => void }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
        <View style={styles.cardLeft}>
            <View style={[styles.avatar, { backgroundColor: TYPE_COLORS[customer.type] || COLORS.PRIMARY }]}>
                <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerId}>\uD83D\uDCD2 {customer.udhaarId}</Text>
                <View style={[styles.typeBadge, { backgroundColor: (TYPE_COLORS[customer.type] || COLORS.PRIMARY) + '22' }]}>
                    <Text style={[styles.typeText, { color: TYPE_COLORS[customer.type] || COLORS.PRIMARY }]}>
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
        setCustomers(data); setFiltered(data); setLoading(false);
    }, []);

    useEffect(() => { loadCustomers(); }, [loadCustomers]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(customers.filter(c => c.name.toLowerCase().includes(q) || c.udhaarId.toLowerCase().includes(q) || c.phone.includes(q)));
    }, [search, customers]);

    const onRefresh = async () => { setRefreshing(true); await loadCustomers(); setRefreshing(false); };

    const showCustomerDetail = async (customer: Customer) => {
        const txns = await getCustomerTransactions(customer.id);
        const txnSummary = txns.length > 0
            ? txns.slice(0, 3).map(t => `\u2022 ${t.billNo}: ${formatCurrency(t.grandTotal)} (${t.paymentType})`).join('\n')
            : 'No transactions yet';
        Alert.alert(customer.name,
            `\uD83D\uDCD2 ${customer.udhaarId}\n\uD83D\uDCF1 ${customer.phone}\n\uD83C\uDFF7\uFE0F ${customer.type} \u00B7 Credit: ${formatCurrency(customer.creditLimit)}\n\uD83D\uDCB0 Outstanding: ${formatCurrency(customer.totalOutstanding)}\n\n${txnSummary}`,
            [{ text: 'Close', style: 'cancel' }]);
    };

    if (loading) return <View style={styles.center}><Text style={{ color: COLORS.TEXT_DIM }}>Loading...</Text></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Customers</Text>
                    <Text style={styles.subtitle}>{customers.length} total</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addBtnText}>\uFF0B Add</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>\uD83D\uDD0D</Text>
                <TextInput style={styles.searchInput} placeholder="Search name, phone, ID..." placeholderTextColor={COLORS.TEXT_DIM} value={search} onChangeText={setSearch} />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <CustomerCard customer={item} onPress={() => showCustomerDetail(item)} />}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />}
                ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No customers found.</Text></View>}
            />

            <AddCustomerModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdded={loadCustomers} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.XL },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 22, fontWeight: '800', color: COLORS.TEXT_HEADING },
    subtitle: { fontSize: 13, color: COLORS.TEXT_DIM },
    addBtn: { backgroundColor: COLORS.PRIMARY, paddingHorizontal: SPACING.MD, paddingVertical: 8, borderRadius: RADIUS.MD },
    addBtnText: { color: '#fff', fontWeight: '700' },
    searchBox: { flexDirection: 'row', alignItems: 'center', margin: SPACING.BASE, backgroundColor: COLORS.WHITE, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, borderWidth: 1, borderColor: COLORS.BORDER },
    searchIcon: { fontSize: 16, marginRight: SPACING.SM },
    searchInput: { flex: 1, height: 44, color: COLORS.TEXT_BODY },
    list: { paddingHorizontal: SPACING.BASE, paddingBottom: SPACING.XL },
    card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG, padding: SPACING.MD, marginBottom: SPACING.SM, elevation: 1 },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.MD, flex: 1 },
    avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
    customerName: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT_HEADING },
    customerId: { fontSize: 12, color: COLORS.TEXT_DIM },
    typeBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
    typeText: { fontSize: 10, fontWeight: '700' },
    cardRight: { alignItems: 'flex-end' },
    balanceLabel: { fontSize: 11, color: COLORS.TEXT_DIM },
    balance: { fontSize: 16, fontWeight: '700' },
    balanceRed: { color: COLORS.ERROR },
    balanceGreen: { color: COLORS.SUCCESS },
    emptyText: { color: COLORS.TEXT_DIM },
});

export default CustomersScreen;
