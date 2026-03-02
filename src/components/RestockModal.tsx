import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../config/theme';
import { updateStock } from '../services/firebase/firestoreService';
import { Product } from '../models/Product';

const RestockModal = ({ visible, product, onClose, onRestocked }: { visible: boolean; product: Product | null; onClose: () => void; onRestocked: () => void }) => {
    const [qty, setQty] = useState('');
    const [saving, setSaving] = useState(false);

    const handleRestock = async () => {
        if (!product) return;
        if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) { Alert.alert('Error', 'Enter valid quantity'); return; }
        setSaving(true);
        try {
            const newStock = product.currentStock + Number(qty);
            await updateStock(product.id, newStock);
            setQty(''); onRestocked(); onClose();
            Alert.alert('\u2705 Restocked', `${product.name} is now ${newStock} ${product.unit}`);
        } catch { Alert.alert('Error', 'Failed to update stock'); }
        finally { setSaving(false); }
    };

    if (!product) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Restock</Text>
                        <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>\u2715</Text></TouchableOpacity>
                    </View>
                    <View style={styles.body}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.meta}>{product.category} \u00B7 {product.unit}</Text>
                        <View style={styles.stockInfo}>
                            <View style={styles.stockBox}>
                                <Text style={styles.stockLabel}>Current</Text>
                                <Text style={[styles.stockValue, { color: product.currentStock <= product.minThreshold ? COLORS.ERROR : COLORS.SUCCESS }]}>{product.currentStock}</Text>
                            </View>
                            <Text style={styles.arrow}>\u2192</Text>
                            <View style={styles.stockBox}>
                                <Text style={styles.stockLabel}>After</Text>
                                <Text style={[styles.stockValue, { color: COLORS.SUCCESS }]}>{product.currentStock + (Number(qty) || 0)}</Text>
                            </View>
                        </View>
                        <Text style={styles.label}>Add Quantity ({product.unit})</Text>
                        <TextInput style={styles.input} placeholder="e.g. 20" placeholderTextColor={COLORS.TEXT_DIM} value={qty} onChangeText={setQty} keyboardType="numeric" autoFocus />
                    </View>
                    <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleRestock} disabled={saving}>
                        <Text style={styles.saveBtnText}>{saving ? 'Updating...' : '\uD83D\uDCE6 Restock'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT_HEADING },
    closeBtn: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    body: { padding: SPACING.BASE },
    productName: { fontSize: 20, fontWeight: '800', color: COLORS.TEXT_HEADING },
    meta: { fontSize: 13, color: COLORS.TEXT_DIM, marginTop: 2 },
    stockInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: SPACING.LG, gap: SPACING.MD },
    stockBox: { alignItems: 'center', backgroundColor: COLORS.BACKGROUND, padding: SPACING.MD, borderRadius: RADIUS.LG, width: 100 },
    stockLabel: { fontSize: 12, color: COLORS.TEXT_DIM },
    stockValue: { fontSize: 28, fontWeight: '800' },
    arrow: { fontSize: 24, color: COLORS.TEXT_DIM },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_DIM, marginBottom: 4 },
    input: { backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 12, color: COLORS.TEXT_BODY, borderWidth: 1, borderColor: COLORS.BORDER, fontSize: 18, textAlign: 'center' },
    saveBtn: { backgroundColor: COLORS.SUCCESS, margin: SPACING.BASE, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center' },
    saveBtnText: { color: COLORS.WHITE, fontSize: 16, fontWeight: '700' },
});

export default RestockModal;
