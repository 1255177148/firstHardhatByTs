import { HardhatRuntimeEnvironment } from "hardhat/types";
import dotenvFlow from "dotenv-flow"

const deployFundMe = async (hre: HardhatRuntimeEnvironment) => {
  // 加载与当前网络对应的 .env 文件
  // 这里的 node_env 是当前网络的名称,例如 sepolia,hardhat 等
  // 这样可以确保在不同的网络上使用不同的环境变量
  dotenvFlow.config({ node_env: process.env.HARDHAT_NETWORK });
  
  // getNamedAccounts:获取命名账户,在 hardhat.config.ts 中配置的账户
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const isLiveNetwork =
    network.name !== "hardhat" && network.name !== "localhost";

  // 部署 FundMe 合约
  let dataFeedAddress = process.env.dataFeedAddress;
  if (!dataFeedAddress) {
    dataFeedAddress = await deployments.get("MockV3Aggregator").then(d => d.address);
    console.log(`Using MockV3Aggregator address: ${dataFeedAddress}`);
  }
  const args = [1200, dataFeedAddress]; // 构造函数参数,设置锁定时间为1200秒
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // 构造函数参数
    log: true,
    waitConfirmations: isLiveNetwork ? 5 : 1, // 如果是主网或测试网,等待5个区块确认,否则等待1个区块确认
    // 如果需要设置其他部署选项，可以在这里添加
  });
  console.log(`FundMe deployed at address: ${fundMe.address}`);
  // 部署后手动调用验证插件
  if (isLiveNetwork) {
    console.log(`Verifying contract on ${network.name}...`);
    await hre.run("verify:verify", {
      address: fundMe.address,
      constructorArguments: args, // 构造函数参数
    });
    console.log(`Contract verified on ${network.name}`);
  }
};

export default deployFundMe;
deployFundMe.tags = ["all", "fundme"]; // 添加标签,可以在部署时使用
