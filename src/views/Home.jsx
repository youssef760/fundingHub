import { useEffect } from 'react'
import AddButton from '../components/AddButton'
import Hero from '../components/Hero'
import Projects from '../components/Projects'
import { loadProjects } from '../services/blockchain'
import { useGlobalState } from '../store'
import StartProject from '../components/StartProject'

const Home = () => {
  const [projects] = useGlobalState('projects')

  useEffect(async () => {
    await loadProjects()
  }, [])
  return (
    <>
      <Hero />
      <Projects projects={projects} />
      <StartProject />
      <AddButton />
    </>
  )
}

export default Home