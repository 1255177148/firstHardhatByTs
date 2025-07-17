import hardhat from "hardhat";
import dotenvFlow from "dotenv-flow";
const { ethers } = hardhat;
async function main() {
    // 加载与当前网络对应的 .env 文件
    // 这里的 node_env 是当前网络的名称,例如 sepolia,hardhat 等
    // 这样可以确保在不同的网络上使用不同的环境变量
    dotenvFlow.config({ node_env: process.env.HARDHAT_NETWORK });
    const isLiveNetwork =
        hardhat.network.name !== "hardhat" && hardhat.network.name !== "localhost";

    // 部署 FundMe 合约
    let dataFeedAddress = process.env.dataFeedAddress;
    if (!dataFeedAddress) {
        dataFeedAddress = await hardhat.deployments.get("MockV3Aggregator").then(d => d.address);
        console.log(`Using MockV3Aggregator address: ${dataFeedAddress}`);
    }
    if (!dataFeedAddress) {
        throw new Error("dataFeedAddress is undefined. Please check your environment variables or deployment scripts.");
    }
    // 创建一个合约工厂
    const fundMe = await ethers.getContractFactory("FundMe");
    console.log("开始部署FundMe合约...");
    // 部署合约
    const fundMeContract = await fundMe.deploy(120, dataFeedAddress);
    // 等待合约部署完成
    // 下面是两种方式来等待合约部署完成
    // await fundMeContract.deployed();
    // 或者
    // await fundMeContract.waitForDeployment();
    // await fundMeContract.deployed();
    await fundMeContract.waitForDeployment();
    console.log("FundMe合约已部署到:", fundMeContract.target);
    // 如果当前网络是 Sepolia并且有 Etherscan API Key，等待5个区块确认后进行合约验证
    if (hardhat.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        // 等待5个区块确认，确保 Etherscan 可读取字节码
        console.log("等待区块确认...");
        const deploymentTx = fundMeContract.deploymentTransaction();
        if (deploymentTx) {
            await deploymentTx.wait(5);
        } else {
            throw new Error("无法获取部署交易对象，无法等待确认");
        }
        console.log("区块确认完成，开始验证合约...");
        // 验证合约
        await verifyFundMe(fundMeContract.target, [
            120 // 这是构造函数的参数
        ],
        );
    }

}

async function verifyFundMe(address: any, constructorArguments: any) {
    console.log("验证合约中...");
    await hardhat.run("verify:verify", {
        address: address,
        constructorArguments: constructorArguments,
    });
    console.log("合约验证完成");

}

// 执行主函数并处理错误
main().catch(error => {
    console.error("部署合约时出错:", error);
    process.exitCode = 1;
});