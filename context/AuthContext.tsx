import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { loginFetchUserName } from '@/app/(auth)/functions/loginFetchUserFunction';
import { createContext, useContext, useEffect, useState } from 'react';

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
