export const SPECIALIZATION_CATEGORIES: Record<string, string[]> = {
  "Arts & Performance": [
    "Theatre / Play",
    "Concert / Music performance",
    "Dance performance",
    "Film / Screening",
    "Comedy / Stand-up"
  ],
  "Legal & Civic": [
    "Court hearing / Deposition",
    "Police / Law enforcement",
    "Government / DMV / Benefits",
    "Notary / Document signing",
    "Interpreting for D/HH Attorneys / Legal Professionals"
  ],
  "Medical & Wellness": [
    "Doctor / Specialist appointment",
    "Mental health session",
    "Hospital / Emergency",
    "Dental / Vision",
    "Interpreting for D/HH Medical Professionals"
  ],
  "Education": [
    "K-12 classroom",
    "IEP / 504 meeting",
    "Higher education lecture",
    "Parent-teacher conference",
    "Tutoring / Academic support",
    "Interpreting for D/HH Academics (Higher Ed)"
  ],
  "Workplace & Professional": [
    "Staff meeting / All-hands",
    "Job interview",
    "HR / Employee relations",
    "Training / Onboarding",
    "Conference / Summit",
    "Interpreting for D/HH Business Leaders",
    "Interpreting for D/HH Professionals in Technical / Scientific Fields",
    "Tech / IT",
    "Science / Research"
  ],
  "Religious & Spiritual": [
    "Worship service",
    "Ceremony (wedding, funeral, baptism)",
    "Religious education",
    "Pastoral counseling"
  ],
  "Community & Social": [
    "Community event / Town hall",
    "Social services appointment",
    "Housing / Real estate",
    "Recreation / Sports"
  ],
  "Personal & Life Events": [
    "Wedding",
    "Funeral / Memorial",
    "Family reunion / Celebration",
    "Private appointment"
  ],
  "Other": [
    "Other (describe in notes)"
  ]
}

export const SPECIALIZED_SKILLS = [
  "Cued Speech Transliteration",
  "DeafBlind Pro-Tactile ASL (PTASL)",
  "Oral Transliteration",
  "Platform Voicing / Specialized Voice Interpreting",
  "Trilingual Interpreting"
]

// All sub-categories as a flat array (for backward compat / simple lookups)
export const ALL_SPECIALIZATIONS = Object.values(SPECIALIZATION_CATEGORIES).flat()

// Map a sub-category back to its parent category
export function getCategoryForSpec(spec: string): string | null {
  for (const [category, subs] of Object.entries(SPECIALIZATION_CATEGORIES)) {
    if (subs.includes(spec)) return category
  }
  return null
}

// Group an array of flat specs into { category: specs[] }
export function groupSpecsByCategory(specs: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  for (const spec of specs) {
    const cat = getCategoryForSpec(spec)
    if (cat) {
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(spec)
    }
  }
  return grouped
}

// Legacy migration map — old flat values to new sub-categories
export const LEGACY_SPEC_MAP: Record<string, string[]> = {
  "Medical": ["Doctor / Specialist appointment"],
  "Legal": ["Court hearing / Deposition"],
  "Conference / Events": ["Conference / Summit"],
  "Academic / Education": ["K-12 classroom"],
  "Mental Health": ["Mental health session"],
  "Religious": ["Worship service"],
  "Technical / IT": ["Staff meeting / All-hands"],
  "Music / Concerts": ["Concert / Music performance"],
  "Theatre": ["Theatre / Play"],
  "Business": ["Staff meeting / All-hands"],
  "Police / Emergency": ["Police / Law enforcement"],
  "Diplomatic": ["Government / DMV / Benefits"],
  "Platform / Highly-Specialized Voice Interpreting": ["Platform Voicing / Specialized Voice Interpreting"],
}
