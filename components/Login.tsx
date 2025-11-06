import React, { useState } from 'react';
import { ChartBarIcon } from './icons';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (name: string, username: string, password: string, role: UserRole) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Common fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Registration only fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('corretor');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isRegistering) {
        await onRegister(name, username, password, role);
      } else {
        await onLogin(username, password);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setUsername('');
    setPassword('');
    setName('');
    setRole('corretor');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <div className="text-center">
            <ChartBarIcon className="mx-auto h-12 w-auto text-indigo-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                {isRegistering ? 'Crie sua conta' : 'Acesse sua conta'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Bem-vindo ao Controle de Comissão
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {isRegistering && (
                <div>
                  <label htmlFor="name" className="sr-only">Nome Completo</label>
                  <input
                    id="name" name="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Nome Completo"
                  />
                </div>
            )}
            <div>
              <label htmlFor="username-address" className="sr-only">Usuário</label>
              <input
                id="username-address" name="username" type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${isRegistering ? '' : 'rounded-t-md'}`}
                placeholder="Usuário"
              />
            </div>
            <div>
              <label htmlFor="password" aria-label="senha" className="sr-only">Senha</label>
              <input
                id="password" name="password" type="password" autoComplete={isRegistering ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${isRegistering ? '' : 'rounded-b-md'}`}
                placeholder="Senha"
              />
            </div>
             {isRegistering && (
                <div>
                  <label htmlFor="role" className="sr-only">Perfil</label>
                  <select
                    id="role" name="role" required value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  >
                    <option value="corretor">Corretor</option>
                    <option value="gerente">Gerente</option>
                    <option value="financeiro">Financeiro</option>
                  </select>
                </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? (isRegistering ? 'Cadastrando...' : 'Entrando...') : (isRegistering ? 'Cadastrar' : 'Entrar')}
            </button>
          </div>
        </form>
         <div className="text-sm text-center">
            <button type="button" onClick={toggleMode} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              {isRegistering ? "Já tem uma conta? Entre" : "Não tem uma conta? Cadastre-se"}
            </button>
          </div>
      </div>
    </div>
  );
};

export default Login;