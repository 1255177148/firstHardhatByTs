/*
 * 使用 Hardhat Ignition 模块化部署 FundMe 合约
 * 该模块将自动处理环境变量和合约部署并验证
 * 确保在运行前安装 @nomicfoundation/hardhat-ignition
 * 以及 dotenv-flow
 * 使用命令: npx hardhat run ignition/modules/fundme.ts --network <network>
 */

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import dotenvFlow from "dotenv-flow";

const fundMeModule = buildModule("FundMeModule", (m) => {
    // 加载与当前网络对应的 .env 文件
    // 这里的 node_env 是当前网络的名称,例如 sepolia,hardhat 等
    // 这样可以确保在不同的网络上使用不同的环境变量
    dotenvFlow.config({ node_env: process.env.HARDHAT_NETWORK });
    // 部署 FundMe 合约
    const timelocked = process.env.timelocked
        ? parseInt(process.env.timelocked, 10)
        : 120;
    let dataFeedAddress: any = process.env.dataFeedAddress;
    let MockV3Aggregator;
    if (!dataFeedAddress) {
        MockV3Aggregator = m.contract("MockV3Aggregator", [8, 300000000000]); // 8位小数,初始价格为3000美元,部署 MockV3Aggregator 合约
        dataFeedAddress = MockV3Aggregator;
        console.log(`Using MockV3Aggregator address: ${dataFeedAddress}`);

    } else {
        MockV3Aggregator = m.contractAt("MockV3Aggregator", dataFeedAddress);// 如果已经有地址,则使用现有的 MockV3Aggregator
    }
    const args = [timelocked, dataFeedAddress]; // 构造函数参数,设置锁定时间为120秒
    const fundMe = m.contract("FundMe", args);// 部署 FundMe 合约
    return { MockV3Aggregator, fundMe };
});
export default fundMeModule;
