"use client";

import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";

export default function PrivacyScreen() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden mt-10">
          <div className="px-8 py-12 md:px-12">
            <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-center text-gray-600 mb-12">
              Last updated: December 20, 2025
            </p>

            <section className="prose prose-lg max-w-none text-gray-700 space-y-10">
              <p>
                DiasporaBase (“we,” “us,” or “our”) connects diaspora professionals with African public institutions for volunteer and collaboration opportunities. This Privacy Policy explains how we collect, use, share, and protect your personal information. We are committed to safeguarding your privacy.
              </p>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  1. Information We Collect
                </h2>
                <ul className="list-disc pl-6 space-y-3">
                  <li>
                    <strong>Account & Profile Info:</strong> Name, email, phone (optional), country of interest, skills, professional details, LinkedIn profile (optional), and profile photo (optional).
                  </li>
                  <li>
                    <strong>Verification & Trust Data:</strong> Identity checks, role validation for institutions, and basic integrity signals to prevent fraud (only if applicable).
                  </li>
                  <li>
                    <strong>Application & Matching Data:</strong> Opportunities you view, apply to, or post; messages exchanged; availability and preferences.
                  </li>
                  <li>
                    <strong>Technical Data:</strong> IP address, device/browser information, log data, and approximate location (e.g., country) for security, analytics, and localization.
                  </li>
                  <li>
                    <strong>Sensitive Data:</strong> Please do not submit sensitive personal data (e.g., health records, biometric data) unless explicitly required for an opportunity and you have lawful permission.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  2. How We Use Your Information
                </h2>
                <p>We use your information to:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>Provide matching, posting, and collaboration features</li>
                  <li>Verify accounts, prevent fraud, and maintain platform safety</li>
                  <li>Send service updates and respond to support requests</li>
                  <li>Improve platform performance, analytics, and usability</li>
                  <li>Comply with legal obligations and enforce our Terms of Service</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  3. Sharing & Disclosure
                </h2>
                <p>We may share information:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>With institutions or volunteers you engage with (limited profile and application details necessary for collaboration)</li>
                  <li>With trusted service providers (e.g., hosting, analytics, email delivery) who are bound by confidentiality and security obligations</li>
                  <li>For safety or legal reasons (e.g., required by law or to protect users and DiasporaBase)</li>
                  <li>In business transfers (e.g., merger or acquisition) with appropriate safeguards</li>
                </ul>
                <p className="mt-4 font-medium">We do not sell your personal information.</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  4. Cross-Border Transfers
                </h2>
                <p>
                  DiasporaBase supports global collaboration. Your data may be processed in countries outside your residence. We implement reasonable safeguards (e.g., standard contractual clauses) to protect it during transfers.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  5. Data Retention
                </h2>
                <p>
                  We retain information only as long as necessary for platform operations, legal requirements, dispute resolution, and agreement enforcement. You can request deletion where permitted by law.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  6. Your Choices & Rights
                </h2>
                <p>Depending on your location, you may have rights to:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>Access, correct, or delete your data</li>
                  <li>Object to or restrict processing</li>
                  <li>Withdraw consent (where applicable)</li>
                  <li>Request data portability</li>
                </ul>
                <p className="mt-4">To exercise these rights, please contact us (see Contact section below).</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  7. Security
                </h2>
                <p>
                  We employ administrative, technical, and organizational measures to protect your data. However, no system is 100% secure—use DiasporaBase at your own risk.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  8. Children
                </h2>
                <p>
                  DiasporaBase is not intended for children under 13 (or the applicable minimum age in your jurisdiction). We do not knowingly collect their personal data.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  9. Updates to This Policy
                </h2>
                <p>
                  We may update this Privacy Policy periodically. Changes take effect upon posting, and we will update the “Last updated” date above.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  10. Contact Us
                </h2>
                <p>
                  For questions, requests, or concerns about this Privacy Policy, please reach out via our contact form or email us at{" "}
                  <a href="mailto:privacy@diasporabase.com" className="text-blue-600 hover:underline">
                    privacy@diasporabase.com
                  </a>
                  .
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}