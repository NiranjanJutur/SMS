import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ScrollView, Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../config/theme';
import { useCart, CartItem } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/billingUtils';
import { PAYMENT_MODES } from '../../config/constants';
import ProductPickerModal from '../../components/ProductPickerModal';

const PAYMENT_OPTIONS = [
    { key: 'CASH', label: 'Cash', icon: '💵' },
    { key: 'UPI', label: 'UPI', icon: '📱' },
    { key: 'CARD', label: 'Card', icon: '💳' },
    { key: 'UDHAAR', label: 'Udhaar', icon: '📒' },
];

interface BillingScreenProps {
    route?: any;
    navigation?: any;
}

const BillingScreen = ({ navigation }: BillingScreenProps) => {
    const { items, customer, addItem, removeItem, updateQty, clearCart, checkout, totals, billNo } = useCart('cashier-1');
    const [selectedPayment, setSelectedPayment] = useState('CASH');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    const handleCheckout = async () => {
        if (items.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to the cart first.');
            return;
        }
        setIsCheckingOut(true);
        try {
            const result = await checkout(selectedPayment);
            Alert.alert('✅ Bill Generated!', `Bill ${billNo} created.\nTotal: ${formatCurrency(totals.grandTotal)}`);
        } catch (e) {
            Alert.alert('Error', 'Failed to generate bill. Please try again.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const renderItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemMeta}>{formatCurrency(item.product.price)} · GST {item.product.gstPercent}%</Text>
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
            <Text style={styles.itemTotal}>{formatCurrency(item.product.price * item.quantity)}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>New Bill</Text>
                    <Text style={styles.billNo}>{billNo}</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.addItemBtn} onPress={() => setShowPicker(true)}>
                        <Text style={styles.addItemBtnText}>＋ Add Item</Text>
                    </TouchableOpacity>
                    <View style={styles.customerTag}>
                        <Text style={styles.customerText}>{customer ? customer.name : '📦 Walk-in'}</Text>
                    </View>
                </View>
            </View>

            {/* Cart */}
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.product.id}
                contentContainerStyle={styles.cartList}
                ListEmptyComponent={
                    <View style={styles.emptyCart}>
                        <Text style={styles.emptyIcon}>🛒</Text>
                        <Text style={styles.emptyText}>Cart is empty</Text>
                        <Text style={styles.emptyHint}>Tap "＋ Add Item" to add products</Text>
                        <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowPicker(true)}>
                            <Text style={styles.emptyAddBtnText}>＋ Browse Products</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Footer */}
            {items.length > 0 && (
                <View style={styles.footer}>
                    {/* Totals */}
                    <View style={styles.totalsBox}>
                        {[
                            { label: 'Subtotal', value: totals.subtotal },
                            { label: 'GST', value: totals.totalGst },
                        ].map(t => (
                            <View key={t.label} style={styles.totalRow}>
                                <Text style={styles.totalLabel}>{t.label}</Text>
                                <Text style={styles.totalVal}>{formatCurrency(t.value)}</Text>
                            </View>
                        ))}
                        <View style={[styles.totalRow, styles.grandRow]}>
                            <Text style={styles.grandLabel}>Grand Total</Text>
                            <Text style={styles.grandVal}>{formatCurrency(totals.grandTotal)}</Text>
                        </View>
                    </View>

                    {/* Payment Mode */}
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

                    {/* Checkout */}
                    <TouchableOpacity
                        style={[styles.checkoutBtn, isCheckingOut && { opacity: 0.6 }]}
                        onPress={handleCheckout}
                        disabled={isCheckingOut}>
                        <Text style={styles.checkoutText}>{isCheckingOut ? 'Processing...' : '✅ Generate Bill'}</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ProductPickerModal
                visible={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={(product, qty) => addItem(product, qty)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: SPACING.BASE, backgroundColor: COLORS.WHITE,
        borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
    },
    title: { fontSize: 20, fontFamily: TYPOGRAPHY.HEADING, color: COLORS.TEXT_HEADING },
    billNo: { fontSize: 12, fontFamily: TYPOGRAPHY.MONO, color: COLORS.TEXT_DIM },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM },
    addItemBtn: {
        backgroundColor: COLORS.SUCCESS, paddingHorizontal: SPACING.MD,
        paddingVertical: 6, borderRadius: RADIUS.MD,
    },
    addItemBtnText: { color: '#fff', fontFamily: TYPOGRAPHY.BODY_BOLD, fontSize: 12 },
    customerTag: {
        backgroundColor: COLORS.PRIMARY + '22', paddingHorizontal: SPACING.MD,
        paddingVertical: 6, borderRadius: RADIUS.MD,
    },
    customerText: { fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.PRIMARY, fontSize: 13 },
    cartList: { padding: SPACING.BASE, flexGrow: 1 },
    cartItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.WHITE,
        borderRadius: RADIUS.LG, padding: SPACING.MD, marginBottom: SPACING.SM, elevation: 1,
    },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 15, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_HEADING },
    itemMeta: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 2 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.SM, marginRight: SPACING.MD },
    qtyBtn: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.BORDER,
        justifyContent: 'center', alignItems: 'center',
    },
    qtyBtnText: { fontSize: 16, color: COLORS.TEXT_HEADING, lineHeight: 20 },
    qtyVal: { fontSize: 14, fontFamily: TYPOGRAPHY.MONO, color: COLORS.TEXT_BODY, minWidth: 40, textAlign: 'center' },
    itemTotal: { fontSize: 15, fontFamily: TYPOGRAPHY.MONO, fontWeight: '700', color: COLORS.TEXT_HEADING, minWidth: 64, textAlign: 'right' },
    emptyCart: { flex: 1, alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: SPACING.MD },
    emptyText: { fontSize: 18, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_DIM },
    emptyHint: { fontSize: 13, color: COLORS.TEXT_DIM, marginTop: 4 },
    emptyAddBtn: { marginTop: SPACING.LG, backgroundColor: COLORS.PRIMARY, paddingHorizontal: SPACING.LG, paddingVertical: SPACING.MD, borderRadius: RADIUS.LG },
    emptyAddBtnText: { color: COLORS.WHITE, fontFamily: TYPOGRAPHY.BODY_BOLD, fontSize: 15 },
    footer: {
        backgroundColor: COLORS.WHITE, padding: SPACING.BASE,
        borderTopWidth: 1, borderTopColor: COLORS.BORDER,
    },
    totalsBox: { marginBottom: SPACING.SM },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    totalLabel: { color: COLORS.TEXT_DIM, fontFamily: TYPOGRAPHY.BODY },
    totalVal: { fontFamily: TYPOGRAPHY.MONO, color: COLORS.TEXT_BODY },
    grandRow: { paddingTop: SPACING.SM, borderTopWidth: 1, borderTopColor: COLORS.BORDER, marginTop: 4 },
    grandLabel: { fontSize: 16, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_HEADING },
    grandVal: { fontSize: 20, fontFamily: TYPOGRAPHY.MONO, fontWeight: '700', color: COLORS.PRIMARY },
    paymentRow: { flexDirection: 'row', marginVertical: SPACING.SM },
    payBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: SPACING.MD, paddingVertical: 8,
        borderRadius: RADIUS.XL, borderWidth: 1.5, borderColor: COLORS.BORDER,
        marginRight: SPACING.SM, backgroundColor: COLORS.BACKGROUND,
    },
    payBtnActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '15' },
    payBtnText: { fontFamily: TYPOGRAPHY.BODY, color: COLORS.TEXT_DIM, fontSize: 13 },
    payBtnTextActive: { color: COLORS.PRIMARY, fontFamily: TYPOGRAPHY.BODY_BOLD },
    checkoutBtn: {
        backgroundColor: COLORS.PRIMARY, padding: SPACING.MD,
        borderRadius: RADIUS.LG, alignItems: 'center', marginTop: SPACING.SM,
    },
    checkoutText: { color: COLORS.WHITE, fontSize: 17, fontFamily: TYPOGRAPHY.BODY_BOLD },
});

export default BillingScreen;
