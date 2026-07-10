import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { platformService } from '../services/platformService';
import { downloadCsv, logbookToCsv, NSW_REQUIRED_HOURS } from '../lib/logbook';
import type { LogbookEntry } from '../types';
import { Icon } from './Icon';

interface LogbookCardProps {
  learnerId: string;
}

// NSW logbook progress from real completed lessons, with the 3-for-1 bonus
// applied by the learner_logbook DB view. Exports CSV for Service NSW apps.
export const LogbookCard = ({ learnerId }: LogbookCardProps) => {
  const [entries, setEntries] = useState<LogbookEntry[]>([]);

  useEffect(() => {
    platformService.getLogbook(learnerId).then(setEntries).catch(() => {});
  }, [learnerId]);

  const credited = Math.round(entries.reduce((s, e) => s + Number(e.credited_hours), 0) * 100) / 100;
  const actual = Math.round(entries.reduce((s, e) => s + Number(e.actual_hours), 0) * 100) / 100;
  const pct = Math.min(100, (credited / NSW_REQUIRED_HOURS) * 100);

  return (
    <div className="sd-card" style={{ padding: 24 }}>
      <div className="sd-row sd-between sd-acenter">
        <div className="sd-eyebrow">// NSW Logbook</div>
        {entries.length > 0 && (
          <button
            onClick={() => downloadCsv(logbookToCsv(entries))}
            className="sd-btn sd-btn-ghost sd-btn-sm"
            title="Export for Service NSW logbook apps"
          >
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>
      <h2 className="sd-display" style={{ fontSize: 56, margin: '10px 0 0', lineHeight: 1 }}>
        {credited}<span style={{ color: 'var(--ink-soft)', fontSize: 28 }}>/{NSW_REQUIRED_HOURS} hrs</span>
      </h2>
      <div className="sd-muted" style={{ fontSize: 12, marginBottom: 18 }}>
        {entries.length} lesson{entries.length !== 1 ? 's' : ''} · {actual} hrs driven · 3-for-1 bonus on first 10 lessons
      </div>
      <svg width="100%" viewBox="0 0 100 8" preserveAspectRatio="none" style={{ height: 14, marginBottom: 14 }}>
        <rect x="0" y="0" width="100" height="8" fill="var(--paper-2)" rx="4" />
        <rect x="0" y="0" width={pct} height="8" fill="var(--cobalt)" rx="4" />
      </svg>
      <div className="sd-row sd-gap-2" style={{ flexWrap: 'wrap' }}>
        <span className="sd-chip"><Icon name="clock" size={11}/> Structured: {actual} hrs</span>
        <span className="sd-chip"><Icon name="star" size={11}/> Bonus credit: {Math.round((credited - actual) * 100) / 100} hrs</span>
      </div>
    </div>
  );
};
