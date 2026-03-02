import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
    ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import { Customer, CustomerType } from '../../models/Customer';
import { Transaction } from '../../models/Transaction';
import { getCustomerTransactions, updateCustomer } from '../../services/firebase/firestoreService';
import { formatCurrency } from '../../utils/billingUtils';

const TYPE_COLORS: Record<string, string> = {
    house: COLORS.SUCCESS, small_shop: COLORS.SECONDARY, hotel: COLORS.PRIMARY,
    function: '#9B59B6', wholesale: '#2980B9', vip: '#F39C12',
};

const TYPES: { key: CustomerType; label: string; icon: string }[] = [
    { key: 'house', label: 'House', icon: '🏠' },
    { key: 'small_shop', label: 'Shop', icon: '🏪' },
    { key: 'hotel', label: 'Hotel', icon: '🍽️' },
    { key: 'function', label: 'Function', icon: '🎉' },
    { key: 'wholesale', label: 'Wholesale', icon: '📦' },
    { key: 'vip', label: 'VIP', icon: '⭐' },
];

const SOURCE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
    computer: { icon: '💻', label: 'Computer Bill', color: COLORS.PRIMARY },
    handwritten: { icon: '✍️', label: 'Handwritten Slip', color: '#9B59B6' },
    audio: { icon: '🎙️', label: 'Voice Order', color: '#E67E22' },
    unknown: { icon: '🧾', label: 'Bill', color: COLORS.TEXT_DIM },
};

const PAYMENT_COLORS: Record<string, string> = {
    CASH: COLORS.SUCCESS, UPI: COLORS.PRIMARY, CARD: '#2980B9',
    UDHAAR: COLORS.ERROR, SPLIT: '#9B59B6',
};

interface Props {
    customer: Customer;
    onBack: () => void;
}

// ── Edit Customer Modal ────────────────────────────────────────────────
const EditCustomerModal = ({
    customer, visible, onClose, onSaved,
}: { customer: Customer; visible: boolean; onClose: () => void; onSaved: (updated: Customer) => void }) => {
    const [name, setName] = useState(customer.name);
    const [phone, setPhone] = useState(customer.phone);
    const [whatsapp, setWhatsapp] = useState(customer.whatsappNumber);
    const [houseNo, setHouseNo] = useState(customer.houseNo || '');
    const [type, setType] = useState<CustomerType>(customer.type);
    const [creditLimit, setCreditLimit] = useState(String(customer.creditLimit));
    const [notes, setNotes] = useState(customer.notes || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
        if (!phone.trim() || phone.length < 10) { Alert.alert('Error', 'Valid 10-digit phone required'); return; }
        setSaving(true);
        try {
            const updates: Partial<Customer> = {
                name: name.trim(), phone: phone.trim(),
                whatsappNumber: whatsapp.trim() || `91${phone.trim()}`,
                houseNo: houseNo.trim() || undefined,
                type, creditLimit: Number(creditLimit) || customer.creditLimit,
                notes: notes.trim(),
            };
            await updateCustomer(customer.id, updates);
            onSaved({ ...customer, ...updates });
            onClose();
        } catch {
            Alert.alert('Error', 'Failed to save changes');
        }
        setSaving(false);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={edit.overlay}>
                <View style={edit.sheet}>
                    <View style={edit.header}>
                        <Text style={edit.title}>Edit Customer</Text>
                        <TouchableOpacity onPress={onClose}><Text style={edit.closeBtn}>✕</Text></TouchableOpacity>
                    </View>
                    <ScrollView style={edit.form} showsVerticalScrollIndicator={false}>
                        <Text style={edit.label}>Name *</Text>
                        <TextInput style={edit.input} value={name} onChangeText={setName} placeholder="Customer name" placeholderTextColor={COLORS.TEXT_DIM} />
                        <Text style={edit.label}>Phone *</Text>
                        <TextInput style={edit.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} placeholder="10-digit phone" placeholderTextColor={COLORS.TEXT_DIM} />
                        <Text style={edit.label}>WhatsApp</Text>
                        <TextInput style={edit.input} value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="91XXXXXXXXXX" placeholderTextColor={COLORS.TEXT_DIM} />
                        <Text style={edit.label}>House / Address</Text>
                        <TextInput style={edit.input} value={houseNo} onChangeText={setHouseNo} placeholder="H-12, Street" placeholderTextColor={COLORS.TEXT_DIM} />
                        <Text style={edit.label}>Customer Type</Text>
                        <View style={edit.typeRow}>
                            {TYPES.map(t => (
                                <TouchableOpacity key={t.key} style={[edit.typeCard, type === t.key && edit.typeCardActive]} onPress={() => setType(t.key)}>
                                    <Text style={edit.typeIcon}>{t.icon}</Text>
                                    <Text style={[edit.typeLabel, type === t.key && { color: COLORS.PRIMARY, fontWeight: '700' }]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={edit.label}>Credit Limit (₹)</Text>
                        <TextInput style={edit.input} value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" placeholder="2000" placeholderTextColor={COLORS.TEXT_DIM} />
                        <Text style={edit.label}>Notes</Text>
                        <TextInput style={[edit.input, { height: 72, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Internal notes..." placeholderTextColor={COLORS.TEXT_DIM} />
                    </ScrollView>
                    <TouchableOpacity style={[edit.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                        <Text style={edit.saveBtnText}>{saving ? 'Saving...' : '✅ Save Changes'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ── Main Profile Screen ────────────────────────────────────────────────
const CustomerProfileScreen = ({ customer: initialCustomer, onBack }: Props) => {
    const [customer, setCustomer] = useState(initialCustomer);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'computer' | 'handwritten' | 'audio'>('all');
    const [showEdit, setShowEdit] = useState(false);

    useEffect(() => {
        getCustomerTransactions(customer.id)
            .then(txns => { setTransactions(txns); setLoading(false); })
            .catch(() => setLoading(false));
    }, [customer.id]);

    const filtered = activeTab === 'all'
        ? transactions
        : transactions.filter(t => (t as any).source === activeTab);

    const totalSpent = transactions.reduce((s, t) => s + t.grandTotal, 0);
    const outstanding = customer.totalOutstanding;

    const getSource = (t: Transaction) => {
        const src = (t as any).source as string | undefined;
        return SOURCE_LABELS[src || 'unknown'] || SOURCE_LABELS.unknown;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                    <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Customer Profile</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
                    <Text style={styles.editBtnText}>✎ Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileTop}>
                        <View style={[styles.avatar, { backgroundColor: TYPE_COLORS[customer.type] || COLORS.PRIMARY }]}>
                            {customer.photoUrl ? (
                                <Image source={{ uri: customer.photoUrl }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
                            )}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{customer.name}</Text>
                            <Text style={styles.profileId}>📓 {customer.udhaarId}</Text>
                            <Text style={styles.profilePhone}>📱 {customer.phone}</Text>
                            {customer.houseNo ? <Text style={styles.profilePhone}>🏠 {customer.houseNo}</Text> : null}
                            <View style={[styles.typeBadge, { backgroundColor: (TYPE_COLORS[customer.type] || COLORS.PRIMARY) + '22' }]}>
                                <Text style={[styles.typeText, { color: TYPE_COLORS[customer.type] || COLORS.PRIMARY }]}>
                                    {customer.type.replace('_', ' ').toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{transactions.length}</Text>
                            <Text style={styles.statLabel}>Bills</Text>
                        </View>
                        <View style={[styles.statBox, styles.statDivider]}>
                            <Text style={[styles.statValue, { color: COLORS.PRIMARY }]}>{formatCurrency(totalSpent)}</Text>
                            <Text style={styles.statLabel}>Total Spent</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: outstanding > 0 ? COLORS.ERROR : COLORS.SUCCESS }]}>
                                {formatCurrency(outstanding)}
                            </Text>
                            <Text style={styles.statLabel}>Outstanding</Text>
                        </View>
                    </View>

                    {/* Credit Bar */}
                    <View style={styles.creditRow}>
                        <Text style={styles.creditLabel}>Credit Limit: {formatCurrency(customer.creditLimit)}</Text>
                        <Text style={styles.creditLabel}>{formatCurrency(outstanding)} used</Text>
                    </View>
                    <View style={styles.creditBarBg}>
                        <View style={[styles.creditBarFill, {
                            width: `${Math.min(100, (outstanding / customer.creditLimit) * 100)}%` as any,
                            backgroundColor: outstanding > customer.creditLimit * 0.8 ? COLORS.ERROR : COLORS.SUCCESS,
                        }]} />
                    </View>

                    {customer.notes ? (
                        <View style={styles.notesBox}>
                            <Text style={styles.notesText}>📝 {customer.notes}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Filter Tabs */}
                <View style={styles.tabRow}>
                    {(['all', 'computer', 'handwritten', 'audio'] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}>
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab === 'all' ? '📋 All' : SOURCE_LABELS[tab].icon + ' ' + SOURCE_LABELS[tab].label.split(' ')[0]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Transaction History */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Transaction History</Text>
                    {loading ? (
                        <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 20 }} />
                    ) : filtered.length === 0 ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyIcon}>🧾</Text>
                            <Text style={styles.emptyText}>No transactions found</Text>
                        </View>
                    ) : (
                        filtered.map(txn => {
                            const src = getSource(txn);
                            return (
                                <View key={txn.id} style={styles.txnCard}>
                                    <View style={styles.txnTop}>
                                        <View style={styles.txnLeft}>
                                            <View style={[styles.srcBadge, { backgroundColor: src.color + '18' }]}>
                                                <Text style={styles.srcIcon}>{src.icon}</Text>
                                                <Text style={[styles.srcLabel, { color: src.color }]}>{src.label}</Text>
                                            </View>
                                            <Text style={styles.txnBillNo}>{txn.billNo}</Text>
                                        </View>
                                        <View style={styles.txnRight}>
                                            <Text style={[styles.txnAmount, { color: COLORS.PRIMARY }]}>{formatCurrency(txn.grandTotal)}</Text>
                                            <View style={[styles.payBadge, { backgroundColor: (PAYMENT_COLORS[txn.paymentType] || COLORS.TEXT_DIM) + '22' }]}>
                                                <Text style={[styles.payText, { color: PAYMENT_COLORS[txn.paymentType] || COLORS.TEXT_DIM }]}>{txn.paymentType}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <Text style={styles.txnDate}>
                                        {new Date(txn.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    <View style={styles.itemsBox}>
                                        {txn.items.map((item, i) => (
                                            <View key={i} style={styles.itemRow}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={styles.itemDetail}>{item.qty} {item.unit} · {formatCurrency(item.total)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Edit Modal */}
            <EditCustomerModal
                customer={customer}
                visible={showEdit}
                onClose={() => setShowEdit(false)}
                onSaved={updated => setCustomer(updated)}
            />
        </View>
    );
};

const edit = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT_HEADING },
    closeBtn: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    form: { padding: SPACING.BASE },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_DIM, marginTop: SPACING.SM, marginBottom: 4 },
    input: { backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 10, color: COLORS.TEXT_BODY, borderWidth: 1, borderColor: COLORS.BORDER },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.XS },
    typeCard: { width: '31%', padding: SPACING.SM, borderRadius: RADIUS.MD, borderWidth: 1, borderColor: COLORS.BORDER, alignItems: 'center', backgroundColor: COLORS.BACKGROUND },
    typeCardActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '15' },
    typeIcon: { fontSize: 20, marginBottom: 2 },
    typeLabel: { fontSize: 10, color: COLORS.TEXT_DIM, textAlign: 'center' },
    saveBtn: { backgroundColor: COLORS.PRIMARY, margin: SPACING.BASE, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center' },
    saveBtnText: { color: COLORS.WHITE, fontSize: 16, fontWeight: '700' },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.WHITE, paddingHorizontal: SPACING.MD, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    backBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: RADIUS.MD, backgroundColor: COLORS.BACKGROUND },
    backBtnText: { color: COLORS.PRIMARY, fontWeight: '700', fontSize: 15 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT_HEADING },
    editBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.MD, backgroundColor: COLORS.PRIMARY + '18', borderWidth: 1, borderColor: COLORS.PRIMARY },
    editBtnText: { color: COLORS.PRIMARY, fontWeight: '700', fontSize: 13 },
    profileCard: { margin: SPACING.BASE, backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG, padding: SPACING.BASE, elevation: 2 },
    profileTop: { flexDirection: 'row', gap: SPACING.MD, marginBottom: SPACING.LG },
    avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: 72, height: 72, borderRadius: 36 },
    avatarText: { color: '#fff', fontWeight: '800', fontSize: 28 },
    profileInfo: { flex: 1, justifyContent: 'center' },
    profileName: { fontSize: 20, fontWeight: '800', color: COLORS.TEXT_HEADING, marginBottom: 2 },
    profileId: { fontSize: 13, color: COLORS.TEXT_DIM, marginBottom: 2 },
    profilePhone: { fontSize: 13, color: COLORS.TEXT_DIM, marginBottom: 2 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
    typeText: { fontSize: 10, fontWeight: '700' },
    statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.BORDER, paddingTop: SPACING.MD, marginBottom: SPACING.MD },
    statBox: { flex: 1, alignItems: 'center' },
    statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderLeftColor: COLORS.BORDER, borderRightColor: COLORS.BORDER },
    statValue: { fontSize: 17, fontWeight: '800', color: COLORS.TEXT_HEADING },
    statLabel: { fontSize: 11, color: COLORS.TEXT_DIM, marginTop: 2 },
    creditRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    creditLabel: { fontSize: 11, color: COLORS.TEXT_DIM },
    creditBarBg: { height: 6, backgroundColor: COLORS.BORDER, borderRadius: 3, overflow: 'hidden' },
    creditBarFill: { height: 6, borderRadius: 3 },
    notesBox: { marginTop: SPACING.SM, padding: SPACING.SM, backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD },
    notesText: { fontSize: 13, color: COLORS.TEXT_BODY },
    tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.BASE, gap: SPACING.XS, marginBottom: SPACING.SM },
    tab: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.MD, borderWidth: 1, borderColor: COLORS.BORDER, alignItems: 'center', backgroundColor: COLORS.WHITE },
    tabActive: { backgroundColor: COLORS.PRIMARY + '18', borderColor: COLORS.PRIMARY },
    tabText: { fontSize: 11, color: COLORS.TEXT_DIM, fontWeight: '600' },
    tabTextActive: { color: COLORS.PRIMARY, fontWeight: '700' },
    section: { marginHorizontal: SPACING.BASE, marginBottom: SPACING.XL },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT_HEADING, marginBottom: SPACING.MD },
    empty: { alignItems: 'center', paddingVertical: SPACING.XL },
    emptyIcon: { fontSize: 40, marginBottom: SPACING.SM },
    emptyText: { color: COLORS.TEXT_DIM, fontSize: 15 },
    txnCard: { backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG, padding: SPACING.MD, marginBottom: SPACING.SM, elevation: 1 },
    txnTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    txnLeft: { flex: 1 },
    txnRight: { alignItems: 'flex-end' },
    srcBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start', gap: 4, marginBottom: 4 },
    srcIcon: { fontSize: 12 },
    srcLabel: { fontSize: 11, fontWeight: '700' },
    txnBillNo: { fontSize: 13, color: COLORS.TEXT_DIM },
    txnAmount: { fontSize: 18, fontWeight: '800' },
    payBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 2 },
    payText: { fontSize: 10, fontWeight: '700' },
    txnDate: { fontSize: 11, color: COLORS.TEXT_DIM, marginBottom: SPACING.SM },
    itemsBox: { borderTopWidth: 1, borderTopColor: COLORS.BORDER, paddingTop: SPACING.SM },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    itemName: { fontSize: 13, color: COLORS.TEXT_BODY },
    itemDetail: { fontSize: 13, color: COLORS.TEXT_DIM },
});

export default CustomerProfileScreen;
