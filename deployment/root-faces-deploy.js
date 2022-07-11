// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const ethers = hre.ethers;
//TODO: set to DAO address

async function printDeployerInfo() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
}

async function PolymorphicFacesDeploy() {
  await printDeployerInfo();

  const tokenName = "Polymorphic Faces";
  const symbol = "Faces";
  const metadataURI ="https://us-central1-polymorphmetadata.cloudfunctions.net/faces-metadata-rinkeby?id=";
  const DAOAddress = "0x7e94e8D8c85960DBDC67E080C3D48D4e0BD423a6"; 
  const royaltyFee = 10;
  const geneChangePrice = ethers.utils.parseEther("0.001");
  const polymorphsLimit = 10000;
  const randomizePrice = ethers.utils.parseEther("0.05");
  const arweaveContainer =  "https://arweave.net/5KDDRA5EE9p-Bw29ryB9Uz6SvMRNMCyXKkOzW_ZT9gA";
  const polymorphV2Address = "0xD62b95EB151dC1C5C34B4Ac877239E00EB50793a";

  const constructorArgs = {
    name: tokenName,
    symbol: symbol,
    baseURI: metadataURI,
    _daoAddress: DAOAddress,
    _royaltyFee: royaltyFee,
    _baseGenomeChangePrice: geneChangePrice,
    _maxSupply: polymorphsLimit,
    _randomizeGenomePrice: randomizePrice,
    _arweaveAssetsJSON: arweaveContainer,
    _polymorphV2Address: polymorphV2Address,
  };

  const PolymorphicFaces = await hre.ethers.getContractFactory("PolymorphicFacesRoot");
  const faces = await PolymorphicFaces.deploy(constructorArgs);

  await faces.deployed();

  await hre.tenderly.persistArtifacts({
    name: "PolymorphicFacesRoot",
    address: faces.address,
  });

  console.log(`PolymorphicFaces address: ${faces.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
PolymorphicFacesDeploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
