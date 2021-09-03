// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IPolymorphChild is IERC721 {
    function mintPolymorphWithInfo(
        uint256 tokenId,
        address ownerAddress,
        uint256 gene
    ) external;
}