import * as Crypto from 'expo-crypto';

/**
 * تشفير كلمة المرور باستخدام SHA-256
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + 'ABDULSALAM_SALT_KEY_2024' // Salt للأمان الإضافي
    );
    return hash;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('فشل في تشفير كلمة المرور');
  }
};

/**
 * التحقق من كلمة المرور
 */
export const verifyPassword = async (
  inputPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const inputHash = await hashPassword(inputPassword);
    return inputHash === hashedPassword;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

/**
 * توليد salt عشوائي
 */
export const generateSalt = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * التحقق من قوة كلمة المرور
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('يجب أن تحتوي على رقم واحد على الأقل');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize user input لمنع SQL injection
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // إزالة HTML tags
    .replace(/['";]/g, '') // إزالة أحرف خطيرة
    .substring(0, 255); // حد أقصى للطول
};

/**
 * التحقق من صحة البريد الإلكتروني
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * التحقق من صحة رقم الهاتف اليمني
 */
export const validateYemeniPhone = (phone: string): boolean => {
  // أرقام يمنية: تبدأ بـ 7 وتتكون من 9 أرقام
  const yemenPhoneRegex = /^7[0-9]{8}$/;
  return yemenPhoneRegex.test(phone.replace(/[\s-]/g, ''));
};
