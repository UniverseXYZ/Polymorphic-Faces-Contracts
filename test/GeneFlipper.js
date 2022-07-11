const { expect } = require("chai");


describe('Gene Flipper', () => {
    let DAO;
    let aliceAccount;
    let bobsAccount;
    let deployer;
    let polymorphInstance;
    let flipFactory;
    
    let tokenName = "PolymorphicFaces"
    let token = "Faces";
    let baseUri = "http://www.kekdao.com/";
    let royaltyFee = 0;
    let totalSupply = 10000;
    let bulkBuyLimit = 20;
    let polymorphPrice = ethers.utils.parseEther("0.0777");
    let defaultGenomeChangePrice = ethers.utils.parseEther("0.01");
    let randomizeGenomePrice = ethers.utils.parseEther("0.02");
    let baseGenomeChangePriceV2 = ethers.utils.parseEther("0.01");
    let randomizeGenomePriceV2 = ethers.utils.parseEther("0.01");
    let arweaveAssetsJSON = 'JSON'
    let polymorphV1Address = "0x75D38741878da8520d1Ae6db298A9BD994A5D241";
    let facesInst;

    let v1PolymorphsInitialBuy = 5;


    before(async () => {
      const [user, dao, alice, bob] = await ethers.getSigners();

      DAO = dao;
      aliceAccount = alice;
      bobsAccount = bob;
      deployer = user;

      constructorArgsPolymorphsV1 = {
        name: "PolymorphWithGeneChanger",
        symbol: "MORPH",
        baseURI: baseUri,
        _daoAddress: DAO.address,
        _polymorphPrice:polymorphPrice,
        _maxSupply:totalSupply,
        _bulkBuyLimit:bulkBuyLimit,
        _baseGenomeChangePrice: baseGenomeChangePriceV2,
        _randomizeGenomePrice: randomizeGenomePriceV2,
        _arweaveAssetsJSON: arweaveAssetsJSON,
      };
  
      const PolymorphsV1 = await ethers.getContractFactory("PolymorphWithGeneChanger");
      v1Instance = await PolymorphsV1.connect(user).deploy(constructorArgsPolymorphsV1.name,constructorArgsPolymorphsV1.symbol,constructorArgsPolymorphsV1.baseURI,constructorArgsPolymorphsV1._daoAddress,constructorArgsPolymorphsV1._polymorphPrice,constructorArgsPolymorphsV1._maxSupply,constructorArgsPolymorphsV1._bulkBuyLimit,constructorArgsPolymorphsV1._baseGenomeChangePrice,constructorArgsPolymorphsV1._randomizeGenomePrice,constructorArgsPolymorphsV1._arweaveAssetsJSON, {gasLimit:15000000});
  
      await v1Instance.connect(user).bulkBuy(v1PolymorphsInitialBuy, {value: polymorphPrice.mul(5)});

      constructorArgsPolymorphs = {
        name: "PolymorphRoot",
        symbol: "iMORPH",
        baseURI: baseUri,
        _daoAddress: DAO.address,
        _royaltyFee: royaltyFee,
        _baseGenomeChangePrice: baseGenomeChangePriceV2,
        _polymorphPrice: polymorphPrice,
        _maxSupply: totalSupply,
        _randomizeGenomePrice: randomizeGenomePriceV2,
        _bulkBuyLimit: bulkBuyLimit,
        _arweaveAssetsJSON: arweaveAssetsJSON,
        _polymorphV1Address: v1Instance.address,
      };
  
      const PolymorphsV2 = await ethers.getContractFactory("PolymorphRoot");
      v2Instance = await PolymorphsV2.deploy(constructorArgsPolymorphs, {gasLimit:15000000});
  
      console.log(`PolymorphRoot instance deployed to: ${v2Instance.address}`);
  
      await v1Instance.connect(user).setApprovalForAll(v2Instance.address, true);
  
      await v2Instance.connect(user).burnAndMintNewPolymorph([1,2,3,4,5], {gasLimit:15000000 });

      constructorArgsFaces = {
        name: tokenName,
        symbol: token,
        baseURI: baseUri,
        _daoAddress: DAO.address,
        _royaltyFee: royaltyFee,
        _baseGenomeChangePrice: defaultGenomeChangePrice,
        _maxSupply: totalSupply,
        _randomizeGenomePrice: randomizeGenomePrice,
        _arweaveAssetsJSON: arweaveAssetsJSON,
        _polymorphV2Address: v2Instance.address,
      };

      const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
      facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});
  
      const FlipFactory = await ethers.getContractFactory("FlipFactory");
      flipFactory = await FlipFactory.deploy();
      console.log(`Flip factory deployed to: ${flipFactory.address}`);

    });

    it('Should not be able to flip genes', async() => {

      await facesInst.claim(1, {gasLimit: 15000000});

      const tokenId = await facesInst.lastTokenId();

      await facesInst.approve(flipFactory.address, tokenId);
      console.log(`tokenId: ${tokenId}`);
      console.log(`deployer address: ${deployer.address}`);

      await facesInst.transferFrom(deployer.address, flipFactory.address, tokenId);

      const Flip = await ethers.getContractFactory("Flip");
      const genePosition = 70; // Position of the attribute gene in the gene string
      const geneVariation = 24; // This is the number of traits of the attribute that will be flipped
      const geneWanted = 2; // This is the number of the trait that we want
      
      await expect(Flip.deploy(tokenId, genePosition, geneVariation, geneWanted, deployer.address)).to.be.revertedWith("Msg sender should be original caller");
      
      // const flipperByteCode = "";
// 0x60806040526040516101fa3803806101fa833981810160405260a081101561002657600080fd5b508051602082015160408084015160608501516080909501518251632b52e49360e11b81526004810186905260248101859052925194959394919392909173273c507d8e21cde039491b14647fe9278d88e91d916356a5c92691479160448082019260009290919082900301818588803b1580156100a357600080fd5b505af11580156100b7573d6000803e3d6000fd5b50505050508183606486600202600a0a73273c507d8e21cde039491b14647fe9278d88e91d6001600160a01b0316636a5be6868a6040518263ffffffff1660e01b81526004018082815260200191505060206040518083038186803b15801561011f57600080fd5b505afa158015610133573d6000803e3d6000fd5b505050506040513d602081101561014957600080fd5b50518161015257fe5b048161015a57fe5b048161016257fe5b061461016d57600080fd5b60408051632142170760e11b81523060048201526001600160a01b038316602482015260448101879052905173273c507d8e21cde039491b14647fe9278d88e91d916342842e0e91606480830192600092919082900301818387803b1580156101d557600080fd5b505af11580156101e9573d6000803e3d6000fd5b50505050806001600160a01b0316fffe
      // await flipFactory.flip(tokenId, 50, flipperByteCode);
      // await expect(flipFactory.flip(tokenId, 50, flipperByteCode)).revertedWith("Msg sender should be original caller");
    });
});