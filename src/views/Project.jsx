import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getBackers, loadProject } from '../services/blockchain'
import ProjectDetails from '../components/ProjectDetails'
import { useGlobalState } from '../store'
import ContributeToProject from '../components/ContributeToProject'
import ProjectBackers from '../components/ProjectBackers'
import CancelProject from '../components/CancelPoject'

const Project = () => {
  const { id } = useParams()
  const [loaded, setLoaded] = useState(false)
  const [project] = useGlobalState('project')
  const [backers] = useGlobalState('backers')

  useEffect(async () => {
    await loadProject(id)
    await getBackers(id)
    setLoaded(true)
  }, [])
  return loaded ? (
    <>
      <ProjectDetails project={project} />
      <ModifyProject project={project} />
      <ContributeToProject project={project} />
      <ProjectBackers backers={backers} />
      <CancelProject project={project} />
    </>
  ) : null
}

export default Project