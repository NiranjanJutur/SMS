import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../config/theme';

interface LoginScreenProps {
    onLogin: (role: string) => void;
}

const ROLES = [
    { key: 'OWNER', label: 'Owner', icon: '👑', desc: 'Full access' },
    { key: 'CASHIER', label: 'Cashier', icon: '🧾', desc: 'Billing & sales' },
    { key: 'STOCK_MANAGER', label: 'Stock Manager', icon: '📦', desc: 'Inventory control' },
    { key: 'ACCOUNTANT', label: 'Accountant', icon: '📊', desc: 'Reports & books' },
];

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.heroSection}>
                <Text style={styles.appName}>Sri Manjunatha Stores</Text>
                <Text style={styles.subtitle}>Select your role to continue</Text>
            </View>

            <View style={styles.grid}>
                {ROLES.map((role) => (
                    <TouchableOpacity
                        key={role.key}
                        style={styles.card}
                        onPress={() => onLogin(role.key)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.roleIcon}>{role.icon}</Text>
                        <Text style={styles.roleLabel}>{role.label}</Text>
                        <Text style={styles.roleDesc}>{role.desc}</Text>
                    </TouchableOpacity>
                ))}
            </View>


        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: COLORS.BACKGROUND,
        padding: SPACING.LG,
        justifyContent: 'center',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: SPACING.XL,
    },
    storeName: {
        fontSize: 16,
        color: COLORS.TEXT_DIM,
        marginBottom: SPACING.XS,
    },
    appName: {
        fontSize: 40,
        fontWeight: '800',
        color: COLORS.PRIMARY,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.TEXT_DIM,
        marginTop: SPACING.SM,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: SPACING.MD,
    },
    card: {
        width: '47%',
        backgroundColor: COLORS.WHITE,
        padding: SPACING.LG,
        borderRadius: RADIUS.LG,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    roleIcon: { fontSize: 36, marginBottom: SPACING.SM },
    roleLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.TEXT_HEADING,
        textAlign: 'center',
    },
    roleDesc: {
        fontSize: 11,
        color: COLORS.TEXT_DIM,
        textAlign: 'center',
        marginTop: 4,
    },
    footer: {
        textAlign: 'center',
        color: COLORS.TEXT_DIM,
        fontSize: 12,
        marginTop: SPACING.XL,
    },
});

export default LoginScreen;
