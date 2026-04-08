package com.gemavenue.app.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gemavenue.app.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    object OtpSent : AuthState()
    object Authenticated : AuthState()
    data class Error(val message: String) : AuthState()
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    fun sendOtp(email: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            authRepository.sendOtpEmail(email).fold(
                onSuccess = {
                    _authState.value = AuthState.OtpSent
                },
                onFailure = {
                    _authState.value = AuthState.Error(it.message ?: "Failed to send OTP")
                }
            )
        }
    }

    fun verifyOtp(email: String, token: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            authRepository.verifyOtpEmail(email, token).fold(
                onSuccess = {
                    _authState.value = AuthState.Authenticated
                },
                onFailure = {
                    _authState.value = AuthState.Error(it.message ?: "Invalid OTP")
                }
            )
        }
    }

    fun checkAuthStatus() {
        if(authRepository.isUserLoggedIn) {
            _authState.value = AuthState.Authenticated
        }
    }
}
