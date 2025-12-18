import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig"; 
import { ShieldCheck, Copy, Upload, CheckCircle2, LogIn, Lock, AlertCircle, ExternalLink } from "lucide-react"; 
import { calculateBufferHash, generateAESKey, encryptFile } from "../utils/cryptoUtils";
import { uploadToIPFS } from "../utils/ipfsUtils";

export default function IssuerDashboard() {
  // --- AUTH STATE ---
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");

  // --- DASHBOARD STATE ---
  const [activeTab, setActiveTab] = useState<"issue" | "revoke">("issue");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [formData, setFormData] = useState({ name: "", nim: "", program: "" });
  const [file, setFile] = useState<File | null>(null);
  const [txHash, setTxHash] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  
  // --- UI FEEDBACK STATE ---
  const [isCopied, setIsCopied] = useState(false);

  // --- REVOKE STATE ---
  const [revokeId, setRevokeId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsAuthenticated(false);
        } else {
            setWalletAddress(null);
            setIsAuthenticated(false);
        }
      });
      
      const checkConnection = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) setWalletAddress(accounts[0]);
      };
      checkConnection();
    }
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    if (!window.ethereum) return;

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const timestamp = Date.now();
        const message = `Welcome to Chainify Issuer Portal.\n\nPlease sign this message to verify your identity.\n\nWallet: ${userAddress}\nTimestamp: ${timestamp}`;

        const signature = await signer.signMessage(message);
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() === userAddress.toLowerCase()) {
            setIsAuthenticated(true);
        } else {
            setLoginError("Signature verification failed. You are not the owner of this wallet.");
        }
    } catch (err: any) {
        console.error("Login Error:", err);
        setLoginError("Login cancelled or failed.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    setIsCopied(true);
    setTimeout(() => {
        setIsCopied(false);
    }, 2000);
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

      // 1. Encrypt File
      const fileBuffer = await file.arrayBuffer();
      const fileHash = await calculateBufferHash(fileBuffer);
      const aesKey = generateAESKey();
      const encryptedBlob = await encryptFile(file, aesKey);
      

      const timestamp = Date.now();
      const safeName = formData.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''); // Remove spaces/special chars
      const safeNim = formData.nim.replace(/[^a-zA-Z0-9]/g, '');
      const uniqueFilename = `Diploma_${safeNim}_${safeName}_${timestamp}.enc`;

      const encryptedFile = new File([encryptedBlob], uniqueFilename, { type: 'application/octet-stream' });

      const ipfsCid = await uploadToIPFS(encryptedFile);
      const fullIpfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;

      const signature = await signer.signMessage(ethers.getBytes(fileHash));

      const tx = await contract.issueDiploma(fileHash, fullIpfsUrl, fileHash, signature);
      await tx.wait();
      
      setTxHash(tx.hash);
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
    if (!revokeId || !revokeReason) {
        alert("Please provide both the Diploma Hash and the Reason.");
        return;
    }
    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const messageToSign = `REVOKE:${revokeId}:${revokeReason}`;
      const signature = await signer.signMessage(messageToSign);
      
      const tx = await contract.revokeDiploma(revokeId, revokeReason, signature);
      await tx.wait();
      
      alert("Diploma Revoked Successfully on Blockchain!");
      setRevokeId("");
      setRevokeReason("");
    } catch (error: any) {
      console.error("Revoke Error:", error);
      alert("Revoke Failed: " + (error.reason || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // --- VIEW: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-emerald-100">
                <div className="mx-auto bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck size={32} className="text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Issuer Portal</h1>
                <p className="text-slate-500 mb-8 text-sm">Authenticate using your digital wallet signature to access the dashboard.</p>

                {!walletAddress ? (
                    <button onClick={() => { const provider = new ethers.BrowserProvider(window.ethereum); provider.send("eth_requestAccounts", []); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2">
                        <LogIn size={18} /> Connect Wallet
                    </button>
                ) : (
                    <div className="space-y-4">
                         <div className="bg-emerald-50 text-emerald-800 py-2 px-3 rounded-lg text-xs font-mono break-all border border-emerald-200">Connected: {walletAddress}</div>
                        <button onClick={handleLogin} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                            <Lock size={18} /> Sign Nonce to Login
                        </button>
                    </div>
                )}
                {loginError && (<div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg text-left"><AlertCircle size={16} className="shrink-0"/>{loginError}</div>)}
            </div>
        </div>
    );
  }

  // --- VIEW: DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
           <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-600 p-2 text-white"><ShieldCheck size={24} /></div>
            <span className="text-xl font-bold text-emerald-950"><a href="/">Issuer Dashboard</a></span>
          </div>

           <div className="flex items-center gap-3">
             <a 
               href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
               target="_blank"
               rel="noreferrer"
               className="flex items-center gap-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition"
             >
               <ExternalLink size={14} /> Contract
             </a>

             <div className="flex items-center gap-2 text-sm bg-emerald-100 px-3 py-1 rounded-full text-emerald-800 font-mono">
               <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
               {walletAddress?.substring(0,6)}...
             </div>
           </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex gap-4 mb-6">
            <button onClick={() => setActiveTab('issue')} className={`px-4 py-2 rounded ${activeTab === 'issue' ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>Issue</button>
            <button onClick={() => setActiveTab('revoke')} className={`px-4 py-2 rounded ${activeTab === 'revoke' ? 'bg-red-600 text-white' : 'bg-slate-200'}`}>Revoke</button>
        </div>

        {/* ISSUE TAB */}
        {activeTab === "issue" && (
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                <h2 className="text-2xl font-bold mb-6">Issue New Credential</h2>
                <form onSubmit={handleIssue} className="space-y-4">
                    <input className="w-full border p-3 rounded" placeholder="Student Name" onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input className="w-full border p-3 rounded" placeholder="Student ID (NIM)" onChange={e => setFormData({...formData, nim: e.target.value})} />
                    <label className={`block border-2 border-dashed p-8 text-center rounded-xl cursor-pointer transition-all ${file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}`}>
                        <input type="file" onChange={handleFileChange} className="hidden" accept="application/pdf" />
                        <div className="flex flex-col items-center gap-2">
                            {file ? (<><CheckCircle2 size={40} className="text-emerald-500 mb-2" /><span className="text-emerald-700 font-bold text-lg">{file.name}</span></>) : (<><Upload size={40} className="text-slate-400 mb-2" /><span className="text-emerald-600 font-bold text-lg">Click to Upload PDF</span></>)}
                        </div>
                    </label>
                    <button disabled={isLoading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition">{isLoading ? "Processing Transaction..." : "Sign & Issue to Blockchain"}</button>
                </form>
                {status === "success" && (
                    <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <h3 className="text-lg font-bold text-emerald-800">Success!</h3>
                        <div className="mb-4"><p className="text-xs text-emerald-600 uppercase font-semibold mb-1">Transaction Hash:</p><p className="text-xs font-mono break-all bg-white p-2 border rounded text-slate-600">{txHash}</p></div>
                        <p className="text-xs text-emerald-600 uppercase font-semibold mb-1">Verification URL:</p>
                        <div className="bg-white p-2 border rounded flex justify-between items-center">
                            <code className="text-xs break-all text-slate-600">{generatedUrl}</code>
                            <button 
                                className={`p-2 rounded flex items-center gap-2 transition-all duration-200 ${isCopied ? 'bg-emerald-100' : 'hover:bg-slate-100'}`} 
                                onClick={handleCopy}
                            >
                                {isCopied ? (
                                    <>
                                        <span className="text-xs font-bold text-emerald-600">Copied!</span>
                                        <CheckCircle2 size={16} className="text-emerald-600"/>
                                    </>
                                ) : (
                                    <Copy size={16} className="text-slate-500"/>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* REVOKE TAB */}
        {activeTab === "revoke" && (
             <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200">
                 <h2 className="text-2xl font-bold text-red-700 mb-4">Revoke Credential</h2>
                 
                 <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 flex items-start gap-3">
                    <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-red-800">
                        <strong>Warning:</strong> Revoking a diploma is permanent. The status on the blockchain will be updated to "Invalid".
                    </p>
                 </div>

                 <form onSubmit={handleRevoke}>
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Diploma Hash (Diploma ID)</label>
                        <input 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" 
                            placeholder="e.g. 0x123abc..." 
                            value={revokeId} 
                            onChange={e => setRevokeId(e.target.value)} 
                        />
                     </div>
                     
                     <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Revoking</label>
                        <textarea 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none h-24 resize-none" 
                            placeholder="e.g. Plagiarism detected, Administrative error, Tuition unpaid..." 
                            value={revokeReason} 
                            onChange={e => setRevokeReason(e.target.value)} 
                        />
                     </div>

                     <button 
                        disabled={isLoading} 
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50"
                     >
                        {isLoading ? "Revoking..." : "Revoke Credential"}
                     </button>
                 </form>
             </div>
        )} 
      </main>
    </div>
  );
}