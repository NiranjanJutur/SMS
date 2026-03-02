import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import { useCart, CartItem } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/billingUtils';
import ProductPickerModal from '../../components/ProductPickerModal';

const PAYMENT_OPTIONS = [
    { key: 'CASH', label: 'Cash', icon: '\uD83D\uDCB5' },
    { key: 'UPI', label: 'UPI', icon: '\uD83D\uDCF1' },
    { key: 'CARD', label: 'Card', icon: '\uD83D\uDCB3' },
    { key: 'UDHAAR', label: 'Udhaar', icon: '\uD83D\uDCD2' },
];

const BillingScreen = () => {
    const { items, customer, addItem, updateQty, clearCart, checkout, totals, billNo } = useCart('cashier-1');
    const [selectedPayment, setSelectedPayment] = useState('CASH');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    const handleCheckout = async () => {
        if (items.length === 0) { Alert.alert('Empty Cart', 'Add items first.'); return; }
        setIsCheckingOut(true);
        try {
            await checkout(selectedPayment);
            Alert.alert('\u2705 Bill Done!', `${billNo}\nTotal: ${formatCurrency(totals.grandTotal)}`);
        } catch {
            Alert.alert('Error', 'Failed to generate bill.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const renderItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemMeta}>{formatCurrency(item.product.price)} \u00B7 GST {item.product.gstPercent}%</Text>
            </View>
            <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.product.id, item.quantity - 1)}>
                    <Text style={styles.qtyBtnText}>\u2212</Text>
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{item.quantity} {item.product.unit}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.product.id, item.quantity + 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.itemTotal}>{formatCurrency(item.product.price * item.quantity)}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>New Bill</Text>
                    <Text style={styles.billNo}>{billNo}</Text>
                </View>
                <TouchableOpacity style={styles.addItemBtn} onPress={() => setShowPicker(true)}>
                    <Text style={styles.addItemBtnText}>\uFF0B Add Item</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.product.id}
                contentContainerStyle={styles.cartList}
                ListEmptyComponent={
                    <View style={styles.emptyCart}>
                        <Text style={styles.emptyIcon}>\uD83D\uDED2</Text>
                        <Text style={styles.emptyText}>Cart is empty</Text>
                        <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowPicker(true)}>
                            <Text style={styles.emptyAddBtnText}>\uFF0B Browse Products</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {items.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalVal}>{formatCurrency(totals.subtotal)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>GST</Text>
                            <Text style={styles.totalVal}>{formatCurrency(totals.totalGst)}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandRow]}>
                            <Text style={styles.grandLabel}>Grand Total</Text>
                            <Text style={styles.grandVal}>{formatCurrency(totals.grandTotal)}</Text>
                        </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paymentRow}>
                        {PAYMENT_OPTIONS.map(p => (
                            <TouchableOpacity
                                key={p.key}
                                style={[styles.payBtn, selectedPayment === p.key && styles.payBtnActive]}
                                onPress={() => setSelectedPayment(p.key)}>
                                <Text>{p.icon}</Text>
                                <Text style={[styles.payBtnText, selectedPayment === p.key && styles.payBtnTextActive]}>{p.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.checkoutBtn, isCheckingOut && { opacity: 0.6 }]}
                        onPress={handleCheckout}
                        disabled={isCheckingOut}>
                        <Text style={styles.checkoutText}>{isCheckingOut ? 'Processing...' : '\u2705 Generate Bill'}</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ProductPickerModal visible={showPicker} onClose={() => setShowPicker(false)} onSelect={(product, qty) => addItem(product, qty)} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.TEXT_HEADING },
    billNo: { fontSize: 12, color: COLORS.TEXT_DIM },
    addItemBtn: { backgroundColor: COLORS.SUCCESS, paddingHorizontal: SPACING.MD, paddingVertical: 8, borderRadius: RADIUS.MD },
    addItemBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    cartList: { padding: SPACING.BASE, flexGrow: 1 },
    cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG, padding: SPACING.MD, marginBottom: SPACING.SM, elevation: 1 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT_HEADING },
    itemMeta: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 2 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, marginRight: SPACING.MD },
    qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.BORDER, justifyContent: 'center', alignItems: 'center' },
    qtyBtnText: { fontSize: 16, color: COLORS.TEXT_HEADING },
    qtyVal: { fontSize: 14, color: COLORS.TEXT_BODY, minWidth: 40, textAlign: 'center' },
    itemTotal: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT_HEADING, minWidth: 64, textAlign: 'right' },
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
    grandRow: { paddingTop: SPACING.SM, borderTopWidth: 1, borderTopColor: COLORS.BORDER, marginTop: 4 },
    grandLabel: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT_HEADING },
    grandVal: { fontSize: 20, fontWeight: '800', color: COLORS.PRIMARY },
    paymentRow: { flexDirection: 'row', marginVertical: SPACING.SM },
    payBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.MD, paddingVertical: 8, borderRadius: RADIUS.XL, borderWidth: 1.5, borderColor: COLORS.BORDER, marginRight: SPACING.SM, backgroundColor: COLORS.BACKGROUND },
    payBtnActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '15' },
    payBtnText: { color: COLORS.TEXT_DIM, fontSize: 13 },
    payBtnTextActive: { color: COLORS.PRIMARY, fontWeight: '700' },
    checkoutBtn: { backgroundColor: COLORS.PRIMARY, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center', marginTop: SPACING.SM },
    checkoutText: { color: COLORS.WHITE, fontSize: 17, fontWeight: '700' },
});

export default BillingScreen;
