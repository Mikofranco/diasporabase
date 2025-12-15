"use client";

import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, Search, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function OpportunityPage() {
  // Mock data - replace with real data fetching later
  const opportunities = [
    {
      id: 1,
      title: "Environmental Cleanup at City Park",
      organization: "Green Earth Initiative",
      location: "Downtown City Park",
      date: "December 20, 2025",
      spots: "8 spots left",
      category: "Environment",
      description: "Help us clean up the park and plant new trees for a greener tomorrow.",
    },
    {
      id: 2,
      title: "Food Distribution for Homeless",
      organization: "Community Care Network",
      location: "Central Shelter",
      date: "Every Saturday",
      spots: "Volunteers needed",
      category: "Social Service",
      description: "Assist in preparing and distributing meals to those in need.",
    },
    {
      id: 3,
      title: "Youth Mentoring Program",
      organization: "Bright Futures Foundation",
      location: "Community Center",
      date: "Ongoing",
      spots: "Mentors needed",
      category: "Education",
      description: "Be a positive role model and guide young students in their studies.",
    },
    {
      id: 4,
      title: "Animal Shelter Volunteer",
      organization: "Paws & Claws Rescue",
      location: "Northside Shelter",
      date: "Weekends",
      spots: "5 spots available",
      category: "Animals",
      description: "Help care for rescued animals, walking dogs and socializing cats.",
    },
  ];

  return (
    <>
      <NavBar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Find Volunteer Opportunities
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Make a difference in your community. Discover meaningful ways to give back and connect with causes you care about.
          </p>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search" className="sr-only">
                  Search opportunities
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by keyword, cause, or organization..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location" className="sr-only">
                  Location
                </Label>
                <Select>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="downtown">Downtown</SelectItem>
                    <SelectItem value="northside">Northside</SelectItem>
                    <SelectItem value="southside">Southside</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button className="w-full" size="lg">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities Grid */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900">Available Opportunities</h2>
            <p className="text-gray-600">Showing {opportunities.length} opportunities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="bg-gray-200 border-2 border-dashed rounded-t-xl w-full h-48" />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary">{opp.category}</Badge>
                    <span className="text-sm text-green-600 font-medium">{opp.spots}</span>
                  </div>
                  <CardTitle className="text-lg mt-2 line-clamp-2">{opp.title}</CardTitle>
                  <CardDescription>{opp.organization}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-3">{opp.description}</p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{opp.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{opp.date}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/opportunities/${opp.id}`}>
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* CTA for Non-Logged-In Users */}
          <div className="mt-16 text-center bg-blue-600 rounded-2xl p-10 text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h3>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Sign up today to apply for opportunities, track your hours, and connect with other volunteers.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/signup">Create Free Account</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}