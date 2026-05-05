import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-[#D4C5A9] bg-[#F5F1EB] px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="font-[var(--font-fraunces)] text-[#1B4332] font-semibold">Beagle</p>
          <p className="text-sm text-[#52796F] mt-1">Wildlife Trail Intelligence</p>
        </div>
        <div className="flex gap-6 text-sm text-[#52796F]">
          <Link href="/parks" className="hover:text-[#1B4332] transition-colors">
            Parks
          </Link>
          <Link href="/wildlife" className="hover:text-[#1B4332] transition-colors">
            Wildlife
          </Link>
        </div>
        <p className="text-xs text-[#52796F]">
          Data from iNaturalist · eBird · NPS
        </p>
      </div>
    </footer>
  )
}
