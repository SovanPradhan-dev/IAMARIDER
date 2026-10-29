/**
 * Run a multi-document operation inside a MongoDB transaction when the
 * deployment supports transactions (replica set / sharded cluster).
 *
 * Local development with a standalone mongod (e.g. mongodb-memory-server) does
 * not support transactions. In that case we fall back to running the operation
 * without a session. This is safe for RideTogether's multi-document writes
 * because each individual operation is atomic; the fallback trades
 * all-or-nothing atomicity for local-development compatibility.
 *
 * MongoDB transactions require a replica set. In production, deploy MongoDB as
 * a replica set (Atlas, or self-managed replica set) and set MONGODB_URI
 * accordingly.
 *
 * @param {import('mongoose').Connection} connection - Mongoose connection
 * @param {Function} run - Async function receiving a session (may be null when
 *   transactions are unsupported or unavailable)
 * @returns {Promise<*>}
 */
const TRANSACTION_UNAVAILABLE_MESSAGE =
  'Transaction numbers are only allowed on a replica set member or mongos';

export const withTransaction = async (connection, run) => {
  if (!connection || !connection.client || !connection.client.startSession) {
    return run(null);
  }

  let session;
  try {
    session = await connection.client.startSession();
  } catch {
    // Cannot start a session; run without transactions
    return run(null);
  }

  try {
    return await session.withTransaction(async () => {
      return await run(session);
    });
  } catch (err) {
    if (
      err &&
      err.message &&
      err.message.includes(TRANSACTION_UNAVAILABLE_MESSAGE)
    ) {
      // Standalone mongod does not support transactions; retry without a session
      return run(null);
    }
    throw err;
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch {
        // ignore
      }
    }
  }
};
