import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { ROLES } from '../config/constants';
import { COLORS } from '../config/theme';

import HomeScreen from '../screens/home/HomeScreen';
import InventoryScreen from '../screens/stock/InventoryScreen';
import BillingScreen from '../screens/cashier/BillingScreen';
import CustomersScreen from '../screens/customers/CustomersScreen';
import OwnerDashboard from '../screens/owner/OwnerDashboard';
import AccountantDashboard from '../screens/accountant/AccountantDashboard';
import ScanScreen from '../screens/home/ScanScreen';
import SlipProcessingScreen from '../screens/home/SlipProcessingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
    Home: '🏠', Items: '📦', Billing: '🧾', Customers: '👥', Dashboard: '📊',
};

// Separate navigators per role to avoid conditional Tab.Screen (crashes React Navigation)
const OwnerTabs = ({ role }: { role: string }) => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarActiveTintColor: COLORS.PRIMARY,
            tabBarInactiveTintColor: COLORS.TEXT_DIM,
            tabBarLabel: route.name,
            tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route.name] ?? '•'}</Text>
            ),
            headerShown: false,
        })}>
        <Tab.Screen name="Home">{(props) => <HomeScreen {...props} role={role} />}</Tab.Screen>
        <Tab.Screen name="Items" component={InventoryScreen} />
        <Tab.Screen name="Billing" component={BillingScreen} />
        <Tab.Screen name="Customers" component={CustomersScreen} />
        <Tab.Screen name="Dashboard">{() => <OwnerDashboard />}</Tab.Screen>
    </Tab.Navigator>
);

const CashierTabs = ({ role }: { role: string }) => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarActiveTintColor: COLORS.PRIMARY,
            tabBarInactiveTintColor: COLORS.TEXT_DIM,
            tabBarLabel: route.name,
            tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route.name] ?? '•'}</Text>
            ),
            headerShown: false,
        })}>
        <Tab.Screen name="Home">{(props) => <HomeScreen {...props} role={role} />}</Tab.Screen>
        <Tab.Screen name="Items" component={InventoryScreen} />
        <Tab.Screen name="Billing" component={BillingScreen} />
        <Tab.Screen name="Customers" component={CustomersScreen} />
    </Tab.Navigator>
);

const StockManagerTabs = ({ role }: { role: string }) => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarActiveTintColor: COLORS.PRIMARY,
            tabBarInactiveTintColor: COLORS.TEXT_DIM,
            tabBarLabel: route.name,
            tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route.name] ?? '•'}</Text>
            ),
            headerShown: false,
        })}>
        <Tab.Screen name="Home">{(props) => <HomeScreen {...props} role={role} />}</Tab.Screen>
        <Tab.Screen name="Items" component={InventoryScreen} />
        <Tab.Screen name="Customers" component={CustomersScreen} />
    </Tab.Navigator>
);

const AccountantTabs = ({ role }: { role: string }) => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarActiveTintColor: COLORS.PRIMARY,
            tabBarInactiveTintColor: COLORS.TEXT_DIM,
            tabBarLabel: route.name,
            tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route.name] ?? '•'}</Text>
            ),
            headerShown: false,
        })}>
        <Tab.Screen name="Home">{(props) => <HomeScreen {...props} role={role} />}</Tab.Screen>
        <Tab.Screen name="Items" component={InventoryScreen} />
        <Tab.Screen name="Customers" component={CustomersScreen} />
        <Tab.Screen name="Dashboard">{() => <AccountantDashboard />}</Tab.Screen>
    </Tab.Navigator>
);

const TabNavigator = ({ role }: { role: string }) => {
    switch (role) {
        case ROLES.OWNER: return <OwnerTabs role={role} />;
        case ROLES.CASHIER: return <CashierTabs role={role} />;
        case ROLES.STOCK_MANAGER: return <StockManagerTabs role={role} />;
        case ROLES.ACCOUNTANT: return <AccountantTabs role={role} />;
        default: return <CashierTabs role={role} />;
    }
};

const AppNavigator = ({ role, onLogout }: { role: string; onLogout: () => void }) => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs">
                    {() => <TabNavigator role={role} />}
                </Stack.Screen>
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
