import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TextInput, TouchableOpacity,
    Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../config/theme';
import { updateStock } from '../services/firebase/firestoreService';
import { Product } from '../models/Product';

interface RestockModalProps {
    visible: boolean;
    product: Product | null;
    onClose: () => void;
    onRestocked: () => void;
}

const RestockModal = ({ visible, product, onClose, onRestocked }: RestockModalProps) => {
    const [qty, setQty] = useState('');
    const [saving, setSaving] = useState(false);

    const handleRestock = async () => {
        if (!product) return;
        if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) {
            Alert.alert('Error', 'Enter a valid quantity');
            return;
        }

        setSaving(true);
        try {
            const newStock = product.currentStock + Number(qty);
            await updateStock(product.id, newStock);
            setQty('');
            onRestocked();
            onClose();
            Alert.alert('✅ Restocked', `${product.name} stock updated to ${newStock} ${product.unit}`);
        } catch (e) {
            Alert.alert('Error', 'Failed to update stock');
        } finally {
            setSaving(false);
        }
    };

    if (!product) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Restock</Text>
                        <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.meta}>{product.category} · {product.unit}</Text>

                        <View style={styles.stockInfo}>
                            <View style={styles.stockBox}>
                                <Text style={styles.stockLabel}>Current</Text>
                                <Text style={[styles.stockValue,
                                product.currentStock <= product.minThreshold
                                    ? { color: COLORS.ERROR } : { color: COLORS.SUCCESS }
                                ]}>{product.currentStock}</Text>
                            </View>
                            <Text style={styles.arrow}>→</Text>
                            <View style={styles.stockBox}>
                                <Text style={styles.stockLabel}>After</Text>
                                <Text style={[styles.stockValue, { color: COLORS.SUCCESS }]}>
                                    {product.currentStock + (Number(qty) || 0)}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.label}>Add Quantity ({product.unit})</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 20"
                            placeholderTextColor={COLORS.TEXT_DIM}
                            value={qty}
                            onChangeText={setQty}
                            keyboardType="numeric"
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleRestock} disabled={saving}>
                        <Text style={styles.saveBtnText}>{saving ? 'Updating...' : '📦 Restock'}</Text>
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
    title: { fontSize: 18, fontFamily: TYPOGRAPHY.HEADING, color: COLORS.TEXT_HEADING },
    closeBtn: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    body: { padding: SPACING.BASE },
    productName: { fontSize: 20, fontFamily: TYPOGRAPHY.HEADING, color: COLORS.TEXT_HEADING },
    meta: { fontSize: 13, color: COLORS.TEXT_DIM, marginTop: 2 },
    stockInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: SPACING.LG, gap: SPACING.MD },
    stockBox: { alignItems: 'center', backgroundColor: COLORS.BACKGROUND, padding: SPACING.MD, borderRadius: RADIUS.LG, width: 100 },
    stockLabel: { fontSize: 12, color: COLORS.TEXT_DIM, fontFamily: TYPOGRAPHY.BODY },
    stockValue: { fontSize: 28, fontFamily: TYPOGRAPHY.MONO, fontWeight: '700' },
    arrow: { fontSize: 24, color: COLORS.TEXT_DIM },
    label: { fontSize: 13, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_DIM, marginBottom: 4 },
    input: { backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 12, fontFamily: TYPOGRAPHY.BODY, color: COLORS.TEXT_BODY, borderWidth: 1, borderColor: COLORS.BORDER, fontSize: 18, textAlign: 'center' },
    saveBtn: { backgroundColor: COLORS.SUCCESS, margin: SPACING.BASE, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center' },
    saveBtnText: { color: COLORS.WHITE, fontSize: 16, fontFamily: TYPOGRAPHY.BODY_BOLD },
});

export default RestockModal;
