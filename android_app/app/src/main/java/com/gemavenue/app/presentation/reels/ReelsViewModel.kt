package com.gemavenue.app.presentation.reels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gemavenue.app.domain.model.Reel
import com.gemavenue.app.domain.repository.ReelsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ReelsUiState(
    val isLoading: Boolean = true,
    val reels: List<Reel> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class ReelsViewModel @Inject constructor(
    private val reelsRepository: ReelsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReelsUiState())
    val uiState: StateFlow<ReelsUiState> = _uiState.asStateFlow()

    init {
        fetchReels()
    }

    private fun fetchReels() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            reelsRepository.getReels().fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isLoading = false, reels = it)
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
                }
            )
        }
    }

    fun toggleLike(reelId: String) {
        // Implementation for optimistic UI update on Likes 
        val updatedReels = _uiState.value.reels.map {
            if (it.id == reelId) {
                it.copy(
                    isLikedByUser = !it.isLikedByUser,
                    likesCount = if (it.isLikedByUser) kotlin.math.max(0, it.likesCount - 1) else it.likesCount + 1
                )
            } else it
        }
        _uiState.value = _uiState.value.copy(reels = updatedReels)
        // Note: Real API call to Supabase to insert/delete like goes here
    }
}
