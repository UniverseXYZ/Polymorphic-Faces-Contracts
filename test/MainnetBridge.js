const { expect } = require("chai");

describe("PolymorphicFaces Mainnet Integration", () => {
  let tunnelInstance, exposedTunnelInstance, facesInst, v1Instance, v2Instance;
  //Tunnel contrustor arguments
  const goerliCheckpointManager = "0x2890bA17EfE978480615e330ecB65333b880928e";
  const goerliFxRoot = "0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA";

  //Polymorph constructor arguments
  let baseUri = "";
  let defaultGenomeChangePrice = ethers.utils.parseEther("0.01");
  let royaltyFee = 0;
  let polymorphPrice = ethers.utils.parseEther("0.0777");
  let totalSupply = 10000;
  let randomizeGenomePrice = ethers.utils.parseEther("0.01");
  let bulkBuyLimit = 20;
  let arweaveAssetsJSON = "JSON";

  let tokenId = 0;

  let v1PolymorphsInitialBuy = 20;

  let baseGenomeChangePriceV2 = ethers.utils.parseEther("0.01");
  let randomizeGenomePriceV2 = ethers.utils.parseEther("0.01");

  before(async () => {
    const [user, dao] = await ethers.getSigners();

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
      .bulkBuy(v1PolymorphsInitialBuy, { value: polymorphPrice.mul(20) });

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

    console.log(`PolymorphRoot instance deployed to: ${v2Instance.address}`);

    await v1Instance.connect(user).setApprovalForAll(v2Instance.address, true);

    const PolymorphicFacesRootTunnel = await ethers.getContractFactory(
      "PolymorphicFacesRootTunnel"
    );
    tunnelInstance = await PolymorphicFacesRootTunnel.deploy(
      goerliCheckpointManager,
      goerliFxRoot,
      dao.address
    );
    console.log(`tunnel contract deployed to: ${tunnelInstance.address}`);

    const ExposedPolymorphicFacesRootTunnel = await ethers.getContractFactory(
      "ExposedPolymorphicFacesRootTunnel"
    );
    exposedTunnelInstance = await ExposedPolymorphicFacesRootTunnel.deploy(
      goerliCheckpointManager,
      goerliFxRoot,
      dao.address
    );
    console.log(
      `exposed tunnel contract deployed to: ${exposedTunnelInstance.address}`
    );

    constructorArgsFaces = {
      name: "PolymorphicFaces",
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

    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await tunnelInstance.connect(dao).setFacesContract(facesInst.address);
    await exposedTunnelInstance
      .connect(dao)
      .setFacesContract(facesInst.address);

    await v2Instance
      .connect(user)
      .burnAndMintNewPolymorph(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        { gasLimit: 15000000 }
      );

    facesInst
      .connect(dao)
      .whitelistBridgeAddress(exposedTunnelInstance.address, true);

    await facesInst.claim(20, { gasLimit: 15000000 });
  });

  it("moveThroughWormhole should revert if face(s) have not been approved for transfer", async () => {
    await expect(
      exposedTunnelInstance.moveThroughWormhole([
        tokenId,
        tokenId + 1,
        tokenId + 2,
      ]),
      ""
    ).to.be.reverted;
  });

  it("moveThroughWormhole should revert when not called from face owner", async () => {
    const [_, alice] = await ethers.getSigners();

    await facesInst.setApprovalForAll(exposedTunnelInstance.address, true);

    await expect(
      exposedTunnelInstance
        .connect(alice)
        .moveThroughWormhole([tokenId + 1, tokenId + 2, tokenId + 3]),
      ""
    ).revertedWith("Owner of the face to bridge should be msg.sender");
  });

  it("moveThroughWormhole should not revert if face(s) have been approved for transfer", async () => {
    await facesInst.setApprovalForAll(exposedTunnelInstance.address, true);

    await expect(
      exposedTunnelInstance.moveThroughWormhole([
        tokenId + 1,
        tokenId + 2,
        tokenId + 3,
      ]),
      ""
    ).to.not.be.reverted;
  });

  it("Should take face(s) from owner and lock it in bridge", async () => {
    const [user] = await ethers.getSigners();
    console.log(`My address: ${user.address}`);

    //Assert owner after minting
    let faceOwner = await facesInst.ownerOf(tokenId + 4);
    expect(faceOwner).eq(user.address);

    //Approve transfering of nft
    await facesInst.setApprovalForAll(exposedTunnelInstance.address, true);

    await exposedTunnelInstance.moveThroughWormhole([
      tokenId + 4,
      tokenId + 5,
      tokenId + 6,
    ]);

    //Assert owner after moving thourgh wormhole
    faceOwner = await facesInst.ownerOf(tokenId + 4);
    expect(faceOwner).eq(exposedTunnelInstance.address);
  });

  it("Should revert after trying to operate with locked Token(s)", async () => {
    const [user] = await ethers.getSigners();
    console.log(`My address: ${user.address}`);

    // Assert owner after minting
    let faceOwner = await facesInst.ownerOf(tokenId + 7);
    expect(faceOwner).eq(user.address);

    // Approve transfering of nft
    await facesInst.setApprovalForAll(exposedTunnelInstance.address, true);

    await exposedTunnelInstance.moveThroughWormhole([
      tokenId + 7,
      tokenId + 8,
      tokenId + 9,
      tokenId + 10,
    ]);

    // Assert owner after moving through wormhole
    faceOwner = await facesInst.ownerOf(tokenId + 7);
    expect(faceOwner).eq(exposedTunnelInstance.address);

    const genePos = 5;
    const morphPrice = await facesInst.priceForGenomeChange(tokenId + 7);

    await expect(facesInst.morphGene(tokenId, genePos, { value: morphPrice }))
      .to.be.reverted;

    await expect(
      facesInst.randomizeGenome(tokenId, { value: randomizeGenomePrice })
    ).to.be.reverted;
  });

  it("Should return ownership of face(s)", async () => {
    const [user] = await ethers.getSigners();
    console.log(`My address: ${user.address}`);

    //Approve transfering of nft
    await facesInst.setApprovalForAll(exposedTunnelInstance.address, true);

    await exposedTunnelInstance.moveThroughWormhole([
      tokenId + 11,
      tokenId + 12,
      tokenId + 13,
      tokenId + 14,
    ]);

    // 11

    let faceOwner11 = await facesInst.ownerOf(tokenId + 11);
    expect(faceOwner11).eq(exposedTunnelInstance.address);

    const keccak11 = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "uint256", "bool", "uint256", "uint256"],
      [tokenId + 11, user.address, "1231231312312312312312113", false, 2, 1]
    );

    await exposedTunnelInstance.processMessageFromChild(keccak11);
    faceOwner11 = await facesInst.ownerOf(tokenId + 11);
    expect(faceOwner11).eq(user.address);

    // 12

    faceOwner12 = await facesInst.ownerOf(tokenId + 12);
    expect(faceOwner12).eq(exposedTunnelInstance.address);

    const keccak12 = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "uint256", "bool", "uint256", "uint256"],
      [tokenId + 12, user.address, "1231231312312312312312113", false, 2, 1]
    );

    await exposedTunnelInstance.processMessageFromChild(keccak12);
    faceOwner12 = await facesInst.ownerOf(tokenId + 12);
    expect(faceOwner12).eq(user.address);

    // 13

    faceOwner13 = await facesInst.ownerOf(tokenId + 13);
    expect(faceOwner13).eq(exposedTunnelInstance.address);

    const keccak13 = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "uint256", "bool", "uint256", "uint256"],
      [tokenId + 13, user.address, "1231231312312312312312113", false, 2, 1]
    );

    await exposedTunnelInstance.processMessageFromChild(keccak13);
    faceOwner13 = await facesInst.ownerOf(tokenId + 13);
    expect(faceOwner13).eq(user.address);

    // 14

    faceOwner14 = await facesInst.ownerOf(tokenId + 14);
    expect(faceOwner14).eq(exposedTunnelInstance.address);

    const keccak14 = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "uint256", "bool", "uint256", "uint256"],
      [tokenId + 14, user.address, "1231231312312312312312113", false, 2, 1]
    );

    await exposedTunnelInstance.processMessageFromChild(keccak14);
    faceOwner14 = await facesInst.ownerOf(tokenId + 14);
    expect(faceOwner14).eq(user.address);
  });

  it("Should update face(s) info correctly", async () => {
    const [user] = await ethers.getSigners();
    console.log(`My address: ${user.address}`);

    const newGene = "1231231312312312312312113";
    const newVirginity = false;
    const newChangesCount = 3;

    //Approve transfering of nft
    await facesInst.setApprovalForAll(exposedTunnelInstance.address, true);

    await exposedTunnelInstance.moveThroughWormhole([
      tokenId + 15,
      tokenId + 16,
    ]);

    const keccak15 = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "uint256", "bool", "uint256"],
      [tokenId + 15, user.address, newGene, newVirginity, newChangesCount]
    );

    const keccak16 = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "uint256", "bool", "uint256"],
      [tokenId + 16, user.address, newGene, newVirginity, newChangesCount]
    );

    await exposedTunnelInstance.processMessageFromChild(keccak15);

    expect(await facesInst.geneOf(tokenId + 15)).eq(newGene);
    expect(await facesInst.isNotVirgin(tokenId + 15)).eq(newVirginity);

    const baseGenomeChangePrice15 = await facesInst.baseGenomeChangePrice();
    expect(await facesInst.priceForGenomeChange(tokenId + 15)).eq(
      baseGenomeChangePrice15.mul(2 ** newChangesCount)
    );

    await exposedTunnelInstance.processMessageFromChild(keccak16);

    expect(await facesInst.geneOf(tokenId + 16)).eq(newGene);
    expect(await facesInst.isNotVirgin(tokenId + 16)).eq(newVirginity);

    const baseGenomeChangePrice16 = await facesInst.baseGenomeChangePrice();
    expect(await facesInst.priceForGenomeChange(tokenId + 16)).eq(
      baseGenomeChangePrice16.mul(2 ** newChangesCount)
    );
  });
});
