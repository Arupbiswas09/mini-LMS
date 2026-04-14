import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/authStore';
import { useCourseStore } from '@/stores/courseStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { appStorage } from '@/lib/storage/appStorage';
import { secureStorage } from '@/lib/storage/secureStorage';
import { authService } from '@/services/authService';
import { queryClient } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AppLogo } from '@/components/ui/AppLogo';
import { ProfileUsernameSchema, type ProfileUsernameFormValues } from '@/lib/validation/schemas';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const updateUser = useAuthStore((s) => s.updateUser);

  const bookmarks = useCourseStore((s) => s.bookmarks);
  const enrolledCourses = useCourseStore((s) => s.enrolledCourses);

  const isDarkMode = usePreferencesStore((s) => s.isDarkMode);
  const toggleDarkMode = usePreferencesStore((s) => s.toggleDarkMode);
  const notificationsEnabled = usePreferencesStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = usePreferencesStore((s) => s.setNotificationsEnabled);
  const biometricEnabled = usePreferencesStore((s) => s.biometricEnabled);
  const setBiometricEnabled = usePreferencesStore((s) => s.setBiometricEnabled);

  const [bootstrapDone, setBootstrapDone] = useState(Boolean(user));
  const [refreshing, setRefreshing] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [usernameBusy, setUsernameBusy] = useState(false);

  const completedCount = appStorage.getLessonProgress().length;

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await refreshUser();
      } finally {
        if (active) setBootstrapDone(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, errors },
  } = useForm<ProfileUsernameFormValues>({
    resolver: zodResolver(ProfileUsernameSchema),
    defaultValues: { username: user?.username ?? '' },
  });

  useEffect(() => {
    reset({ username: user?.username ?? '' });
  }, [user?.username, reset]);

  const watchedUsername = watch('username');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => void logout(),
      },
    ]);
  }, [logout]);

  const handleClearCache = useCallback(() => {
    Alert.alert('Clear cache', 'This clears downloaded API cache. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          queryClient.clear();
          Alert.alert('Done', 'Cache cleared.');
        },
      },
    ]);
  }, []);

  const handlePickAvatar = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const localUri = result.assets[0].uri;
    // Optimistic UI: show the chosen image immediately.
    updateUser({ avatar: { url: localUri, localPath: localUri } });
    setAvatarBusy(true);
    try {
      const updated = await authService.updateAvatar(localUri);
      updateUser(updated);
    } catch {
      Alert.alert('Upload failed', 'Could not update your avatar. Try again.');
    } finally {
      setAvatarBusy(false);
    }
  }, [updateUser]);

  const onSaveUsername = useCallback(
    async (values: ProfileUsernameFormValues) => {
      if (!user || values.username === user.username) return;
      setUsernameBusy(true);
      try {
        const updated = await authService.updateProfile({ username: values.username });
        updateUser(updated);
        reset({ username: updated.username });
      } catch {
        Alert.alert('Update failed', 'Could not save your username.');
      } finally {
        setUsernameBusy(false);
      }
    },
    [user, updateUser, reset]
  );

  const onCancelUsername = useCallback(() => {
    reset({ username: user?.username ?? '' });
  }, [reset, user?.username]);

  const handleBiometricToggle = useCallback(
    (value: boolean) => {
      if (value) {
        Alert.alert(
          'Biometric sign-in',
          'Sign in once with your password while this is on to store credentials securely for Face ID or Touch ID.',
          [{ text: 'OK', onPress: () => setBiometricEnabled(true) }]
        );
      } else {
        void secureStorage.removeBiometricCredentials();
        setBiometricEnabled(false);
      }
    },
    [setBiometricEnabled]
  );

  if (!bootstrapDone && !user) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900 px-5 pt-6" edges={['top']}>
        <SkeletonLoader variant="avatar" className="self-center mb-4" />
        <SkeletonLoader variant="line" className="mb-2 w-48 self-center" />
        <SkeletonLoader variant="line" className="mb-8 w-64 self-center" />
        <View className="flex-row gap-2 mb-8">
          <SkeletonLoader variant="card" className="flex-1 h-24" />
          <SkeletonLoader variant="card" className="flex-1 h-24" />
          <SkeletonLoader variant="card" className="flex-1 h-24" />
        </View>
        <SkeletonLoader variant="listItem" className="mb-3" />
        <SkeletonLoader variant="listItem" className="mb-3" />
        <SkeletonLoader variant="listItem" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900 px-5 pt-6" edges={['top']}>
        <View className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-white">Could not load profile</Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Please refresh your session or sign in again.
          </Text>
          <View className="flex-row mt-4 gap-3">
            <TouchableOpacity
              className="px-4 py-2 rounded-lg bg-primary-600"
              onPress={() => void onRefresh()}
              accessibilityRole="button"
              accessibilityLabel="Retry loading profile"
            >
              <Text className="text-white font-medium">Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700"
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Text className="text-neutral-900 dark:text-white font-medium">Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const initials = user.username?.slice(0, 2).toUpperCase() ?? 'U';
  const avatarUri = user.avatar?.localPath ?? user.avatar?.url ?? null;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        <View className="px-5 pt-6 pb-6 items-center border-b border-neutral-100 dark:border-neutral-800">
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={avatarBusy}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            accessibilityHint="Opens your photo library to pick a new avatar"
            accessibilityState={{ busy: avatarBusy }}
          >
            <View className="relative">
              <Avatar uri={avatarUri} size="lg" initials={initials} accessibilityLabel="Your profile photo" />
              {avatarBusy ? (
                <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40">
                  <ActivityIndicator color="white" />
                </View>
              ) : (
                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 items-center justify-center border-2 border-white dark:border-neutral-900">
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-neutral-900 dark:text-white mt-4">{user.username}</Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{user.email}</Text>
          {joinedDate ? (
            <Text className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">Joined {joinedDate}</Text>
          ) : null}
        </View>

        <View className="flex-row px-3 py-5 border-b border-neutral-100 dark:border-neutral-800">
          <StatCard label="Courses enrolled" value={enrolledCourses.size} icon="school-outline" />
          <StatCard label="Bookmarked" value={bookmarks.size} icon="bookmark-outline" />
          <StatCard label="Completed" value={completedCount} icon="checkmark-circle-outline" />
        </View>

        <View className="px-5 pt-6">
          <Text className="text-xs font-semibold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider mb-3">
            Edit profile
          </Text>
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Username</Text>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`bg-neutral-50 dark:bg-neutral-800 border rounded-xl px-4 py-3 text-base text-neutral-900 dark:text-white ${
                  errors.username ? 'border-error-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Username"
                accessibilityHint="Edit your display name"
              />
            )}
          />
          {errors.username ? (
            <Text className="text-error-500 text-sm mt-1">{errors.username.message}</Text>
          ) : null}
          {isDirty ? (
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                className="flex-1 bg-neutral-200 dark:bg-neutral-700 py-3 rounded-xl items-center"
                onPress={onCancelUsername}
                disabled={usernameBusy}
                accessibilityRole="button"
                accessibilityLabel="Cancel username changes"
              >
                <Text className="text-neutral-800 dark:text-neutral-200 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary-600 py-3 rounded-xl items-center"
                onPress={handleSubmit(onSaveUsername)}
                disabled={usernameBusy || watchedUsername === user.username}
                accessibilityRole="button"
                accessibilityLabel="Save username"
              >
                {usernameBusy ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View className="px-5 pt-8">
          <Text className="text-xs font-semibold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider mb-3">
            Settings
          </Text>
          <View className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-100 dark:border-neutral-700">
              <View className="flex-row items-center flex-1 mr-2">
                <Ionicons name="moon-outline" size={20} color="#6b7280" />
                <Text className="ml-3 text-base text-neutral-700 dark:text-neutral-300">Dark mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#d1d5db', true: '#2563eb' }}
                thumbColor="white"
                accessibilityLabel="Toggle dark mode"
                accessibilityRole="switch"
              />
            </View>

            <View className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-100 dark:border-neutral-700">
              <View className="flex-row items-center flex-1 mr-2">
                <Ionicons name="notifications-outline" size={20} color="#6b7280" />
                <Text className="ml-3 text-base text-neutral-700 dark:text-neutral-300">Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#2563eb' }}
                thumbColor="white"
                accessibilityLabel="Toggle notifications"
                accessibilityRole="switch"
              />
            </View>

            <View className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-100 dark:border-neutral-700">
              <View className="flex-row items-center flex-1 mr-2">
                <Ionicons name="finger-print-outline" size={20} color="#6b7280" />
                <Text className="ml-3 text-base text-neutral-700 dark:text-neutral-300">Biometric sign-in</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#d1d5db', true: '#2563eb' }}
                thumbColor="white"
                accessibilityLabel="Toggle biometric sign-in"
                accessibilityRole="switch"
              />
            </View>

            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4"
              onPress={handleClearCache}
              accessibilityRole="button"
              accessibilityLabel="Clear cache"
            >
              <View className="flex-row items-center">
                <Ionicons name="trash-outline" size={20} color="#6b7280" />
                <Text className="ml-3 text-base text-neutral-700 dark:text-neutral-300">Clear cache</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 mt-8">
          <TouchableOpacity
            className="bg-error-50 border border-error-200 rounded-2xl py-4 items-center flex-row justify-center"
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-error-500 font-semibold text-base ml-2">Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Brand footer */}
        <View className="items-center pt-8 pb-2">
          <AppLogo variant="small" animate={false} pulse={false} />
          <Text className="text-xs text-neutral-400 dark:text-neutral-600 mt-2">
            miniLMS · v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
