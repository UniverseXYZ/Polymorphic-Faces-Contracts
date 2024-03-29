// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "../mainnet/PolymorphicFacesRoot.sol";

contract FlipFactory is ERC721Holder {
    bytes internal _bytecode;
    PolymorphicFacesRoot polyFaces =
        PolymorphicFacesRoot(payable(0x273c507D8E21cDE039491B14647Fe9278D88e91D)); // Ropsten Contract;

    constructor() {}

    function flip(
        uint256 morphId,
        uint256 limit,
        bytes memory bytecode
    ) public {
        address expectedAddress = Create2.computeAddress(
            bytes32(0),
            keccak256(bytecode)
        );
        polyFaces.safeTransferFrom(msg.sender, expectedAddress, morphId);
        _bytecode = bytecode;
        search(limit);
        delete _bytecode;
        require(
            polyFaces.ownerOf(morphId) == msg.sender,
            "Did not receive face"
        );
    }

    function performFlip() public {
        bytes memory bytecode = _bytecode;
        Create2.deploy(address(this).balance, bytes32(0), bytecode);
    }

    function search(uint256 limit) public {
        bool success = false;
        bytes memory result;
        uint256 tries = 0;
        while (!(tries > limit || success)) {
            (success, result) = address(this).call(
                abi.encodeWithSignature("performFlip()")
            );
            tries++;
        }
        require(success, "Unsuccessful search");
    }
}
