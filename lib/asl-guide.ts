export interface AslGuideClip {
  slug: string;
  title: string;
  subtitle: string;
  route: string;
  durationLabel: string;
}

export const ASL_GUIDE_CLIPS: AslGuideClip[] = [
  { slug: 'welcome',      title: 'Welcome to signpost',         subtitle: 'What signpost is and how it works',             route: '/',                            durationLabel: '\u2014' },
  { slug: 'dashboard',     title: 'Your dashboard',              subtitle: 'Overview of your home base',                    route: '/dhh/dashboard',               durationLabel: '\u2014' },
  { slug: 'directory',     title: 'Finding interpreters',        subtitle: 'Browsing and filtering the directory',          route: '/directory',                   durationLabel: '\u2014' },
  { slug: 'interpreters',  title: 'Your interpreter list',       subtitle: 'Building your preferred team',                  route: '/dhh/dashboard/interpreters',  durationLabel: '\u2014' },
  { slug: 'request',       title: 'Making a request',            subtitle: 'How to submit an interpreter request',          route: '/dhh/dashboard/request',       durationLabel: '\u2014' },
  { slug: 'requests',      title: 'Tracking your requests',      subtitle: 'Checking status of your bookings',             route: '/dhh/dashboard/requests',      durationLabel: '\u2014' },
  { slug: 'inbox',         title: 'Messages and notifications',  subtitle: 'Your communication hub',                        route: '/dhh/dashboard/inbox',         durationLabel: '\u2014' },
  { slug: 'preferences',   title: 'Profile and preferences',     subtitle: 'Setting up your communication preferences',     route: '/dhh/dashboard/preferences',   durationLabel: '\u2014' },
  { slug: 'circle',        title: 'Trusted Deaf Circle',         subtitle: 'Sharing interpreter lists with friends',        route: '/dhh/dashboard/circle',        durationLabel: '\u2014' },
  { slug: 'menu',          title: 'Navigating the menu',         subtitle: 'Using the sidebar and role switcher',           route: '_menu',                        durationLabel: '\u2014' },
  { slug: 'about',         title: 'About signpost',              subtitle: 'Meet the founders',                             route: '/about',                       durationLabel: '\u2014' },
  { slug: 'interpreter-dashboard', title: 'Interpreter dashboard', subtitle: 'Overview for interpreter accounts',           route: '/interpreter/dashboard',       durationLabel: '\u2014' },
];

export const ASL_GUIDE_STORAGE_BASE = 'https://udyddevceuulwkqpxkxp.supabase.co/storage/v1/object/public/asl-guide';

export function getVideoUrl(slug: string): string {
  return `${ASL_GUIDE_STORAGE_BASE}/${slug}.mp4`;
}

export function getTransparentVideoUrl(slug: string): string {
  return `${ASL_GUIDE_STORAGE_BASE}/${slug}-transparent.webm`;
}

export function getClipForRoute(pathname: string): AslGuideClip {
  const exact = ASL_GUIDE_CLIPS.find(c => c.route === pathname);
  if (exact) return exact;

  const prefix = ASL_GUIDE_CLIPS
    .filter(c => c.route !== '/' && c.route !== '_menu')
    .sort((a, b) => b.route.length - a.route.length)
    .find(c => pathname.startsWith(c.route));
  if (prefix) return prefix;

  return ASL_GUIDE_CLIPS[0];
}
