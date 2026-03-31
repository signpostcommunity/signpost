export interface MentorshipCategory {
  id: string
  label: string
  items: MentorshipItem[]
}

export interface MentorshipItem {
  id: string
  label: string
  description?: string
}

export const MENTORSHIP_CATEGORIES: MentorshipCategory[] = [
  {
    id: 'getting_started',
    label: 'Getting Started',
    items: [
      {
        id: 'entering_field',
        label: 'Interpreter entering the field (0-3 years experience)',
        description: 'Mentorship on general professional and linguistic skills',
      },
      {
        id: 'cert_prep',
        label: 'Preparing for certification',
      },
    ],
  },
  {
    id: 'specialized_settings',
    label: 'Specialized Settings',
    items: [
      { id: 'educational', label: 'Educational' },
      { id: 'legal', label: 'Legal' },
      { id: 'medical', label: 'Medical' },
      { id: 'mental_health', label: 'Mental Health' },
      { id: 'music', label: 'Music' },
      { id: 'religious', label: 'Religious' },
      { id: 'stem', label: 'STEM' },
      { id: 'theatre', label: 'Theatre' },
      { id: 'vrs', label: 'VRS' },
    ],
  },
  {
    id: 'skill_development',
    label: 'Skill Development',
    items: [
      { id: 'asl_development', label: 'ASL development' },
      { id: 'cued_speech', label: 'Cued Speech Transliteration' },
      { id: 'deaf_interpreter_skills', label: 'Deaf Interpreter skill development' },
      { id: 'deafblind_ptasl', label: 'DeafBlind Pro-Tactile ASL (PTASL)' },
      { id: 'english_transliteration', label: 'English Transliteration' },
      { id: 'international_sign', label: 'International Sign' },
      { id: 'oral_transliteration', label: 'Oral Transliteration' },
      { id: 'trilingual', label: 'Trilingual Interpreting' },
      { id: 'voice_interpreting', label: 'Voice interpreting' },
      { id: 'di_teaming', label: 'Working with Deaf Interpreters (DI Teaming)' },
    ],
  },
  {
    id: 'business_development',
    label: 'Business Development',
    items: [
      { id: 'taxes_accounting', label: 'Business taxes and accounting (S-corp, LLC, sole prop)' },
      { id: 'going_freelance', label: 'Going freelance for the first time' },
      { id: 'insurance', label: 'Insurance (liability, professional, health as self-employed)' },
      { id: 'invoicing', label: 'Invoicing' },
      { id: 'rates_terms', label: 'Setting and negotiating rates and terms' },
      { id: 'work_life_balance', label: 'Work-life balance and burnout prevention' },
    ],
  },
]

// Flat list of all item IDs for validation
export const ALL_MENTORSHIP_TYPE_IDS = MENTORSHIP_CATEGORIES.flatMap(c => c.items.map(i => i.id))

// Helper: get label for an ID
export function getMentorshipLabel(id: string): string {
  for (const cat of MENTORSHIP_CATEGORIES) {
    const item = cat.items.find(i => i.id === id)
    if (item) return item.label
  }
  return id
}

// Helper: get category label for an item ID
export function getMentorshipCategoryLabel(id: string): string {
  for (const cat of MENTORSHIP_CATEGORIES) {
    if (cat.items.some(i => i.id === id)) return cat.label
  }
  return ''
}
