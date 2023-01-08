// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0 ;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevsNFT.sol";
import "./IFakeNFT.sol";
contract CryptoDevsDAO is Ownable{
    struct Proposal {
        uint256 nftTokenId;
        uint256 deadline;
        uint256 yes;
        uint256 no;
        bool executed;
        mapping (uint256=>bool) voters;
    }
        mapping (uint256 => Proposal) public proposals;
        uint256 public numProposals;
        IFakeNftMarketPlace nftMarketplace;
        ICryptoDevsNFT cryptoDevsNFT;

        constructor(address _nftMarketPlace,address _cryptoDevsNFT) payable {
            nftMarketplace = IFakeNftMarketPlace(_nftMarketPlace);
            cryptoDevsNFT = ICryptoDevsNFT(_cryptoDevsNFT);
        }

        modifier nftHolder {
            require(cryptoDevsNFT.balanceOf(msg.sender)>0,"Not a member");
            _;
        }
        function createProposal(uint256 _nftTokenId) external nftHolder returns (uint256){
            require(nftMarketplace.available(_nftTokenId),"NFT not for sale");
            Proposal storage proposal = proposals[numProposals];
            proposal.nftTokenId = _nftTokenId;
            proposal.deadline = block.timestamp + 5 minutes;
            numProposals++;
        return numProposals -1;
        }
        modifier activeProposalsOnly(uint256 proposalIndex){
            require(proposals[proposalIndex].deadline > block.timestamp,"Deadline Extended");
            _;
        }
        
        enum Vote {
            YES,
            NO
        }
function voteOnProposal(uint256 proposalIndex,Vote vote) external nftHolder activeProposalsOnly(proposalIndex)  {
    Proposal storage proposal = proposals[proposalIndex];
    uint256 voterNftBalance = cryptoDevsNFT.balanceOf(msg.sender);
    uint256 numVotes=0;

    for(uint256 i =0;i<voterNftBalance;i++){
        uint256 tokenId = cryptoDevsNFT.tokenOfOwnerByIndex(msg.sender,i);
        if(proposal.voters[tokenId] ==false){
            numVotes++;
            proposal.voters[tokenId] =true;
        } 
    }
    require(numVotes>0,"Already voted!");
    if(vote == Vote.YES){
        proposal.yes+=numVotes;
    }
    else{
        proposal.no += numVotes;
    }
}

modifier inactiveProposalOnly(uint256 proposalIndex) {
    require(proposals[proposalIndex].deadline <= block.timestamp,"Deadline not exceeded");
    require(proposals[proposalIndex].executed==false,"proposal already executed! ");
    _;
}

function executeProposal(uint256 proposalIndex) external nftHolder inactiveProposalOnly(proposalIndex){
Proposal storage proposal = proposals[proposalIndex];
if(proposal.yes>proposal.no){
    uint256 nftPrice = nftMarketplace.getPrice();
    require(address(this).balance >= nftPrice, "Not enough funds");
    nftMarketplace.purchase{value:nftPrice}(proposal.nftTokenId);
}
proposal.executed = true;
}
function withdraw() external onlyOwner{
    uint256 amount = address(this).balance;
    require(amount>0,"Contract Balance is zero");
    payable(owner()).transfer(amount);
}  

receive() external payable{}
fallback() external payable{}

}