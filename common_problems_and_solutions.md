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

## 6. RLS Error: "new row violates row-level security policy for table profiles" on Resubmit

### Problem
When a user whose payment was **rejected** tries to re-upload a new screenshot from the Status page, Supabase returns:
```
new row violates row-level security policy for table "profiles"
```
The upload to storage succeeds, but the profile update to reset `status → 'pending'` fails.

### Root Cause
The `UPDATE` RLS policy on `public.profiles` had a `WITH CHECK` clause that strictly enforced:
```sql
status = (select status from public.profiles where id = auth.uid())
```
This means students could **never change their own status column** — even to reset it back to `'pending'` for resubmission. Since a rejected user's current status is `'rejected'`, the check `status = 'rejected'` failed when the code tried to set it to `'pending'`.

### Solution
Update the `WITH CHECK` policy to allow students to set their own status to `'pending'` (for resubmission) while still blocking them from escalating to `'approved'` or changing their `role`:
```sql
-- In migration: 20260616000000_fix_resubmit_rls.sql
drop policy if exists "Users can update their own profile fields" on public.profiles;

create policy "Users can update their own profile fields"
on public.profiles
for update
using (auth.uid() = id and deleted_at is null)
with check (
  auth.uid() = id
  and (
    public.is_admin(auth.uid())
    or (
      role = 'student'
      and status in ('pending', (select status from public.profiles where id = auth.uid()))
    )
  )
);
```

### Rule for Future
**Every RLS `WITH CHECK` policy must be tested for all state transitions**, not just the happy path. Ask: "Can a user go from state X to state Y?" and ensure the policy allows legitimate transitions.

---

## 7. New Users Not Getting 30-Minute Free Trial (trigger overwrite)

### Problem
Newly registered users have `trial_ends_at = NULL` and never get the 30-minute free trial session. The dashboard shows "Practice Simulators (Free)" instead of the premium dashboard.

### Root Cause
The Supabase `handle_new_user()` trigger function was rewritten **multiple times** across different migrations using `CREATE OR REPLACE FUNCTION`. Each rewrite only included the columns relevant to *that feature*, accidentally dropping columns added by *earlier* migrations:

| Migration | Added | Missing |
|-----------|-------|---------|
| `20260612232000_add_trial_ends_at.sql` | `trial_ends_at` | — |
| `20260614125200_add_referrals_and_soft_delete.sql` | `referred_by` | **`trial_ends_at` dropped!** |
| `20260612231000_fix_handle_new_user_merged.sql` | `ip_address` | **`trial_ends_at` still missing** |

The final live version of the trigger function simply did not include `trial_ends_at` in the `INSERT` statement.

### Solution
Created migration `20260616010000_fix_trial_ends_at_in_trigger.sql` which restores the **complete** trigger with all columns:
```sql
insert into public.profiles (
  ...
  trial_ends_at
)
values (
  ...
  case when is_first_user then null else now() + interval '30 minutes' end
);
```

### Rule for Future
**CRITICAL: When writing `CREATE OR REPLACE FUNCTION handle_new_user()` in any migration, always copy the FULL column list from the previous migration.** Never write just the "new" columns — you will silently drop existing ones. Before pushing, verify the final function in Supabase Dashboard → Database → Functions matches the expected schema.

## 8. AI Rate Limit Exhaustion (HTTP 429) during Large Test Analysis

### Problem
When students complete a large test (e.g., Word Association Test with 50 or 200 items), requesting AI psychological analysis triggers an immediate failure. The app reports provider errors like `Provider returned 429` (Rate Limit Exceeded) or `Failed to fetch`.

### Root Cause
1. **Payload Size & Rate Limits**: Sending 50–200 responses to the AI in a single large prompt causes token limit or request limit exhaustion on API providers (Groq, Gemini, OpenRouter).
2. **Synchronous/Concurrent Requests**: Trying to send all words at once or splitting them into parallel request chunks without delays triggers the provider's rate limiting algorithms (Requests Per Minute / RPM or Tokens Per Minute / TPM limits).

### Solution
1. **Chunked Evaluation**: Split the test responses into smaller batches of 25 items each.
2. **Linear Delay Interleaving**: Add a rate-limiting delay (e.g., 2-second sleep: `await delay(2000)`) between sequential chunk requests, rather than running them concurrently.
3. **Robust Retry Loop**: Wrap each chunk analysis in a retry loop (up to 2 attempts) with a backoff delay (3s) to automatically recover from momentary 429 throttles.
4. **Fallback & Gap-Filling**: If a chunk completely fails after retries, insert placeholder evaluations for that batch instead of aborting the entire analysis. After analysis is complete, verify that every item from the input has an entry in the output array (gap-filling skipped items).

*Example implementation in useAiAnalysis.js:*
```javascript
// Rate-limiting delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Sequential execution with delays & retry
for (let cIdx = 0; cIdx < totalChunks; cIdx++) {
  const chunk = chunks[cIdx]
  
  let chunkSuccess = false
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { text } = await analyzeWithAI(batchPrompt, `Chunk ${cIdx + 1}:\n${chunkText}`)
      // ... parse and append results
      chunkSuccess = true
      break
    } catch (err) {
      if (attempt === 0) await delay(3000) // backoff retry
    }
  }
  
  // Wait 2s before the next chunk request to respect RPM limits
  if (cIdx < totalChunks - 1) {
    await delay(2000)
  }
}
```

---

## Guidelines for Future Development

- **Safety First**: Never call `JSON.parse()` on storage variables directly. Write wrapper utility helpers or use try-catch logs.
- **Race Condition Prevention**: Assume network operations to fetch profiles or verify states are asynchronous. Use loading flags, and implement retry states for crucial database lookups.
- **RLS Robustness**: When adding new tables, double-check that read/write policies include appropriate auth role checks (`auth.uid() = user_id`) and handle anonymous queries safely.
- **Trigger Functions Are Stateful**: `CREATE OR REPLACE FUNCTION` replaces the entire function body. When updating a trigger, always carry forward ALL column insertions from the previous version. Missing one column silently breaks that feature for all new registrations.
- **Test All RLS State Transitions**: After adding/modifying RLS policies, test not just the normal happy path but also edge-case transitions (e.g., status changes from rejected → pending, student updates vs. admin updates).
