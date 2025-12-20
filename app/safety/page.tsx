"use client"
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import React from "react";

const SafetyAndGuidelines = () => {
  return (
    <div>
      <NavBar />
      <main className="flex-grow max-w-4xl mx-auto px-6 py-12 space-y-10 my-20">
        <h1 className="text-3xl font-semibold">
          Safety & Community Guidelines
        </h1>

        <p className="leading-relaxed">
          At DiasporaBase, your safety is our priority. We are committed to
          fostering a respectful and secure environment for all users. Please
          adhere to the following community guidelines to help us maintain a
          positive experience:
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default SafetyAndGuidelines;
