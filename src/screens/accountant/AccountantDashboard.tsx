import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../config/theme';
import { getTransactions } from '../../services/firebase/firestoreService';
import { useUdhaar } from '../../hooks/useUdhaar';
import { formatCurrency } from '../../utils/billingUtils';
import { Transaction } from '../../models/Transaction';

const AccountantDashboard = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const { totalOutstanding, customers: debtors } = useUdhaar();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTransactions().then(data => {
            setTransactions(data);
            setLoading(false);
        });
    }, []);

    const totalRevenue = transactions.reduce((s, t) => s + t.grandTotal, 0);
    const totalGST = transactions.reduce((s, t) => s + t.totalGST, 0);
    const totalBills = transactions.length;

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
                <Text style={styles.subtitle}>All time figures</Text>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
                {[
                    { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: COLORS.SUCCESS },
                    { label: 'Total GST', value: formatCurrency(totalGST), color: COLORS.PRIMARY },
                    { label: 'Total Bills', value: `${totalBills}`, color: COLORS.SECONDARY },
                    { label: 'Udhaar Book', value: formatCurrency(totalOutstanding), color: COLORS.ERROR },
                ].map(card => (
                    <View key={card.label} style={[styles.summaryCard, { borderTopColor: card.color, borderTopWidth: 3 }]}>
                        <Text style={[styles.summaryValue, { color: card.color }]}>{card.value}</Text>
                        <Text style={styles.summaryLabel}>{card.label}</Text>
                    </View>
                ))}
            </View>

            {/* GST Slab Breakdown */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>GST Slab Breakdown</Text>
                {Object.entries(gstBySlabs).length === 0 ? (
                    <Text style={styles.emptyText}>No transactions yet</Text>
                ) : (
                    Object.entries(gstBySlabs).map(([slab, amount]) => (
                        <View key={slab} style={styles.row}>
                            <Text style={styles.rowLabel}>Slab {slab}</Text>
                            <Text style={styles.rowValue}>{formatCurrency(amount)}</Text>
                        </View>
                    ))
                )}
            </View>

            {/* Udhaar Book */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Udhaar Book</Text>
                {debtors.slice(0, 10).map(c => (
                    <View key={c.id} style={styles.row}>
                        <View>
                            <Text style={styles.rowLabel}>{c.name}</Text>
                            <Text style={styles.rowMeta}>{c.udhaarId} · {c.phone}</Text>
                        </View>
                        <Text style={[styles.rowValue, { color: COLORS.ERROR }]}>{formatCurrency(c.totalOutstanding)}</Text>
                    </View>
                ))}
                {debtors.length === 0 && <Text style={styles.emptyText}>Clear books! 🎉</Text>}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: {
        padding: SPACING.BASE, backgroundColor: COLORS.WHITE,
        borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
    },
    title: { fontSize: 20, fontFamily: TYPOGRAPHY.HEADING, color: COLORS.TEXT_HEADING },
    subtitle: { fontSize: 12, color: COLORS.TEXT_DIM },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.SM, gap: SPACING.SM },
    summaryCard: {
        width: '47%', backgroundColor: COLORS.WHITE, borderRadius: RADIUS.MD,
        padding: SPACING.MD, elevation: 1,
    },
    summaryValue: { fontSize: 18, fontFamily: TYPOGRAPHY.MONO, fontWeight: '700' },
    summaryLabel: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 4 },
    section: {
        margin: SPACING.BASE, backgroundColor: COLORS.WHITE,
        borderRadius: RADIUS.LG, padding: SPACING.BASE, elevation: 1,
    },
    sectionTitle: { fontSize: 15, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_HEADING, marginBottom: SPACING.SM },
    row: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: SPACING.SM, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
    },
    rowLabel: { fontSize: 14, fontFamily: TYPOGRAPHY.BODY, color: COLORS.TEXT_BODY },
    rowMeta: { fontSize: 11, color: COLORS.TEXT_DIM, fontFamily: TYPOGRAPHY.MONO },
    rowValue: { fontSize: 14, fontFamily: TYPOGRAPHY.MONO, fontWeight: '700', color: COLORS.TEXT_HEADING },
    emptyText: { color: COLORS.TEXT_DIM, textAlign: 'center', padding: SPACING.MD },
});

export default AccountantDashboard;
