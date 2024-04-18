import { useQuery } from '@tanstack/react-query';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { LaunchScreen } from '@/views/components/LaunchScreen';
import { localStorageKeys } from '../config/localStorageKeys';
import { ISettings } from '../entities/Settings';
import { authService } from '../services/authService';
import { settingsService } from '../services/settingsService';

interface IAuthContextValue {
  signedIn: boolean;
  settings: ISettings | undefined;
  signin(accessToken: string): void;
  signout(): void;
}

export const AuthContext = createContext({} as IAuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean>(() => {
    const storedAccessToken = localStorage.getItem(
      localStorageKeys.ACCESS_TOKEN,
    );

    return !!storedAccessToken;
  });

  const { isError, isFetching, isSuccess, data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
    enabled: signedIn,
  });

  const signin = useCallback((accessToken: string) => {
    localStorage.setItem(localStorageKeys.ACCESS_TOKEN, accessToken);

    setSignedIn(true);
  }, []);

  const signout = useCallback(async () => {
    await authService.logout();

    localStorage.removeItem(localStorageKeys.ACCESS_TOKEN);

    setSignedIn(false);
    window.location.reload();
  }, []);

  useEffect(() => {
    if (isError) {
      toast.error('Sua sessão expirou');
      signout();
    }
  }, [isError, signout]);

  return (
    <AuthContext.Provider
      value={{
        signedIn: isSuccess && signedIn,
        settings: data,
        signin,
        signout,
      }}
    >
      <LaunchScreen isLoading={isFetching} />

      {!isFetching && children}
    </AuthContext.Provider>
  );
}
