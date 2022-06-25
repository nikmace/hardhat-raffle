## The problem

Hello, the error is very strange, I've checked everything several times, plus I'm using typescript. The error occurs when I try to deploy raffle contract.

```ts
const raffle = await deploy("Raffle", {
  from: deployer,
  args,
  log: true,
  waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
});
```

Here is the output when I run `hh deploy`:

```shell
Nothing to compile
No need to generate any newer typings.
Local network detected! Deploying mocks...
deploying "VRFCoordinatorV2Mock" (tx: 0xfbe643b9065492ba41fa088f50f3ad78f0d8057a59b10745b2f30782602f99aa)...:
deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3 with 1803934 gas
Mocks deployed!
--------------------------------------------
You are deploying to a local network, you'll need a local network running to interact
Please run `yarn hardhat console --network localhost` to interact with the deployed smart contracts!
----------------------------------
Error: expected 0 constructor arguments, got 6
    at _deploy (/home/nkmcntsh/web3-course/smartcontract-ruffle/node_modules/hardhat-deploy/src/helpers.ts:577:13)
    at processTicksAndRejections (node:internal/process/task_queues:96:5)
    at runNextTicks (node:internal/process/task_queues:65:3)
    at listOnTimeout (node:internal/timers:528:9)
    at processTimers (node:internal/timers:502:7)
    at async _deployOne (/home/nkmcntsh/web3-course/smartcontract-ruffle/node_modules/hardhat-deploy/src/helpers.ts:1004:16)
    at async Object.deployFundMe [as func] (/home/nkmcntsh/web3-course/smartcontract-ruffle/deploy/01-deploy-raffle.ts:63:20)
    at async DeploymentsManager.executeDeployScripts (/home/nkmcntsh/web3-course/smartcontract-ruffle/node_modules/hardhat-deploy/src/DeploymentsManager.ts:1219:22)
    at async DeploymentsManager.runDeploy (/home/nkmcntsh/web3-course/smartcontract-ruffle/node_modules/hardhat-deploy/src/DeploymentsManager.ts:1052:5)
    at async SimpleTaskDefinition.action (/home/nkmcntsh/web3-course/smartcontract-ruffle/node_modules/hardhat-deploy/src/index.ts:438:5)
----------------------------------------
```

I am getting all the args correctly (I hope so):

```ts
[
  '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  BigNumber { _hex: '0x2386f26fc10000', _isBigNumber: true },
  '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
  BigNumber { _hex: '0x01', _isBigNumber: true },
  '500000',
  '30'
]
```

## Here are my files

**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist"
  },
  "include": ["./scripts", "./test", "./deploy", "./deploy-helpers"],
  "files": ["./hardhat.config.ts", "./helper-hardhat-config.ts"]
}
```

**hardhat.config.ts**

```ts
import * as dotenv from "dotenv";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import "dotenv/config";
import "solidity-coverage";
import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const RINKEBY_RPC_URL =
  process.env.RINKEBY_RPC_URL ||
  "https://eth-mainnet.alchemyapi.io/v2/your-api-key";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    rinkeby: {
      url: RINKEBY_RPC_URL,
      chainId: 4,
      accounts: [PRIVATE_KEY],
      // @ts-ignore
      blockConfirmations: 6,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
  },
};

export default config;
```

**helper-hardhat-config.ts**

```ts
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export interface networkConfigItem {
  ethUsdPriceFeed?: string;
  blockConfirmations?: number;
  vrfCoordinatorV2?: string;
  entranceFee?: BigNumber;
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
    entranceFee: ethers.utils.parseEther("0.01"),
    callBackGasLimit: "500000",
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    interval: "30",
  },
  // Price Feed Address, values can be obtained at https://docs.chain.link/docs/reference-contracts
  // Default one is ETH/USD contract on Kovan
  rinkeby: {
    ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    blockConfirmations: 6,
    vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    entranceFee: ethers.utils.parseEther("0.01"),
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    subscriptionId: "0",
    callBackGasLimit: "500000",
    interval: "30",
  },
};

export const developmentChains = ["hardhat", "localhost"];
export const DECIMALS = 8;
export const INITIAL_ANSWER = 200000000000;
```

**00-deploy-mocks.ts**

```ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

import { developmentChains } from "../helper-hardhat-config";

const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_LINK = 1e9;

const deployMocks: DeployFunction = async function deployFunc(
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  const args = [BASE_FEE, GAS_PRICE_LINK];

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...");
    await deploy("VRFCoordinatorV2Mock", {
      contract: "VRFCoordinatorV2Mock",
      from: deployer,
      log: true,
      args,
    });
    log("Mocks deployed!");
    log("--------------------------------------------");

    log(
      "You are deploying to a local network, you'll need a local network running to interact"
    );
    log(
      "Please run `yarn hardhat console --network localhost` to interact with the deployed smart contracts!"
    );
    log("----------------------------------");
  }
};

export default deployMocks;
deployMocks.tags = ["all", "mocks"];
```

**01-deploy-raffle.ts**

```ts
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
    subscriptionId = txReceipt.events[0].args!.subId;

    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      VRF_SUB_FUND_AMOUNT
    );
  } else {
    vrfCoordinatorV2Address = networkConfig[network.name].vrfCoordinatorV2;
    subscriptionId = networkConfig[network.name].subscriptionId;
  }
  //   address vrfCoordinatorV2, // Contract address
  //     uint256 entraceFee,
  //     bytes32 gasLane,
  //     uint64 subscriptionId,
  //     uint32 callbackGasLimit,
  //     uint256 interval
  const entraceFee = networkConfig[network.name].entranceFee;
  const gasLane = networkConfig[network.name].gasLane;
  const callBackGasLimit = networkConfig[network.name].callBackGasLimit;
  const interval = networkConfig[network.name].interval;

  const args = [
    vrfCoordinatorV2Address,
    entraceFee,
    gasLane,
    subscriptionId,
    callBackGasLimit,
    interval,
  ];

  console.log(args);

  try {
    const raffle = await deploy("Raffle", {
      from: deployer,
      args,
      log: true,
      waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    });

    log(`FundMe deployed at ${raffle.address}`);

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
```

**Raffle.sol**

```ts
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Chainlink Oracle -> Randomness, Automated Execution (Chainlink Keeper)
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

error Raffle__NotEnoughEthEntered();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(
  uint256 currentBalance,
  uint256 numPlayers,
  uint256 raffleState
);

/**
 * @title A sample Raffle Lottery Contract
 * @author nikmace
 * @notice This contract is for creating an untamperable decentralized smart contract
 * @dev This implements Chainlink VRF v2 & Chainlink Keepers
 */
abstract contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
  enum RaffleState {
    OPEN,
    CALCULATING
  }

  // State variables
  uint256 private immutable i_entranceFee;
  address payable[] private s_players;
  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  bytes32 private immutable i_gasLane;
  uint64 private immutable i_subscriptionId;
  uint32 private immutable i_callbackGasLimit;

  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint32 private constant NUM_WORDS = 1;

  // Lottery variables
  address private s_recentWinner;
  RaffleState private s_raffleState;
  uint256 private s_lastTimeStamp;
  uint256 private immutable i_interval;

  // Events
  event RaffleEnter(address indexed player);
  event RequestedRaffleWinner(uint256 indexed requestId);
  event WinnerPicked(address indexed winner);

  constructor(
    address vrfCoordinatorV2, // Contract address
    uint256 entraceFee,
    bytes32 gasLane,
    uint64 subscriptionId,
    uint32 callbackGasLimit,
    uint256 interval
  ) VRFConsumerBaseV2(vrfCoordinatorV2) {
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_entranceFee = entraceFee;
    i_gasLane = gasLane;
    i_subscriptionId = subscriptionId;
    i_callbackGasLimit = callbackGasLimit;
    s_raffleState = RaffleState.OPEN;
    s_lastTimeStamp = block.timestamp;
    i_interval = interval;
  }

  function enterRaffle() public payable {
    if (msg.value < i_entranceFee) revert Raffle__NotEnoughEthEntered();

    if (s_raffleState == RaffleState.OPEN) revert Raffle__NotOpen();

    s_players.push(payable(msg.sender));
    // Emit an event when we update a dynamic array or mapping
    emit RaffleEnter(msg.sender);
  }

  /**
   * @dev This is the function that the Chainlink Keeper nodes call
   * they look for the `upkeepNeeded` to return true.
   * The following should be true in order to return true:
   * 1. Our time interval should have passed
   * 2. The lottery should have at least 1 player, and have some ETH
   * 3. Our subscription is funded with LINK
   * 4. The lottery should be in an `open` state
   */
  function checkUpkeep(
    bytes memory /* checkData */
  )
    public
    override
    returns (
      bool upkeepNeeded,
      bytes memory /** performData */
    )
  {
    bool isOpen = (RaffleState.OPEN == s_raffleState);
    bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
    bool hasPlayers = (s_players.length > 0);
    bool hasBalance = (address(this).balance > 0);
    bool upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);

    return (upkeepNeeded, "0x0");
  }

  function performUpkeep(
    bytes calldata /** performData */
  ) external override {
    // Request the number
    // Do something with the number
    // 2 transaction process
    (bool upkeepNeeded, ) = checkUpkeep("");

    if (!upkeepNeeded)
      revert Raffle__UpkeepNotNeeded(
        address(this).balance,
        s_players.length,
        uint256(s_raffleState)
      );

    s_raffleState = RaffleState.CALCULATING;

    uint256 requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane, // gasLane
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NUM_WORDS
    );
    emit RequestedRaffleWinner(requestId);
  }

  function fulfillRandomWords(
    uint256, /*requestId */
    uint256[] memory randomWords
  ) internal override {
    uint256 idxOfWinner = randomWords[0] % s_players.length;
    address payable recentWinner = s_players[idxOfWinner];

    s_recentWinner = recentWinner;
    s_raffleState = RaffleState.OPEN;
    s_players = new address payable[](0);
    s_lastTimeStamp = block.timestamp;

    (bool success, ) = recentWinner.call{ value: address(this).balance }("");

    if (!success) revert Raffle__TransferFailed();

    emit WinnerPicked(recentWinner);
  }

  // View/pure functions
  function getEntranceFee() public view returns (uint256) {
    return i_entranceFee;
  }

  function getPlayers(uint256 playerIdx) public view returns (address) {
    return s_players[playerIdx];
  }

  function getRecentWinner() public view returns (address) {
    return s_recentWinner;
  }

  function getRaffleState() public view returns (RaffleState) {
    return s_raffleState;
  }

  function getNumWords() public pure returns (uint32) {
    return NUM_WORDS;
  }

  function getNumberOfPlayers() public view returns (uint256) {
    return s_players.length;
  }

  function getLatestTimeStamp() public view returns (uint256) {
    return s_lastTimeStamp;
  }

  function getRequestConfirmations() public pure returns (uint256) {
    return REQUEST_CONFIRMATIONS;
  }
}
```

I've searched on the web and here, but found no solution. It's very strange that it says it needs 0 arguments.

If someone understands how to solve this, thanks in advance!
