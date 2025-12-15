"use client"; // Required for client-side interactivity

import { Link as LucideLink, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about-us", label: "About us" },
    // { href: "/projects", label: "Browse Projects" },
    { href: "/login", label: "Login" },
    { href: "/register-volunteer", label: "Join as Volunteer" },
    { href: "/register-agency", label: "Register Organization" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="DiasporaBase Home">
          <Image
            src="/svg/logo.svg"
            alt="DiasporaBase Logo"
            width={32}
            height={32}
            priority
            className="w-8 h-8"
          />
          <span className="text-lg font-semibold text-gray-900">DiasporaBase</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-[#0ea5e9] transition-colors duration-200"
              aria-label={link.label}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav
        className={`md:hidden bg-white border-t transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <ul className="flex flex-col items-start px-4 py-2">
          {navLinks.map((link) => (
            <li key={link.href} className="w-full">
              <Link
                href={link.href}
                className="block py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200 w-full"
                onClick={() => setIsMenuOpen(false)}
                aria-label={link.label}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default NavBar;