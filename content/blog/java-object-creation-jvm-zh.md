---
title: "new User() 背后发生了什么：从对象创建理解 JVM"
date: "2026-09-21"
summary: "沿着一条 new 指令拆开类初始化、对象分配、默认值、实例初始化与 reference 保存，让“对象在堆上”从一句口号变成可验证的执行过程。"
lang: "zh"
category: "Android"
paired: "java-object-creation-jvm"
cover: "https://raw.githubusercontent.com/Josephchen-crypto/protfolio/main/public/blog-covers/jvm-object-03.svg"
---

new User() 可能是 Java 里最普通的一行代码之一。

但如果继续追问 JVM 怎么知道要创建哪个类、对象和变量是不是同一个东西、构造方法是不是负责申请内存，这行代码就会变成一个很好的 JVM 入口。

## 从一行代码开始

~~~java
User user = new User();
~~~

我现在会把它拆成四个动作：

~~~mermaid
flowchart LR
    A["确定目标类"] --> B["创建对象实例"]
    B --> C["执行实例初始化"]
    C --> D["得到 reference"]
    D --> E["reference 保存到局部变量 user"]
~~~

这比一句“对象创建在堆上”更有用，因为它把对象、初始化过程和引用分开了。

## 第一步：JVM 先要知道 User 是谁

字节码里的 new 指令不会把完整类定义塞在指令本身。

它会通过 ClassFile 的 constant pool 引用目标类。概念上可以理解成：

~~~text
new #N
~~~

这里的 #N 指向常量池里与目标类相关的符号信息。

创建实例也是类的主动使用场景之一，因此对象创建和类加载、链接、初始化并不是互相独立的知识点，而是连在一起的。

## 第二步：对象实例获得自己的存储空间

JVM 规范把类实例和数组的存储放在 Heap 中。

所以 new User() 得到的是一个新的 User 实例。

但这里要特别区分：

~~~text
对象 != 对象引用
~~~

对象实例在 Heap 中，而方法里的局部变量 user 保存的是一个 reference。

~~~mermaid
flowchart LR
    A["当前 Frame"] --> B["Local Variables"]
    B --> C["user reference"]
    C --> D["Heap 中的 User 实例"]
~~~

这也是为什么：

~~~java
User a = new User();
User b = a;
~~~

并没有创建两个 User 对象。这里只创建了一个实例，只是有两个 reference 指向它。

## 第三步：字段先有默认值

对象刚获得存储后，实例字段会先进入对应类型的默认值状态。

~~~java
class User {
    int age;
    boolean active;
    Object token;
}
~~~

可以先理解为：

~~~text
age    -> 0
active -> false
token  -> null
~~~

然后才进入后续实例初始化逻辑。

这说明构造逻辑不是从一块完全随机的内存开始工作的。Java 语言和 JVM 已经定义了实例初始化需要遵循的默认初始化语义。

## 第四步：new 和 <init> 不是同一件事

源码里我们写：

~~~java
new User()
~~~

但在字节码里通常会看到类似：

~~~text
new
dup
invokespecial User.<init>
astore
~~~

最关键的区分是：

- new 负责创建实例
- <init> 是 JVM 层面的实例初始化方法
- astore 可以把最终 reference 保存到局部变量槽位

~~~mermaid
flowchart LR
    N["new<br/>创建实例"] --> D["dup<br/>复制栈顶 reference"]
    D --> I["invokespecial <init><br/>执行实例初始化"]
    I --> S["astore<br/>保存 reference"]
~~~

日常交流里说“构造方法创建对象”大家都听得懂，但底层上并不精确。

更准确的说法是：new 创建实例，<init> 执行实例初始化逻辑。

## 为什么会有 dup

这正好能和前面学过的 Operand Stack 连起来。

new 执行后，reference 会出现在操作数栈上。

调用 <init> 需要使用一个 reference，但初始化之后我们还要保留 reference，继续执行 astore。

所以概念上：

~~~text
new
↓
栈顶有 reference
↓
dup
↓
复制一份
↓
一份用于 <init>
另一份留给 astore
~~~

这就是为什么对象创建知识能把 Frame、Local Variables、Operand Stack 和 ClassFile 串起来。

## JVM 规范没有统一规定对象物理布局

这里还需要划一道边界。

JVM 规范定义对象的语义，但并不要求所有 JVM 实现使用完全相同的物理布局。

例如很多 HotSpot 资料会讲 Object Header、Mark Word、Klass Pointer、对齐和 TLAB。这些非常有价值，但更多属于具体 JVM 实现层面的知识。

学习时最好分成两层：

~~~text
JVM Specification
→ 定义必须满足的虚拟机语义

HotSpot / 其他实现
→ 决定具体对象布局和分配优化
~~~

这样就不会把某个 HotSpot 实现细节误记成整个 JVM 的硬规则。

## 和 Android 有什么关系

Android ART 使用 DEX bytecode，指令体系和普通 JVM bytecode 不一样。

但对象创建的核心概念仍然会继续出现：

- 对象和 reference 的区别
- 局部变量和堆对象的关系
- 类初始化和实例初始化的区别
- 对象分配为什么会影响 GC
- 临时对象为什么可能影响性能

后面学习 Android 内存优化、Compose 中的对象分配、Bitmap 内存和 GC 抖动时，这些基础会重新出现。

## 用 javap 验证

可以写一个最小例子：

~~~java
public class ObjectDemo {
    static class User {}

    public static void main(String[] args) {
        User user = new User();
    }
}
~~~

执行：

~~~bash
javac ObjectDemo.java
javap -c ObjectDemo
~~~

重点去找：

~~~text
new
dup
invokespecial
astore
~~~

目标不是背指令，而是把“创建实例 → 初始化 → 保存 reference”与真实字节码对应起来。

## 参考资料

- [Java Virtual Machine Specification: new](https://docs.oracle.com/en/java/javase/27/docs/specs/jvms/jvms-6.html#jvms-6.5.new)
- [Java Virtual Machine Specification: Initialization](https://docs.oracle.com/en/java/javase/27/docs/specs/jvms/jvms-5.html#jvms-5.5)
- [Java Virtual Machine Specification: Instance Initialization Methods](https://docs.oracle.com/en/java/javase/27/docs/specs/jvms/jvms-2.html#jvms-2.9.1)
