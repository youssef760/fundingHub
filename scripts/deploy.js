const { ethers } = require('hardhat')
const fs = require('fs')

async function main() {
  const maxSupply = 99
  const baseURI =
    'https://ipfs.io/ipfs/QmTWbe9wDns7aqZQNCuWh5PqybGbBF91kngC5Zf8qmCoyg/'
  const stageOneMax = 30
  const stageTwoMax = 50
  const airdropMax = 19

  const Contract = await ethers.getContractFactory('DappMint')
  ;[deployer] = await ethers.getSigners()
  const smart_contract_admin_account = deployer.address

  const contract = await Contract.deploy(
    baseURI,
    maxSupply,
    stageOneMax,
    stageTwoMax,
    airdropMax,
    smart_contract_admin_account
  )

  await contract.deployed()

  const address = JSON.stringify({ address: contract.address }, null, 4)

  fs.writeFile('./src/abis/contractAddress.json', address, 'utf8', (error) => {
    if (error) {
      console.log(error)
      return
    }
    console.log('Deployed contract address: ', contract.address)
  })
}

main().catch((error) => {
  console.log(error)
  process.exitCode = 1
})
