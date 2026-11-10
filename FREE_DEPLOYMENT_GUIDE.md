# NEO-PUPPET: HYPER TAG — Free 100% Zero-Cost Deployment Guide

Deploy **NEO-PUPPET: HYPER TAG** online with zero hosting fees, no credit card required, and full global online multiplayer capabilities.

---

## 1. Free Firebase Realtime Database Setup (Spark Plan)

Firebase provides a free **Spark Plan** that requires no credit card and delivers up to 100 simultaneous WebRTC signaling connections and 1 GB of stored presence/signaling data.

### Step 1: Create Your Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/) and sign in with your Google account.
2. Click **Add Project** and name it `neo-puppet-hyper-tag` (or any custom name).
3. Disable Google Analytics (optional, keeps setup instant and clean) and click **Create Project**.

### Step 2: Enable Realtime Database
1. In the left navigation menu under **Build**, click **Realtime Database**.
2. Click **Create Database**.
3. Choose a region closest to your players (e.g. `United States (us-central1)` or `Belgium (europe-west1)`).
4. Select **Start in test mode** and click **Enable**.

### Step 3: Apply Production Security Rules
Go to the **Rules** tab of your Realtime Database, replace the contents with the following rules, and click **Publish**:

```json
{
  "rules": {
    "presence": {
      "$playerId": {
        ".read": true,
        ".write": "$playerId != null",
        ".validate": "newData.hasChildren(['name', 'status', 'lastSeen'])"
      }
    },
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true
      }
    },
    "invites": {
      "$targetPlayerId": {
        "$inviteId": {
          ".read": true,
          ".write": true,
          ".validate": "newData.hasChildren(['fromName', 'roomCode', 'timestamp'])"
        }
      }
    }
  }
}
```

> [!NOTE]
> **Security Notice:** These rules are streamlined for frictionless friends-only casual multiplayer without requiring user logins. For a public competitive esports launch, enable **Firebase Authentication (Anonymous Auth)** and restrict write permissions using `auth.uid == $playerId`.

### Step 4: Retrieve Project Web Credentials
1. Click the **Project Overview (Gear Icon) ⚙️ $\rightarrow$ Project settings**.
2. Scroll down to **Your apps**, click the **Web icon `</>`**, register the app as `NeoPuppet Web`, and uncheck Firebase Hosting.
3. Copy the `firebaseConfig` object, for example:
   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "neo-puppet-tag.firebaseapp.com",
     "databaseURL": "https://neo-puppet-tag-default-rtdb.firebaseio.com",
     "projectId": "neo-puppet-tag",
     "storageBucket": "neo-puppet-tag.appspot.com",
     "messagingSenderId": "123456789",
     "appId": "1:123456789:web:abcdef"
   }
   ```

### Step 5: Connect to the Game
You can connect your credentials in **either of two ways**:
- **Method A (No Code Modification):** Open the game in your browser, click **CLOUD MULTIPLAYER SETUP** on the Main Menu, paste the JSON into the box, and click **CONNECT FIREBASE**. It will save directly to your browser's `localStorage`!
- **Method B (Baked into Code):** Paste your credentials into `src/config/firebaseConfig.ts` and rebuild.

---

## 2. Deploying to Vercel (100% Free Hosting)

Vercel provides free global edge CDN hosting with automatic SSL certificates and SPA routing.

### Option A: Deploy via GitHub (Recommended)
1. Push your codebase to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: NEO-PUPPET HYPER TAG complete release"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/neo-puppet-hyper-tag.git
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com/) with GitHub.
3. Click **Add New... $\rightarrow$ Project** and select your `neo-puppet-hyper-tag` repository.
4. Vercel automatically detects **Vite**:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**. Within 40 seconds, your game is live on a permanent `https://neo-puppet-hyper-tag.vercel.app` URL!

### Option B: Deploy via Vercel CLI
From your workspace directory:
```bash
npx vercel
```
Follow the interactive prompts:
- *Set up and deploy?* **Y**
- *Which scope?* Select your account
- *Link to existing project?* **N**
- *Project name?* `neo-puppet-hyper-tag`
- *Directory located?* `./`
- *Want to modify settings?* **N**

When the deployment completes, promote it to production:
```bash
npx vercel --prod
```

---

## 3. Shareable Room Deep Links
Once deployed, players can share direct join links anywhere:
```
https://your-game.vercel.app/?room=TAG-8492
```
When friends click the link:
1. First-time visitors are welcomed with the **Pilot Identification** modal to pick a callsign and neon visor skin.
2. The game automatically joins room `TAG-8492`.
3. Players can ready up and battle with 60Hz deterministic physics!

---

## 4. Automated Database Upkeep & Firebase Maintenance

To ensure your Firebase Spark Plan remains completely free without exceeding the 1 GB storage limit or 10 GB monthly bandwidth quota, NEO-PUPPET includes automated and manual database upkeep.

### Automated Client-Side Cleanup Routine
The game features a built-in maintenance worker (`src/network/FirebaseCleanup.ts`) that executes automatically:
- **Frequency:** Runs on app launch, strictly throttled to at most once every **6 hours** (tracked in `localStorage.getItem('neo-puppet-last-firebase-cleanup')`).
- **Bounded Queries:** It never reads or scans entire collections. All queries utilize bounded constraints (`orderByChild`, `endAt`, `limitToFirst(50)`):
  1. **Presence Pruning:** Removes entries under `/presence` where `lastSeen` is older than **24 hours**.
  2. **Room Pruning:** Removes rooms under `/rooms` where `lastActivity` is older than **24 hours**.
  3. **Invite Pruning:** Deletes expired direct party invites under `/invites/{playerId}` older than **60 seconds**.
- **Atomic Batch Deletion:** Deletions are sent as a single multi-path `update` payload, keeping network requests minimal.

### Manual Cleanup from the Firebase Console
If you ever wish to inspect stored data or manually purge records:
1. Navigate to the [Firebase Console](https://console.firebase.google.com/) and select your project.
2. Click **Build $\rightarrow$ Realtime Database** in the left sidebar, and select the **Data** tab.
3. You will see three top-level nodes:
   - `/presence`: Displays online combatants. To purge all offline users, hover over the `presence` node, click the red **`x` (Delete)** icon, and confirm. Active players will automatically re-publish their presence on their next heartbeat.
   - `/rooms`: Contains WebRTC signaling exchanges and room passcode hashes. To purge all ended game rooms, hover over `rooms`, click the **`x` (Delete)** icon, and confirm.
   - `/invites`: Temporary party invite requests. To clear all historical invites, hover over `invites`, click **`x` (Delete)**, and confirm.
4. **Index Verification (Optional for Performance):**
   Ensure your database rules in the **Rules** tab specify indexes on timestamps to keep bounded queries lightning-fast:
   ```json
   {
     "rules": {
       "presence": {
         ".indexOn": ["lastSeen"],
         "$playerId": {
           ".read": true,
           ".write": "$playerId != null"
         }
       },
       "rooms": {
         ".indexOn": ["lastActivity"],
         "$roomCode": {
           ".read": true,
           ".write": true
         }
       },
       "invites": {
         "$targetPlayerId": {
           ".indexOn": ["timestamp"],
           "$inviteId": {
             ".read": true,
             ".write": true
           }
         }
       }
     }
   }
   ```

