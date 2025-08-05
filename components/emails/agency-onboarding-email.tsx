import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Briefcase, BarChart } from "lucide-react"

export default function AgencyOnboardingEmail() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl rounded-lg shadow-lg">
        <CardHeader className="bg-gradient-primary text-white p-6 rounded-t-lg">
          <CardTitle className="text-3xl font-bold text-center">Welcome to Volunteer Connect!</CardTitle>
          <p className="text-center text-lg mt-2">Your platform to empower your mission.</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-gray-700 text-lg">Dear Organization,</p>
          <p className="text-gray-700">
            Thank you for registering your organization with Volunteer Connect! We're excited to help you connect with
            passionate volunteers and amplify your impact.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-md">
              <Building className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-md">Organization Profile</h3>
              <p className="text-sm text-gray-600">Your organization's profile is now active.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-md">
              <Briefcase className="h-8 w-8 text-yellow-600 mb-2" />
              <h3 className="font-semibold text-md">Create Projects</h3>
              <p className="text-sm text-gray-600">Easily post new volunteer projects and manage your initiatives.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-md">
              <BarChart className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-md">Track Progress</h3>
              <p className="text-sm text-gray-600">Monitor volunteer applications and project analytics.</p>
            </div>
          </div>

          <p className="text-gray-700">
            To begin posting projects and managing your volunteer needs, please click the button below to access your
            agency dashboard.
          </p>

          <div className="text-center">
            <Link href="/dashboard/agency" passHref>
              <Button size="lg" className="bg-gradient-primary text-white hover:opacity-90 transition-opacity">
                Go to My Agency Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-gray-700 text-sm mt-8">
            If you have any questions or need assistance, please don't hesitate to reach out to our support team.
          </p>
          <p className="text-gray-700 text-sm">
            Sincerely,
            <br />
            The Volunteer Connect Team
          </p>
        </CardContent>
        <div className="bg-gray-200 p-4 text-center text-gray-600 text-xs rounded-b-lg">
          <p>&copy; {new Date().getFullYear()} Volunteer Connect. All rights reserved.</p>
          <p>123 Community Lane, City, Country</p>
        </div>
      </Card>
    </div>
  )
}
