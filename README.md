# 🛡️ Chainify - Blockchain Credential Verification System

**Chainify** adalah sistem verifikasi dokumen terdesentralisasi yang memanfaatkan Blockchain Ethereum dan penyimpanan IPFS untuk menerbitkan, membagikan, dan memvalidasi kredensial akademik (seperti Ijazah) secara aman, transparan, dan anti-manipulasi.

Proyek ini dirancang dengan pendekatan *Privacy-First*, memastikan dokumen fisik tetap rahasia melalui enkripsi sisi klien, sementara validitas dan integritasnya dijamin oleh buku besar publik (Blockchain).

---

## 🔐 Spesifikasi Kriptografi

Sistem ini menerapkan standar kriptografi industri untuk menjamin kerahasiaan, integritas, dan otentikasi:

| Algoritma | Tipe | Kegunaan dalam Sistem |
| :--- | :--- | :--- |
| **AES-256** | *Symmetric Encryption* | Mengenkripsi file PDF di sisi klien (browser) sebelum diunggah ke IPFS. Memastikan file tidak bisa dibaca oleh publik tanpa kunci dekripsi khusus. |
| **SHA-256** | *Hashing Function* | Menghasilkan "sidik jari" unik dari file PDF asli. Hash ini disimpan di Smart Contract untuk memverifikasi integritas dokumen (mendeteksi perubahan 1 bit pun). |
| **ECDSA** *(secp256k1)* | *Digital Signature* | **1. Transaksi:** Menandatangani setiap interaksi ke Blockchain (Issuance).<br>**2. Revocation:** Digunakan untuk memverifikasi tanda tangan kriptografis Issuer saat melakukan pencabutan (revoke) kredensial, menjamin *non-repudiation*. |
| **Keccak-256** | *Hashing Function* | Algoritma hashing native Ethereum, digunakan untuk menghasilkan address wallet dan *function selectors* pada Smart Contract. |

---

## ✨ Fitur Utama

### 1. Secure Issuance (Penerbitan Aman)
* **Client-Side Encryption:** Dokumen PDF dienkripsi lokal sebelum meninggalkan browser pengguna.
* **Decentralized Storage:** File terenkripsi disimpan di IPFS (InterPlanetary File System), menjamin ketersediaan data permanen tanpa server terpusat.
* **On-Chain Proof:** Hash dokumen dicatat di Ethereum Smart Contract sebagai bukti keaslian abadi.

### 2. Trustless Verification (Verifikasi Tanpa Perantara)
* **Auto-Decryption:** URL verifikasi mengandung kunci dekripsi yang secara otomatis membuka dokumen untuk pemegang link.
* **Tamper Proof:** Membandingkan hash file yang diunduh dengan hash di Blockchain. Jika berbeda, dokumen ditolak.
* **Smart PDF Stamping:** Jika valid, sistem menyuntikkan *watermark* dan link transparan ke dalam file PDF, memudahkan verifikasi ulang di masa depan.

### 3. Revocation System (Sistem Pencabutan)
* **Cryptographic Proof:** Issuer dapat mencabut dokumen dengan menyertakan alasan dan tanda tangan digital.
* **Transparency:** Status pencabutan, alasan, dan bukti tanda tangan ditampilkan secara publik di halaman verifikasi (Etherscan & UI).

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Blockchain Interaction:** Ethers.js v6
* **Smart Contract:** Solidity (Sepolia Testnet)
* **Storage:** IPFS (via Pinata API)
* **Libraries:**
    * `crypto-js`: Untuk enkripsi/dekripsi AES.
    * `pdf-lib`: Untuk manipulasi PDF dan pembuatan anotasi link.
    * `lucide-react`: Untuk ikon UI.

---

## ⚙️ Instalasi & Setup Developer

Ikuti langkah ini untuk menjalankan proyek di lingkungan lokal:

### 1. Clone Repository
```bash
git clone [https://github.com/username/chainify.git](https://github.com/username/chainify.git)
cd chainify
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Env
Ubah .env.example menjadi .env. Jika ingin menggunakan IPFS sendiri maka tinggal mengubah JWT Pinata yang digunakan, begitu juga dengan smart contract dengan tambahan update informasi contractConfig.ts (namun tidak disarankan untuk menggunakan smart contract lain karena kesesuaian sistem).

### 4. Menjalankan Aplikasi
```bash
npm run dev
```