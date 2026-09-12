# Security Design

## 1. Authentication & Authorization
- Use secure, HTTP-only cookies for session management to prevent XSS credential theft.
- Passwords must be hashed using bcrypt or Argon2 before storage.
- Backend routes must strictly enforce authorization; never rely on frontend route guards alone.
- Admin panels require role-based access control (RBAC).

## 2. Secure Code Execution
- The Express server must NEVER run user code directly using `eval()` or `child_process.exec()` within its own environment.
- Use an isolated sandbox environment (e.g., Docker containers, `isolate`) with strict constraints:
  - Timeouts: Terminate processes exceeding time limits.
  - Memory Limits: Prevent OOM crashes.
  - Network: Disable network access from within the sandbox.
  - File System: Read-only access to necessary files, restricted write permissions.
- Hidden test cases must never be exposed to the client. The frontend should only receive a success/fail state or specific redacted error messages.

## 3. Real-Time Battle Integrity
- The server is the absolute source of truth.
- Client-submitted scores, timer values, and rating updates must be ignored.
- The server calculates time remaining and final scores based on secure backend timestamps.
- Validate all incoming Socket.IO events for authentication and correct state transitions.

## 4. Fair Play & Anti-Cheat
- Telemetry gathering to detect suspicious behavior (e.g., leaving the browser tab, external paste attempts).
- External pasting should be blocked and logged, but internal copying is allowed.
- Since browser security cannot definitively prove cheat events, telemetry is used as a signal, not an automatic ban trigger.
- Allow administrators to review suspicious flags, enforce bans, and roll back fraudulent rating changes.

## 5. Web Application Security
- Input Validation: Strict validation on all incoming requests to prevent NoSQL injection and unexpected input.
- Cross-Site Scripting (XSS): Ensure React escapes user inputs properly, especially in profile descriptions and problem statements.
- Rate Limiting: Apply rate limits on authentication routes, API endpoints, and WebSocket connections to prevent abuse and DoS attacks.
