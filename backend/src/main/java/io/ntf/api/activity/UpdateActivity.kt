package io.ntf.api.activity

import java.time.LocalDateTime

data class UpdateActivity(val id: String, val name: String, val start: LocalDateTime, val end: LocalDateTime?)
