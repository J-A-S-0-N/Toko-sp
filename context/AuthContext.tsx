import { loginFetchUserName } from '@/app/(auth)/functions/loginFetchUserFunction';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

// ===== GOOGLE AUTH (added) START — remove this block to revert =====

import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '815485205204-0dc9he3a432md3dov360he3bs507o08a.apps.googleusercontent.com',
  iosClientId: '815485205204-o6udj014kdfndbg8sv8hbed4mvhjudmo.apps.googleusercontent.com',
});

// ===== GOOGLE AUTH (added) END =====

type AuthContextType = {
  user: FirebaseAuthTypes.User | null;
  username: string | null;
  setUsername: (name: string | null) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  username: null,
  setUsername: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async u => {
      setUser(u);

      if (u) {
        const result = await loginFetchUserName(u.uid);
        setUsername(result.name);
      } else {
        setUsername(null);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, username, setUsername, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
