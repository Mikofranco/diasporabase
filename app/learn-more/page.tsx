"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Globe,
  Users,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import SelectSignUpType from "@/components/modals/select-signup-type";

const LearnMore = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center h-[60vh] flex items-center justify-center"
        style={{
          backgroundImage: `url('https://diasporabase.com/lifestyle-people-office.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            DiasporaBase: Global Impact, Local Roots
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-6">
            Connect diaspora professionals with their home countries to drive
            meaningful development through virtual volunteering and
            collaboration.
          </p>
          <Button
            asChild
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6"
            data-modal-trigger="select-signup-type-modal"
          >
            <span className="flex items-center">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </span>
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      {/* <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">
            How DiasporaBase Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  Join the Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Diaspora professionals and government institutions register,
                  creating profiles with their skills, expertise, and project
                  needs. All institutions are verified for trust.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  Find & Join Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Our smart matching system connects volunteers with projects
                  based on skills and location preferences. Accept invitations
                  and join virtual project boards.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  Collaborate & Monitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Work together on project boards, track milestones, and share
                  updates. Citizens can provide feedback and upload evidence to
                  ensure transparency.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section> */}

      {/* Key Features Section */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
          <Accordion type="single" collapsible className="max-w-2xl mx-auto">
            <AccordionItem value="feature-1">
              <AccordionTrigger>Virtual Project Collaboration</AccordionTrigger>
              <AccordionContent>
                Join dedicated project boards to collaborate on tasks, track
                milestones, and share documents. Each project includes clear
                objectives, timelines, and deliverables for seamless virtual
                teamwork.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="feature-2">
              <AccordionTrigger>Smart Project Matching</AccordionTrigger>
              <AccordionContent>
                Our platform uses your skills, availability, and preferred
                regions to match you with relevant development projects,
                ensuring you contribute where it matters most.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="feature-3">
              <AccordionTrigger>Citizen Engagement</AccordionTrigger>
              <AccordionContent>
                Citizens can monitor projects, upload photos or videos of
                on-ground progress, and provide feedback, fostering transparency
                and accountability.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="feature-4">
              <AccordionTrigger>Anonymity Options</AccordionTrigger>
              <AccordionContent>
                Diaspora professionals can choose to remain anonymous to the
                public, protecting personal information while sharing expertise
                and project contributions.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="feature-5">
              <AccordionTrigger>Real-Time Analytics</AccordionTrigger>
              <AccordionContent>
                Access dashboards with insights on project progress, volunteer
                activity, and impact metrics, tailored for each country
                instance.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Stakeholder Benefits Section */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Who Benefits from DiasporaBase?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">
                  Diaspora Professionals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Contribute your expertise to your home country from anywhere
                  in the world. Build your impact through virtual volunteering
                  and earn recognition for your work.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">
                  Government Institutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Access skilled diaspora talent to support development
                  projects, with verified profiles and transparent project
                  management tools.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Citizens</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Monitor local projects, share feedback, and ensure
                  accountability by uploading evidence of on-ground progress.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-12 bg-[#0EA5E9] text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg max-w-xl mx-auto mb-6">
            Join DiasporaBase today to connect, collaborate, and drive impactful
            change in your home country.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              asChild
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <a href="/register-volunteer">Sign Up as a Volunteer</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="text-black border-white hover:bg-blue-700/20 hover:border-white hover:text-white"
            >
              <a href="/contact">Contact Us</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <SelectSignUpType/>
    </div>
  );
};

export default LearnMore;
