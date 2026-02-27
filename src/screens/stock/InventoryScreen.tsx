import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../config/theme';
import { getProducts } from '../../services/firebase/firestoreService';
import { Product } from '../../models/Product';
import { formatCurrency } from '../../utils/billingUtils';
import AddProductModal from '../../components/AddProductModal';
import RestockModal from '../../components/RestockModal';

const stockColor = (stock: number, min: number) => {
    if (stock === 0) return COLORS.ERROR;
    if (stock <= min) return COLORS.WARNING;
    return COLORS.SUCCESS;
};

const StockBadge = ({ stock, min }: { stock: number; min: number }) => (
    <View style={[styles.badge, { backgroundColor: stockColor(stock, min) + '22' }]}>
        <Text style={[styles.badgeText, { color: stockColor(stock, min) }]}>
            {stock === 0 ? 'CRITICAL' : stock <= min ? 'LOW' : 'OK'} · {stock}
        </Text>
    </View>
);

const InventoryScreen = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filtered, setFiltered] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [restockProduct, setRestockProduct] = useState<Product | null>(null);

    const loadProducts = useCallback(async () => {
        const data = await getProducts();
        setProducts(data);
        setFiltered(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q),
        ));
    }, [search, products]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    };

    const lowStockCount = products.filter(p => p.currentStock <= p.minThreshold).length;

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.row}>
            <View style={styles.rowInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category} · {item.unit}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)} (GST {item.gstPercent}%)</Text>
            </View>
            <View style={styles.rowRight}>
                <StockBadge stock={item.currentStock} min={item.minThreshold} />
                <TouchableOpacity style={styles.restockBtn} onPress={() => setRestockProduct(item)}>
                    <Text style={styles.restockText}>＋ Restock</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Inventory</Text>
                    <Text style={styles.subtitle}>{products.length} products · {lowStockCount} low stock</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addBtnText}>＋ Add</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or category..."
                    placeholderTextColor={COLORS.TEXT_DIM}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {lowStockCount > 0 && (
                <View style={styles.alertBanner}>
                    <Text style={styles.alertText}>⚠️  {lowStockCount} items need restocking</Text>
                </View>
            )}

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>{loading ? 'Loading...' : 'No products found.'}</Text>
                    </View>
                }
            />

            <AddProductModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdded={loadProducts}
            />

            <RestockModal
                visible={restockProduct !== null}
                product={restockProduct}
                onClose={() => setRestockProduct(null)}
                onRestocked={loadProducts}
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
    title: { fontSize: 22, fontFamily: TYPOGRAPHY.HEADING, color: COLORS.TEXT_HEADING },
    subtitle: { fontSize: 12, color: COLORS.TEXT_DIM },
    addBtn: {
        backgroundColor: COLORS.PRIMARY, paddingHorizontal: SPACING.MD,
        paddingVertical: 8, borderRadius: RADIUS.MD,
    },
    addBtnText: { color: '#fff', fontFamily: TYPOGRAPHY.BODY_BOLD },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        margin: SPACING.BASE, backgroundColor: COLORS.WHITE,
        borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD,
        borderWidth: 1, borderColor: COLORS.BORDER,
    },
    searchIcon: { fontSize: 16, marginRight: SPACING.SM },
    searchInput: { flex: 1, height: 44, fontFamily: TYPOGRAPHY.BODY, color: COLORS.TEXT_BODY },
    alertBanner: {
        marginHorizontal: SPACING.BASE, marginBottom: SPACING.SM,
        backgroundColor: COLORS.WARNING + '22', padding: SPACING.SM,
        borderRadius: RADIUS.SM, borderLeftWidth: 3, borderLeftColor: COLORS.WARNING,
    },
    alertText: { fontFamily: TYPOGRAPHY.BODY, color: COLORS.TEXT_HEADING },
    list: { paddingHorizontal: SPACING.BASE, paddingBottom: SPACING.XL },
    row: {
        flexDirection: 'row', justifyContent: 'space-between',
        backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG,
        padding: SPACING.MD, marginBottom: SPACING.SM, elevation: 1,
    },
    rowInfo: { flex: 1 },
    itemName: { fontSize: 15, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_HEADING },
    itemCategory: { fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 2 },
    itemPrice: { fontSize: 12, fontFamily: TYPOGRAPHY.MONO, color: COLORS.TEXT_BODY, marginTop: 4 },
    rowRight: { alignItems: 'flex-end', gap: SPACING.SM },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 11, fontFamily: TYPOGRAPHY.BODY_BOLD },
    restockBtn: {
        backgroundColor: COLORS.SUCCESS + '22', paddingHorizontal: 10,
        paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: COLORS.SUCCESS,
    },
    restockText: { fontSize: 12, color: COLORS.SUCCESS, fontFamily: TYPOGRAPHY.BODY_BOLD },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.XL },
    emptyText: { color: COLORS.TEXT_DIM },
});

export default InventoryScreen;
