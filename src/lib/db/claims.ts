import { getDb } from './mongodb';
import { ClaimDoc } from '../babel/types';
import { CLAIM_PRICE, CLAIM_CURRENCY } from '../payments/payments';

function validRoomId(roomId: string): boolean {
  return typeof roomId === 'string' && roomId.length > 0 && roomId.length <= 120;
}

export async function getClaim(roomId: string): Promise<ClaimDoc | null> {
  if (!validRoomId(roomId)) return null;
  const db = await getDb();
  return db.collection<ClaimDoc>('claims').findOne({ roomId, paid: true }, { projection: { _id: 0 } });
}

export interface GrantClaimInput {
  roomId: string;
  owner: string;
  dedication?: string;
  travelerId?: string;
}

/**
 * Grant an exclusive, paid claim on a room. Atomic + idempotent: if the room is already
 * claimed (paid), this fails rather than overwriting. Call ONLY after payment is confirmed
 * (dev-grant in stub mode, or a verified Stripe webhook in live mode).
 */
export async function grantClaim(
  input: GrantClaimInput,
  now: number
): Promise<{ ok: boolean; claim?: ClaimDoc; reason?: string }> {
  if (!validRoomId(input.roomId)) return { ok: false, reason: 'Invalid room.' };
  const owner = (input.owner || '').trim().slice(0, 60);
  if (!owner) return { ok: false, reason: 'Owner name required.' };

  const db = await getDb();
  const col = db.collection<ClaimDoc>('claims');

  // Ensure exclusivity at the storage layer.
  await col.createIndex({ roomId: 1 }, { unique: true }).catch(() => {});

  const existing = await col.findOne({ roomId: input.roomId });
  if (existing && existing.paid) {
    return { ok: false, reason: 'This chamber is already claimed.' };
  }

  const doc: ClaimDoc = {
    roomId: input.roomId,
    owner,
    dedication: (input.dedication || '').trim().slice(0, 140) || undefined,
    travelerId: input.travelerId,
    paid: true,
    amount: CLAIM_PRICE,
    currency: CLAIM_CURRENCY,
    claimedAt: now,
  };

  try {
    await col.updateOne(
      { roomId: input.roomId },
      { $set: doc },
      { upsert: true }
    );
  } catch {
    return { ok: false, reason: 'This chamber was just claimed by someone else.' };
  }

  return { ok: true, claim: doc };
}

export interface OwnerRank {
  owner: string;
  count: number;
  latest: number;
}

export async function getClaimsByTraveler(travelerId: string): Promise<ClaimDoc[]> {
  const db = await getDb();
  return db
    .collection<ClaimDoc>('claims')
    .find({ travelerId, paid: true }, { projection: { _id: 0 } })
    .sort({ claimedAt: -1 })
    .toArray();
}

// Leaderboard: owners ranked by how many chambers they hold.
export async function getOwnershipLeaderboard(limit = 25): Promise<OwnerRank[]> {
  const db = await getDb();
  const rows = await db
    .collection<ClaimDoc>('claims')
    .aggregate<OwnerRank>([
      { $match: { paid: true } },
      { $group: { _id: '$owner', count: { $sum: 1 }, latest: { $max: '$claimedAt' } } },
      { $project: { _id: 0, owner: '$_id', count: 1, latest: 1 } },
      { $sort: { count: -1, latest: 1 } },
      { $limit: Math.min(100, limit) },
    ])
    .toArray();
  return rows;
}
