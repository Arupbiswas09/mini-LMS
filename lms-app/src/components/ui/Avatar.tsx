import { View, Text } from 'react-native';
import { Image } from 'expo-image';

const sizeMap = {
  sm: 36,
  md: 48,
  lg: 72,
  xl: 96,
} as const;

export type AvatarSize = keyof typeof sizeMap;

export interface AvatarProps {
  uri: string | null | undefined;
  size?: AvatarSize;
  initials: string;
  accessibilityLabel?: string;
}

export function Avatar({
  uri,
  size = 'md',
  initials,
  accessibilityLabel = 'Profile photo',
}: AvatarProps) {
  const dim = sizeMap[size];
  const fontSize = size === 'sm' ? 12 : size === 'md' ? 16 : size === 'lg' ? 24 : 32;
  const displayInitials = initials.slice(0, 2).toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: dim, height: dim, borderRadius: dim / 2 }}
        contentFit="cover"
        transition={200}
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full bg-primary-600"
      style={{ width: dim, height: dim }}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <Text className="text-white font-bold" style={{ fontSize }}>
        {displayInitials}
      </Text>
    </View>
  );
}
