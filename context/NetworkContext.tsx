import * as Network from 'expo-network';
import React, { createContext, useContext, useEffect, useState } from 'react';

type NetworkContextType = {
  isConnected: boolean;
  isChecking: boolean;
  checkConnection: () => Promise<boolean>;
};

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isChecking: true,
  checkConnection: async () => true,
});

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  const checkConnection = async (): Promise<boolean> => {
    const state = await Network.getNetworkStateAsync();
    const connected = state.isConnected ?? false;
    setIsConnected(connected);
    return connected;
  };

  useEffect(() => {
    // Initial check
    const initialCheck = async () => {
      setIsChecking(true);
      await checkConnection();
      setIsChecking(false);
    };
    initialCheck();

    // Continuous monitoring
    const unsubscribe = Network.addNetworkStateListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => {
      unsubscribe.remove();
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, isChecking, checkConnection }}>
      {children}
    </NetworkContext.Provider>
  );
}
