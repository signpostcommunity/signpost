export interface CompletionItem {
  key: string
  label: string
  complete: boolean
  editorTab: string // tab query param value for the profile editor
  tabLabel: string  // display label for the tab link
}

export function getInterpreterCompletionItems(profile: {
  photo_url: string | null
  bio: string | null
  bio_specializations: string | null
  video_url: string | null
  sign_languages: string[] | null
  spoken_languages: string[] | null
  specializations: string[] | null
}, rateProfileCount: number): CompletionItem[] {
  return [
    {
      key: 'photo',
      label: 'Profile photo',
      complete: !!(profile.photo_url && profile.photo_url.trim() !== ''),
      editorTab: 'personal',
      tabLabel: 'Personal',
    },
    {
      key: 'bio',
      label: 'Bio',
      complete: !!(profile.bio && profile.bio.trim().length >= 20),
      editorTab: 'bio-&-video',
      tabLabel: 'Bio & Video',
    },
    {
      key: 'bio_specializations',
      label: 'Specialization bio',
      complete: !!(profile.bio_specializations && profile.bio_specializations.trim().length >= 20),
      editorTab: 'bio-&-video',
      tabLabel: 'Bio & Video',
    },
    {
      key: 'video',
      label: 'Intro video',
      complete: !!(profile.video_url && profile.video_url.trim() !== ''),
      editorTab: 'bio-&-video',
      tabLabel: 'Bio & Video',
    },
    {
      key: 'sign_languages',
      label: 'Sign languages',
      complete: !!(profile.sign_languages && profile.sign_languages.length > 0),
      editorTab: 'languages',
      tabLabel: 'Languages',
    },
    {
      key: 'spoken_languages',
      label: 'Spoken languages',
      complete: !!(profile.spoken_languages && profile.spoken_languages.length > 0),
      editorTab: 'languages',
      tabLabel: 'Languages',
    },
    {
      key: 'specializations',
      label: 'Specializations',
      complete: !!(profile.specializations && profile.specializations.length > 0),
      editorTab: 'skills',
      tabLabel: 'Skills',
    },
    {
      key: 'rate_profile',
      label: 'Rate profile',
      complete: rateProfileCount > 0,
      editorTab: '',
      tabLabel: 'Rates',
    },
  ]
}

export function isProfileComplete(items: CompletionItem[]): boolean {
  return items.every(item => item.complete)
}

export function completionCount(items: CompletionItem[]): { done: number; total: number } {
  return {
    done: items.filter(i => i.complete).length,
    total: items.length,
  }
}
