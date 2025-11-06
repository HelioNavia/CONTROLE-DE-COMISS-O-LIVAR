import { useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '../types';

// Mock user database
let USERS: Record<string, { password_hash: string; user: User }> = {
  admin: {
    password_hash: 'admin123',
    user: { id: 'user-1', username: 'admin', name: 'Administrador', role: 'admin' },
  },
  gerente: {
    password_hash: 'gerente123',
    user: { id: 'user-2', username: 'gerente', name: 'Gerente', role: 'gerente' },
  },
  'ana.costa': {
    password_hash: 'ana123',
    user: { id: 'user-3', username: 'ana.costa', name: 'Ana Costa', role: 'corretor' },
  },
   'bruno.lima': {
    password_hash: 'bruno123',
    user: { id: 'user-4', username: 'bruno.lima', name: 'Bruno Lima', role: 'corretor' },
  },
  financeiro: {
    password_hash: 'financeiro123',
    user: { id: 'user-5', username: 'financeiro', name: 'Financeiro', role: 'financeiro' },
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const item = window.sessionStorage.getItem('user');
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Failed to parse user from sessionStorage", error);
      return null;
    }
  });

  useEffect(() => {
    try {
        if (user) {
            window.sessionStorage.setItem('user', JSON.stringify(user));
        } else {
            window.sessionStorage.removeItem('user');
        }
    } catch (error) {
        console.error("Failed to update sessionStorage", error);
    }
  }, [user]);

  const login = useCallback(async (username: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const userData = USERS[username.toLowerCase()];
            if (userData && userData.password_hash === password) {
                setUser(userData.user);
                resolve();
            } else {
                reject(new Error('Usuário ou senha inválidos.'));
            }
        }, 500); // Simulate network delay
    });
  }, []);

  const register = useCallback(async (name: string, username: string, password: string, role: UserRole): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (USERS[username.toLowerCase()]) {
                return reject(new Error('Este nome de usuário já existe.'));
            }
            if (role === 'admin') {
                return reject(new Error('Não é permitido registrar-se como Administrador.'));
            }

            const newUser: User = {
                id: `user-${Date.now()}`,
                username: username.toLowerCase(),
                name,
                role
            };

            USERS[username.toLowerCase()] = {
                password_hash: password,
                user: newUser
            };

            setUser(newUser);
            resolve();
        }, 500);
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return { user, login, logout, register };
};