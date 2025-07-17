import { ethers, deployments, getNamedAccounts, network } from "hardhat";
import { assert, expect } from "chai";
import { FundMe } from "../../typechain-types/contracts";
import dotenvFlow from "dotenv-flow";
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";

dotenvFlow.config({ node_env: process.env.HARDHAT_NETWORK });
const isLiveNetwork =
  network.name !== "hardhat" && network.name !== "localhost";
isLiveNetwork ? describe.skip : describe("FundMe", function () {
  let fundme: FundMe;
  let fundmeSecond: FundMe;
  let firstAccount: string;
  let secoundAccount: string;
  // 在每个测试之前部署 FundMe 合约
  beforeEach(async function () {
    await deployments.fixture(["mock-aggregator", "fundme"]); // 部署 FundMe 合约
    const fundmeAddress = (await deployments.get("FundMe")).address;
    fundme = await ethers.getContractAt("FundMe", fundmeAddress);
    const accounts = await getNamedAccounts(); // 获取部署者和第二个账户
    firstAccount = accounts.deployer;
    secoundAccount = accounts.secondAccount;
    fundmeSecond = await ethers.getContractAt(
      "FundMe",
      fundmeAddress,
      await ethers.getSigner(secoundAccount)
    );
  });

  it("test if the owner is msg.sender", async function () {
    await fundme.waitForDeployment();
    assert.equal(
      await fundme.getOwner(),
      firstAccount,
      "Owner is not msg.sender"
    );
  });

  it("在窗口关闭时是否还能继续募资", async function () {
    await time.increase(1400); // 增加时间到锁定期结束
    await mine(); // 挖掘一个区块,确保时间更新
    expect(
      fundme.fund({ value: ethers.parseEther("0.04") })
    ).to.be.revertedWith("众筹窗口已关闭");
  });

  it("测试募资功能", async function () {
    await fundme.fund({ value: ethers.parseEther("0.04") });
    const balance = await fundme.getFundersToAmount(firstAccount);
    assert.equal(
      balance.toString(),
      ethers.parseEther("0.04").toString(),
      "募资金额不正确"
    );
    await fundmeSecond.fund({ value: ethers.parseEther("0.04") });
    const secondBalance = await fundme.getFundersToAmount(secoundAccount);
    assert.equal(
      secondBalance.toString(),
      ethers.parseEther("0.04").toString(),
      "募资金额不正确"
    );
  });

  it("测试提取募资功能", async function () {
    const startBalance = await ethers.provider.getBalance(firstAccount);
    console.log("Start Balance:", startBalance.toString());
    const fundtx = await fundme.fund({ value: ethers.parseEther("0.2") });
    const fundReceipt = await fundtx.wait(); // 等待交易完成
    if (!fundReceipt) {
      throw new Error("Transaction receipt is null");
    }
    const fundgasUsed = fundReceipt.gasUsed; // 实际使用的 gas 单位数量（比如用了 21,000 或 54,000）
    const effectiveFundGasPrice = BigInt(
      (fundtx.gasPrice ?? (fundReceipt as any).effectiveGasPrice).toString()
    ); // 实际交易时你为每个 gas 单位支付的价格（单位是 wei）
    const fundGasCost = fundgasUsed * effectiveFundGasPrice; // 计算实际消耗的 gas 费用
    console.log("Gas Used for fund:", fundGasCost.toString());
    const initialBalance = await ethers.provider.getBalance(firstAccount);
    console.log("Initial Balance:", initialBalance.toString());
    await time.increase(1400); // 增加时间到锁定期结束
    await mine(); // 挖掘一个区块,确保时间更新
    const getFundTx = await fundme.getFund();
    const getFundReceipt = await getFundTx.wait(); // 等待交易完成
    if (!getFundReceipt) {
      throw new Error("Transaction receipt is null");
    }
    const effectiveGasPrice = BigInt(
      (
        getFundTx.gasPrice ?? (getFundReceipt as any).effectiveGasPrice
      ).toString()
    ); // 实际交易时你为每个 gas 单位支付的价格（单位是 wei
    const gasUsed = getFundReceipt.gasUsed * effectiveGasPrice; // 计算实际消耗的 gas 费用
    console.log("Gas Used for getFund:", gasUsed.toString());

    const finalBalance = await ethers.provider.getBalance(firstAccount);
    console.log("Final Balance:", finalBalance.toString());
    const expectedFinalBalance =
      initialBalance + BigInt(ethers.parseEther("0.2")) - gasUsed;
    console.log("Expected Final Balance:", expectedFinalBalance.toString());
    assert.equal(
      finalBalance.toString(),
      expectedFinalBalance.toString(),
      "提取募资失败，余额未增加"
    );
  });

  it("测试退款的提款校验功能", async function () {
    await fundme.fund({ value: ethers.parseEther("0.2") });
    await time.increase(1400); // 增加时间到锁定期结束
    await mine(); // 挖掘一个区块,确保时间更新
    await fundme.getFund(); // 提取募资
    expect(fundme.refund()).to.be.revertedWith("生产商已提款，不能退款");
  });

  it("测试退款的锁定期校验功能", async function () {
    await fundme.fund({ value: ethers.parseEther("0.2") });
    expect(fundme.refund()).to.be.revertedWith("众筹窗口未关闭，不能退款");
  });

  it("测试没有众筹过的地址退款功能", async function () {
    await fundme.fund({ value: ethers.parseEther("0.2") });
    await time.increase(1400); // 增加时间到锁定期结束
    await mine(); // 挖掘一个区块,确保时间更新
    expect(fundme.refund()).to.be.revertedWith("没有众筹过");
  });

  it("测试正常的退款功能", async function () {
    await fundme.fund({ value: ethers.parseEther("0.05") });
    await time.increase(1400); // 增加时间到锁定期结束
    await mine(); // 挖掘一个区块,确保时间更新
    expect(fundme.refund())
      .to.be.emit(fundme, "RefundByFunder")
      .withArgs(firstAccount, ethers.parseEther("0.05"));
  });
});
