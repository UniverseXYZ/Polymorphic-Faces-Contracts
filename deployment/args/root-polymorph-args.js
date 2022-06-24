const hre = require("hardhat");
const ethers = hre.ethers;

const tokenName = "Polymorphic Faces";
const symbol = "FACES";
const metadataURI ="https://us-central1-Burgermetadata.cloudfunctions.net/images-function?id=";
const DAOAddress = "0xcb5c05B9916B49adf97cC31a0c7089F3B4Cfa8b1";
const royaltyFee = 500;
const premint = 0;
const geneChangePrice = ethers.utils.parseEther('0.001');
const polymorphsLimit = 10000;
const randomizePrice = ethers.utils.parseEther("0.05");
const bulkBuyLimit = 20;
const arweaveContainer = "https://arweave.net/5KDDRA5EE9p-Bw29ryB9Uz6SvMRNMCyXKkOzW_ZT9gA";
const polymorphV2Address = "0xD62b95EB151dC1C5C34B4Ac877239E00EB50793a";

module.exports = [
  {
    name: tokenName,
    symbol: symbol,
    baseURI: metadataURI,
    _daoAddress: DAOAddress,
    _royaltyFee: royaltyFee,
    premintedTokensCount: premint,
    _baseGenomeChangePrice: geneChangePrice,
    _maxSupply: polymorphsLimit,
    _randomizeGenomePrice: randomizePrice,
    _bulkBuyLimit: bulkBuyLimit,
    _arweaveAssetsJSON: arweaveContainer,
    _polymorphV2Address: polymorphV2Address,
  },
];
