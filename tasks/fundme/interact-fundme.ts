import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { FundMe } from "../../typechain-types/contracts";


task("interact-fundme", "与FundMe合约交互", async (args: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const fundMe: FundMe = await ethers.getContractAt("FundMe", args.address) as FundMe; // 使用typechain类型的合约实例
    const [firstAccount, secondAccount] = await ethers.getSigners();// 获取第一个和第二个账户
    // 使用第一个账户调用fund方法
    console.log("使用账户:", firstAccount.address, "与合约交互");
    const fundTx = await fundMe.fund({ value: ethers.parseEther("0.04") });
    await fundTx.wait();
    console.log("捐款成功，交易哈希:", fundTx.hash);
    // 查看合约的余额
    const balance = await ethers.provider.getBalance(fundMe.target);
    console.log("合约当前余额:", ethers.formatEther(balance), "ETH");
    // 使用第二个账户调用fund方法
    console.log("使用账户:", secondAccount.address, "与合约交互");
    const fundTx2 = await fundMe.connect(secondAccount).fund({ value: ethers.parseEther("0.08") });
    await fundTx2.wait();
    console.log("捐款成功，交易哈希:", fundTx2.hash);
    // 查看合约的余额
    const balance2 = await ethers.provider.getBalance(fundMe.target);
    console.log("合约当前余额:", ethers.formatEther(balance2), "ETH");

    // 查看第一个账户的捐款金额
    fundMe.addressToAmountFunded(firstAccount.address).then(amount => {
        console.log("第一个账户捐款金额:", ethers.formatEther(amount), "ETH");
    });
    // 查看第二个账户的捐款金额
    const secondAccountAmount = await fundMe.addressToAmountFunded(secondAccount.address);
    console.log("第二个账户捐款金额:", ethers.formatEther(secondAccountAmount), "ETH");

    // 提现
    console.log("使用账户:", firstAccount.address, "提现");
    const getFundsTx = await fundMe.getFund();
    await getFundsTx.wait();
    console.log("提现成功，交易哈希:", getFundsTx.hash);
    // 查看合约的余额
    const finalBalance = await ethers.provider.getBalance(fundMe.target);
    console.log("合约当前余额:", ethers.formatEther(finalBalance), "ETH");
    // 查看第一个账户的余额
    const firstAccountBalance = await ethers.provider.getBalance(firstAccount.address);
    console.log("第一个账户当前余额:", ethers.formatEther(firstAccountBalance), "ETH");
    // 查看第二个账户的余额
    const secondAccountBalance = await ethers.provider.getBalance(secondAccount.address);
    console.log("第二个账户当前余额:", ethers.formatEther(secondAccountBalance), "ETH");
}).addParam("address", "FundMe合约的地址");