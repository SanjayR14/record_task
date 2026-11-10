export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F6F1] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-xl font-bold text-slate-900">404 - Link Not Found</h2>
      <p className="text-xs text-slate-500">The requested verification URL is invalid.</p>
      <a
        href="/verify/demo-candidate-2026/language"
        className="py-2.5 px-4 bg-[#FF5723] text-white text-xs font-semibold rounded-xl"
      >
        Start Candidate Verification
      </a>
    </div>
  );
}

