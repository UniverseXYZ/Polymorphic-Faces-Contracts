// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "./IPolymorphicFacesRoot.sol";
import "../base/PolymorphV2/PolymorphRoot.sol";
import "../base/PolymorphicFacesWithGeneChanger.sol";

contract PolymorphicFacesRoot is 
    PolymorphicFacesWithGeneChanger,
    IPolymorphicFacesRoot
{
    using PolymorphicFacesGeneGenerator for PolymorphicFacesGeneGenerator.Gene;

    struct Params {
        string name;
        string symbol;
        string baseURI;
        address payable _daoAddress;
        uint96 _royaltyFee;
        uint256 premintedTokensCount;
        uint256 _baseGenomeChangePrice;
        uint256 _maxSupply;
        uint256 _randomizeGenomePrice;
        uint256 _bulkBuyLimit;
        string _arweaveAssetsJSON;
        address _polymorphV2Address;
    }

    uint256 public maxSupply;
    uint256 public bulkBuyLimit;

    PolymorphRoot public polymorphV2Contract;   
    uint256 public totalBurnedV1;

    mapping(address => uint256) public numClaimed; 

    event MaxSupplyChanged(uint256 newMaxSupply);
    event BulkBuyLimitChanged(uint256 newBulkBuyLimit);
    event PolyV2AddressChanged(address newPolyV2Address);
    event DefaultRoyaltyChanged(address newReceiver, uint96 newDefaultRoyalty);

    constructor(Params memory params)
        PolymorphicFacesWithGeneChanger(
            params.name,
            params.symbol,
            params.baseURI,
            params._daoAddress,
            params._baseGenomeChangePrice,
            params._randomizeGenomePrice,
            params._arweaveAssetsJSON
        )
    {
        maxSupply = params._maxSupply;
        bulkBuyLimit = params._bulkBuyLimit;
        arweaveAssetsJSON = params._arweaveAssetsJSON;
        polymorphV2Contract = PolymorphRoot(payable(params._polymorphV2Address));
        geneGenerator.random();
        _setDefaultRoyalty(params._daoAddress, params._royaltyFee);
    }


    function mint(uint256 _amount) external virtual nonReentrant {
        uint256 currentSupply = totalSupply();
        require((_amount + currentSupply) <= maxSupply, "Total supply reached");
        require(_amount <= bulkBuyLimit, "Can't mint more than bulk buy limit");

        for(uint i=0; i<_amount;i++){
            require(
                polymorphV2Contract.burnCount(msg.sender) > numClaimed[msg.sender],
                "Claimed current PolymorphV2 burn amount" 
            );

            numClaimed[msg.sender]++;
        
            _tokenId++;

            _genes[_tokenId] = geneGenerator.random();

            _mint(_msgSender(), _tokenId);

            emit TokenMinted(_tokenId, _genes[_tokenId]);
            emit TokenMorphed(
                _tokenId, 
                0, 
                _genes[_tokenId], 
                0, 
                FacesEventType.MINT
            );
        }
    }


    function daoMint() public onlyDAO {
        require(_tokenId < maxSupply, "Total supply reached");
        uint256 remaningSupply = (maxSupply - totalSupply()) + 1;
        for (uint i = 1; i < remaningSupply; i++) {
            _tokenId++;
            _genes[_tokenId] = geneGenerator.random();
            _mint(_msgSender(), _tokenId);

            emit TokenMinted(_tokenId, _genes[_tokenId]);
            emit TokenMorphed(
                _tokenId, 
                0,
                _genes[_tokenId],
                0, 
                FacesEventType.MINT
            ); 
        }    
    }
    

    function setDefaultRoyalty(address receiver, uint96 royaltyFee)
        external
        onlyDAO
    {
        _setDefaultRoyalty(receiver, royaltyFee);

        emit DefaultRoyaltyChanged(receiver, royaltyFee);
    }


    function setMaxSupply(uint256 _maxSupply) public virtual override onlyDAO {
        maxSupply = _maxSupply;

        emit MaxSupplyChanged(maxSupply);
    }

    function setPolyV2Address(address newPolyV2Address) public onlyDAO {
        polymorphV2Contract = PolymorphRoot(payable(newPolyV2Address));

        emit PolyV2AddressChanged(newPolyV2Address);
    }

    function setBulkBuyLimit(uint256 _bulkBuyLimit)
        public
        virtual
        override
        onlyDAO
    {
        bulkBuyLimit = _bulkBuyLimit;

        emit BulkBuyLimitChanged(_bulkBuyLimit);
    }

//    receive() external payable {
//         mint();
//     }
}
