const { expect } = require("chai");

describe("PolymorphicFacesChild", () => {
  let polymorphicFacesChildInst;

  //Polymorph constructor arguments
  let baseUri = "";
  let defaultGenomeChangePrice = ethers.utils.parseEther("0.01");
  let royaltyFee = 0;
  let polymorphPrice = ethers.utils.parseEther("0.0777");
  let totalSupply = 10000;
  let randomizeGenomePrice = ethers.utils.parseEther("0.01");
  let bulkBuyLimit = 20;
  let arweaveAssetsJSON = "JSON";

  let baseGenomeChangePriceV2 = ethers.utils.parseEther("0.01");
  let randomizeGenomePriceV2 = ethers.utils.parseEther("0.01");

  before(async () => {
    const [user, dao, alice, bob] = await ethers.getSigners();
    //Polymorph constructor arguments
    constructorArgsPolymorphsV1 = {
      name: "PolymorphWithGeneChanger",
      symbol: "MORPH",
      baseURI: baseUri,
      _daoAddress: dao.address,
      _polymorphPrice: polymorphPrice,
      _maxSupply: totalSupply,
      _bulkBuyLimit: bulkBuyLimit,
      _baseGenomeChangePrice: baseGenomeChangePriceV2,
      _randomizeGenomePrice: randomizeGenomePriceV2,
      _arweaveAssetsJSON: arweaveAssetsJSON,
    };

    let v1PolymorphsInitialBuy = 10;

    const PolymorphsV1 = await ethers.getContractFactory(
      "PolymorphWithGeneChanger"
    );

    v1Instance = await PolymorphsV1.connect(user).deploy(
      constructorArgsPolymorphsV1.name,
      constructorArgsPolymorphsV1.symbol,
      constructorArgsPolymorphsV1.baseURI,
      constructorArgsPolymorphsV1._daoAddress,
      constructorArgsPolymorphsV1._polymorphPrice,
      constructorArgsPolymorphsV1._maxSupply,
      constructorArgsPolymorphsV1._bulkBuyLimit,
      constructorArgsPolymorphsV1._baseGenomeChangePrice,
      constructorArgsPolymorphsV1._randomizeGenomePrice,
      constructorArgsPolymorphsV1._arweaveAssetsJSON,
      { gasLimit: 15000000 }
    );

    await v1Instance
      .connect(user)
      .bulkBuy(v1PolymorphsInitialBuy, { value: polymorphPrice.mul(10) });

    constructorArgsPolymorphs = {
      name: "PolymorphRoot",
      symbol: "iMORPH",
      baseURI: baseUri,
      _daoAddress: dao.address,
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
    v2Instance = await PolymorphsV2.deploy(constructorArgsPolymorphs, {
      gasLimit: 15000000,
    });

    await v1Instance.connect(user).setApprovalForAll(v2Instance.address, true);

    await v2Instance
      .connect(user)
      .burnAndMintNewPolymorph([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], {
        gasLimit: 15000000,
      });

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    wethInstance = await TestERC20.deploy(); // we want DAO address != who deployed WETH on Polygon
    console.log(`Test WETH contract deployed to: ${wethInstance.address}`);

    constructorArgsFaces = {
      name: "PolymorphicFacesChild",
      symbol: "Faces",
      baseURI: baseUri,
      _daoAddress: dao.address,
      _royaltyFee: royaltyFee,
      _baseGenomeChangePrice: defaultGenomeChangePrice,
      _maxSupply: totalSupply,
      _randomizeGenomePrice: randomizeGenomePrice,
      _arweaveAssetsJSON: arweaveAssetsJSON,
      _polymorphV2Address: v2Instance.address,
    };

    const PolymorphicFacesChild = await ethers.getContractFactory(
      "PolymorphicFacesChild"
    );
    polymorphicFacesChildInst = await PolymorphicFacesChild.deploy(
      constructorArgsFaces.name,
      constructorArgsFaces.symbol,
      constructorArgsFaces.baseURI,
      constructorArgsFaces._daoAddress,
      wethInstance.address,
      constructorArgsFaces._baseGenomeChangePrice,
      constructorArgsFaces._randomizeGenomePrice,
      constructorArgsFaces._arweaveAssetsJSON
    );
  });

  it("wormholeUpdateGene should revert if not called from tunnel", async () => {
    await expect(
      polymorphicFacesChildInst.wormholeUpdateGene(1, 12312312312, true, 2)
    ).to.be.revertedWith("Not called from the tunnel");
  });

  it("mintFaceWithInfo should revert if not called from tunnel", async () => {
    await expect(
      polymorphicFacesChildInst.mintFaceWithInfo(
        1,
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        41241412
      )
    ).to.be.revertedWith("Not called from the tunnel");
  });

  it("minting should be disabled", async () => {
    await expect(
      polymorphicFacesChildInst.mint("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    ).revertedWith("Minting is disabled on side chains");
  });

  it("should accept ERC20 as payment method", async () => {});
});
