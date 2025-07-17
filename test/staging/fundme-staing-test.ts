import { ethers, deployments, getNamedAccounts, network } from "hardhat";
import { assert, expect } from "chai";
import { FundMe } from "../../typechain-types/contracts";
import dotenvFlow from "dotenv-flow";
import { sleep } from "../../utils/time";

dotenvFlow.config({ node_env: process.env.HARDHAT_NETWORK });
const isLiveNetwork =
    network.name !== "hardhat" && network.name !== "localhost";
!isLiveNetwork ? describe.skip : describe("FundMe", function () {
    let fundme: FundMe;
    let fundmeSecond: FundMe;
    let firstAccount: string;
    let secoundAccount: string;
    // 在每个测试之前部署 FundMe 合约
    beforeEach(async function () {
        await deployments.fixture(["fundme"]); // 部署 FundMe 合约
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

    it("测试筹款和提款功能", async function () {
        // 筹款 0.14 ETH
        const fundAmount = ethers.parseEther("0.14");
        await (await fundme.fund({ value: fundAmount })).wait(); // 筹款0.14 ETH
        await sleep(121000); // 等待121秒
        const initialBalance = await ethers.provider.getBalance(firstAccount);
        console.log("Initial Balance:", initialBalance.toString());
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
            initialBalance + BigInt(fundAmount) - gasUsed;
        console.log("Expected Final Balance:", expectedFinalBalance.toString());

        // 实际余额变化 = final - initial
        const actualBalanceChange = finalBalance - initialBalance;

        // 期望变化 = 募资金额 - gas 花费
        const expectedBalanceChange = fundAmount - gasUsed;
        // 允许误差范围（如15,000 wei）
        const maxAllowedError = BigInt(15000);
        const diff = actualBalanceChange - expectedBalanceChange;
        // 断言允许误差
        assert(
            diff >= -maxAllowedError && diff <= maxAllowedError,
            `提取募资失败，余额未正确增加：差值为 ${diff.toString()} wei`
        );
    });

    it("测试正常的退款功能", async function () {
        await fundme.fund({ value: ethers.parseEther("0.04") });
        await sleep(121000); // 等待121秒
        const refundTx = await fundme.refund();
        const refundReceipt = await refundTx.wait(); // 等待交易完成
        expect(refundReceipt)
            .to.be.emit(fundme, "RefundByFunder")
            .withArgs(firstAccount, ethers.parseEther("0.04"));
    });
});
