import * as SecureStore from 'expo-secure-store';
import { secureStorage } from '@/lib/storage/secureStorage';

const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSetItem = SecureStore.setItemAsync as jest.Mock;
const mockDeleteItem = SecureStore.deleteItemAsync as jest.Mock;

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setToken / getToken', () => {
    it('stores a token', async () => {
      await secureStorage.setToken('my-token');
      expect(mockSetItem).toHaveBeenCalledWith('auth_access_token', 'my-token', expect.any(Object));
    });

    it('retrieves a token', async () => {
      mockGetItem.mockResolvedValueOnce('stored-token');
      const token = await secureStorage.getToken();
      expect(token).toBe('stored-token');
    });

    it('returns null when no token stored', async () => {
      mockGetItem.mockResolvedValueOnce(null);
      const token = await secureStorage.getToken();
      expect(token).toBeNull();
    });
  });

  describe('setRefreshToken / getRefreshToken', () => {
    it('stores a refresh token', async () => {
      await secureStorage.setRefreshToken('refresh-token');
      expect(mockSetItem).toHaveBeenCalledWith('auth_refresh_token', 'refresh-token', expect.any(Object));
    });

    it('retrieves a refresh token', async () => {
      mockGetItem.mockResolvedValueOnce('stored-refresh');
      const token = await secureStorage.getRefreshToken();
      expect(token).toBe('stored-refresh');
    });
  });

  describe('clearAll', () => {
    it('deletes both tokens', async () => {
      await secureStorage.clearAll();
      expect(mockDeleteItem).toHaveBeenCalledWith('auth_access_token');
      expect(mockDeleteItem).toHaveBeenCalledWith('auth_refresh_token');
      expect(mockDeleteItem).toHaveBeenCalledWith('auth_biometric_creds');
    });
  });

  describe('biometric credentials', () => {
    it('stores biometric credentials', async () => {
      await secureStorage.setBiometricCredentials({ email: 'john@example.com', password: 'pass' });

      expect(mockSetItem).toHaveBeenCalledWith(
        'auth_biometric_creds',
        JSON.stringify({ email: 'john@example.com', password: 'pass' }),
        expect.any(Object)
      );
    });

    it('parses biometric credentials', async () => {
      mockGetItem.mockResolvedValueOnce(JSON.stringify({ email: 'john@example.com', password: 'pass' }));

      await expect(secureStorage.getBiometricCredentials()).resolves.toEqual({
        email: 'john@example.com',
        password: 'pass',
      });
    });

    it('returns null for invalid biometric payload', async () => {
      mockGetItem.mockResolvedValueOnce('{bad-json');

      await expect(secureStorage.getBiometricCredentials()).resolves.toBeNull();
    });

    it('removes biometric credentials', async () => {
      await secureStorage.removeBiometricCredentials();

      expect(mockDeleteItem).toHaveBeenCalledWith('auth_biometric_creds');
    });
  });
});
