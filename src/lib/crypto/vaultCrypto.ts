const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function generateSalt(){
    return crypto.getRandomValues(new Uint8Array(16));
}

export function generateIv(){
    return crypto.getRandomValues(new Uint8Array(12));
}

export function arrayBuffertoBase64(buffer: ArrayBuffer | Uint8Array){
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

    let binary = "";

    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);    
    });

    return btoa(binary);
}

export function base64ToUint8Array(base64: string){
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index++){
        bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
}

export async function deriveVaultKey(masterPassword: string, salt: Uint8Array) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 310000,
      hash: "SHA-256",
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptText(value:string, key:CryptoKey){
    const iv = generateIv();

    const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    textEncoder.encode(value)
    );

    return {
        ciphertext: arrayBuffertoBase64(encryptedBuffer),
        iv: arrayBuffertoBase64(iv),
    };
}

export async function decryptText({
    ciphertext,
    iv,
    key,
}: {
    ciphertext:string;
    iv:string;
    key: CryptoKey;
}) {
    const encryptedBytes = base64ToUint8Array(ciphertext);
    const ivBytes = base64ToUint8Array(iv);

    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivBytes,
        },
        key,
        encryptedBytes
    );

    return textDecoder.decode(decryptedBuffer);
}
