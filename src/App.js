import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  ConnectionProvider,
  useConnection,
  useWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { useCallback, useMemo, useState } from "react";
import "./App.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import createAddressLookupTable from "./utils/createAddressLookupTable";
import extendAddressLookupTable from "./utils/extendAddressLookupTable";
import signAndSendTransactionV0WithLookupTable from "./utils/signAndSendTransactionV0WithLookupTable";

const Context = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const Content = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [lookupTxId, setLookupTxId] = useState("");
  const [extensionTxId, setExtensionTxId] = useState("");
  const [transferTxId, setTransferTxId] = useState("");

  const handleClick = useCallback(async () => {
    //reset previous attempts
    setLookupTxId("");
    setExtensionTxId("");
    setTransferTxId("");

    try {
      console.log("getting latest blockhash...");

      let blockhash = await connection
        .getLatestBlockhash()
        .then((res) => res.blockhash);
      console.log("blockhash: ", blockhash);

      console.log("creating lookup table...");

      const [lookupSignature, lookupTableAddress] =
        await createAddressLookupTable(
          publicKey,
          connection,
          blockhash,
          sendTransaction
        );
      console.log(lookupSignature, lookupTableAddress);
      setLookupTxId(lookupSignature);

      console.log("extending lookup table...");

      const extensionSignature = await extendAddressLookupTable(
        publicKey,
        connection,
        blockhash,
        lookupTableAddress,
        sendTransaction
      );
      console.log("extensionSignature: ", extensionSignature);
      setExtensionTxId(extensionSignature);

      console.log("sending transaction with lookup table...");

      const signature = await signAndSendTransactionV0WithLookupTable(
        publicKey,
        connection,
        blockhash,
        lookupTableAddress,
        sendTransaction
      );
      console.log("signature: ", signature);
      setTransferTxId(signature);
    } catch (error) {
      console.warn(error);
    }
  }, [connection, publicKey, sendTransaction]);

  return (
    <div className="App">
      <WalletMultiButton />
      <p>Please set your wallet to devnet!</p>
      {publicKey && (
        <div>
          <button onClick={handleClick}>
            Send v0 Transaction with Lookup Table
          </button>
          <p>
            Lookup Tx ID:{" "}
            <a
              href={`https://explorer.solana.com/tx/${lookupTxId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {lookupTxId}
            </a>
          </p>
          <p>
            Extension Tx ID:{" "}
            <a
              href={`https://explorer.solana.com/tx/${extensionTxId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {extensionTxId}
            </a>
          </p>
          <p>
            Transfer Tx ID:{" "}
            <a
              href={`https://explorer.solana.com/tx/${transferTxId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {transferTxId}
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Context>
      <Content />
    </Context>
  );
};
export default App;
