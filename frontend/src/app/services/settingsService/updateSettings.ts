import { ISettings } from '@/app/entities/Settings';
import { httpClient } from '../httpClient';

export interface ISettingsParams {
  email: string;
  password: string | null;
  apiUrl: string;
  accessKey: string;
  secretKey?: string | null;
  streamUrl: string;
}

export async function updateSettings(params: ISettingsParams) {
  const { data } = await httpClient.patch<ISettings>(
    '/settings',
    params,
  );

  return data;
}
