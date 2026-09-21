---
title: "What Really Happens Behind new User()? A JVM Object-Creation Walkthrough"
date: "2026-09-21"
summary: "A bytecode-level walkthrough of class readiness, instance allocation, default field state, the <init> method, and how the final object reference reaches a local variable."
lang: "en"
category: "Android"
paired: "java-object-creation-jvm-zh"
cover: ""
---

new User() looks trivial, but it connects several JVM concepts that are often learned separately.

The useful lesson is that object creation, instance initialization, and storing a reference are related operations, not one single step.

## Break the expression into stages

~~~java
User user = new User();
~~~

I use this model:

~~~mermaid
flowchart LR
    A["Resolve the target class"] --> B["Create an instance"]
    B --> C["Run instance initialization"]
    C --> D["Keep the reference"]
    D --> E["Store reference in a local variable"]
~~~

This immediately fixes one common misconception: the local variable and the object are not the same thing.

## The class must be known first

The JVM new instruction refers to a symbolic class reference through the class file constant pool.

Creating an instance is also an active-use scenario that can trigger class initialization, so object creation connects directly to class loading, linking, and initialization.

## The instance and the reference are different

The JVM heap is the runtime area from which storage for class instances and arrays is allocated.

The local variable user contains a reference to that instance.

~~~mermaid
flowchart LR
    A["Current Frame"] --> B["Local Variables"]
    B --> C["user reference"]
    C --> D["User instance in Heap"]
~~~

That also explains why:

~~~java
User a = new User();
User b = a;
~~~

still creates one User object. Two local references point to the same instance.

## Fields begin with defined default values

Before ordinary constructor logic assigns application values, instance fields have Java-defined default values.

~~~java
class User {
    int age;
    boolean active;
    Object token;
}
~~~

Conceptually:

~~~text
age    = 0
active = false
token  = null
~~~

Constructor logic is therefore not working with arbitrary memory.

## new and <init> are separate

A small class often produces bytecode shaped like:

~~~text
new
dup
invokespecial User.<init>
astore
~~~

The important distinction is:

- new creates the instance
- <init> is the JVM instance-initialization method
- astore can place the final reference into a local-variable slot

~~~mermaid
flowchart LR
    N["new"] --> D["dup"]
    D --> I["invokespecial <init>"]
    I --> S["astore"]
~~~

Saying “the constructor creates the object” is convenient, but it hides the runtime sequence.

## Why dup appears

JVM bytecode uses an operand stack.

After new, an object reference is on that stack. Calling <init> needs a reference, but the code also needs a reference afterward so it can store it in user.

dup keeps another copy available.

This is a clean example of how object creation connects to the JVM frame model: bytecode manipulates values on the operand stack and eventually stores a reference into the frame's local-variable array.

## Specification versus implementation

The JVM specification defines object semantics, but it does not require every implementation to use the same physical object layout.

Terms such as Object Header, Mark Word, compressed class pointers, alignment, and TLAB are useful when studying HotSpot, but they belong to an implementation layer.

Keeping that boundary clear prevents a HotSpot optimization from accidentally becoming a “JVM rule” in your mental model.

## Why this matters for Android

ART executes DEX rather than ordinary JVM bytecode, so instruction names and runtime implementation details differ.

The foundations still transfer:

- object versus reference
- local variable versus heap instance
- class initialization versus instance initialization
- allocation pressure and GC
- temporary-object cost in performance-sensitive code

Understanding new User() at this level makes later Android memory and performance topics much easier to reason about.

## Verify it yourself

~~~java
public class ObjectDemo {
    static class User {}

    public static void main(String[] args) {
        User user = new User();
    }
}
~~~

Then:

~~~bash
javac ObjectDemo.java
javap -c ObjectDemo
~~~

Find new, dup, invokespecial, and astore.

The goal is not opcode memorization. It is to connect the opcodes to the runtime story.

## References

- [JVMS: new](https://docs.oracle.com/en/java/javase/27/docs/specs/jvms/jvms-6.html#jvms-6.5.new)
- [JVMS: Initialization](https://docs.oracle.com/en/java/javase/27/docs/specs/jvms/jvms-5.html#jvms-5.5)
- [JVMS: Instance Initialization Methods](https://docs.oracle.com/en/java/javase/27/docs/specs/jvms/jvms-2.html#jvms-2.9.1)
