package com.gemavenue.app.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommentsBottomSheet(
    reelId: String,
    onDismissRequest: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        dragHandle = { BottomSheetDefaults.DragHandle() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            Text("Comments", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(16.dp))
            
            // Comment List Placeholder
            LazyColumn(modifier = Modifier.weight(1f)) {
                items(5) { index ->
                    CommentItemPlaceholder()
                }
            }

            // Input field placeholder
            OutlinedTextField(
                value = "",
                onValueChange = {},
                placeholder = { Text("Add a comment...") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp)
            )
        }
    }
}

@Composable
fun CommentItemPlaceholder() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.Top
    ) {
        // Avatar placeholder
        Surface(
            modifier = Modifier.size(40.dp),
            shape = MaterialTheme.shapes.extraLarge,
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {}
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text("Username", style = MaterialTheme.typography.labelMedium)
            Text("This is an amazing reel! I would love to buy this product. 🔥", style = MaterialTheme.typography.bodyMedium)
            Row(modifier = Modifier.padding(top = 4.dp)) {
                Text("Reply", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(end = 16.dp))
                Text("Like", style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}
