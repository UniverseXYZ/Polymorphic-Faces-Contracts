# Polymorphic Faces

## Overview

- The following contracts are based on the [Polymorph contracts](https://github.com/UniverseXYZ/Polymorph-Contracts)
- The only way to obtain a `Polymorphic Face` is either to be claimed if the user has a `V2 Polymorph` or the DAO can mint some if a decision is made to do so
- The rest of the functionality is preserved (scrambling/morphing and bridging to Polygon)
  - Refer to [Polymorphs V2 Readme ](https://github.com/UniverseXYZ/Polymorph-Contracts/blob/polymorph-v2-polygon-bridge/README.md) for detailed info
## Setup
### Contracts deployment
- `./scripts/deploy.sh`

### Etherscan verification

- `./scripts/verify.sh`


  - PolymorphicFacesRoot Verification:
    ```bash
    npx hardhat verify --network goerli contractAddress --constructor-args ./deployment/args/root-faces-args.js
    ```

  - RootTunnel Verification:
    ```bash
    npx hardhat verify --network goerli <contractAddress> <"checkPointAddress"> <"fxRootAddress"> <"daoAddress">
    ```

  - PolymorphicFacesChild  Verification:
     ```bash
    npx hardhat verify --network mumbai <contractAddress> --constructor-args ./deployment/args/child-faces-args.js
    ```
     
  - ChildTunnel Verification:
    ```bash
    npx hardhat verify --network mumbai <contractAddress> <"fxChildAddress"> <"daoAddress">
    ```

  - TestERC20 Verification:
    ```bash
    npx hardhat verify --network mumbai --contract contracts/polygon/TestERC20.sol:TestERC20 <contractAddress>
    ```

## Gene positions:
**All traits are morphable**
- background: 0
- hairLeft: 1
- hairRight: 2
- earLeft: 3
- earRight: 4
- eyeLeft: 5
- eyeRight: 6
- beardTopLeft: 7
- bearTopRight: 8
- lipsLeft: 9
- lipsRight: 10
- bearBottomLeft: 11
- bearBottomRight: 12