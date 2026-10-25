import { createContext, useContext, useState } from 'react';
import { api, tokenStore } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  async function handleAuth(request) {
    const data = await request();
    tokenStore.set(data.token);
    setUser(data.user);
  }

  const value = {
    user,
    loading: false,
    register: (details) => handleAuth(() => api.register(details)),
    logout: () => {
      tokenStore.clear();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
