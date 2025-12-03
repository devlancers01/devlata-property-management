/**
 * Generate a temporary password
 * Format: 8 characters with uppercase, lowercase, numbers, and special chars
 */
export function generateTemporaryPassword(): string {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclude I, O
  const lowercase = "abcdefghjkmnpqrstuvwxyz"; // Exclude i, l, o
  const numbers = "23456789"; // Exclude 0, 1
  const special = "@#$%&*";

  const allChars = uppercase + lowercase + numbers + special;

  let password = "";

  // Ensure at least one character from each set
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));

  // Fill remaining characters randomly
  for (let i = password.length; i < 12; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}