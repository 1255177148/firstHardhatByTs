import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config as envConfig } from "@chainlink/env-enc";
envConfig();
import "@nomicfoundation/hardhat-verify";
import "./tasks";
import "@typechain/hardhat"; // 引入 TypeChain 支持,可以生成合约的 TypeScript 类型定义,在使用编译合约命令后会自动生成对应的合约typechain类型定义文件
import "hardhat-deploy"; // 引入 Hardhat Deploy 插件,可以更方便地部署合约
import dotenvFlow from "dotenv-flow";

import { ProxyAgent, setGlobalDispatcher } from "undici";

const proxyAgent = new ProxyAgent("http://127.0.0.1:7890");
setGlobalDispatcher(proxyAgent);

// 加载与当前网络对应的 .env 文件
const targetNetwork = process.env.HARDHAT_NETWORK || "hardhat";
dotenvFlow.config({ node_env: targetNetwork }); // 加载 .env.sepolia 等

const SEPOLIA_URL: any = process.env.SEPOLIA_URL;
const PRIVATE_KEY_1: any = process.env.PRIVATE_KEY_1;
const PRIVATE_KEY_2: any = process.env.PRIVATE_KEY_2;
const ETHERSCAN_API_KEY: any = process.env.ETHERSCAN_API_KEY;
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  // 配置网络
  // defaultNetwork: "sepolia",// 设置默认网络为 Sepolia
  // 这里可以配置多个网络
  networks: {
    sepolia: {
      url: SEPOLIA_URL,
      accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2],
      chainId: 11155111, // Sepolia 的链 ID,在chainlist.org上可以找到
    },
  },
  // 配置 Etherscan 验证
  // 注意：如果你没有 Etherscan API Key，可以在 Etherscan 上注册
  // 并在 https://sepolia.etherscan.io/apis 上获取 API Key
  // 这里的 apiKey 是 Etherscan 的 API Key
  // 如果你使用的是其他区块链浏览器，请根据其文档进行配置
  etherscan: {
    apiKey: ETHERSCAN_API_KEY, // Sepolia 的 Etherscan API Key,
  },
  namedAccounts: {
    deployer: {
      default: 0, // 默认使用第一个账户作为部署者
      11155111: 0, // Sepolia 网络的部署者账户
    },
    secondAccount: {
      default: 1, // 默认使用第二个账户作为第二个账户
      11155111: 1, // Sepolia 网络的第二个账户
    },
  },
};

export default config;
