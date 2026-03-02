import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { COLORS } from './config/theme';
import LoginScreen from './screens/auth/LoginScreen';
import AppNavigator from './navigation/AppNavigator';

const App = () => {
    const [userRole, setUserRole] = useState<string | null>(null);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />
            {!userRole ? (
                <LoginScreen onLogin={(role) => setUserRole(role)} />
            ) : (
                <AppNavigator role={userRole} onLogout={() => setUserRole(null)} />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
});

export default App;
