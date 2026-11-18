# Connect the shared date journal to Supabase

The website remains a static GitHub Pages site. Supabase stores the shared date ideas and memory photos in the cloud.

## 1. Create a Supabase project

1. Go to https://supabase.com/ and create a project.
2. Open **Project Settings -> API** (or **Connect** in the project dashboard).
3. Copy the **Project URL** and the **anon / publishable public key**. Never use or publish the `service_role` / secret key.

## 2. Create the database and photo bucket

1. In Supabase, open **SQL Editor**.
2. Choose **New query**.
3. Open `supabase-setup.sql` from this project, copy all its contents into the SQL editor and click **Run**.
4. The script creates the `date_ideas` table, public access policies, and the `date-photos` storage bucket. It also enables realtime updates.

## 3. Add the browser credentials

1. Open `js/supabase-config.js`.
2. Replace `YOUR_SUPABASE_PROJECT_URL` with your Supabase Project URL.
3. Replace `YOUR_SUPABASE_ANON_PUBLIC_KEY` with the anon / publishable public key.
4. Save and commit the file to GitHub.

The anon/publishable key is designed to be used in a browser. Database and storage access is controlled by the Row Level Security policies in `supabase-setup.sql`. **Never put a `service_role` or secret key in this file.**

## 4. Publish and test

1. Push the updated project to the GitHub repository used by GitHub Pages.
2. Wait for GitHub Pages to publish the update.
3. Open the live site and check that the header says **Shared journal connected**.
4. Add a test idea, then open the site in another browser or device. The same idea should appear there. Updates should also appear on already-open pages.

## Access model — read this

This project was configured for an open shared journal. Anyone who can access the public website can view, add, edit, complete, move back, and delete date ideas. Anyone can also upload and delete date photos. Do not put private or sensitive information in this journal. If you only want visitors to view/add while restricting edits and deletes to you, the database policies and interface need to be changed.

## Existing browser-saved ideas

On the first successful connection in each browser, the website attempts to import ideas previously stored in that browser's localStorage into Supabase. This includes existing details and photo data. The browser's local copy is retained as a backup, but Supabase becomes the shared source of truth.

## Notes

- The first connection requires internet access because the Supabase JavaScript library is loaded from jsDelivr.
- Supabase's free plan has usage and storage limits; check its current pricing for your expected traffic and photo volume.
- If the connection fails, check the project URL/key, run the SQL setup, and confirm the Supabase project is active.
