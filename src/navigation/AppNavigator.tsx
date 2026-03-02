import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { ROLES } from '../config/constants';
import { COLORS } from '../config/theme';
import { TRANSLATIONS, Language } from '../utils/i18n';

import HomeScreen from '../screens/home/HomeScreen';
import InventoryScreen from '../screens/stock/InventoryScreen';
import BillingScreen from '../screens/cashier/BillingScreen';
import CustomersScreen from '../screens/customers/CustomersScreen';
import OwnerDashboard from '../screens/owner/OwnerDashboard';
import AccountantDashboard from '../screens/accountant/AccountantDashboard';
import ReportsScreen from '../screens/accountant/ReportsScreen';
import BillsHistoryScreen from '../screens/bills/BillsHistoryScreen';
import ScanScreen from '../screens/home/ScanScreen';
import SlipProcessingScreen from '../screens/home/SlipProcessingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
    home: '🏠', items: '📦', billing: '🧾', customers: '👥',
    dashboard: '📊', reports: '📄',
};

// ── Owner: Home, Items, Billing, Customers, Dashboard ──────────────────────────
const OwnerTabs = ({ role, lang }: { role: string; lang: Language }) => {
    const t = TRANSLATIONS[lang];
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: COLORS.PRIMARY,
                tabBarInactiveTintColor: COLORS.TEXT_DIM,
                tabBarLabel: t.tabs[route.name.toLowerCase()],
                tabBarIcon: ({ focused }) => (
                    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route.name.toLowerCase()] ?? '•'}</Text>
                ),
                headerShown: false,
            })}>
            <Tab.Screen name="home">{(props) => <HomeScreen {...props} role={role} lang={lang} />}</Tab.Screen>
            <Tab.Screen name="items" component={InventoryScreen} />
            <Tab.Screen name="billing">{() => <BillingScreen role={role} />}</Tab.Screen>
            <Tab.Screen name="customers" component={CustomersScreen} />
            <Tab.Screen name="dashboard">{() => <OwnerDashboard />}</Tab.Screen>
        </Tab.Navigator>
    );
};

// ── Cashier: Home, Items, Billing, Customers ───────────────────────────────────
const CashierTabs = ({ role, lang }: { role: string; lang: Language }) => {
    const t = TRANSLATIONS[lang];
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: COLORS.PRIMARY,
                tabBarInactiveTintColor: COLORS.TEXT_DIM,
                tabBarLabel: t.tabs[route.name.toLowerCase()],
                tabBarIcon: ({ focused }) => (
                    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route.name.toLowerCase()] ?? '•'}</Text>
                ),
                headerShown: false,
            })}>
            <Tab.Screen name="home">{(props) => <HomeScreen {...props} role={role} lang={lang} />}</Tab.Screen>
            <Tab.Screen name="items" component={InventoryScreen} />
            <Tab.Screen name="billing">{() => <BillingScreen role={role} />}</Tab.Screen>
            <Tab.Screen name="customers" component={CustomersScreen} />
        </Tab.Navigator>
    );
};

// ── Stock Manager: Home, Items, Customers ─────────────────────────────────────
const StockManagerTabs = ({ role, lang }: { role: string; lang: Language }) => {
    const t = TRANSLATIONS[lang];
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: COLORS.PRIMARY,
                tabBarInactiveTintColor: COLORS.TEXT_DIM,
                tabBarLabel: t.tabs[route.name.toLowerCase()],
                tabBarIcon: ({ focused }) => (
                    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route.name.toLowerCase()] ?? '•'}</Text>
                ),
                headerShown: false,
            })}>
            <Tab.Screen name="home">{(props) => <HomeScreen {...props} role={role} lang={lang} />}</Tab.Screen>
            <Tab.Screen name="items" component={InventoryScreen} />
            <Tab.Screen name="customers" component={CustomersScreen} />
        </Tab.Navigator>
    );
};

// ── Accountant: Dashboard, Items, Customers, Reports ──────────────────────────
const AccountantTabs = ({ role, lang }: { role: string; lang: Language }) => {
    const t = TRANSLATIONS[lang];
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: COLORS.PRIMARY,
                tabBarInactiveTintColor: COLORS.TEXT_DIM,
                tabBarLabel: t.tabs[route.name.toLowerCase()],
                tabBarIcon: ({ focused }) => (
                    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route.name.toLowerCase()] ?? '•'}</Text>
                ),
                headerShown: false,
            })}>
            <Tab.Screen name="dashboard">{() => <AccountantDashboard />}</Tab.Screen>
            <Tab.Screen name="items" component={InventoryScreen} />
            <Tab.Screen name="customers" component={CustomersScreen} />
            <Tab.Screen name="reports">{() => <ReportsScreen />}</Tab.Screen>
        </Tab.Navigator>
    );
};

const TabNavigator = ({ role, lang }: { role: string; lang: Language }) => {
    switch (role) {
        case ROLES.OWNER: return <OwnerTabs role={role} lang={lang} />;
        case ROLES.CASHIER: return <CashierTabs role={role} lang={lang} />;
        case ROLES.STOCK_MANAGER: return <StockManagerTabs role={role} lang={lang} />;
        case ROLES.ACCOUNTANT: return <AccountantTabs role={role} lang={lang} />;
        default: return <CashierTabs role={role} lang={lang} />;
    }
};

const AppNavigator = ({ role, lang, onLogout }: { role: string; lang: Language; onLogout: () => void }) => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs">
                    {() => <TabNavigator role={role} lang={lang} />}
                </Stack.Screen>
                {/* Bills is accessed via Quick Action — full screen push */}
                <Stack.Screen
                    name="Bills"
                    component={BillsHistoryScreen}
                    options={{ headerShown: true, title: '🧾 Bills History', headerTintColor: COLORS.PRIMARY }}
                />
                <Stack.Screen
                    name="ScanScreen"
                    component={ScanScreen}
                    options={{ headerShown: true, title: 'Scan Product', headerTintColor: COLORS.PRIMARY }}
                />
                <Stack.Screen
                    name="SlipProcessing"
                    component={SlipProcessingScreen}
                    options={{ headerShown: true, title: 'Process Slip', headerTintColor: COLORS.PRIMARY }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
