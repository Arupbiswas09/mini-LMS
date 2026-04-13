import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  base64: string | null;
  width: number;
  height: number;
  mimeType: string;
}

const COMPRESS_QUALITY = 0.8;
const MAX_DIM = 800;

async function requestLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Pick an image from the device photo library.
 * Returns `null` if the user cancels or permission is denied.
 */
async function pickImageFromLibrary(): Promise<PickedImage | null> {
  const granted = await requestLibraryPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: COMPRESS_QUALITY,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    base64: asset.base64 ?? null,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

/**
 * Capture a new photo using the device camera.
 * Returns `null` if the user cancels or permission is denied.
 */
async function pickImageFromCamera(): Promise<PickedImage | null> {
  const granted = await requestCameraPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: COMPRESS_QUALITY,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    base64: asset.base64 ?? null,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

/**
 * "Compress" an image by re-picking it with `quality` and `allowsEditing`.
 * Since we already compress at capture/pick time with `quality: 0.8` and
 * `expo-image-manipulator` is not installed, this utility accepts the
 * uri and returns it as-is (ready for upload). The caller should use
 * `pickImageFromLibrary` / `pickImageFromCamera` which already apply compression.
 *
 * If you add `expo-image-manipulator` later, replace this stub with:
 *   ImageManipulator.manipulateAsync(uri, [{ resize: { width: MAX_DIM } }], { compress: COMPRESS_QUALITY })
 */
function compressImage(uri: string): string {
  void MAX_DIM; // reserved for future manipulator resize
  return uri;
}

export const cameraService = {
  pickImageFromLibrary,
  pickImageFromCamera,
  compressImage,
} as const;
