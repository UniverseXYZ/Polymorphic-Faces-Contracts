const { expect } = require("chai");

describe("PolymorphicFacesRoot", () => {
  let DAO;
  let aliceAccount;
  let bobsAccount;
  let deployer;
  let v2Instance;
  let facesInst;

  let nameFaces = "PolymorphicFaces";
  let token = "Faces";
  let baseUri = "http://www.kekdao.com/";
  let royaltyFee = 10;
  let totalSupply = 10000;
  let defaultGenomeChangePrice = ethers.utils.parseEther("0.001");
  let baseGenomeChangePriceV2 = ethers.utils.parseEther("0.01");
  let randomizeGenomePriceV2 = ethers.utils.parseEther("0.01");
  let polymorphPrice = ethers.utils.parseEther("0.0777");
  let randomizeGenomePrice = ethers.utils.parseEther("0.005");
  let arweaveAssetsJSON = "JSON";
  let bulkBuyLimit = 20;
  let startTokenId = 0;

  let v1PolymorphsInitialBuy = 15;

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

    await v1Instance.connect(user).bulkBuy(v1PolymorphsInitialBuy, {
      value: polymorphPrice.mul(v1PolymorphsInitialBuy),
    });

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
    v2Instance = await PolymorphsV2.deploy(constructorArgsPolymorphs, {
      gasLimit: 15000000,
    });

    console.log(`PolymorphRoot instance deployed to: ${v2Instance.address}`);

    await v1Instance.connect(user).setApprovalForAll(v2Instance.address, true);

    await v2Instance
      .connect(user)
      .burnAndMintNewPolymorph(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        { gasLimit: 15000000 }
      );

    constructorArgsFaces = {
      name: nameFaces,
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
  });

  it(`should successfully claim all tokens`, async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(15, { gasLimit: 15000000 });

    const lastToken = await facesInst.lastTokenId();

    await expect(lastToken).eq(15);
  });

  it(`should not be able to claim more faces than burned v2 polys`, async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    const userAllowanceToClaim = await v2Instance.burnCount(deployer.address);

    await expect(facesInst.claim(userAllowanceToClaim, { gasLimit: 15000000 }))
      .to.not.be.reverted;

    await expect(facesInst.claim(1, { gasLimit: 15000000 })).to.be.revertedWith(
      "User already claimed all allowed faces"
    );
  });

  it(`should be able to claim faces even if user has transferred some polymorphs`, async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    const userAllowanceToClaim = await v2Instance.burnCount(deployer.address);

    const polymorphsToTranfer = 2;

    await expect(
      facesInst.claim(userAllowanceToClaim - polymorphsToTranfer, {
        gasLimit: 15000000,
      })
    ).to.not.be.reverted;

    await expect(
      v2Instance.transferFrom(deployer.address, aliceAccount.address, 10)
    ).to.not.be.reverted;
    await expect(
      v2Instance.transferFrom(deployer.address, aliceAccount.address, 12)
    ).to.not.be.reverted;

    await expect(facesInst.claim(polymorphsToTranfer, { gasLimit: 15000000 }))
      .to.not.be.reverted;

    await expect(facesInst.claim(1, { gasLimit: 15000000 })).to.be.revertedWith(
      "User already claimed all allowed faces"
    );
  });

  it(`mint(address) should be disabled`, async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    let facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await expect(facesInst["mint(address)"](deployer.address)).revertedWith(
      "Should not use this one"
    );
  });

  // it(`transfer calls mint functionality`, async () => {
  //   const lastTokenId = await polymorphInstance.lastTokenId();
  //   await deployer.sendTransaction({
  //     to: polymorphInstance.address,
  //     value: ethers.utils.parseEther("1"),
  //   });
  //   const lastTokenIdAfter = await polymorphInstance.lastTokenId();
  //   await expect(lastTokenId.add(1)).eq(lastTokenIdAfter);
  //   const owner = await polymorphInstance.ownerOf(lastTokenIdAfter);

  //   await expect(owner).eq(deployer.address);
  // });

  it("should mint nft with random gene", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    let facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(2, { gasLimit: 15000000 });

    const geneA = await facesInst.geneOf(startTokenId + 1);
    const geneB = await facesInst.geneOf(startTokenId + 2);

    expect(geneA).not.eq(geneB, "The two genes ended up the same");
  });

  it("should not change the gene on transfer", async () => {
    const bobsAddress = await bobsAccount.address;

    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    let facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(3, { gasLimit: 15000000 });

    const geneBefore = await facesInst.geneOf(startTokenId + 3);
    await facesInst.transferFrom(
      deployer.address,
      bobsAddress,
      startTokenId + 3
    );
    const geneAfter = await facesInst.geneOf(startTokenId + 3);

    expect(geneBefore).eq(geneAfter, "The two genes ended up the same");
  });

  it("randomize gene should return excess ether sent", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    let facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(3, { gasLimit: 15000000 });

    const tokenId = await facesInst.lastTokenId();

    const randomizeCost = await facesInst.randomizeGenomePrice();

    await expect(
      await facesInst.randomizeGenome(tokenId, { value: randomizeCost.mul(3) })
    ).to.changeEtherBalance(deployer, randomizeCost.mul(-1));
  });

  it("should evolve gene", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(5, { gasLimit: 15000000 });

    const tokenIdForMorphing = startTokenId + 2;

    const geneBefore = await facesInst.geneOf(tokenIdForMorphing);

    let morphPrice = await facesInst.priceForGenomeChange(tokenIdForMorphing);
    expect(morphPrice).eq(
      defaultGenomeChangePrice,
      "The price was not the default"
    );

    await expect(
      await facesInst.morphGene(tokenIdForMorphing, 1, { value: morphPrice })
    ).to.changeEtherBalance(deployer, morphPrice.mul(-1));

    const geneAfter = await facesInst.geneOf(tokenIdForMorphing);
    expect(geneBefore).not.eq(geneAfter, "The gene did not change");

    morphPrice = await facesInst.priceForGenomeChange(tokenIdForMorphing);
    expect(morphPrice).eq(
      defaultGenomeChangePrice.mul(2),
      "The price was not correct"
    );

    const kekBalanceAfter = await DAO.getBalance();
    await expect(
      facesInst.morphGene(tokenIdForMorphing, 0, { value: morphPrice })
    ).to.not.be.reverted;
    const geneAfter2 = await facesInst.geneOf(tokenIdForMorphing);
    const kekBalanceAfter2 = await DAO.getBalance();
    expect(geneAfter2).not.eq(geneAfter, "The gene did not change");
    expect(kekBalanceAfter).to.be.below(
      kekBalanceAfter2,
      "The price was not paid"
    );

    morphPrice = await facesInst.priceForGenomeChange(tokenIdForMorphing);
    expect(morphPrice).eq(
      defaultGenomeChangePrice.mul(4),
      "The price was not correct"
    );

    await facesInst.morphGene(tokenIdForMorphing, 10, {
      value: morphPrice,
      gasLimit: 100000,
    });
    const geneAfter3 = await facesInst.geneOf(tokenIdForMorphing);
    expect(geneAfter2).not.eq(geneAfter3, "The gene did not change");

    morphPrice = await facesInst.priceForGenomeChange(tokenIdForMorphing);
    expect(morphPrice).eq(
      defaultGenomeChangePrice.mul(8),
      "The price was not correct"
    );

    const randomizePrice = await facesInst.randomizeGenomePrice();

    await facesInst.randomizeGenome(tokenIdForMorphing, {
      value: randomizePrice,
    });
    const geneAfterReset = await facesInst.geneOf(tokenIdForMorphing);
    expect(geneAfterReset).not.eq(geneAfter3, "The gene did not change");

    morphPrice = await facesInst.priceForGenomeChange(tokenIdForMorphing);
    expect(morphPrice).eq(
      defaultGenomeChangePrice,
      "The price was not the default"
    );
  });

  it("should not morph from a contract interactor", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(5, { gasLimit: 15000000 });

    const tokenIdForRandomize = startTokenId + 2;
    const geneBefore = await facesInst.geneOf(tokenIdForRandomize);

    await facesInst.randomizeGenome(tokenIdForRandomize, {
      value: randomizeGenomePrice,
    });

    const geneAfter = await facesInst.geneOf(tokenIdForRandomize);

    expect(geneBefore).not.eq(
      geneAfter,
      "Genes did not change for EOW interaction"
    );
    const TestContractInteractor = await ethers.getContractFactory(
      "TestContractInteractor"
    );
    const contractInteractor = await TestContractInteractor.deploy(
      facesInst.address
    );
    await facesInst.transferFrom(
      deployer.address,
      contractInteractor.address,
      tokenIdForRandomize
    );

    await expect(
      contractInteractor.triggerRandomize(tokenIdForRandomize, {
        value: randomizeGenomePrice,
      })
    ).to.be.revertedWith("Caller cannot be a contract");
    await expect(
      contractInteractor.triggerGeneChange(tokenIdForRandomize, 2, {
        value: randomizeGenomePrice,
      })
    ).to.be.revertedWith("Caller cannot be a contract");
  });

  it("should not morph face that is not yours", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(2, { gasLimit: 15000000 });

    const tokenId = await facesInst.lastTokenId();

    await expect(
      facesInst.connect(aliceAccount).randomizeGenome(tokenId)
    ).revertedWith(
      "FacesWithGeneChanger: cannot change genome of token that is not own"
    );
    await expect(
      facesInst.connect(aliceAccount).morphGene(tokenId, 2)
    ).revertedWith(
      "FacesWithGeneChanger: cannot change genome of token that is not own"
    );
  });

  it("genome should be the same length after randomization", async () => {
    // May fail sometimes. See the Note in README##Genome
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(2, { gasLimit: 15000000 });

    const tokenId = await facesInst.lastTokenId();

    const scrambleCost = await facesInst.randomizeGenomePrice();

    const geneOfToken = (await facesInst.geneOf(tokenId)).toString();

    await facesInst.randomizeGenome(tokenId, { value: scrambleCost });

    const geneOfTokenAfterRandomization = (
      await facesInst.geneOf(tokenId)
    ).toString();

    await expect(geneOfToken.length).eq(geneOfTokenAfterRandomization.length);
  });

  it("morph gene should return excess ether sent", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(2, { gasLimit: 15000000 });

    const tokenId = await facesInst.lastTokenId();

    const morphCost = await facesInst.priceForGenomeChange(tokenId);

    await expect(
      await facesInst.morphGene(tokenId, 2, { value: morphCost.mul(5) })
    ).to.changeEtherBalance(deployer, morphCost.mul(-1));
  });

  it("should not morph gene when DAO does not have receive or fallback function", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    const TestContractInteractor = await ethers.getContractFactory(
      "TestContractInteractor"
    );
    const contractInteractor = await TestContractInteractor.deploy(
      facesInst.address
    );

    const MockedFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const mockedFacesInstance = await MockedFacesRoot.deploy({
      name: nameFaces,
      symbol: token,
      baseURI: baseUri,
      _daoAddress: contractInteractor.address,
      _royaltyFee: royaltyFee,
      _baseGenomeChangePrice: defaultGenomeChangePrice,
      _maxSupply: totalSupply,
      _randomizeGenomePrice: randomizeGenomePrice,
      _arweaveAssetsJSON: arweaveAssetsJSON,
      _polymorphV2Address: v2Instance.address,
    });

    await mockedFacesInstance.claim(2, { gasLimit: 15000000 });

    await expect(
      mockedFacesInstance.morphGene(startTokenId + 2, 2)
    ).revertedWith(
      "Address: unable to send value, recipient may have reverted"
    );
  });

  it("should revert if invalid gene position is passed", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(2, { gasLimit: 15000000 });

    const tokenId = await facesInst.lastTokenId();

    const morphCost = await facesInst.priceForGenomeChange(tokenId);

    await expect(facesInst.morphGene(tokenId, 37, { value: morphCost })).to.not
      .reverted;
    await expect(
      facesInst.morphGene(tokenId, 38, { value: morphCost.mul(2) })
    ).revertedWith("Bad gene position");
  });

  // Disabled for faces because minting (claiming) happens free iff the user has a v2 polymorph
  // it("should not mint when DAO does not have receive or fallback function", async () => {
  //   const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
  //   const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

  //   const TestContractInteractor = await ethers.getContractFactory(
  //     "TestContractInteractor"
  //   );
  //   const contractInteractor = await TestContractInteractor.deploy(
  //     facesInst.address
  //   );

  //   const MockedFacesRoot = await ethers.getContractFactory(
  //     "PolymorphicFacesRoot"
  //   );

  //   constructorArgsFacesMocked = {
  //     name: nameFaces,
  //     symbol: token,
  //     baseURI: baseUri,
  //     _daoAddress: contractInteractor.address,
  //     _royaltyFee: royaltyFee,
  //     _baseGenomeChangePrice: defaultGenomeChangePrice,
  //     _maxSupply: totalSupply,
  //     _randomizeGenomePrice: randomizeGenomePrice,
  //     _arweaveAssetsJSON: arweaveAssetsJSON,
  //     _polymorphV2Address: v2Instance.address,
  //   };

  //   const mockedFacesInstance = await MockedFacesRoot.deploy(constructorArgsFacesMocked);

  //   const cost = await mockedFacesInstance.polymorphPrice();
  //   await expect(
  //     mockedPolymorphInstance["claim()"]({ value: cost })
  //   ).revertedWith(
  //     "Address: unable to send value, recipient may have reverted"
  //   );
  // });

  // Also disabled for faces, since claiming/minting costs no ETH
  // it("should not mint when msg.sender can not receive excess eth amount back", async () => {
  //   const TestContractInteractor = await ethers.getContractFactory(
  //     "TestContractInteractor"
  //   );
  //   const contractInteractor = await TestContractInteractor.deploy(
  //     polymorphInstance.address
  //   );

  //   const cost = await polymorphInstance.polymorphPrice();
  //   await expect(
  //     contractInteractor.triggerMint({ value: cost.mul(2) })
  //   ).revertedWith("Failed to return excess");
  // });

  it("should not randomize gene when DAO does not have receive or fallback function", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(2, { gasLimit: 15000000 });

    const TestContractInteractor = await ethers.getContractFactory(
      "TestContractInteractor"
    );
    const contractInteractor = await TestContractInteractor.deploy(
      facesInst.address
    );

    const MockedFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const mockedFacesInstance = await MockedFacesRoot.deploy({
      name: nameFaces,
      symbol: token,
      baseURI: baseUri,
      _daoAddress: contractInteractor.address,
      _royaltyFee: royaltyFee,
      _baseGenomeChangePrice: defaultGenomeChangePrice,
      _maxSupply: totalSupply,
      _randomizeGenomePrice: randomizeGenomePrice,
      _arweaveAssetsJSON: arweaveAssetsJSON,
      _polymorphV2Address: v2Instance.address,
    });

    await mockedFacesInstance.claim(2, { gasLimit: 15000000 });
    await expect(mockedFacesInstance.randomizeGenome(2)).revertedWith(
      "Address: unable to send value, recipient may have reverted"
    );
  });

  // it('should not morph genome when msg.sender can not receive excess eth amount back', async () => {
  //   const TestContractInteractor = await ethers.getContractFactory("TestContractInteractor");
  //   const contractInteractor = await TestContractInteractor.deploy(polymorphInstance.address)

  //   const cost = await polymorphInstance.polymorphPrice();
  //   await expect(contractInteractor.triggerRandomize(premintedTokensCount, {value: cost.mul(2)})).revertedWith("Failed to return excess");
  // });

  // it('should not randomize genome when msg.sender can not receive excess eth amount back', async () => {
  //   const TestContractInteractor = await ethers.getContractFactory("TestContractInteractor");
  //   const contractInteractor = await TestContractInteractor.deploy(polymorphInstance.address)

  //   const cost = await polymorphInstance.polymorphPrice();
  //   await expect(contractInteractor.triggerGeneChange(premintedTokensCount, 5, {value: cost.mul(2)})).revertedWith("Failed to return excess");
  // });

  // it('should not morph when msg.sender can not receive excess eth amount back', async () => {
  //   const TestContractInteractor = await ethers.getContractFactory("TestContractInteractor");
  //   const contractInteractor = await TestContractInteractor.deploy(polymorphInstance.address);

  //   const cost = await polymorphInstance.polymorphPrice();

  //   await polymorphInstance['mint()']({value: cost});
  //   const tokenId = await polymorphInstance.lastTokenId();

  //   await polymorphInstance.transferFrom(deployer.address, contractInteractor.address, tokenId);

  //   const genomeChangeCost = await polymorphInstance.priceForGenomeChange(tokenId);

  //   await expect(contractInteractor.triggerGeneChange(tokenId, 2, {value: genomeChangeCost.mul(2)})).revertedWith("Failed to return excess");
  // });

  it("should change max supply", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    const newMaxSupply = 11000;

    const totalSupplyBefore = await facesInst.maxSupply();
    expect(totalSupplyBefore).eq(
      totalSupply,
      `The max supply was not ${totalSupply} in the beginning`
    );

    await facesInst.connect(DAO).setMaxSupply(newMaxSupply);

    const totalSupplyAfter = await facesInst.maxSupply();
    expect(totalSupplyAfter).eq(newMaxSupply, "The max supply did not change");

    await expect(facesInst.setMaxSupply(newMaxSupply)).revertedWith(
      "Not called from the dao"
    );
  });

  it("should change randomizeGenomePrice", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    const newRandomizeGenomePrice = ethers.utils.parseEther("0.1");

    const randomizeGenomePriceBefore = await facesInst.randomizeGenomePrice();
    expect(randomizeGenomePriceBefore).eq(
      randomizeGenomePrice,
      `The randomize genome was not ${randomizeGenomePrice} in the beginning`
    );

    await facesInst
      .connect(DAO)
      .changeRandomizeGenomePrice(newRandomizeGenomePrice);

    const randomizeGenomePriceAfter = await facesInst.randomizeGenomePrice();
    expect(randomizeGenomePriceAfter).eq(
      newRandomizeGenomePrice,
      "The randomize genome price did not change"
    );

    await expect(
      facesInst.changeRandomizeGenomePrice(newRandomizeGenomePrice)
    ).revertedWith("Not called from the dao");
  });

  it("should change baseGenomeChangePrice", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });
    const newChangeGenomePrice = ethers.utils.parseEther("0.1");

    const changeGenomePriceBefore = await facesInst.baseGenomeChangePrice();
    expect(changeGenomePriceBefore).eq(
      defaultGenomeChangePrice,
      `The change genome was not ${defaultGenomeChangePrice} in the beginning`
    );

    await facesInst
      .connect(DAO)
      .changeBaseGenomeChangePrice(newChangeGenomePrice);

    const changeGenomePriceAfter = await facesInst.baseGenomeChangePrice();
    expect(changeGenomePriceAfter).eq(
      newChangeGenomePrice,
      "The change genome price did not change"
    );

    await expect(
      facesInst.changeBaseGenomeChangePrice(newChangeGenomePrice)
    ).revertedWith("Not called from the dao");
  });

  it("should change baseURI", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });
    const newBaseURI = "https://universe.xyz.com/";
    const baseURIBefore = await facesInst.baseURI();
    expect(baseURIBefore).eq(
      baseUri,
      `The base URI was not ${baseUri} in the beginning`
    );

    await facesInst.connect(DAO).setBaseURI(newBaseURI);

    const baseURIAfter = await facesInst.baseURI();
    expect(baseURIAfter).eq(newBaseURI, "The baseURI did not change");

    await expect(facesInst.setBaseURI(newBaseURI)).revertedWith(
      "Not called from the dao"
    );
  });

  it("should change arweave assets", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });
    const newArweave = "new arweave json";

    const arweaveBefore = await facesInst.arweaveAssetsJSON();
    expect(arweaveBefore).eq(
      arweaveAssetsJSON,
      "Arweave isn't the same as when it was deployed"
    );

    await facesInst.connect(DAO).setArweaveAssetsJSON(newArweave);

    const arweaveAfter = await facesInst.arweaveAssetsJSON();
    expect(arweaveAfter).eq(newArweave, "The bulk buy limit did not change");

    await expect(facesInst.setArweaveAssetsJSON(newArweave)).revertedWith(
      "Not called from the dao"
    );
  });

  it("wormholeUpdateGene should revert if not called from tunnel", async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });
    await expect(
      facesInst.wormholeUpdateGene(1, 12312312312, true, 2)
    ).to.be.revertedWith("Not called from the tunnel");
  });

  // it(`should not mint more than totalSupply`, async () => {
  //   // Should buy all V1s (10K)
  //   let currentSupply = await v1Instance.totalSupply();
  //   while(currentSupply < totalSupply) {

  //   }
  //   for (let i = v1PolymorphsInitialBuy + 1; i < totalSupply - v1PolymorphsInitialBuy - 1; i+=20) {
  //     await v1Instance.bulkBuy(20, {value: polymorphPrice.mul(20)});
  //   }

  //   // Should burn all V1s and mint totalSupply V2s (10K)
  //   // for (let i = v1PolymorphsInitialBuy + 1; i < totalSupply; i++) {
  //   //   await v2Instance.connect(user).burnAndMintNewPolymorph([i], {gasLimit:15000000 });
  //   // }

  //   // const PolymorphicFacesRoot = await ethers.getContractFactory("PolymorphicFacesRoot");
  //   // const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {gasLimit:15000000});

  //   // const lastTokenId = await facesInst.lastTokenId();
  //   // const totalSupplyFaces = await facesInst.maxSupply();
  //   // for (let i = 0; i < totalSupplyFaces - lastTokenId; i++) {
  //   //   await facesInst.claim(1, {gasLimit: 15000000});
  //   // }
  //   // await expect(facesInst.claim(1, {gasLimit: 15000000})).revertedWith(
  //   //   "Total supply reached"
  //   // );
  // });

  it(`should not be able to claim more than totalSupply`, async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    await facesInst.claim(15, { gasLimit: 15000000 }); // claiming the initial v2 burned into polys

    // Setting it this low for purpose. We need to mint V1 Polys first, then Burn them into V2s and finally claim the total amount of faces
    // This test case would get too slow if we do it for 10K
    const newMaxSupply = 100;

    const totalSupplyBefore = await facesInst.maxSupply();
    expect(totalSupplyBefore).eq(
      totalSupply,
      `The max supply was not ${totalSupply} in the beginning`
    );

    await facesInst.connect(DAO).setMaxSupply(newMaxSupply);

    const totalSupplyAfter = await facesInst.maxSupply();
    expect(totalSupplyAfter).eq(newMaxSupply, "The max supply did not change");

    // bulkBuy v1 Polys up to 100, burn them afterwards for v2 Poly and claim a face

    for (let i = v1PolymorphsInitialBuy + 1; i < newMaxSupply + 1; i++) {
      // from 16 up to 100 inclusively
      await v1Instance.bulkBuy(1, { value: polymorphPrice.mul(1) });
      await v2Instance.burnAndMintNewPolymorph([i], { gasLimit: 15000000 });
      await facesInst.claim(1, { gasLimit: 15000000 });
    }

    // buying one more v1 and v2 polys

    await v1Instance.bulkBuy(1, { value: polymorphPrice.mul(1) });

    const lastV1Poly = await v1Instance.lastTokenId();

    expect(lastV1Poly).to.eq(101);

    await v2Instance.burnAndMintNewPolymorph([lastV1Poly], {
      gasLimit: 15000000,
    });

    await expect(facesInst.claim(1, { gasLimit: 15000000 })).revertedWith(
      "Total supply reached"
    );
  });

  it(`daoMint should mint up to totalSupply`, async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    const newMaxSupply = 15;

    const totalSupplyBefore = await facesInst.maxSupply();
    expect(totalSupplyBefore).eq(
      totalSupply,
      `The max supply was not ${totalSupply} in the beginning`
    );

    await facesInst.connect(DAO).setMaxSupply(newMaxSupply);

    const totalSupplyAfter = await facesInst.maxSupply();
    expect(totalSupplyAfter).eq(newMaxSupply, "The max supply did not change");

    await expect(facesInst.daoMint(15)).to.be.revertedWith(
      "Not called from the dao"
    );
    await expect(facesInst.connect(DAO).daoMint(30)).to.be.revertedWith(
      "DAO can mint at most 25 faces per transaction"
    );
    await expect(facesInst.connect(DAO).daoMint(15)).to.not.be.reverted;

    await expect(facesInst.claim(1, { gasLimit: 15000000 })).revertedWith(
      "Total supply reached"
    );
  });

  it(`totalSupply shouldn't be exceeded after daoMint and claim sequential transactions`, async () => {
    const PolymorphicFacesRoot = await ethers.getContractFactory(
      "PolymorphicFacesRoot"
    );
    const facesInst = await PolymorphicFacesRoot.deploy(constructorArgsFaces, {
      gasLimit: 15000000,
    });

    const newMaxSupply = 25;

    const totalSupplyBefore = await facesInst.maxSupply();
    expect(totalSupplyBefore).eq(
      totalSupply,
      `The max supply was not ${totalSupply} in the beginning`
    );

    await facesInst.connect(DAO).setMaxSupply(newMaxSupply);

    const totalSupplyAfter = await facesInst.maxSupply();
    expect(totalSupplyAfter).eq(newMaxSupply, "The max supply did not change");

    await expect(facesInst.claim(5, { gasLimit: 15000000 })).to.not.be
      .reverted;

    await expect(facesInst.daoMint(10)).to.be.revertedWith(
      "Not called from the dao"
    );
    await expect(facesInst.connect(DAO).daoMint(30)).to.be.revertedWith(
      "DAO can mint at most 25 faces per transaction"
    );
    await expect(facesInst.connect(DAO).daoMint(10)).to.not.be.reverted;

    // Buy 10 more V1s
    await v1Instance.bulkBuy(10, { value: polymorphPrice.mul(10) });

    const lastV1 = await v1Instance.lastTokenId();

    // Burn the 10 V1s into V2s
    await v2Instance.burnAndMintNewPolymorph(
      [
        lastV1,
        lastV1 - 1,
        lastV1 - 2,
        lastV1 - 3,
        lastV1 - 4,
        lastV1 - 5,
        lastV1 - 6,
        lastV1 - 7,
        lastV1 - 8,
        lastV1 - 9,
      ],
      { gasLimit: 15000000 }
    );

    // Claim 10 faces
    await expect(facesInst.claim(10, { gasLimit: 15000000 })).to.not.be
      .reverted;

    const lastFaceId = await facesInst.lastTokenId();
    expect(lastFaceId).eq(newMaxSupply);
    await expect(facesInst.claim(1, { gasLimit: 15000000 })).revertedWith(
      "Total supply reached"
    );
  });
});
