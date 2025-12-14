import axios from "axios";

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export const uploadToIPFS = async (file: File): Promise<string> => {
  if (!PINATA_JWT) {
    throw new Error("Missing VITE_PINATA_JWT in .env file");
  }

  const formData = new FormData();

  formData.append("file", file);

  const metadata = JSON.stringify({ 
    name: file.name, 
  });
  formData.append("pinataMetadata", metadata);

  const options = JSON.stringify({ cidVersion: 0 });
  formData.append("pinataOptions", options);

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );
    return res.data.IpfsHash; 
  } catch (error) {
    console.error("IPFS Upload Error:", error);
    throw new Error("Failed to upload to IPFS");
  }
};