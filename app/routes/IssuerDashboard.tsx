import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig"; 
import { ShieldCheck, Copy, Upload, CheckCircle2 } from "lucide-react"; // Added Upload icon
import { calculateBufferHash, generateAESKey, encryptFile } from "../utils/cryptoUtils";
import { uploadToIPFS } from "../utils/ipfsUtils";

export default function IssuerDashboard() {
  const [activeTab, setActiveTab] = useState<"issue" | "revoke">("issue");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  
  const [formData, setFormData] = useState({ name: "", nim: "", program: "" });
  const [file, setFile] = useState<File | null>(null);

  const [txHash, setTxHash] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [revokeId, setRevokeId] = useState("");

  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) setWalletAddress(accounts[0]);
        } catch (err) {
          console.error("Wallet connection failed", err);
        }
      }
    };
    connectWallet();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !file) return;
    setIsLoading(true);
    setStatus("idle");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // 1. Read file as Buffer immediately
      const fileBuffer = await file.arrayBuffer();
      
      // 2. Calculate Hash from Buffer
      const fileHash = await calculateBufferHash(fileBuffer);
      console.log("Issuer Calculated Hash:", fileHash);

      // 3. Encrypt the File
      const aesKey = generateAESKey();
      const encryptedBlob = await encryptFile(file, aesKey);
      
      // 4. Upload Encrypted Blob to IPFS
      const ipfsCid = await uploadToIPFS(encryptedBlob);
      console.log("Uploaded to IPFS. CID:", ipfsCid);

      // 5. Sign the Hash
      const signature = await signer.signMessage(ethers.getBytes(fileHash));

      // 6. Send to Blockchain
      const fullIpfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;
      const tx = await contract.issueDiploma(fileHash, fullIpfsUrl, fileHash, signature);
      await tx.wait();
      
      setTxHash(tx.hash);

      // 7. Generate URL
      const payload = encodeURIComponent(`${fullIpfsUrl}|${aesKey}|${tx.hash}`);
      setGeneratedUrl(`${window.location.origin}/verify?data=${payload}`);
      
      setStatus("success");

    } catch (error: any) {
      console.error("Issue Error:", error);
      alert("Error: " + (error.reason || error.message));
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeId) return;
    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.revokeDiploma(revokeId, "Revoked by Issuer");
      await tx.wait();
      
      alert("Diploma Revoked Successfully on Blockchain!");
      setRevokeId("");
    } catch (error: any) {
      console.error("Revoke Error:", error);
      alert("Revoke Failed: " + (error.reason || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
           <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-600 p-2 text-white"><ShieldCheck size={24} /></div>
            <span className="text-xl font-bold text-emerald-950">
              <a href="/">Issuer Dashboard</a>
            </span>
          </div>
           <div className="flex items-center gap-2 text-sm bg-emerald-100 px-3 py-1 rounded-full text-emerald-800 font-mono">
              <span className={`h-2.5 w-2.5 rounded-full ${walletAddress ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>              
              {walletAddress ? `${walletAddress.substring(0,6)}...` : "Not Connected"}
            </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex gap-4 mb-6">
            <button onClick={() => setActiveTab('issue')} className={`px-4 py-2 rounded ${activeTab === 'issue' ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>Issue</button>
            <button onClick={() => setActiveTab('revoke')} className={`px-4 py-2 rounded ${activeTab === 'revoke' ? 'bg-red-600 text-white' : 'bg-slate-200'}`}>Revoke</button>
        </div>

        {activeTab === "issue" && (
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                <h2 className="text-2xl font-bold mb-6">Issue New Credential</h2>
                <form onSubmit={handleIssue} className="space-y-4">
                    <input className="w-full border p-3 rounded" placeholder="Student Name" onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input className="w-full border p-3 rounded" placeholder="Student ID (NIM)" onChange={e => setFormData({...formData, nim: e.target.value})} />
                    
                    {/* --- UX UPDATE: Clickable Area & Styling --- */}
                    <label 
                      className={`
                        block border-2 border-dashed p-8 text-center rounded-xl cursor-pointer transition-all
                        ${file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}
                      `}
                    >
                        <input 
                          type="file" 
                          onChange={handleFileChange} 
                          className="hidden" 
                          accept="application/pdf" 
                        />
                        <div className="flex flex-col items-center gap-2">
                            {file ? (
                              <>
                                <CheckCircle2 size={40} className="text-emerald-500 mb-2" />
                                <span className="text-emerald-700 font-bold text-lg">{file.name}</span>
                                <span className="text-emerald-600 text-sm">Click to change file</span>
                              </>
                            ) : (
                              <>
                                <Upload size={40} className="text-slate-400 mb-2" />
                                <span className="text-emerald-600 font-bold text-lg">Click to Upload PDF</span>
                                <span className="text-slate-400 text-sm">Or drag and drop file here</span>
                              </>
                            )}
                        </div>
                    </label>

                    <button disabled={isLoading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition">
                        {isLoading ? "Processing Transaction..." : "Sign & Issue to Blockchain"}
                    </button>
                </form>

                {status === "success" && (
                    <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <h3 className="text-lg font-bold text-emerald-800">Success!</h3>
                        
                        {/* --- UX UPDATE: Full Hash Display --- */}
                        <div className="mb-4">
                          <p className="text-xs text-emerald-600 uppercase font-semibold mb-1">Transaction Hash:</p>
                          <p className="text-xs font-mono break-all bg-white p-2 border rounded text-slate-600">
                            {txHash}
                          </p>
                        </div>

                        <p className="text-xs text-emerald-600 uppercase font-semibold mb-1">Verification URL:</p>
                        <div className="bg-white p-2 border rounded flex justify-between items-center">
                            <code className="text-xs break-all text-slate-600">{generatedUrl}</code>
                            <button 
                              className="p-2 hover:bg-slate-100 rounded"
                              onClick={() => navigator.clipboard.writeText(generatedUrl)}
                            >
                              <Copy size={16} className="text-slate-500"/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === "revoke" && (
             <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200">
                 <h2 className="text-2xl font-bold text-red-700 mb-4">Revoke Credential</h2>
                 <form onSubmit={handleRevoke}>
                     <input className="w-full border p-3 rounded mb-4" placeholder="Diploma ID (File Hash)" value={revokeId} onChange={e => setRevokeId(e.target.value)} />
                     <button disabled={isLoading} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold">Revoke</button>
                 </form>
             </div>
        )}
      </main>
    </div>
  );
}