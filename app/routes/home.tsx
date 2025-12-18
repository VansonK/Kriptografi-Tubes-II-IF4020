import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, GraduationCap, Building2, ArrowRight, Wallet, LogOut } from "lucide-react";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          console.error("Failed to load wallet", err);
        }
      }
    };
    checkConnection();
  }, []);

  const handleConnect = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask to use this feature!");
      return;
    }

    setIsConnecting(true);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      
      const userAccount = accounts[0];
      setWalletAddress(userAccount);

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }], // 11155111 in hex
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xaa36a7",
                  chainName: "Sepolia Test Network",
                  rpcUrls: ["https://sepolia.infura.io/v3/"], 
                  nativeCurrency: {
                    name: "Sepolia ETH",
                    symbol: "SepoliaETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ],
            });
          } catch (addError) {
            console.error("Failed to add Sepolia network", addError);
          }
        } else {
          console.error("Failed to switch network", switchError);
        }
      }

    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
  };

  // Helper to format address
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation Bar */}
      <nav className="fixed top-0 z-50 w-full border-b border-emerald-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-600 p-2 text-white">
              <ShieldCheck size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-emerald-950">
              <Link to="/">Chainify</Link>
            </span>
          </div>

          {/* Wallet Button Implementation */}
          <div className="flex items-center gap-4">
            {!walletAddress ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-slate-900 px-6 py-2.5 font-medium text-white transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70"
              >
                <Wallet size={18} />
                <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {formatAddress(walletAddress)}
                </div>
                <button
                  onClick={handleDisconnect}
                  className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Disconnect"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-teal-50/30 to-slate-50"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 mr-2 animate-pulse"></span>
            IF4020 Cryptography & Blockchain System
          </div>
          
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
            Secure & Immutable <br />
            <span className="text-emerald-600">Digital Diploma Record</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-slate-600 mb-10 leading-relaxed">
            A decentralized platform for issuing, storing, and verifying academic credentials. 
            Combines Public Key Cryptography with Immutable Ledger technology to prevent 
            credential fraud.
          </p>
        </div>
      </section>

      {/* Action Cards Section */}
      <section className="relative -mt-12 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
          
          {/* Card 1: Issuer (Institution) */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-emerald-100/50 hover:-translate-y-1">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-emerald-100 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 size={24} />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Institution Portal
            </h3>
            <p className="text-slate-500 mb-8 h-20">
              For University Admins. Issue new diplomas to the blockchain or revoke existing ones securely using your private key signature.
            </p>
            
            <Link 
              to={walletAddress ? "/issuer/dashboard" : "#"}
              onClick={(e) => {
                if (!walletAddress) {
                  e.preventDefault();
                  alert("Please connect your wallet to access the Issuer Dashboard.");
                }
              }}
              className={`inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-center text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-4 ${
                walletAddress 
                  ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-100" 
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              Access Issuer Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Card 2: Verifier / Student */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-teal-100/50 hover:-translate-y-1">
            <div className="absolute top-0 left-0 -mt-4 -ml-4 h-24 w-24 rounded-full bg-teal-100 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <GraduationCap size={24} />
            </div>
            
            <h3 className="relative text-2xl font-bold text-slate-900 mb-3">
              Verification Portal
            </h3>
            <p className="relative text-slate-500 mb-8 h-20">
              For Students and Public Verifiers. Decrypt and validate certificate authenticity using the unlisted URL or document hash.
            </p>
            
            <Link 
              to="/verify" 
              className="relative inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-emerald-700 focus:outline-none focus:ring-4 focus:ring-slate-100"
            >
              Verify a Certificate
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-400">
          <p>© 2025 Institut Teknologi Bandung. IF4020 Cryptography.</p>
          <p className="mt-2">Deployed on Sepolia Testnet</p>
        </div>
      </footer>
    </div>
  );
}
 
declare global {
  interface Window {
    ethereum: any;
  }
}