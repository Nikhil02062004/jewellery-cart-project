package com.gemavenue.app.domain.repository

import com.gemavenue.app.domain.model.Reel
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.storage.Storage
import javax.inject.Inject
import javax.inject.Singleton

interface ReelsRepository {
    suspend fun getReels(): Result<List<Reel>>
}

@Singleton
class ReelsRepositoryImpl @Inject constructor(
    private val postgrest: Postgrest,
    private val storage: Storage
) : ReelsRepository {

    override suspend fun getReels(): Result<List<Reel>> {
        return try {
            // Fetching reels ordered by creation date
            val reels = postgrest["reels"]
                .select(columns = Columns.raw("*, profile:profiles(*)"))
                .decodeList<Reel>()
            
            // Map the public URLs if the videoUrl is a storage path instead of an absolute URL
            val processedReels = reels.map { reel ->
                if (!reel.videoUrl.startsWith("http")) {
                    reel.copy(videoUrl = storage["reels"].publicUrl(reel.videoUrl))
                } else {
                    reel
                }
            }
            Result.success(processedReels)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
}
