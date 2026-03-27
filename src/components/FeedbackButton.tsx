import { useState } from 'react';

const REPO_OWNER = 'samoletovs';
const REPO_NAME = 'golazo';

const types = {
  bug: { emoji: '🐛', label: 'Bug Report', ghLabel: 'bug' },
  idea: { emoji: '💡', label: 'Feature Idea', ghLabel: 'enhancement' },
  ux: { emoji: '🎨', label: 'UI/UX', ghLabel: 'ui/ux' },
} as const;
type FBType = keyof typeof types;

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [type, setType] = useState<FBType>('idea');

  const submit = () => {
    if (!text.trim()) return;
    const t = types[type];
    const title = `${t.emoji} ${t.label}: ${text.slice(0, 80)}`;
    const body = `## ${t.label}\n\n${text}\n\n---\n*Submitted via golazo in-app feedback*`;
    window.open(
      `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent(t.ghLabel)}`,
      '_blank',
    );
    setOpen(false);
    setText('');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 72, right: 16, zIndex: 60,
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.125rem', color: 'rgba(255,255,255,0.7)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        aria-label="Send feedback"
      >
        💬
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 72, right: 16, zIndex: 9999,
      width: 300, background: '#1a1a2e', borderRadius: 16, padding: 16,
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>💬 Feedback</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {(Object.keys(types) as FBType[]).map(k => (
          <button
            key={k}
            onClick={() => setType(k)}
            style={{
              flex: 1, padding: 6, borderRadius: 8, fontSize: 11, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: type === k ? '#22c55e' : 'rgba(255,255,255,0.06)',
              color: type === k ? '#000' : 'rgba(255,255,255,0.6)',
            }}
          >
            {types[k].emoji} {types[k].label}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Describe..."
        style={{
          width: '100%', height: 80, borderRadius: 8, padding: 8,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', resize: 'none', boxSizing: 'border-box', fontSize: '0.875rem',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => setOpen(false)}
          style={{ flex: 1, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!text.trim()}
          style={{ flex: 1, padding: 8, borderRadius: 8, background: '#22c55e', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: text.trim() ? 1 : 0.5 }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
