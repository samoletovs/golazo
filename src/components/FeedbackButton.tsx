import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const REPO_OWNER = 'samoletovs';
const REPO_NAME = 'golazo';

const types = {
  bug: { emoji: '🐛', labelKey: 'feedback.bug', ghLabel: 'bug' },
  idea: { emoji: '💡', labelKey: 'feedback.idea', ghLabel: 'enhancement' },
  ux: { emoji: '🎨', labelKey: 'feedback.ux', ghLabel: 'ui/ux' },
} as const;
type FBType = keyof typeof types;

export default function FeedbackButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [type, setType] = useState<FBType>('idea');

  const submit = () => {
    if (!text.trim()) return;
    const fb = types[type];
    const label = t(fb.labelKey);
    const title = `${fb.emoji} ${label}: ${text.slice(0, 80)}`;
    const body = `## ${label}\n\n${text}\n\n---\n*Submitted via golazo in-app feedback*`;
    window.open(
      `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent(fb.ghLabel)}`,
      '_blank',
    );
    setOpen(false);
    setText('');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed z-60 w-11 h-11 rounded-full flex items-center justify-center text-lg cursor-pointer"
        style={{
          bottom: 72, right: 16,
          background: 'var(--color-glass)',
          border: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text-secondary)',
          boxShadow: 'var(--shadow-card)',
        }}
        aria-label={t('feedback.title')}
      >
        💬
      </button>
    );
  }

  return (
    <div
      className="fixed z-[9999] rounded-2xl p-4"
      style={{
        bottom: 72, right: 16, width: 300,
        background: 'var(--color-glass)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-elevated)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('feedback.title')}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>💬 {t('feedback.title')}</span>
        <button onClick={() => setOpen(false)} className="text-base cursor-pointer bg-transparent border-none" style={{ color: 'var(--color-text-muted)' }}>✕</button>
      </div>
      <div className="flex gap-1 mb-2">
        {(Object.keys(types) as FBType[]).map(k => (
          <button
            key={k}
            onClick={() => setType(k)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer"
            style={{
              background: type === k ? 'var(--color-primary)' : 'var(--color-field-input)',
              color: type === k ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {types[k].emoji} {t(types[k].labelKey)}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={t('feedback.placeholder')}
        className="w-full h-20 rounded-lg p-2 text-sm resize-none box-border"
        style={{
          background: 'var(--color-field-input)',
          border: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text)',
        }}
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 py-2 rounded-lg border-none cursor-pointer"
          style={{ background: 'var(--color-field-input)', color: 'var(--color-text-secondary)' }}
        >
          {t('feedback.cancel')}
        </button>
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="flex-1 py-2 rounded-lg border-none cursor-pointer font-semibold"
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
            opacity: text.trim() ? 1 : 0.5,
          }}
        >
          {t('feedback.submit')}
        </button>
      </div>
    </div>
  );
}
