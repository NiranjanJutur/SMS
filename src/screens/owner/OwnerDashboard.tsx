import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../config/theme';
import { getTransactions } from '../../services/firebase/firestoreService';
import { useUdhaar } from '../../hooks/useUdhaar';
import { formatCurrency } from '../../utils/billingUtils';
import { Transaction } from '../../models/Transaction';

const KPICard = ({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) => (
    <View style={[styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
        <Text style={styles.kpiIcon}>{icon}</Text>
        <Text style={[styles.kpiValue, { color }]}>{value}</Text>
        <Text style={styles.kpiLabel}>{label}</Text>
    </View>
);

const OwnerDashboard = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const { totalOutstanding, topDebtors } = useUdhaar();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTransactions().then(data => {
            setTransactions(data);
            setLoading(false);
        });
    }, []);

    const todayStr = new Date().toDateString();
    const todayTxns = transactions.filter(t => new Date(t.timestamp).toDateString() === todayStr);
    const todaySales = todayTxns.reduce((sum, t) => sum + t.grandTotal, 0);
    const todayGST = todayTxns.reduce((sum, t) => sum + t.totalGST, 0);
    const cashTotal = todayTxns.filter(t => t.paymentType === 'CASH').reduce((s, t) => s + t.grandTotal, 0);
    const upiTotal = todayTxns.filter(t => t.paymentType === 'UPI').reduce((s, t) => s + t.grandTotal, 0);
    const udhaarTotal = todayTxns.filter(t => t.paymentType === 'UDHAAR').reduce((s, t) => s + t.grandTotal, 0);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Owner Dashboard</Text>
                    <Text style={styles.date}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                </View>
                <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            </View>

            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
                <KPICard label="Today's Sales" value={formatCurrency(todaySales)} color={COLORS.PRIMARY} icon="💰" />
                <KPICard label="Bills Today" value={`${todayTxns.length}`} color={COLORS.SECONDARY} icon="🧾" />
                <KPICard label="GST Collected" value={formatCurrency(todayGST)} color={COLORS.SUCCESS} icon="📋" />
                <KPICard label="Total Udhaar" value={formatCurrency(totalOutstanding)} color={COLORS.ERROR} icon="📒" />
            </View>

            {/* Payment Breakdown */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Breakdown — Today</Text>
                {[
                    { label: 'Cash', amount: cashTotal, color: COLORS.SUCCESS, icon: '💵' },
                    { label: 'UPI', amount: upiTotal, color: '#2980B9', icon: '📱' },
                    { label: 'Udhaar', amount: udhaarTotal, color: COLORS.ERROR, icon: '📒' },
                ].map(row => (
                    <View key={row.label} style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>{row.icon}  {row.label}</Text>
                        <Text style={[styles.paymentAmount, { color: row.color }]}>{formatCurrency(row.amount)}</Text>
                    </View>
                ))}
            </View>

            {/* Top Debtors */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Udhaar Customers</Text>
                {topDebtors.map((c, i) => (
                    <View key={c.id} style={styles.debtorRow}>
                        <Text style={styles.debtorRank}>#{i + 1}</Text>
                        <Text style={styles.debtorName}>{c.name}</Text>
                        <Text style={styles.debtorBalance}>{formatCurrency(c.totalOutstanding)}</Text>
                    </View>
                ))}
                {topDebtors.length === 0 && (
                    <Text style={styles.emptyText}>No outstanding udhaar 🎉</Text>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: SPACING.BASE, backgroundColor: COLORS.WHITE,
        borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
    },
    title: { fontSize: 20, fontFamily: TYPOGRAPHY.HEADING, color: COLORS.TEXT_HEADING },
    date: { fontSize: 13, color: COLORS.TEXT_DIM },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.SUCCESS },
    liveText: { fontSize: 11, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.SUCCESS },
    kpiGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        padding: SPACING.SM, gap: SPACING.SM,
    },
    kpiCard: {
        width: '47%', backgroundColor: COLORS.WHITE,
        borderRadius: RADIUS.MD, padding: SPACING.MD,
        elevation: 1,
    },
    kpiIcon: { fontSize: 20, marginBottom: 4 },
    kpiValue: { fontSize: 20, fontFamily: TYPOGRAPHY.MONO, fontWeight: '700' },
    kpiLabel: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 2 },
    section: {
        margin: SPACING.BASE, backgroundColor: COLORS.WHITE,
        borderRadius: RADIUS.LG, padding: SPACING.BASE, elevation: 1,
    },
    sectionTitle: { fontSize: 15, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_HEADING, marginBottom: SPACING.SM },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.XS },
    paymentLabel: { fontSize: 14, fontFamily: TYPOGRAPHY.BODY, color: COLORS.TEXT_BODY },
    paymentAmount: { fontSize: 14, fontFamily: TYPOGRAPHY.MONO, fontWeight: '700' },
    debtorRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: SPACING.SM, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
    },
    debtorRank: { width: 28, fontFamily: TYPOGRAPHY.MONO, color: COLORS.TEXT_DIM },
    debtorName: { flex: 1, fontFamily: TYPOGRAPHY.BODY, color: COLORS.TEXT_BODY },
    debtorBalance: { fontFamily: TYPOGRAPHY.MONO, fontWeight: '700', color: COLORS.ERROR },
    emptyText: { color: COLORS.TEXT_DIM, textAlign: 'center', padding: SPACING.MD },
});

export default OwnerDashboard;
