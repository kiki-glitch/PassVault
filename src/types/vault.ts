export type VaultItemFormValues = {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  favorite: boolean;
};

export type EncryptedVaultItemInsert = {
  owner_id: string;
  vault_id: string;
  title_ciphertext: string;
  username_ciphertext: string | null;
  password_ciphertext: string | null;
  url_ciphertext: string | null;
  notes_ciphertext: string | null;
  title_iv: string;
  username_iv: string | null;
  password_iv: string | null;
  url_iv: string | null;
  notes_iv: string | null;
  salt: string;
  favorite: boolean;
};

export type VaultItemRow = {
  id: string;
  owner_id: string;
  vault_id: string;
  title_ciphertext: string;
  username_ciphertext: string | null;
  password_ciphertext: string | null;
  url_ciphertext: string | null;
  notes_ciphertext: string | null;
  title_iv: string | null;
  username_iv: string | null;
  password_iv: string | null;
  url_iv: string | null;
  notes_iv: string | null;
  salt: string;
  favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type DecryptedVaultItem = {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  favorite: boolean;
  createdAt: string;
};

export type EncryptedVaultItemUpdate = {
  title_ciphertext: string;
  username_ciphertext: string | null;
  password_ciphertext: string | null;
  url_ciphertext: string | null;
  notes_ciphertext: string | null;
  title_iv: string;
  username_iv: string | null;
  password_iv: string | null;
  url_iv: string | null;
  notes_iv: string | null;
  salt: string;
  favorite: boolean;
  updated_at: string;
};