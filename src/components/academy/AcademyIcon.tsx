export type AcademyIconName = 'home' | 'log' | 'progress' | 'learn' | 'profile' | 'schedule' | 'match' | 'diary' | 'team' | 'settings' | 'check' | 'arrow' | 'trophy'

const paths: Record<AcademyIconName, string> = {
  home: 'M3 10 12 3l9 7v11H3Z M9 21v-8h6v8',
  log: 'M6 3h10l3 3v15H6Z M9 10h7M9 14h7M9 18h4',
  progress: 'M3 3v18h18M6 16l5-6 4 3 6-8',
  learn: 'M12 5C9 2 5 3 2 3v16c4-1 7-1 10 2 3-3 6-3 10-2V3c-3 0-7-1-10 2Z M12 5v16',
  profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 22v-3a8 8 0 0 1 16 0v3',
  schedule: 'M3 5h18v16H3Z M7 2v6m10-6v6M3 11h18',
  match: 'M8 3h8l5 7-3 10H6L3 10Z M12 7l5 4-2 6H9l-2-6Z',
  diary: 'M4 4h16v13H9l-5 4Z M8 8h8m-8 4h6',
  team: 'M11 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M2 21v-3a6 6 0 0 1 12 0v3 M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 4 5v2',
  settings: 'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6M10 15v6',
  check: 'm5 12 4 4L19 6',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  trophy: 'M7 3h10v7a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v6m-5 0h10',
}

export function AcademyIcon({ name, className = '' }: { name: AcademyIconName; className?: string }) {
  return <svg className={`academy-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
