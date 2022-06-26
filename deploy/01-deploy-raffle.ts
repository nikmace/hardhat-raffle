import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { VRFCoordinatorV2Mock } from "../typechain";
import verify from "../utils/verify";

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2");

const deployFundMe: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  let vrfCoordinatorV2Address;
  let subscriptionId;

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );

    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;

    const txResponse = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await txResponse.wait(1);
    // Get the subscription ID and fund the subscription
    // @ts-ignore
    subscriptionId = ethers.BigNumber.from(
      // @ts-ignore
      txReceipt.events[0].topics[1]
    );

    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      VRF_SUB_FUND_AMOUNT
    );
  } else {
    vrfCoordinatorV2Address = networkConfig[network.name].vrfCoordinatorV2;
    subscriptionId = networkConfig[network.name].subscriptionId;
  }

  const entraceFee = networkConfig[network.name].entranceFee;
  const gasLane = networkConfig[network.name].gasLane;
  const callBackGasLimit = networkConfig[network.name].callBackGasLimit;
  const interval = networkConfig[network.name].interval;

  const args = [
    vrfCoordinatorV2Address,
    subscriptionId,
    gasLane,
    interval,
    entraceFee,
    callBackGasLimit,
  ];

  try {
    const raffle = await deploy("Raffle", {
      from: deployer,
      args,
      log: true,
      waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    });

    log(`Raffle deployed at ${raffle.address}`);

    if (
      !developmentChains.includes(network.name) &&
      process.env.ETHERSCAN_API_KEY
    ) {
      log("Verifying contract... please wait...");
      await verify(raffle.address, args);
    }
  } catch (e) {
    console.log(e);
  }

  log("----------------------------------------");
};

export default deployFundMe;
deployFundMe.tags = ["all", "Raffle"];
