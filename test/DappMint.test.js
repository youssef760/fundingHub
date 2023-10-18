const { expect } = require('chai')
const { ethers } = require('hardhat')

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

const getBalance = async (walletAddress) => {
  return new Promise(async (resolve, reject) => {
    const provider = new ethers.providers.JsonRpcProvider(
      'http://localhost:8545'
    )
    await provider
      .getBalance(walletAddress)
      .then((balanceInWei) => resolve(balanceInWei))
      .catch((error) => reject(error))
  })
}

describe('Dapp Mint NFT', () => {
  let Contract, contract, result

  const name = 'Dapp Mint NFT'
  const symbol = 'DM'
  const maxSupply = 10
  const baseURI =
    'https://ipfs.io/ipfs/QmTWbe9wDns7aqZQNCuWh5PqybGbBF91kngC5Zf8qmCoyg/'
  const maxMintPerTime = 4
  const stageOneMax = 4
  const stageTwoMax = 6
  const airdropMax = 5
  const numOfMints = 1
  const stageOneCost = toWei(0.02)
  const stageTwoCost = toWei(0.04)
  const newCost = toWei(0.1)
  const stageOne = 1
  const stageTwo = 2

  beforeEach(async () => {
    Contract = await ethers.getContractFactory('DappMint')
    ;[deployer, minter, minter2] = await ethers.getSigners()

    contract = await Contract.deploy(
      baseURI,
      maxSupply,
      stageOneMax,
      stageTwoMax,
      airdropMax,
      deployer.address
    )

    await contract.deployed()
  })

  describe('Deployment', () => {
    it('Should confirm ERC721 info', async () => {
      result = await contract.name()
      expect(result).to.be.equal(name)
      result = await contract.symbol()
      expect(result).to.be.equal(symbol)
    })

    it('Should confirm deployer', async () => {
      result = await contract.owner()
      expect(result).to.be.equal(deployer.address)
    })
    it('Should confirm BaseURI', async () => {
      result = await contract.baseURI()
      expect(result).to.be.equal(baseURI)
    })
    it('Should confirm stage capacities', async () => {
      result = await contract.maxSupply()
      expect(result).to.be.equal(maxSupply)
      result = await contract.stageOneMax()
      expect(result).to.be.equal(stageOneMax)
      result = await contract.stageTwoMax()
      expect(result).to.be.equal(stageTwoMax)
      result = await contract.airdropMax()
      expect(result).to.be.equal(airdropMax)
      result = await contract.maxMintPerTime()
      expect(result).to.be.equal(maxMintPerTime)
    })
    it('Should confirm stage minting cost', async () => {
      result = await contract.stageOneCost()
      expect(result).to.be.equal(stageOneCost)
      result = await contract.stageTwoCost()
      expect(result).to.be.equal(stageTwoCost)
    })
  })

  describe('Stage One Minting', () => {
    beforeEach(async () => {
      await contract.pause(false, stageOne)

      for (let i = 1; i <= stageOneMax; i++) {
        await contract.connect(minter).mintNFT(numOfMints, stageOne, {
          value: stageOneCost,
        })
      }
    })

    it('Should confirm stage one minting', async () => {
      result = await contract.getMintedNfts()
      expect(result).to.have.lengthOf(stageOneMax)
    })
  })

  describe('Stage Two Minting', () => {
    beforeEach(async () => {
      await contract.pause(false, stageTwo)

      for (let i = 1; i <= stageTwoMax; i++) {
        await contract.connect(minter).mintNFT(numOfMints, stageTwo, {
          value: stageTwoCost,
        })
      }
    })

    it('Should confirm stage two minting', async () => {
      result = await contract.getMintedNfts()
      expect(result).to.have.lengthOf(stageTwoMax)
    })
  })

  describe('Users Personal Minted NFT Cost', () => {
    beforeEach(async () => {
      await contract.pause(false, stageOne)
    })

    it('Should confirm minting cost', async () => {
      result = await contract.totalCost(minter.address)
      expect(result).to.be.equal(0)

      for (let i = 1; i <= stageOneMax; i++) {
        await contract.connect(minter).mintNFT(numOfMints, stageOne, {
          value: stageOneCost,
        })
      }

      const totalCost = fromWei(stageOneCost) * stageOneMax
      result = await contract.totalCost(minter.address)
      expect(result).to.be.equal(toWei(totalCost))
    })
  })

  describe('Multi-User Minting', () => {
    beforeEach(async () => {
      await contract.pause(false, stageOne)

      await contract.connect(minter).mintNFT(numOfMints, stageOne, {
        value: stageOneCost,
      })
    })

    it('Should confirm minter can also mint', async () => {
      result = await contract.getOwnerNfts(minter.address)
      expect(result).to.have.lengthOf(1)
      result = await contract.getOwnerNfts(minter2.address)
      expect(result).to.have.lengthOf(0)

      await contract.connect(minter2).mintNFT(numOfMints, stageOne, {
        value: stageOneCost,
      })

      result = await contract.getOwnerNfts(minter.address)
      expect(result).to.have.lengthOf(1)
      result = await contract.getOwnerNfts(minter2.address)
      expect(result).to.have.lengthOf(1)

      await contract.connect(minter2).mintNFT(numOfMints, stageOne, {
        value: stageOneCost,
      })

      result = await contract.getOwnerNfts(minter.address)
      expect(result).to.have.lengthOf(1)
      result = await contract.getOwnerNfts(minter2.address)
      expect(result).to.have.lengthOf(2)
    })
  })

  describe('Administration', () => {
    it('Should confirm minting cost change per stage', async () => {
      result = await contract.stageOneCost()
      expect(result).to.be.equal(stageOneCost)
      result = await contract.stageTwoCost()
      expect(result).to.be.equal(stageTwoCost)

      const stageOneNewCost = (newCost * 4).toString()
      const stageTwoNewCost = (newCost * 6).toString()

      await contract.setCost(stageOneNewCost, stageOne)
      await contract.setCost(stageTwoNewCost, stageTwo)

      result = await contract.stageOneCost()
      expect(result).to.be.equal(stageOneNewCost)
      result = await contract.stageTwoCost()
      expect(result).to.be.equal(stageTwoNewCost)
    })

    it('Should confirm minting pause change per stage', async () => {
      result = await contract.stageOnePaused()
      expect(result).to.be.equal(true)
      result = await contract.stageTwoPaused()
      expect(result).to.be.equal(true)

      await contract.pause(false, stageOne)
      await contract.pause(false, stageTwo)

      result = await contract.stageOnePaused()
      expect(result).to.be.equal(false)
      result = await contract.stageTwoPaused()
      expect(result).to.be.equal(false)
    })

    it('Should confirm minting baseURI change', async () => {
      const newBaseURI = 'https://newbaseuri.com/assets/'

      result = await contract.baseURI()
      expect(result).to.be.equal(baseURI)

      await contract.setBaseURI(newBaseURI)

      result = await contract.baseURI()
      expect(result).to.be.equal(newBaseURI)
    })

    it('Should confirm max mint per time change', async () => {
      const newmaxMintPerTime = 6

      result = await contract.maxMintPerTime()
      expect(result).to.be.equal(maxMintPerTime)

      await contract.setmaxMintPerTime(newmaxMintPerTime)

      result = await contract.maxMintPerTime()
      expect(result).to.be.equal(newmaxMintPerTime)
    })
  })

  describe('Withdrawal', () => {
    beforeEach(async () => {
      await contract.pause(false, stageOne)

      for (let i = 1; i <= stageOneMax; i++) {
        await contract.connect(minter).mintNFT(numOfMints, stageOne, {
          value: stageOneCost,
        })
      }

      await contract.pause(false, stageTwo)

      for (let i = 1; i <= stageTwoMax; i++) {
        await contract.connect(minter).mintNFT(numOfMints, stageTwo, {
          value: stageTwoCost,
        })
      }
    })

    it('Should confirm withdrawal of fund', async () => {
      const net_revenue = await contract.net_revenue()
      result = await contract.withdrawTo(
        [minter.address, minter2.address],
        [40, 60],
        '1000'
      )

      result = await contract.net_revenue()
      expect(result).to.be.equal((net_revenue - 1000).toString())
    })
  })

  describe('Airdrop', () => {
    it('Should confirm balance of airdrop participants', async () => {
      const droppers = [minter.address, minter2.address]
      const numberOfMints = [1, 3]

      result = await contract.balanceOf(minter.address)
      expect(result).to.be.equal(0)
      result = await contract.balanceOf(minter2.address)
      expect(result).to.be.equal(0)

      await contract.airDropTo(droppers, numberOfMints)

      result = await contract.balanceOf(minter.address)
      expect(result).to.be.equal(1)
      result = await contract.balanceOf(minter2.address)
      expect(result).to.be.equal(3)

      result = await contract.getAirdroppers()
      expect(result).to.have.lengthOf(droppers.length)
    })
  })

  describe('Trapped Cash', () => {
    it('Should confirm withdrawal of trapped cash', async () => {
      const amountInWei = toWei(3.8)

      result = await getBalance(contract.address)
      expect(result).to.be.equal('0')

      await contract.connect(minter2).transfer({ value: amountInWei })

      result = await getBalance(contract.address)
      expect(result).to.be.equal(amountInWei)

      result = await contract.net_revenue()
      expect(result).to.be.equal('0')

      await contract.withdrawTrappedCash()

      result = await getBalance(contract.address)
      expect(result).to.be.equal(amountInWei)

      result = await contract.net_revenue()
      expect(result).to.be.equal(amountInWei)
    })
  })

  describe('WhiteList', () => {
    it('Should confirm WL registration', async () => {
      result = await contract.getWhiteList()
      expect(result).to.have.lengthOf(0)

      await contract.joinWhiteList()
      await contract.connect(minter2).joinWhiteList()

      result = await contract.getWhiteList()
      expect(result).to.have.lengthOf(2)
    })
  })

  describe('WhiteList Failures', () => {
    it('Should not allow double registration', async () => {
      await contract.connect(minter2).joinWhiteList()

      await expect(
        contract.connect(minter2).joinWhiteList()
      ).to.be.revertedWith('Account already in the list')
    })
  })

  describe('Mint Failures', () => {
    it('Should not allow minting when paused', async () => {
      await expect(
        contract.connect(minter2).mintNFT(numOfMints, stageOne)
      ).to.be.revertedWith('Stage one paused, check back later')
    })

    it('Should not allow minting when insufficient fund', async () => {
      await contract.pause(false, stageOne)

      await expect(
        contract.connect(minter2).mintNFT(numOfMints, stageOne)
      ).to.be.revertedWith('Insufficient ethers for stage one')
    })

    it('Should not allow minting when number of mint is zero', async () => {
      await contract.pause(false, stageOne)

      await expect(
        contract.connect(minter2).mintNFT(0, stageOne, { value: stageOneCost })
      ).to.be.revertedWith('Number of mints must be greater than zero')
    })
  })

  describe('Withdrawal Failures', () => {
    beforeEach(async () => {
      await contract.pause(false, stageOne)
      for (let i = 1; i <= stageOneMax; i++) {
        await contract.connect(minter).mintNFT(numOfMints, stageOne, {
          value: stageOneCost,
        })
      }

      await contract.pause(false, stageTwo)
      for (let i = 1; i <= stageTwoMax; i++) {
        await contract.connect(minter).mintNFT(numOfMints, stageTwo, {
          value: stageTwoCost,
        })
      }
    })

    it('Should prevent others from withdrawing', async () => {
      await expect(
        contract
          .connect(minter2)
          .withdrawTo([minter.address, minter2.address], [30, 70], '1000')
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('Should prevent admin from withdrawing amount less than one', async () => {
      await expect(
        contract.withdrawTo([minter.address, minter2.address], [30, 70], '0')
      ).to.be.revertedWith('Amount must not be zero')
    })

    it('Should prevent admin from withdrawing amount more than available', async () => {
      net_revenue = await contract.net_revenue()

      await expect(
        contract.withdrawTo(
          [minter.address, minter2.address],
          [30, 70],
          (net_revenue + 1000).toString()
        )
      ).to.be.revertedWith('Insufficient fund')
    })
  })

  describe('Airdrop Failures', () => {
    it('Should prevent empty beneficiaries', async () => {
      const droppers = []
      const numberOfMints = []

      await expect(
        contract.airDropTo(droppers, numberOfMints)
      ).to.be.revertedWith('Beneficiary must not be zero')
    })

    it('Should prevent unequal array sizes', async () => {
      const droppers = [minter.address, minter2.address]
      const numberOfMints = [1]

      await expect(
        contract.airDropTo(droppers, numberOfMints)
      ).to.be.revertedWith('Array sizes not matching')
    })

    it('Should prevent airdrop airdrop max supply', async () => {
      const droppers = [minter.address, minter2.address]
      const numberOfMints = [airdropMax, 1]

      await expect(
        contract.airDropTo(droppers, numberOfMints)
      ).to.be.revertedWith('Insufficient tokens for airdrop')
    })
  })
})
