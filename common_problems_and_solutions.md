# Common Problems, Root Causes, and Solutions

This document serves as a reference guide for developers working on the ISSB Command Preparation Portal. It catalogues critical problems encountered, their root causes, and verified technical solutions to avoid regressions in future development.

---

## 1. Blank Page on App Startup (Corrupt LocalStorage)

### Problem
The application loads a completely blank screen on local development (`localhost:5173` / `localhost:5174`) or on the production site. Clearing site data is required to make it work.

### Root Cause
1. **Uncaught JSON Parsing**: The application saves data arrays (e.g., completed modules, custom simulated tests) as JSON strings in `localStorage`. 
2. When the app initializes, it attempts to load these strings and parse them using `JSON.parse(localStorage.getItem(...))`.
3. If the storage contains corrupt data, legacy objects, or empty strings (or values left by other apps running on the same localhost port), `JSON.parse` throws a syntax error.
4. Because the parse operations were run synchronously in pinia stores or Vue's `onMounted` hooks without safety blocks, the error crashed the entire JavaScript thread before the root component could mount.

### Solution
Wrap all `localStorage` reads and `JSON.parse` operations in `try-catch` blocks. If parsing fails, catch the error, log a warning, reset the local state to a safe fallback (e.g., empty array or object), and optionally clear the corrupt key from `localStorage`.

*Example implementation in stores/components:*
```javascript
// Before
completedModules.value = JSON.parse(localStorage.getItem('issb_completed_modules') || '[]')

// After (Self-healing & Safe)
const storedModules = localStorage.getItem('issb_completed_modules')
if (storedModules) {
  try {
    completedModules.value = JSON.parse(storedModules)
  } catch (e) {
    console.error('Failed to parse completed modules:', e)
    completedModules.value = []
    localStorage.removeItem('issb_completed_modules') // Self-heal
  }
}
```

---

## 2. Automatic Logout on Reload (Supabase Auth/RLS Race Condition)

### Problem
After successfully logging in, refreshing the page logs the user out immediately and redirects them to the login page.

### Root Cause
1. **Auth Header Race**: When the app loads/reloads, Supabase fires the `INITIAL_SESSION` event through its `onAuthStateChange` listener.
2. During this initial callback, the REST client headers containing the user JWT token are not yet fully propagated or synced.
3. The app immediately fires a profile fetch request (`fetchProfile()`). Because the headers aren't ready, the Supabase database rejects the request under Row Level Security (RLS) policies.
4. The router navigation guard checks `isAuthenticated` (which is `true` from auth state) but finds `profile` is `null` (since the fetch failed).
5. The router guard assumes the profile was deleted/disabled, triggers `authStore.logout()`, and redirects the user to `/login`.

### Solution
1. Use `supabase.auth.getSession()` directly to restore the session deterministically on initialization instead of relying entirely on the first `onAuthStateChange` event.
2. Filter out `INITIAL_SESSION` events from the general listener.
3. In both the store's initialization and the router navigation guard, implement a retry loop with a small exponential delay (backoff) when fetching the profile, giving the client headers time to propagate.

*Example implementation in auth store:*
```javascript
// Use getSession() directly
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  user.value = session.user
  
  // Retry profile fetch to resolve REST client auth propagation delays
  let profileData = null
  for (let attempt = 0; attempt < 3; attempt++) {
    profileData = await fetchProfile(session.user.id)
    if (profileData) break
    await new Promise(r => setTimeout(r, 300 * (attempt + 1)))
  }
}
```

---

## 3. App Freeze / Sign Out Button Fails to Respond

### Problem
When clicking the "Sign Out" button, the application freezes, does not clear user data, or fails to redirect.

### Root Cause
`supabase.auth.signOut()` is an asynchronous network request. If the user's internet connection drops, or if the session token is already invalid/expired on the server, `signOut()` throws an uncaught error. The logic following the call was blocked, leaving the store state populated.

### Solution
Wrap `supabase.auth.signOut()` in a `try-catch` block. Regardless of whether the network call succeeds or fails, always proceed to clear the client-side store variables and redirect.

*Example implementation:*
```javascript
const logout = async () => {
  localStorage.removeItem('issb_session_token')
  try {
    const { error } = await supabase.auth.signOut()
    if (error) console.warn('Supabase signOut warning:', error)
  } catch (e) {
    console.error('SignOut request failed:', e)
  } finally {
    // Always clear local state
    user.value = null
    profile.value = null
  }
}
```

---

## 4. Frequent Expirations due to IP Tracking & Device Sessions

### Problem
Users on mobile devices (e.g. 3G/4G/5G data connections) get logged out repeatedly while browsing the app.

### Root Cause
Strict security rules in database triggers verified session IDs and IP addresses. Mobile networks frequently cycle/rotate the client's public IP address as they move cell towers. When the IP changed mid-session, the database RLS policies flagged the session as invalid, prompting an automatic logout.

### Solution
De-couple session validation from the client's public IP address and strict single-active-session IDs. Rely instead on Supabase’s built-in JWT expiration and secure refresh token mechanism.

---

## 5. Referral System Code Mismatch on SignUp

### Problem
Candidates signing up via a referral link did not have their referral count credited to the owner, or the registration failed.

### Root Cause
The metadata field passed during `supabase.auth.signUp()` was structured differently than what the database trigger expected to find under `raw_user_meta_data`. Specifically, mismatching keys like `referral_code` vs `referred_by_code` caused the database trigger to ignore the referrer.

### Solution
Standardized the metadata payload. Check both query parameters and local storage, ensuring the payload sent to the auth API aligns exactly with database trigger requirements:
```javascript
options: {
  data: {
    referral_code: metadata.referral_code || metadata.referred_by_code,
    // ...other metadata fields
  }
}
```

---

## Guidelines for Future Development

- **Safety First**: Never call `JSON.parse()` on storage variables directly. Write wrapper utility helpers or use try-catch logs.
- **Race Condition Prevention**: Assume network operations to fetch profiles or verify states are asynchronous. Use loading flags, and implement retry states for crucial database lookups.
- **RLS Robustness**: When adding new tables, double-check that read/write policies include appropriate auth role checks (`auth.uid() = user_id`) and handle anonymous queries safely.
