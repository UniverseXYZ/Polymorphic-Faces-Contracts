// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../mainnet/PolymorphicFacesRoot.sol";

contract Flip {
    PolymorphicFacesRoot constant polymorphicFaces =
        PolymorphicFacesRoot(payable(0x273c507D8E21cDE039491B14647Fe9278D88e91D)); // Ropsten Contract

    constructor(
        uint256 tokenId,
        uint256 genePosition,
        uint256 geneVariation,
        uint256 geneWanted,
        address payable receiver
    ) payable {
        polymorphicFaces.morphGene{value: address(this).balance}(
            tokenId,
            genePosition
        );

        require(
            ((polymorphicFaces.geneOf(tokenId) / 10**(genePosition * 2)) / 100) %
                geneVariation ==
                geneWanted
        );

        polymorphicFaces.safeTransferFrom(address(this), receiver, tokenId);
        selfdestruct(receiver);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
