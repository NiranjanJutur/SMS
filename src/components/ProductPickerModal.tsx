import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TextInput, TouchableOpacity,
    FlatList, Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../config/theme';
import { getProducts } from '../services/firebase/firestoreService';
import { Product } from '../models/Product';
import { formatCurrency } from '../utils/billingUtils';

interface ProductPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (product: Product, qty: number) => void;
}

const ProductPickerModal = ({ visible, onClose, onSelect }: ProductPickerModalProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filtered, setFiltered] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [qty, setQty] = useState('1');

    useEffect(() => {
        if (visible) {
            getProducts().then(data => {
                const active = data.filter(p => p.isActive && p.currentStock > 0);
                setProducts(active);
                setFiltered(active);
            });
        }
    }, [visible]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q),
        ));
    }, [search, products]);

    const handleAdd = () => {
        if (!selectedProduct) return;
        const quantity = Number(qty) || 1;
        if (quantity > selectedProduct.currentStock) {
            Alert.alert('Insufficient Stock', `Only ${selectedProduct.currentStock} ${selectedProduct.unit} available`);
            return;
        }
        onSelect(selectedProduct, quantity);
        setSelectedProduct(null);
        setQty('1');
        setSearch('');
        onClose();
    };

    const renderItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={[styles.productRow, selectedProduct?.id === item.id && styles.productRowSelected]}
            onPress={() => setSelectedProduct(item)}
            activeOpacity={0.7}
        >
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productMeta}>{item.category} · {item.unit} · Stock: {item.currentStock}</Text>
            </View>
            <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Product</Text>
                        <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
                    </View>

                    <View style={styles.searchBox}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search products..."
                            placeholderTextColor={COLORS.TEXT_DIM}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    <FlatList
                        data={filtered}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={styles.emptyText}>No products found</Text>
                            </View>
                        }
                    />

                    {selectedProduct && (
                        <View style={styles.footer}>
                            <Text style={styles.selectedName}>{selectedProduct.name}</Text>
                            <View style={styles.qtyRow}>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(String(Math.max(1, Number(qty) - 1)))}>
                                    <Text style={styles.qtyBtnText}>−</Text>
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.qtyInput}
                                    value={qty}
                                    onChangeText={setQty}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(String(Number(qty) + 1))}>
                                    <Text style={styles.qtyBtnText}>+</Text>
                                </TouchableOpacity>
                                <Text style={styles.unitLabel}>{selectedProduct.unit}</Text>
                            </View>
                            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                                <Text style={styles.addBtnText}>Add to Cart — {formatCurrency(selectedProduct.price * (Number(qty) || 1))}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 18, fontFamily: TYPOGRAPHY.HEADING, color: COLORS.TEXT_HEADING },
    closeBtn: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    searchBox: { flexDirection: 'row', alignItems: 'center', margin: SPACING.SM, backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, borderWidth: 1, borderColor: COLORS.BORDER },
    searchIcon: { fontSize: 14, marginRight: SPACING.SM },
    searchInput: { flex: 1, height: 40, fontFamily: TYPOGRAPHY.BODY, color: COLORS.TEXT_BODY },
    list: { paddingHorizontal: SPACING.SM },
    productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.MD, borderRadius: RADIUS.MD, marginBottom: 4, backgroundColor: COLORS.BACKGROUND },
    productRowSelected: { backgroundColor: COLORS.PRIMARY + '15', borderWidth: 1, borderColor: COLORS.PRIMARY },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_HEADING },
    productMeta: { fontSize: 11, color: COLORS.TEXT_DIM, marginTop: 2 },
    productPrice: { fontSize: 14, fontFamily: TYPOGRAPHY.MONO, fontWeight: '700', color: COLORS.PRIMARY },
    center: { padding: SPACING.XL, alignItems: 'center' },
    emptyText: { color: COLORS.TEXT_DIM },
    footer: { padding: SPACING.BASE, borderTopWidth: 1, borderTopColor: COLORS.BORDER, backgroundColor: COLORS.WHITE },
    selectedName: { fontSize: 15, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_HEADING, marginBottom: SPACING.SM },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, marginBottom: SPACING.SM },
    qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.BORDER, justifyContent: 'center', alignItems: 'center' },
    qtyBtnText: { fontSize: 18, color: COLORS.TEXT_HEADING },
    qtyInput: { width: 50, textAlign: 'center', fontSize: 18, fontFamily: TYPOGRAPHY.MONO, color: COLORS.TEXT_BODY, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    unitLabel: { fontSize: 14, color: COLORS.TEXT_DIM, fontFamily: TYPOGRAPHY.BODY },
    addBtn: { backgroundColor: COLORS.PRIMARY, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center' },
    addBtnText: { color: COLORS.WHITE, fontSize: 15, fontFamily: TYPOGRAPHY.BODY_BOLD },
});

export default ProductPickerModal;
