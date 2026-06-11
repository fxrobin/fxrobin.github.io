---
layout: post
title: "Do you really know instantiation?"
subtitle: "To (re)discover some subtleties of this mechanism in Java..."
logo: brain-logo.png
category: articles
tags: [Java, JVM, Craftsmanship]
lang: en
ref: construction-instance-java
permalink: /construction-instance-java-en/
mermaid: true
---

<div class="intro" markdown='1'>

This short post will show you which instructions are executed in your Java classes when you request an instance.

</div>

<!--excerpt-->

## What will we test?

A Java class that you want to instantiate can have:

* one and only one `static` block;
* one and only one instance block (if you don't know what that is, the example is coming up...);
* one or more constructors.

> For completeness, a class can also contain the following, but this article **does not cover their instantiation**:
> * one or more static nested classes;
> * one or more inner classes.

The idea is to test the sequence of code lines during the instantiation mechanism, yet widely used by everyone!

## The test setup

We have two classes at our disposal: `Root` and `Child`.

As their names indicate: `Child` inherits from `Root`, which is not always obvious when you implement the `Hallyday` interface (*humour...*).

For J-Jacques (still looking for an `enum` in this article) and Mika, here's a small UML diagram:

<div class="mermaid">
classDiagram
    class Root {
        +static block
        +instance block
        +Root()
    }
    class Child {
        +static block
        +instance block
        +Child()
    }
    Root <|-- Child : extends
</div>

You can hardly get simpler...

Here is the source code for the `Root` class:

```java
public class Root {

    // <1>
    static {
        System.out.printf("static block : %s %n", Root.class);
    }

    // <2>
    {
        System.out.printf("Root instance block : %s %n", this.getClass());
    }

    // <3>
    public Root() {
        System.out.println("Root noargs constructor");
    }
}
```

We rarely get more concise, but this class is not trivial either, as it has:

1. **a static class block**, triggered when the class is loaded by the ClassLoader, at its first call;
2. **an instance block**, triggered before the class constructors;
3. **a no-arg constructor** (no comment, I hope you know what a constructor is...)

And here is the source code for the `Child` class, implemented on the same principle as the `Root` class **it inherits from**.

```java
public class Child extends Root {

    static {
        System.out.printf("static block : %s %n", Child.class);
    }

    {
        System.out.printf("Child instance block : %s %n", this.getClass());
    }

    public Child() {
        System.out.println("Child noargs constructor");
    }
}
```

Only the different outputs change so we can differentiate the execution of each block.

## At the result of instantiation

When we instantiate the class with the following code: `Child child = new Child()`, here is the result:

```
static block : class fr.fxjavadevblog.articles.Root			 
static block : class fr.fxjavadevblog.articles.Child		 
Root instance block : class fr.fxjavadevblog.articles.Child	 
Root noargs constructor										 
Child instance block : class fr.fxjavadevblog.articles.Child 
Child noargs constructor									 
```

Comments:

1. without surprise, the `static` block of `Root` executes first.
2. then comes the `static` block of `Child`: nothing surprising so far.
3. then it's the instance block of `Root` while `this.getClass()` returns `Child`. Yes! The current concrete instance is indeed of type `Child` even though the code is in the `Root` class.
4. the no-arg constructor of `Root` is triggered. Interesting, we still haven't reached the instance block of `Child`. For reference, the default constructor of a parent class is always called implicitly when no other `super(args...)` constructor is invoked explicitly.
5. here it is now, our instance block of `Child`, **interleaved** between the no-arg constructor of `Root` and its own constructor.
6. Finally, to close the sequence, the no-arg constructor of `Child` brings up the rear... It was about time!

> "Etonnant non" ? Pierre Desproges, Dix minutes nécessaires de M. Cyclopède.

{%include video.html youtube-id="zcIa4wP-wtA?rel=0&amp;start=4"  size="normal" %}