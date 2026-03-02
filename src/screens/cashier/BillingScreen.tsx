import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView,
    Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import { useCart, CartItem } from '../../hooks/useCart';
import { useVoice } from '../../hooks/useVoice';
import { formatCurrency } from '../../utils/billingUtils';
import ProductPickerModal from '../../components/ProductPickerModal';
import { getCustomers, getProducts } from '../../services/firebase/firestoreService';
import { Customer } from '../../models/Customer';

const BILLERS_KEY = 'app_billers_list';

const DEFAULT_BILLERS = [
    { id: '1', name: 'Owner' },
    { id: '2', name: 'Cashier 1' },
    { id: '3', name: 'Cashier 2' },
    { id: '4', name: 'Accountant' },
];

const PAY_MODES = [
    { key: 'cash', label: 'Cash', icon: '💵', color: '#27ae60' },
    { key: 'upi', label: 'UPI', icon: '📱', color: COLORS.PRIMARY },
    { key: 'card', label: 'Card', icon: '💳', color: '#2980B9' },
    { key: 'udhaar', label: 'Udhaar', icon: '📓', color: COLORS.ERROR },
];

const ORDER_TYPES = [
    { key: 'in_store', label: 'In-Store', icon: '🏪' },
    { key: 'takeaway', label: 'Takeaway', icon: '🥡' },
    { key: 'delivery', label: 'Delivery', icon: '🛵' },
    { key: 'wholesale', label: 'Wholesale', icon: '📦' },
];

// ──────────────────────────────────────────────────────────────────────────────
// Biller Picker Modal
// ──────────────────────────────────────────────────────────────────────────────
const BillerPickerModal = ({
    visible, current, onClose, onSelect,
}: { visible: boolean; current: string; onClose: () => void; onSelect: (name: string) => void }) => {
    const [billers, setBillers] = useState(DEFAULT_BILLERS);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (visible) {
            AsyncStorage.getItem(BILLERS_KEY).then(raw => {
                if (raw) setBillers(JSON.parse(raw));
                else setBillers(DEFAULT_BILLERS);
            }).catch(() => setBillers(DEFAULT_BILLERS));
        }
    }, [visible]);

    const saveBillers = async (list: typeof DEFAULT_BILLERS) => {
        setBillers(list);
        await AsyncStorage.setItem(BILLERS_KEY, JSON.stringify(list));
    };

    const addBiller = async () => {
        if (!newName.trim()) return;
        const next = { id: String(Date.now()), name: newName.trim() };
        await saveBillers([...billers, next]);
        setNewName('');
    };

    const removeBiller = async (id: string) => {
        await saveBillers(billers.filter(b => b.id !== id));
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={bp.overlay}>
                <View style={bp.sheet}>
                    <View style={bp.header}>
                        <Text style={bp.title}>Select Biller</Text>
                        <TouchableOpacity onPress={onClose}><Text style={bp.close}>✕</Text></TouchableOpacity>
                    </View>

                    <ScrollView style={bp.list}>
                        {billers.map((b, i) => (
                            <View key={b.id} style={bp.row}>
                                <View style={bp.numBadge}>
                                    <Text style={bp.numText}>{i + 1}</Text>
                                </View>
                                <TouchableOpacity style={bp.nameBtn} onPress={() => { onSelect(b.name); onClose(); }}>
                                    <Text style={[bp.billerName, current === b.name && { color: COLORS.PRIMARY, fontWeight: '800' }]}>
                                        {b.name}
                                    </Text>
                                    {current === b.name && <Text style={bp.activeTag}>✓ Active</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => removeBiller(b.id)} style={bp.delBtn}>
                                    <Text style={bp.delText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={bp.addRow}>
                        <TextInput
                            style={bp.addInput}
                            placeholder="Add new biller name..."
                            placeholderTextColor={COLORS.TEXT_DIM}
                            value={newName}
                            onChangeText={setNewName}
                            onSubmitEditing={addBiller}
                        />
                        <TouchableOpacity style={[bp.addBtn, !newName.trim() && { opacity: 0.4 }]} onPress={addBiller} disabled={!newName.trim()}>
                            <Text style={bp.addBtnText}>+ Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// Customer Picker Modal  (existing customers + walk-in with name & phone)
// ──────────────────────────────────────────────────────────────────────────────
const CustomerPickerModal = ({
    visible, onClose, onSelect,
}: {
    visible: boolean;
    onClose: () => void;
    onSelect: (c: Customer | null, name: string, phone: string) => void;
}) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [walkName, setWalkName] = useState('');
    const [walkPhone, setWalkPhone] = useState('');

    useEffect(() => {
        if (visible) getCustomers().then(setCustomers).catch(() => { });
    }, [visible]);

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.udhaarId.toLowerCase().includes(search.toLowerCase())
    );

    const handleWalkIn = () => {
        if (!walkName.trim()) { Alert.alert('Name required', 'Please enter the customer name.'); return; }
        if (!walkPhone.trim() || walkPhone.trim().length < 10) { Alert.alert('Phone required', 'Please enter a valid 10-digit phone number.'); return; }
        onSelect(null, walkName.trim(), walkPhone.trim());
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={cp.overlay}>
                <View style={cp.sheet}>
                    <View style={cp.header}>
                        <Text style={cp.title}>Select Customer</Text>
                        <TouchableOpacity onPress={onClose}><Text style={cp.close}>✕</Text></TouchableOpacity>
                    </View>

                    {/* Walk-in */}
                    <View style={cp.walkInBox}>
                        <Text style={cp.walkInLabel}>🚶 Walk-in Customer</Text>
                        <TextInput
                            style={cp.walkInInput}
                            placeholder="Customer name *"
                            placeholderTextColor={COLORS.TEXT_DIM}
                            value={walkName}
                            onChangeText={setWalkName}
                        />
                        <View style={cp.walkInRow}>
                            <TextInput
                                style={[cp.walkInInput, { flex: 1, marginBottom: 0 }]}
                                placeholder="Phone number (10 digits) *"
                                placeholderTextColor={COLORS.TEXT_DIM}
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={walkPhone}
                                onChangeText={setWalkPhone}
                            />
                            <TouchableOpacity style={cp.walkInBtn} onPress={handleWalkIn}>
                                <Text style={cp.walkInBtnText}>Use →</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={cp.orDivider}>── or pick from registered customers ──</Text>

                    <TextInput
                        style={cp.search}
                        placeholder="🔍  Search name, phone, ID..."
                        placeholderTextColor={COLORS.TEXT_DIM}
                        value={search}
                        onChangeText={setSearch}
                    />

                    <ScrollView style={cp.list}>
                        {filtered.map(c => (
                            <TouchableOpacity key={c.id} style={cp.row} onPress={() => { onSelect(c, c.name, c.phone); onClose(); }}>
                                <View style={cp.avatar}>
                                    <Text style={cp.avatarText}>{c.name.charAt(0)}</Text>
                                </View>
                                <View style={cp.rowInfo}>
                                    <Text style={cp.rowName}>{c.name}</Text>
                                    <Text style={cp.rowSub}>{c.udhaarId} · {c.phone}</Text>
                                </View>
                                {c.totalOutstanding > 0 && (
                                    <Text style={cp.rowDebt}>{formatCurrency(c.totalOutstanding)} due</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                        {filtered.length === 0 && search.length > 0 && (
                            <Text style={cp.noResult}>No match — use walk-in above</Text>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// Voice Input Modal
// ──────────────────────────────────────────────────────────────────────────────
const VoiceInputModal = ({
    visible, onClose, onCommand,
}: { visible: boolean; onClose: () => void; onCommand: (text: string) => void }) => {
    const { isListening, interimText, recognizedText, hasSpeechAPI, startListening, stopListening, parseCommand } = useVoice();
    const [manualText, setManualText] = useState('');
    const [status, setStatus] = useState<'idle' | 'listening' | 'done'>('idle');
    const [heard, setHeard] = useState('');

    useEffect(() => {
        if (visible) { setStatus('idle'); setHeard(''); setManualText(''); }
    }, [visible]);

    const startListeningFlow = async () => {
        setStatus('listening');
        setHeard('');
        try {
            const text = await startListening();
            setHeard(text);
            setStatus('done');
        } catch {
            setStatus('idle');
        }
    };

    const handleConfirm = (text: string) => {
        if (!text.trim()) return;
        onCommand(text.trim());
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={vi.overlay}>
                <View style={vi.sheet}>
                    <View style={vi.header}>
                        <Text style={vi.title}>🎙️ Voice Input</Text>
                        <TouchableOpacity onPress={() => { stopListening(); onClose(); }}>
                            <Text style={vi.close}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={vi.body}>
                        {/* Mic animation area */}
                        <TouchableOpacity
                            style={[vi.micBtn, isListening && vi.micBtnActive]}
                            onPress={status === 'idle' ? startListeningFlow : undefined}
                            disabled={isListening}>
                            <Text style={vi.micIcon}>🎙️</Text>
                        </TouchableOpacity>

                        <Text style={vi.statusText}>
                            {status === 'idle' ? (hasSpeechAPI ? 'Tap mic to speak' : 'Type command below') :
                                status === 'listening' ? '🔴 Listening...' : '✅ Got it!'}
                        </Text>

                        {/* Realtime interim text */}
                        {isListening && interimText ? (
                            <View style={vi.interimBox}>
                                <Text style={vi.interimText}>"{interimText}"</Text>
                            </View>
                        ) : null}

                        {/* Final recognized text */}
                        {status === 'done' && heard ? (
                            <View style={vi.heardBox}>
                                <Text style={vi.heardLabel}>Heard:</Text>
                                <Text style={vi.heardText}>"{heard}"</Text>
                                <TouchableOpacity style={vi.useBtn} onPress={() => handleConfirm(heard)}>
                                    <Text style={vi.useBtnText}>✅ Use this command</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={vi.retryBtn} onPress={startListeningFlow}>
                                    <Text style={vi.retryBtnText}>🔁 Try again</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        <View style={vi.divider}>
                            <View style={vi.dividerLine} />
                            <Text style={vi.dividerText}>or type manually</Text>
                            <View style={vi.dividerLine} />
                        </View>

                        {/* Manual text input */}
                        <View style={vi.inputRow}>
                            <TextInput
                                style={vi.input}
                                placeholder='e.g. "Add 2 kg Basmati Rice"'
                                placeholderTextColor={COLORS.TEXT_DIM}
                                value={manualText}
                                onChangeText={setManualText}
                                onSubmitEditing={() => handleConfirm(manualText)}
                            />
                            <TouchableOpacity
                                style={[vi.sendBtn, !manualText.trim() && { opacity: 0.4 }]}
                                onPress={() => handleConfirm(manualText)}
                                disabled={!manualText.trim()}>
                                <Text style={vi.sendBtnText}>→</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={vi.hint}>Try: "Add 2 kg Basmati Rice" · "Add sugar 1 kg"</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const vi = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 17, fontWeight: '700', color: COLORS.TEXT_HEADING },
    close: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    body: { padding: SPACING.LG, alignItems: 'center' },
    micBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.PRIMARY, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.MD, elevation: 4 },
    micBtnActive: { backgroundColor: COLORS.ERROR, transform: [{ scale: 1.1 }] },
    micIcon: { fontSize: 36 },
    statusText: { fontSize: 15, color: COLORS.TEXT_DIM, marginBottom: SPACING.SM, fontWeight: '600' },
    interimBox: { backgroundColor: COLORS.PRIMARY + '12', borderRadius: RADIUS.MD, padding: SPACING.SM, width: '100%', marginBottom: SPACING.SM },
    interimText: { color: COLORS.PRIMARY, fontStyle: 'italic', fontSize: 14, textAlign: 'center' },
    heardBox: { width: '100%', alignItems: 'center', marginBottom: SPACING.MD },
    heardLabel: { fontSize: 11, color: COLORS.TEXT_DIM, fontWeight: '700', textTransform: 'uppercase' },
    heardText: { fontSize: 16, color: COLORS.TEXT_HEADING, fontWeight: '700', marginVertical: SPACING.SM, textAlign: 'center' },
    useBtn: { backgroundColor: COLORS.SUCCESS, paddingHorizontal: SPACING.LG, paddingVertical: SPACING.SM, borderRadius: RADIUS.LG, marginBottom: SPACING.SM, width: '100%', alignItems: 'center' },
    useBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    retryBtn: { paddingVertical: 6 },
    retryBtnText: { color: COLORS.TEXT_DIM, fontSize: 13 },
    divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: SPACING.MD, gap: SPACING.SM },
    dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.BORDER },
    dividerText: { fontSize: 11, color: COLORS.TEXT_DIM },
    inputRow: { flexDirection: 'row', width: '100%', gap: SPACING.SM, marginBottom: SPACING.SM },
    input: { flex: 1, backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.BORDER, color: COLORS.TEXT_BODY, fontSize: 14 },
    sendBtn: { backgroundColor: COLORS.PRIMARY, width: 44, borderRadius: RADIUS.MD, justifyContent: 'center', alignItems: 'center' },
    sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
    hint: { fontSize: 11, color: COLORS.TEXT_DIM, textAlign: 'center', marginTop: SPACING.XS, marginBottom: SPACING.MD },
});

// ──────────────────────────────────────────────────────────────────────────────
// Item Edit Modal  (long-press a cart row to open)
// ──────────────────────────────────────────────────────────────────────────────
type ItemDiscount = { type: 'pct' | 'flat'; value: number };

const ItemEditModal = ({
    item, discount, note, onClose, onSave,
}: {
    item: CartItem;
    discount?: ItemDiscount;
    note: string;
    onClose: () => void;
    onSave: (disc: ItemDiscount, note: string) => void;
}) => {
    const [discType, setDiscType] = useState<'pct' | 'flat'>(discount?.type ?? 'flat');
    const [discValue, setDiscValue] = useState(discount?.value ? String(discount.value) : '');
    const [noteText, setNoteText] = useState(note);

    const rawTotal = item.product.price * item.quantity;
    const discNum = parseFloat(discValue) || 0;
    const saving = discType === 'pct' ? rawTotal * (discNum / 100) : Math.min(discNum, rawTotal);
    const effectiveTotal = rawTotal - saving;

    const handleSave = () => {
        onSave({ type: discType, value: discNum }, noteText.trim());
    };

    const handleClear = () => {
        onSave({ type: 'flat', value: 0 }, '');
    };

    return (
        <Modal visible animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ie.overlay}>
                <View style={ie.sheet}>
                    <View style={ie.header}>
                        <Text style={ie.title} numberOfLines={1}>✏️ {item.product.name}</Text>
                        <TouchableOpacity onPress={onClose}><Text style={ie.close}>✕</Text></TouchableOpacity>
                    </View>

                    <View style={ie.body}>
                        {/* Price preview */}
                        <View style={ie.pricePreview}>
                            <View style={ie.priceBox}>
                                <Text style={ie.priceLabel}>Unit Price</Text>
                                <Text style={ie.priceVal}>{formatCurrency(item.product.price)}</Text>
                            </View>
                            <View style={ie.priceBox}>
                                <Text style={ie.priceLabel}>Qty</Text>
                                <Text style={ie.priceVal}>{item.quantity} {item.product.unit}</Text>
                            </View>
                            <View style={ie.priceBox}>
                                <Text style={ie.priceLabel}>Line Total</Text>
                                <Text style={ie.priceVal}>{formatCurrency(rawTotal)}</Text>
                            </View>
                        </View>

                        {/* Discount */}
                        <Text style={ie.sectionLabel}>🏷️ Item Discount</Text>
                        <View style={ie.discRow}>
                            <View style={ie.discTypeToggle}>
                                <TouchableOpacity
                                    style={[ie.discTypeBtn, discType === 'flat' && ie.discTypeBtnActive]}
                                    onPress={() => setDiscType('flat')}>
                                    <Text style={[ie.discTypeText, discType === 'flat' && ie.discTypeTextActive]}>₹ Flat</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[ie.discTypeBtn, discType === 'pct' && ie.discTypeBtnActive]}
                                    onPress={() => setDiscType('pct')}>
                                    <Text style={[ie.discTypeText, discType === 'pct' && ie.discTypeTextActive]}>% Off</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={ie.discInputWrap}>
                                <Text style={ie.discPrefix}>{discType === 'flat' ? '₹' : ''}</Text>
                                <TextInput
                                    style={ie.discInput}
                                    placeholder="0"
                                    placeholderTextColor={COLORS.TEXT_DIM}
                                    keyboardType="numeric"
                                    value={discValue}
                                    onChangeText={setDiscValue}
                                    autoFocus
                                />
                                {discType === 'pct' && <Text style={ie.discSuffix}>%</Text>}
                            </View>
                        </View>

                        {/* Live effective total */}
                        {discNum > 0 && (
                            <View style={ie.effectiveBox}>
                                <Text style={ie.effectiveLabel}>Saving: {formatCurrency(saving)}</Text>
                                <Text style={ie.effectiveVal}>→ {formatCurrency(effectiveTotal)}</Text>
                            </View>
                        )}

                        {/* Note */}
                        <Text style={ie.sectionLabel}>📝 Item Note <Text style={ie.sectionHint}>(optional)</Text></Text>
                        <TextInput
                            style={ie.noteInput}
                            placeholder='e.g. "No onion", "Extra spicy", "Half pack"'
                            placeholderTextColor={COLORS.TEXT_DIM}
                            value={noteText}
                            onChangeText={setNoteText}
                            maxLength={80}
                        />
                    </View>

                    <View style={ie.footer}>
                        <TouchableOpacity style={ie.clearBtn} onPress={handleClear}>
                            <Text style={ie.clearBtnText}>🗑️ Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={ie.saveBtn} onPress={handleSave}>
                            <Text style={ie.saveBtnText}>✅ Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const ie = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 16, fontWeight: '800', color: COLORS.TEXT_HEADING, flex: 1, marginRight: SPACING.SM },
    close: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    body: { padding: SPACING.BASE, gap: SPACING.SM },
    pricePreview: { flexDirection: 'row', gap: SPACING.SM, marginBottom: SPACING.SM },
    priceBox: { flex: 1, backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, padding: SPACING.SM, alignItems: 'center' },
    priceLabel: { fontSize: 10, color: COLORS.TEXT_DIM, fontWeight: '700', textTransform: 'uppercase' },
    priceVal: { fontSize: 13, fontWeight: '800', color: COLORS.TEXT_HEADING, marginTop: 2 },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.TEXT_HEADING },
    sectionHint: { fontSize: 11, color: COLORS.TEXT_DIM, fontWeight: '400' },
    discRow: { flexDirection: 'row', gap: SPACING.SM, alignItems: 'center' },
    discTypeToggle: { flexDirection: 'row', borderRadius: RADIUS.MD, overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.PRIMARY },
    discTypeBtn: { paddingHorizontal: SPACING.MD, paddingVertical: 8, backgroundColor: 'transparent' },
    discTypeBtnActive: { backgroundColor: COLORS.PRIMARY },
    discTypeText: { fontSize: 13, fontWeight: '700', color: COLORS.PRIMARY },
    discTypeTextActive: { color: '#fff' },
    discInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.BORDER, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.SM, backgroundColor: COLORS.BACKGROUND },
    discPrefix: { fontSize: 16, color: COLORS.TEXT_DIM, marginRight: 4 },
    discInput: { flex: 1, fontSize: 20, fontWeight: '800', color: COLORS.TEXT_HEADING, paddingVertical: 8 },
    discSuffix: { fontSize: 16, color: COLORS.TEXT_DIM, marginLeft: 4 },
    effectiveBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.SUCCESS + '15', borderRadius: RADIUS.MD, padding: SPACING.SM, alignItems: 'center' },
    effectiveLabel: { fontSize: 13, color: COLORS.SUCCESS, fontWeight: '600' },
    effectiveVal: { fontSize: 16, fontWeight: '800', color: COLORS.SUCCESS },
    noteInput: { backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.BORDER, color: COLORS.TEXT_BODY, fontSize: 14, marginBottom: SPACING.SM },
    footer: { flexDirection: 'row', gap: SPACING.SM, padding: SPACING.BASE, borderTopWidth: 1, borderTopColor: COLORS.BORDER },
    clearBtn: { flex: 1, paddingVertical: SPACING.MD, borderRadius: RADIUS.LG, borderWidth: 1.5, borderColor: COLORS.ERROR, alignItems: 'center' },
    clearBtnText: { color: COLORS.ERROR, fontWeight: '700', fontSize: 14 },
    saveBtn: { flex: 2, paddingVertical: SPACING.MD, borderRadius: RADIUS.LG, backgroundColor: COLORS.PRIMARY, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

// ──────────────────────────────────────────────────────────────────────────────
// Main Billing Screen
// ──────────────────────────────────────────────────────────────────────────────
const BillingScreen = ({ role }: { role?: string }) => {
    const defaultBiller = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'Staff';
    const { items, customer, setCustomer, addItem, removeItem, updateQty, checkout, totals, billNo } = useCart('cashier-1', '');

    const [sellerName, setSellerName] = useState(defaultBiller);
    const [customerDisplayName, setCustomerDisplayName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [orderType, setOrderType] = useState('in_store');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [showCustomerPicker, setShowCustomerPicker] = useState(false);
    const [showBillerPicker, setShowBillerPicker] = useState(false);
    const [showVoice, setShowVoice] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Per-item discounts & notes
    const [itemDiscounts, setItemDiscounts] = useState<Record<string, { type: 'pct' | 'flat'; value: number }>>({});
    const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);

    // Bill-level discount
    const [billDiscount, setBillDiscount] = useState('');
    const [billDiscountType, setBillDiscountType] = useState<'pct' | 'flat'>('flat');

    // Computed: item-level discount savings
    const itemDiscountSavings = items.reduce((acc, item) => {
        const d = itemDiscounts[item.product.id];
        if (!d || d.value <= 0) return acc;
        const lineTotal = item.product.price * item.quantity;
        const saving = d.type === 'pct' ? lineTotal * (d.value / 100) : Math.min(d.value, lineTotal);
        return acc + saving;
    }, 0);

    // Computed: bill-level discount savings
    const billDiscountNum = parseFloat(billDiscount) || 0;
    const billDiscountSaving = billDiscountType === 'pct'
        ? (totals.grandTotal - itemDiscountSavings) * (billDiscountNum / 100)
        : Math.min(billDiscountNum, totals.grandTotal - itemDiscountSavings);
    const totalSavings = itemDiscountSavings + billDiscountSaving;
    const discountedGrandTotal = Math.max(0, totals.grandTotal - totalSavings);

    // Voice command handler (called by VoiceInputModal)
    const handleVoiceCommand = useCallback(async (text: string) => {
        try {
            const { parseCommand } = useVoiceRef.current!;
            const cmd = await parseCommand(text);
            if (cmd?.action === 'ADD' && cmd.item) {
                const allProducts = await getProducts();
                const match = allProducts.find(p =>
                    p.name.toLowerCase().includes(cmd.item.toLowerCase()) && p.currentStock > 0
                );
                if (match) {
                    addItem(match, cmd.qty || 1);
                    Alert.alert('✅ Added to bill', `${cmd.qty || 1} ${match.unit} of ${match.name}`);
                } else {
                    Alert.alert('Not found', `No product matched "${cmd.item}". Add manually.`);
                }
            } else {
                Alert.alert('Not understood', 'Try: "Add 2 kg Basmati Rice"');
            }
        } catch {
            Alert.alert('Error', 'Could not process the command.');
        }
    }, [addItem]);

    // Ref wrapper so VoiceInputModal can call parseCommand without re-mounting
    const useVoiceRef = useRef<ReturnType<typeof useVoice> | null>(null);
    const voiceHook = useVoice();
    useEffect(() => { useVoiceRef.current = voiceHook; });

    // Payment state
    const [splitMode, setSplitMode] = useState(false);
    const [singlePayment, setSinglePayment] = useState('CASH');
    const [splitAmts, setSplitAmts] = useState({ cash: 0, upi: 0, card: 0, udhaar: 0 });

    const splitTotal = splitAmts.cash + splitAmts.upi + splitAmts.card + splitAmts.udhaar;
    const splitBalance = totals.grandTotal - splitTotal;
    const splitValid = splitTotal >= totals.grandTotal - 0.01;

    const handleCustomerSelect = useCallback((c: Customer | null, name: string, phone: string) => {
        if (c) setCustomer(c);
        setCustomerDisplayName(name);
        setCustomerPhone(phone);
    }, [setCustomer]);

    const handleCheckout = async () => {
        if (items.length === 0) { Alert.alert('Empty Cart', 'Add items first.'); return; }
        if (!customerDisplayName.trim()) { Alert.alert('Customer Required', 'Please enter or select a customer.'); return; }
        if (!sellerName.trim()) { Alert.alert('Biller Required', 'Please select or enter the biller name.'); return; }
        if (splitMode && !splitValid) {
            Alert.alert('Incomplete Payment', `₹${splitBalance.toFixed(2)} still pending.`); return;
        }
        setShowCheckout(true);
    };

    // Helper: get effective line total after item discount
    const getEffectiveLineTotal = (item: CartItem) => {
        const raw = item.product.price * item.quantity;
        const d = itemDiscounts[item.product.id];
        if (!d || d.value <= 0) return raw;
        const saving = d.type === 'pct' ? raw * (d.value / 100) : Math.min(d.value, raw);
        return raw - saving;
    };

    const handleConfirmBill = async () => {
        setIsCheckingOut(true);
        try {
            const split = splitMode ? splitAmts : undefined;
            const payType = splitMode
                ? (Object.entries(splitAmts).find(([, v]) => v > 0)?.[0]?.toUpperCase() || 'CASH')
                : singlePayment;
            await checkout(payType, split, orderType, orderType === 'delivery' ? deliveryAddress : undefined);
            setShowCheckout(false);
            Alert.alert('✅ Bill Created!',
                `${billNo}\nCustomer: ${customerDisplayName}\nBiller: ${sellerName}\nTotal: ${formatCurrency(discountedGrandTotal)}`
            );
            // Reset everything
            setCustomerDisplayName('');
            setCustomerPhone('');
            setOrderType('in_store');
            setDeliveryAddress('');
            setSplitAmts({ cash: 0, upi: 0, card: 0, udhaar: 0 });
            setItemDiscounts({});
            setItemNotes({});
            setBillDiscount('');
        } catch {
            Alert.alert('Error', 'Failed to generate bill.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>New Bill</Text>
                        {items.length > 0 && (
                            <View style={styles.itemCountBadge}>
                                <Text style={styles.itemCountText}>{items.length}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.billNo}>{billNo}</Text>
                </View>
                <View style={styles.headerBtns}>
                    <TouchableOpacity
                        style={styles.voiceBtn}
                        onPress={() => setShowVoice(true)}>
                        <Text style={styles.voiceBtnIcon}>🎙️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addItemBtn} onPress={() => setShowPicker(true)}>
                        <Text style={styles.addItemBtnText}>+ Add Item</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Customer & Biller info bar */}
            <View style={styles.infoBar}>
                {/* Customer */}
                <TouchableOpacity style={styles.infoField} onPress={() => setShowCustomerPicker(true)}>
                    <Text style={styles.infoFieldIcon}>👤</Text>
                    <View style={styles.infoFieldText}>
                        <Text style={styles.infoFieldLabel}>Customer</Text>
                        <Text style={[styles.infoFieldVal, !customerDisplayName && { color: COLORS.TEXT_DIM }]}>
                            {customerDisplayName || 'Tap to select...'}
                        </Text>
                        {customerPhone ? <Text style={styles.infoFieldSub}>📱 {customerPhone}</Text> : null}
                    </View>
                    <Text style={styles.infoFieldEdit}>›</Text>
                </TouchableOpacity>

                <View style={styles.infoDivider} />

                {/* Biller — tap to pick from list */}
                <TouchableOpacity style={styles.infoField} onPress={() => setShowBillerPicker(true)}>
                    <Text style={styles.infoFieldIcon}>🧑‍💼</Text>
                    <View style={styles.infoFieldText}>
                        <Text style={styles.infoFieldLabel}>Biller</Text>
                        <Text style={[styles.infoFieldVal, !sellerName && { color: COLORS.TEXT_DIM }]}>
                            {sellerName || 'Tap to select...'}
                        </Text>
                    </View>
                    <Text style={styles.infoFieldEdit}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Order Type */}
            <View style={styles.orderTypeBar}>
                {ORDER_TYPES.map(ot => (
                    <TouchableOpacity
                        key={ot.key}
                        style={[styles.orderChip, orderType === ot.key && styles.orderChipActive]}
                        onPress={() => setOrderType(ot.key)}>
                        <Text style={styles.orderChipIcon}>{ot.icon}</Text>
                        <Text style={[styles.orderChipText, orderType === ot.key && styles.orderChipTextActive]}>
                            {ot.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {orderType === 'delivery' && (
                <View style={styles.deliveryBox}>
                    <Text style={styles.deliveryIcon}>📍</Text>
                    <TextInput
                        style={styles.deliveryInput}
                        placeholder="Delivery address..."
                        placeholderTextColor={COLORS.TEXT_DIM}
                        value={deliveryAddress}
                        onChangeText={setDeliveryAddress}
                        multiline
                    />
                </View>
            )}

            {/* Cart Items */}
            <FlatList
                data={items}
                keyExtractor={item => item.product.id}
                contentContainerStyle={styles.cartList}
                renderItem={({ item }: { item: CartItem }) => {
                    const disc = itemDiscounts[item.product.id];
                    const note = itemNotes[item.product.id];
                    const rawLineTotal = item.product.price * item.quantity;
                    const effectiveTotal = getEffectiveLineTotal(item);
                    const hasDiscount = disc && disc.value > 0;
                    return (
                        <TouchableOpacity
                            style={styles.cartItem}
                            onLongPress={() => setEditingItem(item)}
                            activeOpacity={0.85}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.product.name}</Text>
                                <Text style={styles.itemMeta}>
                                    {formatCurrency(item.product.price)} · GST {item.product.gstPercent}%
                                    {hasDiscount ? (
                                        disc.type === 'pct'
                                            ? `  🏷️ −${disc.value}%`
                                            : `  🏷️ −₹${disc.value}`
                                    ) : ''}
                                </Text>
                                {note ? <Text style={styles.itemNote}>📝 {note}</Text> : null}
                            </View>
                            <View style={styles.qtyRow}>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.product.id, item.quantity - 1)}>
                                    <Text style={styles.qtyBtnText}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.qtyVal}>{item.quantity} {item.product.unit}</Text>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.product.id, item.quantity + 1)}>
                                    <Text style={styles.qtyBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.itemTotalCol}>
                                {hasDiscount && (
                                    <Text style={styles.itemTotalStrike}>{formatCurrency(rawLineTotal)}</Text>
                                )}
                                <Text style={[styles.itemTotal, hasDiscount && { color: COLORS.SUCCESS }]}>{formatCurrency(effectiveTotal)}</Text>
                            </View>
                            <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.product.id)}>
                                <Text style={styles.removeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyCart}>
                        <Text style={styles.emptyIcon}>🛒</Text>
                        <Text style={styles.emptyText}>Cart is empty</Text>
                        <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowPicker(true)}>
                            <Text style={styles.emptyAddBtnText}>+ Browse Products</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Footer */}
            {items.length > 0 && (
                <View style={styles.footer}>
                    {/* Totals */}
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalVal}>{formatCurrency(totals.subtotal)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>GST</Text>
                            <Text style={styles.totalVal}>{formatCurrency(totals.totalGst)}</Text>
                        </View>
                        {totalSavings > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: COLORS.SUCCESS }]}>🏷️ Discount</Text>
                                <Text style={[styles.totalVal, { color: COLORS.SUCCESS, fontWeight: '700' }]}>−{formatCurrency(totalSavings)}</Text>
                            </View>
                        )}
                        <View style={[styles.totalRow, styles.grandRow]}>
                            <Text style={styles.grandLabel}>Grand Total</Text>
                            <Text style={styles.grandVal}>{formatCurrency(discountedGrandTotal)}</Text>
                        </View>
                    </View>

                    {/* Bill-level discount */}
                    <View style={styles.discountRow}>
                        <Text style={styles.discountLabel}>🏷️ Bill Discount</Text>
                        <View style={styles.discountTypeToggle}>
                            <TouchableOpacity
                                style={[styles.discTypeBtn, billDiscountType === 'flat' && styles.discTypeBtnActive]}
                                onPress={() => setBillDiscountType('flat')}>
                                <Text style={[styles.discTypeText, billDiscountType === 'flat' && styles.discTypeTextActive]}>₹</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.discTypeBtn, billDiscountType === 'pct' && styles.discTypeBtnActive]}
                                onPress={() => setBillDiscountType('pct')}>
                                <Text style={[styles.discTypeText, billDiscountType === 'pct' && styles.discTypeTextActive]}>%</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.discountInput}
                            placeholder={billDiscountType === 'pct' ? '0%' : '₹0'}
                            placeholderTextColor={COLORS.TEXT_DIM}
                            keyboardType="numeric"
                            value={billDiscount}
                            onChangeText={setBillDiscount}
                        />
                    </View>

                    {/* Payment toggle */}
                    <View style={styles.payToggleRow}>
                        <TouchableOpacity
                            style={[styles.payToggleBtn, !splitMode && styles.payToggleBtnActive]}
                            onPress={() => setSplitMode(false)}>
                            <Text style={[styles.payToggleText, !splitMode && styles.payToggleTextActive]}>Single Mode</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.payToggleBtn, splitMode && styles.payToggleBtnActive]}
                            onPress={() => setSplitMode(true)}>
                            <Text style={[styles.payToggleText, splitMode && styles.payToggleTextActive]}>Split Payment</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Single */}
                    {!splitMode && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.singlePayRow}>
                            {[
                                { key: 'CASH', label: 'Cash', icon: '💵' },
                                { key: 'UPI', label: 'UPI', icon: '📱' },
                                { key: 'CARD', label: 'Card', icon: '💳' },
                                { key: 'UDHAAR', label: 'Udhaar', icon: '📓' },
                            ].map(p => (
                                <TouchableOpacity
                                    key={p.key}
                                    style={[styles.payBtn, singlePayment === p.key && styles.payBtnActive]}
                                    onPress={() => setSinglePayment(p.key)}>
                                    <Text>{p.icon}</Text>
                                    <Text style={[styles.payBtnText, singlePayment === p.key && styles.payBtnTextActive]}>{p.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* Split */}
                    {splitMode && (
                        <View style={styles.splitBox}>
                            {PAY_MODES.map(m => (
                                <View key={m.key} style={styles.splitRow}>
                                    <Text style={styles.splitIcon}>{m.icon}</Text>
                                    <Text style={[styles.splitLabel, { color: m.color }]}>{m.label}</Text>
                                    <View style={[styles.splitInputWrap, { borderColor: m.color + '88' }]}>
                                        <Text style={styles.splitRupee}>₹</Text>
                                        <TextInput
                                            style={styles.splitInput}
                                            placeholder="0"
                                            placeholderTextColor={COLORS.TEXT_DIM}
                                            keyboardType="numeric"
                                            value={splitAmts[m.key as keyof typeof splitAmts] > 0 ? String(splitAmts[m.key as keyof typeof splitAmts]) : ''}
                                            onChangeText={v => setSplitAmts(prev => ({ ...prev, [m.key]: Number(v) || 0 }))}
                                        />
                                    </View>
                                </View>
                            ))}
                            <View style={[styles.splitBalance, { backgroundColor: splitValid ? '#27ae6015' : COLORS.ERROR + '15', borderColor: splitValid ? '#27ae60' : COLORS.ERROR }]}>
                                <Text style={[styles.splitBalanceText, { color: splitValid ? '#27ae60' : COLORS.ERROR }]}>
                                    {splitValid
                                        ? `✅ Fully paid (${formatCurrency(splitTotal)})`
                                        : `⚠️ Balance left: ${formatCurrency(Math.max(0, splitBalance))}`}
                                </Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.checkoutBtn, (isCheckingOut || (splitMode && !splitValid)) && { opacity: 0.5 }]}
                        onPress={handleCheckout}
                        disabled={isCheckingOut || (splitMode && !splitValid)}>
                        <Text style={styles.checkoutText}>
                            {isCheckingOut ? 'Processing...' : `✅ Generate Bill — ${formatCurrency(discountedGrandTotal)}`}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <ProductPickerModal visible={showPicker} onClose={() => setShowPicker(false)} onSelect={(p, q) => addItem(p, q)} />
            <CustomerPickerModal visible={showCustomerPicker} onClose={() => setShowCustomerPicker(false)} onSelect={handleCustomerSelect} />
            <BillerPickerModal visible={showBillerPicker} current={sellerName} onClose={() => setShowBillerPicker(false)} onSelect={setSellerName} />
            <VoiceInputModal visible={showVoice} onClose={() => setShowVoice(false)} onCommand={handleVoiceCommand} />
            {editingItem && (
                <ItemEditModal
                    item={editingItem}
                    discount={itemDiscounts[editingItem.product.id]}
                    note={itemNotes[editingItem.product.id] || ''}
                    onClose={() => setEditingItem(null)}
                    onSave={(disc, note) => {
                        setItemDiscounts(prev => ({ ...prev, [editingItem.product.id]: disc }));
                        setItemNotes(prev => ({ ...prev, [editingItem.product.id]: note }));
                        setEditingItem(null);
                    }}
                />
            )}

            {/* ── Checkout Review Modal ─────────────────────────────────── */}
            <Modal visible={showCheckout} animationType="slide" transparent>
                <View style={co.overlay}>
                    <View style={co.sheet}>
                        <View style={co.header}>
                            <Text style={co.title}>📋 Review & Confirm</Text>
                            <TouchableOpacity onPress={() => setShowCheckout(false)}>
                                <Text style={co.close}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={co.body}>
                            {/* Bill meta */}
                            <Text style={co.sectionTitle}>Bill Details</Text>
                            <View style={co.metaRow}>
                                <View style={co.metaBox}>
                                    <Text style={co.metaLabel}>👤 Customer</Text>
                                    <Text style={co.metaVal}>{customerDisplayName || 'Walk-in'}</Text>
                                    {customerPhone ? <Text style={{ fontSize: 10, color: COLORS.TEXT_DIM }}>📱 {customerPhone}</Text> : null}
                                </View>
                                <View style={co.metaBox}>
                                    <Text style={co.metaLabel}>🧑‍💼 Biller</Text>
                                    <Text style={co.metaVal}>{sellerName}</Text>
                                </View>
                            </View>
                            <View style={co.metaRow}>
                                <View style={co.metaBox}>
                                    <Text style={co.metaLabel}>🏷️ Order Type</Text>
                                    <Text style={co.metaVal}>
                                        {ORDER_TYPES.find(o => o.key === orderType)?.icon} {ORDER_TYPES.find(o => o.key === orderType)?.label}
                                    </Text>
                                </View>
                                <View style={co.metaBox}>
                                    <Text style={co.metaLabel}>💳 Payment</Text>
                                    <Text style={co.metaVal}>{splitMode ? 'Split' : singlePayment}</Text>
                                </View>
                            </View>
                            {orderType === 'delivery' && deliveryAddress ? (
                                <View style={[co.metaBox, { marginBottom: 6 }]}>
                                    <Text style={co.metaLabel}>📍 Delivery Address</Text>
                                    <Text style={co.metaVal}>{deliveryAddress}</Text>
                                </View>
                            ) : null}

                            <View style={co.divider} />

                            {/* Items */}
                            <Text style={co.sectionTitle}>Items ({items.length})</Text>
                            {items.map(item => (
                                <View key={item.product.id} style={co.itemRow}>
                                    <Text style={co.itemName}>{item.product.name}</Text>
                                    <Text style={co.itemQty}>{item.quantity} {item.product.unit}</Text>
                                    <Text style={co.itemAmt}>{formatCurrency(item.product.price * item.quantity)}</Text>
                                </View>
                            ))}

                            <View style={co.divider} />

                            {/* Totals */}
                            <View style={co.totalRow}><Text style={co.totalLabel}>Subtotal</Text><Text style={co.totalVal}>{formatCurrency(totals.subtotal)}</Text></View>
                            <View style={co.totalRow}><Text style={co.totalLabel}>GST</Text><Text style={co.totalVal}>{formatCurrency(totals.totalGst)}</Text></View>
                            {totalSavings > 0 && (
                                <View style={co.totalRow}>
                                    <Text style={[co.totalLabel, { color: COLORS.SUCCESS }]}>🏷️ Discount</Text>
                                    <Text style={[co.totalVal, { color: COLORS.SUCCESS, fontWeight: '700' }]}>−{formatCurrency(totalSavings)}</Text>
                                </View>
                            )}
                            <View style={co.grandRow}>
                                <Text style={co.grandLabel}>Grand Total</Text>
                                <Text style={co.grandVal}>{formatCurrency(discountedGrandTotal)}</Text>
                            </View>

                            {/* Split breakdown */}
                            {splitMode && (
                                <View style={{ marginTop: SPACING.SM }}>
                                    {PAY_MODES.filter(m => splitAmts[m.key as keyof typeof splitAmts] > 0).map(m => (
                                        <View key={m.key} style={co.totalRow}>
                                            <Text style={co.totalLabel}>{m.icon} {m.label}</Text>
                                            <Text style={[co.totalVal, { color: m.color, fontWeight: '700' }]}>
                                                {formatCurrency(splitAmts[m.key as keyof typeof splitAmts])}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={[co.confirmBtn, isCheckingOut && { opacity: 0.5 }]}
                            onPress={handleConfirmBill}
                            disabled={isCheckingOut}>
                            <Text style={co.confirmText}>
                                {isCheckingOut ? '⏳ Processing...' : `✅ Confirm & Generate Bill — ${formatCurrency(discountedGrandTotal)}`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ── Checkout Review Modal ─────────────────────────────────────────────────────
const co = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT_HEADING },
    close: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    body: { padding: SPACING.BASE },
    section: { marginBottom: SPACING.MD },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.TEXT_DIM, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.SM },
    metaRow: { flexDirection: 'row', gap: SPACING.SM, marginBottom: 6 },
    metaBox: { flex: 1, backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, padding: SPACING.SM, gap: 2 },
    metaLabel: { fontSize: 10, color: COLORS.TEXT_DIM, fontWeight: '600' },
    metaVal: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_HEADING },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER + '80' },
    itemName: { fontSize: 13, color: COLORS.TEXT_HEADING, flex: 1 },
    itemQty: { fontSize: 13, color: COLORS.TEXT_DIM, marginHorizontal: SPACING.SM },
    itemAmt: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_HEADING },
    divider: { height: 1, backgroundColor: COLORS.BORDER, marginVertical: SPACING.SM },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    totalLabel: { color: COLORS.TEXT_DIM },
    totalVal: { color: COLORS.TEXT_BODY },
    grandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.SM, borderTopWidth: 1.5, borderTopColor: COLORS.BORDER, marginTop: 4 },
    grandLabel: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT_HEADING },
    grandVal: { fontSize: 22, fontWeight: '900', color: COLORS.PRIMARY },
    confirmBtn: { backgroundColor: COLORS.SUCCESS, margin: SPACING.BASE, marginTop: 0, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center' },
    confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ── Styles ────────────────────────────────────────────────────────────────────
const bp = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 17, fontWeight: '700', color: COLORS.TEXT_HEADING },
    close: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    list: { padding: SPACING.BASE },
    row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    numBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.PRIMARY, justifyContent: 'center', alignItems: 'center' },
    numText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    nameBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.SM },
    billerName: { fontSize: 15, fontWeight: '600', color: COLORS.TEXT_HEADING },
    activeTag: { fontSize: 11, color: COLORS.PRIMARY, fontWeight: '700' },
    delBtn: { padding: 6 },
    delText: { color: COLORS.ERROR, fontWeight: '700', fontSize: 14 },
    addRow: { flexDirection: 'row', gap: SPACING.SM, padding: SPACING.BASE, borderTopWidth: 1, borderTopColor: COLORS.BORDER },
    addInput: { flex: 1, backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.BORDER, color: COLORS.TEXT_BODY },
    addBtn: { backgroundColor: COLORS.PRIMARY, paddingHorizontal: SPACING.MD, borderRadius: RADIUS.MD, justifyContent: 'center' },
    addBtnText: { color: '#fff', fontWeight: '700' },
});

const cp = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%', paddingBottom: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 17, fontWeight: '700', color: COLORS.TEXT_HEADING },
    close: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    walkInBox: { padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER, gap: SPACING.SM },
    walkInLabel: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_HEADING },
    walkInInput: { backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.BORDER, color: COLORS.TEXT_BODY, marginBottom: SPACING.XS },
    walkInRow: { flexDirection: 'row', gap: SPACING.SM, alignItems: 'center' },
    walkInBtn: { backgroundColor: COLORS.PRIMARY, paddingHorizontal: SPACING.MD, paddingVertical: 10, borderRadius: RADIUS.MD },
    walkInBtnText: { color: '#fff', fontWeight: '700' },
    orDivider: { textAlign: 'center', color: COLORS.TEXT_DIM, fontSize: 11, paddingVertical: SPACING.SM },
    search: { marginHorizontal: SPACING.BASE, backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.BORDER, color: COLORS.TEXT_BODY, marginBottom: SPACING.SM },
    list: { paddingHorizontal: SPACING.BASE },
    row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.PRIMARY + '22', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 15, fontWeight: '700', color: COLORS.PRIMARY },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT_HEADING },
    rowSub: { fontSize: 11, color: COLORS.TEXT_DIM },
    rowDebt: { fontSize: 12, fontWeight: '700', color: COLORS.ERROR },
    noResult: { textAlign: 'center', color: COLORS.TEXT_DIM, padding: SPACING.MD, fontSize: 13 },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.TEXT_HEADING },
    itemCountBadge: { backgroundColor: COLORS.PRIMARY, borderRadius: RADIUS.CIRCLE, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
    itemCountText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    billNo: { fontSize: 12, color: COLORS.TEXT_DIM },
    addItemBtn: { backgroundColor: COLORS.SUCCESS, paddingHorizontal: SPACING.MD, paddingVertical: 8, borderRadius: RADIUS.MD },
    addItemBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    infoBar: { flexDirection: 'row', backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    infoField: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: SPACING.SM, paddingHorizontal: SPACING.MD, gap: SPACING.XS },
    infoFieldIcon: { fontSize: 18 },
    infoFieldText: { flex: 1 },
    infoFieldLabel: { fontSize: 10, color: COLORS.TEXT_DIM, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    infoFieldVal: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_HEADING, marginTop: 1 },
    infoFieldSub: { fontSize: 10, color: COLORS.TEXT_DIM, marginTop: 1 },
    infoFieldEdit: { fontSize: 20, color: COLORS.TEXT_DIM },
    infoDivider: { width: 1, backgroundColor: COLORS.BORDER, marginVertical: SPACING.SM },
    cartList: { padding: SPACING.BASE, flexGrow: 1 },
    cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG, padding: SPACING.MD, marginBottom: SPACING.SM, elevation: 1 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT_HEADING },
    itemMeta: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 2 },
    itemNote: { fontSize: 11, color: COLORS.PRIMARY, marginTop: 2, fontStyle: 'italic' },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, marginRight: SPACING.SM },
    qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.BORDER, justifyContent: 'center', alignItems: 'center' },
    qtyBtnText: { fontSize: 16, color: COLORS.TEXT_HEADING },
    qtyVal: { fontSize: 14, color: COLORS.TEXT_BODY, minWidth: 40, textAlign: 'center' },
    itemTotalCol: { alignItems: 'flex-end', minWidth: 64 },
    itemTotalStrike: { fontSize: 11, color: COLORS.TEXT_DIM, textDecorationLine: 'line-through' },
    itemTotal: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT_HEADING, textAlign: 'right' },
    removeBtn: { marginLeft: SPACING.SM, padding: 6 },
    removeBtnText: { fontSize: 14, color: COLORS.ERROR, fontWeight: '700' },
    emptyCart: { flex: 1, alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: SPACING.MD },
    emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT_DIM },
    emptyAddBtn: { marginTop: SPACING.LG, backgroundColor: COLORS.PRIMARY, paddingHorizontal: SPACING.LG, paddingVertical: SPACING.MD, borderRadius: RADIUS.LG },
    emptyAddBtnText: { color: COLORS.WHITE, fontWeight: '700', fontSize: 15 },
    footer: { backgroundColor: COLORS.WHITE, padding: SPACING.BASE, borderTopWidth: 1, borderTopColor: COLORS.BORDER },
    totalsBox: { marginBottom: SPACING.SM },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    totalLabel: { color: COLORS.TEXT_DIM },
    totalVal: { color: COLORS.TEXT_BODY },
    grandRow: { paddingTop: SPACING.SM, borderTopWidth: 1, borderTopColor: COLORS.BORDER, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' },
    grandLabel: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT_HEADING },
    grandVal: { fontSize: 20, fontWeight: '800', color: COLORS.PRIMARY },
    // Bill-level discount row
    discountRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, marginBottom: SPACING.SM, backgroundColor: COLORS.SUCCESS + '10', borderRadius: RADIUS.MD, padding: SPACING.SM },
    discountLabel: { fontSize: 13, fontWeight: '700', color: COLORS.SUCCESS, flex: 1 },
    discountTypeToggle: { flexDirection: 'row', borderRadius: RADIUS.SM, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.SUCCESS },
    discTypeBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'transparent' },
    discTypeBtnActive: { backgroundColor: COLORS.SUCCESS },
    discTypeText: { fontSize: 13, fontWeight: '700', color: COLORS.SUCCESS },
    discTypeTextActive: { color: '#fff' },
    discountInput: { width: 70, backgroundColor: COLORS.WHITE, borderRadius: RADIUS.SM, paddingHorizontal: SPACING.SM, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.SUCCESS, color: COLORS.TEXT_HEADING, fontSize: 14, fontWeight: '700', textAlign: 'right' },
    payToggleRow: { flexDirection: 'row', gap: SPACING.SM, marginBottom: SPACING.SM },
    payToggleBtn: { flex: 1, paddingVertical: 7, borderRadius: RADIUS.MD, borderWidth: 1.5, borderColor: COLORS.BORDER, alignItems: 'center', backgroundColor: COLORS.BACKGROUND },
    payToggleBtnActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY },
    payToggleText: { fontSize: 12, fontWeight: '700', color: COLORS.TEXT_DIM },
    payToggleTextActive: { color: '#fff' },
    singlePayRow: { flexDirection: 'row', marginBottom: SPACING.SM },
    payBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.MD, paddingVertical: 8, borderRadius: RADIUS.XL, borderWidth: 1.5, borderColor: COLORS.BORDER, marginRight: SPACING.SM, backgroundColor: COLORS.BACKGROUND },
    payBtnActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '15' },
    payBtnText: { color: COLORS.TEXT_DIM, fontSize: 13 },
    payBtnTextActive: { color: COLORS.PRIMARY, fontWeight: '700' },
    splitBox: { marginBottom: SPACING.SM },
    splitRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, marginBottom: 8 },
    splitIcon: { fontSize: 18, width: 24 },
    splitLabel: { width: 58, fontSize: 13, fontWeight: '700' },
    splitInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.SM, backgroundColor: COLORS.BACKGROUND },
    splitRupee: { fontSize: 14, color: COLORS.TEXT_DIM, marginRight: 4 },
    splitInput: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.TEXT_HEADING, paddingVertical: 6 },
    splitBalance: { borderWidth: 1, borderRadius: RADIUS.MD, padding: SPACING.SM, alignItems: 'center', marginTop: 4 },
    splitBalanceText: { fontSize: 13, fontWeight: '700' },
    checkoutBtn: { backgroundColor: COLORS.PRIMARY, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center', marginTop: SPACING.SM },
    checkoutText: { color: COLORS.WHITE, fontSize: 16, fontWeight: '700' },
    // Header buttons row
    headerBtns: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM },
    voiceBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.TEXT_DIM + '33', justifyContent: 'center', alignItems: 'center' },
    voiceBtnActive: { backgroundColor: COLORS.ERROR },
    voiceBtnIcon: { fontSize: 18 },
    // Order type
    orderTypeBar: { flexDirection: 'row', gap: SPACING.XS, paddingHorizontal: SPACING.SM, paddingVertical: SPACING.XS, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    orderChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7, borderRadius: RADIUS.MD, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
    orderChipActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '15' },
    orderChipIcon: { fontSize: 14 },
    orderChipText: { fontSize: 10, color: COLORS.TEXT_DIM, fontWeight: '600' },
    orderChipTextActive: { color: COLORS.PRIMARY, fontWeight: '800' },
    // Delivery address
    deliveryBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.SM, paddingHorizontal: SPACING.BASE, paddingVertical: SPACING.SM, backgroundColor: '#EBF5FB', borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    deliveryIcon: { fontSize: 16, marginTop: 2 },
    deliveryInput: { flex: 1, color: COLORS.TEXT_BODY, fontSize: 13, minHeight: 36, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER, paddingBottom: 4 },
});

export default BillingScreen;
