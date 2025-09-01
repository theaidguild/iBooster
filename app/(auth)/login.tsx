import React from 'react';
import { useRouter } from 'expo-router';
import { AuthScreen } from '../../screens/Auth';

export default function LoginRoute() {
  const router = useRouter();

  const handleComplete = () => {
    router.replace('/(app)');
  };

  return <AuthScreen onComplete={handleComplete} />;
}
