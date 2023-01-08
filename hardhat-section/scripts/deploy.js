const {ethers} = require("hardhat");

const {CRYPTODEVS_NFT_CONTRACT_ADDRESS} = require("../constants");

async function main(){
  const FakeNftMarketPlace = await ethers.getContractFactory("FakeNFTMarketPlace");
  const fakeNFTMarketPlace = await FakeNftMarketPlace.deploy();
  await fakeNFTMarketPlace.deployed();
  console.log("FakeNFTMarket Placed Deployed to:", fakeNFTMarketPlace.address);

  const CryptoDevdao = await ethers.getContractFactory("CryptoDevsDAO");
  const CryptoDevDAO = await CryptoDevdao.deploy(fakeNFTMarketPlace.address,CRYPTODEVS_NFT_CONTRACT_ADDRESS,{
    value: ethers.utils.parseEther("0.001"),
  });
  await CryptoDevDAO.deployed();
  console.log("CryptoDevDAO deployed to : ",CryptoDevDAO.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });