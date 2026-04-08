package com.gemavenue.app.domain.repository

import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.gotrue.OtpType
import io.github.jan.supabase.gotrue.providers.builtin.OTP
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

interface AuthRepository {
    suspend fun sendOtpEmail(email: String): Result<Unit>
    suspend fun verifyOtpEmail(email: String, token: String): Result<Unit>
    suspend fun logout()
    val isUserLoggedIn: Boolean
}

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val auth: Auth
) : AuthRepository {

    override suspend fun sendOtpEmail(email: String): Result<Unit> {
        return try {
            auth.signInWith(OTP) {
                this.email = email
            }
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    override suspend fun verifyOtpEmail(email: String, token: String): Result<Unit> {
        return try {
            auth.verifyEmailOtp(
                type = OtpType.Email.MAGIC_LINK,
                email = email,
                token = token
            )
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    override suspend fun logout() {
        auth.signOut()
    }

    override val isUserLoggedIn: Boolean
        get() = auth.sessionStatus.value is io.github.jan.supabase.gotrue.SessionStatus.Authenticated
}
