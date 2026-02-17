"use client";

import { motion } from "framer-motion";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, AlertCircle } from "lucide-react";

const WHAT_TO_REPORT = [
  "Impersonation of a government agency or official",
  "Scam attempts or requests for money",
  "Harassment, threats, or discriminatory conduct",
  "Requests for confidential or restricted documents",
  "Malware, phishing, or account compromise",
] as const;

const HOW_TO_REPORT = [
  "Username/profile link",
  "Description of what happened",
  "Screenshots or message excerpts (if available)",
  "Dates/times and any relevant project links",
] as const;

export default function ReportScreen() {
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
            <AlertTriangle className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Report an Issue
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            We take reports seriously and may investigate, restrict accounts, or involve law enforcement where appropriate.
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
            If you see suspicious behavior, fraud, harassment, impersonation, or
            unsafe project requests, report it.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 md:p-8 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            What You Can Report
          </h2>
          <ul className="space-y-2">
            {WHAT_TO_REPORT.map((item) => (
              <li key={item} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 md:p-8 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            How to Report
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Email support@diasporabase.com with:
          </p>
          <ul className="space-y-2 mb-6">
            {HOW_TO_REPORT.map((item) => (
              <li key={item} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="rounded-xl gap-2">
            <a href="mailto:support@diasporabase.com">
              <Mail className="h-4 w-4" />
              Email Support
            </a>
          </Button>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 p-6 md:p-8 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Emergencies
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                DiasporaBase is not an emergency service. If you are in immediate
                danger, contact local emergency services first.
              </p>
            </div>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
