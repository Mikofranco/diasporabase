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
      className={className}
      role="listitem"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: "#f9fafb",
        transition: "background-color 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px" }}>
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 500, color: "#1f2937" }}>{title}</h4>
        <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>{period}</p>
      </div>
    </div>
  );
};

export default RecentActivityItems;