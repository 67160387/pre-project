# Test report — 2026-11-01

Jest: 42/42 tests passed, 5 suites. Includes login, rejected credentials, session expiry, logout revocation, cross-origin rejection and rate limiting.

- lines: 77.53%
- statements: 77.22%
- functions: 73.33%
- branches: 65.53%
- branchesTrue: 100%

Coverage measures backend source files, excluding scripts and tests. Frontend behavior is checked separately in a browser. Core route unit tests use the inner app; auth tests exercise the authentication wrapper.

Live verification: 30/30 checks passed against MySQL and the authenticated gateway. Newman: 21 requests, 21 assertions, zero failures, including login. Both verification commands require AUTH_TEST_PASSWORD in the local process environment; never commit this value. Browser checks confirmed login, data display, removal of the Swagger link, and logout.

