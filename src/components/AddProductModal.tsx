import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TextInput, TouchableOpacity,
    ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../config/theme';
import { GST_SLABS } from '../config/constants';
import { addProduct } from '../services/firebase/firestoreService';

interface AddProductModalProps {
    visible: boolean;
    onClose: () => void;
    onAdded: () => void;
}

const CATEGORIES = ['Grains', 'Pulses', 'Dairy', 'Oils', 'Spices', 'Snacks', 'Essentials', 'Beverages', 'Other'];
const UNITS = ['kg', 'gm', 'ltr', 'ml', 'pcs', 'bag', 'dozen', 'box'];

const AddProductModal = ({ visible, onClose, onAdded }: AddProductModalProps) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Grains');
    const [price, setPrice] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [gstPercent, setGstPercent] = useState(5);
    const [unit, setUnit] = useState('kg');
    const [currentStock, setCurrentStock] = useState('');
    const [minThreshold, setMinThreshold] = useState('5');
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setName(''); setPrice(''); setPurchasePrice('');
        setCurrentStock(''); setMinThreshold('5');
        setCategory('Grains'); setUnit('kg'); setGstPercent(5);
    };

    const handleSave = async () => {
        if (!name.trim()) { Alert.alert('Error', 'Product name is required'); return; }
        if (!price || isNaN(Number(price))) { Alert.alert('Error', 'Valid price is required'); return; }
        if (!currentStock || isNaN(Number(currentStock))) { Alert.alert('Error', 'Valid stock quantity is required'); return; }

        setSaving(true);
        try {
            await addProduct({
                name: name.trim(),
                category,
                price: Number(price),
                purchasePrice: Number(purchasePrice) || Number(price) * 0.8,
                gstPercent: gstPercent as 0 | 5 | 12 | 18 | 28,
                unit,
                currentStock: Number(currentStock),
                minThreshold: Number(minThreshold) || 5,
                imageUrl: '',
                supplierId: '',
                supplierPhone: '',
                isWeightBased: ['kg', 'gm', 'ltr', 'ml'].includes(unit),
                isActive: true,
            });
            resetForm();
            onAdded();
            onClose();
            Alert.alert('✅ Success', `${name} added to inventory!`);
        } catch (e) {
            Alert.alert('Error', 'Failed to add product');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Add New Product</Text>
                        <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Product Name *</Text>
                        <TextInput style={styles.input} placeholder="e.g. Basmati Rice" placeholderTextColor={COLORS.TEXT_DIM} value={name} onChangeText={setName} />

                        <Text style={styles.label}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                            {CATEGORIES.map(c => (
                                <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                                    <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.row}>
                            <View style={styles.halfField}>
                                <Text style={styles.label}>Selling Price (₹) *</Text>
                                <TextInput style={styles.input} placeholder="150" placeholderTextColor={COLORS.TEXT_DIM} value={price} onChangeText={setPrice} keyboardType="numeric" />
                            </View>
                            <View style={styles.halfField}>
                                <Text style={styles.label}>Purchase Price (₹)</Text>
                                <TextInput style={styles.input} placeholder="120" placeholderTextColor={COLORS.TEXT_DIM} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="numeric" />
                            </View>
                        </View>

                        <Text style={styles.label}>GST Slab</Text>
                        <View style={styles.chipRowInline}>
                            {GST_SLABS.map(g => (
                                <TouchableOpacity key={g} style={[styles.chip, gstPercent === g && styles.chipActive]} onPress={() => setGstPercent(g)}>
                                    <Text style={[styles.chipText, gstPercent === g && styles.chipTextActive]}>{g}%</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Unit</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                            {UNITS.map(u => (
                                <TouchableOpacity key={u} style={[styles.chip, unit === u && styles.chipActive]} onPress={() => setUnit(u)}>
                                    <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.row}>
                            <View style={styles.halfField}>
                                <Text style={styles.label}>Current Stock *</Text>
                                <TextInput style={styles.input} placeholder="50" placeholderTextColor={COLORS.TEXT_DIM} value={currentStock} onChangeText={setCurrentStock} keyboardType="numeric" />
                            </View>
                            <View style={styles.halfField}>
                                <Text style={styles.label}>Min Threshold</Text>
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
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 18, fontFamily: TYPOGRAPHY.HEADING, color: COLORS.TEXT_HEADING },
    closeBtn: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    form: { padding: SPACING.BASE },
    label: { fontSize: 13, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_DIM, marginTop: SPACING.SM, marginBottom: 4 },
    input: { backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 10, fontFamily: TYPOGRAPHY.BODY, color: COLORS.TEXT_BODY, borderWidth: 1, borderColor: COLORS.BORDER },
    row: { flexDirection: 'row', gap: SPACING.SM },
    halfField: { flex: 1 },
    chipRow: { flexDirection: 'row', marginBottom: SPACING.XS },
    chipRowInline: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.XS, marginBottom: SPACING.XS },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.BORDER, marginRight: SPACING.XS, backgroundColor: COLORS.BACKGROUND },
    chipActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '18' },
    chipText: { fontSize: 12, fontFamily: TYPOGRAPHY.BODY, color: COLORS.TEXT_DIM },
    chipTextActive: { color: COLORS.PRIMARY, fontFamily: TYPOGRAPHY.BODY_BOLD },
    saveBtn: { backgroundColor: COLORS.PRIMARY, margin: SPACING.BASE, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center' },
    saveBtnText: { color: COLORS.WHITE, fontSize: 16, fontFamily: TYPOGRAPHY.BODY_BOLD },
});

export default AddProductModal;
