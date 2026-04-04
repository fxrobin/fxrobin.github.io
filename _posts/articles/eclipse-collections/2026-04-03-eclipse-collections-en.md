---
layout: post
title: "Eclipse Collections: the Collections API you don't know (yet)"
subtitle: "Because Stream is fine, but sometimes we can do so much better"
logo: eclipse.png
category: articles
tags: [Java, Collections, Eclipse Collections, API, Functional, Lambda]
lang: en
ref: eclipse-collections
permalink: /eclipse-collections-en/
---

<div class="intro" markdown='1'>

Everyone knows (or should know) the Collections API provided by the JDK, especially the high-level interfaces: `Collection`, `Map`, and certainly the specialized ones like `List` or `Set`.

Although it received a slight facelift with Java 8, mostly thanks to (or because of) the Stream API, this historical API still suffers from various gaps and an sometimes painful verbosity.

It is therefore quite common to see Guava or Apache Commons Collections added to a project's dependencies, each with their own drawbacks: Guava brings everything along (including what you don't need), and Apache Commons Collections does not support lambdas, having been designed before Java 8.

So I'm going to present **Eclipse Collections**, a lightweight, performant and really effective API that deserves to be better known. And I'll show you concretely why, once you get a taste of it, you don't go back.

</div>

<!--excerpt-->

## The issue: the Stream API is fine ... but verbose

Let's take a simple example. We have a list of superheroes, and we want to get those who live in Gotham, transform their names to uppercase, and get a new list.

With classic JDK:

```java
List<String> gothamHeroNames = heroes.stream()
    .filter(h -> "Gotham".equals(h.getCity()))
    .map(Hero::getName)
    .map(String::toUpperCase)
    .toList();
```

That works fine. But we systematically go through `.stream()`, `.collect()`, `Collectors.toList()`. It is verbose, and it gets heavy fast when chaining operations.

Here is the same code with Eclipse Collections:

```java
MutableList<String> gothamHeroNames = heroes
    .select(h -> "Gotham".equals(h.getCity()))
    .collect(Hero::getName)
    .collect(String::toUpperCase);
```

Operations are directly on the collection. No more `.stream()`, no more `.collect(Collectors.toList())`. You read the code like a sentence.

Good start. Let's go further.

## Ready, set, go!

We start with a classic Maven project in Java 25, with Eclipse Collections dependencies, Lombok for our domain classes, and JUnit 5 for tests.

`pom.xml (part)`
```xml
<properties>
    <maven.compiler.source>25</maven.compiler.source>
    <maven.compiler.target>25</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>

<dependencies>
    <dependency>
        <groupId>org.eclipse.collections</groupId>
        <artifactId>eclipse-collections-api</artifactId>
        <version>13.0.0</version>
    </dependency>
    <dependency>
        <groupId>org.eclipse.collections</groupId>
        <artifactId>eclipse-collections</artifactId>
        <version>13.0.0</version>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.44</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

> Two Maven artifacts for Eclipse Collections: the API (`eclipse-collections-api`) and the implementation (`eclipse-collections`). It's the same separation as SLF4J: you depend on the API, the implementation comes at runtime. Here we take both, but it's a good habit to keep in mind.

Our domain class for all examples, with Lombok to avoid boilerplate (check out [the dedicated article](/Lombok-Yes-But/) if you haven't yet):

```java
@Value
@Builder
public class Hero {
    String name;
    int age;
    String city;
}
```

And our dataset:

```java
MutableList<Hero> heroes = Lists.mutable.of(
    Hero.builder().name("Bruce").age(32).city("Gotham").build(),      // Batman
    Hero.builder().name("Peter").age(17).city("Metropolis").build(),  // Spider-Man
    Hero.builder().name("Tony").age(45).city("Gotham").build(),       // Iron Man
    Hero.builder().name("Natasha").age(28).city("Wakanda").build(),   // Black Widow
    Hero.builder().name("Dick").age(15).city("Metropolis").build(),   // Robin
    Hero.builder().name("Carol").age(38).city("Gotham").build()       // Captain Marvel
);
```

Note the `Lists.mutable.of(...)` factory. Eclipse Collections provides factories for all its types: `Lists`, `Sets`, `Maps`, `Bags`. Very handy and very readable.

## A quick tour of the API

### select and reject: filtering in both directions

`select` is the equivalent of `Stream.filter`. But Eclipse Collections also provides `reject`, the inverse operation, which has no direct equivalent in the Stream API.

```java
// Adults
MutableList<Hero> adults = heroes.select(h -> h.getAge() >= 18);

// Minors (without manually negating the predicate)
MutableList<Hero> minors = heroes.reject(h -> h.getAge() >= 18);
```

With the Stream API, for `reject` you would have to write `filter(h -> !(h.getAge() >= 18))`. That works, but `reject` is so much more expressive.

### collect: transforming elements

`collect` here corresponds to `Stream.map` (careful, no confusion with `Collectors.toList()` from the Stream API).

```java
// Names of all Gotham residents, in uppercase
MutableList<String> gothamHeroNames = heroes
    .select(h -> "Gotham".equals(h.getCity()))
    .collect(Hero::getName)
    .collect(String::toUpperCase);

System.out.println(gothamHeroNames.makeString(", "));
```

```
BRUCE, TONY, CAROL
```

`makeString(separator)` is a neat replacement for `Collectors.joining()`. Small, practical, readable.

### partition: splitting a collection in two at once

This one is a real favourite. `partition` splits the collection into two parts according to a predicate, and returns a `PartitionMutableList` with both.

```java
PartitionMutableList<Hero> partition = heroes.partition(h -> h.getAge() >= 18);

MutableList<Hero> adults = partition.getSelected();
MutableList<Hero> minors = partition.getRejected();
```

With the Stream API, getting both groups in a single pass requires `Collectors.partitioningBy`, which returns a `Map<Boolean, List<T>>`. That works but it's not very expressive. `getSelected()` and `getRejected()` are clearly more readable than `get(true)` and `get(false)`.

### groupBy: grouping without effort

```java
MutableListMultimap<String, Hero> byCity = heroes.groupBy(Hero::getCity);

MutableList<Hero> metropolisHeroes = byCity.get("Metropolis");
```

The result is a `Multimap`: a map whose values are collections. That's exactly what you need for grouping, and it's much more convenient than `Collectors.groupingBy` which returns a `Map<K, List<V>>`.

```java
// Display the number of heroes per city
byCity.forEachKeyMultiValues((city, inhabitants) ->
    System.out.printf("%s: %d hero(es)%n", city, inhabitants.size())
);
```

```
Gotham: 3 hero(es)
Metropolis: 2 hero(es)
Wakanda: 1 hero(es)
```

### Primitive collections: goodbye boxing

This is probably the least known feature of Eclipse Collections. The JDK has no `List<int>`: you are forced to go through `List<Integer>`, with the boxing/unboxing overhead that comes with it.

Eclipse Collections provides primitive collections: `IntList`, `LongList`, `DoubleList`, etc.

```java
// Extract ages into an IntList, without boxing
IntList ages = heroes.collectInt(Hero::getAge);

int    minAge     = ages.min();
int    maxAge     = ages.max();
double averageAge = ages.average();

System.out.printf("Ages: min=%d, max=%d, average=%.1f%n", minAge, maxAge, averageAge);
```

```
Ages: min=15, max=45, average=29.2
```

No `mapToInt().summaryStatistics()`. Just `.collectInt()` and the statistical methods are right there. Practical and performant.

### anySatisfy, allSatisfy, noneSatisfy

These three methods correspond to `anyMatch`, `allMatch`, `noneMatch` from Stream, but again without going through `.stream()`.

```java
boolean atLeastOneGothamite = heroes.anySatisfy(h -> "Gotham".equals(h.getCity()));  // true
boolean allAdults           = heroes.allSatisfy(h -> h.getAge() >= 18);              // false
boolean noRetirees          = heroes.noneSatisfy(h -> h.getAge() >= 65);             // true
```

## Mutability and immutability: an explicit choice

One aspect often overlooked in the JDK: `Collections.unmodifiableList()` returns a non-modifiable view, but it remains a standard `List`. Nothing in the type tells you the list is immutable.

Eclipse Collections makes this explicit at the type level.

```java
// Mutable
MutableList<Hero> mutable = Lists.mutable.of(bruce, peter);
mutable.add(tony); // OK

// Immutable: the type says it clearly
ImmutableList<Hero> immutable = Lists.immutable.of(bruce, peter);
immutable.add(tony); // Does not compile
```

And converting between the two is trivial:

```java
ImmutableList<Hero> frozen    = mutable.toImmutable();
MutableList<Hero>   modifiable = immutable.toList();
```

## Recommendations (finally!)

A few tips after real-world usage:

* **Interoperability**: if your public API returns standard JDK `List<T>`, use `.toList()` before returning. Don't expose EC types in public signatures if the context doesn't call for it.
* **No big-bang migration**: Eclipse Collections integrates progressively. Use it where it brings readability, not to rewrite everything at once.
* **`Bag<T>` for frequencies**: if you need to count occurrences, `MutableBag<T>` is a much better option than a handcrafted `Map<T, Integer>`.
* **Primitives for performance**: if you are processing large volumes of numerical data, primitive collections (`IntList`, `LongList`, `DoubleList`) avoid boxing and make a real difference.

## Conclusion

Eclipse Collections is an API that does one thing and does it well: making collection manipulation more expressive, more readable, and often more performant. It does not replace the Stream API (both coexist very well), but it offers a more direct and less verbose alternative for the vast majority of everyday cases.

`select`, `reject`, `partition`, `groupBy`, `collectInt`... once you have these tools at hand, going back to `stream().filter().collect(Collectors.toList())` feels genuinely painful.

There is still a lot to explore: `Bag`, advanced `Multimap`, `LazyIterable` for deferred evaluation, and `SortedMap` / `BiMap`. Let's say that will be for a future post...

**Feel free to share your own Eclipse Collections use cases in the comments, or the cases where you preferred to stick with the Stream API.**
