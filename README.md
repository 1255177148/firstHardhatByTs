# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```
## 配置文件加密
可以使用 
```shell
npx env-enc set-pw
```
来设置配置文件的加密密码,然后将配置文件中要加密的变量写入.env.enc文件里
```shell
npx env-enc set
```
## 编译合约
```shell
npx hardhat compile
```
## 配置network，使用sepolia测试网环境部署合约
先使用alchemy网站创建一个network url，然后在hardhat.config.js中配置好这个network
## 部署合约
先在scripts文件夹里新建一个部署合约的js脚本
然后使用命令：
```shell
npx hardhat run scripts/写的部署js脚本 --network sepolia
```
## 验证并公布合约源代码
先下载hardhat提供的插件
```shell
npm install --save-dev @nomicfoundation/hardhat-verify
```
然后在hardhat.config.js中导入
require("@nomicfoundation/hardhat-verify");
然后在etherscan.io网站中登录，并设置好一个apiKey，然后在hardhat中将这个apiKey配置好,
然后输入命令:
```shell
npx hardhat verify --network sepolia 部署好要验证的合约地址 "合约构造函数的参数"
```