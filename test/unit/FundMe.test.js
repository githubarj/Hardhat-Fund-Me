const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");

describe("FundMe", () => {
    let fundMe;
    let deployer;
    let MockV3Aggregator;
    let sendValue = ethers.utils.parseEther("1"); //this unction turns the 1 ether into the right units, gwei
    beforeEach(async function () {
        //deploy our fundMe contract
        //using hardhat deploy
        //working with multiple accounts
        //const accounts = await ethers.getSigners() //returns all the accounts in the accounts array in config
        //const accountZero = accounts[0]

        deployer = (await getNamedAccounts()).deployer; ///get only deployer from getNamedAccounts
        await deployments.fixture("all"); //allows us to run everything in our deploy folder
        fundMe = await ethers.getContract("FundMe", deployer);
        MockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        );
    });

    describe("constructor", () => {
        it("Sets the aggregator addresses correctly", async function () {
            const response = await fundMe.s_priceFeed();
            assert.equal(response, MockV3Aggregator.address);
        });
    });

    describe("fund", () => {
        it("Fails if you do not send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            );
        });

        it("Updated the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue });
            const response = await fundMe.s_addressToAmountFunded(deployer);
            assert.equal(response.toString(), sendValue.toString());
        });

        it("Adds funder to array of s_funders", async function () {
            await fundMe.fund({ value: sendValue });
            const funder = await fundMe.s_funders(0);
            assert.equal(funder, deployer);
        });
    });

    describe("withdraw", () => {
        beforeEach(async function () {
            await fundMe.fund({ value: sendValue });
        }); //we need cash first to withdaw so before test we load

        it("Withdraw ETH from a single founder", async function () {
            //Arrange -set this test up
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            ); //getting balance of contract
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            //Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt; //grabbing the gas used and price from the transaction receipt

            const gasCost = gasUsed.mul(effectiveGasPrice); //multiplying two big numbers

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            ); //getting balance of contract
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            //Assert
            assert.equal(endingFundMeBalance, 0);
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(), //adding bigNumbers
                endingDeployerBalance.add(gasCost).toString()
            );
        });

        it("allows us to withdraw with multiple s_funders", async function () {
            //Arrange
            const accounts = await ethers.getSigners(); //multiple accounts
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                ); //connect accounts to the smart contract

                await fundMeConnectedContract.fund({ value: sendValue });
            }

            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            ); //getting balance of contract
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            //Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt; //grabbing the gas used and price from the transaction receipt
            const gasCost = gasUsed.mul(effectiveGasPrice); //multiplying two big numbers

            //Assert
            
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            ); //getting balance of contract
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            assert.equal(endingFundMeBalance, 0);
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(), //adding bigNumbers
                endingDeployerBalance.add(gasCost).toString()
            );

            //make sure the s_funders are reset properly 
            await expect(fundMe.s_funders(0)).to.be.reverted

           for (let i = 1; i < 6; i++) {
            assert.equal(await fundMe.s_addressToAmountFunded(accounts[i].address), 0)
           }

        });

        it("Only allows the owner to withdraw", async function(){
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedContract = await fundMe.connect(attacker) //connectimg account to contract

            await expect(
                attackerConnectedContract.withdraw()
            ).to.be.revertedWith("FundMe__NotOwner");

        })

         it("cheaperWithdraw testing....", async function () {
             //Arrange
             const accounts = await ethers.getSigners(); //multiple accounts
             for (let i = 1; i < 6; i++) {
                 const fundMeConnectedContract = await fundMe.connect(
                     accounts[i]
                 ); //connect accounts to the smart contract

                 await fundMeConnectedContract.fund({ value: sendValue });
             }

             const startingFundMeBalance = await fundMe.provider.getBalance(
                 fundMe.address
             ); //getting balance of contract
             const startingDeployerBalance = await fundMe.provider.getBalance(
                 deployer
             );

             //Act
             const transactionResponse = await fundMe.cheaperWithdraw();
             const transactionReceipt = await transactionResponse.wait(1);
             const { gasUsed, effectiveGasPrice } = transactionReceipt; //grabbing the gas used and price from the transaction receipt
             const gasCost = gasUsed.mul(effectiveGasPrice); //multiplying two big numbers

             //Assert

             const endingFundMeBalance = await fundMe.provider.getBalance(
                 fundMe.address
             ); //getting balance of contract
             const endingDeployerBalance = await fundMe.provider.getBalance(
                 deployer
             );

             assert.equal(endingFundMeBalance, 0);
             assert.equal(
                 startingFundMeBalance.add(startingDeployerBalance).toString(), //adding bigNumbers
                 endingDeployerBalance.add(gasCost).toString()
             );

             //make sure the s_funders are reset properly
             await expect(fundMe.s_funders(0)).to.be.reverted;

             for (let i = 1; i < 6; i++) {
                 assert.equal(
                     await fundMe.s_addressToAmountFunded(accounts[i].address),
                     0
                 );
             }
         });
    });
});
