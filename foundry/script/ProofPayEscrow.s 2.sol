// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/ProofPayEscrow.sol";

contract DeployProofPayEscrow is Script {
    function run() external {
        vm.startBroadcast();

        new ProofPayEscrow();

        vm.stopBroadcast();
    }
}
