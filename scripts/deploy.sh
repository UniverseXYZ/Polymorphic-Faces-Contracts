# PolymorphicFacesRoot
npx hardhat run deployment/root-faces-deploy.js --network goerli

# PolymorphicFacesRootTunnel
npx hardhat run deployment/root-tunnel-deploy.js --network goerli

# TestERC20 (Needed for morphing a gene on Polygon)
npx hardhat run deployment/test-erc20-deploy.js --network mumbai

# PolymorphicFacesChild
npx hardhat run deployment/child-polymorph-deploy.js --network mumbai

# PolymorphicFacesChildTunnel
npx hardhat run deployment/child-tunnel-deploy.js --network mumbai