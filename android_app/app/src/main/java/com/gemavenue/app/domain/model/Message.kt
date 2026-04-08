package com.gemavenue.app.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Message(
    val id: String = "",
    val content: String,
    @SerialName("user_id") val userId: String,
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("is_admin_reply") val isAdminReply: Boolean = false,
    val profile: Profile? = null
)
