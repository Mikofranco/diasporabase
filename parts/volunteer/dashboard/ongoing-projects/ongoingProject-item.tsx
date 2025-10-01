import { useRouter } from "next/navigation";
import React from "react";

export interface OngoingProjectItemItemsProps {
  title: string;
  icon: React.ReactNode;
  organization_name: string;
  startDate: string;
  location: string;
  className?: string;
  ariaLabel?: string;
  projectId?: string | number;
}

const OngoingProjectItem: React.FC<OngoingProjectItemItemsProps> = ({
  icon,
  organization_name,
  title,
  startDate,
  location,
  projectId,
  className,
  ariaLabel = `Activity: ${title}, ${organization_name}, Starts: ${startDate}, Location: ${location}`,
}) => {
  const router = useRouter()

  const handleRouting = (id: string | number | undefined) => {
    console.log(`Routing to project with ID: ${id}`);
    router.push(`/dashboard/volunteer/projects/${id}`)
  };
  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 transition-colors cursor-pointer hover:bg-gray-100 ${className || ""}`}
      role="listitem"
      aria-label={ariaLabel}
      onClick={() => handleRouting(projectId)}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10">
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="m-0 text-base font-medium text-gray-900">{title}</h4>
          <p className="m-0 text-sm text-gray-500">{organization_name}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 text-sm text-gray-500">
        <p className="m-0">{startDate}</p>
        <p className="m-0 font-bold">{location}</p>
      </div>
    </div>
  );
};

export default OngoingProjectItem;