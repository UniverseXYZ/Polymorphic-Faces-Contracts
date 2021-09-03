// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../lib/PolymorphGeneGenerator.sol";
import "../modifiers/Tunnel.sol";
import "./Polymorph.sol";
import "./IPolymorphWithGeneChanger.sol";

abstract contract PolymorphWithGeneChanger is
    IPolymorphWithGeneChanger,
    Polymorph,
    Tunnel
{
    using PolymorphGeneGenerator for PolymorphGeneGenerator.Gene;
    using SafeMath for uint256;
    using Address for address;

    mapping(uint256 => uint256) internal _genomeChanges;
    mapping(uint256 => bool) public isNotVirgin;
    uint256 public baseGenomeChangePrice;
    uint256 public randomizeGenomePrice;

    event BaseGenomeChangePriceChanged(uint256 newGenomeChange);
    event RandomizeGenomePriceChanged(uint256 newRandomizeGenomePriceChange);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address payable _daoAddress,
        uint256 _baseGenomeChangePrice,
        uint256 _randomizeGenomePrice,
        string memory _arweaveAssetsJSON
    ) Polymorph(name, symbol, baseURI, _daoAddress, _arweaveAssetsJSON) {
        baseGenomeChangePrice = _baseGenomeChangePrice;
        randomizeGenomePrice = _randomizeGenomePrice;
    }

    function changeBaseGenomeChangePrice(uint256 newGenomeChangePrice)
        public
        virtual
        override
        onlyDAO
    {
        baseGenomeChangePrice = newGenomeChangePrice;
        emit BaseGenomeChangePriceChanged(newGenomeChangePrice);
    }

    function changeRandomizeGenomePrice(uint256 newRandomizeGenomePrice)
        public
        virtual
        override
        onlyDAO
    {
        randomizeGenomePrice = newRandomizeGenomePrice;
        emit RandomizeGenomePriceChanged(newRandomizeGenomePrice);
    }

    function morphGene(uint256 tokenId, uint256 genePosition)
        public
        payable
        virtual
        override
        nonReentrant
    {
        require(genePosition > 0, "Base character not morphable");
        _beforeGenomeChange(tokenId);
        uint256 price = priceForGenomeChange(tokenId);

        (bool transferToDaoStatus, ) = daoAddress.call{value: price}("");
        require(
            transferToDaoStatus,
            "Address: unable to send value, recipient may have reverted"
        );

        uint256 excessAmount = msg.value.sub(price);
        if (excessAmount > 0) {
            (bool returnExcessStatus, ) = _msgSender().call{
                value: excessAmount
            }("");
            require(returnExcessStatus, "Failed to return excess.");
        }

        uint256 oldGene = _genes[tokenId];
        uint256 newTrait = geneGenerator.random() % 100;
        _genes[tokenId] = replaceGene(oldGene, newTrait, genePosition);
        _genomeChanges[tokenId]++;
        isNotVirgin[tokenId] = true;
        emit TokenMorphed(
            tokenId,
            oldGene,
            _genes[tokenId],
            price,
            PolymorphEventType.MORPH
        );
    }

    function replaceGene(
        uint256 genome,
        uint256 replacement,
        uint256 genePosition
    ) internal pure virtual returns (uint256 newGene) {
        require(genePosition < 38, "Bad gene position");
        uint256 mod = 0;
        if (genePosition > 0) {
            mod = genome.mod(10**(genePosition * 2)); // Each gene is 2 digits long
        }
        uint256 div = genome.div(10**((genePosition + 1) * 2)).mul(
            10**((genePosition + 1) * 2)
        );
        uint256 insert = replacement * (10**(genePosition * 2));
        newGene = div.add(insert).add(mod);
        return newGene;
    }

    function randomizeGenome(uint256 tokenId)
        public
        payable
        virtual
        override
        nonReentrant
    {
        _beforeGenomeChange(tokenId);

        (bool transferToDaoStatus, ) = daoAddress.call{
            value: randomizeGenomePrice
        }("");
        require(
            transferToDaoStatus,
            "Address: unable to send value, recipient may have reverted"
        );

        uint256 excessAmount = msg.value.sub(randomizeGenomePrice);
        if (excessAmount > 0) {
            (bool returnExcessStatus, ) = _msgSender().call{
                value: excessAmount
            }("");
            require(returnExcessStatus, "Failed to return excess.");
        }

        uint256 oldGene = _genes[tokenId];
        _genes[tokenId] = geneGenerator.random();
        _genomeChanges[tokenId] = 0;
        isNotVirgin[tokenId] = true;
        emit TokenMorphed(
            tokenId,
            oldGene,
            _genes[tokenId],
            randomizeGenomePrice,
            PolymorphEventType.MORPH
        );
    }

    function whitelistBridgeAddress(address bridgeAddress, bool status)
        external
        override
        onlyDAO
    {
        whitelistTunnelAddresses[bridgeAddress] = status;
    }

    function priceForGenomeChange(uint256 tokenId)
        public
        view
        virtual
        override
        returns (uint256 price)
    {
        uint256 pastChanges = _genomeChanges[tokenId];

        return baseGenomeChangePrice.mul(1 << pastChanges);
    }

    function genomeChanges(uint256 tokenId)
        public
        view
        override
        returns (uint256 genomeChnages)
    {
        return _genomeChanges[tokenId];
    }

    function _beforeGenomeChange(uint256 tokenId) internal view {
        require(
            !address(_msgSender()).isContract(),
            "Caller cannot be a contract"
        );
        require(
            _msgSender() == tx.origin,
            "Msg sender should be original caller"
        );

        beforeTransfer(tokenId, _msgSender());
    }

    function beforeTransfer(uint256 tokenId, address owner) internal view {
        require(
            ownerOf(tokenId) == owner,
            "PolymorphWithGeneChanger: cannot change genome of token that is not own"
        );
    }

    function wormholeUpdateGene(
        uint256 tokenId,
        uint256 gene,
        bool isVirgin,
        uint256 genomeChangesCount
    ) external nonReentrant onlyTunnel {
        uint256 oldGene = _genes[tokenId];
        _genes[tokenId] = gene;
        isNotVirgin[tokenId] = isVirgin;
        _genomeChanges[tokenId] = genomeChangesCount;

        emit TokenMorphed(
            tokenId,
            oldGene,
            _genes[tokenId],
            priceForGenomeChange(tokenId),
            PolymorphEventType.MORPH
        );
    }
}