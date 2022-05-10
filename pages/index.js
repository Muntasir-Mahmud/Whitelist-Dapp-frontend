import { Contract, providers } from "ethers";
import Head from 'next/head';
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, WHITELIST_CONTRACT_ADDRESS } from "../constants";
import styles from '../styles/Home.module.css';


export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // joinedWhitelist keeps track of whether the current metamask address has joined the Whitelist or not
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // numberOfWhitelisted tracks the number of addresses's whitelisted
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();


  const getProviderOrSigner = async (needSigner = false) =>{
    try{
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider); 
    
      const { chainId } = await web3Provider.getNetwork();
      if(chainId != 4) {
        window.alert("Change the network to rinkeby!");
        throw new Error("Change network to rinkeby!")
      }
      // we need signer when we write to smart contract
      // when we need signer we can write: getProviderOrSigner(needSigner=true)
      if (needSigner){
        const signer = web3Provider.getSigner();
        return signer; 
      }
      return web3Provider;
    } catch (err){
      console.log(err)
    }

  }

  const addAddressToWhitelist = async() =>{
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS, abi, signer
      );
      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (err) {
      console.log(err)
    }
  }
  

  const getNumberOfWhitelisted = async() =>{
    try {
      const provider = await getProviderOrSigner();
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS, abi, provider
      );
      const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (err) {
      console.log(err)
    }
  };


  const checkIfAddressInWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      // call the whitelistedAddresses from the contract
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address
      );
      setJoinedWhitelist(_joinedWhitelist);
    } catch (err) {
      console.error(err);
    }
  };



  /*
    connectWallet: Connects the MetaMask wallet
  */
  const connectWallet = async () => {
    try{
      await getProviderOrSigner();
      setWalletConnected(true);
      checkIfAddressInWhitelist();
      getNumberOfWhitelisted()
    } catch (error) {
      console.error(error)
    }
  }

  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist){
        return (
          <div className={styles.description}>
            Thanks for joining the Whitelist!
          </div>
        );
      } else if (loading) {
        return (
          <button className={styles.button}>Loading...</button>
        );
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join the Whitelist
          </button>
        )
      }
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
  }
  
  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected])
  
  
  return (
    <div>
        <Head>
          <title></title>
          <meta name="description" content="Whitelist-Dapp"/>
        </Head>
        <div className={styles.main}>
          <h1 className={styles.title}>Welcome to my whitelist Dapp!</h1>
          <div className={styles.description}>
           {numberOfWhitelisted} have already joined to the whitelist 
          </div>
          {renderButton()}
          <div>
            <img className={styles.image} src="./crypto-devs.svg"></img>
          </div>
        </div>
        <footer className={styles.footer}>
          Take respect from the developer!
        </footer>
    </div>  
  )
}
