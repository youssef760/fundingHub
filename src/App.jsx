import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import WL from './views/WL'
import Dashboard from './views/Dashboard'
import Minting from './views/Minting'
import Admin from './views/Admin'
import { ToastContainer } from 'react-toastify'
import { useWeb3ModalTheme, Web3Modal } from '@web3modal/react'
import { getNetwork } from '@wagmi/core'
import { setGlobalState, useGlobalState } from './store'
import { useEffect } from 'react'
import { ethereumClient, getData, wagmiClient } from './services/blockchain'
import { WagmiConfig } from 'wagmi'
import PrivateAdminRoutes from './utils/PrivateAdminRoutes'

const App = () => {
  const { setTheme } = useWeb3ModalTheme()
  const { chain } = getNetwork()
  const [connectedAccount] = useGlobalState('connectedAccount')

  useEffect(async () => {
    setGlobalState('chain', chain)
    ethereumClient.watchNetwork((newChain) => {
      if (connectedAccount && chain.id !== newChain.chain.id) {
        window.location.reload()
      }
    })

    const account = ethereumClient.getAccount()
    if (account.address) {
      setGlobalState('connectedAccount', account.address.toLowerCase())
      await getData()
    }

    ethereumClient.watchAccount(async (account) => {
      if (account.address) {
        setGlobalState('connectedAccount', account.address.toLowerCase())
        await getData()
      } else {
        setGlobalState('connectedAccount', '')
      }
    })
  }, [])

  setTheme({
    themeMode: 'dark',
    themeColor: 'magenta',
    themeBackground: 'themeColor',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <WagmiConfig client={wagmiClient}>
        <Header />
        <Routes>
          <Route path="/" element={<WL />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/minting" element={<Minting />} />

          <Route element={<PrivateAdminRoutes />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </WagmiConfig>

      <Web3Modal
        projectId={process.env.REACT_APP_WALLET_CONNECT_ID}
        ethereumClient={ethereumClient}
      />

      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  )
}

export default App
