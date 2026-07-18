import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/mongodb';

interface ChatMessage {
  _id?: string;
  author: string;
  message: string;
  timestamp: number;
}

// GET — return the last 60 messages
export async function GET(_req: NextRequest) {
  try {
    const db = await getDb();
    const col = db.collection<ChatMessage>('chat');
    const messages = await col
      .find({})
      .sort({ timestamp: -1 })
      .limit(60)
      .toArray();
    // Return in chronological order
    return Response.json({ messages: messages.reverse() });
  } catch {
    return Response.json({ messages: [] });
  }
}

// POST — submit a new chat message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const author = (typeof body?.author === 'string' ? body.author : '').trim().slice(0, 40) || 'Traveler';
    const message = (typeof body?.message === 'string' ? body.message : '').trim().slice(0, 200);
    if (!message) return Response.json({ error: 'Message cannot be empty.' }, { status: 400 });

    const db = await getDb();
    const col = db.collection<ChatMessage>('chat');
    const doc: ChatMessage = {
      author,
      message,
      timestamp: Date.now(),
    };
    await col.insertOne(doc);

    // Keep the collection pruned to the latest 200 messages
    void col.countDocuments().then(async (count) => {
      if (count > 200) {
        const oldest = await col
          .find({})
          .sort({ timestamp: 1 })
          .skip(count - 200)
          .toArray();
        if (oldest.length > 0) {
          await col.deleteMany({
            timestamp: { $lt: oldest[0].timestamp },
            _id: { $nin: oldest.map((m) => m._id) },
          });
        }
      }
    });

    return Response.json({ message: doc });
  } catch {
    return Response.json({ error: 'Failed to send.' }, { status: 500 });
  }
}