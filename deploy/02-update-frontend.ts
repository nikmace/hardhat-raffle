import { ethers } from "hardhat";

import fs from "fs";
import { network } from "hardhat";

const FRONTEND_ADDRESSES_FILE =
  "../../nextjs-lottery/constants/contractAddresses.json";
const FRONTEND_ABI_FILE = "../../nextjs-lottery/constants/abi.json";

const updateUI = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Writing to front end...");
    updateContractAddresses();
    updateAbi();
    console.log("Front end written!");
  }
};

async function updateAbi() {
  const raffle = await ethers.getContract("Raffle");
  fs.writeFileSync(
    FRONTEND_ABI_FILE,
    raffle.interface.format(ethers.utils.FormatTypes.json)
  );
}

async function updateContractAddresses() {
  const raffle = await ethers.getContract("Raffle");
  const contractAddresses = JSON.parse(
    fs.readFileSync(FRONTEND_ADDRESSES_FILE, "utf8")
  );
  // @ts-ignore
  if (network.config.chainId!.toString() in contractAddresses) {
    if (
      !contractAddresses[network.config.chainId!.toString()].includes(
        raffle.address
      )
    ) {
      contractAddresses[network.config.chainId!.toString()].push(
        raffle.address
      );
    }
  } else {
    contractAddresses[network.config.chainId!.toString()] = [raffle.address];
  }

  fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(contractAddresses));
}

export default updateUI;
updateUI.tags = ["all", "frontend"];
