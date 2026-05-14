# Grama-Khata (Android App Blueprint)

Welcome to the Android source code blueprint for **Grama-Khata** (Smart Village Ledger). This document contains the structure and foundational code to build the app using **Kotlin** and **Jetpack Compose**.

## 📁 Project Structure

```text
app/src/main/java/com/gramakhata/app/
├── ui/
│   ├── theme/
│   │   ├── Color.kt
│   │   ├── Theme.kt
│   │   └── Type.kt
│   ├── components/
│   │   └── CommonUI.kt
│   └── screens/
│       ├── SplashScreen.kt
│       ├── DashboardScreen.kt
│       ├── CustomerScreen.kt
│       ├── SupplierScreen.kt
│       └── AIScreen.kt
└── model/
    ├── Customer.kt
    ├── Supplier.kt
    └── Transaction.kt
```

---

## 🎨 1. UI Theme (`ui/theme/`)

### Color.kt
```kotlin
package com.gramakhata.app.ui.theme

import androidx.compose.ui.graphics.Color

val GramaGreen = Color(0xFF006B4D)
val GramaGreenDark = Color(0xFF004D37)
val GramaAccent = Color(0xFFBBF7D0)
val BackgroundDark = Color(0xFF0F172A)
val CardDark = Color(0xFF1E293B)
val TextGray = Color(0xFF64748B)

val RedRisk = Color(0xFFEF4444)
val BlueSafe = Color(0xFF3B82F6)
```

### Type.kt
```kotlin
package com.gramakhata.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Black,
        fontSize = 32.sp,
        letterSpacing = (-1).sp
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        letterSpacing = 0.5.sp
    )
)
```

---

## 📦 2. Data Models (`model/`)

### Customer.kt
```kotlin
package com.gramakhata.app.model

data class Customer(
    val id: String = "",
    val name: String = "",
    val phone: String = "",
    val pendingAmount: Double = 0.0,
    val riskLevel: String = "LOW"
)
```

---

## 📱 3. Screens (`ui/screens/`)

### SplashScreen.kt (Modern Design)
```kotlin
package com.gramakhata.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Store
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gramakhata.app.ui.theme.GramaGreenDark
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(onTimeout: () -> Unit) {
    LaunchedEffect(Unit) {
        delay(3000)
        onTimeout()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(GramaGreenDark),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = Icons.Default.Store,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(100.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Grama-Khata",
                color = Color.White,
                fontSize = 40.sp,
                fontWeight = FontWeight.Black
            )
            Text(
                text = "Smart Village Ledger",
                color = Color.White.copy(alpha = 0.6f),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
```

### DashboardScreen.kt
```kotlin
package com.gramakhata.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.gramakhata.app.ui.theme.GramaGreen

@Composable
fun DashboardScreen() {
    Scaffold(
        topBar = {
            SmallTopAppBar(title = { Text("Grama-Khata Dashboard") })
        },
        floatingActionButton = {
            FloatingActionButton(onClick = {}, containerColor = GramaGreen) {
                Text("+", color = androidx.compose.ui.graphics.Color.White)
            }
        }
    ) { padding ->
        LazyColumn(modifier = Modifier.padding(padding)) {
            item {
                SummaryCard(title = "Total Pending", amount = "₹45,000")
            }
            // Add list items here
        }
    }
}

@Composable
fun SummaryCard(title: String, amount: String) {
    Card(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text(title)
            Text(amount, style = MaterialTheme.typography.displayLarge)
        }
    }
}
```

### AIScreen.kt
```kotlin
package com.gramakhata.app.ui.screens

// Implement Gemini SDK integration here
// Use GoogleGenAI for insights
```

---

## 🚀 Deployment Instructions
1. Open **Android Studio**.
2. Create a new **Empty Compose Activity** project.
3. Replace the `ui.theme` folder with the code above.
4. Add **Gemini SDK** dependency to `build.gradle`:
   `implementation("com.google.ai.client.generativeai:generativeai:0.7.0")`
5. Configure your `API_KEY` in `local.properties`.

---

## 🖼️ Visual Layout & Screen Details

### 1. Splash Screen
- **Background**: Deep Emerald Green (`#004D37`).
- **Elements**: 
  - Centered high-gloss white icon (Store/House).
  - "Grama-Khata" title in Black weight sans-serif.
  - Subtitle: "Smart Village Ledger" (Uppercase, wide tracking).
- **Animation**: Pulse effect on background, spring scale-in for the icon.

### 2. Dashboard
- **Theme**: Dark Mode base (`#0F172A`).
- **Overview Card**: Large gradient card showing "Total Balance" with giant currency text.
- **Quick Actions**: Horizontal scrolling buttons for "Add Customer", "Add Supplier", "Record Sale".
- **Recent Activity**: Vertical list of transactions with color-coded amounts (Red for purchase, Blue for payment).

### 3. Customer/Supplier Ledger
- **List Style**: Clean cards with glassmorphism effect.
- **Identity**: Large initial avatars with distinctive colors.
- **Status Pills**: 
  - "High Risk" (Deep Red) for long-overdue payments.
  - "Safe" (Emerald Green) for regular payees.
- **Search**: Prominent floating search bar at the top.

### 4. Grama-AI Assistant
- **Tabs**: "Credit Risk", "Behavior", "Assistant", "Reminders", "Advisor".
- **Content**: AI-generated summaries and predictions.
- **Language Toggle**: Top-right toggle for English/Kannada (ಕನ್ನಡ).

### 5. Transaction Entry (Add Khata)
- **Amount Input**: Massive centered number field with circular border.
- **Toggle**: Segmented control to switch between "Purchase" (Stock In) and "Payment" (Money In).
- **Details**: Modern rounded inputs for Date and Notes.

