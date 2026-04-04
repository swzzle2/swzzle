'use client';

import { useEffect, useState } from 'react';

export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<{ active: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => setAnnouncement(data.announcementBar))
      .catch(() => {});
  }, []);

  if (!announcement?.active || !announcement.text) return null;

  return (
    <div className="bg-neon-red text-white text-center text-sm font-display font-bold py-2 px-4 tracking-wide">
      {announcement.text}
    </div>
  );
}
