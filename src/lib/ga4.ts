// /lib/ga4.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import path from 'path';

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: path.join(process.cwd(), 'var', 'credentials.json'), // credentials.json のパス
});

const PROPERTY_ID = 'properties/331056525'; // ←ボスのプロパティID

export async function fetchGA4SessionsUsers() {
  const [response] = await analyticsDataClient.runReport({
    property: PROPERTY_ID,
    dateRanges: [{ startDate: '14daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
    ],
  });

  // データ整形
  const result = response.rows?.map(row => ({
    date: row.dimensionValues?.[0]?.value,
    sessions: parseInt(row.metricValues?.[0]?.value ?? '0', 10),
    users: parseInt(row.metricValues?.[1]?.value ?? '0', 10),
  }));

  return result || [];
}