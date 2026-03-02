import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../config/theme';
import { addCustomer } from '../services/firebase/firestoreService';
import { CustomerType } from '../models/Customer';

const TYPES: { key: CustomerType; label: string; icon: string }[] = [
    { key: 'house', label: 'House / Family', icon: '\uD83C\uDFE0' },
    { key: 'small_shop', label: 'Small Shop', icon: '\uD83C\uDFEA' },
    { key: 'hotel', label: 'Hotel', icon: '\uD83C\uDF7D\uFE0F' },
    { key: 'function', label: 'Function', icon: '\uD83C\uDF89' },
    { key: 'wholesale', label: 'Wholesale', icon: '\uD83D\uDCE6' },
    { key: 'vip', label: 'VIP Regular', icon: '\u2B50' },
];

const AddCustomerModal = ({ visible, onClose, onAdded }: { visible: boolean; onClose: () => void; onAdded: () => void }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [houseNo, setHouseNo] = useState('');
    const [type, setType] = useState<CustomerType>('house');
    const [creditLimit, setCreditLimit] = useState('2000');
    const [saving, setSaving] = useState(false);

    const reset = () => { setName(''); setPhone(''); setWhatsapp(''); setHouseNo(''); setType('house'); setCreditLimit('2000'); };

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
            });
            reset(); onAdded(); onClose();
            Alert.alert('\u2705 Added', `${name} added!`);
        } catch { Alert.alert('Error', 'Failed to add customer'); }
        finally { setSaving(false); }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Customer</Text>
                        <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>\u2715</Text></TouchableOpacity>
                    </View>
                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
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
                        <Text style={styles.label}>Credit Limit (\u20B9)</Text>
                        <TextInput style={styles.input} placeholder="2000" placeholderTextColor={COLORS.TEXT_DIM} value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" />
                    </ScrollView>
                    <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '\uD83D\uDC65 Add Customer'}</Text>
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
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.XS },
    typeCard: { width: '31%', padding: SPACING.SM, borderRadius: RADIUS.MD, borderWidth: 1, borderColor: COLORS.BORDER, alignItems: 'center', backgroundColor: COLORS.BACKGROUND },
    typeCardActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + '15' },
    typeIcon: { fontSize: 20, marginBottom: 2 },
    typeLabel: { fontSize: 10, color: COLORS.TEXT_DIM, textAlign: 'center' },
    saveBtn: { backgroundColor: COLORS.PRIMARY, margin: SPACING.BASE, padding: SPACING.MD, borderRadius: RADIUS.LG, alignItems: 'center' },
    saveBtnText: { color: COLORS.WHITE, fontSize: 16, fontWeight: '700' },
});

export default AddCustomerModal;
