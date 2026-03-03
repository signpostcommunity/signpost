export type UserRole = 'interpreter' | 'deaf' | 'org' | 'requester';

export interface Interpreter {
  id: number;
  initials: string;
  name: string;
  location: string;
  state: string;
  signLangs: string[];
  spokenLangs: string[];
  specs: string[];
  certs: string[];
  rating: number;
  reviews: number;
  available: boolean;
  color: string;
  regions: string[];
  bio?: string;
  videoUrl?: string;
  website?: string;
}

export interface RateProfile {
  id: string;
  label: string;
  isDefault: boolean;
  color: string;
  hourlyRate: number;
  currency: string;
  afterHoursDiff?: number;
  minBooking?: number;
  cancellationPolicy?: string;
  lateCancelFee?: number;
  travelExpenses?: Record<string, unknown>;
  eligibilityCriteria?: string;
  additionalTerms?: string;
}

export interface RosterItem {
  id: string;
  interpreter: Interpreter;
  tier: 'top' | 'preferred' | 'backup';
  approveWork: boolean;
  approvePersonal: boolean;
  notes?: string;
}

export interface Booking {
  id: string;
  interpreterId: string;
  interpreterName: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed';
  date: string;
  timeStart: string;
  timeEnd: string;
  location?: string;
  format: 'in_person' | 'remote';
  description?: string;
  createdAt: string;
}

export interface FilterState {
  signLangs: string[];
  spokenLangs: string[];
  specs: string[];
  certs: string[];
  regions: string[];
  availability: string | null;
  search: string;
  country: string;
}
