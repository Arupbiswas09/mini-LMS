import { useNetworkState } from 'expo-network';
import * as Network from 'expo-network';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: Network.NetworkStateType;
}

export function useNetworkStatus(): NetworkStatus {
  const state = useNetworkState();

  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable ?? false,
    connectionType: state.type ?? Network.NetworkStateType.UNKNOWN,
  };
}
