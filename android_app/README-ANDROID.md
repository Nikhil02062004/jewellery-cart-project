# Android Project Setup Guide

To get the absolute best results, we are building a clean architecture Android App using **Jetpack Compose** (for perfect animations and modern UI handling), **Hilt** (for Dependency Injection), and **Supabase-kt** (for a seamless connection to your existing backend).

## Step 1: Create the Project
1. Open **Android Studio** and click **New Project**.
2. Select **Empty Activity** (This uses Jetpack Compose).
3. Name it **Gem Avenue**, Package Name: `com.gemavenue.app`.
4. Minimum SDK: **API 26 (Android 8.0)**.
5. Click **Finish**.

## Step 2: Add Dependencies
Replace the `dependencies { ... }` block in your `app/build.gradle.kts` with what I've provided in `android_app/app/build.gradle.kts`

---

*I have generated the core application source code inside the `android_app` folder in this directory. You can copy the `src` folder directly into your Android Studio project once you've created it!*
