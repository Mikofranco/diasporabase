"use client"
import Notifications from "@/components/NotificationPanel";
import NotificationPanel from "@/components/NotificationPanel";
import { checkIfAgencyIsActive } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const AgencyDashboard = () => {
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const router =useRouter()

  useEffect(() => {
    checkIfAgencyIsActive().then((active:boolean) => {
      setIsActive(active);
      if (!active) {
        router.push("/approval-pending");
      }
    });
  }, []);
  return (
    <div>
      AgencyDashboard
      <Notifications />
    </div>
  );
};

export default AgencyDashboard;
