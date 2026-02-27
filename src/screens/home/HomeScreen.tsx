import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../config/theme';
import { getTransactions, getProducts } from '../../services/firebase/firestoreService';
import { useUdhaar } from '../../hooks/useUdhaar';
import { useVoice } from '../../hooks/useVoice';
import { formatCurrency } from '../../utils/billingUtils';
import AddProductModal from '../../components/AddProductModal';

const QuickAction = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.quickIcon}>{icon}</Text>
        <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
);

interface HomeScreenProps {
    role: string;
    navigation: any;
}

const HomeScreen = ({ role, navigation }: HomeScreenProps) => {
    const [todaySales, setTodaySales] = useState(0);
    const [billsToday, setBillsToday] = useState(0);
    const [lowStockCount, setLowStockCount] = useState(0);
    const { totalOutstanding } = useUdhaar();
    const { startListening } = useVoice();
    const [showAddProduct, setShowAddProduct] = useState(false);

    const loadData = () => {
        const todayStr = new Date().toDateString();
        getTransactions().then(data => {
            const todayTxns = data.filter(t => new Date(t.timestamp).toDateString() === todayStr);
            setTodaySales(todayTxns.reduce((s, t) => s + t.grandTotal, 0));
            setBillsToday(todayTxns.length);
        });
        getProducts().then(prods => {
            setLowStockCount(prods.filter(p => p.currentStock <= p.minThreshold).length);
        });
    };

    useEffect(() => { loadData(); }, []);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) { return 'Good Morning 🌅'; }
        if (h < 17) { return 'Good Afternoon ☀️'; }
        return 'Good Evening 🌙';
    };

    const handleScanItem = () => {
        navigation.navigate('ScanScreen');
    };

    const handleVoiceAdd = () => {
        Alert.alert(
            '🎤 Voice Input',
            'Say a command like:\n"Add 2 kg Basmati Rice"\n"Restock 50 Sugar"',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start Listening',
                    onPress: () => {
                        startListening();
                        setTimeout(() => {
                            Alert.alert('🎤 Heard', '"Add 2 kg Basmati Rice"\n\nParsed action will be applied.');
                        }, 2500);
                    },
                },
            ],
        );
    };

    const handleReports = () => {
        navigation.navigate('Dashboard');
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={styles.hero}>
                <Text style={styles.greeting}>{greeting()}</Text>
                <Text style={styles.shopName}>Family Grocery</Text>
                <Text style={styles.roleLabel}>{role.replace('_', ' ')}</Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                {[
                    { label: "Today's Sales", value: formatCurrency(todaySales), icon: '💰', color: COLORS.SUCCESS },
                    { label: 'Bills Today', value: `${billsToday}`, icon: '🧾', color: COLORS.SECONDARY },
                    { label: 'Udhaar Due', value: formatCurrency(totalOutstanding), icon: '📒', color: COLORS.ERROR },
                    { label: 'Low Stock', value: `${lowStockCount}`, icon: '⚠️', color: COLORS.WARNING },
                ].map(stat => (
                    <View key={stat.label} style={styles.statCard}>
                        <Text style={styles.statIcon}>{stat.icon}</Text>
                        <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickGrid}>
                {(role === 'CASHIER' || role === 'OWNER') ? (
                    <>
                        <QuickAction icon="📸" label="Scan Item" onPress={handleScanItem} />
                        <QuickAction icon="📝" label="Process Slip" onPress={() => navigation.navigate('SlipProcessing')} />
                        <QuickAction icon="🎤" label="Voice Add" onPress={handleVoiceAdd} />
                        <QuickAction icon="🧾" label="New Bill" onPress={() => navigation.navigate('Billing')} />
                        <QuickAction icon="👥" label="Customers" onPress={() => navigation.navigate('Customers')} />
                    </>
                ) : null}
                {(role === 'STOCK_MANAGER' || role === 'OWNER') ? (
                    <>
                        <QuickAction icon="📦" label="Inventory" onPress={() => navigation.navigate('Items')} />
                        <QuickAction icon="➕" label="Add Product" onPress={() => setShowAddProduct(true)} />
                    </>
                ) : null}
                {(role === 'OWNER' || role === 'ACCOUNTANT') ? (
                    <>
                        <QuickAction icon="📊" label="Dashboard" onPress={() => navigation.navigate('Dashboard')} />
                        <QuickAction icon="📄" label="Reports" onPress={handleReports} />
                    </>
                ) : null}
            </View>

            {lowStockCount > 0 && (
                <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('Items')}>
                    <Text style={styles.alertIcon}>⚠️</Text>
                    <View>
                        <Text style={styles.alertTitle}>{lowStockCount} items running low!</Text>
                        <Text style={styles.alertSub}>Tap to view inventory</Text>
                    </View>
                </TouchableOpacity>
            )}

            <AddProductModal
                visible={showAddProduct}
                onClose={() => setShowAddProduct(false)}
                onAdded={loadData}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    hero: {
        backgroundColor: COLORS.PRIMARY, padding: SPACING.XL,
        paddingTop: SPACING.XXL,
    },
    greeting: { color: '#FFFFFF99', fontFamily: TYPOGRAPHY.BODY, fontSize: 14 },
    shopName: { color: '#FFFFFF', fontSize: 28, fontFamily: TYPOGRAPHY.HEADING, marginTop: 4 },
    roleLabel: {
        color: COLORS.SECONDARY, fontFamily: TYPOGRAPHY.BODY_BOLD,
        fontSize: 12, marginTop: 6, textTransform: 'uppercase',
    },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.SM, gap: SPACING.SM },
    statCard: {
        width: '47%', backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG,
        padding: SPACING.MD, elevation: 1, alignItems: 'center',
    },
    statIcon: { fontSize: 22 },
    statValue: { fontSize: 16, fontFamily: TYPOGRAPHY.MONO, fontWeight: '700', marginTop: 4 },
    statLabel: { fontSize: 11, color: COLORS.TEXT_DIM, textAlign: 'center', marginTop: 2 },
    sectionTitle: {
        fontSize: 14, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_DIM,
        paddingHorizontal: SPACING.BASE, marginTop: SPACING.SM, textTransform: 'uppercase',
        letterSpacing: 1,
    },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.SM, gap: SPACING.SM },
    quickAction: {
        width: '22%', backgroundColor: COLORS.WHITE, borderRadius: RADIUS.LG,
        padding: SPACING.MD, elevation: 1, alignItems: 'center',
    },
    quickIcon: { fontSize: 24 },
    quickLabel: { fontSize: 10, color: COLORS.TEXT_DIM, textAlign: 'center', marginTop: 4 },
    alertCard: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.MD,
        margin: SPACING.BASE, backgroundColor: COLORS.WARNING + '22',
        borderRadius: RADIUS.LG, padding: SPACING.MD,
        borderLeftWidth: 4, borderLeftColor: COLORS.WARNING,
    },
    alertIcon: { fontSize: 28 },
    alertTitle: { fontSize: 14, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_HEADING },
    alertSub: { fontSize: 12, color: COLORS.TEXT_DIM },
});

export default HomeScreen;
