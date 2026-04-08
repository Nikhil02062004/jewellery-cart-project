package com.gemavenue.app.presentation.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gemavenue.app.domain.model.Message
import com.gemavenue.app.domain.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ChatUiState(
    val isLoading: Boolean = true,
    val initialMessagesLoaded: Boolean = false,
    val messages: List<Message> = emptyList(),
    val error: String? = null,
    val currentUserId: String? = null
)

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    init {
        _uiState.value = _uiState.value.copy(currentUserId = chatRepository.currentUserId)
        loadInitialMessages()
        observeRealtimeMessages()
    }

    private fun loadInitialMessages() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            chatRepository.getInitialMessages().fold(
                onSuccess = { msgs ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        initialMessagesLoaded = true,
                        messages = msgs
                    )
                },
                onFailure = { err ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = err.message
                    )
                }
            )
        }
    }

    private fun observeRealtimeMessages() {
        viewModelScope.launch {
            chatRepository.observeNewMessages().collect { newMessage ->
                val currentMessages = _uiState.value.messages.toMutableList()
                // Avoid duplication if the message is already in the list
                if (currentMessages.none { it.id == newMessage.id }) {
                    currentMessages.add(newMessage)
                    _uiState.value = _uiState.value.copy(messages = currentMessages)
                }
            }
        }
    }

    fun sendMessage(content: String) {
        if (content.isBlank()) return
        
        viewModelScope.launch {
            // Optimistic Update can be included here if desired
            chatRepository.sendMessage(content).fold(
                onSuccess = { /* Realtime channel will pick it up */ },
                onFailure = {
                    _uiState.value = _uiState.value.copy(error = "Failed to send message")
                }
            )
        }
    }
}
