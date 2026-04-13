import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900 p-8">
        <Text className="text-6xl mb-4">😕</Text>
        <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 text-center">
          Page Not Found
        </Text>
        <Text className="text-base text-neutral-500 text-center mb-8">
          The screen you are looking for doesn't exist.
        </Text>
        <Link href="/(app)/(tabs)/index" className="text-primary-600 font-semibold text-base">
          Go to Home
        </Link>
      </View>
    </>
  );
}
