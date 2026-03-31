export type UserRole = 'interpreter' | 'deaf' | 'org' | 'requester';

export interface Interpreter {
  id: number | string;
  userId?: string;
  initials: string;
  name: string;
  location: string;
  state: string;
  country: string;
  signLangs: string[];
  spokenLangs: string[];
  specs: string[];
  specializedSkills?: string[];
  certs: string[];
  certDetails?: { name: string; issuingBody?: string; year?: string; verificationLink?: string }[];
  rating: number;
  reviews: number;
  available: boolean;
  color: string;
  regions: string[];
  bio?: string;
  bioSpecializations?: string;
  bioExtra?: string;
  videoUrl?: string;
  photoUrl?: string;
  yearsExperience?: string;
  genderIdentity?: string;
  // New identity/affinity fields
  gender: 'male' | 'female' | 'nonbinary' | null;
  isDeafInterpreter: boolean;
  affinities: string[]; // e.g. ['LGBTQ+', 'Deaf-parented']
  racialIdentity: string[]; // e.g. ['Black/African American', 'Asian/Pacific Islander']
  religiousAffiliation: string[]; // e.g. ['Jewish', 'Muslim']
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null; // calculated client-side, miles
  mentorshipOffering?: boolean;
  mentorshipSeeking?: boolean;
  mentorshipTypes?: string[];
  mentorshipPaid?: string | null;
  mentorshipBioOffering?: string | null;
  mentorshipBioSeeking?: string | null;
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
  // New filter fields
  gender: string;
  isDeafInterpreter: boolean;
  affinities: string[];
  racialIdentity: string[];
  religiousAffiliation: string[];
  // Distance filter
  distanceRadius: string; // 'any' | '25' | '50' | '100' | '250'
  userLat: number | null;
  userLng: number | null;
  userLocationLabel: string;
  // Mentorship filter (interpreter-only)
  mentorshipOffering: boolean;
  mentorshipSeeking: boolean;
}