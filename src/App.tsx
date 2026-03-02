import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { COLORS } from './config/theme';
import LoginScreen from './screens/auth/LoginScreen';
import AppNavigator from './navigation/AppNavigator';
import { Language } from './utils/i18n';

const App = () => {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [lang, setLang] = useState<Language>('en');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />
            {!userRole ? (
                <LoginScreen
                    onLogin={(role) => setUserRole(role)}
                    onLangChange={(l) => setLang(l)}
                />
            ) : (
                <AppNavigator role={userRole} lang={lang} onLogout={() => setUserRole(null)} />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
});

export default App;
