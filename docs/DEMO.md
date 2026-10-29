# Demo walkthrough

1. Register two accounts in separate browser sessions.
2. Create a private trip in the first session and share the displayed trip code.
3. Join that code from the second account. The trip page shows the leader and rider.
4. Start the trip as leader. On a browser that supports GPS, explicitly enable location sharing; grant permission when prompted. Use `localhost` or HTTPS because browsers restrict geolocation on insecure origins.
5. Open the live page in both sessions to see authorized locations and freshness. A device without GPS or a browser that suspends background tabs may show a stale location.
6. Send a chat message, create a checkpoint as leader, report an arrival as a rider, or explicitly confirm an emergency alert.
7. End the trip as leader and review its history.

The seed command creates demo users and a scheduled demo trip, but does not fabricate live GPS. Its shared demo password is printed by the script; use only in a disposable local database and never seed a public environment.
