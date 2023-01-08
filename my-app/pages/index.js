import {Contract,providers} from "ethers";
import {formatEther} from "ethers/lib/utils";
import Web3Modal from "web3modal";
import {useState,useEffect, useRef} from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { CRYPTODEVS_DAO_CONTRACT_ADDRESS,CRYPTODEVS_DAO_ABI,CRYPTODEVS_NFT_CONTRACT_ADDRESS,CRYPTODEVS_NFT_ABI, } from "../constants";

export default function Home(){

  const [walletConnected,setWalletConnected] = useState(false);
  const [treasuryBalance,setTreasuryBalance] = useState("0");
  const [numProposals, setNumProposals] = useState("0");
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  const [nftBalance,setNftBalance] = useState(0);
  const [proposals, setProposals] = useState([]);
  const [selectedTab,setSelectedTab] =useState("");
  const [isOwner,setIsOwner] = useState(false);
  const [loading,setLoading] = useState(false);
  const web3ModalRef = useRef();



const getProviderOrSigner = async(signer = false)=>{
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const {chainId} = await web3Provider.getNetwork();
    if(chainId!==5){
      window.alert("Please connect to Goerli Testnet");
      throw new Error("Please switch to the Goerli network");
    }
    if(signer){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

const getNumProposalsInDAO = async()=>{
try {
  const provider = await getProviderOrSigner();
  const contract = getDaoContractInstance(provider);
  const daoNumProposals = await contract.numProposals();
  setNumProposals(daoNumProposals.toString());
} catch (err) {
  console.error(err)
}
};

const getUserNFTBalance = async()=>{
try {
  const signer = await getProviderOrSigner(true);
  const nftContract = getNftInstance(signer);
  const balance = await nftContract.balanceOf(signer.getAddress());
  setNftBalance(parseInt(balance.toString()));
} catch (error) {
  console.error(error)
}
}

const getDAOOwner = async() =>{
  try {
    const signer = await getProviderOrSigner(true);
    const daoContract = getDaoContractInstance(signer);
    const _owner = await daoContract.owner();
    const address = await signer.getAddress();
    if(address.toLowerCase() === _owner.toLowerCase());
    setIsOwner(true);
  } catch (err) {
    console.error(err.message);
  }
};

const withdrawDAOEther = async()=>{
  try {
    const signer = await getProviderOrSigner(true);
    const daoContract = getDaoContractInstance(signer);
    const tx = await daoContract.withdraw();
    setLoading(true);
    await tx.wait();
    setLoading(false);
    getDAOTreasuryBalance();  
  } catch (err) {
    console.error(err);
    window.alert(err.reason);
  }
};

const fetchProposalById = async(id)=>{
try {
  const provider = await getProviderOrSigner();
  const daoContract = getDaoContractInstance(provider);
  const proposal=await daoContract.proposals(id);
  const parsedProposal ={
    proposalId:id,
    nftTokenId:proposal.nftTokenId.toString(),
    deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
    yesVotes: proposal.yes.toString(),
    noVotes : proposal.no.toString(),
    executed: proposal.executed,
  };
  return parsedProposal;
} catch (err) {
  console.error(err);
}
};
const fetchAllProposals = async()=>{
  try {
    const Proposals =[];
    for(let i=0;i<numProposals;i++){
      const proposal= await fetchProposalById(i);
      Proposals.push(proposal);
    }
    setProposals(Proposals);
    return Proposals;
  } catch (err) {
    console.error(err);
  }
};
const createProposal = async()=>{
try {
  const signer = await getProviderOrSigner(true);
  const daoContract = getDaoContractInstance(signer);
  const tx = await daoContract.createProposal(fakeNftTokenId);
  setLoading(true);
  await tx.wait();
  await getNumProposalsInDAO();
  setLoading(false);
} catch (err) {
  console.error(err);
  window.alert(err.data.message);
}
};


const voteOnProposal = async(proposalId,_vote)=>{
try {
  const signer = await getProviderOrSigner(true);
  const daoContract =getDaoContractInstance(signer);
  let vote = _vote === "YES"?0:1;
const tx = await daoContract.voteOnProposal(proposalId,vote);
setLoading(true);
await tx.wait();
setLoading(false);
await fetchAllProposals();
} catch (err) {
  console.error(err);
  window.alert(err.data.message);
}
};

const executeProposal  = async(proposalId)=>{
  try {
    const signer = await getProviderOrSigner(true);
const daoContract = getDaoContractInstance(signer);
const tx = await daoContract.executeProposal(proposalId);
setLoading(true);
await tx.wait();
setLoading(false);
await fetchAllProposals();
getDAOTreasuryBalance();
  } catch (err) {
    console.error(err)
  }
};

const getDAOTreasuryBalance = async()=>{ try {
    const provider = await getProviderOrSigner();
const balance = await provider.getBalance(CRYPTODEVS_DAO_CONTRACT_ADDRESS);
setTreasuryBalance(balance.toString());
  } catch (error) {
    console.error(error);
    window.alert(err.reason);
  }
};

const getDaoContractInstance=(providerOrSigner)=>{
  return new Contract(
  CRYPTODEVS_DAO_CONTRACT_ADDRESS,CRYPTODEVS_DAO_ABI,providerOrSigner);
};

const getNftInstance = (providerorSigner)=>{
  return new Contract(
    CRYPTODEVS_NFT_CONTRACT_ADDRESS,CRYPTODEVS_NFT_ABI,providerorSigner
  );
};

  const connectWallet = async()=>{
    try{
await getProviderOrSigner();
setWalletConnected(true);
    }
    catch(err){
      console.error(err);
    }
  };

  useEffect(() => {
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network:"goerli",
        providerOptions:{},
        disableInjectedProvider:false,
      });
      connectWallet().then(()=>{
        getDAOTreasuryBalance();
        getUserNFTBalance();
        getNumProposalsInDAO();
        getDAOOwner();
      });
    }
  }, [walletConnected]);

  useEffect(() => {
    if(selectedTab =="View Proposals"){
      fetchAllProposals();
    }
  }, [selectedTab]);
  function renderTabs(){
    if(selectedTab==="Create Proposal"){
      return renderCreateProposalTab();
    }
    else if(selectedTab==="View Proposals"){
      return renderViewProposalTab();
    }
  };
  function renderCreateProposalTab(){
    if(loading){
      return(
        <div className={styles.description}>
          Loading... Waiting for Transaction....
        </div>
      );}
      else if(nftBalance===0){
        return(
          <div className={styles.description}>
            You do not own any CryptoDevs NFTs. <br />
            <b>You cannot create or vote on proposals</b>
          </div>
        );
      }
      else{
        return(
          <div className={styles.container}>
            <label >
              Fake NFT Token ID to Purchase: 
            </label>
            <input type="number" placeholder="0" onChange={(e)=> setFakeNftTokenId(e.target.value)}/>
            <button className={styles.button2} onClick={createProposal}> Create</button>
          </div>
        );
      }
    }
  function renderViewProposalTab(){
    console.log(proposals);
    if(loading){
      return(
        <div className={styles.description}>
          Loading... Waiting for Transaction....
        </div>
      );
    }
    else if(proposals.length ===0){
      return(
        <div className={styles.description}>
          No Proposals have been created!
        </div>
      );
    }
    else{
      return(
        <div>
          {
            proposals.map((p,index)=>(
              <div className={styles.proposalCard} key ={index}><p>
                Proposal ID: {p.proposalId}</p>
                <p>Fake NFT to purchase: {p.nftTokenId}</p>
                <p>Deadline: {console.log(p.deadline)}
                  {p.deadline.toLocaleString()}</p>
                <p>
                  Yes Votes: {p.yes}
                </p>
                <p>
                  No Votes: {p.no}
                </p>
                <p>
                  Executed? : {p.executed.toString()}
                </p>
                {p.deadline.getTime() >Date.now() && !p.executed ?(
                  <div className={styles.flex}>
                      <button className={styles.button2} onClick={()=>voteOnProposal(p.proposalId,"YES")}> Vote YES</button>
                      <button className={styles.button2} onClick={()=>voteOnProposal(p.proposalId,"NO")}> Vote NO</button>
                  </div>
                ):p.deadline.getTime()<Date.now() && !p.executed ? (
                  <div className={styles.flex}>
                    <button className={styles.button2} onClick={()=>executeProposal(p.proposalId)}>
                      Execute Proposal{" "}{p.yes > p.no ? "(YES)":"(NO)"}</button></div>
                ):(
                  <div className={styles.description}> Proposal Executed</div>
                )}
                </div>
            ))
          }
        </div>
      );
    }
  }
  
  return(
    <div>
      <Head>
        <title>CryptoDevs DAO</title>
        <meta name = "description" content = "CryptoDevs DAO"/>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className ={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to My Crypto!!
          </h1>
          <div className={styles.description}>Welcome to the DAO!!
          </div>
          <div className={styles.description}>Your NFT Balance is : {nftBalance}
          <br />Treasury Balance is : {formatEther(treasuryBalance)} ETH 
          <br />
          Total No. of proposals: {numProposals}
          </div>
          <div className={styles.flex}>
            <button className={styles.button} onClick={()=>setSelectedTab("Create Proposal")}> Create Proposal
            </button>
            <button className={styles.button} onClick={()=>setSelectedTab("View Proposals")}>
              View Proposals
            </button>
          </div>
          {renderTabs()}
          {isOwner ? (
            <div>
              {
                loading ? 
              <button className = {styles.button}>
                Loading....
              </button>:<button className={styles.button} onClick={withdrawDAOEther}>Withdraw Ether Balance </button>}
            </div>
          ):("")}
        </div>
        <div>
        <img className={styles.image} src="/cryptodevs/0.svg"/>
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084;
      </footer>
    </div>
  );
}