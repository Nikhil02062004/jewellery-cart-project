package com.gemavenue.app.domain.repository

import com.gemavenue.app.domain.model.Message
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.PostgresAction
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

interface ChatRepository {
    suspend fun getInitialMessages(): Result<List<Message>>
    suspend fun sendMessage(content: String): Result<Unit>
    fun observeNewMessages(): Flow<Message>
    val currentUserId: String?
}

@Singleton
class ChatRepositoryImpl @Inject constructor(
    private val postgrest: Postgrest,
    private val realtime: Realtime,
    private val auth: Auth
) : ChatRepository {

    override val currentUserId: String?
        get() = auth.currentUserOrNull()?.id

    override suspend fun getInitialMessages(): Result<List<Message>> {
        return try {
            val messages = postgrest["chat_messages"]
                .select(columns = Columns.raw("*, profile:profiles(*)")) {
                    order("created_at", order = io.github.jan.supabase.postgrest.query.Order.ASCENDING)
                }
                .decodeList<Message>()
            Result.success(messages)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    override suspend fun sendMessage(content: String): Result<Unit> {
        val userId = auth.currentUserOrNull()?.id ?: return Result.failure(Exception("User not logged in"))
        val message = Message(content = content, userId = userId)
        return try {
            postgrest["chat_messages"].insert(message)
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    override fun observeNewMessages(): Flow<Message> {
        val channel = realtime.channel("public:chat_messages")
        
        // This listens to new inserts on the chat_messages table via Supabase Realtime
        val flow = channel.postgresChangeFlow<PostgresAction.Insert>(schema = "public")
        
        // We ensure we join the channel
        try {
            channel.subscribe()
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return flow.map { action ->
            action.decodeRecord<Message>()
        }
    }
}
