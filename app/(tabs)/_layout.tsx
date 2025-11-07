import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                borderTopWidth: 1,
                height: 60 + insets.bottom,
                paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                paddingTop: 8,
              },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.tabIconDefault,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "600",
            },
          }}
        >
      <Tabs.Screen
        name="index"
        options={{
          title: t('common.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: t('common.routines'),
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: t('common.workout'),
          tabBarIcon: ({ color, size }) => <Ionicons name="fitness" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('common.history'),
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('common.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          href: null,
        }}
      />
          </Tabs>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
