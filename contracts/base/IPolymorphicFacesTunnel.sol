// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.14;

interface IPolymorphicFacesTunnel {
    function moveThroughWormhole(uint256[] calldata tokenIds) external;
}
