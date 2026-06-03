export type PasswordGeneratorOptions = {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
};

const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
const numberChars = "0123456789";
const symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function getRandomIndex(max: number) {
  const randomArray = new Uint32Array(1);
  crypto.getRandomValues(randomArray);

  return randomArray[0] % max;
}

function getRandomChar(charset: string) {
  return charset[getRandomIndex(charset.length)];
}

function shuffleString(value: string) {
  const chars = value.split("");

  for (let index = chars.length - 1; index > 0; index--) {
    const randomIndex = getRandomIndex(index + 1);
    [chars[index], chars[randomIndex]] = [chars[randomIndex], chars[index]];
  }

  return chars.join("");
}

export function generatePassword(options: PasswordGeneratorOptions) {
  const {
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
  } = options;

  const selectedCharsets: string[] = [];

  if (includeUppercase) selectedCharsets.push(uppercaseChars);
  if (includeLowercase) selectedCharsets.push(lowercaseChars);
  if (includeNumbers) selectedCharsets.push(numberChars);
  if (includeSymbols) selectedCharsets.push(symbolChars);

  if (selectedCharsets.length === 0) {
    throw new Error("Select at least one character type.");
  }

  if (length < selectedCharsets.length) {
    throw new Error(
      `Password length must be at least ${selectedCharsets.length}.`
    );
  }

  const allChars = selectedCharsets.join("");

  /**
   * First, guarantee at least one character from each selected group.
   * Example: if uppercase + numbers are selected, generated password
   * must include at least one uppercase and one number.
   */
  let password = selectedCharsets
    .map((charset) => getRandomChar(charset))
    .join("");

  while (password.length < length) {
    password += getRandomChar(allChars);
  }

  return shuffleString(password);
}

export function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return {
      label: "Weak",
      description: "Use a longer password with more character variety.",
    };
  }

  if (score <= 4) {
    return {
      label: "Good",
      description: "Decent, but longer is better.",
    };
  }

  return {
    label: "Strong",
    description: "Strong password for normal use.",
  };
}