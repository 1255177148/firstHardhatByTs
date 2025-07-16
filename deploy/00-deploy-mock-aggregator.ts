import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployMockAggregator = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const isLiveNetwork =
    network.name !== "hardhat" && network.name !== "localhost";
  if (isLiveNetwork) {
    console.warn(
      "MockV3Aggregator should not be deployed on live networks. Skipping deployment."
    );
    return; // 如果是主网或测试网,则不部署 MockV3Aggregator
  }
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  // 部署 MockV3Aggregator 合约
  const args = [8, 300000000000]; // 8位小数,初始价格为3000美元
  const MockV3Aggregator = await deploy("MockV3Aggregator", {
    from: deployer,
    args: args, // 构造函数参数
    log: true,
    waitConfirmations: isLiveNetwork ? 5 : 1, // 如果是主网或测试网,等待5个区块确认,否则等待1个区块确认
    // 如果需要设置其他部署选项，可以在这里添加
  });

  console.log(
    `MockV3Aggregator deployed at address: ${MockV3Aggregator.address}`
  );
  // 部署后手动调用验证插件
  if (isLiveNetwork) {
    console.log(`Verifying contract on ${network.name}...`);
    await hre.run("verify:verify", {
      address: MockV3Aggregator.address,
      constructorArguments: args, // 构造函数参数
    });
    console.log(`Contract verified on ${network.name}`);
  }
};

export default deployMockAggregator;
deployMockAggregator.tags = ["all", "mock-aggregator"]; // 添加标签,可以在部署时使用
