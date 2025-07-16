import { ethers, deployments, getNamedAccounts } from "hardhat";
import { assert, expect } from "chai";
import { FundMe } from "../typechain-types/contracts";
import dotenvFlow from "dotenv-flow"
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";

dotenvFlow.config({ node_env: process.env.HARDHAT_NETWORK });

describe("FundMe", function () {
  let fundme: FundMe;
  let firstAccount: string;
  // 在每个测试之前部署 FundMe 合约
  beforeEach(async function () {
    await deployments.fixture(["mock-aggregator", "fundme"]); // 部署 FundMe 合约
    const fundmeAddress = (await deployments.get("FundMe")).address;
    fundme = await ethers.getContractAt("FundMe", fundmeAddress);
    firstAccount = (await getNamedAccounts()).deployer; // 获取部署者账户
  })
  it("test if the owner is msg.sender", async function () {
    await fundme.waitForDeployment();
    assert.equal((await fundme.getOwner()), firstAccount, "Owner is not msg.sender");
  });
  it("在窗口关闭时是否还能继续募资", async function () {
    await time.increase(1400); // 增加时间到锁定期结束
    await mine(); // 挖掘一个区块,确保时间更新
    expect(fundme.fund({ value: ethers.parseEther("0.04") })).to.be.revertedWith("众筹窗口已关闭");
  });
});