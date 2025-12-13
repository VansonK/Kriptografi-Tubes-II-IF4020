import CryptoJS from "crypto-js";

/**
 * 1. Calculate SHA-256 Hash of a Raw Buffer
 * This is the "Source of Truth" for our file ID. 
 * We use native crypto.subtle for absolute binary precision.
 */
export const calculateBufferHash = async (buffer: ArrayBuffer): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return "0x" + hashHex;
};

/**
 * Helper: Convert CryptoJS WordArray to Uint8Array
 * Needed to convert the decrypted data back into a valid PDF buffer.
 */
export const wordArrayToUint8Array = (wordArray: any) => {
    const { words, sigBytes } = wordArray;
    const u8 = new Uint8Array(sigBytes);
    for (let i = 0; i < sigBytes; i++) {
        const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        u8[i] = byte;
    }
    return u8;
};

// --- KEEPING EXISTING FUNCTIONS BELOW ---

/**
 * 2. Generate a random AES Key
 */
export const generateAESKey = (): string => {
  return CryptoJS.lib.WordArray.random(32).toString(); 
};

/**
 * 3. Encrypt Data with AES (for URL params)
 */
export const encryptData = (data: string, key: string): string => {
  return CryptoJS.AES.encrypt(data, key).toString();
};

// 4. Encrypt a File (Blob) using AES for IPFS Upload
export const encryptFile = (file: File, key: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // Result is "data:application/pdf;base64,..."
    reader.onload = () => {
      const base64Data = reader.result as string;
      const encryptedData = CryptoJS.AES.encrypt(base64Data, key).toString();
      const encryptedBlob = new Blob([encryptedData], { type: "text/plain" });
      resolve(encryptedBlob);
    };
    reader.onerror = (err) => reject(err);
  });
};

// 5. Decrypt a File (Simple helper if needed elsewhere)
export const decryptFile = async (encryptedUrl: string, key: string): Promise<string> => {
  const response = await fetch(encryptedUrl);
  const encryptedText = await response.text();
  const bytes = CryptoJS.AES.decrypt(encryptedText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const base64ToUint8Array = (base64: string): Uint8Array => {
  // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
  const base64Clean = base64.split(',')[1] || base64;
  
  const binaryString = window.atob(base64Clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};