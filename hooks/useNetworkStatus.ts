import { useNetwork } from '@/context/NetworkContext';

export function useNetworkStatus() {
  return useNetwork();
}
