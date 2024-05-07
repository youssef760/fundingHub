import React from 'react'
import { Link } from 'react-router-dom'
import { useGlobalState } from '../store'
import { connectWallet } from '../services/blockchain'
import { truncate } from '../store'


const Header = () => {
  const [connectedAccount] = useGlobalState('connectedAccount')

  return (
    <header
      className="flex justify-between items-center
        p-5 bg-gray-800 shadow-lg fixed top-0 left-0 right-0"
    >
      <Link
        to="/"
        className="flex justify-start items-center
        text-xl text-white space-x-1"
      >
        <span className='font-extrabold'>FundingHub</span>
      </Link>
      <div className="flex space-x-2 justify-center">
          <button
            type="button"
            className="inline-block px-6 py-2.5 bg-green-600
            text-white font-medium text-xs leading-tight uppercase
            rounded-full shadow-md hover:bg-green-700"
            onClick={connectedAccount ? undefined : connectWallet}
          >
            {connectedAccount
              ? truncate(connectedAccount, 4, 4, 11)
              : 'Connect Wallet'}
          </button>
      </div>
    </header>
  )
}

export default Header