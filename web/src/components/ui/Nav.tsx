'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/parks', label: 'Parks' },
  { href: '/wildlife', label: 'Wildlife' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <header className="border-b border-[#D4C5A9] bg-[#F5F1EB]">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-[var(--font-fraunces)] text-xl text-[#1B4332] font-semibold">
          Beagle
        </Link>
        <div className="flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'text-[#1B4332]'
                  : 'text-[#52796F] hover:text-[#1B4332]'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
