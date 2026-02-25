import { Router, Route, Switch } from 'wouter'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { GalleryPage } from './pages/GalleryPage'

export function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/app" component={GalleryPage} />
        {/* Catch-all → landing */}
        <Route component={LandingPage} />
      </Switch>
    </Router>
  )
}
