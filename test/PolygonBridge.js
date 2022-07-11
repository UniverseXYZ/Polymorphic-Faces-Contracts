const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolymorphicFaces Polygon Integration", () => {
  let tunnelInstance,
    exposedTunnelInstance,
    polymorphicFacesChildInst,
    wethInstance;
  //Tunnel contrustor arguments
  const goerliFxChild = "0xCf73231F28B7331BBe3124B907840A94851f9f11";

  let polymorphPrice = ethers.utils.parseEther("0.0777");
  let baseGenomeChangePriceV2 = ethers.utils.parseEther("0.01");
  let randomizeGenomePriceV2 = ethers.utils.parseEther("0.01");
  let baseUri = "";
  let bulkBuyLimit = 20;
  let arweaveAssetsJSON = "JSON";
  let totalSupply = 10000;
  let royaltyFee = 0;

  let tokenId = 0;
  let newGene = "54545454";
  let newVirginity = true;
  let newChangesCount = 5;
  let defaultGenomeChangePrice = ethers.utils.parseEther("0.01");
  let randomizeGenomePrice = ethers.utils.parseEther("0.01");
  let v1PolymorphsInitialBuy = 10;

  const approveAmount = "3000000000000000000"; // 3 ETH

  before(async () => {
    const [user, dao, alice, bob] = await ethers.getSigners();
    constructorArgsPolymorphsV1 = {
      name: "PolymorphWithGeneChanger",
      symbol: "MORPH",
      baseURI: baseUri,
      _daoAddress: user.address,
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

    constructorArgsPolymorphs = {
      name: "PolymorphRoot",
      symbol: "iMORPH",
      baseURI: baseUri,
      _daoAddress: user.address,
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

    constructorArgsFaces = {
      name: "PolymorphicFacesChild",
      symbol: "Faces",
      baseURI: baseUri,
      _daoAddress: user.address,
      _royaltyFee: royaltyFee,
      _baseGenomeChangePrice: defaultGenomeChangePrice,
      _maxSupply: totalSupply,
      _randomizeGenomePrice: randomizeGenomePrice,
      _arweaveAssetsJSON: arweaveAssetsJSON,
      _polymorphV2Address: v2Instance.address,
    };

    await v1Instance
      .connect(user)
      .bulkBuy(v1PolymorphsInitialBuy, { value: polymorphPrice.mul(10) });

    await v1Instance.connect(user).setApprovalForAll(v2Instance.address, true);

    const PolymorphicFacesChildTunnel = await ethers.getContractFactory(
      "PolymorphicFacesChildTunnel"
    );
    tunnelInstance = await PolymorphicFacesChildTunnel.deploy(
      goerliFxChild,
      user.address
    );
    console.log(`tunnel contract deployed to: ${tunnelInstance.address}`);

    const ExposedPolymorphicFacesChildTunnel = await ethers.getContractFactory(
      "ExposedPolymorphicFacesChildTunnel"
    );
    exposedTunnelInstance = await ExposedPolymorphicFacesChildTunnel.deploy(
      goerliFxChild,
      user.address
    );
    console.log(
      `exposed tunnel contract deployed to: ${exposedTunnelInstance.address}`
    );

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    wethInstance = await TestERC20.connect(alice).deploy(); // we want DAO address != who deployed WETH on Polygon
    console.log(`Test WETH contract deployed to: ${wethInstance.address}`);

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
    console.log(
      `polymorphic faces child contract deployed to: ${polymorphicFacesChildInst.address}`
    );

    const bobMintAmount = "6000000000000000000";
    await wethInstance.connect(alice).mint(bob.address, bobMintAmount);

    await tunnelInstance.setFacesContract(polymorphicFacesChildInst.address);
    await exposedTunnelInstance.setFacesContract(
      polymorphicFacesChildInst.address
    );

    polymorphicFacesChildInst.whitelistBridgeAddress(
      exposedTunnelInstance.address,
      true
    );

    await polymorphicFacesChildInst.setMaticWETHContract(wethInstance.address);
  });

  beforeEach(async () => {
    tokenId++;

    const [user, alice, bob] = await ethers.getSigners();

    const keccak = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "uint256", "bool", "uint256"],
      [tokenId, bob.address, newGene, newVirginity, newChangesCount]
    );

    const stateId = 1;

    await exposedTunnelInstance.exposedProcessMessageFromRoot(
      stateId,
      user.address,
      keccak
    );

    const daoWETHBalance = await wethInstance.balanceOf(user.address);

    await wethInstance.connect(user).burn(daoWETHBalance.toString()); // Burn DAO's WETH  tokens
  });

  it("processMessageFromRoot should mint and update faces info correctly", async () => {
    const [user, alice, bob] = await ethers.getSigners();
    const baseGenomeChangePrice =
      await polymorphicFacesChildInst.baseGenomeChangePrice();

    expect(await polymorphicFacesChildInst.ownerOf(tokenId)).to.eq(bob.address);
    expect(await polymorphicFacesChildInst.geneOf(tokenId)).to.eq(newGene);
    expect(await polymorphicFacesChildInst.isNotVirgin(tokenId)).to.eq(
      newVirginity
    );

    expect(await polymorphicFacesChildInst.priceForGenomeChange(tokenId)).eq(
      baseGenomeChangePrice.mul(2 ** newChangesCount)
    );
  });

  it("morphGene should revert if user hasn't approved the PolymorphicFacesChild contract to spend funds", async () => {
    const [user, alice, bob] = await ethers.getSigners();
    const morphGenePrice = await polymorphicFacesChildInst.priceForGenomeChange(
      tokenId
    );
    const genePos = 5;
    // connect with bob because he is the NFT owner
    await expect(
      polymorphicFacesChildInst
        .connect(bob)
        .morphGene(tokenId, genePos, { value: morphGenePrice })
    ).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("randomizeGenome should revert if user hasn't approved the PolymorphicFacesChild contract to spend funds", async () => {
    const [user, alice, bob] = await ethers.getSigners();
    await expect(
      polymorphicFacesChildInst
        .connect(bob)
        .randomizeGenome(tokenId, { value: randomizeGenomePrice })
    ).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("randomizeGenome should tax WETH Token and transfer to DAO properly", async () => {
    const [user, alice, bob] = await ethers.getSigners();

    await wethInstance
      .connect(bob)
      .approve(polymorphicFacesChildInst.address, approveAmount);

    const currentGene = await polymorphicFacesChildInst.geneOf(tokenId);

    await expect(
      polymorphicFacesChildInst.connect(bob).randomizeGenome(tokenId)
    ).to.not.be.reverted;

    const randomizedGenome = await polymorphicFacesChildInst.geneOf(tokenId);

    await expect(currentGene).to.not.equal(randomizedGenome);

    const wethBalanceOfDAO = await wethInstance.balanceOf(user.address);

    await expect(wethBalanceOfDAO).to.equal(randomizeGenomePrice);
  });

  it("morphGene should tax WETH Token and transfer to to DAO properly", async () => {
    const [user, alice, bob] = await ethers.getSigners();

    const morphGenePrice = await polymorphicFacesChildInst.priceForGenomeChange(
      tokenId
    );

    const genePos = 5;

    await wethInstance
      .connect(bob)
      .approve(polymorphicFacesChildInst.address, approveAmount);

    const currentGene = await polymorphicFacesChildInst.geneOf(tokenId);

    await expect(
      polymorphicFacesChildInst.connect(bob).morphGene(tokenId, genePos)
    ).to.not.be.reverted;

    const morphedGene = await polymorphicFacesChildInst.geneOf(tokenId);

    await expect(currentGene).to.not.equal(morphedGene);

    const wethBalanceOfDAO = await wethInstance.balanceOf(user.address);

    await expect(wethBalanceOfDAO).to.equal(morphGenePrice);
  });

  it("randomizeGenome should excess the whole msg.value if any", async () => {
    const [user, alice, bob] = await ethers.getSigners();

    await wethInstance
      .connect(bob)
      .approve(polymorphicFacesChildInst.address, approveAmount);

    const maticTokens = 3;

    const userBalanceBefore = await bob.getBalance();

    const randomizeTx = await polymorphicFacesChildInst
      .connect(bob)
      .randomizeGenome(tokenId, { value: maticTokens });

    const txReceipt = await randomizeTx.wait();

    const userBalanceAfter = await bob.getBalance();

    const totalGasSpentForTx = txReceipt.cumulativeGasUsed.mul(
      txReceipt.effectiveGasPrice
    );

    await expect(userBalanceBefore.toString()).to.equal(
      userBalanceAfter.add(totalGasSpentForTx).toString()
    );
  });

  it("morphGene should excess the whole msg.value if any", async () => {
    const [user, alice, bob] = await ethers.getSigners();

    const genePos = 5;

    const maticTokens = 3;

    await wethInstance
      .connect(bob)
      .approve(polymorphicFacesChildInst.address, approveAmount);

    const userBalanceBefore = await bob.getBalance();

    const morphGeneTx = await polymorphicFacesChildInst
      .connect(bob)
      .morphGene(tokenId, genePos, { value: maticTokens });

    const txReceipt = await morphGeneTx.wait();

    const userBalanceAfter = await bob.getBalance();

    const totalGasSpentForTx = txReceipt.cumulativeGasUsed.mul(
      txReceipt.effectiveGasPrice
    );

    await expect(userBalanceBefore.toString()).to.equal(
      userBalanceAfter.add(totalGasSpentForTx).toString()
    );
  });

  it("moveThroughWormhole should revert if face has not been approved for transfer", async () => {
    const [user, alice, bob] = await ethers.getSigners();
    await expect(
      tunnelInstance.connect(bob).moveThroughWormhole([tokenId])
    ).to.be.revertedWith("ERC721: caller is not token owner nor approved");
  });

  it("moveThroughWormhole should not revert if face has been approved for transfer", async () => {
    const [user, alice, bob] = await ethers.getSigners();
    await polymorphicFacesChildInst
      .connect(bob)
      .approve(tunnelInstance.address, tokenId);
    await expect(tunnelInstance.connect(bob).moveThroughWormhole([tokenId])).to
      .not.be.reverted;
  });

  it("moveThroughWormhole should burn face on polygon", async () => {
    const [user, alice, bob] = await ethers.getSigners();
    await polymorphicFacesChildInst
      .connect(bob)
      .approve(tunnelInstance.address, tokenId);
    await tunnelInstance.connect(bob).moveThroughWormhole([tokenId]);
    await expect(polymorphicFacesChildInst.ownerOf(tokenId)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );
  });

  it("moveThroughWormhole should revert if not called by face owner", async () => {
    const [user, alice] = await ethers.getSigners();
    await expect(
      tunnelInstance.connect(alice).moveThroughWormhole([tokenId])
    ).revertedWith("Owner of the face should be msg.sender");
  });
});
