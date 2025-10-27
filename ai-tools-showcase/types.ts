import { Timestamp } from "firebase/firestore";

export enum ApprovalStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export interface AITool {
  id: string;
  name: string;
  link: string;
  description: string;
  keywords: string[];
  imageBase64: string;
  status: ApprovalStatus;
  submittedBy: string;
  createdAt?: Timestamp;
}

export interface AppUser {
  uid: string;
  email: string | null;
  // Optional flag populated from Firestore users/{uid} document.
  isAdmin?: boolean;
}
