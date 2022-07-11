// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.14;

import "../tunnel/FxBaseRootTunnel.sol";
import "../base/PolymorphicFacesTunnel.sol";
import "./PolymorphicFacesRoot.sol";

contract PolymorphicFacesRootTunnel is FxBaseRootTunnel, PolymorphicFacesTunnel {
    constructor(
        address _checkpointManager,
        address _fxRoot,
        address payable _daoAddress
    )
        FxBaseRootTunnel(_checkpointManager, _fxRoot)
        PolymorphicFacesTunnel(_daoAddress)
    {}

    PolymorphicFacesRoot public facesContract;

    function _processMessageFromChild(bytes memory data) internal override {
        require(
            address(facesContract) != address(0),
            "Faces contract hasn't been set yet"
        );
        (
            uint256 tokenId,
            address ownerAddress,
            uint256 gene,
            bool isNotVirgin,
            uint256 genomeChanges
        ) = _decodeMessage(data);

        facesContract.transferFrom(address(this), ownerAddress, tokenId);

        facesContract.wormholeUpdateGene(
            tokenId,
            gene,
            isNotVirgin,
            genomeChanges
        );
    }

    function moveThroughWormhole(uint256[] calldata _tokenIds)
        public
        override
    {
        require(_tokenIds.length <= 20, "Trying to bridge more than 20 faces");
        for(uint256 i = 0; i < _tokenIds.length; i++) {
            require(facesContract.ownerOf(_tokenIds[i]) == msg.sender, "Owner of the face to bridge should be msg.sender");
            facesContract.transferFrom(msg.sender, address(this), _tokenIds[i]);

            _sendMessageToChild(
                abi.encode(
                    _tokenIds[i],
                    msg.sender,
                    facesContract.geneOf(_tokenIds[i]),
                    facesContract.isNotVirgin(_tokenIds[i]),
                    facesContract.genomeChanges(_tokenIds[i])
                )
            );
        }
    }

    function setFacesContract(address payable contractAddress)
        public
        onlyDAO
    {
        facesContract = PolymorphicFacesRoot(contractAddress);
    }
}