import React from "react";

interface RequestSlateProps {
  requestId: string;
  applicantName: string;
  projectTitle: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
  onAccept: () => void;
  onDecline: () => void;
}

const RequestSlate: React.FC<RequestSlateProps> = ({
  requestId,
  applicantName,
  projectTitle,
  createdAt,
  status,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-sm transition-shadow">
      <div className="space-y-1">
        <p className="font-medium text-gray-800">
          {applicantName} applied to{" "}
          <span className="text-blue-600">{projectTitle}</span>
        </p>
        <p className="text-sm text-gray-500">Applied on: {createdAt}</p>
        <p className="text-sm text-gray-500">Status: {status}</p>
      </div>
      {status === "pending" && (
        <div className="flex space-x-2">
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            disabled={status !== "pending"}
          >
            Accept
          </button>
          <button
            onClick={onDecline}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            disabled={status !== "pending"}
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestSlate;