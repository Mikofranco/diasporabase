"use client";

import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";

export default function TermsOfService() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-8 py-12 md:px-12">
            <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-center text-gray-600 mb-12">
              Last updated: December 20, 2025
            </p>

            <section className="prose prose-lg max-w-none text-gray-700 space-y-10">
              <p>
                These Terms govern your use of DiasporaBase. By creating an account or using the platform, you agree to these Terms.
              </p>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  What DiasporaBase Is (and Isn’t)
                </h2>
                <p>
                  DiasporaBase is a platform that helps diaspora professionals discover and support projects posted by public institutions and approved organizations. 
                  We do not employ volunteers or institutions. We do not guarantee outcomes, placements, or project success. 
                  We are not responsible for the actions of users or third parties.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  Eligibility & Accounts
                </h2>
                <p>
                  You must provide accurate information and keep your account secure. 
                  We may suspend or terminate accounts that violate these Terms or create safety risks.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  User Roles and Responsibilities
                </h2>
                <p>Volunteers agree to:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>Provide truthful credentials and experience</li>
                  <li>Follow project requirements and professional standards</li>
                  <li>Protect confidential information and sensitive institutional data</li>
                  <li>Avoid requesting or accepting improper payments, gifts, or “facilitation fees”</li>
                </ul>

                <p className="mt-6">Institutions/Organizations agree to:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>Post lawful, accurate opportunities</li>
                  <li>Respect volunteer time and scope projects appropriately</li>
                  <li>Follow applicable procurement, privacy, and public-sector rules</li>
                  <li>Obtain needed approvals before sharing confidential materials</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  Confidentiality & Sensitive Information
                </h2>
                <p>Some projects may involve non-public information. You agree:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>Not to disclose confidential information outside the project team</li>
                  <li>Not to upload restricted or classified government information unless explicitly authorized</li>
                  <li>To follow security instructions and data-handling rules provided for the project</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  Acceptable Use
                </h2>
                <p>You may not:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>Misrepresent identity, affiliation, or authority</li>
                  <li>Post illegal, discriminatory, or exploitative opportunities</li>
                  <li>Harass, threaten, or solicit users for scams or unauthorized fundraising</li>
                  <li>Upload malware or attempt to access accounts/systems without permission</li>
                  <li>Use DiasporaBase to violate sanctions, bribery, corruption, or public integrity laws</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  Payments & Off-Platform Deals
                </h2>
                <p>
                  Unless explicitly enabled by DiasporaBase, users should not exchange money through the platform. 
                  Any off-platform arrangements are at your own risk, and DiasporaBase is not a party to those agreements.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  Intellectual Property
                </h2>
                <p>
                  You retain rights to content you upload, but you grant DiasporaBase a license to host and display it for platform operations. 
                  Project deliverables belong to the parties as agreed within the project scope. 
                  If no agreement exists, ownership defaults to the creator, with a license for the receiving institution to use for the project’s purpose.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  Third-Party Services
                </h2>
                <p>
                  DiasporaBase may integrate third-party tools (hosting, analytics, communications). 
                  We’re not responsible for third-party services outside our control.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  Disclaimer of Warranties
                </h2>
                <p>
                  DiasporaBase is provided “as is” and “as available.” 
                  We do not warrant uninterrupted service, error-free operation, or that opportunities are verified beyond the checks we choose to perform.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  Limitation of Liability
                </h2>
                <p>
                  To the maximum extent allowed by law, DiasporaBase is not liable for indirect, incidental, special, consequential, or punitive damages, 
                  or for disputes between volunteers and institutions.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  Indemnification
                </h2>
                <p>
                  You agree to indemnify and hold DiasporaBase harmless from claims arising out of your use of the platform, your content, 
                  or your violation of these Terms or the law.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  Termination
                </h2>
                <p>
                  We can suspend or terminate access to protect users, enforce compliance, or address risk. 
                  You can stop using DiasporaBase anytime.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  Governing Law; Dispute Resolution; Venue
                </h2>
                <p>
                  DiasporaBase is operated by Modele Technologies LLC, a Georgia limited liability company. 
                  These Terms, and any dispute, claim, or controversy arising out of or relating to these Terms, DiasporaBase, 
                  or your use of the platform (collectively, “Disputes”), are governed by the laws of the State of Georgia, USA, 
                  without regard to its conflict of laws principles.
                </p>
                <p className="mt-4">
                  Unless otherwise prohibited by applicable law, you agree that all disputes will be brought exclusively 
                  in the state or federal courts located in Fulton County, Georgia (including the Superior Court of Fulton County, Georgia, 
                  or the United States District Court for the Northern District of Georgia). 
                  You and Modele Technologies LLC consent to the personal jurisdiction and venue of those courts 
                  and waive any objection based on inconvenient forum.
                </p>
                <p className="mt-4">
                  Nothing in this section limits any rights you may have under mandatory laws in your jurisdiction that cannot be waived by contract.
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