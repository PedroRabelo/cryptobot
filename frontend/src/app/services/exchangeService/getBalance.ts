import { httpClient } from '../httpClient';

type BalanceResponse = any;

export async function getBalance() {
  const { data } = await httpClient.get<BalanceResponse>('/exchange/balance');

  return data
}
