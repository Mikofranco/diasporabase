"use client";

import React from "react";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";

const ReportScreen = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      <NavBar />

      <main className="flex-grow max-w-4xl mx-auto px-6 py-12 space-y-10 mt-20">
        <h1 className="text-3xl font-semibold">Report Issue</h1>

        <p className="leading-relaxed">
          If you see suspicious behavior, fraud, harassment, impersonation, or
          unsafe project requests, report it. We take reports seriously and may
          investigate, restrict accounts, or involve law enforcement where
          appropriate.
        </p>

        <section>
          <h2 className="text-xl font-semibold mb-3">What You Can Report</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Impersonation of a government agency or official</li>
            <li>Scam attempts or requests for money</li>
            <li>Harassment, threats, or discriminatory conduct</li>
            <li>Requests for confidential or restricted documents</li>
            <li>Malware, phishing, or account compromise</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">How to Report</h2>
          <p className="mb-2">Email support@diasporabase.com with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Username/profile link</li>
            <li>Description of what happened</li>
            <li>Screenshots or message excerpts (if available)</li>
            <li>Dates/times and any relevant project links</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Emergencies</h2>
          <p className="leading-relaxed">
            DiasporaBase is not an emergency service. If you are in immediate
            danger, contact local emergency services first.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ReportScreen;
