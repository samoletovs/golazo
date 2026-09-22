export const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export const weekdays = language => language === 'lv'
  ? ['Pirmd.', 'Otrd.', 'Trešd.', 'Ceturtd.', 'Piektd.', 'Sestd.', 'Svētd.']
  : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function icon(name) {
  const paths = {
    home: '<path d="m3 10 9-7 9 7v11H3Z"/><path d="M9 21v-8h6v8"/>',
    log: '<path d="M6 3h10l3 3v15H6Z"/><path d="M9 10h7M9 14h7M9 18h4"/>',
    progress: '<path d="M3 3v18h18M6 16l5-6 4 3 6-8"/>',
    learn: '<path d="M12 5C9 2 5 3 2 3v16c4-1 7-1 10 2 3-3 6-3 10-2V3c-3 0-7-1-10 2Z"/><path d="M12 5v16"/>',
    profile: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
    schedule: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18"/>',
    match: '<path d="M8 3h8l5 7-3 10H6L3 10Z"/><path d="m12 7 5 4-2 6H9l-2-6Z"/>',
    reflection: '<path d="M4 4h16v13H9l-5 4Z"/><path d="M8 8h8m-8 4h6"/>',
    roster: '<circle cx="8" cy="7" r="3"/><path d="M2 21v-3a6 6 0 0 1 12 0v3"/><path d="M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 4 5v2"/>',
    stats: '<path d="M3 21h18M6 17V9m6 8V3m6 14v-5"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.log}</svg>`;
}

export function tactic(kind = 'touch', active = 0, position = 'CM') {
  const positionPoints = { GK: [160, 208], CB: [160, 182], LB: [60, 182], RB: [260, 182], CDM: [160, 157], CM: [160, 124], CAM: [160, 89], LM: [60, 124], RM: [260, 124], LW: [60, 62], RW: [260, 62], ST: [160, 52] };
  const [px, py] = positionPoints[position] || positionPoints.CM;
  const stations = {
    touch: {
      path: '<path d="M55 183 149 149" stroke-dasharray="6 7"/><path d="M156 145Q185 120 235 70"/><path d="m219 74 18-7-5 19"/>',
      kit: '<path d="m194 86 10 18h-20Zm69 47 10 18h-20Z"/>',
      points: [[55, 183], [153, 147], [238, 67]],
    },
    pass: {
      path: '<path d="M55 177 269 79 159 180" stroke-dasharray="7 6"/><path d="m175 165-20 19 5-23"/>',
      kit: '<path d="M276 50h16v149h-16Z"/><path d="m279 65 10-8m-10 35 10-8m-10 35 10-8m-10 35 10-8m-10 35 10-8" stroke="#14243b" stroke-width="2"/>',
      points: [[55, 177], [268, 79], [155, 184]],
    },
    turn: {
      path: '<path d="M55 171C105 229 167 152 160 106S68 48 65 104s81 119 164 80 22-143-18-121"/><path d="m223 51-17 13 23 1"/>',
      kit: '<path d="m100 101 10 18H90Zm129 10 10 18h-20Z"/>',
      points: [[55, 171], [159, 106], [210, 63]],
    },
  };
  if (kind === 'position') return `<div class="tactical-board position-board"><svg viewBox="0 0 320 250" aria-hidden="true">
    <g fill="none" stroke="#b6c5ff" stroke-width="1.3"><rect x="20" y="23" width="280" height="204"/><path d="M20 124h280"/><circle cx="160" cy="124" r="43"/><path d="M112 23v33h96V23M112 227v-33h96v33"/></g>
    <circle cx="${px}" cy="${py}" r="24" fill="#ff9b7b"/><circle cx="${px}" cy="${py}" r="34" fill="none" stroke="#fff" stroke-width="2"/>
    <text x="${px}" y="${py + 5}" text-anchor="middle" fill="#14243b" font-family="system-ui" font-size="13" font-weight="700">${esc(position)}</text></svg></div>`;
  const station = stations[kind] || stations.touch;
  return `<div class="tactical-board station-board station-${kind}"><svg viewBox="0 0 320 250" aria-hidden="true">
    <g fill="none" stroke="#a8b9fb" stroke-width="1" opacity=".55"><path d="M20 65V22h43m194 0h43v43M20 186v43h43m194 0h43v-43"/><path d="M106 22v207M214 22v207M20 91h280M20 160h280" stroke-dasharray="2 7"/></g>
    <g fill="#ff9b7b" stroke="#14243b" stroke-width="2">${station.kit}</g>
    <g fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${station.path}</g>
    ${station.points.map(([x, y], index) => `<circle cx="${x}" cy="${y}" r="${active === index + 1 ? 20 : 15}" fill="${index === 2 ? '#ff9b7b' : '#14243b'}" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" fill="${index === 2 ? '#14243b' : '#fff'}" font-family="system-ui" font-size="12" font-weight="700">${index + 1}</text>`).join('')}
  </svg></div>`;
}

export function dateLabel(date, language, short = false) {
  return new Intl.DateTimeFormat(language === 'lv' ? 'lv-LV' : 'en-GB', { day: 'numeric', month: short ? 'numeric' : 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

export function link(route, label, className = 'text-link') {
  return `<a class="${className}" href="#${route}">${label}</a>`;
}

export function eventTitle(event, t) {
  return event.titleText ? esc(event.titleText) : t(event.title);
}
