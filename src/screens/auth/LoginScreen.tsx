import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../config/theme';

interface LoginScreenProps {
    onLogin: (role: string) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>FamilyOS</Text>
            <Text style={styles.subtitle}>Select your role to enter</Text>

            <View style={styles.grid}>
                {['OWNER', 'CASHIER', 'STOCK_MANAGER', 'ACCOUNTANT'].map((role) => (
                    <TouchableOpacity
                        key={role}
                        style={styles.card}
                        onPress={() => onLogin(role)}
                    >
                        <Text style={styles.roleText}>{role.replace('_', ' ')}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
        padding: SPACING.LG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontFamily: TYPOGRAPHY.HEADING,
        color: COLORS.PRIMARY,
        marginBottom: SPACING.XS,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: TYPOGRAPHY.BODY,
        color: COLORS.TEXT_DIM,
        marginBottom: SPACING.XL,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    card: {
        width: '48%',
        backgroundColor: COLORS.WHITE,
        padding: SPACING.LG,
        borderRadius: 12,
        marginBottom: SPACING.MD,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    roleText: {
        fontFamily: TYPOGRAPHY.BODY_BOLD,
        color: COLORS.TEXT_HEADING,
        textAlign: 'center',
    },
});

export default LoginScreen;
