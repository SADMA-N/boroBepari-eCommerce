export const BD_PHONE_REGEX = /^01[3-9]\d{8}$/

export function isValidBDPhone(phone: string): boolean {
  return BD_PHONE_REGEX.test(phone.trim())
}
