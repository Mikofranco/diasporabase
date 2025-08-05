import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Handshake, Lightbulb } from "lucide-react"

export default function VolunteerOnboardingEmail() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl rounded-lg shadow-lg">
        <CardHeader className="bg-gradient-primary text-white p-6 rounded-t-lg">
          <CardTitle className="text-3xl font-bold text-center">Welcome to Volunteer Connect!</CardTitle>
          <p className="text-center text-lg mt-2">Your journey to make a difference begins now.</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-gray-700 text-lg">Dear Volunteer,</p>
          <p className="text-gray-700">
            Thank you for registering with Volunteer Connect! We're thrilled to have you join our community dedicated to
            creating positive change.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-md">
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-md">Profile Ready</h3>
              <p className="text-sm text-gray-600">Your volunteer profile is set up and ready to go.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-md">
              <Lightbulb className="h-8 w-8 text-yellow-600 mb-2" />
              <h3 className="font-semibold text-md">Discover Opportunities</h3>
              <p className="text-sm text-gray-600">
                Explore a wide range of projects that match your skills and interests.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-md">
              <Handshake className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-md">Connect & Impact</h3>
              <p className="text-sm text-gray-600">Connect with organizations and start making a real impact.</p>
            </div>
          </div>

          <p className="text-gray-700">
            To get started, please click the button below to log in to your dashboard and browse available
            opportunities.
          </p>

          <div className="text-center">
            <Link href="/dashboard/volunteer" passHref>
              <Button size="lg" className="bg-gradient-primary text-white hover:opacity-90 transition-opacity">
                Go to My Volunteer Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-gray-700 text-sm mt-8">
            If you have any questions, feel free to reply to this email or visit our help center.
          </p>
          <p className="text-gray-700 text-sm">
            Best regards,
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
