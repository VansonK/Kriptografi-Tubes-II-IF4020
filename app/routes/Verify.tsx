import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  ShieldCheck, Search, Lock, CheckCircle2, 
  Loader2, Download, ExternalLink, FileText 
} from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";
// FIX: Import base64ToUint8Array
import { calculateBufferHash, base64ToUint8Array } from "../utils/cryptoUtils";
import CryptoJS from "crypto-js";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [inputUrl, setInputUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [decryptedPdfUrl, setDecryptedPdfUrl] = useState<string | null>(null);
  const [modifiedPdfBytes, setModifiedPdfBytes] = useState<Uint8Array | null>(null);
  const [metaData, setMetaData] = useState<any>(null);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      setInputUrl(decodeURIComponent(dataParam));
      handleVerify(decodeURIComponent(dataParam));
    }
  }, [searchParams]);

  const addLog = (message: string) => setLogs((prev) => [...prev, message]);

  const handleVerify = async (fullPayload: string) => {
    if (!fullPayload) return;
    setStatus("verifying");
    setLogs([]);
    setDecryptedPdfUrl(null);

    try {
      // 1. Parse URL
      addLog("Parsing Unlisted URL parameters...");
      const parts = fullPayload.split("|");
      if (parts.length !== 3) throw new Error("Invalid URL format");
      
      const [ipfsUrl, aesKey, txHash] = parts;
      
      // 2. Fetch Encrypted Data
      addLog("Fetching encrypted document from IPFS...");
      const response = await fetch(ipfsUrl);
      if (!response.ok) throw new Error("Failed to fetch file from IPFS");
      const encryptedText = await response.text();
      
      // 3. Decrypt
      addLog("Decrypting content...");
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, aesKey);
      
      // CRITICAL FIX: Convert decrypted bytes to UTF-8 String first (recovering the Base64)
      const decryptedBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedBase64) throw new Error("Decryption failed. Invalid Key.");

      // 4. Convert Base64 back to Raw Binary (Uint8Array)
      // We must hash the raw binary, not the Base64 string
      const fileRawBytes = base64ToUint8Array(decryptedBase64);
      
      addLog("Decryption successful. Reconstructing file...");

      // 5. Verify Integrity (Hash the Raw Binary)
      addLog("Calculating file integrity hash...");
      const calculatedHash = await calculateBufferHash(fileRawBytes.buffer as ArrayBuffer);
      
      console.log("Calculated Hash (Verify Side):", calculatedHash);
      addLog(`File Hash: ${calculatedHash.substring(0, 15)}...`);

      // 6. Blockchain Verification
      addLog(`Querying Smart Contract...`);
      let provider;
      if (window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
      } else {
          provider = new ethers.JsonRpcProvider("https://1rpc.io/sepolia");   
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // Call contract to check hash
      const result = await contract.verifyDiploma(calculatedHash);
      
      console.log("Contract Result:", result);

      if (!result.isValid) throw new Error("Blockchain reports this Diploma is REVOKED or INVALID.");
      
      // Double check hash match just to be safe
      if (result.fileHash.toLowerCase() !== calculatedHash.toLowerCase()) {
         throw new Error(`Hash mismatch! Chain: ${result.fileHash}, File: ${calculatedHash}`);
      }
      
      addLog(`✅ Blockchain Verified! Issuer: ${result.issuer}`);
      setMetaData({
        issuer: result.issuer,
        timestamp: new Date(Number(result.timestamp) * 1000).toLocaleDateString(),
        txHash: txHash
      });

      // 7. Modify PDF (Bonus Requirement)
      addLog("Stamping Verification URL onto PDF...");
      
      const pdfDoc = await PDFDocument.load(fileRawBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      firstPage.drawText(`Digital Verification: ${fullPayload.substring(0, 40)}...`, {
        x: 20,
        y: 20,
        size: 8,
        font: font,
        color: rgb(0, 0.5, 0),
      });

      const modifiedPdf = await pdfDoc.save();
      setModifiedPdfBytes(modifiedPdf);

      const viewUrl = URL.createObjectURL(new Blob([modifiedPdf as any], { type: 'application/pdf' }));
      setDecryptedPdfUrl(viewUrl);

      setStatus("success");

    } catch (error: any) {
      console.error(error);
      addLog(`❌ Error: ${error.message || "Verification Failed"}`);
      setStatus("error");
    }
  };

  const handleDownload = () => {
    if (modifiedPdfBytes) {
      const blob = new Blob([modifiedPdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Verified_Diploma_Chainify.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-600 p-2 text-white"><ShieldCheck size={24} /></div>
            <span className="text-xl font-bold text-emerald-950">
              <a href="/">Chainify Verifier</a>
            </span>
          </div>
          <div className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">Public Portal</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 grid lg:grid-cols-3 gap-8">
        
        {/* Left Col: Logs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text" placeholder="Paste Unlisted URL..." value={inputUrl} onChange={e => setInputUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
             </div>
             <button 
               onClick={() => handleVerify(inputUrl)} disabled={status === 'verifying'}
               className="mt-3 w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
             >
               {status === 'verifying' ? "Verifying..." : "Verify Credential"}
             </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-h-[500px] overflow-y-auto">
             <h3 className="font-semibold mb-4 flex items-center gap-2"><ShieldCheck size={18}/> Verification Log</h3>
             <div className="space-y-3">
               {logs.map((log, i) => (
                 <div key={i} className="flex gap-3 text-xs animate-in fade-in">
                   <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5"/>
                   <span className="text-slate-600 break-words">{log}</span>
                 </div>
               ))}
             </div>
          </div>
          
          {status === 'success' && metaData && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                  <h3 className="font-bold text-emerald-900 mb-2">Valid On-Chain</h3>
                  <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Issuer:</span> <span className="font-mono text-emerald-800">{metaData.issuer.substring(0,8)}...</span></div>
                      <div className="flex justify-between"><span>Date:</span> <span className="font-mono text-emerald-800">{metaData.timestamp}</span></div>
                  </div>
              </div>
          )}
        </div>

        {/* Right Col: PDF Preview */}
        <div className="lg:col-span-2">
           {status === 'success' && decryptedPdfUrl ? (
             <div className="animate-in fade-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2"><FileText /> Decrypted Diploma</h2>
                  <div className="flex gap-2">
                      <a href={`https://sepolia.etherscan.io/tx/${metaData.txHash}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50">
                        <ExternalLink size={16}/> Etherscan
                      </a>
                      <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200">
                        <Download size={16}/> Download Verified PDF
                      </button>
                  </div>
               </div>

               <div className="bg-slate-800 rounded-xl overflow-hidden shadow-2xl h-[700px] border border-slate-600">
                  <iframe src={decryptedPdfUrl} className="w-full h-full" title="Decrypted PDF"></iframe>
               </div>
             </div>
           ) : (
             <div className="h-full min-h-[400px] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                 {status === 'verifying' ? <Loader2 size={48} className="animate-spin text-emerald-500"/> : <Lock size={48} />}
                 <p className="mt-4">{status === 'verifying' ? "Decrypting & Verifying..." : "Secure Document Viewer"}</p>
             </div>
           )}
        </div>

      </main>
    </div>
  );
}