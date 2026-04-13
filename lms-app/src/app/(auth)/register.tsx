import { useState, useRef, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { RegisterSchema, type RegisterFormValues } from '@/lib/validation/schemas';
import { PasswordStrengthBar } from '@/components/auth/PasswordStrengthBar';

function ValidationIcon({ isValid, isDirty }: { isValid: boolean; isDirty: boolean }) {
  if (!isDirty) return null;
  return (
    <View className="absolute right-3 top-3.5">
      <Ionicons
        name={isValid ? 'checkmark-circle' : 'close-circle'}
        size={20}
        color={isValid ? '#22c55e' : '#ef4444'}
      />
    </View>
  );
}

export default function RegisterScreen() {
  const { handleRegisterSubmit, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const passwordValue = watch('password');

  const onValid = useCallback(
    async (values: RegisterFormValues) => {
      if (!termsAccepted) return;
      clearError();
      await handleRegisterSubmit(values);
    },
    [handleRegisterSubmit, termsAccepted, clearError]
  );

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
          <View className="mb-6">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Create account
            </Text>
            <Text className="text-base text-neutral-500 dark:text-neutral-400">
              Join thousands of learners today
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Username
            </Text>
            <View className="relative">
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    ref={usernameRef}
                    className={`bg-neutral-50 dark:bg-neutral-800 border rounded-xl px-4 py-3.5 pr-10 text-base text-neutral-900 dark:text-white ${
                      errors.username ? 'border-error-500' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                    placeholder="yourname"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    onSubmitEditing={() => emailRef.current?.focus()}
                    accessibilityLabel="Username"
                    accessibilityHint="Choose a username for your account"
                  />
                )}
              />
              <ValidationIcon isValid={!errors.username} isDirty={!!dirtyFields.username} />
            </View>
            {errors.username ? (
              <Text className="text-error-500 text-sm mt-1">{errors.username.message}</Text>
            ) : null}
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Email address
            </Text>
            <View className="relative">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    ref={emailRef}
                    className={`bg-neutral-50 dark:bg-neutral-800 border rounded-xl px-4 py-3.5 pr-10 text-base text-neutral-900 dark:text-white ${
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
                    accessibilityHint="Enter your email address"
                  />
                )}
              />
              <ValidationIcon isValid={!errors.email} isDirty={!!dirtyFields.email} />
            </View>
            {errors.email ? (
              <Text className="text-error-500 text-sm mt-1">{errors.email.message}</Text>
            ) : null}
          </View>

          <View className="mb-4">
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
                    placeholder="Min 8 characters"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    accessibilityLabel="Password"
                    accessibilityHint="Create a strong password"
                  />
                )}
              />
              <TouchableOpacity
                className="absolute right-3 top-3.5"
                onPress={() => setShowPassword((p) => !p)}
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
            <PasswordStrengthBar password={passwordValue} />
            {errors.password ? (
              <Text className="text-error-500 text-sm mt-1">{errors.password.message}</Text>
            ) : null}
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Confirm password
            </Text>
            <View className="relative">
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    ref={confirmPasswordRef}
                    className={`bg-neutral-50 dark:bg-neutral-800 border rounded-xl px-4 py-3.5 pr-12 text-base text-neutral-900 dark:text-white ${
                      errors.confirmPassword ? 'border-error-500' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                    placeholder="Re-enter password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    onSubmitEditing={handleSubmit(onValid)}
                    accessibilityLabel="Confirm password"
                    accessibilityHint="Re-enter your password to confirm"
                  />
                )}
              />
              <TouchableOpacity
                className="absolute right-3 top-3.5"
                onPress={() => setShowConfirmPassword((p) => !p)}
                accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                accessibilityRole="button"
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
            <ValidationIcon isValid={!errors.confirmPassword} isDirty={!!dirtyFields.confirmPassword} />
            {errors.confirmPassword ? (
              <Text className="text-error-500 text-sm mt-1">{errors.confirmPassword.message}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            className="flex-row items-center mb-6"
            onPress={() => setTermsAccepted((p) => !p)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
            accessibilityLabel="I agree to the Terms and Conditions"
            accessibilityHint="Required to create an account"
          >
            <View
              className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                termsAccepted ? 'bg-primary-600 border-primary-600' : 'border-neutral-300 dark:border-neutral-600'
              }`}
            >
              {termsAccepted ? <Ionicons name="checkmark" size={14} color="white" /> : null}
            </View>
            <Text className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">
              I agree to the <Text className="text-primary-600 font-medium">Terms and Conditions</Text>
            </Text>
          </TouchableOpacity>

          {error ? (
            <View className="bg-error-50 border border-error-500 rounded-xl p-3.5 mb-5">
              <Text className="text-error-600 text-sm text-center">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            className={`bg-primary-600 rounded-xl py-4 items-center ${
              isLoading || !termsAccepted ? 'opacity-60' : ''
            }`}
            onPress={handleSubmit(onValid)}
            disabled={isLoading || !termsAccepted}
            accessibilityRole="button"
            accessibilityLabel="Create account"
            accessibilityState={{ disabled: isLoading || !termsAccepted }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">Create account</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-8">
            <Text className="text-neutral-500 dark:text-neutral-400 text-base">
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity accessibilityRole="link" accessibilityLabel="Go to sign in">
                <Text className="text-primary-600 font-semibold text-base">Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
