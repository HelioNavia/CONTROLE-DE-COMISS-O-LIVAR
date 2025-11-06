import React from 'react';
import { User } from '../types';
import { ChartBarIcon, SunIcon, MoonIcon } from './icons';

interface HeaderProps {
    theme: 'light' | 'dark';
    onThemeToggle: () => void;
    user: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle, user, onLogout }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-indigo-500" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">
              Controle de Comissão
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {user && (
                <div className="flex items-center gap-4">
                    <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bem-vindo, <span className="font-bold">{user.name}</span>
                    </span>
                    <button
                        onClick={onLogout}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
                    >
                        Sair
                    </button>
                </div>
            )}
            <button
              onClick={onThemeToggle}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <MoonIcon className="h-6 w-6" />
              ) : (
                <SunIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;