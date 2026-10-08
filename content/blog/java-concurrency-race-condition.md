---
title: "Java Concurrency Foundations: Why Shared State Breaks Under Multiple Threads"
date: "2026-10-08"
summary: "Build the concurrency mental model from a lost-update example: shared mutable state, race conditions, JMM data races, critical sections, and why correctness comes before memorizing locks or thread pools."
lang: "en"
category: "Android"
paired: "java-concurrency-race-condition-zh"
cover: "/myknowledge/cover-jvm.svg"
aliases:
  - "Java Concurrency Basics"
  - "Race Condition"
module: "Java_JVM"
type: "main_atomic_note"
priority: "S"
depth_target: "L3"
current_level: "L0"
status: "learning"
prerequisites:
  - "[[Java Memory Model Basics]]"
related:
  - "[[synchronized]]"
  - "[[volatile]]"
  - "[[CAS and Atomic]]"
  - "[[Java Thread Pools]]"
used_by:
  - "[[Android Handler and Looper]]"
  - "[[Kotlin Coroutines]]"
visual_assets:
  - "../assets/diagrams/jvm/java-concurrency-race-condition.svg"
last_reviewed: "2026-10-08"
tags:
  - "Java"
  - "JVM"
  - "Concurrency"
  - "RaceCondition"
  - "SeniorAndroid"
---

# Java Concurrency Foundations: Why Shared State Breaks Under Multiple Threads

> [!abstract] One problem only
>
> **Why can two threads touching the same shared data produce a wrong result?**
>
> This note builds the correctness foundation first. It does not yet dive into synchronized, volatile, CAS, Lock, or thread-pool internals.

The previous note introduced JMM, visibility, atomicity, and happens-before. This note puts those ideas into a program that can actually fail.

---

# 0. The compressed mental model

~~~text
multiple threads
   ↓
same mutable shared state
   ↓
at least one write
   ↓
operations interleave
   ↓
correctness depends on timing
   ↓
race condition
   ↓
correct synchronization / atomicity design
~~~

The main sentence:

> **Concurrency becomes dangerous when independent execution flows touch the same mutable shared state, not merely because many threads exist.**

---

# 1. Pre-study self-check

Do not look for the answer yet.

### Question 1

~~~java
int count = 0;
count++;
~~~

If two threads execute the increment once each, must the final value be 2?

### Question 2

If count becomes volatile:

~~~java
volatile int count = 0;
~~~

does count++ become safe?

### Question 3

If the program runs correctly 100 times on your machine, does that prove there is no concurrency bug?

---

# 2. Map the new ideas to what you already know

| New idea | Existing knowledge | Connection | Common trap |
|---|---|---|---|
| Shared state | Heap fields, static fields, array elements | Multiple threads can access the same data | Not every variable is shared |
| Race condition | Uncontrolled execution order | Correctness depends on interleaving | It does not have to crash |
| Data race | JMM and happens-before | Conflicting accesses are not ordered by happens-before | Not identical to race condition |
| Atomicity | One JMM property | A logical action must not be broken by harmful interleaving | One source line is not automatically atomic |
| Critical section | Shared mutable state | A group of operations needs protection as one unit | Do not lock everything blindly |

> Check: why are ordinary local variables usually less exposed to this problem than shared fields?

---

# 3. One-sentence intuition

> **Both threads may believe they read the current value, while in fact they read the same old value.**

That is the seed of many lost-update bugs.

---

# 4. Android business example

Imagine a wallet screen refreshing several RPC sources in parallel. We count successful tasks:

~~~java
class SyncState {
    int successCount = 0;

    void onRequestSuccess() {
        successCount++;
    }
}
~~~

Two background tasks finish almost together:

~~~text
RPC Task A → onRequestSuccess()
RPC Task B → onRequestSuccess()
~~~

Human intuition:

~~~text
0 → 1 → 2
~~~

Concurrent execution is not required to line up that neatly.

> Check: is the dangerous part "using background threads", or "multiple tasks mutating the same successCount"?

---

# 5. Minimal Java example

~~~java
class Counter {
    int count = 0;

    void increment() {
        count++;
    }
}
~~~

Thread A calls increment.

Thread B calls increment.

Starting from:

~~~text
count = 0
~~~

we expect:

~~~text
count = 2
~~~

but may observe:

~~~text
count = 1
~~~

This is a **lost update**.

---

# 6. Why count++ is not one indivisible action

For the concurrency mental model, think of:

~~~java
count++;
~~~

as:

~~~text
1. read count
2. compute count + 1
3. write the result back
~~~

This is a logical decomposition, not a claim that every CPU must execute exactly three machine instructions.

Another thread can interleave between those logical steps.

---

# 7. How two threads turn 2 into 1

![Java concurrency lost update](../assets/diagrams/jvm/java-concurrency-race-condition.svg)

One possible interleaving:

| Time | Thread A | Thread B | Shared count |
|---|---|---|---:|
| 1 | read 0 |  | 0 |
| 2 |  | read 0 | 0 |
| 3 | compute 1 |  | 0 |
| 4 |  | compute 1 | 0 |
| 5 | write 1 |  | 1 |
| 6 |  | write 1 | 1 |

Neither thread performed incorrect arithmetic.

The problem is that the whole read-modify-write sequence was not protected as one required atomic action.

> Check: if Thread B could not enter increment() until Thread A completed the full operation, could this lost update still happen?

---

# 8. What is a race condition?

A practical definition:

> **A race condition exists when correctness depends on the timing or interleaving of concurrent operations and the program has not controlled that dependency correctly.**

The dangerous part is that it may disappear while debugging and only surface under pressure, slower devices, or rare scheduling.

So:

> **"It worked locally" is not evidence that concurrent code is correct.**

---

# 9. Race condition is not identical to data race

This distinction matters in Senior interviews.

## Race condition

A broader engineering concept:

> Correctness depends on concurrent timing or interleaving.

## Data race

JMM gives a more precise rule.

Two different threads access the same variable, the accesses conflict, at least one access is a write, and the accesses are not ordered by happens-before.

A useful first model:

~~~text
Data race
= JMM's precise category for unsynchronized conflicting memory accesses

Race condition
= broader correctness problem caused by concurrent timing/interleaving
~~~

The unsynchronized count++ example involves both.

Do not memorize:

~~~text
race condition == data race
~~~

> Check: why can a program without a low-level data race still contain a higher-level race condition?

Hint: several individually safe operations may still need to be atomic as a group.

---

# 10. How this connects to JMM

The previous note introduced:

~~~text
visibility
ordering
atomicity
happens-before
~~~

Now they become one connected model.

For shared reads and writes, ask:

~~~text
Is the write visible?
What ordering is guaranteed?
Are conflicting accesses ordered by happens-before?
Does a group of operations need to be atomic?
~~~

The point of JMM is not terminology.

It gives you a basis for answering:

> **Why is another thread allowed to observe the state I expect?**

---

# 11. Critical section

If the business requirement is:

~~~text
read count
+
add 1
+
write count
~~~

as one protected action, the code region that must preserve that correctness property can be treated as a **critical section**.

This leads to a better question than "which API should I memorize?":

> **Which shared state and which invariant am I protecting?**

That question comes before choosing synchronized, Lock, atomics, or a state redesign.

---

# 12. Road signs for the next topics

No deep implementation yet.

~~~text
synchronized
→ mutual exclusion + happens-before

volatile
→ visibility / ordering semantics
→ does not make count++ an atomic compound operation

AtomicInteger / CAS
→ specific atomic read-modify-write operations

Lock
→ explicit and more flexible locking control

Executor / thread pool
→ task and thread-resource management
→ does not automatically remove shared-state races
~~~

The boundary to remember:

> **A thread pool is not a thread-safety mechanism.**

---

# 13. Three wrong mental models to remove now

## Wrong model 1: one source line means one atomic action

It does not.

## Wrong model 2: volatile fixes count++

~~~java
volatile int count;
count++;
~~~

volatile provides important visibility and ordering semantics, but the read-modify-write compound operation is still not automatically indivisible.

## Wrong model 3: sleep can be used as synchronization

~~~java
Thread.sleep(100);
~~~

JLS explicitly states that Thread.sleep and Thread.yield do not have synchronization semantics.

---

# 14. Minimal exercise

Goal: deliberately produce a lost update before fixing anything.

~~~yaml
exercise:
  objective: "Run two threads against an unsynchronized count++ and compare expected with actual"
  context: "Plain Java Counter, no Android dependency"
  expected_output: "expected = 200000; actual may be lower"
  constraints:
    - "Both threads share one Counter instance"
    - "Each thread loops 100000 times"
    - "The main thread waits for both threads before reading the result"
    - "First version may not use synchronized, Lock, or AtomicInteger"
  edge_cases:
    - "Lower loop counts may hide the bug"
    - "One correct run does not prove thread safety"
  acceptance_criteria:
    - "Explain why actual may be lower than expected"
    - "Identify the exact shared variable"
    - "Explain why join waits for completion but does not make count++ atomic"
~~~

Starter:

~~~java
class Counter {
    int count = 0;

    void increment() {
        // TODO
    }
}

public class RaceDemo {
    public static void main(String[] args) throws Exception {
        Counter counter = new Counter();

        // TODO Thread A
        // TODO Thread B
        // TODO start
        // TODO join

        System.out.println(counter.count);
    }
}
~~~

Do not add a lock first. The first goal is to observe and explain the bug.

---

# 15. Hidden bug training

Judge the code first. Do not reveal the solution yet.

### Bug 1

~~~java
class DownloadStats {
    volatile int finished = 0;

    void onFinished() {
        finished++;
    }
}
~~~

Is finished++ now safe across multiple download threads?

### Bug 2

~~~java
if (!cache.containsKey(key)) {
    cache.put(key, load(key));
}
~~~

Assume containsKey and put are individually thread-safe.

Is the full check-then-put operation necessarily thread-safe?

### Bug 3

~~~java
Thread.sleep(100);

if (ready) {
    use(data);
}
~~~

Another thread sets data and ready.

Can sleeping be the synchronization design?

---

# 16. How to spot danger in Android code

Raise a yellow flag when you see:

~~~text
multiple callbacks / threads / executors / dispatchers
                    ↓
            same mutable object
                    ↓
                  write
~~~

Typical shapes:

~~~java
retryCount++;
list.add(item);
map[key] = value;
state = newState;
if (!loaded) { load(); }
balance = balance + delta;
~~~

Then ask:

~~~text
Who reads?
Who writes?
How many execution contexts can reach this state?
Is the operation compound?
What happens-before relationship exists?
Do I need mutual exclusion, visibility, atomicity, or less shared mutable state?
~~~

This is the start of Senior Android concurrency debugging.

---

# 17. Senior Android interview answer

Question:

> What is a race condition, and why is count++ unsafe across threads?

## L1

> Multiple threads can cause thread-safety problems.

Too shallow.

## L2

> A race condition occurs when correctness depends on thread timing or operation interleaving. count++ is a read-modify-write compound operation even though it is one source statement. Two threads can read the same old value and then overwrite each other's update, causing a lost update.

## L3

> I also distinguish a race condition from a JMM data race. A data race means conflicting accesses to the same variable by different threads are not ordered by happens-before, with at least one write. Eliminating data races is essential, but a higher-level group of individually safe operations can still have an atomicity race. So I first identify shared mutable state, conflicting accesses, and the invariant that must hold, then choose synchronization, atomics, concurrent structures, or a design that avoids sharing mutable state.

Possible follow-ups:

~~~text
Why does volatile int count not make count++ safe?
What is the difference between a race condition and a data race?
Do two read-only accesses form a data race?
Can two thread-safe ConcurrentHashMap calls still form a race?
Why can Thread.sleep not replace synchronization?
Does an Executor make code thread-safe?
How would you investigate a rare race in Android?
~~~

---

# 18. 30-second English answer

> A race condition happens when program correctness depends on the timing or interleaving of concurrent operations. A typical example is count++. It looks like one statement, but logically it is a read-modify-write sequence. Two threads can read the same old value and overwrite each other's update. I first identify the shared mutable state and the required atomicity or happens-before relationship, then choose the synchronization mechanism instead of adding locks blindly.

Key vocabulary:

| Term | Meaning |
|---|---|
| shared state | data visible to multiple execution contexts |
| mutable state | state that can change |
| race condition | correctness depends on timing/interleaving |
| data race | conflicting accesses not ordered by happens-before |
| lost update | one write overwrites another logical update |
| atomicity | operation behaves as one indivisible unit |
| interleaving | operations from threads mix in time |
| conflicting access | same variable, at least one write |
| critical section | region that must preserve a concurrency invariant |
| synchronization | mechanisms that establish required ordering/visibility |

---

# 19. First closed-book questions

- [ ] Why is "many threads" not enough to define a concurrency bug?
- [ ] What is shared state?
- [ ] Why is count++ not automatically atomic?
- [ ] What is a lost update?
- [ ] What is a race condition?
- [ ] What are the core conditions of a JMM data race?
- [ ] Why are race condition and data race not identical terms?
- [ ] Why does volatile not automatically fix count++?
- [ ] Why is Thread.sleep not synchronization?
- [ ] What is a critical section?
- [ ] Why does a thread pool not imply thread safety?
- [ ] What Android code shapes should make you inspect shared-state access?

---

# 20. Current mastery state

~~~text
Target: L3
Current: L0 / not studied yet
Status: learning
~~~

L3 acceptance criterion:

> Without reading the note, explain lost update using count++, distinguish race condition from JMM data race, reject the volatile count++ misconception, and identify the shared state, conflicting accesses, and critical section in an Android concurrency example.

---

# 21. Not now

Do not dive into these yet:

- monitor object-header implementation
- Mark Word
- historical biased locking details
- CPU-level CAS instructions
- ABA
- AQS
- ReentrantLock queue internals
- VarHandle fences
- false sharing
- cache-coherence protocols
- ForkJoinPool
- virtual-thread scheduler internals

None of these is required to understand why shared state can become incorrect.

---

# 22. Primary sources

> Verified: 2026-10-08  
> This note uses Java SE 27.

1. **The Java Language Specification, Java SE 27, Chapter 17: Threads and Locks**  
   https://docs.oracle.com/javase/specs/jls/se27/html/jls-17.html

2. **JLS §17.4.1 Shared Variables**  
   https://docs.oracle.com/javase/specs/jls/se27/html/jls-17.html#jls-17.4.1

3. **JLS §17.4.5 Happens-before Order**  
   https://docs.oracle.com/javase/specs/jls/se27/html/jls-17.html#jls-17.4.5

4. **JLS §17.3 Sleep and Yield**  
   https://docs.oracle.com/javase/specs/jls/se27/html/jls-17.html#jls-17.3

---

# 23. After finishing this note

Tell ChatGPT:

~~~text
I finished "Java Concurrency Foundations: Why Shared State Breaks Under Multiple Threads".
~~~

Validation still follows the same rule:

~~~text
one question at a time
check wrong mental models first
stop when the core connections are stable
do not grind for an L3 label
~~~

If this model is stable, continue with:

~~~text
[[synchronized: what exactly does it lock?]]
~~~

If any concept becomes a real understanding bottleneck, split it into a child atomic note and link it back here instead of expanding the whole concurrency syllabus at once.
