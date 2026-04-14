import { useState, useRef, useCallback } from 'react';
import { AppLogo } from '@/components/ui/AppLogo';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { LoginSchema, type LoginFormValues } from '@/lib/validation/schemas';
import { BiometricLoginButton } from '@/components/auth/BiometricLoginButton';

export default function LoginScreen() {
  const { handleLoginSubmit, isLoading, error, clearError, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const shakeX = useSharedValue(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [shakeX]);

  const onValid = useCallback(
    async (values: LoginFormValues) => {
      try {
        await handleLoginSubmit(values);
      } catch {
        triggerShake();
      }
    },
    [handleLoginSubmit, triggerShake]
  );

  const handleBiometricCredentials = useCallback(
    async (creds: { email: string; password: string }) => {
      clearError();
      try {
        await login(creds);
      } catch {
        triggerShake();
      }
    },
    [login, clearError, triggerShake]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-neutral-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-8">
          {/* Branded logo header */}
          <View className="items-center mb-10">
            <AppLogo variant="header" animate pulse={false} />
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white mt-5">
              Welcome back
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Sign in to continue learning
            </Text>
          </View>

          <Animated.View style={animatedStyle}>
            <View className="mb-5">
              <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Email address
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`bg-neutral-50 dark:bg-neutral-800 border rounded-xl px-4 py-3.5 text-base text-neutral-900 dark:text-white ${
                      errors.email ? 'border-error-500' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                    placeholder="you@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    accessibilityLabel="Email address"
                    accessibilityHint="Enter your email address to sign in"
                  />
                )}
              />
              {errors.email ? (
                <Text className="text-error-500 text-sm mt-1">{errors.email.message}</Text>
              ) : null}
            </View>

            <View className="mb-2">
              <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Password
              </Text>
              <View className="relative">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      ref={passwordRef}
                      className={`bg-neutral-50 dark:bg-neutral-800 border rounded-xl px-4 py-3.5 pr-12 text-base text-neutral-900 dark:text-white ${
                        errors.password ? 'border-error-500' : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                      placeholder="••••••••"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      textContentType="password"
                      returnKeyType="done"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      onSubmitEditing={handleSubmit(onValid)}
                      accessibilityLabel="Password"
                      accessibilityHint="Enter your password"
                    />
                  )}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3.5"
                  onPress={togglePasswordVisibility}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text className="text-error-500 text-sm mt-1">{errors.password.message}</Text>
              ) : null}
            </View>

            {error ? (
              <View className="bg-error-50 border border-error-500 rounded-xl p-3.5 mb-4 mt-2">
                <Text className="text-error-600 text-sm text-center">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className={`bg-primary-600 rounded-xl py-4 items-center ${isLoading ? 'opacity-70' : ''}`}
              onPress={handleSubmit(onValid)}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">Sign in</Text>
              )}
            </TouchableOpacity>

            <BiometricLoginButton onAuthenticated={handleBiometricCredentials} disabled={isLoading} />
          </Animated.View>

          <View className="flex-row justify-center mt-8">
            <Text className="text-neutral-500 dark:text-neutral-400 text-base">
              {"Don't have an account? "}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity accessibilityRole="link" accessibilityLabel="Go to register">
                <Text className="text-primary-600 font-semibold text-base">Register</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
