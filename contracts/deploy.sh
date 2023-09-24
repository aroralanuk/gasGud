source .env
forge script script/GasGud.s.sol:GasGudScript --private-key $DEPLOYER_PRIVATE_KEY --broadcast --rpc-url $PROVIDER_URI_GOERLI -vvvv --verify --etherscan-api-key $ETHERSCAN_API_KEY
cp out/GasOracle.sol/GasOracle.json ../webapp/src/lib/abi/GasOracle.json