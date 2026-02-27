import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../config/theme';
import { extractSlipData } from '../../services/ai/geminiService';
import { SlipOCRResult } from '../../models/Slip';

const SlipProcessingScreen = ({ navigation }: { navigation: any }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<SlipOCRResult | null>(null);

    const handleTakePhoto = async () => {
        setIsProcessing(true);
        // In a real app, this would be taking a photo and converting to base64
        // Here we simulate the process
        setTimeout(async () => {
            const mockBase64 = "base64_data";
            const data = await extractSlipData(mockBase64);

            if (data) {
                setResult(data);
            } else {
                // Mock result for demo
                setResult({
                    name: "Rajesh Kumar",
                    phone: "9876543210",
                    items: [
                        { name: "Basmati Rice", qty: 2 },
                        { name: "Sugar", qty: 1 },
                        { name: "Toor Dal", qty: 0.5 }
                    ]
                });
            }
            setIsProcessing(false);
        }, 2000);
    };

    const handleImport = () => {
        if (!result) return;
        // Navigation logic to BillingScreen with items
        Alert.alert("Success", "Items imported to cart!");
        navigation.navigate('Billing', { importedItems: result.items });
    };

    return (
        <View style={styles.container}>
            {!result && !isProcessing && (
                <View style={styles.emptyState}>
                    <Text style={styles.icon}>📄</Text>
                    <Text style={styles.title}>Extract Handwritten Slip</Text>
                    <Text style={styles.desc}>Take a photo of a customer's handwritten list and AI will automatically add items to the cart.</Text>
                    <TouchableOpacity style={styles.captureBtn} onPress={handleTakePhoto}>
                        <Text style={styles.captureBtnText}>📸 TAKE PHOTO</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isProcessing && (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                    <Text style={styles.loadingText}>AI is reading the slip...</Text>
                </View>
            )}

            {result && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultTitle}>Extracted List</Text>
                    <View style={styles.customerCard}>
                        <Text style={styles.customerName}>{result.name || "Unknown Customer"}</Text>
                        <Text style={styles.customerPhone}>{result.phone || "No phone found"}</Text>
                    </View>

                    <ScrollView style={styles.itemList}>
                        {result.items.map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQty}>{item.qty} qty</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => setResult(null)}>
                            <Text style={styles.retryBtnText}>Retry</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
                            <Text style={styles.importBtnText}>Import to Bill</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.XL },
    icon: { fontSize: 64, marginBottom: SPACING.LG },
    title: { fontSize: 24, fontFamily: TYPOGRAPHY.HEADING, color: COLORS.TEXT_HEADING, textAlign: 'center' },
    desc: { fontSize: 16, color: COLORS.TEXT_DIM, textAlign: 'center', marginTop: SPACING.MD, marginBottom: SPACING.XL },
    captureBtn: { backgroundColor: COLORS.PRIMARY, paddingVertical: 15, paddingHorizontal: 40, borderRadius: RADIUS.XL },
    captureBtnText: { color: COLORS.WHITE, fontSize: 18, fontFamily: TYPOGRAPHY.BODY_BOLD },
    loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: SPACING.MD, fontSize: 18, color: COLORS.TEXT_BODY, fontFamily: TYPOGRAPHY.BODY_BOLD },
    resultContainer: { flex: 1, padding: SPACING.BASE },
    resultTitle: { fontSize: 20, fontFamily: TYPOGRAPHY.HEADING, color: COLORS.TEXT_HEADING, marginBottom: SPACING.MD },
    customerCard: { backgroundColor: COLORS.WHITE, padding: SPACING.MD, borderRadius: RADIUS.LG, marginBottom: SPACING.MD, elevation: 1 },
    customerName: { fontSize: 18, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_HEADING },
    customerPhone: { fontSize: 14, color: COLORS.TEXT_DIM },
    itemList: { flex: 1 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.MD, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    itemName: { fontSize: 16, color: COLORS.TEXT_BODY },
    itemQty: { fontSize: 16, fontFamily: TYPOGRAPHY.BODY_BOLD, color: COLORS.PRIMARY },
    footer: { flexDirection: 'row', gap: SPACING.MD, paddingTop: SPACING.BASE },
    retryBtn: { flex: 1, padding: SPACING.MD, borderRadius: RADIUS.LG, borderWidth: 1, borderColor: COLORS.BORDER, alignItems: 'center' },
    retryBtnText: { color: COLORS.TEXT_DIM, fontWeight: 'bold' },
    importBtn: { flex: 2, backgroundColor: COLORS.SUCCESS, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center' },
    importBtnText: { color: COLORS.WHITE, fontWeight: 'bold', fontSize: 16 },
});

export default SlipProcessingScreen;
