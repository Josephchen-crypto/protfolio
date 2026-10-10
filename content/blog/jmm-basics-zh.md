---
title: "Java 内存模型 JMM 基础：可见性、顺序性与 happens-before"
date: "2026-10-05"
summary: "从两个线程读写共享状态出发，理解 JMM 为什么存在、可见性与重排序问题、happens-before 的作用，以及 volatile 与 synchronized 分别解决什么。"
lang: "zh"
category: "Android"
paired: "jmm-basics"
cover: "https://raw.githubusercontent.com/Josephchen-crypto/protfolio/main/public/blog-covers/jmm-07.svg"
---

学完 GC 之后，下一步进入 **Java Memory Model，Java 内存模型，简称 JMM**。

这篇只解决 4 个问题：

1. 为什么单线程代码到了多线程环境里会变得“奇怪”？
2. 什么叫可见性、顺序性与原子性？
3. happens-before 到底是干什么的？
4. volatile 和 synchronized 分别解决什么问题？

> **先记住一句话：JMM 不是 JVM 内存区域图，而是一组规则，用来规定多线程程序里，一个线程的写入在什么条件下必须被另一个线程看见。**

![JMM 基础总览](/blog-diagrams/jmm-basics-overview.svg)

## 1. 先从一个最小问题开始

~~~java
class Demo {
    boolean ready = false;
    int number = 0;
}
~~~

线程 A：

~~~java
number = 42;
ready = true;
~~~

线程 B：

~~~java
if (ready) {
    System.out.println(number);
}
~~~

单线程直觉会觉得：

~~~text
number = 42
↓
ready = true
↓
另一个线程看到 ready == true
↓
那 number 肯定已经是 42
~~~

但没有正确同步时，多线程程序不能只靠这种“源码顺序直觉”推理。

JMM 就是在回答：

> 线程 B 的这次读取，到底允许看到线程 A 的哪一次写入？

## 2. JMM 主要解决哪三类问题

### 2.1 可见性 Visibility

线程 A 修改：

~~~java
ready = true;
~~~

线程 B 是否一定能及时看到？

如果没有正确的同步关系，不能简单假设“一定”。

人话：

> **我改了，你什么时候必须看得到？**

### 2.2 顺序性 Ordering

源码写的是：

~~~java
number = 42;
ready = true;
~~~

但编译器、JIT、CPU 为了优化，可以在不破坏 Java 内存模型允许行为的前提下进行某些重排序。

人话：

> **我源码里这样写，不代表另一个线程一定按这个顺序观察。**

### 2.3 原子性 Atomicity

例如：

~~~java
count++;
~~~

看起来是一行，但概念上包含：

~~~text
读取 count
↓
加 1
↓
写回 count
~~~

多个线程同时执行时，这组操作不天然是一个不可分割整体。

人话：

> **一行代码，不一定是一口气完成的一个动作。**

## 3. JMM 不等于 JVM Runtime Data Areas

前面学过：

~~~text
Heap
JVM Stack
Method Area
Run-Time Constant Pool
...
~~~

那是：

> JVM 运行时数据区

JMM 讨论的是：

> 多线程程序对共享变量的读写，哪些结果是合法的。

可以这样分：

~~~text
JVM Runtime Data Areas
→ 数据“放在哪里”

JMM
→ 多线程“怎么看这些共享数据”
~~~

## 4. 哪些变量是真正的共享状态

JLS 把实例字段、static 字段、数组元素视为可以在线程间共享的变量；局部变量和方法参数本身不在线程间共享。

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

真正容易发生并发问题的是：

> **多个线程访问同一份共享状态。**

## 5. happens-before 是什么

这是 JMM 最核心的词之一。

先不要背正式定义。

先用人话：

> **如果操作 A happens-before 操作 B，那么 JMM 给了 B 足够的可见性与顺序保证，让 B 可以正确观察 A 的结果。**

可以把它理解成一张“同步凭证”：

~~~text
Thread A
写共享数据
    │
    │ happens-before
    ▼
Thread B
读取共享数据
~~~

它不是“真实时间上先发生”的简单同义词，而是 Java 并发语义中的保证关系。

## 6. 当前只先记 4 类 happens-before

### 6.1 同一线程中的程序顺序

在同一个线程内部，前面的操作 happens-before 后面的操作。

### 6.2 synchronized 的 unlock → 后续 lock

同一个 monitor 上：

~~~text
Thread A
unlock
  ↓ happens-before
Thread B
lock
~~~

所以 synchronized 不只是“互斥锁”，它还建立内存可见性关系。

### 6.3 volatile write → 后续 volatile read

对同一个 volatile 变量：

~~~text
Thread A
write volatile ready = true
  ↓ happens-before
Thread B
read volatile ready
~~~

volatile 最典型的作用，就是建立线程之间的可见性与顺序保证。

### 6.4 Thread.start() / join()

先建立直觉：

~~~text
父线程 start 子线程
→ start 之前的操作，对子线程可见

子线程结束
→ join 返回后，可以安全看到子线程完成前的结果
~~~

以后进入 Java 并发时再展开。

## 7. volatile 到底解决什么

把前面的例子改成：

~~~java
class Demo {
    volatile boolean ready = false;
    int number = 0;
}
~~~

线程 A：

~~~java
number = 42;
ready = true;
~~~

线程 B：

~~~java
if (ready) {
    System.out.println(number);
}
~~~

关键关系：

~~~text
number = 42
↓
volatile write: ready = true
↓ happens-before
volatile read: ready == true
↓
后续读取 number
~~~

但一定记住：

> **volatile 不等于所有并发问题都解决。**

例如：

~~~java
volatile int count = 0;

count++;
~~~

count++ 依然是复合操作。

所以：

~~~text
volatile
→ 可见性 + 顺序约束
→ 不自动保证复合操作原子性
~~~

## 8. synchronized 又解决什么

~~~java
synchronized (lock) {
    count++;
}
~~~

它至少带来两个重要能力：

~~~text
1. Mutual Exclusion
   同一时刻只有一个线程进入临界区

2. Visibility / Ordering
   unlock 与后续 lock 建立 happens-before
~~~

所以 synchronized 不只是“一把锁”。

从 JMM 视角看，它也是一种线程之间建立安全可见性关系的工具。

## 9. Android 开发里为什么必须懂 JMM

Android 里会反复碰到：

~~~text
Main Thread
Worker Thread
Thread Pool
HandlerThread
Binder Thread
Coroutine Dispatcher
网络回调
数据库回调
~~~

如果多个执行线程共同读写一份状态：

~~~java
boolean loading;
User currentUser;
List<Item> cache;
~~~

你应该开始问：

~~~text
谁写？
谁读？
有没有同步关系？
读线程凭什么一定能看到最新结果？
复合操作是否可能被并发打断？
~~~

这就是 JMM 开始和真实 Android 工程接轨的地方。

## 10. 不要把 JMM 简化成“CPU 缓存”

很多文章会画：

~~~text
主内存
↓
工作内存
↓
CPU Cache
~~~

这种图可以帮助建立直觉，但不能当成 JMM 的正式定义。

更准确的层次是：

~~~text
JMM
→ Java 语言层面的并发语义规则

JIT / Compiler
→ 可以做合法优化

CPU / Hardware
→ 有自己的内存模型和执行机制
~~~

JMM 的职责是：

> 不管底层怎么优化，Java 程序最终必须落在 JMM 允许的行为范围内。

## 11. 现在只需要记住什么

先记住这 7 句话：

1. JMM 不是 JVM 内存区域。
2. JMM 管的是多线程访问共享状态时哪些行为是合法的。
3. 并发问题最基础的三个词是可见性、顺序性、原子性。
4. happens-before 是线程之间建立可见性与顺序保证的核心关系。
5. volatile 主要提供可见性和顺序保证。
6. volatile 不能让 count++ 自动变成原子操作。
7. synchronized 既提供互斥，也建立 happens-before 关系。

## 12. 当前暂时不用深入什么

现在先不要钻：

- formal execution tuple
- synchronizes-with 完整规则
- sequential consistency 证明
- causality requirements
- out-of-thin-air values
- CPU cache coherence protocol
- Store Buffer
- Memory Barrier / Fence 指令细节
- VarHandle
- Unsafe
- final field semantics 深层规则
- jcstress 测试模型

这些等进入 Java 并发时再逐步接上。

## 官方 / 一手资料

- [Java Language Specification SE 26 · Chapter 17 Threads and Locks](https://docs.oracle.com/javase/specs/jls/se26/html/jls-17.html)
- [Java Language Specification SE 26 · §17.4 Memory Model](https://docs.oracle.com/javase/specs/jls/se26/html/jls-17.html#jls-17.4)
- [Java Language Specification SE 26 · §17.4.5 Happens-before Order](https://docs.oracle.com/javase/specs/jls/se26/html/jls-17.html#jls-17.4.5)

## 推荐视频

- [Java Memory Model Pragmatics · Aleksey Shipilev](https://www.youtube.com/watch?v=TxqsKzxyySo)

这段比较硬，不要求现在完整看懂。当前只把它当成以后深入 JMM 时的主参考视频即可。
