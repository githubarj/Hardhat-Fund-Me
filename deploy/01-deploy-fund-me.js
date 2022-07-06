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
module.exports = async ({ getNamedAccounts, deployments }) => {
   const { deploy, log } = deployments //pulling htse two functions out of deployment
   const { deployer } = await getNamedAccounts()
   const chainId = network.config.chaindId //we grab our chainid
}