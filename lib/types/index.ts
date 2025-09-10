export type AgencyRequestStatus = "pending" | "accepted" | "rejected";
export type DeliverableStatus = "Done" | "Pending" | "In Progress" | "Cancelled";
export type MilestoneStatus = "Done" | "Pending" | "In Progress" | "Cancelled";
export type NotificationType = "request_status_change" | "project_approval" | "new_agency" | "new_project";
export type ProfileRole = "super_admin" | "admin" | "volunteer" | "agency";
export type ProjectStatus = "active" | "completed" | "pending" | "cancelled";

export interface AgencyRequest {
  id: string;
  projectId: string;
  volunteerId: string;
  requesterId: string;
  createdAt: string;
  status: AgencyRequestStatus;
}

export interface Deliverable {
  id: string;
  projectId?: string;
  milestoneId?: string;
  title: string;
  description?: string;
  dueDate: string;
  status: DeliverableStatus;
  createdAt?: string;
}

export interface Milestone {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  dueDate: string;
  status: MilestoneStatus;
  createdAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  isRead?: boolean;
  createdAt?: string;
  relatedId?: string;
}

export interface Profile {
  id: string;
  fullName?: string;
  email?: string;
  role?: ProfileRole;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  skills?: string[];
  availability?: string;
  experience?: string;
  residenceCountry?: string;
  residenceState?: string;
  originCountry?: string;
  originState?: string;
  originLga?: string;
  organizationName?: string;
  contactPersonFirstName?: string;
  contactPersonLastName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  website?: string;
  organizationType?: string;
  description?: string;
  taxId?: string;
  focusAreas?: string[];
  environmentCities?: string[];
  environmentStates?: string[];
  receivesUpdates?: boolean;
  profilePicture?: string;
  updatedAt?: string;
  notificationPreferences?: Record<string, any>;
  deletedAt?: string;
  isActive?: boolean;
  volunteerCountries?: string[];
  volunteerStates?: string[];
  volunteerLgas?: string[];
}

export interface ProjectLeaveReason {
  id: string;
  projectId: string;
  volunteerId: string;
  reason: string;
  createdAt: string;
}

export interface ProjectRating {
  id: string;
  createdAt: string;
  projectId: string;
  userId?: string;
  userName: string;
  rating: number;
  comment?: string;
  email?: string;
}

export interface ProjectVolunteer {
  projectId: string;
  volunteerId: string;
  createdAt: string;
}

export interface Project {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  organizationId?: string;
  organizationName: string;
  location: string;
  startDate: string;
  endDate: string;
  volunteersRegistered?: number;
  status?: ProjectStatus;
  category: string;
  requiredSkills?: string[];
  updatedAt?: string;
  volunteersNeeded?: number;
}

export interface Skillset {
  id: string;
  label: string;
  parentId?: string;
}

export interface VolunteerRequest {
  id: string;
  createdAt: string;
  projectId: string;
  volunteerId: string;
  status: AgencyRequestStatus;
}