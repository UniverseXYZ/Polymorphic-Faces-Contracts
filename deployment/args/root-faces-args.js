const hre = require("hardhat");
const ethers = hre.ethers;

const tokenName = "Polymorphic Faces";
const symbol = "Faces";
const metadataURI ="https://us-central1-polymorphmetadata.cloudfunctions.net/faces-metadata-rinkeby?id=";
const DAOAddress = "0x7e94e8D8c85960DBDC67E080C3D48D4e0BD423a6";
const royaltyFee = 10;
const geneChangePrice = ethers.utils.parseEther('0.001');
const polymorphsLimit = 10000;
const randomizePrice = ethers.utils.parseEther("0.05");
const arweaveContainer = "https://arweave.net/5KDDRA5EE9p-Bw29ryB9Uz6SvMRNMCyXKkOzW_ZT9gA";
const polymorphV2Address = "0xD62b95EB151dC1C5C34B4Ac877239E00EB50793a";

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
