import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import { getTransactions } from '../../services/firebase/firestoreService';
import { useUdhaar } from '../../hooks/useUdhaar';
import { formatCurrency } from '../../utils/billingUtils';
import { Transaction } from '../../models/Transaction';

const AccountantDashboard = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const { totalOutstanding, customers: debtors } = useUdhaar();

    useEffect(() => {
        getTransactions().then(setTransactions).catch(() => {});
    }, []);

    const totalRevenue = transactions.reduce((s, t) => s + t.grandTotal, 0);
    const totalGST = transactions.reduce((s, t) => s + t.totalGST, 0);

    const gstBySlabs: Record<string, number> = {};
    transactions.forEach(txn => {
        txn.items.forEach(item => {
            const key = `${item.gst}%`;
            gstBySlabs[key] = (gstBySlabs[key] || 0) + (item.price * item.qty * item.gst) / 100;
        });
    });

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Accountant View</Text>
                <Text style={styles.subtitle}>All-time figures</Text>
            </View>

            <View style={styles.summaryGrid}>
                {[
                    { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: COLORS.SUCCESS },
                    { label: 'Total GST', value: formatCurrency(totalGST), color: COLORS.PRIMARY },
                    { label: 'Total Bills', value: `${transactions.length}`, color: COLORS.SECONDARY },
                    { label: 'Udhaar Book', value: formatCurrency(totalOutstanding), color: COLORS.ERROR },
                ].map(card => (
                    <View key={card.label} style={[styles.summaryCard, { borderTopColor: card.color, borderTopWidth: 3 }]}>
                        <Text style={[styles.summaryValue, { color: card.color }]}>{card.value}</Text>
                        <Text style={styles.summaryLabel}>{card.label}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>GST Slab Breakdown</Text>
                {Object.entries(gstBySlabs).length === 0
                    ? <Text style={styles.emptyText}>No transactions yet</Text>
                    : Object.entries(gstBySlabs).map(([slab, amount]) => (
                        <View key={slab} style={styles.row}>
                            <Text style={styles.rowLabel}>Slab {slab}</Text>
                            <Text style={styles.rowValue}>{formatCurrency(amount)}</Text>
                        </View>
                    ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Udhaar Book</Text>
                {debtors.slice(0, 10).map(c => (
                    <View key={c.id} style={styles.row}>
                        <View>
                            <Text style={styles.rowLabel}>{c.name}</Text>
                            <Text style={styles.rowMeta}>{c.udhaarId} \u00B7 {c.phone}</Text>
                        </View>
                        <Text style={[styles.rowValue, { color: COLORS.ERROR }]}>{formatCurrency(c.totalOutstanding)}</Text>
                    </View>
                ))}
                {debtors.length === 0 && <Text style={styles.emptyText}>Clear books! \uD83C\uDF89</Text>}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: { padding: SPACING.BASE, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.TEXT_HEADING },
    subtitle: { fontSize: 12, color: COLORS.TEXT_DIM },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.SM, gap: SPACING.SM },
    summaryCard: { width: '47%', backgroundColor: COLORS.WHITE, borderRadius: RADIUS.MD, padding: SPACING.MD, elevation: 1 },
    summaryValue: { fontSize: 18, fontWeight: '800' },
    summaryLabel: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 4 },
    section: { margin: SPACING.BASE, backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG, padding: SPACING.BASE, elevation: 1 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT_HEADING, marginBottom: SPACING.SM },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.SM, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    rowLabel: { fontSize: 14, color: COLORS.TEXT_BODY },
    rowMeta: { fontSize: 11, color: COLORS.TEXT_DIM },
    rowValue: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT_HEADING },
    emptyText: { color: COLORS.TEXT_DIM, textAlign: 'center', padding: SPACING.MD },
});

export default AccountantDashboard;
