// import { useAuth } from "../../context/AuthContext";

export default function ConnectWalletButton() {
//   const { address, loginWithWallet } = useAuth();

  return (
    <button className="btn btn-primary" onClick={loginWithWallet}>
      {/* {address ? `Connected: ${address.slice(0, 6)}...` : "Connect Wallet"} */}
      "Connect Wallet"
    </button>
  );
}
