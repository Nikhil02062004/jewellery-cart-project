package com.gemavenue.app.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Reel(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("video_url") val videoUrl: String,
    val caption: String? = null,
    val hashtags: List<String>? = emptyList(),
    @SerialName("created_at") val createdAt: String,
    val profile: Profile? = null,
    val likesCount: Int = 0,
    val isLikedByUser: Boolean = false
)

@Serializable
data class Profile(
    val id: String,
    @SerialName("username") val username: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null
)
