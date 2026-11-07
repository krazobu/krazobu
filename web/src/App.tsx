import { AppPage } from './pages/AppPage'
import { Landing } from './pages/Landing'
import { useLocation } from './router'

export default function App() {
  const location = useLocation()
  const pathname = location.split('#')[0]
  return pathname === '/app' || pathname.startsWith('/app/') ? <AppPage /> : <Landing />
}
