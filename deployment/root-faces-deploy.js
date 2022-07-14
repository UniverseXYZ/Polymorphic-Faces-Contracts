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
  const symbol = "FACES";
  const metadataURI ="https://us-central1-polymorphmetadata.cloudfunctions.net/faces-metadata?id=";
  const DAOAddress = "0xa8047c2a86d5a188b0e15c3c10e2bc144cb272c2"; 
  const royaltyFee = 500;
  const geneChangePrice = ethers.utils.parseEther("0.001");
  const polymorphsLimit = 10000;
  const randomizePrice = ethers.utils.parseEther("0.005");
  const arweaveContainer =  "";
  const polymorphV2Address = "0xb5433e67C067Cad4cb36529f3f2D61ec0fb59F89";

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

  // await hre.tenderly.persistArtifacts({
  //   name: "PolymorphicFacesRoot",
  //   address: faces.address,
  // });

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
