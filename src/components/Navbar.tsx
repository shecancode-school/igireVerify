"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Home", href: "/" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Register", href: "#register" },
  
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-14 h-[72px] flex items-center justify-between">
        <Link href="/" aria-label="IgireVerify Home">
          <Image
            src="/logo-igire.webp"
            alt="IgireVerify Logo"
            width={52}
            height={52}
            className="rounded-lg shadow-md"
            priority
          />
        </Link>

        <ul className="hidden md:flex items-center gap-10 list-none m-0 p-0">
          {links.map(({ label, href }) => (
            <li key={label}>
              <Link href={href}
                    className="font-semibold text-[15px] text-gray-900
                               hover:text-[#2E7D32] transition-colors">
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4">
          {links.map(({ label, href }) => (
            <Link key={label} href={href}
                  className="font-semibold text-gray-900 hover:text-[#2E7D32]"
                  onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}