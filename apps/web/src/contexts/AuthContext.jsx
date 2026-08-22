import { createContext, useContext, useEffect, useState } from 'react';
import { login as loginApi, register as registerApi, logout as logoutApi, getCurrentUser } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();

        setUser(response.user);
      } catch {
        localStorage.removeItem('accessToken');
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [accessToken]);

  async function login(credentials) {
    const data = await loginApi(credentials);

    localStorage.setItem('accessToken', data.accessToken);

    setAccessToken(data.accessToken);
    setUser(data.user);

    return data;
  }

  async function register(credentials) {
    const data = await registerApi(credentials);

    localStorage.setItem('accessToken', data.accessToken);

    setAccessToken(data.accessToken);
    setUser(data.user);

    return data;
  }

  async function logout() {
    await logoutApi();

    localStorage.removeItem('accessToken');

    setAccessToken(null);
    setUser(null);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
