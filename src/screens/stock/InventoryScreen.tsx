import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import { getProducts } from '../../services/firebase/firestoreService';
import { Product } from '../../models/Product';
import { formatCurrency } from '../../utils/billingUtils';
import AddProductModal from '../../components/AddProductModal';
import RestockModal from '../../components/RestockModal';

type FilterTab = 'all' | 'low' | 'out';

const stockColor = (stock: number, min: number) =>
    stock === 0 ? COLORS.ERROR : stock <= min ? COLORS.WARNING : COLORS.SUCCESS;

const StockBadge = ({ stock, min }: { stock: number; min: number }) => (
    <View style={[styles.badge, { backgroundColor: stockColor(stock, min) + '22' }]}>
        <Text style={[styles.badgeText, { color: stockColor(stock, min) }]}>
            {stock === 0 ? '❌ OUT' : stock <= min ? '⚠️ LOW' : '✅ OK'} · {stock}
        </Text>
    </View>
);

// Accept optional prop to open directly on Low Stock view
const InventoryScreen = ({ route }: { route?: { params?: { filter?: FilterTab } } }) => {
    const initialFilter: FilterTab = route?.params?.filter || 'all';

    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [restockProduct, setRestockProduct] = useState<Product | null>(null);
    const [activeTab, setActiveTab] = useState<FilterTab>(initialFilter);

    const loadProducts = useCallback(async () => {
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    const lowCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minThreshold).length;
    const outCount = products.filter(p => p.currentStock === 0).length;

    const displayed = products
        .filter(p => {
            if (activeTab === 'low') return p.currentStock > 0 && p.currentStock <= p.minThreshold;
            if (activeTab === 'out') return p.currentStock === 0;
            return true;
        })
        .filter(p => {
            const q = search.toLowerCase();
            return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
        });

    const onRefresh = async () => { setRefreshing(true); await loadProducts(); setRefreshing(false); };

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.row}>
            <View style={styles.rowLeft}>
                <View style={[styles.catDot, { backgroundColor: stockColor(item.currentStock, item.minThreshold) + '55' }]}>
                    <Text style={styles.catDotText}>{item.category.charAt(0)}</Text>
                </View>
            </View>
            <View style={styles.rowInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.itemPrice}>
                    {formatCurrency(item.price)} / {item.unit}  ·  GST {item.gstPercent}%
                </Text>
            </View>
            <View style={styles.rowRight}>
                <StockBadge stock={item.currentStock} min={item.minThreshold} />
                <Text style={styles.stockUnit}>{item.currentStock} {item.unit}</Text>
                <TouchableOpacity style={styles.restockBtn} onPress={() => setRestockProduct(item)}>
                    <Text style={styles.restockText}>＋ Restock</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Inventory</Text>
                    <Text style={styles.subtitle}>{products.length} products · {lowCount} low · {outCount} out</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addBtnText}>＋ Add Product</Text>
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabRow}>
                {([
                    { key: 'all', label: `All (${products.length})`, icon: '📦' },
                    { key: 'low', label: `Low Stock (${lowCount})`, icon: '⚠️', color: COLORS.WARNING },
                    { key: 'out', label: `Out of Stock (${outCount})`, icon: '❌', color: COLORS.ERROR },
                ] as { key: FilterTab; label: string; icon: string; color?: string }[]).map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && { borderColor: tab.color || COLORS.PRIMARY, backgroundColor: (tab.color || COLORS.PRIMARY) + '12' }]}
                        onPress={() => setActiveTab(tab.key)}>
                        <Text style={styles.tabIcon}>{tab.icon}</Text>
                        <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color || COLORS.PRIMARY, fontWeight: '700' }]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search */}
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

            {/* List */}
            <FlatList
                data={displayed}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyIcon}>
                            {activeTab === 'low' ? '✅' : activeTab === 'out' ? '🎉' : '📦'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {loading ? 'Loading...' :
                                activeTab === 'low' ? 'No low stock items!' :
                                    activeTab === 'out' ? 'No items out of stock!' :
                                        'No products found.'}
                        </Text>
                    </View>
                }
            />

            <AddProductModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdded={loadProducts} />
            <RestockModal visible={restockProduct !== null} product={restockProduct} onClose={() => setRestockProduct(null)} onRestocked={loadProducts} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 22, fontWeight: '800', color: COLORS.TEXT_HEADING },
    subtitle: { fontSize: 12, color: COLORS.TEXT_DIM },
    addBtn: { backgroundColor: COLORS.PRIMARY, paddingHorizontal: SPACING.MD, paddingVertical: 8, borderRadius: RADIUS.MD },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
    tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.SM, paddingVertical: SPACING.XS, gap: SPACING.XS, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7, borderRadius: RADIUS.MD, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
    tabIcon: { fontSize: 12 },
    tabText: { fontSize: 10, color: COLORS.TEXT_DIM, fontWeight: '600' },
    searchBox: { flexDirection: 'row', alignItems: 'center', margin: SPACING.SM, backgroundColor: COLORS.WHITE, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, borderWidth: 1, borderColor: COLORS.BORDER },
    searchIcon: { fontSize: 16, marginRight: SPACING.SM },
    searchInput: { flex: 1, height: 40, color: COLORS.TEXT_BODY },
    list: { paddingHorizontal: SPACING.SM, paddingBottom: SPACING.XL },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG, padding: SPACING.MD, marginBottom: SPACING.SM, elevation: 1, gap: SPACING.SM },
    rowLeft: {},
    catDot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    catDotText: { fontSize: 14, fontWeight: '800', color: COLORS.TEXT_HEADING },
    rowInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT_HEADING },
    itemCategory: { fontSize: 11, color: COLORS.TEXT_DIM, marginTop: 1 },
    itemPrice: { fontSize: 11, color: COLORS.TEXT_BODY, marginTop: 3 },
    rowRight: { alignItems: 'flex-end', gap: 4 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    stockUnit: { fontSize: 10, color: COLORS.TEXT_DIM },
    restockBtn: { backgroundColor: COLORS.SUCCESS + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: COLORS.SUCCESS },
    restockText: { fontSize: 11, color: COLORS.SUCCESS, fontWeight: '700' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.XL },
    emptyIcon: { fontSize: 40, marginBottom: SPACING.SM },
    emptyText: { color: COLORS.TEXT_DIM, fontSize: 14 },
});

export default InventoryScreen;
