import { ethers } from "hardhat";
import { assert } from "chai";
import { FundMe } from "../typechain-types/contracts";

describe("FundMe", function () {
  it("test if the owner is msg.sender", async function () {
    const FundMeFactory = await ethers.getContractFactory("FundMe");
    const fundMe : FundMe = await FundMeFactory.deploy(1200);
    await fundMe.waitForDeployment();
    const [firstAccount] = await ethers.getSigners();
    assert.equal((await fundMe.getOwner()), firstAccount.address, "Owner is not msg.sender");
  });
});