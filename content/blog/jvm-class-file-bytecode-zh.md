---
title: "Class 文件到底是什么：从 Java 源码走到 JVM 字节码"
date: "2026-09-21"
summary: "用一个 add() 方法和 javap 实验拆开 ClassFile、constant_pool、Code 属性、Local Variables 与 Operand Stack，建立源码、字节码和机器码的三层边界。"
lang: "zh"
category: "Android"
paired: "jvm-class-file-bytecode"
cover: ""
---

写 Java 很多年以后，我才真正认真看过一次 .class。

以前我的理解大概是：

> Java 编译之后会生成 class，然后 JVM 就运行它。

这句话没错，但信息量太少。

真正理解 ClassFile 之后，很多 JVM 概念才开始连起来：常量池、栈帧、操作数栈、类加载、字节码，以及 Android 里的 D8 和 DEX。

## .class 不是“编译后的 Java 文本”

先建立最重要的三层边界：

| 层 | 示例 | 主要面向谁 |
|---|---|---|
| Java 源码 | return a + b; | 开发者 / javac |
| JVM bytecode | iload_1、iadd | JVM |
| CPU machine code | ARM / x86 指令 | CPU |

~~~mermaid
flowchart LR
    A["Java source"] --> B["javac"]
    B --> C["ClassFile"]
    C --> D["JVM bytecode 执行 / 编译"]
    D --> E["Machine code"]
    E --> F["CPU"]
~~~

.class 既不是源码，也不是 CPU 可以直接执行的机器码。

它是一种由 JVM Specification 定义的结构化二进制格式。

## ClassFile 里面不只有 bytecode

JVM 规范定义的 ClassFile 结构里包含很多信息。

不需要一上来背 u1/u2/u4 或每一个字段，只需要先认识这些核心区域：

~~~mermaid
flowchart TB
    C["ClassFile"]
    C --> V["版本信息"]
    C --> CP["constant_pool"]
    C --> F["fields"]
    C --> M["methods"]
    C --> A["attributes"]
    M --> Code["Code attribute<br/>方法字节码通常在这里"]
~~~

也就是说，一个 ClassFile 不只告诉 JVM“这个方法要执行哪些指令”。

它还需要描述：

- 这个类是谁
- 父类是谁
- 实现哪些接口
- 有哪些字段
- 有哪些方法
- 用到了哪些符号
- 方法代码和其他属性是什么

## constant_pool 像一份“编号通讯录”

我觉得 constant pool 最容易理解的方式，是把它看成 ClassFile 自带的编号通讯录。

如果每条字节码都重复保存完整类名、方法名和类型信息，会非常浪费。

ClassFile 可以把符号信息集中放进 constant pool，其他结构只保存索引引用。

概念上：

~~~text
constant_pool
#1 User
#2 User.<init>
#3 System.out
#4 println

bytecode
new #1
invokespecial #2
...
~~~

现在并不需要背每种 cp_info。

更重要的是知道：很多字节码指令通过常量池索引找到类、字段、方法等符号信息。

## ClassFile constant_pool 和运行时常量池不是一回事

这是一个特别容易混淆的点。

~~~mermaid
flowchart LR
    A["ClassFile constant_pool<br/>文件里的静态结构"] --> B["类加载"]
    B --> C["Run-Time Constant Pool<br/>JVM 运行时表示"]
~~~

两者有关联，但不能直接画等号。

ClassFile constant_pool 属于 class 文件格式，Run-Time Constant Pool 属于 JVM 的运行时结构。

这个区分也把“Class 文件”和“JVM 运行时数据区”两块知识连起来了。

## 一个 add() 方法如何变成 bytecode

源码：

~~~java
public int add(int a, int b) {
    return a + b;
}
~~~

对应的字节码通常会出现：

~~~text
iload_1
iload_2
iadd
ireturn
~~~

可以把它读成：

~~~mermaid
flowchart LR
    A["Local Variables<br/>读取 a"] --> B["Operand Stack"]
    C["Local Variables<br/>读取 b"] --> B
    B --> D["iadd"]
    D --> E["结果回到 Operand Stack"]
    E --> F["ireturn"]
~~~

这时候，之前学过的 Frame 就不再是一个抽象框。

字节码真的在使用 Frame 里的 Local Variables 和 Operand Stack。

## Code 属性在哪里

普通 Java 方法真正的 JVM 指令，通常保存在方法的 Code attribute 中。

可以粗略理解为：

~~~text
ClassFile
└── methods
    └── method_info
        └── attributes
            └── Code
                └── JVM bytecode
~~~

这也是为什么使用 javap -v 时会看到 Constant pool、methods、Code、LineNumberTable、descriptor 和 flags 等信息。

这些内容不是 javap 随便打印出来的，而是在观察 class 文件中的真实结构。

## 用 javap 做一个最小实验

创建：

~~~java
public class BytecodeDemo {

    public int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        BytecodeDemo demo = new BytecodeDemo();
        int result = demo.add(10, 20);
        System.out.println(result);
    }
}
~~~

执行：

~~~bash
javac BytecodeDemo.java
javap -c BytecodeDemo
~~~

第一次只找：

~~~text
new
dup
invokespecial
astore
iload
iadd
ireturn
~~~

然后：

~~~bash
javap -v BytecodeDemo
~~~

只找：

~~~text
major version
Constant pool
Code
~~~

这个实验的目标不是开始背字节码表。

真正目标是验证：我写的一行 Java，编译后确实进入了一个结构化 ClassFile，并变成 JVM 指令。

## 这和 Android 构建有什么关系

Android 最终运行的是 DEX，不是普通 JVM ClassFile。

但 Android 的 Java/Kotlin 编译链前半段仍然和 ClassFile 紧密相关。

~~~mermaid
flowchart LR
    A["Java / Kotlin"] --> B[".class"]
    B --> C["D8 / R8"]
    C --> D[".dex"]
    D --> E["ART"]
~~~

Google 官方 D8 文档明确说明，D8 接收 Java bytecode，并生成 DEX bytecode。

所以理解 .class 有几个直接价值：

- 看懂 Java/Kotlin 编译结果
- 理解 D8/R8 的输入是什么
- 为字节码插桩打基础
- 理解一些编译期框架
- 区分 JVM bytecode 与 DEX bytecode
- 面试时能从源码继续往下一层解释

## 当前我不会去背什么

建立基础地图之后，我暂时不会死磕：

- constant pool 每一种 tag
- 手工解析十六进制 class
- StackMapTable
- verification_type_info
- invokedynamic 的完整机制
- JVM 验证器算法

高级工程师并不等于把 JVM Specification 从第一页背到最后一页。

更重要的是知道一个问题发生在哪一层，以及要用什么工具继续向下验证。

## 参考资料

- [Java Virtual Machine Specification: The class File Format](https://docs.oracle.com/en/java/javase/27/docs/specs/jvms/jvms-4.html)
- [Java Virtual Machine Specification: Frames](https://docs.oracle.com/en/java/javase/27/docs/specs/jvms/jvms-2.html#jvms-2.6)
- [Android Developers: d8](https://developer.android.com/tools/d8)
