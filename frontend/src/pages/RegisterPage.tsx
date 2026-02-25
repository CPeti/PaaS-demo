import { useState } from 'preact/hooks'
import { useLocation } from 'wouter'
import { apiLogin, apiRegister } from '../lib/api'
import { saveToken } from '../lib/auth'

export function RegisterPage() {
    const [, navigate] = useLocation()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: Event) {
        e.preventDefault()
        setError(null)

        if (password !== confirm) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            await apiRegister(username, email, password)
            // Auto-login after registration
            const token = await apiLogin(username, password)
            saveToken(token.access_token)
            navigate('/app')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div class="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
            {/* Background glow */}
            <div class="pointer-events-none fixed inset-0 flex items-center justify-center">
                <div class="h-[600px] w-[600px] rounded-full bg-indigo-700/10 blur-3xl" />
            </div>

            <div class="relative w-full max-w-md">
                {/* Logo */}
                <a href="/" class="mb-10 flex items-center justify-center gap-2.5">
                    <svg class="h-7 w-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="4" />
                        <line x1="12" y1="2" x2="12" y2="6" />
                        <line x1="12" y1="18" x2="12" y2="22" />
                        <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" />
                        <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
                        <line x1="2" y1="12" x2="6" y2="12" />
                        <line x1="18" y1="12" x2="22" y2="12" />
                    </svg>
                    <span class="text-xl font-semibold text-white">Lumina</span>
                </a>

                {/* Card */}
                <div class="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-8 shadow-2xl shadow-black/40">
                    <div class="mb-8">
                        <h1 class="text-2xl font-bold text-white">Create your album</h1>
                        <p class="mt-1 text-sm text-slate-400">Free forever. No credit card needed.</p>
                    </div>

                    <form id="register-form" onSubmit={handleSubmit} class="space-y-5">
                        <div>
                            <label for="reg-username" class="mb-1.5 block text-sm font-medium text-slate-300">
                                Username
                            </label>
                            <input
                                id="reg-username"
                                type="text"
                                required
                                autoComplete="username"
                                value={username}
                                onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
                                placeholder="your_username"
                                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>

                        <div>
                            <label for="reg-email" class="mb-1.5 block text-sm font-medium text-slate-300">
                                Email
                            </label>
                            <input
                                id="reg-email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                                placeholder="you@example.com"
                                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>

                        <div>
                            <label for="reg-password" class="mb-1.5 block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <input
                                id="reg-password"
                                type="password"
                                required
                                minLength={8}
                                autoComplete="new-password"
                                value={password}
                                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                                placeholder="Min. 8 characters"
                                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>

                        <div>
                            <label for="reg-confirm" class="mb-1.5 block text-sm font-medium text-slate-300">
                                Confirm password
                            </label>
                            <input
                                id="reg-confirm"
                                type="password"
                                required
                                autoComplete="new-password"
                                value={confirm}
                                onInput={(e) => setConfirm((e.target as HTMLInputElement).value)}
                                placeholder="••••••••"
                                class={`w-full rounded-lg border bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 ${confirm && confirm !== password
                                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                                        : 'border-slate-700 focus:border-violet-500 focus:ring-violet-500/20'
                                    }`}
                            />
                            {confirm && confirm !== password && (
                                <p class="mt-1.5 text-xs text-red-400">Passwords don't match</p>
                            )}
                        </div>

                        {error && (
                            <div
                                id="register-error"
                                role="alert"
                                class="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                            >
                                <svg class="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5zm.75 6.5a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <button
                            id="register-submit"
                            type="submit"
                            disabled={loading}
                            class="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {loading ? 'Creating your album…' : 'Create account'}
                        </button>
                    </form>
                </div>

                <p class="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <a href="/login" class="font-medium text-violet-400 hover:text-violet-300 transition-colors">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    )
}
