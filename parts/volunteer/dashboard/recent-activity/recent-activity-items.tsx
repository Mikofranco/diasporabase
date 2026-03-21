import React from "react";

export interface RecentActivityItemsProps {
  title: string;
  icon: React.ReactNode;
  period: string;
  className?: string;
  ariaLabel?: string;
}

const RecentActivityItems: React.FC<RecentActivityItemsProps> = ({
  icon,
  period,
  title,
  className,
  ariaLabel = `Activity: ${title}, ${period}`,
}) => {
  return (
    <div
      className={`flex gap-6 rounded-md p-2 ${className}`}
      role="listitem"
      aria-label={ariaLabel}
    >
      <div className="w-4 h-4 ">
        {icon}
      </div>
      <div className="flex flex-col gap-1 ml-2">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500">{period}</p>
      </div>
    </div>
  );
};

export default RecentActivityItems;