---
title: "synchronized：它到底锁住了什么？"
date: "2026-10-16"
summary: "从 count++ 的竞态出发，建立 synchronized 的正确心智模型：它不是锁方法或变量，而是获取某个对象关联的 intrinsic lock / monitor；只有竞争同一把锁的代码才会互斥。"
lang: "zh"
category: "Android"
paired: "java-concurrency-synchronized"
cover: "https://raw.githubusercontent.com/Josephchen-crypto/protfolio/main/public/blog-covers/java-synchronized-09.svg"
aliases:
  - "Java synchronized"
  - "Java内置锁"
  - "Intrinsic Lock"
module: "Java_JVM"
type: "main_atomic_note"
priority: "S"
status: "learning"
prerequisites:
  - "[[Java并发基础为什么多个线程会把共享数据改乱]]"
related:
  - "[[volatile]]"
  - "[[CAS与Atomic]]"
  - "[[Lock与ReentrantLock]]"
used_by:
  - "[[Android Handler与Looper]]"
  - "[[Kotlin Coroutines]]"
visual_assets:
  - "../assets/diagrams/jvm/java-synchronized-monitor.svg"
last_reviewed: "2026-10-16"
tags:
  - "Java"
  - "JVM"
  - "Concurrency"
  - "synchronized"
  - "Monitor"
---

# synchronized：它到底锁住了什么？

> [!abstract] 这篇只解决一个问题
>
> **Java 的 synchronized 到底锁住了什么？**
>
> 先把这个问题想清楚，再去看 synchronized 方法、同步代码块、static synchronized，脑子里就不会变成三套规则。

上一篇我们已经知道：

~~~text
count++
≈ read → modify → write
~~~

两个线程可能交错执行，于是发生 Lost Update。

现在要解决的就是：

> **怎么让这组动作在需要的时候只能由一个线程完成？**

---

# 0. 先给最终答案

先记这一句：

> **synchronized 不是“锁住方法”，也不是“锁住变量”，而是让线程先获取某个对象关联的 intrinsic lock（内置锁，也常用 monitor 来描述）。**

真正决定两个线程会不会互相等待的是：

> **它们竞争的是不是同一把锁。**

~~~text
Thread A ──┐
           ├──> 同一个 lock object
Thread B ──┘
                 ↓
          同一时刻只允许
          一个线程持有锁
~~~

---

# 1. 从上一篇的 count++ 接上来

原来的代码：

~~~java
class Counter {
    int count = 0;

    void increment() {
        count++;
    }
}
~~~

两个线程可能交错：

~~~text
A read 0
B read 0
A write 1
B write 1
~~~

最后 count 可能只有 1。

现在改成：

~~~java
class Counter {
    int count = 0;

    synchronized void increment() {
        count++;
    }
}
~~~

执行过程变成：

~~~text
Thread A
↓
先拿到锁
↓
执行 count++
↓
退出 synchronized
↓
释放锁
↓
Thread B 才能拿到同一把锁
↓
执行 count++
~~~

于是上一篇的“临界区”有了第一种保护手段。

---

# 2. 第一张脑内图

![synchronized 与对象 Monitor](../assets/diagrams/jvm/java-synchronized-monitor.svg)

看图时只抓一件事：

~~~text
Thread A 和 Thread B
并不是在争 increment 方法

它们是在争：
Counter 对象关联的同一把锁
~~~

所以理解 synchronized，第一问题永远应该是：

> **锁对象是谁？**

---

# 3. synchronized 实例方法锁的是谁？

~~~java
class Counter {
    synchronized void increment() {
        count++;
    }
}
~~~

可以先近似理解成：

~~~java
class Counter {
    void increment() {
        synchronized (this) {
            count++;
        }
    }
}
~~~

也就是：

> **实例 synchronized 方法使用当前实例 this 关联的锁。**

如果调用：

~~~java
Counter counter = new Counter();
counter.increment();
~~~

那么竞争的是：

~~~text
counter 这个对象关联的 intrinsic lock
~~~

不是某个叫 increment 的“方法锁”。

---

# 4. 为什么“锁方法”这个说法会害你？

~~~java
class Counter {
    synchronized void increment() {
        count++;
    }

    synchronized void reset() {
        count = 0;
    }
}
~~~

如果两个方法都运行在同一个 Counter 实例上：

~~~text
increment() → 锁 this
reset()     → 也锁 this
~~~

所以：

~~~text
Thread A 调 increment()
Thread B 调 reset()

同一个 Counter 实例
→ 同一把锁
→ 两者互斥
~~~

虽然方法不同，但锁相同。

因此：

> **不要问“哪个方法被锁了”，要问“这段代码使用了哪个 lock object”。**

---

# 5. synchronized(lock) 又是什么？

~~~java
class Counter {
    private final Object lock = new Object();
    private int count = 0;

    void increment() {
        synchronized (lock) {
            count++;
        }
    }
}
~~~

这里线程进入同步块之前，要先获取 lock 对象关联的 intrinsic lock。

这种写法的价值是：

~~~text
锁对象更加明确
+
可以把临界区缩小
+
不会无意中把整个 this 当作同步边界
~~~

---

# 6. 最关键规则：必须是同一把锁

~~~java
private final Object lockA = new Object();
private final Object lockB = new Object();

void methodA() {
    synchronized (lockA) {
        // ...
    }
}

void methodB() {
    synchronized (lockB) {
        // ...
    }
}
~~~

因为：

~~~text
lockA != lockB
~~~

所以它们不会因为都写了 synchronized 就自动互斥。

压缩成一句：

~~~text
same monitor
→ mutual exclusion

different monitor
→ no mutual exclusion between them
~~~

---

# 7. 两个 Counter 对象会互相锁住吗？

~~~java
Counter a = new Counter();
Counter b = new Counter();

Thread A → a.increment()
Thread B → b.increment()
~~~

虽然调用的是同一个 increment 方法，但实例 synchronized 方法分别使用：

~~~text
a 的锁
b 的锁
~~~

因为 a 和 b 不是同一个对象，所以两个线程可以同时进入。

再次记住：

> **synchronized 的互斥单位不是方法名，而是锁对象。**

---

# 8. static synchronized 锁的是谁？

~~~java
class Counter {
    static synchronized void resetAll() {
        // ...
    }
}
~~~

它没有 this。

所以使用的是：

~~~java
Counter.class
~~~

可以先近似理解成：

~~~java
static void resetAll() {
    synchronized (Counter.class) {
        // ...
    }
}
~~~

三种写法压成一张表：

| 写法 | 使用的锁 |
|---|---|
| synchronized 实例方法 | 当前实例 this |
| synchronized(lock) | 指定的 lock 对象 |
| static synchronized 方法 | 对应的 Class 对象 |

---

# 9. “锁住对象”不代表对象真的不能被别人碰

~~~java
class Counter {
    int count = 0;

    synchronized void increment() {
        count++;
    }

    void unsafeReset() {
        count = 0;
    }
}
~~~

即使 Thread A 已经进入 increment()，Thread B 仍然可以执行没有获取同一把锁的 unsafeReset()。

所以错误画面是：

~~~text
对象被锁住
→ 所有人都不能访问它
~~~

正确画面：

> **只有同样尝试获取这把锁的代码，才会被这把锁协调。**

synchronized 是一种线程之间共同遵守的同步协议。

---

# 10. synchronized 第一项能力：互斥

专业术语：

> **Mutual Exclusion，互斥**

简单说：

~~~text
同一把锁
+
同一时刻
=
最多一个线程持有
~~~

因此：

~~~java
synchronized (lock) {
    count++;
}
~~~

可以让 read → modify → write 这组动作在临界区中完成，而其他竞争同一把锁的线程不能插进来。

这就是它修复 Lost Update 的最直观原因。

---

# 11. synchronized 第二项能力：可见性与 happens-before

如果只把 synchronized 理解成“排队”，就少了一半。

JMM 规定：

> 对同一个 monitor 的一次 unlock，happens-before 后续对这个 monitor 的 lock。

先用人话：

~~~text
Thread A
在 synchronized 中修改数据
↓
退出 synchronized
↓
释放同一把锁

Thread B
之后获取同一把锁
↓
JMM 提供必要的可见性与顺序保证
↓
B 可以正确观察 A 在释放锁前的写入
~~~

所以 synchronized 同时提供：

~~~text
1. Mutual Exclusion
   → 不让竞争线程同时进入临界区

2. Visibility / Ordering
   → 建立 happens-before
~~~

---

# 12. 最小可见性例子

~~~java
class State {
    private final Object lock = new Object();
    private int value = 0;

    void write() {
        synchronized (lock) {
            value = 42;
        }
    }

    int read() {
        synchronized (lock) {
            return value;
        }
    }
}
~~~

如果 Thread A 完成 write() 并释放 lock，Thread B 随后获取同一个 lock 进入 read()，那么这组同步动作之间建立 happens-before 关系。

关键还是：

> **同一个 lock。**

---

# 13. synchronized 是可重入的

Java intrinsic lock 是：

> **Reentrant，可重入**

例如：

~~~java
class Demo {
    synchronized void outer() {
        inner();
    }

    synchronized void inner() {
        // ...
    }
}
~~~

过程：

~~~text
当前线程获取 demo 的锁
↓
进入 outer()
↓
outer() 调 inner()
↓
inner() 也需要 demo 的同一把锁
↓
当前线程已经持有
↓
允许继续进入
~~~

不会因为再次获取自己已经持有的锁，就把自己卡死。

当前只需要知道这个性质，不需要钻 JVM 内部实现。

---

# 14. 为什么同步代码块经常比整个方法更合适？

~~~java
synchronized void load() {
    prepareRequest();
    callNetwork();
    updateCache();
}
~~~

这会让整个方法期间都持有锁。

如果真正需要保护的只有共享缓存更新：

~~~java
void load() {
    prepareRequest();
    callNetwork();

    synchronized (cacheLock) {
        updateCache();
    }
}
~~~

直觉：

~~~text
锁持有时间越长
↓
其他线程等待时间可能越长
↓
并发能力越差
~~~

所以目标不是：

> synchronized 越多越安全。

而是：

> **只保护真正需要保持一致性的共享状态和临界区。**

---

# 15. Android 场景：多个后台任务更新共享缓存

~~~java
class UserCache {
    private final Object lock = new Object();
    private final Map<String, User> users = new HashMap<>();

    void put(User user) {
        synchronized (lock) {
            users.put(user.id, user);
        }
    }

    User get(String id) {
        synchronized (lock) {
            return users.get(id);
        }
    }
}
~~~

以后看到：

~~~text
Executor
Binder Thread
HandlerThread
Coroutine Dispatcher
network callback
database callback
~~~

不要只问“是不是后台线程”。

继续问：

~~~text
它们有没有访问同一个 mutable state？
谁负责保护这个 state？
所有入口是不是使用同一把锁？
~~~

---

# 16. 五个最容易踩的坑

## 误区 1：synchronized 锁住方法

错误。它获取的是某个对象关联的锁。

## 误区 2：只要都写 synchronized 就一定互斥

错误。必须确认使用的是不是同一个 lock object。

## 误区 3：一个线程拿到锁，其他线程就不能访问这个对象

错误。没有尝试获取这把锁的代码仍然可以运行。

## 误区 4：不同实例的 synchronized 实例方法会互斥

不一定。

~~~text
instance A → Lock A
instance B → Lock B
~~~

## 误区 5：锁得越大越安全

锁范围太大可能带来更多等待、更多锁竞争和更差的并发能力。

正确方向是保护：

> **最小但完整的并发不变量。**

---

# 17. 一个实用检查模板

以后看到 synchronized，按顺序问：

~~~text
1. Shared state 是什么？
2. 哪几段代码会读 / 写它？
3. Lock object 到底是谁？
4. 所有竞争入口使用的是同一把锁吗？
5. 临界区有没有包得太大或太小？
~~~

能回答这五个问题，大多数 synchronized 工程代码就已经能读懂了。

---

# 18. 最小练习

上一篇的 Counter：

~~~java
class Counter {
    int count = 0;

    void increment() {
        count++;
    }
}
~~~

改成两个版本。

Version A：使用 synchronized 实例方法。

Version B：使用独立 lock object：

~~~java
private final Object lock = new Object();
~~~

然后继续让两个线程各执行 100000 次 increment()。

最终验证：

~~~text
expected = 200000
actual   = 200000
~~~

真正要观察的不是数字，而是能明确说出：

~~~text
两个线程为什么现在不能同时进入临界区？
它们竞争的是哪个对象的锁？
~~~

---

# 19. 当前阶段不要深入

先不要钻：

- Object Header
- Mark Word
- monitorenter / monitorexit 实现细节
- HotSpot ObjectMonitor 源码
- 锁膨胀历史
- biased locking 历史
- lightweight locking 内部实现
- OS mutex / futex
- 自旋策略
- JVM 锁优化

这些回答的是：

~~~text
锁是怎么实现的？
~~~

这一篇只解决更靠前的问题：

> **synchronized 在 Java 语义上到底在协调谁。**

---

# 20. 官方 / 一手资料

> 核验日期：2026-10-16  
> 使用 Java SE 27 规范。

1. **The Java Language Specification, Java SE 27 · §17.1 Synchronization**  
   https://docs.oracle.com/javase/specs/jls/se27/html/jls-17.html#jls-17.1

2. **JLS §14.19 The synchronized Statement**  
   https://docs.oracle.com/javase/specs/jls/se27/html/jls-14.html#jls-14.19

3. **JLS §8.4.3.6 synchronized Methods**  
   https://docs.oracle.com/javase/specs/jls/se27/html/jls-8.html#jls-8.4.3.6

4. **JLS §17.4.5 Happens-before Order**  
   https://docs.oracle.com/javase/specs/jls/se27/html/jls-17.html#jls-17.4.5

---

# 21. 学完之后

下一篇进入：

~~~text
[[volatile：它到底保证了什么]]
~~~

只解决一个问题：

> **为什么 synchronized 能让 count++ 安全，而 volatile int count 却仍然不行？**
