import fs from 'fs';
import path from 'path';

export type Settings = {
  freeShippingThreshold: number;
  announcementBar: {
    active: boolean;
    text: string;
  };
};

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');

export function getSettings(): Settings {
  const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
  return JSON.parse(data) as Settings;
}

export function saveSettings(settings: Settings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}
