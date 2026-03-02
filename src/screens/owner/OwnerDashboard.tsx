import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import { getTransactions } from '../../services/firebase/firestoreService';
import { useUdhaar } from '../../hooks/useUdhaar';
import { formatCurrency } from '../../utils/billingUtils';
import { Transaction } from '../../models/Transaction';

type Frame = 'Day' | 'Week' | 'Month';

const KPICard = ({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) => (
    <View style={[styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
        <Text style={styles.kpiIcon}>{icon}</Text>
        <Text style={[styles.kpiValue, { color }]}>{value}</Text>
        <Text style={styles.kpiLabel}>{label}</Text>
    </View>
);

// Custom Bar Chart (no external dependency)
const BarChart = ({ data }: { data: { label: string; value: number; color?: string }[] }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
        <View style={chart.container}>
            {data.map((d, i) => (
                <View key={i} style={chart.barGroup}>
                    <Text style={chart.barValue}>{d.value > 0 ? formatCurrency(d.value).replace('₹', '') : ''}</Text>
                    <View style={chart.barTrack}>
                        <View style={[
                            chart.bar,
                            { height: Math.max(4, (d.value / maxVal) * 120), backgroundColor: d.color || COLORS.PRIMARY }
                        ]} />
                    </View>
                    <Text style={chart.barLabel} numberOfLines={1}>{d.label}</Text>
                </View>
            ))}
        </View>
    );
};

const OwnerDashboard = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [frame, setFrame] = useState<Frame>('Day');
    const { totalOutstanding, topDebtors } = useUdhaar();

    useEffect(() => {
        getTransactions(200).then(setTransactions).catch(() => { });
    }, []);

    const now = new Date();

    // Filter transactions by timeframe
    const filtered = transactions.filter(t => {
        const d = new Date(t.timestamp);
        if (frame === 'Day') return d.toDateString() === now.toDateString();
        if (frame === 'Week') {
            const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 6);
            return d >= weekAgo;
        }
        if (frame === 'Month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
    });

    const todaySales = filtered.reduce((s, t) => s + t.grandTotal, 0);
    const todayGST = filtered.reduce((s, t) => s + t.totalGST, 0);
    const cashTotal = filtered.filter(t => t.paymentType === 'CASH').reduce((s, t) => s + t.grandTotal, 0);
    const upiTotal = filtered.filter(t => t.paymentType === 'UPI').reduce((s, t) => s + t.grandTotal, 0);
    const udhaarToday = filtered.filter(t => t.paymentType === 'UDHAAR').reduce((s, t) => s + t.grandTotal, 0);

    // Build bar chart data
    const getChartData = () => {
        if (frame === 'Day') {
            // Hourly buckets for today
            const buckets: Record<string, number> = {};
            for (let h = 8; h <= 21; h++) buckets[`${h}h`] = 0;
            filtered.forEach(t => {
                const h = new Date(t.timestamp).getHours();
                const key = `${h}h`;
                if (key in buckets) buckets[key] += t.grandTotal;
            });
            return Object.entries(buckets).map(([label, value]) => ({ label, value }));
        }
        if (frame === 'Week') {
            // Last 7 days
            const days: Record<string, number> = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now); d.setDate(now.getDate() - i);
                days[d.toLocaleDateString('en-IN', { weekday: 'short' })] = 0;
            }
            filtered.forEach(t => {
                const key = new Date(t.timestamp).toLocaleDateString('en-IN', { weekday: 'short' });
                if (key in days) days[key] += t.grandTotal;
            });
            return Object.entries(days).map(([label, value]) => ({ label, value }));
        }
        if (frame === 'Month') {
            // Days of month grouped in weeks
            const weeks: Record<string, number> = { 'Wk 1': 0, 'Wk 2': 0, 'Wk 3': 0, 'Wk 4': 0 };
            filtered.forEach(t => {
                const day = new Date(t.timestamp).getDate();
                const wk = day <= 7 ? 'Wk 1' : day <= 14 ? 'Wk 2' : day <= 21 ? 'Wk 3' : 'Wk 4';
                weeks[wk] += t.grandTotal;
            });
            return Object.entries(weeks).map(([label, value]) => ({ label, value }));
        }
        return [];
    };

    const chartData = getChartData();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Owner Dashboard</Text>
                    <Text style={styles.date}>{now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                </View>
                <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            </View>

            {/* Frame Selector */}
            <View style={styles.frameRow}>
                {(['Day', 'Week', 'Month'] as Frame[]).map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.frameBtn, frame === f && styles.frameBtnActive]}
                        onPress={() => setFrame(f)}>
                        <Text style={[styles.frameBtnText, frame === f && styles.frameBtnTextActive]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
                <KPICard label={`${frame}'s Sales`} value={formatCurrency(todaySales)} color={COLORS.PRIMARY} icon="💰" />
                <KPICard label="Bills" value={`${filtered.length}`} color={COLORS.SECONDARY} icon="🧾" />
                <KPICard label="GST Collected" value={formatCurrency(todayGST)} color={COLORS.SUCCESS} icon="📋" />
                <KPICard label="Total Udhaar" value={formatCurrency(totalOutstanding)} color={COLORS.ERROR} icon="📓" />
            </View>

            {/* Bar Chart */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sales Chart — {frame}</Text>
                {chartData.every(d => d.value === 0) ? (
                    <View style={styles.emptyChart}>
                        <Text style={styles.emptyChartText}>📊 No sales data for this period</Text>
                        <Text style={styles.emptyChartSub}>Bills will appear here once created</Text>
                    </View>
                ) : (
                    <BarChart data={chartData} />
                )}
            </View>

            {/* Payment Breakdown */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Breakdown — {frame}</Text>
                {[
                    { label: 'Cash', amount: cashTotal, color: COLORS.SUCCESS, icon: '💵' },
                    { label: 'UPI', amount: upiTotal, color: '#2980B9', icon: '📱' },
                    { label: 'Udhaar', amount: udhaarToday, color: COLORS.ERROR, icon: '📓' },
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
                {topDebtors.length === 0 && <Text style={styles.emptyText}>No outstanding udhaar 🎉</Text>}
            </View>
        </ScrollView>
    );
};

const chart = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 160, paddingHorizontal: 4, paddingTop: 8 },
    barGroup: { flex: 1, alignItems: 'center' },
    barValue: { fontSize: 8, color: COLORS.TEXT_DIM, marginBottom: 2, textAlign: 'center' },
    barTrack: { height: 120, justifyContent: 'flex-end', width: '70%' },
    bar: { borderRadius: 4, minHeight: 4 },
    barLabel: { fontSize: 9, color: COLORS.TEXT_DIM, marginTop: 4, textAlign: 'center', width: '90%' },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.TEXT_HEADING },
    date: { fontSize: 13, color: COLORS.TEXT_DIM },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.SUCCESS },
    liveText: { fontSize: 11, fontWeight: '700', color: COLORS.SUCCESS },
    frameRow: { flexDirection: 'row', margin: SPACING.BASE, marginBottom: 0, gap: SPACING.SM },
    frameBtn: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.MD, backgroundColor: COLORS.WHITE, borderWidth: 1, borderColor: COLORS.BORDER, alignItems: 'center' },
    frameBtnActive: { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
    frameBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.TEXT_DIM },
    frameBtnTextActive: { color: '#fff', fontWeight: '800' },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.SM, gap: SPACING.SM },
    kpiCard: { width: '47%', backgroundColor: COLORS.WHITE, borderRadius: RADIUS.MD, padding: SPACING.MD, elevation: 1 },
    kpiIcon: { fontSize: 20, marginBottom: 4 },
    kpiValue: { fontSize: 20, fontWeight: '800' },
    kpiLabel: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 2 },
    section: { margin: SPACING.BASE, backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG, padding: SPACING.BASE, elevation: 1 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT_HEADING, marginBottom: SPACING.SM },
    emptyChart: { alignItems: 'center', paddingVertical: SPACING.LG },
    emptyChartText: { fontSize: 15, color: COLORS.TEXT_DIM, fontWeight: '600' },
    emptyChartSub: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 4 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.XS },
    paymentLabel: { fontSize: 14, color: COLORS.TEXT_BODY },
    paymentAmount: { fontSize: 14, fontWeight: '700' },
    debtorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.SM, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    debtorRank: { width: 28, color: COLORS.TEXT_DIM },
    debtorName: { flex: 1, color: COLORS.TEXT_BODY },
    debtorBalance: { fontWeight: '700', color: COLORS.ERROR },
    emptyText: { color: COLORS.TEXT_DIM, textAlign: 'center', padding: SPACING.MD },
});

export default OwnerDashboard;
