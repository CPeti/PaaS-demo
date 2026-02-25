import { Router, Route, Switch } from 'wouter'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

function AppPage() {
  return (
    <div class="min-h-screen bg-slate-950 flex items-center justify-center">
      <div class="text-center">
        <p class="text-4xl mb-4">📷</p>
        <h1 class="text-2xl font-bold text-white mb-2">Your Album</h1>
        <p class="text-slate-400 text-sm">Gallery coming soon…</p>
      </div>
    </div>
  )
}

export function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/app" component={AppPage} />
        {/* Catch-all → landing */}
        <Route component={LandingPage} />
      </Switch>
    </Router>
  )
}
