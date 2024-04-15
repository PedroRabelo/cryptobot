import { ISettings } from '@/app/entities/Settings';

type SettingsResponse = ISettings;

export async function getSettingsByEmail() {
  //const { data } = await httpClient.get<SettingsResponse>('/settings');

  // return data;
  return {
    id: 1,
    email: "teste@gmail.com",
    password: "1234",
    apiUrl: "123"
  } as ISettings
}
