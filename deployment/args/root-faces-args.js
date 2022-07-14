const hre = require("hardhat");
const ethers = hre.ethers;

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

module.exports = [
  {
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
  },
];
