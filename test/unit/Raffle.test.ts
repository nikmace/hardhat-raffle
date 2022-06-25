import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";

import { Raffle, VRFCoordinatorV2Mock } from "../../typechain";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { BigNumber } from "ethers";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", () => {
      let raffle: Raffle;
      let deployer: SignerWithAddress;
      let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
      let raffleEntranceFee: BigNumber;
      let interval: BigNumber;

      beforeEach(async () => {
        if (!developmentChains.includes(network.name)) {
          throw "You need to be on a development chain to run tests";
        }

        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["all"]);

        raffle = await ethers.getContract("Raffle", deployer);

        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );

        raffleEntranceFee = await raffle.getEntranceFee();
        interval = await raffle.getInterval();
      });

      describe("constructor", () => {
        it("initializes Raffle correctly", async () => {
          const raffleState = await raffle.getRaffleState();

          assert.equal(raffleState.toString(), "0");
          assert.equal(
            interval.toString(),
            networkConfig[network.name].interval
          );
        });
      });

      describe("enterRaffle", () => {
        it("reverts when you don't pay enough", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWith(
            "Raffle__SendMoreToEnterRaffle"
          );
        });

        it("records players when they enter", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const playerFromContract = await raffle.getPlayer(0);

          assert.equal(playerFromContract, deployer.address);
        });

        it("emits event on raffle enter", async () => {
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.emit(raffle, "RaffleEnter");
        });

        it("doesn't allow entrance when raffle is calculating", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });

          // Increase the time
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          // Mine a block
          await network.provider.send("evm_mine", []);

          await raffle.performUpkeep([]);

          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.be.revertedWith("Raffle__RaffleNotOpen");
        });
      });

      describe("checkUpkeep", () => {
        it("returns false if people have't sent any EHT", async () => {
          // Increase the time
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          // Mine a block
          await network.provider.send("evm_mine", []);

          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);

          assert.isFalse(upkeepNeeded);
        });

        it("returns false if raffle is not open", async () => {
          raffle.enterRaffle({ value: raffleEntranceFee });
          // Increase the time
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          // Mine a block
          await network.provider.send("evm_mine", []);
          await raffle.performUpkeep([]);
          const raffleState = await raffle.getRaffleState();
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);

          assert.equal(raffleState.toString(), "1");
          assert.equal(upkeepNeeded, false);
        });

        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() - 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert(!upkeepNeeded);
        });

        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert(upkeepNeeded);
        });
      });

      describe("performUpkeep", () => {
        it("can only run if checkupkeep is true", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const txResponse = await raffle.performUpkeep([]);
          assert(txResponse);
        });

        it("reverts when checkupkeep is false", async () => {
          await expect(raffle.performUpkeep([])).to.be.revertedWith(
            "Raffle__UpkeepNotNeeded"
          );
        });

        it("updates the raffle state, emits an event, and calls the vrf coordinator", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });

          const txResponse = await raffle.performUpkeep([]);
          const txReceipt = await txResponse.wait(1);
          // @ts-ignore
          const requestId = txReceipt.events[1].args!.requestId;
          const raffleState = await raffle.getRaffleState();
          assert.isTrue(requestId.toNumber() > 0);
          assert.equal(raffleState.toString(), "1");
        });
      });

      describe("fulfillRandomWords", () => {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
        });

        it("can only be called after performUpkeep", async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
          ).to.be.revertedWith("nonexistent request");
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
          ).to.be.revertedWith("nonexistent request");
        });

        it("picks a winner, resets the lottery, and sends money", async () => {
          const additionalEntrants = 3;
          const startingAccountIdx = 1; // deployer = 0
          const accounts = await ethers.getSigners();

          for (let i = startingAccountIdx; i < additionalEntrants; i++) {
            const accountConnectedRaffle = raffle.connect(accounts[i]);
            await accountConnectedRaffle.enterRaffle({
              value: raffleEntranceFee,
            });
          }

          const startingTimestamp = await raffle.getLastTimeStamp();
          console.log(`Starting timestamp: ${startingTimestamp}`);

          // This will be more important for our staging tests...
          await new Promise<void>(async (resolve, reject) => {
            raffle.once("WinnerPicked", async () => {
              console.log("WinnerPicked event fired!");
              // assert throws an error if it fails, so we need to wrap
              // it in a try/catch so that the promise returns event
              // if it fails.
              try {
                // Now lets get the ending values...
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const winnerBalance = await accounts[2].getBalance();
                const endingTimeStamp = await raffle.getLastTimeStamp();

                await expect(raffle.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner.toString(), accounts[2].address);
                assert.equal(raffleState, 0);
                assert.equal(
                  winnerBalance.toString(),
                  startingBalance
                    .add(
                      raffleEntranceFee
                        .mul(additionalEntrants)
                        .add(raffleEntranceFee)
                    )
                    .toString()
                );
                assert.isTrue(endingTimeStamp > startingTimestamp);
                resolve();
              } catch (e) {
                reject(e);
              }
            });

            const tx = await raffle.performUpkeep("0x");
            const txReceipt = await tx.wait(1);
            const startingBalance = await accounts[2].getBalance();
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              txReceipt!.events![1].args!.requestId,
              raffle.address
            );
          });
        });
      });
    });
