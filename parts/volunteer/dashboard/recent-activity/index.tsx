import React from "react";;
import { GreenTickBoxed, PlusBoxed, StarBoxed } from "@/public/icon";
import RecentActivityItems, { RecentActivityItemsProps } from "./recent-activity-items";

const items: RecentActivityItemsProps[] = [
  {
    icon: <GreenTickBoxed />,
    period: "2 days ago",
    title: `Completed "Homeless Shelter Support" project`,
  },
  {
    icon: <StarBoxed />,
    period: "3 days ago",
    title: `Received 5-star rating from Hope Foundation`,
  },
  {
    icon: <PlusBoxed />,
    period: "1 Week Ago",
    title: `Applied for "Community Garden Project"`,
  },
];

const RecentActivity = () => {
  return (
    <div className="flex flex-col gap-2 shadow-sm border rounded-lg p-4">
      <h2 className="text-gray-600 font-bold">Recent Activity</h2>
      {items.map((item, index) => (
        <RecentActivityItems
          key={index}
          icon={item.icon}
          period={item.period}
          title={item.title}
        />
      ))}
    </div>
  );
};

export default RecentActivity;