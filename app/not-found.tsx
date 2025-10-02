"use client";

import { Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#E6F0FA] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center space-y-6">
        <h1 className="text-5xl font-bold text-[#0284C7]">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800">Page Not Found</h2>
        <p className="text-gray-600">
          Oops! It looks like the page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-[#0284C7] hover:bg-[#026BA3] text-white font-semibold">
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}