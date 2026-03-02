import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, TextInput } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import { getTransactions, getCustomers } from '../../services/firebase/firestoreService';
import { formatCurrency } from '../../utils/billingUtils';
import { Customer, CustomerType } from '../../models/Customer';
import { Transaction } from '../../models/Transaction';

// ─── Types ────────────────────────────────────────────────────────────────────
type RangeKey = 'Today' | '7 Days' | '1 Month' | '3 Months' | '6 Months' | '1 Year';
type ScopeType = 'all' | 'customer' | 'category';

const RANGES: { key: RangeKey; days: number; icon: string }[] = [
    { key: 'Today', days: 1, icon: '🌅' },
    { key: '7 Days', days: 7, icon: '📅' },
    { key: '1 Month', days: 30, icon: '🗓️' },
    { key: '3 Months', days: 90, icon: '📊' },
    { key: '6 Months', days: 180, icon: '📈' },
    { key: '1 Year', days: 365, icon: '🏆' },
];

const CUSTOMER_TYPES: { key: CustomerType; label: string; icon: string }[] = [
    { key: 'house', label: 'House / Family', icon: '🏠' },
    { key: 'small_shop', label: 'Small Shop', icon: '🏪' },
    { key: 'hotel', label: 'Hotel', icon: '🍽️' },
    { key: 'function', label: 'Function', icon: '🎉' },
    { key: 'wholesale', label: 'Wholesale', icon: '📦' },
    { key: 'vip', label: 'VIP Regular', icon: '⭐' },
];

// ─── HTML Generator ────────────────────────────────────────────────────────────
const buildHtml = (
    txns: Transaction[],
    allCustomers: Customer[],
    rangeKey: RangeKey,
    cutoff: Date,
    scopeLabel: string,
) => {
    const now = new Date();
    const totalRevenue = txns.reduce((s, t) => s + t.grandTotal, 0);
    const totalGST = txns.reduce((s, t) => s + t.totalGST, 0);
    const cash = txns.filter(t => t.paymentType === 'CASH').reduce((s, t) => s + t.grandTotal, 0);
    const upi = txns.filter(t => t.paymentType === 'UPI').reduce((s, t) => s + t.grandTotal, 0);
    const card = txns.filter(t => t.paymentType === 'CARD').reduce((s, t) => s + t.grandTotal, 0);
    const udhaar = txns.filter(t => t.paymentType === 'UDHAAR').reduce((s, t) => s + t.grandTotal, 0);
    const customerMap: Record<string, Customer> = {};
    allCustomers.forEach(c => { customerMap[c.id] = c; });
    const debtors = allCustomers.filter(c => c.totalOutstanding > 0).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
    const totalOutstanding = debtors.reduce((s, c) => s + c.totalOutstanding, 0);

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Sri Manjunatha Stores — ${scopeLabel} Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #667eea; padding-bottom: 20px; margin-bottom: 28px; }
  .store-name { font-size: 26px; font-weight: 900; color: #667eea; }
  .store-sub { font-size: 13px; color: #888; margin-top: 4px; }
  .report-meta { text-align: right; font-size: 12px; color: #888; }
  .period-badge { background: #667eea; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; display: inline-block; margin-bottom: 4px; }
  .scope-badge { background: #27ae60; color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; display: inline-block; margin-top: 4px; }
  h2 { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 24px 0 14px; border-left: 4px solid #667eea; padding-left: 10px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .kpi { background: #f8f9ff; border-radius: 12px; padding: 18px; border-left: 4px solid; }
  .kpi-val { font-size: 22px; font-weight: 900; }
  .kpi-label { font-size: 12px; color: #888; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #667eea; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; }
  td { padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
  tr:nth-child(even) td { background: #f8f9ff; }
  .amt { text-align: right; font-weight: 700; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
  .pay-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 28px; }
  .pay-card { padding: 16px; border-radius: 12px; color: #fff; }
  .pay-label { font-size: 12px; opacity: 0.85; }
  .pay-val { font-size: 20px; font-weight: 900; margin-top: 4px; }
  .footer { margin-top: 40px; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
  @media print { body { padding: 0; } button { display: none; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="store-name">🏪 Sri Manjunatha Stores</div>
    <div class="store-sub">Financial Summary Report</div>
  </div>
  <div class="report-meta">
    <div class="period-badge">Period: ${rangeKey}</div>
    <br><div class="scope-badge">Scope: ${scopeLabel}</div>
    <div style="margin-top:6px">${cutoff.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} → ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    <div>Generated: ${now.toLocaleString('en-IN')}</div>
  </div>
</div>

<h2>📊 Key Metrics</h2>
<div class="kpi-grid">
  <div class="kpi" style="border-color:#667eea"><div class="kpi-val" style="color:#667eea">₹${totalRevenue.toFixed(2)}</div><div class="kpi-label">Total Revenue (${txns.length} bills)</div></div>
  <div class="kpi" style="border-color:#27ae60"><div class="kpi-val" style="color:#27ae60">₹${totalGST.toFixed(2)}</div><div class="kpi-label">GST Collected</div></div>
  <div class="kpi" style="border-color:#9b59b6"><div class="kpi-val" style="color:#9b59b6">${txns.length}</div><div class="kpi-label">Total Bills</div></div>
  <div class="kpi" style="border-color:#e74c3c"><div class="kpi-val" style="color:#e74c3c">₹${totalOutstanding.toFixed(2)}</div><div class="kpi-label">Outstanding Udhaar</div></div>
</div>

<h2>💳 Payment Breakdown</h2>
<div class="pay-grid">
  <div class="pay-card" style="background:#27ae60"><div class="pay-label">💵 Cash</div><div class="pay-val">₹${cash.toFixed(2)}</div></div>
  <div class="pay-card" style="background:#667eea"><div class="pay-label">📱 UPI</div><div class="pay-val">₹${upi.toFixed(2)}</div></div>
  <div class="pay-card" style="background:#2980b9"><div class="pay-label">💳 Card</div><div class="pay-val">₹${card.toFixed(2)}</div></div>
  <div class="pay-card" style="background:#e74c3c"><div class="pay-label">📓 Udhaar</div><div class="pay-val">₹${udhaar.toFixed(2)}</div></div>
</div>

<h2>🧾 Bills (${txns.length})</h2>
<table>
<thead><tr><th>Bill #</th><th>Customer</th><th>Date & Time</th><th>Items</th><th>Payment</th><th class="amt">Subtotal</th><th class="amt">GST</th><th class="amt">Grand Total</th></tr></thead>
<tbody>
${txns.map(t => {
        const cust = t.customerId ? customerMap[t.customerId] : null;
        return `<tr>
  <td><b>${t.billNo}</b></td>
  <td>${cust ? cust.name : '—'}</td>
  <td>${new Date(t.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ${new Date(t.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
  <td>${t.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
  <td><span class="tag" style="background:${t.paymentType === 'CASH' ? '#27ae6022' : t.paymentType === 'UPI' ? '#667eea22' : t.paymentType === 'UDHAAR' ? '#e74c3c22' : '#2980b922'}; color:${t.paymentType === 'CASH' ? '#27ae60' : t.paymentType === 'UPI' ? '#667eea' : t.paymentType === 'UDHAAR' ? '#e74c3c' : '#2980b9'}">${t.paymentType}</span></td>
  <td class="amt">₹${t.subtotal.toFixed(2)}</td>
  <td class="amt">₹${t.totalGST.toFixed(2)}</td>
  <td class="amt"><b>₹${t.grandTotal.toFixed(2)}</b></td>
</tr>`;
    }).join('')}
<tr style="background:#f0f4ff"><td colspan="5"><b>TOTAL</b></td><td class="amt"><b>₹${txns.reduce((s, t) => s + t.subtotal, 0).toFixed(2)}</b></td><td class="amt"><b>₹${totalGST.toFixed(2)}</b></td><td class="amt"><b>₹${totalRevenue.toFixed(2)}</b></td></tr>
</tbody>
</table>

${debtors.length > 0 ? `
<h2>📓 Udhaar Book</h2>
<table>
<thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Type</th><th class="amt">Outstanding</th><th class="amt">Credit Limit</th></tr></thead>
<tbody>
${debtors.map((c, i) => `<tr>
  <td>${i + 1}</td><td><b>${c.name}</b></td><td>${c.phone}</td><td>${c.type.replace('_', ' ')}</td>
  <td class="amt" style="color:#e74c3c"><b>₹${c.totalOutstanding.toFixed(2)}</b></td>
  <td class="amt">₹${c.creditLimit.toFixed(2)}</td>
</tr>`).join('')}
<tr style="background:#fff0f0"><td colspan="4"><b>TOTAL</b></td><td class="amt" style="color:#e74c3c"><b>₹${totalOutstanding.toFixed(2)}</b></td><td></td></tr>
</tbody></table>` : ''}

<div class="footer">Generated by Sri Manjunatha Stores POS · ${now.toLocaleString('en-IN')} · Computer-generated report.</div>
</body></html>`;
};

// ─── Main Component ────────────────────────────────────────────────────────────
const ReportsScreen = () => {
    const [selectedRange, setSelectedRange] = useState<RangeKey>('1 Month');
    const [scope, setScope] = useState<ScopeType>('all');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<CustomerType | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getCustomers().then(setCustomers).catch(() => { });
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.udhaarId.toLowerCase().includes(search.toLowerCase())
    );

    const getScopeLabel = () => {
        if (scope === 'customer' && selectedCustomer) return selectedCustomer.name;
        if (scope === 'category' && selectedCategory) return CUSTOMER_TYPES.find(t => t.key === selectedCategory)?.label || selectedCategory;
        return 'All Customers';
    };

    const handleExport = async () => {
        if (Platform.OS !== 'web') { Alert.alert('Web Only', 'PDF export works on the web version.'); return; }
        if (scope === 'customer' && !selectedCustomer) { Alert.alert('Select Customer', 'Please pick a customer first.'); return; }
        if (scope === 'category' && !selectedCategory) { Alert.alert('Select Category', 'Please pick a customer category first.'); return; }

        setLoading(true);
        try {
            const [allTxns, allCustomers] = await Promise.all([getTransactions(1000), getCustomers()]);
            const days = RANGES.find(r => r.key === selectedRange)?.days || 30;
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);

            let txns = allTxns.filter(t => new Date(t.timestamp) >= cutoff);

            if (scope === 'customer' && selectedCustomer) {
                txns = txns.filter(t => t.customerId === selectedCustomer.id);
            } else if (scope === 'category' && selectedCategory) {
                const catIds = new Set(allCustomers.filter(c => c.type === selectedCategory).map(c => c.id));
                txns = txns.filter(t => t.customerId && catIds.has(t.customerId));
            }

            const html = buildHtml(txns, allCustomers, selectedRange, cutoff, getScopeLabel());
            const win = window.open('', '_blank');
            if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
        } catch { Alert.alert('Error', 'Failed to generate report'); }
        setLoading(false);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.title}>📄 Reports & Export</Text>
                <Text style={styles.subtitle}>Generate tailored PDF financial statements</Text>
            </View>

            {/* STEP 1: Scope */}
            <View style={styles.card}>
                <View style={styles.stepRow}>
                    <View style={styles.stepBadge}><Text style={styles.stepNo}>1</Text></View>
                    <Text style={styles.stepTitle}>Who is this report for?</Text>
                </View>
                <View style={styles.scopeRow}>
                    {([
                        { key: 'all', icon: '🏪', label: 'All Customers' },
                        { key: 'customer', icon: '👤', label: 'One Customer' },
                        { key: 'category', icon: '🏷️', label: 'By Category' },
                    ] as { key: ScopeType; icon: string; label: string }[]).map(s => (
                        <TouchableOpacity
                            key={s.key}
                            style={[styles.scopeCard, scope === s.key && styles.scopeCardActive]}
                            onPress={() => { setScope(s.key); setSelectedCustomer(null); setSelectedCategory(null); setSearch(''); }}>
                            <Text style={styles.scopeIcon}>{s.icon}</Text>
                            <Text style={[styles.scopeLabel, scope === s.key && styles.scopeLabelActive]}>{s.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Customer picker */}
                {scope === 'customer' && (
                    <View style={styles.pickerBox}>
                        {selectedCustomer ? (
                            <View style={styles.selectedRow}>
                                <View style={styles.selectedInfo}>
                                    <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
                                    <Text style={styles.selectedSub}>{selectedCustomer.udhaarId} · {selectedCustomer.phone}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                                    <Text style={styles.clearBtn}>✕ Change</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="🔍  Search customer name, phone, ID..."
                                    placeholderTextColor={COLORS.TEXT_DIM}
                                    value={search}
                                    onChangeText={setSearch}
                                />
                                <View style={styles.customerList}>
                                    {filteredCustomers.slice(0, 8).map(c => (
                                        <TouchableOpacity key={c.id} style={styles.customerRow} onPress={() => { setSelectedCustomer(c); setSearch(''); }}>
                                            <View style={[styles.cusAvatar, { backgroundColor: COLORS.PRIMARY + '22' }]}>
                                                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.PRIMARY }}>{c.name.charAt(0)}</Text>
                                            </View>
                                            <View style={styles.cusInfo}>
                                                <Text style={styles.cusName}>{c.name}</Text>
                                                <Text style={styles.cusSub}>{c.udhaarId} · {c.phone}</Text>
                                            </View>
                                            {c.totalOutstanding > 0 && (
                                                <Text style={styles.cusAmt}>{formatCurrency(c.totalOutstanding)}</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                    {filteredCustomers.length === 0 && <Text style={styles.noResult}>No customers found</Text>}
                                </View>
                            </>
                        )}
                    </View>
                )}

                {/* Category picker */}
                {scope === 'category' && (
                    <View style={styles.pickerBox}>
                        <Text style={styles.pickerLabel}>Select a customer category:</Text>
                        <View style={styles.typeGrid}>
                            {CUSTOMER_TYPES.map(t => (
                                <TouchableOpacity
                                    key={t.key}
                                    style={[styles.typeCard, selectedCategory === t.key && styles.typeCardActive]}
                                    onPress={() => setSelectedCategory(t.key)}>
                                    <Text style={styles.typeIcon}>{t.icon}</Text>
                                    <Text style={[styles.typeLabel, selectedCategory === t.key && { color: COLORS.PRIMARY, fontWeight: '700' }]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            {/* STEP 2: Date range */}
            <View style={styles.card}>
                <View style={styles.stepRow}>
                    <View style={styles.stepBadge}><Text style={styles.stepNo}>2</Text></View>
                    <Text style={styles.stepTitle}>Select time period</Text>
                </View>
                <View style={styles.rangeGrid}>
                    {RANGES.map(r => (
                        <TouchableOpacity
                            key={r.key}
                            style={[styles.rangeCard, selectedRange === r.key && styles.rangeCardActive]}
                            onPress={() => setSelectedRange(r.key)}>
                            <Text style={styles.rangeIcon}>{r.icon}</Text>
                            <Text style={[styles.rangeLabel, selectedRange === r.key && styles.rangeLabelActive]}>{r.key}</Text>
                            <Text style={styles.rangeSub}>{r.days === 1 ? 'Today' : `Last ${r.days} days`}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* STEP 3: Export */}
            <View style={styles.card}>
                <View style={styles.stepRow}>
                    <View style={styles.stepBadge}><Text style={styles.stepNo}>3</Text></View>
                    <Text style={styles.stepTitle}>Export report</Text>
                </View>
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLine}>📋 Scope: <Text style={styles.summaryVal}>{getScopeLabel()}</Text></Text>
                    <Text style={styles.summaryLine}>📅 Period: <Text style={styles.summaryVal}>{selectedRange}</Text></Text>
                    <Text style={styles.summaryNote}>Includes bills, payment breakdown, and udhaar book</Text>
                </View>
            </View>

            <TouchableOpacity style={[styles.exportBtn, loading && { opacity: 0.6 }]} onPress={handleExport} disabled={loading}>
                <Text style={styles.exportIcon}>📥</Text>
                <Text style={styles.exportText}>{loading ? 'Generating...' : 'Export PDF Report'}</Text>
            </TouchableOpacity>

            <View style={styles.hint}>
                <Text style={styles.hintText}>💡 Report opens in a new tab. Press Ctrl+P → Save as PDF to download.</Text>
            </View>
        </ScrollView>
    );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: { padding: SPACING.BASE, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.TEXT_HEADING },
    subtitle: { fontSize: 13, color: COLORS.TEXT_DIM, marginTop: 2 },
    card: { margin: SPACING.BASE, marginBottom: 0, backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG, padding: SPACING.BASE, elevation: 1 },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, marginBottom: SPACING.MD },
    stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.PRIMARY, justifyContent: 'center', alignItems: 'center' },
    stepNo: { color: '#fff', fontWeight: '900', fontSize: 14 },
    stepTitle: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT_HEADING },
    scopeRow: { flexDirection: 'row', gap: SPACING.SM },
    scopeCard: { flex: 1, alignItems: 'center', padding: SPACING.MD, borderRadius: RADIUS.MD, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
    scopeCardActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '12' },
    scopeIcon: { fontSize: 22, marginBottom: 4 },
    scopeLabel: { fontSize: 11, color: COLORS.TEXT_DIM, fontWeight: '600', textAlign: 'center' },
    scopeLabelActive: { color: COLORS.PRIMARY, fontWeight: '800' },
    pickerBox: { marginTop: SPACING.MD, borderTopWidth: 1, borderTopColor: COLORS.BORDER, paddingTop: SPACING.MD },
    pickerLabel: { fontSize: 13, color: COLORS.TEXT_DIM, marginBottom: SPACING.SM },
    searchInput: { backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.BORDER, color: COLORS.TEXT_BODY, marginBottom: SPACING.SM },
    customerList: { maxHeight: 260 },
    customerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    cusAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    cusInfo: { flex: 1 },
    cusName: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT_HEADING },
    cusSub: { fontSize: 11, color: COLORS.TEXT_DIM },
    cusAmt: { fontSize: 13, fontWeight: '700', color: COLORS.ERROR },
    noResult: { textAlign: 'center', color: COLORS.TEXT_DIM, padding: SPACING.MD },
    selectedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.PRIMARY + '12', borderRadius: RADIUS.MD, padding: SPACING.MD },
    selectedInfo: { flex: 1 },
    selectedName: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT_HEADING },
    selectedSub: { fontSize: 12, color: COLORS.TEXT_DIM },
    clearBtn: { fontSize: 12, color: COLORS.ERROR, fontWeight: '700' },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.SM },
    typeCard: { width: '30%', padding: SPACING.SM, borderRadius: RADIUS.MD, borderWidth: 1, borderColor: COLORS.BORDER, alignItems: 'center', backgroundColor: COLORS.BACKGROUND },
    typeCardActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '15' },
    typeIcon: { fontSize: 22, marginBottom: 4 },
    typeLabel: { fontSize: 10, color: COLORS.TEXT_DIM, textAlign: 'center' },
    rangeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.SM },
    rangeCard: { width: '30%', padding: SPACING.SM, borderRadius: RADIUS.MD, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND, alignItems: 'center' },
    rangeCardActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '15' },
    rangeIcon: { fontSize: 20, marginBottom: 2 },
    rangeLabel: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_DIM },
    rangeLabelActive: { color: COLORS.PRIMARY },
    rangeSub: { fontSize: 10, color: COLORS.TEXT_DIM, marginTop: 1 },
    summaryBox: { backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, padding: SPACING.MD },
    summaryLine: { fontSize: 14, color: COLORS.TEXT_BODY, marginBottom: 4 },
    summaryVal: { fontWeight: '700', color: COLORS.PRIMARY },
    summaryNote: { fontSize: 11, color: COLORS.TEXT_DIM, marginTop: 4 },
    exportBtn: { margin: SPACING.BASE, backgroundColor: COLORS.PRIMARY, borderRadius: RADIUS.LG, padding: SPACING.LG, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.SM, elevation: 3 },
    exportIcon: { fontSize: 22 },
    exportText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    hint: { marginHorizontal: SPACING.BASE, marginBottom: SPACING.XL, padding: SPACING.MD, backgroundColor: COLORS.PRIMARY + '12', borderRadius: RADIUS.MD, borderLeftWidth: 3, borderLeftColor: COLORS.PRIMARY },
    hintText: { fontSize: 13, color: COLORS.PRIMARY, lineHeight: 20 },
});

export default ReportsScreen;
