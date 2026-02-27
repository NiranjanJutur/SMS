import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { COLORS } from './config/theme';
import LoginScreen from './screens/auth/LoginScreen';
import AppNavigator from './navigation/AppNavigator';

const App = () => {
  const [userRole, setUserRole] = useState<string | null>(null);

  const handleLogin = (role: string) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />
      {!userRole ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <AppNavigator role={userRole} onLogout={handleLogout} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
});

export default App;
