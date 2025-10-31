export const fallbackStats = {
  logins: 128,
  pageViews: 3421,
  activeSessions: 47,
  deltaLogins: '+8%',
  deltaPageViews: '+3%',
  deltaActiveSessions: '+2%',
};

export const fallbackLineData = Array.from({ length: 12 }).map((_, i) => ({
  label: `T${i + 1}`,
  value: Math.round(50 + Math.random() * 100),
}));

export const fallbackBarData = [
  { label: 'Mon', value: 420 },
  { label: 'Tue', value: 560 },
  { label: 'Wed', value: 380 },
  { label: 'Thu', value: 610 },
  { label: 'Fri', value: 720 },
  { label: 'Sat', value: 210 },
  { label: 'Sun', value: 330 },
];

export const fallbackPieData = [
  { label: 'Web', value: 54 },
  { label: 'iOS', value: 28 },
  { label: 'Android', value: 18 },
];

export const fallbackFeed = Array.from({ length: 12 }).map((_, i) => ({
  id: `f-${i}`,
  type: ['login', 'page_view', 'logout'][i % 3],
  user: ['alex@demo.test', 'sam@demo.test', 'jordan@demo.test'][i % 3],
  message: ['Logged in', 'Viewed Dashboard', 'Logged out'][i % 3],
  ts: Date.now() - i * 1000 * 60,
}));
