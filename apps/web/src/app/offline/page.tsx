export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF9] px-6 text-center">
      <div className="mb-6 text-6xl">📡</div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">You&apos;re offline</h1>
      <p className="mb-8 max-w-sm text-gray-600">
        It looks like you&apos;ve lost your internet connection. Please check your connection and
        try again.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full bg-[#E11D48] px-8 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95"
      >
        Try again
      </button>
    </div>
  )
}
