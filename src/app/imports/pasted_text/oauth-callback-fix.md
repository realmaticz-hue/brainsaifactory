FIGMA MAKE — ONE-SHOT FIX
UNIVERSAL OAUTH CALLBACK RECOVERY

MISSION
Fix blank screen issues on OAuth callback pages caused by missing state validation, unhandled errors, or delayed token exchanges.

This ensures users reconnecting Facebook or Instagram accounts never see a blank screen.

IMPLEMENTATION STEPS

1. CALLBACK PAGE UI

Always render a loading page immediately on callback:

Connecting account…
Retrieving pages…
Linking Instagram…
Finalizing connection…

This page must **never render empty**, even if parameters are missing.

2. STATE VERIFICATION

Validate the state parameter:

* Check state exists
* Confirm it matches the stored value (format: provider_userID_timestamp_random)

If state is invalid:

Display error message:

OAuth validation failed
Retry connection button

Do not proceed to token exchange without valid state.

3. OAUTH CODE HANDLING

If `code` parameter exists:

* Immediately send to backend `/api/oauth/{provider}` endpoint
* Await response while keeping loading page visible

If `code` is missing:

Display error message:

No authorization code received
Retry connection button

4. TOKEN EXCHANGE ERROR HANDLING

If backend token exchange fails:

* Catch all errors (network, API, permission)
* Display friendly message:

Connection failed
Reconnect account button

Do not allow blank page.

5. REDIRECT AFTER SUCCESS

After successful token exchange and account discovery:

* Automatically redirect user to `/dashboard/social`
* Display connected accounts immediately

6. AUTO-RETRY ENGINE

Allow user to click **Reconnect** button if connection fails.

* Re-trigger OAuth login
* Preserve previously selected accounts
* Keep UI consistent with loading screen

7. LOGGING

Log all callback attempts and errors:

* missing code
* invalid state
* token exchange failure

This helps debug future OAuth issues.

8. MODULAR DESIGN

Apply same callback template for all providers:

* Facebook
* Instagram
* X (Twitter)
* TikTok
* YouTube
* LinkedIn
* Pinterest

The universal template ensures no blank screens appear regardless of provider.

FINAL RESULT

* No blank screens on reconnect
* Users always see progress UI
* Error messages are clear and actionable
* Automatic redirect to dashboard after success

END FIX
