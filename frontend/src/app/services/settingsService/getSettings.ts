import { ISettings } from '@/app/entities/Settings';
import { httpClient } from '../httpClient';

type SettingsResponse = ISettings;

export async function getSettings() {
  const { data } = await httpClient.get<SettingsResponse>('/settings');

  return data
}
