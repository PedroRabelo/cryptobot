import { httpClient } from '../httpClient';

export async function logout() {
  await httpClient.post('/logout');
}
