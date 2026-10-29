# API reference

Base URL: `/api/v1`. Protected HTTP requests use `Authorization: Bearer <accessToken>`. Login/refresh additionally use the HttpOnly `refreshToken` cookie. JSON errors use `{ "error": "..." }`.

Trip IDs in routes are MongoDB `_id` values. `tripCode` is the invitation code used only by `POST /trips/join`.

## Authentication and profile

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account |
| POST | `/auth/login` | Public | Authenticate; returns access token and sets refresh cookie |
| POST | `/auth/refresh` | Refresh cookie | Rotate refresh session and issue a new access token |
| POST | `/auth/logout` | Access token | Revoke refresh session and clear cookie |
| GET | `/auth/me` | Authenticated | Current account |
| PATCH | `/auth/change-password` | Authenticated | Change password, revoke other refresh sessions, and rotate the current cookie |
| GET | `/users/me` | Authenticated | Current profile |
| PATCH | `/users/me` | Authenticated | Update name, avatar URL, and private emergency contact |
| GET | `/users/me/trips?page=1&limit=20` | Authenticated | Paginated trips for the current member |
| GET | `/users/me/notifications?page=1&limit=20` | Authenticated | List the caller's notifications and unread count |
| PATCH | `/users/me/notifications/:notificationId/read` | Notification owner | Mark one notification as read |
| PATCH | `/users/me/notifications/read-all` | Authenticated | Mark all caller notifications as read |
| GET | `/health` or `/api/v1/health` | Public | API health status |

## Trips and members

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/trips` | Authenticated | Create a trip; creator becomes leader |
| GET | `/trips?page=1&limit=20` | Authenticated | List the caller's trips |
| GET | `/trips/:tripId` | Member or public trip | Trip details and caller membership |
| PATCH | `/trips/:tripId` | Leader | Update permitted trip settings |
| POST | `/trips/join` | Authenticated | Join by `{ "tripCode": "RT-..." }` |
| POST | `/trips/:tripId/leave` | Joined rider | Leave; leaders must transfer leadership or cancel |
| GET | `/trips/:tripId/members` | Joined member | List joined participants |
| DELETE | `/trips/:tripId/members/:userId` | Leader | Remove a participant |
| POST | `/trips/:tripId/start` | Leader | Start a scheduled trip |
| POST | `/trips/:tripId/end` | Leader | Complete an active trip |
| POST | `/trips/:tripId/cancel` | Leader | Cancel a scheduled or active trip |
| POST | `/trips/:tripId/transfer-leadership` | Leader | Transfer leadership to a joined member |

## Location, chat, checkpoints, and emergencies

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/trips/:tripId/locations` | Joined member | Current location snapshot for joined members |
| POST | `/trips/:tripId/locations` | Joined member, active trip | Submit a validated location update |
| DELETE | `/trips/:tripId/locations` | Joined member | Stop sharing and remove latest location |
| GET | `/trips/:tripId/history?page=1&limit=100` | Joined member | Paginated, sampled route history |
| GET | `/trips/:tripId/history/summary` | Trip member | Trip, participants, messages count, checkpoints, arrivals, emergencies |
| GET/POST | `/trips/:tripId/messages` | Joined member | Paginated message history / send a message |
| GET/POST | `/trips/:tripId/checkpoints` | Joined member / leader | List checkpoints / create one |
| PATCH/DELETE | `/trips/:tripId/checkpoints/:checkpointId` | Leader | Edit or delete a checkpoint |
| POST | `/trips/:tripId/checkpoints/:checkpointId/arrivals` | Joined member | Report arrival (one per checkpoint/member) |
| GET | `/trips/:tripId/checkpoints/:checkpointId/arrivals` | Joined member | List arrivals |
| POST | `/trips/:tripId/emergencies` | Joined member | Report SOS, breakdown, medical, or other event |
| GET | `/trips/:tripId/emergencies` | Joined member | List trip emergency events |
| PATCH | `/trips/:tripId/emergencies/:eventId` | Leader | Resolve or cancel an event |

Pagination is one-based. Message pages default to 50 entries; route history defaults to 100. Request and event payloads are validated on the server.

## Socket.IO

Connect with `auth: { token: "<accessToken>" }`. Join a room only with a valid joined membership; location, message, emergency, and arrival events re-check membership server-side.

**Client events:** `trip:join`, `trip:leave`, `location:update`, `trip:message:send`, `checkpoint:arrival`, `emergency:create`, `presence:heartbeat`.

**Server events:** `trip:joined` (room acknowledgement), `trip:member:joined`, `trip:member:left`, `trip:member:removed`, `trip:started`, `location:changed`, `rider:status`, `trip:message:new`, `checkpoint:arrival:new`, `emergency:new`, `trip:ended`, `notification:new`, `trip:error`.

Events that persist data acknowledge with `{ ok: true, ... }`; rejected events acknowledge with `{ error: "..." }`. Rejoining returns a current location and membership snapshot.
