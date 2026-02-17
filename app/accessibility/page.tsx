"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import { Accessibility, HelpCircle, Mail, ShieldCheck, AlertTriangle } from "lucide-react";
import { routes } from "@/lib/routes";

export default function AccessibilityScreen() {
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
            <Accessibility className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Accessibility Statement
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            We aim to make our platform accessible to all users, including people with disabilities.
          </p>
        </motion.div>
      </section>

      <main className="flex-1 container mx-auto px-4 pb-16 md:pb-24 -mt-6 relative z-10 max-w-4xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-lg shadow-gray-200/50 dark:shadow-none p-6 md:p-8"
        >
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            DiasporaBase is committed to making our platform accessible to all users, including people with disabilities. We aim to follow recognized accessibility standards (such as WCAG) and continuously improve usability across devices and assistive technologies.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 md:p-8 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="rounded-lg bg-cyan-500/10 p-1.5 text-cyan-600 dark:text-cyan-400">
              <Accessibility className="h-5 w-5" />
            </span>
            What We&apos;re Doing
          </h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
              Building mobile-friendly, readable layouts
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
              Supporting keyboard navigation where possible
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
              Using clear labels and form instructions
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
              Improving contrast and text clarity over time
            </li>
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 md:p-8 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="rounded-lg bg-cyan-500/10 p-1.5 text-cyan-600 dark:text-cyan-400">
              <Mail className="h-5 w-5" />
            </span>
            Need Help?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            If you experience an accessibility issue or need content in an alternative format, please contact us at{" "}
            <a href="mailto:support@diasporabase.com" className="text-cyan-600 dark:text-cyan-400 font-medium hover:underline">
              support@diasporabase.com
            </a>{" "}
            and include:
          </p>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300 mb-4">
            <li className="flex items-start gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
              The page URL
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
              What you were trying to do
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
              Your device/browser and any assistive technology used
            </li>
          </ul>
          <p className="text-gray-600 dark:text-gray-300">We&apos;ll do our best to respond promptly.</p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 md:p-8 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Support & Resources
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href={routes.help}
              className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 p-4 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
            >
              <HelpCircle className="h-6 w-6 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <span className="font-medium text-gray-900 dark:text-white block">Help Center</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">FAQs and guides</span>
              </div>
            </Link>
            <Link
              href={routes.contact}
              className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 p-4 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
            >
              <Mail className="h-6 w-6 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <span className="font-medium text-gray-900 dark:text-white block">Contact Us</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Get in touch</span>
              </div>
            </Link>
            <Link
              href={routes.safetyAndGuidelines}
              className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 p-4 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
            >
              <ShieldCheck className="h-6 w-6 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <span className="font-medium text-gray-900 dark:text-white block">Safety Guidelines</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Community guidelines</span>
              </div>
            </Link>
            <Link
              href={routes.report}
              className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 p-4 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
            >
              <AlertTriangle className="h-6 w-6 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <span className="font-medium text-gray-900 dark:text-white block">Report an Issue</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Report violations</span>
              </div>
            </Link>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
