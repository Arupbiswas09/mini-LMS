import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { Colors } from '@/constants/theme';

export default function TabsLayout() {
  const isDarkMode = usePreferencesStore((state) => state.isDarkMode);

  const tabBarBg = isDarkMode ? Colors.neutral[900] : Colors.white;
  const activeTint = Colors.primary[600];
  const inactiveTint = Colors.neutral[400];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: isDarkMode ? Colors.neutral[800] : Colors.neutral[200],
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Bookmarks',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
