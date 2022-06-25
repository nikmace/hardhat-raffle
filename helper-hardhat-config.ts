import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export interface networkConfigItem {
  ethUsdPriceFeed?: string;
  blockConfirmations?: number;
  vrfCoordinatorV2?: string;
  entranceFee?: any;
  gasLane?: string;
  subscriptionId?: string;
  callBackGasLimit?: string;
  interval?: string;
}

export interface networkConfigInfo {
  [key: string]: networkConfigItem;
}

export const networkConfig: networkConfigInfo = {
  localhost: {},
  hardhat: {
    entranceFee: "100000000000000000", // 0.01 ETH
    callBackGasLimit: "500000",
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    interval: "30",
    subscriptionId: "6971",
  },
  // Price Feed Address, values can be obtained at https://docs.chain.link/docs/reference-contracts
  // Default one is ETH/USD contract on Kovan
  rinkeby: {
    ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    blockConfirmations: 6,
    vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    entranceFee: "100000000000000000", // 0.01 ETH
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 Gwei
    subscriptionId: "6971",
    callBackGasLimit: "500000",
    interval: "30",
  },
};

export const developmentChains = ["hardhat", "localhost"];
