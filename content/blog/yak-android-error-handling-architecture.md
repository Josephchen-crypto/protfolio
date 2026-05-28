---
title: "Four-Layer Error Handling in a Production Android Payment App"
date: "2026-05-28"
summary: "How a production-grade 15-module Android payment app structures error handling across four layers: ErrorHandler business interception, BaseRepository base layer, ViewModel DSL strategies, and ResultBuilder final fallback — each layer with a single responsibility."
lang: "en"
category: "Android"
paired: "yak-android-error-handling-architecture-zh"
cover: "https://raw.githubusercontent.com/Josephchen-crypto/pics/master/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8818%E6%97%A5%2020_20_55.png"
---

## Background

Payment apps are among the most demanding consumer applications when it comes to error handling:

- **Transaction failures demand clear, actionable feedback** — a vague "network error" isn't enough
- **Different business scenarios need different error UIs** — insufficient balance needs a dialog, OTP failure needs a bottom sheet, sensitive operations need an alert with a phone number
- **Token expiration must trigger logout exactly once** — multiple concurrent requests hitting an expired token can't each fire their own logout
- **Error code management can't be centralized and hardcoded** — with 15 modules, that creates a change-everything problem

This post documents a real production four-layer error handling architecture. All specific class names have been generalized to preserve architectural patterns while removing project-specific identifiers.

---

## 1. Overall Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1 │  ErrorHandler Interface + ErrorManager      │
│          │  Business error codes → Custom UI dialogs    │
├─────────────────────────────────────────────────────────┤
│  Layer 2 │  BaseRepository (base network request class)│
│          │  Code normalization / Token expiry / Net err │
├─────────────────────────────────────────────────────────┤
│  Layer 3 │  BaseViewModel (base ViewModel)             │
│          │  Three UI strategy DSLs for caller to choose  │
├─────────────────────────────────────────────────────────┤
│  Layer 4 │  ResultBuilder (final fallback callback)      │
│          │  Page handles any error no earlier layer caught│
└─────────────────────────────────────────────────────────┘
```

Each layer has a single, focused responsibility. Layers communicate through callbacks — no circular dependencies.

---

## 2. Layer 1: Business Error Code Dispatch

### 2.1 Core Interface

```kotlin
interface ErrorHandler {
    // Return true to intercept this code — stops propagating down
    fun accept(code: String): Boolean
    // Custom error display behavior
    fun onError(errorCode: String, errorMsg: String)
}
```

### 2.2 Dispatch Mechanism

```kotlin
object ErrorManager {
    private val handlers = arrayListOf<ErrorHandler>()

    fun register(handler: ErrorHandler) {
        if (handlers.contains(handler)) return
        handlers.add(handler)
    }

    // Traverses in registration order; first Handler with accept==true intercepts
    fun dispatch(code: String, msg: String): Boolean {
        handlers.forEach {
            if (it.accept(code)) {
                MainScope().launch(Dispatchers.Main) { it.onError(code, msg) }
                return true
            }
        }
        return false  // No Handler intercepted → ResultBuilder fallback
    }
}
```

**Key design points:**

| Design Point | Behavior |
|-------------|----------|
| **Chain interception** | First match wins — no cascading |
| **Main-thread safety** | UI ops forced to `Dispatchers.Main` |
| **Boolean return** | Tells caller whether interception happened |

### 2.3 Business Handler Example

A typical business `ErrorHandler` structure, with error codes generalized:

```kotlin
class BusinessErrorHandler : ErrorHandler {

    // Physical card error codes (example)
    private val physicalCardCodes = listOf("PHYSICAL_01", "PHYSICAL_02", "PHYSICAL_03", "PHYSICAL_04")

    // P2P transfer error codes (example)
    private val p2pTransferCodes = listOf(
        "P2P_01", "P2P_02", "P2P_03", "P2P_04",
        "P2P_05", "P2P_06", "P2P_07", "P2P_08",
        "P2P_09", "P2P_10", "P2P_11"
    )

    // Shared card duplicate error codes (example)
    private val shareCardCodes = listOf("SHARE_01", "SHARE_02")

    override fun accept(code: String): Boolean {
        return code in physicalCardCodes
                || code in p2pTransferCodes
                || code in shareCardCodes
    }

    override fun onError(errorCode: String, errorMsg: String) {
        when (errorCode) {
            in physicalCardCodes -> showErrorDialogWithCallCenter(...)
            in p2pTransferCodes -> showBottomSheetError(...)
            in shareCardCodes -> showSimpleTipDialog(...)
        }
    }
}
```

**Three dialog types comparison:**

| Dialog Type | Typical Scenario | Characteristics |
|-------------|-----------------|-----------------|
| Error dialog with call center entry | Physical card operation failure | Icon + code + **call center button**, for scenarios needing agent support |
| Lightweight bottom sheet | P2P transfer failure | Bottom sheet, lightweight, for high-frequency transactions |
| Simple tip dialog | Duplicate share card operation | One-tap close, for duplicate operation blocking |

> 💡 **Adding a new business error code takes three steps:**
> 1. Add the new code to the relevant Handler's code list
> 2. Add the dialog logic in the `when` branch
> 3. Register the Handler in Application (if not already)
>
> **No changes needed to Repository / ViewModel / page code** — Open/Closed Principle satisfied.

---

## 3. Layer 2: BaseRepository (Base Network Interceptor)

`BaseRepository` is the base class for all network requests, handling **protocol-level and business-level normalization**. Every module's Repository inherits from it.

### 3.1 Error Code Normalization

API responses return codes in `PREFIX-CODE` format (e.g., `PREFIX-04200`). The base class normalizes by stripping the prefix:

```kotlin
override fun normalizeCode(result: BaseResult) {
    result.resultCode = result.resultCode.split("-").let {
        if (it.size > 1) it.last() else it[0]
    }
}
// "PREFIX-04200" → "04200"
```

> 📌 Upstream APIs return codes with inconsistent prefixes. Stripping to pure numeric codes lets all business Handlers match against a single format.

### 3.2 Token Expiry Fallback

A list of common fail codes, handled uniformly:

```kotlin
override fun getCommonFailCodes(): List<String> {
    return listOf(TOKEN_NULL, TOKEN_INVALID, TOKEN_INVALID_2, TOKEN_INVALID_3)
}

override fun handleCommonFail(result: BaseResult) {
    when (result.resultCode) {
        TOKEN_INVALID, TOKEN_NULL, TOKEN_INVALID_2, TOKEN_INVALID_3 -> {
            synchronized(lock) {
                authService.logout(sessionOverTime = true)
            }
        }
    }
}
```

> ⚠️ **`synchronized(lock)` is critical**: when multiple concurrent requests all receive a Token expiry response, only one thread enters the sync block and fires logout — preventing duplicate `logout()` calls.

### 3.3 Network Exception Handling

```kotlin
override fun handleException(e: Throwable) {
    if (e.message != "Canceled") {  // User-initiated cancellation: silent
        when (e) {
            is TokenRefreshException -> {
                authService.logout(sessionOverTime = true)
            }
            else -> {
                // Other network exceptions → propagate to ViewModel layer
            }
        }
    }
}
```

| Exception Type | Handling |
|---------------|----------|
| `TokenRefreshException` | Sync block logout, clear session, redirect to login |
| `Connect / Socket / SSL / UnknownHost` | Propagate to ViewModel, DSL strategy decides UI |
| `Canceled` | Silent — no Handler triggered |

---

## 4. Layer 3: BaseViewModel (Three-Strategy DSL)

The base ViewModel exposes three higher-order functions — **the caller chooses** the error display strategy:

### 4.1 The Three Strategies

```kotlin
// Strategy 1️⃣: Dialog + Retry button
fun <T> requestWithDialogError(
    request: suspend () -> Response<T>,
    enableErrorHandler: Boolean = true,
    retryCallback: (() -> Unit)? = null,
    result: ResultBuilder<T>.() -> Unit
)

// Strategy 2️⃣: Toast
fun <T> requestWithToastError(
    request: suspend () -> Response<T>,
    result: ResultBuilder<T>.() -> Unit
)

// Strategy 3️⃣: Full-screen error page
fun <T> requestWithFullPageError(
    request: suspend () -> Response<T>,
    result: ResultBuilder<T>.() -> Unit
)
```

### 4.2 Unified Dispatch Logic

All three strategies internally route through `requestInternalWithErrorTip`:

```kotlin
fun <T> requestInternalWithErrorTip(
    request: suspend () -> Response<T>,
    errorTip: ((Throwable) -> Unit)? = null,  // Injected by each strategy
    enableErrorHandler: Boolean = true,
    result: ResultBuilder<T>.() -> Unit
) {
    val builder: ResultBuilder<T>.() -> Unit = {
        onSuccess = { viewModelScope.launch(Dispatchers.Main) { listener.onSuccess.invoke(it) } }

        onFailed = { errorCode, errorMsg ->
            viewModelScope.launch(Dispatchers.Main) {
                if (enableErrorHandler) {
                    if (!ErrorManager.dispatch(errorCode, errorMsg)) {
                        listener.onFailed.invoke(errorCode, errorMsg)  // fallback
                    }
                } else {
                    listener.onFailed.invoke(errorCode, errorMsg)
                }
            }
        }

        onError = { error ->
            viewModelScope.launch(Dispatchers.Main) {
                if (isNetworkError(error)) {
                    errorTip?.invoke(error)  // Dialog / Toast / FullPage
                }
                listener.onError.invoke(error)
            }
        }
    }
}
```

### 4.3 Decision Flow

```
Business error code arrives
    │
    ├── enableErrorHandler == false?
    │       └── Direct → ResultBuilder.onFailed (skip Handler)
    │
    └── enableErrorHandler == true
            │
            └── ErrorManager.dispatch(code, msg)
                    │
                    ├── Handler matched (accept == true)
                    │       └── onError() → custom dialog, skip onFailed
                    │
                    └── No Handler matched
                            └── ResultBuilder.onFailed (fallback)
```

### 4.4 Network Exception Detection

```kotlin
fun isNetworkError(error: Throwable): Boolean {
    return when (error) {
        is ConnectException,
        is SocketTimeoutException,
        is SSLException,
        is UnknownHostException -> true
        else -> false
    }
}
```

Only these four network exception types trigger Dialog/Toast/FullPage. Custom business exceptions do not.

### 4.5 Concurrent Request Strategy

Concurrent multi-request supports all three strategies via the `errorTip` callback:

```kotlin
concurrentRequests(
    *requests,
    isAsync = true,  // true=concurrent, false=sequential
    showLoading = true
) {
    // Dialog strategy
    ActivityManager.top()?.let {
        NetworkErrorDialog(it, retryCallback).show()
    }
    // Toast strategy
    ToastUtil.show(getString(R.string.network_error))
    // FullPage strategy
    errorState.postValue(it)
}
```

---

## 5. Layer 4: ResultBuilder DSL (Final Fallback)

`ResultBuilder` is the innermost callback — the page handles any error no earlier layer caught:

```kotlin
viewModel.requestWithDialogError(
    request = { api.queryBalance() }
) {
    onSuccess { balance -> updateUI(balance) }
    onFailed { code, msg -> showCustomDialog(code, msg) }
    onError { error -> logError(error) }
}
```

**Trigger conditions for each callback:**

| Callback | Triggered When |
|----------|---------------|
| `onSuccess` | `resultCode == 0` or `resultCode == "0000"` |
| `onFailed` | `resultCode != 0` AND **no** `ErrorHandler` matched |
| `onError` | Network exception / request cancelled / parse error / runtime error |

---

## 6. Complete Data Flow

```
External request ── HTTP Client ──▶ Response
    │
    │ resultCode != null (business response)
    │
    ├─▶ normalizeCode()
    │       "PREFIX-04200" → "04200"
    │
    ├─▶ getCommonFailCodes() match
    │       Token expiry code detected
    │       └─▶ handleCommonFail() → logout(sessionOverTime=true)
    │
    └─▶ ErrorManager.dispatch(code, msg)
            │
            ├── Handler matched
            │       └─▶ onError() → custom dialog
            │
            └── No Handler matched
                    └─▶ ResultBuilder.onFailed() fallback

    │ resultCode == null (network exception)
    │
    └─▶ handleException(e)
            ├─ TokenRefreshException → logout(sessionOverTime=true)
            ├─ Network 4-exception → errorTip (Dialog/Toast/FullPage)
            └─ else → Toast "network error"
```

---

## 7. Design Highlights

### ✨

1. **Clear layer separation**
   - Business error codes ↔ Network exceptions ↔ UI display — three separate layers, each layer is non-invasive to others
   - Adding a new error display form only requires injecting a new strategy — no changes to Repository

2. **Handler chain follows Open/Closed Principle**
   - New business error handling only needs a new `ErrorHandler` registration — existing code untouched
   - Each business line manages its own error codes independently

3. **DSL higher-order functions reduce boilerplate**
   - Three strategies for the caller to choose from; base ViewModel stays clean
   - Pages don't repeat try-catch / loading state management

4. **Token expiry `synchronized` protection**
   - Multiple concurrent requests hitting expired Token — `synchronized(lock)` ensures logout fires exactly once
   - Prevents UI flapping from rapid succession `logout()` calls

---

*This post is based on real production code. Class names and error codes have been generalized; the architectural substance is preserved.*
