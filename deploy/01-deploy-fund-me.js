/* Traditionally we did:
imports
main
calling of main */

// function deployFunc (hre) {
//     console.log("Hi!")
// }

// module.exports.default =  deployFunc();//export the above function as the defalt function for hardhat to look for

// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre //pull these exact variables from hre
// }

// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig

const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config"); //easy way to pull just networkconfig from the helper file
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments; //pulling these two functions out of deployment
    const { deployer } = await getNamedAccounts(); //getting our deployer acount from the getNamed accounts function
    const chainId = network.config.chainId; //we grab our chainid

    //what happens when we want to change chain?
    //use ifchain id is xx use y if chain id is y use x
    //  const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]; //it will assign the usdpricefeed contract address according to chain
    //when going for localhost or hardhat we want to use a mock
    //so if the contract doesen't exists, we used a  minimal version for local testing

    let ethUsdPriceFeedAddress; //declare using let so we can change it

    if (developmentChains.includes(network.name)) {
        //get the most recent deployment
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer, //who is running it
        args: args, //put the price feed address
        log: true, //prints a couple of information
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    //verification,checking if on a testnet
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        //VERIFY
        await verify(fundMe.address, args);
    }

    log("----------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
