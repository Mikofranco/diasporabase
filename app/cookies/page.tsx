"use client";

import { motion } from "framer-motion";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import { Cookie } from "lucide-react";

export default function CookiesScreen() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <section className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-br from-cyan-500/10 via-white to-blue-500/10 dark:from-cyan-500/5 dark:via-gray-900 dark:to-blue-500/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="container mx-auto px-4 text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-4">
            <Cookie className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Cookie Policy
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            How we use cookies and similar technologies.
          </p>
        </motion.div>
      </section>

      <main className="flex-1 container mx-auto px-4 pb-16 md:pb-24 -mt-6 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-lg shadow-gray-200/50 dark:shadow-none p-6 md:p-10 space-y-8"
        >
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            DiasporaBase uses cookies and similar technologies to help the platform work,
            improve performance, and keep accounts secure.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              What Cookies Are
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Cookies are small files stored on your device. Similar tools include pixels,
              SDKs, and local storage.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              How We Use Cookies
            </h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Essential:</strong> login/session management, security, fraud prevention</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Preferences:</strong> language, country selection, remembered settings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Analytics:</strong> understand usage patterns to improve features and reliability</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Communications:</strong> measure whether service emails are opened (where enabled)</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Your Choices
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">You can control cookies through:</p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300 mb-4">
              <li className="flex items-start gap-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                Your browser settings (block/delete cookies)
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                Any cookie banner/consent tool on our site (where shown)
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              If you disable essential cookies, parts of DiasporaBase may not function.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Third-Party Cookies
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Some cookies may be set by third-party providers we use for hosting, analytics,
              or support. Those providers may collect limited technical data according to
              their own policies.
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
