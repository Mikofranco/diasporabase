// app/dashboard/agencies/review/[agencyId]/page.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

const supabase = createClient();

interface Agency {
  id: string;
  organization_name: string;
  contact_person_email: string;
  full_name: string;
  is_active: boolean;
}

const AgencyReviewPage: React.FC = () => {
  const { agencyId } = useParams();
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agencyId) {
      toast.error("No agency ID provided");
      setLoading(false);
      return;
    }
    console.log("agencyId on mount:", agencyId); // Debugging line
  }, []);


  useEffect(() => {
    async function fetchAgency() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, organization_name, contact_person_email, full_name, is_active")
          .eq("id", agencyId)
          .eq("role", "agency")
          .single();
        if (error) throw error;
        setAgency(data);
      } catch (err: any) {
        toast.error("Error fetching agency: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAgency();
  }, [agencyId]);

  const handleAgencyAction = async (isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", agencyId);
      if (error) throw error;
      toast.success(`Agency ${isActive ? "approved" : "rejected"} successfully`);
      router.push("/dashboard/notifications");
    } catch (err: any) {
      toast.error(`Error updating agency: ${err.message}`);
    }
  };

  if (loading) return <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>;
  if (!agency) return <p className="text-sm text-gray-600 dark:text-gray-400">Agency not found</p>;

  return (
    <Card className="max-w-2xl mx-auto bg-white dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Review Agency: {agency.organization_name || agency.full_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Organization Name</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{agency.organization_name || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Contact Email</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{agency.contact_person_email || agency.full_name}</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-[#0284C7] hover:bg-blue-700 text-white text-xs"
            onClick={() => handleAgencyAction(true)}
          >
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
          <Button
            variant="destructive"
            className="text-xs"
            onClick={() => handleAgencyAction(false)}
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgencyReviewPage;