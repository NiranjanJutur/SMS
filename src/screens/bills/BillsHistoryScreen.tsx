import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import { getTransactions } from '../../services/firebase/firestoreService';
import { Transaction } from '../../models/Transaction';
import { formatCurrency } from '../../utils/billingUtils';

const PAYMENT_COLORS: Record<string, string> = {
    CASH: '#27ae60', UPI: COLORS.PRIMARY, CARD: '#2980B9',
    UDHAAR: COLORS.ERROR, SPLIT: '#9B59B6',
};

// ── Receipt Modal ──────────────────────────────────────────────────────────────
const BillReceiptModal = ({ bill, onClose }: { bill: Transaction | null; onClose: () => void }) => {
    if (!bill) return null;
    const paidColor = PAYMENT_COLORS[bill.paymentType] || COLORS.TEXT_DIM;
    return (
        <Modal visible={!!bill} animationType="slide" transparent>
            <View style={receipt.overlay}>
                <View style={receipt.sheet}>
                    {/* Receipt header */}
                    <View style={receipt.storeHeader}>
                        <Text style={receipt.storeName}>🏪 Sri Manjunatha Stores</Text>
                        <Text style={receipt.storeAddr}>Your trusted neighborhood store</Text>
                        <View style={receipt.divider} />
                        <Text style={receipt.billNoText}>{bill.billNo}</Text>
                        <Text style={receipt.dateText}>
                            {new Date(bill.timestamp).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric',
                            })} · {new Date(bill.timestamp).toLocaleTimeString('en-IN', {
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </Text>
                    </View>

                    {/* Biller & Customer info */}
                    <View style={receipt.infoRow}>
                        <View style={receipt.infoBox}>
                            <Text style={receipt.infoLabel}>👤 Customer</Text>
                            <Text style={receipt.infoVal}>{bill.customerName || 'Walk-in Customer'}</Text>
                        </View>
                        <View style={[receipt.infoBox, { alignItems: 'flex-end' }]}>
                            <Text style={receipt.infoLabel}>🧑‍💼 Billed by</Text>
                            <Text style={receipt.infoVal}>{bill.cashierName || bill.cashierId || 'Staff'}</Text>
                        </View>
                    </View>

                    <View style={receipt.divider} />

                    {/* Items */}
                    <ScrollView style={receipt.itemsScroll}>
                        <View style={receipt.itemHeader}>
                            <Text style={[receipt.itemColLabel, { flex: 2 }]}>Item</Text>
                            <Text style={receipt.itemColLabel}>Qty</Text>
                            <Text style={[receipt.itemColLabel, { textAlign: 'right' }]}>Amount</Text>
                        </View>
                        {bill.items.map((item, i) => (
                            <View key={i} style={receipt.itemRow}>
                                <View style={{ flex: 2 }}>
                                    <Text style={receipt.itemName}>{item.name}</Text>
                                    <Text style={receipt.itemGst}>GST {item.gst}%</Text>
                                </View>
                                <Text style={receipt.itemQty}>{item.qty} {item.unit}</Text>
                                <Text style={receipt.itemAmt}>{formatCurrency(item.total)}</Text>
                            </View>
                        ))}

                        <View style={receipt.divider} />

                        {/* Totals */}
                        <View style={receipt.totalRow}>
                            <Text style={receipt.totalLabel}>Subtotal</Text>
                            <Text style={receipt.totalVal}>{formatCurrency(bill.subtotal)}</Text>
                        </View>
                        <View style={receipt.totalRow}>
                            <Text style={receipt.totalLabel}>GST</Text>
                            <Text style={receipt.totalVal}>{formatCurrency(bill.totalGST)}</Text>
                        </View>
                        <View style={[receipt.totalRow, receipt.grandRow]}>
                            <Text style={receipt.grandLabel}>GRAND TOTAL</Text>
                            <Text style={[receipt.grandVal, { color: paidColor }]}>{formatCurrency(bill.grandTotal)}</Text>
                        </View>

                        {/* Payment badge */}
                        <View style={[receipt.payBadge, { backgroundColor: paidColor + '18', borderColor: paidColor }]}>
                            <Text style={[receipt.payText, { color: paidColor }]}>
                                {bill.paymentType === 'CASH' ? '💵' : bill.paymentType === 'UPI' ? '📱' : bill.paymentType === 'UDHAAR' ? '📓' : '💳'} Paid via {bill.paymentType}
                            </Text>
                        </View>

                        <View style={receipt.footer}>
                            <Text style={receipt.footerText}>Thank you for shopping with us! 🙏</Text>
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={receipt.closeBtn} onPress={onClose}>
                        <Text style={receipt.closeBtnText}>✕ Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ── Bill Card ──────────────────────────────────────────────────────────────────
const BillCard = ({ bill, onPress }: { bill: Transaction; onPress: () => void }) => {
    const payColor = PAYMENT_COLORS[bill.paymentType] || COLORS.TEXT_DIM;
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.78}>
            <View style={styles.cardTop}>
                <View>
                    <Text style={styles.billNo}>{bill.billNo}</Text>
                    <Text style={styles.billTime}>
                        {new Date(bill.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {new Date(bill.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <Text style={[styles.billAmt, { color: payColor }]}>{formatCurrency(bill.grandTotal)}</Text>
            </View>
            <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>👤</Text>
                    <Text style={styles.metaText}>{bill.customerName || 'Walk-in'}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>🧑‍💼</Text>
                    <Text style={styles.metaText}>{bill.cashierName || bill.cashierId || 'Staff'}</Text>
                </View>
                <View style={[styles.payTag, { backgroundColor: payColor + '18' }]}>
                    <Text style={[styles.payTagText, { color: payColor }]}>{bill.paymentType}</Text>
                </View>
            </View>
            <Text style={styles.itemsList}>
                {bill.items.slice(0, 3).map(i => i.name).join(' · ')}
                {bill.items.length > 3 ? ` +${bill.items.length - 3} more` : ''}
            </Text>
        </TouchableOpacity>
    );
};

// ── Main Screen ────────────────────────────────────────────────────────────────
const BillsHistoryScreen = () => {
    const [allBills, setAllBills] = useState<Transaction[]>([]);
    const [filtered, setFiltered] = useState<Transaction[]>([]);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedBill, setSelectedBill] = useState<Transaction | null>(null);
    const [payFilter, setPayFilter] = useState<string>('ALL');

    const load = useCallback(async () => {
        const txns = await getTransactions(500);
        setAllBills(txns);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const q = search.toLowerCase();
        let result = allBills;
        if (payFilter !== 'ALL') result = result.filter(t => t.paymentType === payFilter);
        if (q) result = result.filter(t =>
            (t.billNo || '').toLowerCase().includes(q) ||
            (t.customerName || '').toLowerCase().includes(q) ||
            (t.cashierName || '').toLowerCase().includes(q)
        );
        setFiltered(result);
    }, [search, allBills, payFilter]);

    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const todayTotal = allBills
        .filter(t => new Date(t.timestamp).toDateString() === new Date().toDateString())
        .reduce((s, t) => s + t.grandTotal, 0);

    const todayCount = allBills.filter(t =>
        new Date(t.timestamp).toDateString() === new Date().toDateString()
    ).length;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>🧾 Bills History</Text>
                    <Text style={styles.subtitle}>Today: {todayCount} bills · {formatCurrency(todayTotal)}</Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search bill#, customer, biller..."
                        placeholderTextColor={COLORS.TEXT_DIM}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Payment filter chips */}
            <View style={styles.filterRow}>
                {['ALL', 'CASH', 'UPI', 'CARD', 'UDHAAR'].map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.chip, payFilter === p && { backgroundColor: (PAYMENT_COLORS[p] || COLORS.PRIMARY), borderColor: (PAYMENT_COLORS[p] || COLORS.PRIMARY) }]}
                        onPress={() => setPayFilter(p)}>
                        <Text style={[styles.chipText, payFilter === p && { color: '#fff' }]}>{p}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.emptyState}><Text style={styles.emptyText}>Loading bills...</Text></View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <BillCard bill={item} onPress={() => setSelectedBill(item)} />}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🧾</Text>
                            <Text style={styles.emptyText}>No bills found</Text>
                        </View>
                    }
                />
            )}

            <BillReceiptModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
        </View>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const receipt = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
    storeHeader: { alignItems: 'center', paddingTop: SPACING.LG, paddingHorizontal: SPACING.BASE },
    storeName: { fontSize: 18, fontWeight: '900', color: COLORS.PRIMARY },
    storeAddr: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 2 },
    billNoText: { fontSize: 20, fontWeight: '800', color: COLORS.TEXT_HEADING, marginTop: 8 },
    dateText: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 2, marginBottom: 4 },
    divider: { height: 1, backgroundColor: COLORS.BORDER, width: '100%', marginVertical: SPACING.SM },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.BASE, paddingVertical: SPACING.SM },
    infoBox: { flex: 1 },
    infoLabel: { fontSize: 10, color: COLORS.TEXT_DIM, fontWeight: '600' },
    infoVal: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT_HEADING, marginTop: 2 },
    itemsScroll: { paddingHorizontal: SPACING.BASE },
    itemHeader: { flexDirection: 'row', paddingVertical: 6 },
    itemColLabel: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.TEXT_DIM },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.SM, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER + '60' },
    itemName: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_HEADING },
    itemGst: { fontSize: 10, color: COLORS.TEXT_DIM },
    itemQty: { flex: 1, fontSize: 13, color: COLORS.TEXT_BODY },
    itemAmt: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_HEADING, textAlign: 'right' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    totalLabel: { fontSize: 13, color: COLORS.TEXT_DIM },
    totalVal: { fontSize: 13, color: COLORS.TEXT_BODY },
    grandRow: { borderTopWidth: 1.5, borderTopColor: COLORS.BORDER, marginTop: 4, paddingTop: SPACING.SM },
    grandLabel: { fontSize: 15, fontWeight: '800', color: COLORS.TEXT_HEADING },
    grandVal: { fontSize: 22, fontWeight: '900' },
    payBadge: { borderWidth: 1, borderRadius: RADIUS.LG, padding: SPACING.SM, alignItems: 'center', marginTop: SPACING.MD },
    payText: { fontSize: 15, fontWeight: '700' },
    footer: { alignItems: 'center', paddingVertical: SPACING.LG },
    footerText: { fontSize: 13, color: COLORS.TEXT_DIM },
    closeBtn: { backgroundColor: COLORS.BORDER, margin: SPACING.BASE, marginTop: 0, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center' },
    closeBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT_DIM },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: { padding: SPACING.BASE, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.TEXT_HEADING },
    subtitle: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 2 },
    searchRow: { padding: SPACING.SM, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.SM, borderWidth: 1, borderColor: COLORS.BORDER },
    searchIcon: { fontSize: 16, marginRight: 4 },
    searchInput: { flex: 1, paddingVertical: 8, color: COLORS.TEXT_BODY, fontSize: 14 },
    filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.SM, paddingVertical: SPACING.XS, gap: SPACING.XS, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
    chipText: { fontSize: 11, fontWeight: '700', color: COLORS.TEXT_DIM },
    list: { padding: SPACING.SM },
    card: { backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG, padding: SPACING.MD, marginBottom: SPACING.SM, elevation: 1 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.SM },
    billNo: { fontSize: 16, fontWeight: '800', color: COLORS.TEXT_HEADING },
    billTime: { fontSize: 11, color: COLORS.TEXT_DIM, marginTop: 2 },
    billAmt: { fontSize: 20, fontWeight: '900' },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, marginBottom: SPACING.XS },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaIcon: { fontSize: 13 },
    metaText: { fontSize: 12, color: COLORS.TEXT_BODY },
    payTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 'auto' },
    payTagText: { fontSize: 10, fontWeight: '800' },
    itemsList: { fontSize: 11, color: COLORS.TEXT_DIM, borderTopWidth: 1, borderTopColor: COLORS.BORDER, paddingTop: 6, marginTop: 4 },
    emptyState: { flex: 1, alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48 },
    emptyText: { fontSize: 15, color: COLORS.TEXT_DIM, marginTop: 12 },
});

export default BillsHistoryScreen;
