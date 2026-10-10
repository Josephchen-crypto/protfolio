---
title: "GC 与 JVM 内存管理基础：从 GC Roots 到 Android 内存泄漏"
date: "2026-10-05"
summary: "从 Heap、GC Roots 与可达性分析出发，理解对象何时成为回收候选、为什么设为 null 不等于释放内存，以及 HotSpot GC 与 Android ART GC 的边界。"
lang: "zh"
category: "Android"
paired: "jvm-gc-memory"
cover: "https://raw.githubusercontent.com/Josephchen-crypto/protfolio/main/public/blog-covers/jvm-gc-06.svg"
---

学 JVM 内存管理时，最容易绕进去的地方，不是某一种垃圾回收算法，而是一个更基础的问题：

> JVM 到底怎么知道一个对象“已经没用了”？

这篇先不钻 Mark-Sweep、Eden、Survivor、Card Table 或 G1 Region。

只建立一条最重要的心智模型：

~~~mermaid
flowchart TD
    A["对象创建"] --> B["进入 Heap"]
    B --> C["程序不断建立 / 修改 reference"]
    C --> D["GC 从 GC Roots 出发检查对象图"]
    D --> E{"还能从 Root 到达？"}
    E -->|YES| F["对象仍然存活"]
    E -->|NO| G["成为可回收候选"]
~~~

![GC 与 JVM 内存管理总览](/blog-diagrams/gc-jvm-memory-overview.svg)

## 1. 为什么 JVM 需要 GC

前面我们已经学过：

~~~java
User user = new User();
~~~

逻辑上可以先理解成：

~~~text
Local Variables
└── user reference
        ↓
Heap
└── User object
~~~

程序运行越久，Heap 中创建的对象越多。

如果对象已经没有业务意义，却一直占着 Heap 空间，应用最终会耗尽可用内存。

Java 没有要求普通开发者像 C/C++ 那样手动释放每个对象，而是通过 **Garbage Collection，垃圾回收，简称 GC** 自动管理 Heap 中的存储空间。

这里先把三个层级分开：

~~~text
JVM Specification
→ 定义自动内存管理的语义边界

HotSpot
→ 具体实现 G1、ZGC 等收集器

Android ART
→ 有自己独立的 GC 实现
~~~

## 2. 某个变量不再引用对象，不等于对象可以回收

~~~java
User a = new User();
User b = a;

a = null;
~~~

执行后：

~~~text
a → null

b ─────→ User object
~~~

虽然 a 已经不再引用这个 User，但 b 仍然引用它。

所以：

> **某一个变量不再引用对象，不等于对象已经可以回收。**

GC 真正关心的是：

> **这个对象是否仍然可以从 JVM 认为的一组起始点访问到。**

这就是 **Reachability Analysis，可达性分析**。

## 3. 什么是 GC Roots

先不要背完整列表。

用人话说：

> **GC Roots 就是 GC 检查对象世界时的一组起点。**

可以把它想成一场从“根节点”开始的图遍历：

~~~mermaid
flowchart LR
    R["GC Root"] --> A["Object A"]
    A --> B["Object B"]
    C["Object C"]
~~~

从 Root 能走到 A，也能经过 A 走到 B。

所以：

~~~text
A → Reachable
B → Reachable
C → Unreachable
~~~

C 就进入“可以被 GC 回收”的候选集合。

注意，这里是：

> **可以回收**

不是：

> **马上删除**

当前阶段只需要先知道，常见 Root 可以来自：

- 正在运行线程中的某些 reference
- 某些 static 字段持有的 reference
- JNI / Native 侧持有的 reference
- JVM 自己运行所需要的一些 reference

## 4. “出了作用域”为什么不等于“立刻 GC”

~~~java
void test() {
    User user = new User();
}
~~~

方法结束以后，user 所在的 Frame 退出 JVM Stack。

这意味着这一条活动 reference 消失了。

如果 User 对象也没有其他有效引用链，它就可能变得不可达。

但是：

> **不可达 ≠ JVM 立刻执行一次 GC ≠ 这一行代码后内存立即释放。**

什么时候触发 GC、具体采用什么策略、什么时候真正重新利用这块空间，属于 JVM 实现负责的事情。

## 5. 为什么 `user = null` 不等于“释放对象”

把变量设成 null，只是断开这一条 reference。

~~~text
user = null
↓
只断开一条 reference
↓
对象是否还能通过其他路径到达？
↓
如果完全不可达
↓
成为 GC 可回收候选
~~~

所以：

~~~text
reference 断开
≠
object 立即销毁
~~~

## 6. Java 有 GC，为什么还会内存泄漏

例如：

~~~java
static List<User> users = new ArrayList<>();
~~~

然后不断：

~~~java
users.add(new User());
~~~

如果这个静态集合一直活着：

~~~mermaid
flowchart LR
    R["GC Root"] --> S["static users"]
    S --> L["ArrayList"]
    L --> U1["User"]
    L --> U2["User"]
    L --> U3["User"]
~~~

这些 User 从业务角度可能早就“没用了”。

但是从 GC 看：

> **它们仍然可达。**

所以 GC 不能回收。

这就是理解 Java 内存泄漏非常关键的一句话：

> **业务上没用了，不代表 GC 看来已经不可达。**

Android 中 Activity、Context、Listener、Handler、缓存集合等导致的内存泄漏，本质上经常就是：

~~~text
不该存在的 reference 链
↓
让对象仍然从 GC Roots 可达
↓
GC 无法回收
~~~

## 7. GC 为什么可能让程序“卡一下”

GC 为了安全分析和修改对象图，在某些阶段可能需要暂停应用线程。

这个术语叫：

> **Stop-The-World，STW**

先用人话理解：

~~~text
应用线程暂停一小段时间
↓
GC 完成必须保证一致性的工作
↓
应用线程继续
~~~

但不要把它理解成：

> “整个 GC 过程都会 STW。”

现代 GC 会尽可能把大量工作并发完成，只在必要阶段暂停应用线程。

对于 Android 来说，这件事会直接和：

- 掉帧
- 动画卡顿
- 高频对象分配
- 内存抖动

联系起来。

## 8. HotSpot GC 和 Android ART GC 不是一回事

在 Java SE 26 HotSpot 中，server-class machine 默认选择 **G1（Garbage-First）**。

现在只需要认识几个名字：

~~~text
G1
ZGC
Parallel GC
~~~

先不要背它们的内部算法。

Android 应用最终运行在 ART 上，不是 HotSpot。

AOSP 官方资料说明：

- Android 8 起，ART 默认 GC 方案是 **Concurrent Copying（CC）**
- Android 10 起，CC 扩展为分代 GC

因此：

~~~text
JVM GC 的基础思想
→ 可以帮助理解 Android 内存管理

HotSpot G1 / ZGC
≠
Android ART 的具体 GC 实现
~~~

这和我们之前建立的边界一致：

> HotSpot ≠ ART

## 9. 把对象从“出生”到“成为垃圾”串起来

~~~mermaid
flowchart TD
    A["new User()"] --> B["Heap 获得对象空间"]
    B --> C["reference 保存到 Local Variables / 字段"]
    C --> D["程序不断改变引用关系"]
    D --> E["某一天无法从 GC Roots 到达 User"]
    E --> F["User 成为可回收候选"]
    F --> G["某次 GC 回收 / 整理对应空间"]
    G --> H["空间未来可再次用于对象分配"]
~~~

这就是当前阶段最重要的一条对象生命周期。

## 10. 现在只需要记住什么

先记住这 6 句话：

1. Java 对象和数组逻辑上在 JVM Heap 中分配。
2. Heap 空间由自动存储管理系统 GC 管理。
3. GC 判断对象是否存活的核心心智模型是可达性。
4. GC 从 GC Roots 出发沿 reference 寻找对象。
5. 不可达只代表“可以回收”，不代表立刻被回收。
6. HotSpot GC 和 Android ART GC 是不同运行时的具体实现。

## 11. 当前暂时不用深入什么

现在先不要钻：

- Mark-Sweep
- Copying
- Mark-Compact
- Young / Old Generation 具体布局
- Eden / Survivor
- Card Table
- Remembered Set
- Write Barrier
- Safepoint
- TLAB
- G1 Region 内部机制
- ZGC Colored Pointer / Load Barrier
- ART Concurrent Copying 源码细节

如果后面这些概念真正成为理解障碍，再单独拆。

## 12. 学完后的最低目标

只要自己能看懂这条链，就可以继续下一篇：

~~~text
Object
↓
Reference Graph
↓
GC Roots
↓
Reachability
↓
Reachable = live
Unreachable = reclaim candidate
↓
GC reclaims Heap space
~~~

## 官方 / 一手资料

- [Java Virtual Machine Specification: Heap](https://docs.oracle.com/en/java/javase/26/docs/specs/jvms/jvms-2.html#jvms-2.5.3)
- [Java SE 26 HotSpot VM Garbage Collection Tuning Guide](https://docs.oracle.com/en/java/javase/26/gctuning/)
- [Android Developers: Overview of memory management](https://developer.android.com/topic/performance/memory-overview)
- [AOSP: Debug ART garbage collection](https://source.android.com/docs/core/runtime/gc-debug)

## 推荐视频

- [Garbage Collection in Java - The progress since JDK 8](https://www.youtube.com/watch?v=L68zxvl2LPY) · Java / Oracle
- [Garbage Collection in Java: The Performance Benefits of Upgrading](https://www.youtube.com/watch?v=0IuYYbXD-Hw) · Java / Oracle

这两段视频适合在已经理解“GC Roots → 可达性 → 回收候选”以后再看，用来认识现代 HotSpot GC 的演进，不需要现在记算法细节。
