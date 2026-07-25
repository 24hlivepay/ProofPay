import hre from "hardhat";

async function main() {
  const ProofPayEscrow = await hre.ethers.getContractFactory("ProofPayEscrow");

  const proofPayEscrow = await ProofPayEscrow.deploy();

  await proofPayEscrow.waitForDeployment();

  console.log(
    "ProofPayEscrow deployed to:",
    await proofPayEscrow.getAddress()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});