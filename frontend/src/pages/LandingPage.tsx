export function LandingPage() {
  return (
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* ── Navbar ──────────────────────────────────────────── */}
      <header class="fixed inset-x-0 top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" class="flex items-center gap-2.5 group">
            {/* Camera aperture icon */}
            <svg class="h-7 w-7 text-violet-400 group-hover:text-violet-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" />
              <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
            <span class="text-xl font-semibold tracking-tight text-white">Lumina</span>
          </a>

          <div class="flex items-center gap-3">
            <a
              href="/login"
              id="nav-login"
              class="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Log in
            </a>
            <a
              href="/register"
              id="nav-signup"
              class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/30"
            >
              Sign up
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ────────────────────────────────────────────── */}
        <section class="relative flex flex-col items-center justify-center pt-40 pb-24 px-6 text-center overflow-hidden">
          {/* Gradient orbs */}
          <div class="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-violet-700/10 blur-3xl" />
          <div class="pointer-events-none absolute top-40 left-1/4 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
          <div class="pointer-events-none absolute top-32 right-1/4 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />

          <div class="relative max-w-3xl">
            <span class="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
              ✦ Your memories, beautifully organized
            </span>

            <h1 class="mt-4 text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Keep every memory{" "}
              <span class="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                vivid
              </span>
            </h1>

            <p class="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
              Lumina gives you a private space to upload, organize, and
              rediscover your photos — simple, fast, and always yours.
            </p>

            <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/register"
                id="hero-cta"
                class="rounded-xl bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-900/40 hover:bg-violet-500 hover:shadow-violet-800/50 transition-all duration-200"
              >
                Get started — it's free
              </a>
              <a
                href="#features"
                id="hero-learn-more"
                class="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Learn more
                <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </a>
            </div>
          </div>

          {/* Photo mosaic preview */}
          <div class="relative mt-20 w-full max-w-4xl">
            <div class="absolute inset-0 rounded-3xl bg-gradient-to-b from-transparent via-transparent to-slate-950 z-10 pointer-events-none" />
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 rounded-3xl overflow-hidden opacity-60">
              {MOSAIC_COLORS.map((colors, i) => (
                <div
                  key={i}
                  class={`aspect-square rounded-xl bg-gradient-to-br ${colors} ${i % 5 === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────── */}
        <section id="features" class="py-24 px-6">
          <div class="mx-auto max-w-6xl">
            <div class="text-center mb-16">
              <h2 class="text-3xl font-bold text-white sm:text-4xl">
                Everything you need, nothing you don't
              </h2>
              <p class="mt-4 text-slate-400 max-w-xl mx-auto">
                A focused set of tools for managing your personal photo library.
              </p>
            </div>

            <div class="grid gap-6 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  class="group rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-violet-500/50 hover:bg-slate-900 transition-all duration-300"
                >
                  <div class="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                    {f.icon}
                  </div>
                  <h3 class="mb-3 text-lg font-semibold text-white">{f.title}</h3>
                  <p class="text-sm text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ──────────────────────────────────────── */}
        <section class="py-24 px-6">
          <div class="mx-auto max-w-3xl rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/60 to-indigo-950/60 p-12 text-center shadow-2xl shadow-violet-900/20">
            <h2 class="text-3xl font-bold text-white sm:text-4xl">
              Start your album today
            </h2>
            <p class="mt-4 text-slate-400">
              Free to use. No storage limits. Just your photos.
            </p>
            <a
              href="/register"
              id="cta-banner-btn"
              class="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors shadow-xl"
            >
              Create your free album
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer class="border-t border-slate-800/60 py-8 px-6 text-center">
        <p class="text-sm text-slate-500">
          © {new Date().getFullYear()} Lumina. Built with Preact + FastAPI.
        </p>
      </footer>
    </div>
  )
}

// ─── Data ───────────────────────────────────────────────────

const MOSAIC_COLORS = [
  'from-violet-600 to-purple-800',
  'from-indigo-500 to-blue-700',
  'from-purple-500 to-pink-700',
  'from-blue-600 to-cyan-800',
  'from-rose-500 to-pink-700',
  'from-fuchsia-600 to-violet-800',
  'from-sky-500 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-orange-700',
  'from-indigo-400 to-violet-600',
  'from-violet-500 to-fuchsia-700',
  'from-cyan-500 to-sky-700',
]

const UploadIcon = (
  <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const GalleryIcon = (
  <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const DeleteIcon = (
  <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

const FEATURES = [
  {
    icon: UploadIcon,
    title: 'Upload instantly',
    description:
      'Drag and drop your photos or pick them from your device. Multiple formats supported, processed in seconds.',
  },
  {
    icon: GalleryIcon,
    title: 'Browse your gallery',
    description:
      'A clean, responsive grid shows all your photos at a glance. Scroll, zoom, and enjoy your collection.',
  },
  {
    icon: DeleteIcon,
    title: 'Stay organized',
    description:
      'Remove unwanted photos with a single click. Your album stays clean and exactly how you want it.',
  },
]
