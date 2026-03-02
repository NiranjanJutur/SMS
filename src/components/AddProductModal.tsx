import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TextInput, TouchableOpacity,
    ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../config/theme';
import { GST_SLABS } from '../config/constants';
import { addProduct } from '../services/firebase/firestoreService';

const PRESET_CATEGORIES = [
    '🌾 Grains', '🫘 Pulses', '🥛 Dairy', '🫙 Oils', '🌶️ Spices',
    '🍿 Snacks', '🧴 Essentials', '🥤 Beverages', '🧹 Cleaning', '📦 Other',
];

const PRESET_UNITS = [
    { label: 'kg', group: 'Weight' },
    { label: 'gm', group: 'Weight' },
    { label: 'ltr', group: 'Volume' },
    { label: 'ml', group: 'Volume' },
    { label: 'pcs', group: 'Count' },
    { label: 'dozen', group: 'Count' },
    { label: 'bag', group: 'Pack' },
    { label: 'box', group: 'Pack' },
    { label: 'carton', group: 'Pack' },
    { label: 'can', group: 'Pack' },
    { label: 'pkt', group: 'Pack' },
];

// Units that represent containers — need a pack size
const CONTAINER_UNITS = new Set(['bag', 'box', 'carton', 'can', 'pkt', 'bundle']);

const AddProductModal = ({
    visible, onClose, onAdded,
}: { visible: boolean; onClose: () => void; onAdded: () => void }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('🌾 Grains');
    const [customCategory, setCustomCategory] = useState('');
    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [price, setPrice] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [gstPercent, setGstPercent] = useState(5);
    const [unit, setUnit] = useState('kg');
    const [customUnit, setCustomUnit] = useState('');
    const [showCustomUnit, setShowCustomUnit] = useState(false);
    const [packSize, setPackSize] = useState('');     // e.g. "12" means 12 pcs per box
    const [currentStock, setCurrentStock] = useState('');
    const [minThreshold, setMinThreshold] = useState('5');
    const [saving, setSaving] = useState(false);

    const reset = () => {
        setName(''); setPrice(''); setPurchasePrice(''); setCurrentStock('');
        setMinThreshold('5'); setCategory('🌾 Grains'); setUnit('kg');
        setGstPercent(5); setCustomCategory(''); setCustomUnit(''); setPackSize('');
        setShowCustomCategory(false); setShowCustomUnit(false);
    };

    const effectiveCategory = showCustomCategory && customCategory.trim() ? customCategory.trim() : category.replace(/^[^\s]+\s/, '');
    const effectiveUnit = showCustomUnit && customUnit.trim() ? customUnit.trim() : unit;
    const isContainer = CONTAINER_UNITS.has(effectiveUnit);

    const handleSave = async () => {
        if (!name.trim()) { Alert.alert('Error', 'Product name required'); return; }
        if (!effectiveCategory) { Alert.alert('Error', 'Category required'); return; }
        if (!price || isNaN(Number(price))) { Alert.alert('Error', 'Valid price required'); return; }
        if (!currentStock || isNaN(Number(currentStock))) { Alert.alert('Error', 'Valid stock required'); return; }
        if (!effectiveUnit) { Alert.alert('Error', 'Unit required'); return; }
        setSaving(true);
        try {
            await addProduct({
                name: name.trim(),
                category: effectiveCategory,
                price: Number(price),
                purchasePrice: Number(purchasePrice) || Number(price) * 0.8,
                gstPercent: gstPercent as 0 | 5 | 12 | 18 | 28,
                unit: effectiveUnit,
                packSize: isContainer && packSize ? Number(packSize) : undefined,
                currentStock: Number(currentStock),
                minThreshold: Number(minThreshold) || 5,
                imageUrl: '', supplierId: '', supplierPhone: '',
                isWeightBased: ['kg', 'gm', 'ltr', 'ml'].includes(effectiveUnit),
                isActive: true,
            });
            reset(); onAdded(); onClose();
            Alert.alert('✅ Added', `${name.trim()} added to inventory!`);
        } catch { Alert.alert('Error', 'Failed to add product'); }
        finally { setSaving(false); }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Add New Product</Text>
                        <TouchableOpacity onPress={() => { reset(); onClose(); }}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        {/* Name */}
                        <Text style={styles.label}>Product Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Basmati Rice"
                            placeholderTextColor={COLORS.TEXT_DIM}
                            value={name}
                            onChangeText={setName}
                        />

                        {/* Category */}
                        <Text style={styles.label}>Category *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chipRow}>
                                {PRESET_CATEGORIES.map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.chip, !showCustomCategory && category === c && styles.chipActive]}
                                        onPress={() => { setCategory(c); setShowCustomCategory(false); }}>
                                        <Text style={[styles.chipText, !showCustomCategory && category === c && styles.chipTextActive]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[styles.chip, showCustomCategory && styles.chipActive]}
                                    onPress={() => setShowCustomCategory(true)}>
                                    <Text style={[styles.chipText, showCustomCategory && styles.chipTextActive]}>✏️ Custom</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                        {showCustomCategory && (
                            <TextInput
                                style={[styles.input, { marginTop: SPACING.XS }]}
                                placeholder="Type custom category name..."
                                placeholderTextColor={COLORS.TEXT_DIM}
                                value={customCategory}
                                onChangeText={setCustomCategory}
                                autoFocus
                            />
                        )}

                        {/* Unit (variety) */}
                        <Text style={styles.label}>Unit / Variety *</Text>
                        <Text style={styles.sectionHint}>Choose how this product is measured or sold</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chipRow}>
                                {PRESET_UNITS.map(u => (
                                    <TouchableOpacity
                                        key={u.label}
                                        style={[styles.chip, !showCustomUnit && unit === u.label && styles.chipActive]}
                                        onPress={() => { setUnit(u.label); setShowCustomUnit(false); }}>
                                        <Text style={[styles.chipText, !showCustomUnit && unit === u.label && styles.chipTextActive]}>
                                            {u.label}
                                        </Text>
                                        <Text style={styles.chipSub}>{u.group}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[styles.chip, showCustomUnit && styles.chipActive]}
                                    onPress={() => setShowCustomUnit(true)}>
                                    <Text style={[styles.chipText, showCustomUnit && styles.chipTextActive]}>✏️ Custom</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                        {showCustomUnit && (
                            <TextInput
                                style={[styles.input, { marginTop: SPACING.XS }]}
                                placeholder="e.g. crate, quintal, tin..."
                                placeholderTextColor={COLORS.TEXT_DIM}
                                value={customUnit}
                                onChangeText={setCustomUnit}
                                autoFocus
                            />
                        )}

                        {/* Pack size — only shown for container units */}
                        {isContainer && (
                            <View style={styles.packSizeBox}>
                                <Text style={styles.packSizeTitle}>
                                    📦 Pack Size <Text style={styles.packSizeHint}>(optional but recommended)</Text>
                                </Text>
                                <Text style={styles.packSizeSub}>
                                    How many base items are in 1 <Text style={{ fontWeight: '800' }}>{effectiveUnit}</Text>?
                                    {' '}e.g. 12 pcs per box, 25 kg per bag
                                </Text>
                                <View style={styles.packSizeRow}>
                                    <TextInput
                                        style={styles.packSizeInput}
                                        placeholder="e.g. 12"
                                        placeholderTextColor={COLORS.TEXT_DIM}
                                        keyboardType="numeric"
                                        value={packSize}
                                        onChangeText={setPackSize}
                                    />
                                    {packSize ? (
                                        <Text style={styles.packSizePreview}>
                                            1 {effectiveUnit} = {packSize} {['kg', 'gm', 'ltr', 'ml'].includes(effectiveUnit) ? effectiveUnit : 'pcs'}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                        )}

                        {/* Preview */}
                        {name.trim() || effectiveUnit ? (
                            <View style={styles.preview}>
                                <Text style={styles.previewText}>
                                    Preview: <Text style={styles.previewBold}>{name.trim() || 'Product'}</Text>
                                    {' '}· <Text style={styles.previewBold}>{effectiveCategory || '—'}</Text>
                                    {' '}· sold in <Text style={styles.previewBold}>{effectiveUnit || '—'}</Text>
                                    {isContainer && packSize ? (
                                        <Text style={styles.previewBold}> ({packSize} pcs/{effectiveUnit})</Text>
                                    ) : null}
                                </Text>
                            </View>
                        ) : null}

                        {/* Prices */}
                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Text style={styles.label}>Selling Price (₹/{effectiveUnit || 'unit'}) *</Text>
                                <TextInput style={styles.input} placeholder="150" placeholderTextColor={COLORS.TEXT_DIM} value={price} onChangeText={setPrice} keyboardType="numeric" />
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.label}>Purchase Price (₹)</Text>
                                <TextInput style={styles.input} placeholder="120" placeholderTextColor={COLORS.TEXT_DIM} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="numeric" />
                            </View>
                        </View>

                        {/* GST */}
                        <Text style={styles.label}>GST Slab</Text>
                        <View style={styles.chipRow}>
                            {(GST_SLABS as number[]).map(g => (
                                <TouchableOpacity key={g} style={[styles.chip, gstPercent === g && styles.chipActive]} onPress={() => setGstPercent(g)}>
                                    <Text style={[styles.chipText, gstPercent === g && styles.chipTextActive]}>{g}%</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Stock */}
                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Text style={styles.label}>Current Stock ({effectiveUnit || 'unit'}) *</Text>
                                <TextInput style={styles.input} placeholder="50" placeholderTextColor={COLORS.TEXT_DIM} value={currentStock} onChangeText={setCurrentStock} keyboardType="numeric" />
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.label}>Low Stock Alert Below</Text>
                                <TextInput style={styles.input} placeholder="5" placeholderTextColor={COLORS.TEXT_DIM} value={minThreshold} onChangeText={setMinThreshold} keyboardType="numeric" />
                            </View>
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '✅ Add Product'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '93%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT_HEADING },
    closeBtn: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    form: { padding: SPACING.BASE },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_DIM, marginTop: SPACING.SM, marginBottom: 4 },
    sectionHint: { fontSize: 11, color: COLORS.TEXT_DIM, marginBottom: 6, marginTop: -2 },
    input: { backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 10, color: COLORS.TEXT_BODY, borderWidth: 1, borderColor: COLORS.BORDER },
    row: { flexDirection: 'row', gap: SPACING.SM },
    half: { flex: 1 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.XS, marginBottom: SPACING.XS },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND, alignItems: 'center' },
    chipActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '18' },
    chipText: { fontSize: 12, color: COLORS.TEXT_DIM },
    chipTextActive: { color: COLORS.PRIMARY, fontWeight: '700' },
    chipSub: { fontSize: 9, color: COLORS.TEXT_DIM, marginTop: 1 },
    preview: { backgroundColor: COLORS.PRIMARY + '10', borderRadius: RADIUS.MD, padding: SPACING.SM, marginTop: SPACING.XS, marginBottom: SPACING.SM, borderLeftWidth: 3, borderLeftColor: COLORS.PRIMARY },
    previewText: { fontSize: 12, color: COLORS.TEXT_DIM },
    previewBold: { fontWeight: '700', color: COLORS.PRIMARY },
    packSizeBox: { backgroundColor: COLORS.WARNING + '15', borderRadius: RADIUS.MD, padding: SPACING.MD, marginTop: SPACING.SM, borderLeftWidth: 3, borderLeftColor: COLORS.WARNING },
    packSizeTitle: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_HEADING, marginBottom: 2 },
    packSizeHint: { fontSize: 11, color: COLORS.TEXT_DIM, fontWeight: '400' },
    packSizeSub: { fontSize: 11, color: COLORS.TEXT_DIM, marginBottom: SPACING.SM },
    packSizeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.MD },
    packSizeInput: { width: 80, backgroundColor: COLORS.WHITE, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 8, borderWidth: 1.5, borderColor: COLORS.WARNING, color: COLORS.TEXT_HEADING, fontSize: 16, fontWeight: '800', textAlign: 'center' },
    packSizePreview: { fontSize: 13, color: COLORS.SUCCESS, fontWeight: '700' },
    saveBtn: { backgroundColor: COLORS.PRIMARY, margin: SPACING.BASE, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center' },
    saveBtnText: { color: COLORS.WHITE, fontSize: 16, fontWeight: '700' },
});

export default AddProductModal;
