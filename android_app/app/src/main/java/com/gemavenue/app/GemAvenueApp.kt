package com.gemavenue.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class GemAvenueApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize any tracking SDKs or background services here if needed
    }
}
