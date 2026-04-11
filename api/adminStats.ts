// api/adminStats.ts — returns dashboard metrics using Admin SDK (bypasses Firestore rules)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin } from '../lib/adminInit';
import { getFirestore } from 'firebase-admin/firestore';
import { setCors } from '../lib/shared';

const DB_ID = 'ai-studio-0f7174ae-7a98-4951-8d4f-e23ec80681da';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Simple token check
  const auth = req.headers['x-admin-token'];
  if (auth !== 'ryl2025admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    initAdmin();
    const db = getFirestore(DB_ID);

    // Fetch scan_events (last 500)
    const eventsSnap = await db.collection('scan_events')
      .orderBy('scanned_at', 'desc')
      .limit(500)
      .get();

    const events = eventsSnap.docs.map(d => {
      const data = d.data();
      return {
        product_name: data.product_name || '',
        brand: data.brand || '',
        category: data.category || '',
        overall_score: data.overall_score ?? 0,
        scanned_at: data.scanned_at?.toMillis() ?? 0,
        user_id: data.user_id || '',
      };
    });

    // Fetch products (limit 200)
    const productsSnap = await db.collection('products').limit(200).get();
    const products = productsSnap.docs.map(d => {
      const data = d.data();
      return {
        product_name: data.product_name || '',
        brand: data.brand || '',
        data_source: data.data_source || '',
      };
    });

    return res.status(200).json({ events, products });

  } catch (error: any) {
    console.error('[adminStats] Error:', error?.message || error);
    return res.status(500).json({ error: error?.message || 'Failed to fetch stats' });
  }
}
