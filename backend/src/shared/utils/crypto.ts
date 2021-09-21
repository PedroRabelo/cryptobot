import aes from 'aes-js';
import AppError from '@shared/errors/AppError';

const key = aes.utils.utf8.toBytes(process.env.AES_KEY as string);
if (key.length !== 32)
  throw new AppError('Chave AES inválida. Deve ser 256-bit/32 bytes.');

export function encrypt(text: string): string {
  const bytesInfo = aes.utils.utf8.toBytes(text);
  const aesCTR = new aes.ModeOfOperation.ctr(key);
  const encryptedBytes = aesCTR.encrypt(bytesInfo);
  return aes.utils.hex.fromBytes(encryptedBytes);
}

export function decrypt(encryptedHex: string): string {
  const encryptedBytes = aes.utils.hex.toBytes(encryptedHex);
  const aesCTR = new aes.ModeOfOperation.ctr(key);
  const decryptedBytes = aesCTR.decrypt(encryptedBytes);
  return aes.utils.utf8.fromBytes(decryptedBytes);
}
