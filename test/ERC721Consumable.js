const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC721Consumable", async () => {
  let owner;
  let approved;
  let operator;
  let consumer;
  let snapshotId;
  let bulkBuyCount;
  let tokenID = 0;

  let name = "ConsumableFaces";
  let token = "Faces";
  let baseUri = "http://www.kekdao.com/";
  let royaltyFee = 0;
  let totalSupply = 10000;
  let bulkBuyLimit = 20;
  let defaultGenomeChangePrice = ethers.utils.parseEther("0.01");
  let randomizeGenomePrice = ethers.utils.parseEther("0.02");
  let arweaveAssetsJSON = "JSON";
  let polymorphPrice = ethers.utils.parseEther("0.0777");
  let baseGenomeChangePriceV2 = ethers.utils.parseEther("0.01");
  let randomizeGenomePriceV2 = ethers.utils.parseEther("0.01");

  let v1PolymorphsInitialBuy = 10;

  before(async () => {
    const signers = await ethers.getSigners();
    owner = signers[0];
    approved = signers[1];
    operator = signers[2];
    consumer = signers[3];
    other = signers[4];

    constructorArgsPolymorphsV1 = {
      name: "PolymorphWithGeneChanger",
      symbol: "MORPH",
      baseURI: baseUri,
      _daoAddress: owner.address,
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
    v1Instance = await PolymorphsV1.connect(owner).deploy(
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
      .connect(owner)
      .bulkBuy(v1PolymorphsInitialBuy, { value: polymorphPrice.mul(v1PolymorphsInitialBuy)});

    constructorArgsPolymorphs = {
      name: "PolymorphRoot",
      symbol: "iMORPH",
      baseURI: baseUri,
      _daoAddress: owner.address,
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

    await v1Instance.connect(owner).setApprovalForAll(v2Instance.address, true);

    await v2Instance
      .connect(owner)
      .burnAndMintNewPolymorph([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], { gasLimit: 15000000 });

	  constructorArgsFaces = {
		name: name,
		symbol: token,
		baseURI: baseUri,
		_daoAddress: owner.address,
		_royaltyFee: royaltyFee,
		_baseGenomeChangePrice: defaultGenomeChangePrice,
		_maxSupply: totalSupply,
		_randomizeGenomePrice: randomizeGenomePrice,
		_arweaveAssetsJSON: arweaveAssetsJSON,
		_polymorphV2Address: v2Instance.address,
	  };
  
	  const FaceshRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
	  facesInstance = await FaceshRoot.deploy(constructorArgsFaces);
  
	  console.log(`Faces instance deployed to: ${facesInstance.address}`);
  });

  beforeEach(async function () {
    // tokenID++;
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async function () {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  it("should successfully change consumer", async () => {

	const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
    let facesInstance = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

    await facesInstance.claim(5, {gasLimit: 15000000});
    // when:
    await facesInstance.changeConsumer(consumer.address, tokenID + 1);
    // then:
    expect(await facesInstance.consumerOf(tokenID + 1)).to.equal(
      consumer.address
    );
  });

  it("should emit event with args", async () => {
	const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
    let facesInstance = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

    await facesInstance.claim(5, {gasLimit: 15000000});
    // when:
    const tx = await facesInstance.changeConsumer(
      consumer.address,
      tokenID + 2
    );

    // then:
    await expect(tx)
      .to.emit(facesInstance, "ConsumerChanged")
      .withArgs(owner.address, consumer.address, tokenID + 2);
  });

  it("should successfully change consumer when caller is approved", async () => {
	const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
    let facesInstance = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

    await facesInstance.claim(5, {gasLimit: 15000000});
    // given:
    await facesInstance.approve(approved.address, tokenID + 3);
    // when:
    const tx = await facesInstance
      .connect(approved)
      .changeConsumer(consumer.address, tokenID + 3);

    // then:
    await expect(tx)
      .to.emit(facesInstance, "ConsumerChanged")
      .withArgs(owner.address, consumer.address, tokenID + 3);
    // and:
    expect(await facesInstance.consumerOf(tokenID + 3)).to.equal(
      consumer.address
    );
  });

  it("should successfully change consumer when caller is operator", async () => {

	const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
    let facesInstance = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

    await facesInstance.claim(5, {gasLimit: 15000000});
    // given:
    await facesInstance.setApprovalForAll(operator.address, true);
    // when:
    const tx = await facesInstance
      .connect(operator)
      .changeConsumer(consumer.address, tokenID + 4);

    // then:
    await expect(tx)
      .to.emit(facesInstance, "ConsumerChanged")
      .withArgs(owner.address, consumer.address, tokenID + 4);
    // and:
    expect(await facesInstance.consumerOf(tokenID + 4)).to.equal(
      consumer.address
    );
  });

  it("should revert when caller is not owner, not approved", async () => {
	const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
    let facesInstance = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

    await facesInstance.claim(5, {gasLimit: 15000000});
    const expectedRevertMessage =
      "ERC721Consumable: changeConsumer caller is not owner nor approved";
    await expect(
		facesInstance.connect(other).changeConsumer(consumer.address, tokenID + 5)
    ).to.be.revertedWith(expectedRevertMessage);
  });

  it("should revert when caller is approved for the token", async () => {
	const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
    let facesInstance = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

    await facesInstance.claim(10, {gasLimit: 15000000});
    // given:
    await facesInstance.changeConsumer(consumer.address, tokenID + 6);
    // then:
    const expectedRevertMessage =
      "ERC721Consumable: changeConsumer caller is not owner nor approved";
    await expect(
		facesInstance
        .connect(consumer)
        .changeConsumer(consumer.address, tokenID + 6)
    ).to.be.revertedWith(expectedRevertMessage);
  });

  it("should revert when tokenID is nonexistent", async () => {
	const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
    let facesInstance = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

    await facesInstance.claim(10, {gasLimit: 15000000});
    const invalidTokenID = v1PolymorphsInitialBuy + 1;
    const expectedRevertMessage = "ERC721: invalid token ID";
    await expect(
		facesInstance.changeConsumer(consumer.address, invalidTokenID)
    ).to.be.revertedWith(expectedRevertMessage);
  });

  it("should revert when calling consumerOf with nonexistent tokenID", async () => {
	const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
    let facesInstance = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

    await facesInstance.claim(10, {gasLimit: 15000000});
    const invalidTokenID = v1PolymorphsInitialBuy + 1;
    const expectedRevertMessage =
      "ERC721Consumable: consumer query for nonexistent token";
    await expect(
		facesInstance.consumerOf(invalidTokenID)
    ).to.be.revertedWith(expectedRevertMessage);
  });

  it("should clear consumer on transfer", async () => {
	const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
    let facesInstance = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

    await facesInstance.claim(10, {gasLimit: 15000000});
    await facesInstance.changeConsumer(consumer.address, tokenID + 7);
    await expect(
		facesInstance.transferFrom(owner.address, other.address, tokenID + 7)
    )
      .to.emit(facesInstance, "ConsumerChanged")
      .withArgs(owner.address, ethers.constants.AddressZero, tokenID + 7);
  });

  it("should emit ConsumerChanged on mint", async () => {
	const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
    let facesInstance = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

    await expect(
		facesInstance.claim(10)
    )
      .to.emit(facesInstance, "ConsumerChanged")
      .withArgs(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        tokenID + 1
      );
  });

  it("should not be able to transfer from consumer", async () => {
	const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
    let facesInstance = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});
	await facesInstance.claim(10, {gasLimit: 15000000});

    const transferFromTokenId = 5; // should be one of the approved tokens
    const expectedRevertMessage =
      "ERC721: caller is not token owner nor approved";
    await facesInstance.changeConsumer(
      consumer.address,
      transferFromTokenId
    );
    await expect(
		facesInstance
        .connect(consumer)
        .transferFrom(owner.address, other.address, transferFromTokenId)
    ).to.revertedWith(expectedRevertMessage);
  });
});
