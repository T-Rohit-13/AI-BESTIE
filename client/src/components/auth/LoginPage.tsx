import React from 'react';
import { AuthPage } from './AuthPage';

interface LoginPageProps {
  initialMode?: 'signin' | 'signup' | 'landing';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'landing' }) => {
  return <AuthPage initialMode={initialMode} />;
};

