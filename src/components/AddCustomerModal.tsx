import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../config/theme';
import { addCustomer } from '../services/firebase/firestoreService';
import { CustomerType } from '../models/Customer';

const TYPES: { key: CustomerType; label: string; icon: string }[] = [
    { key: 'house', label: 'House / Family', icon: '🏠' },
    { key: 'small_shop', label: 'Small Shop', icon: '🏪' },
    { key: 'hotel', label: 'Hotel', icon: '🍽️' },
    { key: 'function', label: 'Function', icon: '🎉' },
    { key: 'wholesale', label: 'Wholesale', icon: '📦' },
    { key: 'vip', label: 'VIP Regular', icon: '⭐' },
];

const AddCustomerModal = ({ visible, onClose, onAdded }: { visible: boolean; onClose: () => void; onAdded: () => void }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [houseNo, setHouseNo] = useState('');
    const [type, setType] = useState<CustomerType>('house');
    const [creditLimit, setCreditLimit] = useState('2000');
    const [photoUrl, setPhotoUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<any>(null);

    const reset = () => {
        setName(''); setPhone(''); setWhatsapp(''); setHouseNo('');
        setType('house'); setCreditLimit('2000'); setPhotoUrl('');
    };

    const handlePickPhoto = () => {
        if (Platform.OS === 'web') {
            // Web: trigger hidden file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    setPhotoUrl(ev.target?.result as string);
                };
                reader.readAsDataURL(file);
            };
            input.click();
        } else {
            Alert.alert('Photo', 'Camera integration coming soon on mobile.');
        }
    };

    const handleSave = async () => {
        if (!name.trim()) { Alert.alert('Error', 'Name required'); return; }
        if (!phone.trim() || phone.length < 10) { Alert.alert('Error', 'Valid 10-digit phone required'); return; }
        setSaving(true);
        try {
            await addCustomer({
                udhaarId: `UDH-${Date.now().toString().slice(-4)}`,
                name: name.trim(), phone: phone.trim(),
                whatsappNumber: whatsapp.trim() || `91${phone.trim()}`,
                houseNo: houseNo.trim() || undefined,
                type, creditLimit: Number(creditLimit) || 2000,
                totalOutstanding: 0,
                firstPurchaseDate: new Date().toISOString().split('T')[0],
                slipImages: [], notes: '', isActive: true,
                photoUrl: photoUrl || undefined,
            });
            reset(); onAdded(); onClose();
            Alert.alert('✅ Added', `${name} added!`);
        } catch { Alert.alert('Error', 'Failed to add customer'); }
        finally { setSaving(false); }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Customer</Text>
                        <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
                    </View>
                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>

                        {/* Photo Picker */}
                        <TouchableOpacity style={styles.photoPicker} onPress={handlePickPhoto}>
                            {photoUrl ? (
                                <Image source={{ uri: photoUrl }} style={styles.photoPreview} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Text style={styles.photoIcon}>📷</Text>
                                    <Text style={styles.photoHint}>Add Photo</Text>
                                </View>
                            )}
                            <View style={styles.photoEditBadge}>
                                <Text style={{ color: '#fff', fontSize: 12 }}>✎</Text>
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.label}>Name *</Text>
                        <TextInput style={styles.input} placeholder="Customer name" placeholderTextColor={COLORS.TEXT_DIM} value={name} onChangeText={setName} />
                        <Text style={styles.label}>Phone *</Text>
                        <TextInput style={styles.input} placeholder="10-digit phone" placeholderTextColor={COLORS.TEXT_DIM} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
                        <Text style={styles.label}>WhatsApp</Text>
                        <TextInput style={styles.input} placeholder="91XXXXXXXXXX" placeholderTextColor={COLORS.TEXT_DIM} value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
                        <Text style={styles.label}>House / Address</Text>
                        <TextInput style={styles.input} placeholder="H-12, Street" placeholderTextColor={COLORS.TEXT_DIM} value={houseNo} onChangeText={setHouseNo} />
                        <Text style={styles.label}>Customer Type</Text>
                        <View style={styles.typeGrid}>
                            {TYPES.map(t => (
                                <TouchableOpacity key={t.key} style={[styles.typeCard, type === t.key && styles.typeCardActive]} onPress={() => setType(t.key)}>
                                    <Text style={styles.typeIcon}>{t.icon}</Text>
                                    <Text style={[styles.typeLabel, type === t.key && { color: COLORS.PRIMARY, fontWeight: '700' }]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.label}>Credit Limit (₹)</Text>
                        <TextInput style={styles.input} placeholder="2000" placeholderTextColor={COLORS.TEXT_DIM} value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" />
                    </ScrollView>
                    <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '👥 Add Customer'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.BASE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
    title: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT_HEADING },
    closeBtn: { fontSize: 20, color: COLORS.TEXT_DIM, padding: 4 },
    form: { padding: SPACING.BASE },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_DIM, marginTop: SPACING.SM, marginBottom: 4 },
    input: { backgroundColor: COLORS.BACKGROUND, borderRadius: RADIUS.MD, paddingHorizontal: SPACING.MD, paddingVertical: 10, color: COLORS.TEXT_BODY, borderWidth: 1, borderColor: COLORS.BORDER },
    photoPicker: { alignSelf: 'center', marginVertical: SPACING.MD, position: 'relative' },
    photoPreview: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.PRIMARY },
    photoPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.BACKGROUND, borderWidth: 2, borderColor: COLORS.BORDER, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    photoIcon: { fontSize: 24 },
    photoHint: { fontSize: 10, color: COLORS.TEXT_DIM, marginTop: 2 },
    photoEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.PRIMARY, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.WHITE },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.XS },
    typeCard: { width: '31%', padding: SPACING.SM, borderRadius: RADIUS.MD, borderWidth: 1, borderColor: COLORS.BORDER, alignItems: 'center', backgroundColor: COLORS.BACKGROUND },
    typeCardActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '15' },
    typeIcon: { fontSize: 20, marginBottom: 2 },
    typeLabel: { fontSize: 10, color: COLORS.TEXT_DIM, textAlign: 'center' },
    saveBtn: { backgroundColor: COLORS.PRIMARY, margin: SPACING.BASE, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center' },
    saveBtnText: { color: COLORS.WHITE, fontSize: 16, fontWeight: '700' },
});

export default AddCustomerModal;
