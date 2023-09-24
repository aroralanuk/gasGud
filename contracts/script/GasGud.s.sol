// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";

import {GasOracle} from "../src/GasOracle.sol";

contract GasGudScript is Script {
    GasOracle oracle;

    uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");

    function setUp() public {}

    function run() public {
        vm.startBroadcast(pk);

        oracle = new GasOracle(0x6da7e8bb9085d3852e7e85d853b23a197645ea98162e4ccacde596b393cd39db, 100_000_000);
    }
}
