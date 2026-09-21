---
title: "What Is a Java Class File? From Source Code to JVM Bytecode"
date: "2026-09-21"
summary: "A practical tour of the ClassFile format, constant pool, Code attribute, local variables, operand stack, and a small javap experiment that makes bytecode concrete."
lang: "en"
category: "Android"
paired: "jvm-class-file-bytecode-zh"
cover: "https://raw.githubusercontent.com/Josephchen-crypto/protfolio/main/public/blog-covers/jvm-classfile-04.svg"
---

For years I treated the .class file as a boring intermediate artifact.

Java goes in, class files come out, and the JVM handles the rest.

That explanation is correct, but it hides the useful part: a class file is the bridge between source-level Java and the execution model of the JVM.

## Three different layers

The first rule is to keep these layers separate:

| Layer | Example | Consumer |
|---|---|---|
| Java source | return a + b; | developer / javac |
| JVM bytecode | iload_1, iadd | JVM |
| machine code | ARM / x86 instructions | CPU |

~~~mermaid
flowchart LR
    A["Java source"] --> B["javac"]
    B --> C["ClassFile"]
    C --> D["JVM bytecode execution / compilation"]
    D --> E["Machine code"]
    E --> F["CPU"]
~~~

A class file is not source text and it is not native machine code. It is a structured binary format defined by the JVM specification.

## More than bytecode

A ClassFile contains information about the class itself, not just executable instructions.

~~~mermaid
flowchart TB
    C["ClassFile"]
    C --> V["Version"]
    C --> CP["constant_pool"]
    C --> F["fields"]
    C --> M["methods"]
    C --> A["attributes"]
    M --> Code["Code attribute"]
~~~

The runtime needs the superclass, interfaces, fields, methods, symbolic references, and method attributes in addition to the instruction stream.

## The constant pool as an indexed address book

Instead of storing a full class or method description inside every instruction, bytecode can refer to an entry by index.

Conceptually:

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

The point is not to memorize every constant-pool tag.

The useful idea is that bytecode instructions can resolve classes, fields, and methods through symbolic entries in this table.

## File constant pool versus runtime constant pool

These names are similar enough to cause confusion.

~~~mermaid
flowchart LR
    A["ClassFile constant_pool"] --> B["Class loading"]
    B --> C["Run-Time Constant Pool"]
~~~

The first is part of the binary class-file structure.

The second is a runtime structure associated with the loaded class or interface.

They are connected, but they are not the same object.

## How add() becomes stack-oriented bytecode

Take:

~~~java
public int add(int a, int b) {
    return a + b;
}
~~~

A typical bytecode shape includes:

~~~text
iload_1
iload_2
iadd
ireturn
~~~

This connects directly to JVM frames.

~~~mermaid
flowchart LR
    A["Local Variables: a"] --> B["Operand Stack"]
    C["Local Variables: b"] --> B
    B --> D["iadd"]
    D --> E["result on Operand Stack"]
    E --> F["ireturn"]
~~~

Bytecode works with local-variable slots and stack operands inside the current frame.

## Where the instructions live

For ordinary methods, JVM instructions are normally stored in the method's Code attribute.

~~~text
ClassFile
└── methods
    └── method_info
        └── attributes
            └── Code
                └── bytecode
~~~

That is why javap -v can show structures such as the constant pool, method descriptors, flags, and Code attributes.

## A five-minute javap experiment

Create:

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

Then run:

~~~bash
javac BytecodeDemo.java
javap -c BytecodeDemo
~~~

Look only for:

~~~text
new
dup
invokespecial
astore
iload
iadd
ireturn
~~~

Next:

~~~bash
javap -v BytecodeDemo
~~~

Find major version, Constant pool, and Code.

The goal is not opcode memorization. The goal is to prove that a source-level statement becomes a structured binary file and a concrete instruction sequence.

## The Android connection

Android ultimately executes DEX bytecode under ART, not JVM class-file bytecode.

But class files still matter in the build pipeline:

~~~mermaid
flowchart LR
    A["Java / Kotlin"] --> B[".class"]
    B --> C["D8 / R8"]
    C --> D[".dex"]
    D --> E["ART"]
~~~

D8 accepts Java bytecode and produces DEX bytecode.

That makes ClassFile knowledge useful for understanding compilers, bytecode instrumentation, build tooling, R8/D8 inputs, and the boundary between JVM bytecode and DEX.

A senior engineer does not need to memorize the entire class-file specification. The more valuable skill is knowing which layer you are looking at and which tool can verify the next layer down.

## References

- [JVMS: The class File Format](https://docs.oracle.com/en/java/javase/27/docs/specs/jvms/jvms-4.html)
- [JVMS: Frames](https://docs.oracle.com/en/java/javase/27/docs/specs/jvms/jvms-2.html#jvms-2.6)
- [Android Developers: d8](https://developer.android.com/tools/d8)
