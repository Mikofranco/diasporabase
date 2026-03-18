"use client";

import { routes } from "@/lib/routes";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

const SIGNUP_MODAL_ID = "select-signup-type-modal";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const mainLinks = [
    { href: routes.home, label: "Home" },
    { href: routes.about, label: "About us" },
    { href: routes.generalProjectsView, label: "Projects" },
    { href: routes.contact, label: "Contact us" },
  ].filter(
    (link) => pathname !== routes.home || link.href !== routes.home
  );

  const linkClass =
    "text-sm font-medium text-gray-700 hover:text-[#0ea5e9] transition-colors duration-200";
  const mobileLinkClass =
    "block py-3 text-sm font-medium text-gray-700 hover:text-[#0ea5e9] hover:bg-gray-50 transition-colors duration-200 w-full rounded-md px-2 text-left";

  const loginClass =
    "text-sm font-medium text-gray-700 border border-gray-300 hover:border-[#0ea5e9] hover:text-[#0ea5e9] rounded-lg px-4 py-2 transition-colors duration-200";
  const registerClass =
    "text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-all duration-200";
  const mobileLoginClass =
    "block py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-4 w-full text-center hover:bg-gray-50 hover:border-[#0ea5e9] hover:text-[#0ea5e9] transition-colors duration-200";
  const mobileRegisterClass =
    "block py-3 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg px-4 w-full text-center hover:from-cyan-400 hover:to-blue-500 transition-all duration-200";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <Link
          href={routes.home}
          className="flex items-center gap-2"
          aria-label="DiasporaBase Home"
        >
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

        {/* Desktop: main links + auth buttons */}
        <nav className="hidden md:flex items-center gap-6">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass}
              aria-label={link.label}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200">
            <Link
              href={routes.login}
              className={loginClass}
              aria-label="Login"
            >
              Sign in
            </Link>
            <button
              type="button"
              data-modal-trigger={SIGNUP_MODAL_ID}
              className={registerClass}
              aria-label="Register"
            >
              Sign up
            </button>
          </div>
        </nav>

        <button
          className="md:hidden p-2 text-gray-700 hover:text-[#0ea5e9] transition-colors"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav
        className={`md:hidden bg-white border-t transition-all duration-300 ease-in-out overflow-hidden ${
          isMenuOpen ? "max-h-screen opacity-100 py-4" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col items-stretch px-4 gap-1">
          {mainLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={mobileLinkClass}
                onClick={closeMenu}
                aria-label={link.label}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="flex flex-col gap-2 pt-3 mt-3 border-t border-gray-200">
            <Link
              href={routes.login}
              className={mobileLoginClass}
              onClick={closeMenu}
              aria-label="Login"
            >
              Sign in
            </Link>
            <button
              type="button"
              data-modal-trigger={SIGNUP_MODAL_ID}
              className={mobileRegisterClass}
              onClick={closeMenu}
              aria-label="Register"
            >
              Sign up
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default NavBar;