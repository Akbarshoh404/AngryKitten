/** Styleguide-only wrapper that gives MoodToggle local state. */
import { useState } from 'react';
import MoodToggle, { type Mood } from './MoodToggle';

export default function MoodToggleDemo({ initial = 'play' }: { initial?: Mood }) {
  const [mood, setMood] = useState<Mood>(initial);
  return (
    <MoodToggle
      value={mood}
      onChange={setMood}
      labels={{ group: 'Site mood', play: 'Play mode', work: 'Work mode' }}
    />
  );
}
