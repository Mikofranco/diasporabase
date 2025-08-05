"use client"
import NavBar from '@/components/navbar';
import Footer from '@/parts/landingPage/footer';
import React from 'react';

const AboutUs = () => {
  return (
    <div className="w-full bg-gray-50">
        <NavBar/>
      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center h-[60vh] flex items-center justify-center"
        style={{ backgroundImage: `url('https://diasporabase.com/lifestyle-people-office.jpg')` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-poppins animate-fade-in">
            Global Talent, Local Impact
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-6 font-inter">
            Empowering diaspora professionals to drive change in their home countries—no relocation required.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="https://diasporabase.com"
              className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90 text-white px-6 py-3 rounded-full font-inter font-semibold transition duration-300"
            >
              Get Started
            </a>
            <a
              href="https://diasporabase.com/how-it-works"
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-full font-inter font-semibold hover:bg-white hover:text-teal-900 transition duration-300"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Why DiasporaBase Section */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-teal-900 font-poppins mb-12">
          Why DiasporaBase?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Professionals */}
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
            <h3 className="text-2xl font-semibold text-teal-900 font-poppins mb-4">
              For Diaspora Professionals
            </h3>
            <ul className="space-y-3 text-gray-700 font-inter">
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span><strong>Give Back, Your Way:</strong> Mentor, consult, or contribute remotely.</span>
              </li>
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span><strong>Trusted Connections:</strong> Engage with verified organizations securely.</span>
              </li>
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span><strong>Real Impact:</strong> Drive progress in education, healthcare, and more.</span>
              </li>
            </ul>
          </div>
          {/* For Institutions/NGOs */}
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
            <h3 className="text-2xl font-semibold text-teal-900 font-poppins mb-4">
              For Governments & NGOs
            </h3>
            <ul className="space-y-3 text-gray-700 font-inter">
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span><strong>Access Global Talent:</strong> Connect with experts at no cost.</span>
              </li>
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span><strong>Solve Local Challenges:</strong> Address technical and resource gaps.</span>
              </li>
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span><strong>Transparent Collaboration:</strong> Track projects with accountability.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-r from-[#F8FAFD] to-[#EFF6FF]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-900 font-poppins mb-6">
            Our Mission
          </h2>
          <p className="text-lg text-gray-700 font-inter mb-8">
            DiasporaBase unlocks the potential of global talent for local progress. We provide a secure, structured platform for diaspora professionals to collaborate with institutions in their home countries, driving innovation and sustainable change.
          </p>
          <p className="text-2xl font-semibold text-coral-500 font-poppins">
            “Expertise knows no borders.”
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-teal-900 font-poppins mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: 1, title: 'Join the Platform', desc: 'Sign up as a professional or institution/NGO.' },
            { step: 2, title: 'Match with Purpose', desc: 'Connect with projects that align with your skills.' },
            { step: 3, title: 'Collaborate Virtually', desc: 'Work remotely with transparent tracking.' },
            { step: 4, title: 'Create Change', desc: 'Drive impact in policy, health, and more.' },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300 text-center"
            >
              <div className="text-teal-500 text-4xl font-bold font-poppins mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold text-teal-900 font-poppins mb-2">{item.title}</h3>
              <p className="text-gray-600 font-inter">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-[#E5F4F9] text-[#0F172A] text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-6">
          Join the Movement
        </h2>
        <p className="text-lg max-w-2xl mx-auto mb-8 font-inter">
          Ready to make a difference? Connect, collaborate, and transform lives with DiasporaBase—no passport needed.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="https://diasporabase.com"
            className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90 text-white px-6 py-3 rounded-full font-inter font-semibold hover:bg-teal-100 transition duration-300"
          >
            Get Started Now
          </a>
          <a
            href="https://diasporabase.com/how-it-works"
            className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-full font-inter font-semibold hover:bg-white hover:text-[#0F172A] transition duration-300"
          >
            Learn More
          </a>
        </div>
      </section>
      <Footer/>
    </div>
  );
};

export default AboutUs;