---
title: "GC and JVM Memory Management: From GC Roots to Android Memory Leaks"
date: "2026-10-05"
summary: "A foundation-first guide to Heap, GC Roots, reachability, reclaim candidates, memory leaks, Stop-The-World, and the boundary between HotSpot GC and Android ART."
lang: "en"
category: "Android"
paired: "jvm-gc-memory-zh"
cover: "https://raw.githubusercontent.com/Josephchen-crypto/protfolio/main/public/blog-covers/jvm-gc-06.svg"
---

The first useful question in JVM memory management is not “which collector algorithm should I memorize?”

It is:

> **How does the runtime decide that an object is still alive?**

For this pass, build one mental model:

~~~mermaid
flowchart TD
    A["Object is created"] --> B["Allocated in Heap"]
    B --> C["Program creates / changes references"]
    C --> D["GC starts from GC Roots"]
    D --> E{"Still reachable?"}
    E -->|YES| F["Object stays alive"]
    E -->|NO| G["Object becomes a reclaim candidate"]
~~~

![GC and JVM memory overview](/blog-diagrams/gc-jvm-memory-overview.svg)

## 1. Why the JVM needs GC

Consider:

~~~java
User user = new User();
~~~

A useful logical model is:

~~~text
Local Variables
└── user reference
        ↓
Heap
└── User object
~~~

As the program runs, more objects are allocated in the Heap.

Java uses **Garbage Collection, GC** as automatic storage management so application code does not manually free every object.

Keep these layers separate:

~~~text
JVM Specification
→ defines managed-memory semantics

HotSpot
→ implements collectors such as G1 and ZGC

Android ART
→ has its own GC implementation
~~~

## 2. Losing one reference does not mean the object is collectible

~~~java
User a = new User();
User b = a;

a = null;
~~~

After this:

~~~text
a → null

b ─────→ User object
~~~

The object is still reachable through b.

So:

> **One variable no longer referencing an object does not mean the object can be reclaimed.**

The real question is whether the object can still be reached from a set of runtime starting points.

That is the core idea behind **reachability analysis**.

## 3. What are GC Roots?

A practical first definition is:

> **GC Roots are the starting points from which the collector walks the object graph.**

~~~mermaid
flowchart LR
    R["GC Root"] --> A["Object A"]
    A --> B["Object B"]
    C["Object C"]
~~~

A and B are reachable. C has no path from the root.

~~~text
A → reachable
B → reachable
C → unreachable
~~~

C can become a reclaim candidate.

The important wording is:

> **can be reclaimed**

not:

> **is immediately deleted**

For now, build intuition around roots associated with:

- active execution state
- certain static references
- JNI / native references
- runtime-internal references

## 4. Leaving scope does not mean immediate collection

~~~java
void test() {
    User user = new User();
}
~~~

When the method finishes, its Frame leaves the active JVM Stack. That removes one active reference path.

If no other path reaches the User object, it may become unreachable.

But:

> **unreachable ≠ GC runs immediately ≠ memory is freed at that exact source line**

The runtime decides when and how to reclaim storage.

## 5. Why `user = null` is not the same as freeing an object

Setting a reference to null only disconnects one path:

~~~text
user = null
↓
one reference is disconnected
↓
can another path still reach the object?
↓
if no path remains
↓
the object becomes a reclaim candidate
~~~

So:

~~~text
reference disconnected
≠
object immediately destroyed
~~~

## 6. Why Java can still have memory leaks

Automatic memory management does not make memory leaks impossible.

~~~java
static List<User> users = new ArrayList<>();
~~~

If a long-lived static collection keeps receiving objects:

~~~mermaid
flowchart LR
    R["GC Root"] --> S["static users"]
    S --> L["ArrayList"]
    L --> U1["User"]
    L --> U2["User"]
    L --> U3["User"]
~~~

Those User objects may already be useless to the business logic, but they are still reachable to the collector.

A useful definition is:

> **An object can be logically dead for the application while still reachable from GC Roots.**

This connects directly to Android leaks involving Activity, Context, Listener, Handler, caches, collections, and other long-lived references.

## 7. Why GC can make an application pause

Some GC phases require application threads to stop briefly so the runtime can safely inspect or modify the object graph.

The common term is:

> **Stop-The-World, STW**

A simplified model:

~~~text
application threads pause
↓
GC performs work that requires a consistent state
↓
application threads resume
~~~

Do not interpret this as “the entire GC always runs while the world is stopped.”

Modern collectors try to move substantial work into concurrent phases.

For Android developers, allocation pressure and GC behavior connect to frame drops, animation jank, and memory churn.

## 8. HotSpot GC is not Android ART GC

In Java SE 26 HotSpot, G1 is the default collector on server-class machines.

Names worth recognizing for now:

~~~text
G1
ZGC
Parallel GC
~~~

There is no need to learn their internals yet.

Android applications run on ART, not HotSpot. ART has its own garbage-collection implementation.

Android documentation describes Concurrent Copying as the default plan from Android 8, with generational extensions from Android 10.

So:

~~~text
JVM GC fundamentals
→ useful for understanding managed memory

HotSpot G1 / ZGC
≠
Android ART's concrete GC implementation
~~~

## 9. Connecting object creation to reclamation

~~~mermaid
flowchart TD
    A["new User()"] --> B["Heap storage is allocated"]
    B --> C["Reference stored in locals / fields"]
    C --> D["Program changes reference relationships"]
    D --> E["No path remains from GC Roots"]
    E --> F["Object becomes a reclaim candidate"]
    F --> G["A later GC reclaims / reorganizes space"]
    G --> H["Space can be reused for future allocations"]
~~~

That is enough for the first pass.

## 10. What to remember now

Six statements are enough:

1. Java objects and arrays are logically allocated in the JVM Heap.
2. Heap storage is managed by an automatic storage-management system, GC.
3. Reachability is the core mental model for deciding whether an object is alive.
4. GC starts from GC Roots and follows reference paths.
5. Unreachable means reclaimable, not immediately reclaimed.
6. HotSpot GC and Android ART GC are concrete implementations of different runtimes.

## 11. What not to study yet

Not now:

- Mark-Sweep
- Copying
- Mark-Compact
- detailed Young / Old generation layouts
- Eden / Survivor
- Card Table
- Remembered Set
- Write Barrier
- Safepoint
- TLAB
- G1 Region internals
- ZGC colored pointers / load barriers
- ART Concurrent Copying source internals

These can wait until they become a real blocker.

## Primary sources

- [Java Virtual Machine Specification: Heap](https://docs.oracle.com/en/java/javase/26/docs/specs/jvms/jvms-2.html#jvms-2.5.3)
- [Java SE 26 HotSpot VM Garbage Collection Tuning Guide](https://docs.oracle.com/en/java/javase/26/gctuning/)
- [Android Developers: Overview of memory management](https://developer.android.com/topic/performance/memory-overview)
- [AOSP: Debug ART garbage collection](https://source.android.com/docs/core/runtime/gc-debug)

## Videos

- [Garbage Collection in Java - The progress since JDK 8](https://www.youtube.com/watch?v=L68zxvl2LPY) · Java / Oracle
- [Garbage Collection in Java: The Performance Benefits of Upgrading](https://www.youtube.com/watch?v=0IuYYbXD-Hw) · Java / Oracle
