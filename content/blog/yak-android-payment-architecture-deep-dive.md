---
title: "Building a Production-Grade Android Payment App: Multi-Module Architecture Deep Dive"
date: "2026-05-18"
summary: "A deep dive into how a real production mobile payment app handles multi-module architecture, service proxy patterns, and security design — built with Kotlin, MVVM, and 15 independent modules."
lang: "en"
category: "Android"
cover: "https://raw.githubusercontent.com/Josephchen-crypto/pics/master/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8818%E6%97%A5%2020_20_55.png"
---

## Background

Mobile payment apps are among the most complex consumer applications in the market. They require rock-solid security, high availability, strict transaction integrity, and the ability to scale across markets. In this post, I'll walk through the architecture of a production-grade Android payment application — the same system I built and shipped to the Mexican market.

This isn't a demo project. It's **15 modules, ~130K lines of code**, serving real users in a regulated financial environment.

---

## The Core Challenge

Most Android apps start as a single module. As they grow, three problems emerge:

1. **Coupling** — Every feature depends on every other feature. Change one thing, break three others.
2. **Build times** — A single monolithic app means recompiling everything for every change.
3. **Team friction** — Multiple teams stepping on each other's code in the same module.

Payment apps add a fourth challenge: **security and compliance** can't be optional. Every architectural decision must account for regulatory requirements, fraud prevention, and financial audit trails.

---

## Architecture Overview

```mermaid
graph TB
    subgraph app["Application Shell"]
        A["Entry Point<br/>Service Registration<br/>Routing Config"]
    end

    subgraph libs["Base Library Layer"]
        B["Base Framework<br/>Framework Components"]
        C["Core Shared Lib<br/>Business Components"]
        D["UI Component Lib<br/>Custom Widgets"]
        E["Font Lib<br/>Text Style Definitions"]
        F["Database Wrapper<br/>ORM封装"]
        G["QRCode Lib<br/>Scan-to-Pay"]
        H["Device ID Lib<br/>Device Identification"]
    end

    subgraph mods["Business Module Layer"]
        I["Core Business Module<br/>Transfer/Payment/Account"]
        J["Login & Auth Module<br/>User Authentication"]
        K["User Center Module<br/>Profile/KYC"]
        L["AML Module<br/>Anti-Money Laundering"]
    end

    subgraph services["Public Service Layer"]
        M["Service Interface Layer<br/>Routing Constants/Service Definition"]
        N["H5 Bridge<br/>Web-Native Communication"]
        O["Mini-App Container<br/>Extended Capabilities"]
    end

    A --> B
    A --> C
    A --> D
    A --> I
    A --> J
    A --> K
    A --> L

    C --> B
    C --> F
    C --> H
    C --> M
    C --> N

    I --> C
    I --> G

    J --> C
    J --> D
    J --> H

    K --> C
    K --> G

    L --> C
```

**Key Design Principle:** The shell module knows nothing about business logic. It only coordinates; it doesn't contain any.

---

## Module Dependency Hierarchy

```mermaid
graph TD
    App["Application Shell"]

    LibBase["Base Framework Lib"]
    LibCommon["Core Shared Lib"]
    LibUI["UI Component Lib"]
    LibQRCode["QRCode Lib"]

    ModMain["Core Business Module"]
    ModOnboarding["Login & Auth Module"]
    ModMine["User Center Module"]
    ModAML["AML Module"]

    Service["Service Interface Layer"]
    JSBridge["H5 Bridge"]

    App --> LibBase
    App --> LibCommon
    App --> LibUI
    App --> ModMain
    App --> ModOnboarding
    App --> ModMine
    App --> ModAML

    LibCommon --> LibBase
    LibCommon --> Service
    LibCommon --> JSBridge

    ModMain --> LibCommon
    ModMain --> LibQRCode

    ModOnboarding --> LibCommon
    ModOnboarding --> LibUI

    ModMine --> LibCommon
    ModMine --> LibQRCode

    ModAML --> LibCommon
```

---

## Multi-Module Service Proxy Pattern

The most important architectural decision was adopting the **Service Proxy Pattern** — inspired by Android's own system services design.

Instead of modules calling each other directly, every business module exposes a **service proxy** registered with a central **Service Manager**.

```mermaid
flowchart LR
    subgraph ModuleA["Business Module A"]
        A1["Service Proxy Object"]
    end

    subgraph ProxyService["Service Manager"]
        A2["Unified Service Registry & Lookup Center"]
    end

    subgraph ModuleB["Business Module B"]
        A3["Service Interface Definition"]
        A4["Service Implementation"]
    end

    A1 -->|"getService()"| A2
    A2 -->|"return interface"| A1
    A3 --- A4
```

**Why this works:**

| Property | Benefit |
|----------|---------|
| **Loose coupling** | Modules communicate only through interfaces |
| **Replaceability** | Swap implementations at runtime (plugin-like behavior) |
| **Testability** | Mock services can replace real ones in unit tests |
| **Consistency** | All module access goes through the same unified API |

Each proxy object lives in the module that owns it, and the module exposes only what other modules need — nothing more.

---

## Typical Call Sequence

```mermaid
sequenceDiagram
    participant M as Business Module
    participant PS as Service Manager
    participant S as Auth Service
    participant R as Router

    M->>PS: Get service instance
    PS->>M: Return service interface

    M->>S: Call service method
    S-->>M: Return business data

    M->>R: Initiate page navigation
    R-->>M: Navigation complete
```

---

## Unified MVVM Architecture

Every business module follows the same MVVM pattern, but with a critical enhancement: **centralized base ViewModels** that handle cross-cutting concerns automatically.

```mermaid
flowchart LR
    V["View Layer<br/>Page"] <-->|"Data Binding"| VM["ViewModel Layer<br/>Base ViewModel"]
    VM --> R["Repository"]
    R --> API["Network Layer<br/>HTTP Client"]
    R --> DB["Local Layer<br/>Database/Key-Value Store"]

    subgraph BaseViewModel
        VM -->|"Unified封装"| L["Loading State Management"]
        VM -->|"Unified封装"| E["Error Handling"]
        VM -->|"Unified封装"| T["Auth Refresh & Retry"]
    end
```

Instead of writing the same error-handling boilerplate in every ViewModel, every module's ViewModel inherits from a base that provides:

- Standardized loading/error/success state transitions
- Automatic token refresh with synchronized retry
- Centralized exception handling

This reduced module-specific ViewModel code by roughly **60%** compared to a conventional approach.

---

## Security Architecture

A payment app lives or dies by its security posture. Here's how security is woven into the architecture:

### Layer 1: Transport Security

Custom `SSLSocketFactory` + certificate pinning for all production builds. Development builds use configurable trust settings to support internal testing.

### Layer 2: Application Security

| Security Layer | Implementation |
|----------------|----------------|
| Biometric auth | Fingerprint, Face ID, Iris — configurable per transaction value |
| Root detection | Release builds refuse to run on rooted devices |
| Token management | Auto-refresh with synchronized retry; auto-logout on refresh failure |
| Crash reporting | Firebase Crashlytics (production toggle) |

### Layer 3: Transaction Security (AML / KYC)

```mermaid
flowchart TD
    T["Transaction Triggered"] --> R["Risk Level Assessment"]

    R --> L["Low Risk"]
    R --> M["Medium Risk"]
    R --> H["High Risk"]

    L --> B["Biometric"]
    M --> O["OTP Verification"]
    H --> P["Password + OTP"]

    B --> BR{"Passed?"}
    O --> OR{"Passed?"}
    P --> PR{"Passed?"}

    BR -->|Yes| BP["Transaction Approved"]
    BR -->|No| BD["Transaction Rejected"]
    OR -->|Yes| OP["Transaction Approved"]
    OR -->|No| OD["Transaction Rejected"]
    PR -->|Yes| PP["Transaction Approved"]
    PR -->|No| PD["Transaction Rejected"]
```

The AML module operates **fully independently** from other business modules. This isn't an accident — financial regulations require that fraud prevention cannot be bypassed by business logic in other modules.

---

## Token Auto-Refresh Mechanism

```mermaid
flowchart TD
    R["Network Request"] --> I["Auth Interceptor"]
    I --> C{"Token Valid?"}
    C -->|Yes| P["Proceed with Request"]
    C -->|No| S["Synchronous Token Refresh"]
    S --> T["Wait for Refresh"]
    T -->|"Success"| N["Retry with New Token"]
    T -->|"Failure"| L["Auto Logout"]

    subgraph RefreshMechanism
        S
        T
    end
```

**Design Highlights:**
- HTTP interceptor automatically detects token expiration
- Synchronized refresh mechanism prevents race conditions
- Refresh failure triggers auto-logout for security

---

## Build Configuration Matrix

One practical detail that saves enormous time: **6 build environments** with independent configurations:

| Environment | Purpose | HTTP Logging | SSL | Debuggable |
|-------------|---------|-------------|-----|------------|
| `dev` | Local development | ✅ | ❌ | ✅ |
| `deb` | Debug builds | ✅ | ❌ | ✅ |
| `sit` | Integration testing | ✅ | ❌ | ✅ |
| `uat` | QA acceptance | ✅ | ❌ | ✅ |
| `hfx` | Hotfix | ❌ | ❌ | ✅ |
| `pro` | Production release | ❌ | ✅ | ❌ |

Each environment maps to a distinct API endpoint, signing configuration, and feature flag set. CI/CD pipelines target specific environments automatically.

---

## Service Registration Flow

```mermaid
flowchart TD
    A["App Startup"] --> B["Register Module Services"]
    B --> C["Service Manager Registration"]
    C --> D["Register Main Module Proxy"]
    C --> E["Register Auth Module Proxy"]
    C --> F["Register Security Module Proxy"]
    C --> G["Register User Module Proxy"]
    C --> H["Register AML Module Proxy"]
    D --> I{"Registration Complete"}
    E --> I
    F --> I
    G --> I
    H --> I
```

---

## Service Proxy Class Diagram

```mermaid
classDiagram
    class ServiceManager {
        -proxyMap: Map
        +registerService(proxy)
        +getService(name) ServiceInterface
        +getInstance() ServiceManager
    }

    class ServiceProxyInterface {
        <<interface>>
        +getServiceName() String
        +getService() ServiceInterface
    }

    class MainModuleProxy {
        +getServiceName() String
        +getService() ServiceInterface
    }

    class AuthModuleProxy {
        +getServiceName() String
        +getService() ServiceInterface
    }

    class BusinessServiceInterface {
        <<interface>>
    }

    class AuthServiceInterface {
        <<interface>>
    }

    ServiceManager o-- ServiceProxyInterface
    MainModuleProxy ..|> ServiceProxyInterface
    AuthModuleProxy ..|> ServiceProxyInterface
    MainModuleProxy ..> BusinessServiceInterface
    AuthModuleProxy ..> AuthServiceInterface
    AuthServiceInterface --|> BusinessServiceInterface
```

---

## Third-Party Integrations

This app integrates with real external services:

- **HERE SDK** — Map services for merchant discovery
- **MetaMap** — KYC identity verification (government ID + selfie)
- **Firebase** — Crash reporting, performance monitoring, push notifications
- **DiDi Platform** — In-house performance profiling and network tracing

These integrations are isolated behind wrapper classes in the Common Library. If a third-party SDK needs to be replaced, only the wrapper changes — the rest of the app is unaffected.

---

## Key Takeaways

If you're building or contributing to a large-scale Android app:

1. **Design for module boundaries first** — Not features, not layers. Module boundaries are the hardest thing to change later.
2. **Service proxy pattern solves module coupling** — It's not the only way, but it's battle-tested in a production payment app.
3. **Unified error handling in one place** — Don't let error handling logic scatter across ViewModels. Centralize it in a base class.
4. **Security is an architectural concern, not a feature** — Design your security model before writing the first line of business logic.
5. **CI/CD + multi-environment builds are not optional** — With 15 modules and 6 environments, manual builds would be a full-time job.

---

*This post is based on my experience leading the Android architecture for a production payment application serving the Mexican market. The architecture described has been adapted to remove proprietary naming while preserving the technical substance.*