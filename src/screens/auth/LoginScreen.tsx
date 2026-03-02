import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../config/theme';
import { TRANSLATIONS, Language } from '../../utils/i18n';

interface LoginScreenProps {
    onLogin: (role: string) => void;
}

const LANGUAGES = [
    { key: 'en', label: 'English', icon: '🇬🇧' },
    { key: 'kn', label: 'ಕನ್ನಡ', icon: '🏠' },
    { key: 'hi', label: 'हिंदी', icon: '🇮🇳' },
    { key: 'te', label: 'తెలుగు', icon: '🍃' },
    { key: 'mr', label: 'मराठी', icon: '🏵️' },
];

const LoginScreen = ({ onLogin, onLangChange }: LoginScreenProps & { onLangChange?: (l: Language) => void }) => {
    const [lang, setLang] = React.useState<Language>('en');
    const t = TRANSLATIONS[lang];

    const ROLES = [
        { key: 'OWNER', label: t.roles.OWNER, icon: '👑', desc: lang === 'en' ? 'Full access' : '' },
        { key: 'CASHIER', label: t.roles.CASHIER, icon: '🧾', desc: lang === 'en' ? 'Billing & sales' : '' },
        { key: 'STOCK_MANAGER', label: t.roles.STOCK_MANAGER, icon: '📦', desc: lang === 'en' ? 'Inventory control' : '' },
        { key: 'ACCOUNTANT', label: t.roles.ACCOUNTANT, icon: '📊', desc: lang === 'en' ? 'Reports & books' : '' },
    ];

    const handleLangSelect = (l: Language) => {
        setLang(l);
        onLangChange?.(l);
    };
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.heroSection}>
                <Text style={styles.appName}>{t.shopName}</Text>
                <Text style={styles.appCaption}>{t.caption}</Text>
            </View>

            {/* Language Picker */}
            <View style={styles.langSection}>
                <Text style={styles.sectionLabel}>{t.selectLang}</Text>
                <View style={styles.langRow}>
                    {LANGUAGES.map(l => (
                        <TouchableOpacity
                            key={l.key}
                            style={[styles.langChip, lang === l.key && styles.langChipActive]}
                            onPress={() => handleLangSelect(l.key)}
                        >
                            <Text style={[styles.langText, lang === l.key && styles.langTextActive]}>{l.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <Text style={styles.subtitle}>{t.selectRole}</Text>

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
        fontSize: 34,
        fontWeight: '900',
        color: COLORS.PRIMARY,
        letterSpacing: 1.5,
        textAlign: 'center',
    },
    appCaption: {
        fontSize: 16,
        color: COLORS.PRIMARY + '99',
        fontWeight: '700',
        marginTop: -2,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.TEXT_DIM,
        marginBottom: SPACING.MD,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    langSection: {
        marginBottom: SPACING.LG,
    },
    sectionLabel: {
        fontSize: 11,
        color: COLORS.TEXT_DIM,
        marginBottom: 8,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    langRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    langChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.MD,
        backgroundColor: COLORS.WHITE,
        borderWidth: 1.5,
        borderColor: COLORS.BORDER,
    },
    langChipActive: {
        backgroundColor: COLORS.PRIMARY + '12',
        borderColor: COLORS.PRIMARY,
    },
    langText: {
        fontSize: 12,
        color: COLORS.TEXT_DIM,
        fontWeight: '700',
    },
    langTextActive: {
        color: COLORS.PRIMARY,
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
