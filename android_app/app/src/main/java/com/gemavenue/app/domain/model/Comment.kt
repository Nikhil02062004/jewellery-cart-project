package com.gemavenue.app.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Comment(
    val id: String,
    @SerialName("reel_id") val reelId: String,
    @SerialName("user_id") val userId: String,
    val content: String,
    @SerialName("parent_id") val parentId: String? = null,
    @SerialName("created_at") val createdAt: String,
    val profile: Profile? = null,
    val likesCount: Int = 0
)
