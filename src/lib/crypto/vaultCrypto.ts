import type {
  DecryptedVaultItem,
  EncryptedVaultItemInsert,
  VaultItemFormValues,
  VaultItemRow,
} from "@/types/vault";

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


type EncryptVaultItemParams = {
    values: VaultItemFormValues;
    key: CryptoKey
    ownerId: string;
    vaultId:string;
    salt: string;
}

export async function encryptVaultItem({
    values,
    key,
    ownerId,
    vaultId,
    salt,
}: EncryptVaultItemParams): Promise<EncryptedVaultItemInsert> {
    const encryptedTitle = await encryptText(values.title, key);

    const encryptedUsername = values.username
        ? await encryptText(values.username, key)
        : null;
    
    const encryptedPassword = values.password
        ? await encryptText(values.password, key)
        : null;

    const encryptedUrl = values.url ? await encryptText(values.url, key) : null

    const encryptedNotes = values.notes
        ? await encryptText(values.notes, key)
        : null;
    
    return {
        owner_id: ownerId,
        vault_id: vaultId,

        title_ciphertext: encryptedTitle.ciphertext,
        username_ciphertext: encryptedUsername?.ciphertext ?? null,
        password_ciphertext: encryptedPassword?.ciphertext ?? null,
        url_ciphertext: encryptedUrl?.ciphertext ?? null,
        notes_ciphertext: encryptedNotes?.ciphertext ?? null,

        title_iv: encryptedTitle.iv,
        username_iv: encryptedUsername?.iv ?? null,
        password_iv: encryptedPassword?.iv ?? null,
        url_iv: encryptedUrl?.iv ?? null,
        notes_iv: encryptedNotes?.iv ?? null,

        salt,
        favorite: values.favorite,
    };
}

export async function decryptVaulIttem({
    row,
    key,
}:{
    row: VaultItemRow;
    key: CryptoKey;
}): Promise<DecryptedVaultItem> {
    const title = row.title_ciphertext && row.title_iv
        ? await decryptText({
            ciphertext: row.title_ciphertext,
            iv: row.title_iv,
            key,
        })
        :"";
    
    const username = row.username_ciphertext && row.username_iv
      ? await decryptText({
          ciphertext: row.username_ciphertext,
          iv: row.username_iv,
          key,
        })
      : "";
    
    const password = row.password_ciphertext && row.password_iv
      ? await decryptText({
          ciphertext: row.password_ciphertext,
          iv: row.password_iv,
          key,
        })
      : "";

    const url = row.url_ciphertext && row.url_iv
      ? await decryptText({
          ciphertext: row.url_ciphertext,
          iv: row.url_iv,
          key,
        })
      : "";

    const notes = row.notes_ciphertext && row.notes_iv
      ? await decryptText({
          ciphertext: row.notes_ciphertext,
          iv: row.notes_iv,
          key,
        })
      : "";

    return {
        id: row.id,
        title,
        username,
        password,
        url,
        notes,
        favorite: row.favorite,
        createdAt: row.created_at,
    };
}