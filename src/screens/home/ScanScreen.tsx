/**
 * ScanScreen - AI Product Scanner
 *
 * To enable real camera scanning:
 * 1. npm install react-native-vision-camera
 * 2. cd android && ./gradlew clean && cd ..
 * 3. npx react-native run-android
 * 4. Uncomment the Vision Camera sections below (marked with TODO)
 */
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../config/theme';
import { useScanner } from '../../services/ai/scannerService';
import { Product } from '../../models/Product';

// TODO: Uncomment after running: npm install react-native-vision-camera
// import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

interface ScanScreenProps {
    navigation?: any;
    onProductAdded?: (product: Product) => void;
}

const ScanScreen = ({ navigation, onProductAdded }: ScanScreenProps) => {
    // TODO: Uncomment for real camera
    // const cameraRef = useRef<Camera>(null);
    // const device = useCameraDevice('back');
    // const { hasPermission, requestPermission } = useCameraPermission();

    const { scanProduct, isScanning, lastResult } = useScanner();
    const [cameraReady] = useState(false); // set to true when vision-camera is installed

    const handleScan = async () => {
        // TODO: Replace mock with real camera capture after installing vision-camera:
        // if (!hasPermission) { await requestPermission(); return; }
        // const photo = await cameraRef.current?.takePhoto({ flash: 'off' });
        // if (photo?.path) { await scanProduct(photo.path); return; }
        await scanProduct('mock-uri');
    };

    const confirmProduct = () => {
        if (!lastResult) { return; }
        onProductAdded?.(lastResult);
        navigation?.goBack?.();
    };

    return (
        <View style={styles.container}>
            {/* Camera Preview */}
            <View style={styles.preview}>
                {/* TODO: Replace with <Camera> component after installing vision-camera */}
                <Text style={styles.cameraIcon}>\ud83d\udcf7</Text>
                <Text style={styles.scanText}>Camera Preview</Text>
                <Text style={styles.subText}>
                    Install react-native-vision-camera for live scanning
                </Text>
                <View style={styles.targetBox} />
            </View>

            {/* Result Card */}
            {lastResult && (
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>\u2705 Found: {lastResult.name}</Text>
                    <Text style={styles.resultSub}>
                        {lastResult.category} · \u20b9{lastResult.price} / {lastResult.unit}
                    </Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.retryBtn} onPress={handleScan}>
                            <Text style={styles.btnText}>Retry</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmProduct}>
                            <Text style={styles.btnText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Scan Button */}
            {!isScanning && !lastResult && (
                <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
                    <Text style={styles.scanBtnText}>\ud83d\udcf8 TAP TO SCAN</Text>
                </TouchableOpacity>
            )}

            {/* Loading */}
            {isScanning && (
                <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>AI Identifying...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    preview: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111',
    },
    cameraIcon: { fontSize: 80, marginBottom: 16 },
    scanText: { color: '#fff', fontSize: 18, marginBottom: 8 },
    subText: {
        color: '#aaa', fontSize: 12, textAlign: 'center',
        paddingHorizontal: 40, marginBottom: 24,
    },
    targetBox: {
        width: 250, height: 250,
        borderWidth: 2, borderColor: COLORS.PRIMARY, borderRadius: 20,
    },
    scanBtn: {
        position: 'absolute', bottom: 40, alignSelf: 'center',
        backgroundColor: COLORS.PRIMARY,
        paddingVertical: 15, paddingHorizontal: 40, borderRadius: RADIUS.XL,
    },
    scanBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center',
    },
    loadingText: { color: COLORS.SECONDARY, fontSize: 20, fontWeight: 'bold' },
    resultCard: {
        position: 'absolute', bottom: 20, left: 20, right: 20,
        backgroundColor: '#fff', padding: SPACING.BASE,
        borderRadius: RADIUS.LG, elevation: 5,
    },
    resultTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.TEXT_HEADING },
    resultSub: { fontSize: 14, color: COLORS.TEXT_DIM, marginVertical: 4 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    retryBtn: {
        backgroundColor: COLORS.ERROR, padding: 10,
        borderRadius: 8, width: '45%', alignItems: 'center',
    },
    confirmBtn: {
        backgroundColor: COLORS.SUCCESS, padding: 10,
        borderRadius: 8, width: '45%', alignItems: 'center',
    },
    btnText: { color: '#fff', fontWeight: 'bold' },
});

export default ScanScreen;
