import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import { getTransactions } from '../../services/firebase/firestoreService';
import { useUdhaar } from '../../hooks/useUdhaar';
import { formatCurrency } from '../../utils/billingUtils';
import { Transaction } from '../../models/Transaction';

type Frame = 'Day' | 'Week' | 'Month' | 'Year';

// ──────────────────────────────────────────────
// Custom Bar Chart
// ──────────────────────────────────────────────
const BarChart = ({ data, maxHeight = 120 }: { data: { label: string; value: number; color?: string }[]; maxHeight?: number }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
        <View style={bar.container}>
            {data.map((d, i) => (
                <View key={i} style={bar.group}>
                    <Text style={bar.valText}>{d.value > 0 ? `₹${(d.value / 1000).toFixed(0)}k` : ''}</Text>
                    <View style={[bar.track, { height: maxHeight }]}>
                        <View style={[bar.fill, {
                            height: Math.max(4, (d.value / maxVal) * maxHeight),
                            backgroundColor: d.color || COLORS.PRIMARY,
                        }]} />
                    </View>
                    <Text style={bar.labelText} numberOfLines={1}>{d.label}</Text>
                </View>
            ))}
        </View>
    );
};

// ──────────────────────────────────────────────
// Custom Pie/Donut Chart (pure RN using Views)
// ──────────────────────────────────────────────
const PieChart = ({ segments }: { segments: { label: string; value: number; color: string }[] }) => {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    return (
        <View style={pie.wrapper}>
            {/* Stacked horizontal bar acting as pie legend */}
            <View style={pie.barContainer}>
                {segments.map((seg, i) => (
                    <View key={i} style={[pie.barSeg, { flex: seg.value / total, backgroundColor: seg.color }]} />
                ))}
            </View>
            <View style={pie.legend}>
                {segments.map((seg, i) => (
                    <View key={i} style={pie.legendItem}>
                        <View style={[pie.dot, { backgroundColor: seg.color }]} />
                        <Text style={pie.legendLabel}>{seg.label}</Text>
                        <Text style={pie.legendVal}>{((seg.value / total) * 100).toFixed(1)}%</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

// ──────────────────────────────────────────────
// Stat Card
// ──────────────────────────────────────────────
const StatCard = ({ label, value, color, icon, sub }: { label: string; value: string; color: string; icon: string; sub?: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
);

// ──────────────────────────────────────────────
// Main Accountant Dashboard
// ──────────────────────────────────────────────
const AccountantDashboard = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [frame, setFrame] = useState<Frame>('Day');
    const { totalOutstanding, customers: debtors } = useUdhaar();

    useEffect(() => {
        getTransactions(500).then(setTransactions).catch(() => { });
    }, []);

    const now = new Date();

    const filtered = transactions.filter(t => {
        const d = new Date(t.timestamp);
        if (frame === 'Day') return d.toDateString() === now.toDateString();
        if (frame === 'Week') { const w = new Date(now); w.setDate(now.getDate() - 6); return d >= w; }
        if (frame === 'Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (frame === 'Year') return d.getFullYear() === now.getFullYear();
        return true;
    });

    const totalRevenue = filtered.reduce((s, t) => s + t.grandTotal, 0);
    const totalGST = filtered.reduce((s, t) => s + t.totalGST, 0);
    const totalProfit = totalRevenue * 0.18; // estimated margin
    const cash = filtered.filter(t => t.paymentType === 'CASH').reduce((s, t) => s + t.grandTotal, 0);
    const upi = filtered.filter(t => t.paymentType === 'UPI').reduce((s, t) => s + t.grandTotal, 0);
    const card = filtered.filter(t => t.paymentType === 'CARD').reduce((s, t) => s + t.grandTotal, 0);
    const udhaar = filtered.filter(t => t.paymentType === 'UDHAAR').reduce((s, t) => s + t.grandTotal, 0);

    // Bar chart data
    const getBarData = () => {
        if (frame === 'Day') {
            const b: Record<string, number> = {};
            for (let h = 8; h <= 21; h++) b[`${h}h`] = 0;
            filtered.forEach(t => {
                const h = `${new Date(t.timestamp).getHours()}h`;
                if (h in b) b[h] += t.grandTotal;
            });
            return Object.entries(b).map(([label, value]) => ({ label, value }));
        }
        if (frame === 'Week') {
            const days: Record<string, number> = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now); d.setDate(now.getDate() - i);
                days[d.toLocaleDateString('en-IN', { weekday: 'short' })] = 0;
            }
            filtered.forEach(t => {
                const k = new Date(t.timestamp).toLocaleDateString('en-IN', { weekday: 'short' });
                if (k in days) days[k] += t.grandTotal;
            });
            return Object.entries(days).map(([label, value]) => ({ label, value }));
        }
        if (frame === 'Month') {
            const w = { 'Wk 1': 0, 'Wk 2': 0, 'Wk 3': 0, 'Wk 4': 0 };
            filtered.forEach(t => {
                const day = new Date(t.timestamp).getDate();
                const k = day <= 7 ? 'Wk 1' : day <= 14 ? 'Wk 2' : day <= 21 ? 'Wk 3' : 'Wk 4';
                w[k] += t.grandTotal;
            });
            return Object.entries(w).map(([label, value]) => ({ label, value }));
        }
        // Year: monthly
        const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mb: Record<string, number> = {};
        m.forEach(x => mb[x] = 0);
        filtered.forEach(t => {
            const k = m[new Date(t.timestamp).getMonth()];
            mb[k] += t.grandTotal;
        });
        return Object.entries(mb).map(([label, value]) => ({ label, value }));
    };

    const barData = getBarData();

    const paymentPie = [
        { label: 'Cash', value: cash, color: COLORS.SUCCESS },
        { label: 'UPI', value: upi, color: COLORS.PRIMARY },
        { label: 'Card', value: card, color: '#2980B9' },
        { label: 'Udhaar', value: udhaar, color: COLORS.ERROR },
    ].filter(x => x.value > 0);

    // GST by slab
    const gstBySlabs: Record<string, number> = {};
    filtered.forEach(txn => txn.items.forEach(item => {
        const key = `${item.gst}%`;
        gstBySlabs[key] = (gstBySlabs[key] || 0) + (item.price * item.qty * item.gst) / 100;
    }));
    const gstBar = Object.entries(gstBySlabs).map(([label, value]) => ({ label, value, color: COLORS.SECONDARY }));

    const isEmpty = filtered.length === 0;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>📊 Accountant Dashboard</Text>
                    <Text style={styles.subtitle}>{now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                </View>
                <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            </View>

            {/* Frame Selector */}
            <View style={styles.frameRow}>
                {(['Day', 'Week', 'Month', 'Year'] as Frame[]).map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.frameBtn, frame === f && styles.frameBtnActive]}
                        onPress={() => setFrame(f)}>
                        <Text style={[styles.frameBtnText, frame === f && styles.frameBtnTextActive]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* KPI Stats */}
            <View style={styles.statGrid}>
                <StatCard label="Revenue" value={formatCurrency(totalRevenue)} color={COLORS.PRIMARY} icon="💰" sub={`${filtered.length} bills`} />
                <StatCard label="GST Collected" value={formatCurrency(totalGST)} color={COLORS.SUCCESS} icon="📋" />
                <StatCard label="Est. Profit" value={formatCurrency(totalProfit)} color="#9B59B6" icon="📈" sub="~18% margin" />
                <StatCard label="Udhaar Book" value={formatCurrency(totalOutstanding)} color={COLORS.ERROR} icon="📓" sub={`${debtors.length} debtors`} />
            </View>

            {isEmpty && (
                <View style={styles.emptyBanner}>
                    <Text style={styles.emptyIcon}>📊</Text>
                    <Text style={styles.emptyText}>No transactions in this {frame.toLowerCase()}</Text>
                    <Text style={styles.emptySub}>Bills created will appear here</Text>
                </View>
            )}

            {/* Revenue Bar Chart */}
            {!isEmpty && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Revenue — {frame}</Text>
                    <BarChart data={barData} maxHeight={130} />
                </View>
            )}

            {/* Payment Method Pie */}
            {paymentPie.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Payment Breakdown</Text>
                    <PieChart segments={paymentPie} />
                    <View style={styles.payAmtRow}>
                        {paymentPie.map(p => (
                            <View key={p.label} style={styles.payAmtBox}>
                                <View style={[styles.payDot, { backgroundColor: p.color }]} />
                                <Text style={styles.payAmtLabel}>{p.label}</Text>
                                <Text style={[styles.payAmtVal, { color: p.color }]}>{formatCurrency(p.value)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* GST Slab Bar Chart */}
            {gstBar.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>GST by Slab</Text>
                    <BarChart data={gstBar} maxHeight={80} />
                </View>
            )}

            {/* Udhaar Leaderboard */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Top Udhaar Debtors</Text>
                {debtors.length === 0 ? (
                    <Text style={styles.noData}>All clear — no outstanding udhaar 🎉</Text>
                ) : (
                    debtors.slice(0, 8).map((c, i) => (
                        <View key={c.id} style={styles.debtRow}>
                            <View style={[styles.debtRank, { backgroundColor: i < 3 ? COLORS.ERROR + '22' : COLORS.BORDER }]}>
                                <Text style={[styles.debtRankText, { color: i < 3 ? COLORS.ERROR : COLORS.TEXT_DIM }]}>#{i + 1}</Text>
                            </View>
                            <Text style={styles.debtName}>{c.name}</Text>
                            <View>
                                <Text style={styles.debtAmt}>{formatCurrency(c.totalOutstanding)}</Text>
                                <View style={styles.debtBar}>
                                    <View style={[styles.debtBarFill, {
                                        width: `${Math.min(100, (c.totalOutstanding / (debtors[0]?.totalOutstanding || 1)) * 100)}%` as any,
                                    }]} />
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Recent Bills Table */}
            <View style={[styles.card, { marginBottom: SPACING.XL }]}>
                <Text style={styles.cardTitle}>Recent Bills</Text>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>Bill #</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Date</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>Mode</Text>
                    <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right' }]}>Amount</Text>
                </View>
                {filtered.slice(0, 10).map(t => (
                    <View key={t.id} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 1.2, color: COLORS.PRIMARY, fontWeight: '700' }]}>{t.billNo}</Text>
                        <Text style={[styles.tableCell, { flex: 2, fontSize: 11 }]}>
                            {new Date(t.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={[styles.tableCell, { flex: 1, fontSize: 11 }]}>{t.paymentType}</Text>
                        <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: '700', color: COLORS.TEXT_HEADING }]}>
                            {formatCurrency(t.grandTotal)}
                        </Text>
                    </View>
                ))}
                {filtered.length === 0 && <Text style={styles.noData}>No bills in this period</Text>}
            </View>
        </ScrollView>
    );
};

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
const bar = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 4 },
    group: { flex: 1, alignItems: 'center' },
    valText: { fontSize: 8, color: COLORS.TEXT_DIM, marginBottom: 2, textAlign: 'center' },
    track: { justifyContent: 'flex-end', width: '70%' },
    fill: { borderRadius: 4, minHeight: 4 },
    labelText: { fontSize: 9, color: COLORS.TEXT_DIM, marginTop: 4, textAlign: 'center', width: '90%' },
});

const pie = StyleSheet.create({
    wrapper: {},
    barContainer: { flexDirection: 'row', height: 22, borderRadius: 11, overflow: 'hidden', marginBottom: SPACING.MD },
    barSeg: { height: 22 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.SM },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: SPACING.SM },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: { fontSize: 12, color: COLORS.TEXT_BODY },
    legendVal: { fontSize: 12, fontWeight: '700', color: COLORS.TEXT_HEADING },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT_HEADING },
    subtitle: { fontSize: 12, color: COLORS.TEXT_DIM },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.SUCCESS },
    liveText: { fontSize: 11, fontWeight: '700', color: COLORS.SUCCESS },
    frameRow: { flexDirection: 'row', margin: SPACING.BASE, marginBottom: SPACING.SM, gap: SPACING.SM },
    frameBtn: { flex: 1, paddingVertical: 7, borderRadius: RADIUS.MD, backgroundColor: COLORS.WHITE, borderWidth: 1, borderColor: COLORS.BORDER, alignItems: 'center' },
    frameBtnActive: { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
    frameBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.TEXT_DIM },
    frameBtnTextActive: { color: '#fff', fontWeight: '800' },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.SM, gap: SPACING.SM },
    statCard: { width: '47%', backgroundColor: COLORS.WHITE, borderRadius: RADIUS.MD, padding: SPACING.MD, borderLeftWidth: 4, elevation: 1 },
    statIcon: { fontSize: 18, marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: '800' },
    statLabel: { fontSize: 11, color: COLORS.TEXT_DIM, marginTop: 2 },
    statSub: { fontSize: 10, color: COLORS.TEXT_DIM, marginTop: 1 },
    emptyBanner: { alignItems: 'center', padding: SPACING.XL, backgroundColor: COLORS.WHITE, margin: SPACING.BASE, borderRadius: RADIUS.LG },
    emptyIcon: { fontSize: 40 },
    emptyText: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT_DIM, marginTop: SPACING.SM },
    emptySub: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 4 },
    card: { margin: SPACING.BASE, marginBottom: 0, backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG, padding: SPACING.BASE, elevation: 1 },
    cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT_HEADING, marginBottom: SPACING.MD },
    payAmtRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.SM, marginTop: SPACING.MD },
    payAmtBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.BACKGROUND, paddingHorizontal: SPACING.SM, paddingVertical: 6, borderRadius: RADIUS.MD },
    payDot: { width: 8, height: 8, borderRadius: 4 },
    payAmtLabel: { fontSize: 12, color: COLORS.TEXT_DIM },
    payAmtVal: { fontSize: 12, fontWeight: '700' },
    noData: { color: COLORS.TEXT_DIM, textAlign: 'center', padding: SPACING.MD, fontSize: 13 },
    debtRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.SM, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER, gap: SPACING.SM },
    debtRank: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    debtRankText: { fontSize: 11, fontWeight: '700' },
    debtName: { flex: 1, color: COLORS.TEXT_BODY, fontSize: 14 },
    debtAmt: { fontSize: 14, fontWeight: '700', color: COLORS.ERROR, textAlign: 'right' },
    debtBar: { height: 4, backgroundColor: COLORS.BORDER, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
    debtBarFill: { height: 4, backgroundColor: COLORS.ERROR + '80', borderRadius: 2 },
    tableHeader: { flexDirection: 'row', paddingBottom: SPACING.SM, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER, marginBottom: 4 },
    tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER + '80' },
    tableCell: { fontSize: 12, color: COLORS.TEXT_BODY },
});

export default AccountantDashboard;
