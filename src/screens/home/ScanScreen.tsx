import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../config/theme';
import { useScanner } from '../../services/ai/scannerService';
import { Product } from '../../models/Product';

interface ScanScreenProps {
    navigation?: any;
    onProductAdded?: (product: Product) => void;
}

const ScanScreen = ({ navigation, onProductAdded }: ScanScreenProps) => {
    const camera = useRef<Camera>(null);
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const { scanProduct, isScanning, lastResult } = useScanner();

    const handleScan = async () => {
        if (!hasPermission) {
            await requestPermission();
            return;
        }

        if (camera.current) {
            try {
                const photo = await camera.current.takePhoto({
                    flash: 'off'
                });
                // In a real device, photo.path is a file URI
                // For the demo/emulator we might still use mock or convert to base64
                await scanProduct(photo.path);
            } catch (err) {
                console.error('Failed to take photo:', err);
                await scanProduct('mock-uri');
            }
        } else {
            // Fallback for emulator without camera
            await scanProduct('mock-uri');
        }
    };

    const confirmProduct = () => {
        if (lastResult) {
            if (onProductAdded) {
                onProductAdded(lastResult);
            }
            navigation?.goBack?.();
        }
    };

    if (device == null) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>No Camera Device Found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.cameraPreview}>
                <Camera
                    ref={camera}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={!lastResult && !isScanning}
                    photo={true}
                />
                <Text style={styles.scanText}>Point at product...</Text>
                <View style={styles.targetBox} />
            </View>

            {lastResult && (
                <View style={styles.verifyCard}>
                    <Text style={styles.verifyTitle}>AI Found: {lastResult.name}</Text>
                    <Text style={styles.verifyPrice}>Price: ₹{lastResult.price}</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleScan()}>
                            <Text style={styles.btnText}>Retry</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmProduct}>
                            <Text style={styles.btnText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {!isScanning && !lastResult && (
                <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
                    <Text style={styles.scanBtnText}>📸 TAP TO SCAN</Text>
                </TouchableOpacity>
            )}

            {isScanning && (
                <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>AI Identifying...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraPreview: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: TYPOGRAPHY.BODY,
        marginBottom: 20,
    },
    targetBox: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: COLORS.PRIMARY,
        borderRadius: 20,
    },
    scanBtn: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: COLORS.PRIMARY,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: RADIUS.XL,
    },
    scanBtnText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: TYPOGRAPHY.BODY_BOLD,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: COLORS.SECONDARY,
        fontSize: 20,
        fontFamily: TYPOGRAPHY.BODY_BOLD,
    },
    verifyCard: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        padding: SPACING.BASE,
        borderRadius: RADIUS.LG,
        elevation: 5,
    },
    verifyTitle: {
        fontSize: 18,
        fontFamily: TYPOGRAPHY.HEADING,
        color: COLORS.TEXT_HEADING,
    },
    verifyPrice: {
        fontSize: 16,
        color: COLORS.TEXT_DIM,
        marginVertical: 5,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    rejectBtn: {
        backgroundColor: COLORS.ERROR,
        padding: 10,
        borderRadius: 8,
        width: '45%',
        alignItems: 'center',
    },
    confirmBtn: {
        backgroundColor: COLORS.SUCCESS,
        padding: 10,
        borderRadius: 8,
        width: '45%',
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ScanScreen;
