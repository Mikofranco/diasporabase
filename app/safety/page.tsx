"use client";

import { motion } from "framer-motion";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import { ShieldCheck } from "lucide-react";

export default function SafetyAndGuidelines() {
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
            <ShieldCheck className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Safety & Community Guidelines
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            A respectful and secure environment for all users.
          </p>
        </motion.div>
      </section>

      <main className="flex-1 container mx-auto px-4 pb-16 md:pb-24 -mt-6 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-lg shadow-gray-200/50 dark:shadow-none p-6 md:p-10"
        >
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            At DiasporaBase, your safety is our priority. We are committed to
            fostering a respectful and secure environment for all users. Please
            adhere to the following community guidelines to help us maintain a
            positive experience:
          </p>
          <ul className="mt-6 space-y-3 text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
              <span>Be respectful and professional in all interactions.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
              <span>Protect your account and do not share credentials.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
              <span>Report suspicious behavior or violations.</span>
            </li>
          </ul>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
