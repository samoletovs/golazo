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
  const paths = {
    touch: '<path d="M65 150H140Q165 150 165 120V60" stroke-dasharray="6 7"/><path d="M165 150Q205 190 253 126"/>',
    pass: '<path d="m80 186 130-92-23 87-100-76" stroke-dasharray="6 7"/>',
    turn: '<path d="M65 165Q155 60 200 145T275 75"/>',
    position: '<path d="M160 23v204M20 124h280"/><circle cx="160" cy="124" r="48"/>',
  };
  return `<div class="tactical-board"><svg viewBox="0 0 320 250" aria-hidden="true">
    <g fill="none" stroke="#a8b9fb" stroke-width="1"><rect x="20" y="23" width="280" height="204" rx="1"/><path d="M20 124h280"/><circle cx="160" cy="124" r="43"/><path d="M112 23v33h96V23M112 227v-33h96v33"/></g>
    <g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round">${paths[kind] || paths.touch}</g>
    ${kind !== 'position' ? `${kind === 'pass' ? '<path d="M280 72v115" stroke="#ff9b7b" stroke-width="8"/>' : '<g fill="#ff9b7b" stroke="#14243b" stroke-width="1.5"><path d="m123 111 7 13h-14Z"/><path d="m229 163 7 13h-14Z"/></g>'}
    <g stroke="#fff" stroke-width="2"><circle cx="65" cy="150" r="${active === 1 ? 15 : 11}" fill="#14243b"/><circle cx="165" cy="150" r="${active === 2 ? 15 : 11}" fill="#14243b"/><circle cx="253" cy="126" r="${active === 3 ? 15 : 11}" fill="#ff9b7b"/></g>
    <g fill="#fff" font-size="11" font-family="system-ui" font-weight="700" text-anchor="middle"><text x="65" y="154">1</text><text x="165" y="154">2</text><text x="253" y="130" fill="#14243b">3</text></g>` : ''}
    ${kind === 'position' ? `<circle cx="${px}" cy="${py}" r="20" fill="#ff9b7b"/><text x="${px}" y="${py + 5}" text-anchor="middle" fill="#14243b" font-family="system-ui" font-size="13" font-weight="700">${esc(position)}</text>` : ''}
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
