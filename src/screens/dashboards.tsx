import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../config/theme';

export const OwnerDashboard = () => (
    <View style={styles.container}>
        <Text style={styles.title}>Owner Dashboard</Text>
        <Text style={styles.text}>Executive overview of the shop</Text>
    </View>
);

export const AccountantDashboard = () => (
    <View style={styles.container}>
        <Text style={styles.title}>Accountant Dashboard</Text>
        <Text style={styles.text}>Financial reports and GST tracking</Text>
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
    },
    text: {
        fontSize: 16,
        color: COLORS.TEXT_BODY,
    }
});
