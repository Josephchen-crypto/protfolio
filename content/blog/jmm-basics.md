---
title: "Java Memory Model Basics: Visibility, Ordering, and happens-before"
date: "2026-10-05"
summary: "A foundation-first introduction to the Java Memory Model, visibility, ordering, atomicity, happens-before, volatile, synchronized, and how these ideas connect to Android concurrency."
lang: "en"
category: "Android"
paired: "jmm-basics-zh"
cover: "/myknowledge/cover-jvm.svg"
---

After GC, the next JVM foundation is the **Java Memory Model, JMM**.

The first thing to remember is:

> **JMM is not the JVM runtime memory-area diagram. It is a set of rules that defines what one thread is allowed to observe from another thread's writes.**

![JMM basics overview](/blog-diagrams/jmm-basics-overview.svg)

## 1. Start with one shared-state problem

~~~java
class Demo {
    boolean ready = false;
    int number = 0;
}
~~~

Thread A:

~~~java
number = 42;
ready = true;
~~~

Thread B:

~~~java
if (ready) {
    System.out.println(number);
}
~~~

Single-thread intuition is not enough to reason about this safely.

The Java Memory Model defines which writes a read is allowed to observe during a multithreaded execution.

## 2. Three basic concurrency properties

### Visibility

If Thread A writes ready = true, when must Thread B observe that write?

### Ordering

Compilers, JITs, and processors may perform legal reorderings as long as the resulting execution remains within the behaviors allowed by the Java Memory Model.

### Atomicity

count++ looks like one line, but conceptually it contains a read, increment, and write.

A source-code statement is not automatically one indivisible concurrent action.

## 3. JMM is not JVM Runtime Data Areas

~~~text
JVM Runtime Data Areas
→ where runtime data logically lives

JMM
→ what multithreaded reads and writes are allowed to observe
~~~

These are different topics.

## 4. What is actually shared?

Instance fields, static fields, and array elements can be shared between threads. Local variables and method parameters themselves are not shared state.

~~~text
Thread A Stack          Thread B Stack
 local a                 local b
     │                       │
     └───────┐       ┌───────┘
             ↓       ↓
          Shared Heap
        object.field
        static field
        array element
~~~

## 5. What is happens-before?

A practical first definition:

> **If A happens-before B, JMM gives B the visibility and ordering guarantees required to observe A correctly.**

~~~text
Thread A
write shared state
    │
    │ happens-before
    ▼
Thread B
read shared state
~~~

It is not merely the same thing as “A happened earlier in wall-clock time.”

## 6. Four happens-before relationships to remember first

- Program order inside one thread.
- Monitor unlock happens-before a later lock on the same monitor.
- A volatile write happens-before a later volatile read of the same variable.
- Thread.start() and Thread.join() establish important cross-thread ordering relationships.

## 7. What volatile solves

~~~java
class Demo {
    volatile boolean ready = false;
    int number = 0;
}
~~~

volatile is primarily about visibility and ordering.

But:

~~~java
volatile int count = 0;
count++;
~~~

is still a compound operation.

So:

~~~text
volatile
→ visibility + ordering constraints
→ not automatic compound-operation atomicity
~~~

## 8. What synchronized solves

~~~java
synchronized (lock) {
    count++;
}
~~~

It gives:

~~~text
Mutual exclusion
+
Visibility / ordering through happens-before
~~~

From a JMM perspective, synchronized is both a locking mechanism and a memory-visibility mechanism.

## 9. Why Android developers need this

Android code frequently crosses execution contexts:

~~~text
main thread
worker thread
thread pool
HandlerThread
Binder thread
coroutine dispatcher
network callback
database callback
~~~

If those contexts share state, ask:

~~~text
Who writes?
Who reads?
What establishes synchronization?
Why is the latest result guaranteed to be visible?
Is a compound operation actually atomic?
~~~

That is where JMM becomes practical Android engineering.

## 10. Do not reduce JMM to CPU cache

Cache diagrams are useful intuition, but they are not the formal JMM.

Keep the layers separate:

~~~text
JMM
→ Java-language concurrency semantics

JIT / Compiler
→ legal optimizations

CPU / Hardware
→ concrete execution and hardware memory model
~~~

## 11. What to remember now

1. JMM is not the JVM runtime-area diagram.
2. JMM defines legal behavior for multithreaded access to shared state.
3. Visibility, ordering, and atomicity are the three basic properties to recognize.
4. happens-before is the core relationship used to establish visibility and ordering guarantees.
5. volatile is mainly about visibility and ordering.
6. volatile does not make compound operations such as count++ atomic.
7. synchronized provides both mutual exclusion and happens-before guarantees.

## 12. What not to study yet

Not now:

- formal execution tuples
- complete synchronizes-with rules
- sequential-consistency proofs
- causality requirements
- out-of-thin-air values
- cache-coherence protocols
- store buffers
- hardware fence details
- VarHandle
- Unsafe
- deep final-field semantics
- jcstress models

These can wait until Java concurrency.

## Primary sources

- [Java Language Specification SE 26 · Chapter 17 Threads and Locks](https://docs.oracle.com/javase/specs/jls/se26/html/jls-17.html)
- [Java Language Specification SE 26 · §17.4 Memory Model](https://docs.oracle.com/javase/specs/jls/se26/html/jls-17.html#jls-17.4)
- [Java Language Specification SE 26 · §17.4.5 Happens-before Order](https://docs.oracle.com/javase/specs/jls/se26/html/jls-17.html#jls-17.4.5)

## Video

- [Java Memory Model Pragmatics · Aleksey Shipilev](https://www.youtube.com/watch?v=TxqsKzxyySo)

This talk is intentionally advanced. Use it later as a deeper reference rather than a prerequisite for the first pass.
