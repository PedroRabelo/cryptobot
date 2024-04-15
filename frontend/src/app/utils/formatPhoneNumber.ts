export function formatPhoneNumber(phoneNumber: string) {
  const length = phoneNumber.length;
  if (length < 10) return phoneNumber;
  if (length === 10) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(
      2,
      6,
    )}-${phoneNumber.slice(6)}`;
  }
  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(
    2,
    3,
  )} ${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`;
}
