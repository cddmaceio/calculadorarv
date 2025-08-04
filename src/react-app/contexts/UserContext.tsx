import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type UserType } from '../../shared/types';

interface UserContextType {
  user: UserType | null;
  login: (user: UserType) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initializeUser = () => {
      try {
        const storedUser = localStorage.getItem('rv_user');
        if (storedUser && isMounted) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        try {
          localStorage.removeItem('rv_user');
        } catch (e) {
          console.error('Error removing invalid user data:', e);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (userData: UserType) => {
    setUser(userData);
    try {
      localStorage.setItem('rv_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('rv_user');
    } catch (error) {
      console.error('Error removing user from localStorage:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}