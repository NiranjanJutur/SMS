import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TextInput,
    TouchableOpacity, FlatList, Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../config/theme';
import { getProducts } from '../services/firebase/firestoreService';
import { Product } from '../models/Product';
import { formatCurrency } from '../utils/billingUtils';
import { normalizeQuantity } from '../utils/conversion';

// ─── Unit option groups per base unit ──────────────────────────────────────────
const UNIT_OPTIONS: Record<string, { label: string; unit: string }[]> = {
    kg: [
        { label: 'kg', unit: 'kg' },
        { label: 'g', unit: 'g' },
        { label: 'gm', unit: 'gm' },
        { label: 'bag', unit: 'bag' },
    ],
    ltr: [
        { label: 'ltr', unit: 'ltr' },
        { label: 'ml', unit: 'ml' },
        { label: 'can', unit: 'can' },
        { label: 'tin', unit: 'tin' },
    ],
    pcs: [
        { label: 'pcs', unit: 'pcs' },
        { label: 'pkt', unit: 'pkt' },
        { label: 'bag', unit: 'bag' },
        { label: 'box', unit: 'box' },
        { label: 'carton', unit: 'carton' },
        { label: 'can', unit: 'can' },
        { label: 'dozen', unit: 'dozen' },
    ],
    bag: [
        { label: 'bag', unit: 'bag' },
        { label: 'carton', unit: 'carton' },
    ],
    box: [
        { label: 'box', unit: 'box' },
        { label: 'carton', unit: 'carton' },
    ],
    carton: [
        { label: 'carton', unit: 'carton' },
    ],
    can: [
        { label: 'can', unit: 'can' },
        { label: 'tin', unit: 'tin' },
    ],
};

const getUnitOptions = (baseUnit: string) =>
    UNIT_OPTIONS[baseUnit.toLowerCase()] ?? [{ label: baseUnit, unit: baseUnit }];

// Units that are containers — need a "how many per unit" pack-size input
const PACK_SIZE_UNITS = new Set(['box', 'carton', 'bag', 'can', 'tin', 'pkt']);

// ─── Component ─────────────────────────────────────────────────────────────────
interface QtyState { raw: string; unit: string; packSize: string }

const ProductPickerModal = ({
    visible, onClose, onSelect,
}: { visible: boolean; onClose: () => void; onSelect: (product: Product, qty: number) => void }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filtered, setFiltered] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [qtyInputs, setQtyInputs] = useState<Record<string, QtyState>>({});

    useEffect(() => {
        if (visible) {
            getProducts().then(data => {
                const active = data.filter(p => p.isActive && p.currentStock > 0);
                setProducts(active);
                setFiltered(active);
            }).catch(() => { });
        } else {
            setSearch('');
            setQtyInputs({});
        }
    }, [visible]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(products.filter(p =>
            p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
        ));
    }, [search, products]);

    const getState = (id: string, baseUnit: string): QtyState =>
        qtyInputs[id] ?? { raw: '', unit: baseUnit, packSize: '' };

    const setState = (id: string, patch: Partial<QtyState>, baseUnit: string) =>
        setQtyInputs(prev => ({ ...prev, [id]: { ...getState(id, baseUnit), ...patch } }));

    // If a container unit is selected, normalized qty = containers × packSize
    // Uses product.packSize if available, otherwise falls back to the manual packSize field
    const getNormalizedQty = (id: string, baseUnit: string, productPackSize?: number): number => {
        const { raw, unit, packSize } = getState(id, baseUnit);
        const containers = parseFloat(raw);
        if (!containers || containers <= 0) return 0;

        if (PACK_SIZE_UNITS.has(unit) && unit !== baseUnit) {
            // Use product-defined pack size first, then manual input
            const ps = productPackSize ?? parseFloat(packSize);
            if (!ps || ps <= 0) return 0;
            const rawPcs = containers * ps;
            return normalizeQuantity(rawPcs, 'pcs', baseUnit).normalizedQty;
        }
        return normalizeQuantity(containers, unit, baseUnit).normalizedQty;
    };

    // Pack-size input needed only when: container unit selected AND product has no packSize
    const needsPackSize = (id: string, baseUnit: string, productPackSize?: number): boolean => {
        const { unit } = getState(id, baseUnit);
        return PACK_SIZE_UNITS.has(unit) && unit !== baseUnit && !productPackSize;
    };

    const handleAdd = (product: Product) => {
        const nQty = getNormalizedQty(product.id, product.unit, product.packSize);
        if (nQty <= 0) {
            const { unit, packSize } = getState(product.id, product.unit);
            if (PACK_SIZE_UNITS.has(unit) && unit !== product.unit && !product.packSize && (!packSize || parseFloat(packSize) <= 0)) {
                Alert.alert('Pack size needed', `How many ${product.unit} per ${unit}? Fill in the field below the product.`);
            }
            return;
        }
        if (nQty > product.currentStock) {
            Alert.alert('Over Stock', `Only ${product.currentStock} ${product.unit} available.`);
            return;
        }
        onSelect(product, nQty);
        setQtyInputs(prev => { const n = { ...prev }; delete n[product.id]; return n; });
    };

    const handleCommit = () => {
        const toAdd = products.filter(p => getNormalizedQty(p.id, p.unit, p.packSize) > 0);
        if (toAdd.length === 0) { Alert.alert('Nothing added', 'Enter a quantity first.'); return; }
        let hasError = false;
        toAdd.forEach(p => {
            const n = getNormalizedQty(p.id, p.unit, p.packSize);
            if (n > p.currentStock) {
                Alert.alert('Over Stock', `Only ${p.currentStock} ${p.unit} of "${p.name}" available.`);
                hasError = true;
                return;
            }
            onSelect(p, n);
        });
        if (!hasError) {
            setQtyInputs({});
            setSearch('');
            onClose();
        }
    };

    const totalReady = products.filter(p => getNormalizedQty(p.id, p.unit, p.packSize) > 0).length;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={s.overlay}>
                <View style={s.sheet}>
                    {/* Header */}
                    <View style={s.header}>
                        <Text style={s.title}>Add Items</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={s.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={s.searchBox}>
                        <Text>🔍</Text>
                        <TextInput
                            style={s.searchInput}
                            placeholder="Search products or category..."
                            placeholderTextColor={COLORS.TEXT_DIM}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    {/* Product list */}
                    <FlatList
                        data={filtered}
                        keyExtractor={item => item.id}
                        contentContainerStyle={s.list}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => {
                            const { raw, unit } = getState(item.id, item.unit);
                            const unitOptions = getUnitOptions(item.unit);
                            const nQty = getNormalizedQty(item.id, item.unit, item.packSize);
                            const dirty = raw.length > 0;
                            const isContainerSelected = PACK_SIZE_UNITS.has(unit) && unit !== item.unit;

                            return (
                                <View style={[s.row, dirty && s.rowActive]}>
                                    {/* Info */}
                                    <View style={s.info}>
                                        <Text style={s.name}>{item.name}</Text>
                                        <Text style={s.meta}>
                                            {item.category} · {formatCurrency(item.price)}/{item.unit} · {item.currentStock} {item.unit} in stock
                                            {item.packSize ? `  ·  📦 1 ${item.packSize} ${item.unit} per ${item.unit}` : ''}
                                        </Text>
                                    </View>

                                    {/* Input area */}
                                    <View style={s.inputArea}>

                                        {/* Unit chips */}
                                        <View style={s.chips}>
                                            {unitOptions.map(opt => (
                                                <TouchableOpacity
                                                    key={opt.unit}
                                                    style={[s.chip, unit === opt.unit && s.chipActive]}
                                                    onPress={() => setState(item.id, { unit: opt.unit, packSize: '' }, item.unit)}>
                                                    <Text style={[s.chipText, unit === opt.unit && s.chipTextActive]}>
                                                        {opt.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        {/* Decimal qty input + Add */}
                                        <View style={s.qtyRow}>
                                            <TextInput
                                                style={s.qtyInput}
                                                placeholder={`0 ${unit}`}
                                                placeholderTextColor={COLORS.TEXT_DIM}
                                                keyboardType="decimal-pad"
                                                value={raw}
                                                onChangeText={v => setState(item.id, { raw: v }, item.unit)}
                                                onSubmitEditing={() => handleAdd(item)}
                                            />
                                            <TouchableOpacity
                                                style={[s.addBtn, nQty <= 0 && s.addBtnDim]}
                                                onPress={() => handleAdd(item)}
                                                disabled={nQty <= 0}>
                                                <Text style={s.addBtnText}>+ Add</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Pack-size: show hint if defined on product, or input if not */}
                                        {isContainerSelected && (
                                            item.packSize ? (
                                                <View style={s.packSizeHintBox}>
                                                    <Text style={s.packSizeHint}>
                                                        📦 1 {unit} = {item.packSize} {['kg', 'gm', 'ltr', 'ml'].includes(item.unit) ? item.unit : 'pcs'}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={s.packSizeRow}>
                                                    <Text style={s.packSizeLabel}>
                                                        📦 How many <Text style={s.packSizeUnit}>{item.unit}</Text> per {unit}?
                                                    </Text>
                                                    <TextInput
                                                        style={s.packSizeInput}
                                                        placeholder="e.g. 12"
                                                        placeholderTextColor={COLORS.TEXT_DIM}
                                                        keyboardType="decimal-pad"
                                                        value={getState(item.id, item.unit).packSize}
                                                        onChangeText={v => setState(item.id, { packSize: v }, item.unit)}
                                                    />
                                                </View>
                                            )
                                        )}

                                        {/* Live preview */}
                                        {nQty > 0 && (() => {
                                            const { raw: r, unit: u, packSize: ps } = getState(item.id, item.unit);
                                            const effectivePs = item.packSize ?? parseFloat(ps);
                                            const isContainer = PACK_SIZE_UNITS.has(u) && u !== item.unit;
                                            const livePrice = item.price * nQty;
                                            return (
                                                <Text style={s.preview}>
                                                    {isContainer
                                                        ? `${r} ${u} × ${effectivePs} = ${nQty} ${item.unit}  ·  ${formatCurrency(livePrice)}`
                                                        : u !== item.unit
                                                            ? `${r} ${u} = ${nQty} ${item.unit}  ·  ${formatCurrency(livePrice)}`
                                                            : formatCurrency(livePrice)
                                                    }
                                                </Text>
                                            );
                                        })()}
                                    </View>
                                </View>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={s.center}>
                                <Text style={{ color: COLORS.TEXT_DIM }}>No products found</Text>
                            </View>
                        }
                    />

                    {/* Commit footer */}
                    {totalReady > 0 && (
                        <View style={s.footer}>
                            <Text style={s.footerNote}>
                                {totalReady} product{totalReady > 1 ? 's' : ''} ready
                            </Text>
                            <TouchableOpacity style={s.commitBtn} onPress={handleCommit}>
                                <Text style={s.commitText}>✅ Add to Bill</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%', flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT_HEADING },
    closeBtn: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    searchBox: { flexDirection: 'row', alignItems: 'center', margin: SPACING.SM, backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, borderWidth: 1, borderColor: COLORS.BORDER, gap: SPACING.SM },
    searchInput: { flex: 1, height: 40, color: COLORS.TEXT_BODY },
    list: { paddingHorizontal: SPACING.SM, paddingBottom: 12 },

    row: { paddingVertical: SPACING.MD, paddingHorizontal: SPACING.SM, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    rowActive: { backgroundColor: COLORS.PRIMARY + '08' },
    info: { marginBottom: SPACING.SM },
    name: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT_HEADING },
    meta: { fontSize: 11, color: COLORS.TEXT_DIM, marginTop: 2 },

    inputArea: { gap: 6 },

    // Unit chips
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.CIRCLE, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
    chipActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY },
    chipText: { fontSize: 11, fontWeight: '700', color: COLORS.TEXT_DIM },
    chipTextActive: { color: '#fff' },

    // Qty input
    qtyRow: { flexDirection: 'row', gap: SPACING.SM, alignItems: 'center' },
    qtyInput: {
        flex: 1, borderWidth: 1.5, borderColor: COLORS.BORDER, borderRadius: RADIUS.MD,
        paddingHorizontal: SPACING.MD, paddingVertical: 8,
        fontSize: 17, fontWeight: '800', color: COLORS.TEXT_HEADING,
        backgroundColor: COLORS.BACKGROUND,
    },
    addBtn: { backgroundColor: COLORS.PRIMARY, paddingHorizontal: SPACING.MD, paddingVertical: 10, borderRadius: RADIUS.MD },
    addBtnDim: { opacity: 0.35 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    // Preview
    preview: { fontSize: 12, color: COLORS.SUCCESS, fontWeight: '700', textAlign: 'right' },

    // Pack-size
    packSizeHintBox: { backgroundColor: COLORS.SUCCESS + '15', borderRadius: RADIUS.MD, padding: SPACING.SM, flexDirection: 'row', alignItems: 'center' },
    packSizeHint: { fontSize: 12, color: COLORS.SUCCESS, fontWeight: '700' },
    packSizeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, backgroundColor: COLORS.WARNING + '15', borderRadius: RADIUS.MD, padding: SPACING.SM },
    packSizeLabel: { flex: 1, fontSize: 12, color: COLORS.TEXT_BODY },
    packSizeUnit: { fontWeight: '800', color: COLORS.PRIMARY },
    packSizeInput: { width: 64, borderWidth: 1.5, borderColor: COLORS.WARNING, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.SM, paddingVertical: 5, fontSize: 15, fontWeight: '800', color: COLORS.TEXT_HEADING, backgroundColor: COLORS.WHITE, textAlign: 'center' },

    center: { padding: SPACING.XL, alignItems: 'center' },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.BASE, borderTopWidth: 1, borderTopColor: COLORS.BORDER, backgroundColor: COLORS.WHITE },
    footerNote: { fontSize: 14, color: COLORS.TEXT_DIM, fontWeight: '600' },
    commitBtn: { backgroundColor: COLORS.PRIMARY, paddingHorizontal: SPACING.LG, paddingVertical: SPACING.SM, borderRadius: RADIUS.LG },
    commitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default ProductPickerModal;
