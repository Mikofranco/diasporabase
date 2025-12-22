"use client"

import React from 'react'
import NavBar from '@/components/navbar'
import Footer from '@/parts/landingPage/footer'

const CookiesScreen = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      <NavBar />

      <main className="flex-grow max-w-4xl mx-auto px-6 py-12 mt-0 md:mt-10">
        <h1 className="text-3xl font-semibold mb-6">
          Cookie Policy
        </h1>

        <p className="mb-6 leading-relaxed">
          DiasporaBase uses cookies and similar technologies to help the platform work,
          improve performance, and keep accounts secure.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-2">
          What Cookies Are
        </h3>
        <p className="mb-6 leading-relaxed">
          Cookies are small files stored on your device. Similar tools include pixels,
          SDKs, and local storage.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-2">
          How We Use Cookies
        </h3>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Essential cookies: login/session management, security, fraud prevention</li>
          <li>Preferences: language, country selection, remembered settings</li>
          <li>Analytics: understand usage patterns to improve features and reliability</li>
          <li>Communications: measure whether service emails are opened (where enabled)</li>
        </ul>

        <h3 className="text-xl font-semibold mt-8 mb-2">
          Your Choices
        </h3>
        <p className="mb-2">You can control cookies through:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Your browser settings (block/delete cookies)</li>
          <li>Any cookie banner/consent tool on our site (where shown)</li>
        </ul>

        <p className="mb-6 leading-relaxed">
          If you disable essential cookies, parts of DiasporaBase may not function.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-2">
          Third-Party Cookies
        </h3>
        <p className="leading-relaxed">
          Some cookies may be set by third-party providers we use for hosting, analytics,
          or support. Those providers may collect limited technical data according to
          their own policies.
        </p>
      </main>

      <Footer />
    </div>
  )
}

export default CookiesScreen
