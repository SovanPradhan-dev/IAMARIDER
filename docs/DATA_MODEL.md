# Data model and privacy

All models use Mongoose timestamps where appropriate. GeoJSON points use `[longitude, latitude]`, never `[latitude, longitude]`.

| Model | Purpose and indexes |
|---|---|
| `User` | Normalized unique email, password hash, display name, avatar URL, private emergency contact, and in-app notification preferences |
| `RefreshSession` | HMAC-hashed opaque refresh token, user reference, expiry; unique token hash and MongoDB TTL index |
| `Trip` | Unique human-readable code, leader/creator, endpoints, departure, status, capacity and atomically reserved member count |
| `TripMember` | Role, joined/left/removed status, timestamps; unique `{ tripId, userId }` |
| `LiveLocation` | Latest location per rider/trip; unique `{ tripId, userId }`, `2dsphere` location index |
| `LocationHistory` | Separately sampled location points; chronological trip/member indexes and 30-day `recordedAt` TTL |
| `Message` | Trip-scoped text and sender; chronological trip index |
| `Checkpoint` | Trip-scoped GeoJSON waypoint, sequence, and optional planned arrival |
| `CheckpointArrival` | One arrival per checkpoint/member; unique `{ checkpointId, userId }` |
| `EmergencyEvent` | Trip-scoped type, reporter, optional last-known point, status, and resolution |
| `Notification` | User- and trip-scoped in-app event with unread state and chronological indexes |

## Access rules

Trip members can see trip locations, participants, chat, checkpoints, arrivals, and emergency events. Private trip details are hidden from non-members. Emergency contacts remain visible only through the authenticated owner's profile response; public member projections select only name and avatar. A socket identity comes from the signed access token, never a client-supplied user ID.

GPS sharing is opt-in. The server stores one latest location per rider and samples a subset of updates into `LocationHistory`. History expires after 30 days through MongoDB's asynchronous TTL monitor. Latest locations are removed when the rider stops sharing or leaves/is removed from the trip. Operators should secure MongoDB, restrict database access, configure backups and deletion policies, and avoid logging coordinates.

Notifications are stored per recipient and emitted only to that user's authenticated Socket.IO room. Listing, reading, and bulk-read operations are always scoped to the authenticated user.

## Transactions and capacity

Trip creation and leadership transfer use MongoDB transactions when the deployment supports them. MongoDB transactions require a replica set or sharded cluster. For development on standalone MongoDB, these operations have a documented non-transactional fallback; configure a replica set for stronger multi-document atomicity.

Member capacity is reserved with an atomic update to `Trip.memberCount` before writing membership, preventing concurrent joins from claiming the same final seat. Existing trip documents without this counter are initialized from joined memberships on the next join.
