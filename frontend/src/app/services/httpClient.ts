import axios from 'axios';

import { localStorageKeys } from '../config/localStorageKeys';

export interface IErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

httpClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(localStorageKeys.ACCESS_TOKEN);

  const newConfig = { ...config };
  if (accessToken) {
    newConfig.headers.Authorization = `${accessToken}`;
  }

  return newConfig;
});
