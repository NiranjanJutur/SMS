import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../config/theme';

export const InventoryScreen = () => (
    <View style={styles.container}>
        <Text style={styles.title}>Inventory</Text>
    </View>
);

export const CustomersScreen = () => (
    <View style={styles.container}>
        <Text style={styles.title}>Customers</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.LG,
        backgroundColor: COLORS.BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontFamily: TYPOGRAPHY.HEADING,
        color: COLORS.PRIMARY,
    }
});
