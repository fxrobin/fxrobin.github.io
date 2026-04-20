---
layout: post
title: "Primitive Obsession"
subtitle: "or why your `String email` has been lying from the start"
logo: java.png
category: articles
tags: [Java, Records, Craftsmanship, Clean Code, Lombok, JPA]
lang: en
ref: primitive-obsession
permalink: /primitive-obsession-en/
---

<div class="intro" markdown='1'>

```java
// Nothing prevents calling this in reverse order. The compiler says nothing.
public User createUser(String firstName, String lastName, String email, String phone) { /*...*/ }
```

This is the kind of code we've been writing for years without questioning it. And yet there's a potential bug in every single call: the parameter order. But there's worse: these four `String` values don't represent the same thing. A first name, a last name, an email address, a phone number — these are distinct business concepts, each with their own validation rules and constraints. And you're representing all of them with the same type.

This is the code smell known as **Primitive Obsession**. And since Java 16, we have no excuse for letting it linger.

</div>

<!--excerpt-->

## An example that hurts

Let's start with a concrete case. Here's a registration method:

```java
public User registerUser(String firstName, String lastName, String email, String phone) {
    // ... business logic
}
```

And here's a perfectly compilable, perfectly silent, and perfectly wrong call:

```java
// Oops. Nobody sees the problem.
userService.registerUser("b.wayne@gotham.city", "+33612345678", "Bruce", "Wayne");
```

The compiler is satisfied. Unit tests that mock the service are too. The problem will only show up in production, when an email arrives addressed to "Bruce Wayne" and an SMS goes to "b.wayne@gotham.city".

You might object: "but IntelliJ displays the parameter names right in the editor, I can see that `"Bruce"` goes into `firstName`." That's true. The *inlay hints* in IntelliJ (and modern IDEs in general) show something like this:

```java
userService.registerUser(/*firstName:*/ "b.wayne@gotham.city",
                         /*lastName:*/ "+33612345678",
                         /*email:*/ "Bruce",
                         /*phone:*/ "Wayne");
```

It's comfortable. But it's a **band-aid**, not a solution. Those hints disappear the moment you leave the IDE: GitHub code review, a terminal diff, reading a CI log. And above all, they do nothing when someone swaps the arguments by copy-pasting from another part of the codebase. The IDE shows the names, but doesn't detect the error.

Tooling compensates for bad design. That's not the same as fixing it.

This is not a carelessness problem. It's a design problem: we gave the compiler too little information for it to help us.

> **"`String` is the data type you pick when you don't know what else to use."**
> It's a catch-all. And like any catch-all, it ends up mixing everything together.

## The Value Object pattern (and why you avoid it)

The classic solution, taught in every [DDD (Domain Driven Design)](https://martinfowler.com/bliki/DomainDrivenDesign.html) resource, is the **Value Object**: an immutable class that encapsulates a value and its validation rules.

```java
public final class Email {

    private final String value;

    public Email(String value) {
        Validate.notBlank(value, "Invalid email");
        Validate.isTrue(value.contains("@"), "Invalid email: %s", value);
        this.value = value.toLowerCase().trim();
    }

    public String getValue() { return value; }

    @Override
    public boolean equals(Object o) { ... }
    @Override
    public int hashCode() { ... }
    @Override
    public String toString() { return value; }
}
```

And now our method:

```java
public User registerUser(FirstName firstName,
                         LastName lastName,
                         Email email,
                         PhoneNumber phone) { /*...*/ }
```

The reversed call from earlier no longer compiles. The compiler does its job.

The problem is the boilerplate. `equals`, `hashCode`, `toString`, constructor, getter: for every business type. On a real project with twenty business concepts, that gets discouraging fast. And that's exactly why we always end up putting `String` back everywhere — not out of laziness, but out of pragmatism.

There are two ways out. The first has been available for a long time if you already use Lombok.

## Lombok `@Value`: the shortcut we needed

> The examples below use not only Lombok (that's the point!) but also Apache Commons Lang for validations and AssertJ for tests. If it's not already in your `pom.xml`:

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.38</version>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
    <version>3.20.0</version>
</dependency>
<dependency>
    <groupId>org.assertj</groupId>
    <artifactId>assertj-core</artifactId>
    <version>3.27.3</version>
    <scope>test</scope>
</dependency>
```

If your project uses Lombok, you already have the solution at hand. The `@Value` annotation turns a class into an immutable Value Object: all fields become `private final`, getters are generated, `equals`, `hashCode` and `toString` too. The class itself becomes `final`. In other words, everything we used to write by hand.

For types without validation, it's one line:

```java
@Value public class FirstName { String value; }
@Value public class LastName  { String value; }
@Value public class PhoneNumber { String value; }
```

For `Email` with validation, we write the *factory method* and the constructor ourselves — Lombok generates the rest:

```java
@Value
public class Email {

    String value; // field automatically made private and final by Lombok

    // factory method to validate then create the instance
    public static Email of(String value) {
        Validate.notBlank(value, "Invalid email");
        Validate.isTrue(value.contains("@"), "Invalid email: %s", value);
        return new Email(value);
    }

    // private constructor — we only build once everything is valid
    private Email(String value) {
        this.value = value.toLowerCase().trim();
    }

}
```

Lombok generates the getter, `equals`, `hashCode` and `toString`. We only write the validation logic. And our signature becomes:

```java
public User registerUser(FirstName firstName, LastName lastName,
                         Email email, PhoneNumber phone) { /*...*/ }
```

The reversed call no longer compiles. Works on Java 8+, no version constraint.

It works great. But since Java 16, the JDK natively includes this idea, with an even shorter syntax.

## Java Records: the native Value Object

A `record` is the JDK's answer to the same problem: final, immutable class, `equals`/`hashCode`/`toString` generated. No Lombok, no dependencies whatsoever. One line:

```java
public record Email(String value) {}
public record FirstName(String value) {}
public record LastName(String value) {}
public record PhoneNumber(String value) {}
```

The difference from `@Value`? The getter is called `value()` instead of `getValue()`. A syntactic detail, same behavior. And the reversed call still doesn't compile:

```java
// Compilation error: incompatible types
userService.registerUser(new Email("b.wayne@gotham.city"), new PhoneNumber("+336..."),
                         new FirstName("Bruce"), new LastName("Wayne"));
```

Good start. But we can do even better.

## Validation included: the compact constructor

A `record` accepts a **compact constructor**: a constructor without repeated parameters where you can validate and normalize:

```java
public record Email(String value) {
    public Email {
        Validate.notBlank(value, "Email cannot be empty");
        Validate.matchesPattern(value, "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", "Invalid email format: %s", value);
        value = value.toLowerCase().trim(); // normalization
    }
}
```

Note the syntax: no `this.value =`, no `String value` in the signature. The compact constructor receives the parameters implicitly, and Java handles the assignment afterward. We validate and normalize, that's all.

Now, an invalid `Email` simply cannot exist. Validation lives at the heart of the type, not scattered across service methods or JSR-303 annotations we forget to activate.

Already pretty solid, but we're not done. Not even close.

## Sealed classes: going even further

There are cases where a Value Object doesn't just represent a value, but a **state**. An email can be "unverified" or "verified". An amount can be "pending" or "validated". With sealed classes (Java 17), we can represent those states in the type system:

```java
public sealed interface EmailStatus permits UnverifiedEmail, VerifiedEmail {}

public record UnverifiedEmail(String value) implements EmailStatus {
    public UnverifiedEmail {
        // format validation only
        Validate.notBlank(value, "Invalid email");
        Validate.isTrue(value.contains("@"), "Invalid email");
        value = value.toLowerCase().trim();
    }
}

public record VerifiedEmail(String value, Instant verifiedAt) implements EmailStatus {}
```

And in the business code, pattern matching forces handling both cases:

```java
String display = switch (emailStatus) {
    case UnverifiedEmail e -> e.value() + " (unverified)";
    case VerifiedEmail e   -> e.value() + " (verified on " + e.verifiedAt() + ")";
};
```

If someone adds a third state (`BounceEmail`, for example), the `switch` stops compiling. The compiler guides maintenance. That's the kind of safety net you don't notice until the day it catches you.

## Grouping multiple primitives: the Parameter Object

Primitive Obsession isn't limited to isolated fields. There's another, more subtle form: primitives that always go together but get transported separately.

```java
// These three fields always travel together
public User createUser(String street, String city, String zipCode) { ... }
```

`street`, `city` and `zipCode` are not three independent values: they form an **address**. Grouping them in a Value Object isn't just a matter of cleanliness — it's making the concept visible in the code.

```java
public record Address(String street, String city, String zipCode) {
    public Address {
        Validate.notBlank(street,  "Street required");
        Validate.notBlank(city,    "City required");
        Validate.notBlank(zipCode, "Invalid zip code");
        Validate.matchesPattern(zipCode, "\\d{5}", "Invalid zip code: %s", zipCode);
    }
}
```

The method signature becomes:

```java
public User createUser(FirstName firstName, LastName lastName, Address address) { ... }
```

Three parameters instead of five. And if we ever add a country or an address complement, we modify `Address`, not every signature that was carrying it around.

This is what Martin Fowler calls **[Introduce Parameter Object](https://refactoring.com/catalog/introduceParameterObject.html)** in his refactoring catalog. And this is where Value Objects reveal their true value: not just typing a `String` to prevent parameter inversions, but **naming and encapsulating a business concept** that had no name yet in your code.

While we're on the topic of `zipCode`: a zip code is **not** an `int`. I've seen this dozens of times throughout my career, and it always causes damage. An `int` cannot represent "01000": it stores 1000, and the leading zero silently disappears. Not to mention that zip codes in some countries contain letters (UK, Canada...). `int zipCode` is a Primitive Obsession paired with a false assumption about the domain. The rule I apply: are you going to do math with this value? Additions, divisions? If the answer is no, it's not a number — so it's not an `int`. `String` is already better. **A `ZipCode` with validation is the real answer**.

Other natural examples: `Coordinates(double latitude, double longitude)`, `DateRange(LocalDate start, LocalDate end)`, `MoneyAmount(BigDecimal value, Currency currency)`. Each time, primitives that should not be allowed to roam separately.

## What the tests gain

This is the argument we often forget to mention. A Value Object makes unit tests *significantly* more expressive, and it goes both ways.

First, readability. In a test that verifies a service's behavior, `Email.of("b.wayne@gotham.city")` says exactly what we're testing. No ambiguity about the intent, no comment needed.

Then, and this is the real gain: **validation is testable in isolation**, without instantiating any service. The test is about the domain, not the infrastructure.

### Testing the nominal behavior

The first block covers the valid cases: case normalization, semantic equality. These are **behavior** tests — we verify that the object behaves as the business expects.

```java
@DisplayName("Email")
class EmailTest {

    @Nested
    @DisplayName("Given a valid email address")
    class GivenValidEmail {

        @Test
        @DisplayName("When created, then value is normalized to lowercase")
        void shouldNormalizeToLowercase() {
            // Given
            String rawEmail = "B.WAYNE@Gotham.City";

            // When
            Email email = Email.of(rawEmail);

            // Then
            assertThat(email.value()).isEqualTo("b.wayne@gotham.city");
        }

        @Test
        @DisplayName("When compared to identical email, then equals returns true")
        void shouldBeEqualToSameEmail() {
            // Given
            Email email1 = Email.of("b.wayne@gotham.city");
            Email email2 = Email.of("B.WAYNE@GOTHAM.CITY");

            // When / Then
            assertThat(email1).isEqualTo(email2);
        }
    }
}
```

### Testing the invariants

The second block covers the invalid cases: null, wrong format. These are **contract** tests — we verify that the type's invariants hold against hostile inputs. Without Value Objects, these rules would be scattered across validators or services, and often not tested at all.

```java
@DisplayName("Email")
class EmailTest {

    @Nested
    @DisplayName("Given an invalid email address")
    class GivenInvalidEmail {

        @Test
        @DisplayName("When null, then throws IllegalArgumentException")
        void shouldRejectNull() {
            // Given
            String nullEmail = null;

            // When / Then
            assertThatThrownBy(() -> Email.of(nullEmail))
                .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("When missing @, then throws IllegalArgumentException")
        void shouldRejectEmailWithoutAtSign() {
            // Given
            String invalidEmail = "notAnEmail";

            // When / Then
            assertThatThrownBy(() -> Email.of(invalidEmail))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid");
        }
    }
}
```

In practice both `@Nested` classes live inside the same `EmailTest` class — they're separated here to highlight the two registers: expected behavior on one side, rejection of invalid cases on the other.

Compare that with what you'd have without the Value Object: a test calling `EmailValidator.isValid("notAnEmail")` inside a service, buried among other assertions. Here, the business rule has its own test, its own scope, its own lifecycle.

And if the validation changes (for instance we decide an email must have a TLD), **a single test breaks**, in the right place, with a name that explains why.

## Integration with Lombok, JPA and Jackson

In theory it's perfect. In practice, there are a few friction points to know about.

### Lombok `@Value` vs Records: the match

For Java 8 to 15 projects, `@Value` is the only reasonable option, and it holds its ground beyond that. It even has an edge over Records in a JPA context: you can annotate the class with `@Embeddable` without friction, and add `@NoArgsConstructor(force = true)` to satisfy Hibernate.

```java
@Value
@Embeddable
@NoArgsConstructor(force = true) // required by JPA
public class Email {
    String value;
}
```

With a Record, the same configuration is more restrictive (Hibernate 6+ only, see next section).

On the other hand, `@Value` does not support the compact constructor or sealed interfaces. For complex business states, Records + sealed classes remains more expressive.

Personally, I stick with `@Value` even on Java 17+, for three concrete reasons.

The first is `@With`. Lombok automatically generates methods that return a copy of the object with a single field changed — essential when working with immutable Value Objects in slightly complex business logic:

```java
@Value
@With
public class Address {
    String street;
    String city;
    String zipCode;
}

// Moving: clean copy, the original is untouched
Address newAddress = address.withCity("Lyon").withZipCode("69001");
```

With a Record, you'd have to write these methods by hand. `with` expressions are in preview since Java 25, but that's far from being available everywhere.

The second is **`@Builder`**. For Value Objects with many fields, Lombok's builder is unbeatable for call-site readability. A Record has no native builder.

The third is **inheritance**. A Record implicitly extends `java.lang.Record` and cannot inherit from any other class. A `@Value` class can. On some business hierarchies, that's a blocker.

Records are elegant and dependency-free, but `@Value` + `@With` + `@Builder` form a more complete combination for day-to-day use on real Java projects.

### JPA / Hibernate

JPA cannot map a `record` directly as an entity (no no-arg constructor, no setters). But we can use them as **embedded types** with `@Embeddable`:

```java
@Embeddable
public record Email(String value) {
    public Email {
        value = value.toLowerCase().trim();
    }
}

@Entity
public class User {
    @Id
    @GeneratedValue
    private Long id;

    @Embedded
    private Email email;

}
```

Hibernate 6+ natively supports Records as embeddables. Hibernate 5: avoid it.

For columns, if you want `email` stored directly in the `email` column (not `email_value`), add `@Column(name = "email")` on the field in `User`, or use `@AttributeOverride`.

### Jackson

#### With Lombok `@Value`

For simple `@Value` classes without validation (like `FirstName`, `LastName`...), the cleanest solution is to add one line to `lombok.config`:

```
lombok.anyConstructor.addConstructorProperties=true
```

Lombok then adds `@ConstructorProperties` to the generated all-args constructor, which Jackson reads natively to map JSON fields to parameters — no annotation needed in the code.

For `Email` with its factory method and private constructor, `@JsonCreator` goes directly on the `of()` method:

```java
@Value
public class Email {

    String value;

    @JsonCreator
    public static Email of(@JsonProperty("value") String value) {
        Validate.notBlank(value, "Invalid email");
        Validate.isTrue(value.contains("@"), "Invalid email: %s", value);
        return new Email(value);
    }

    private Email(String value) {
        this.value = value.toLowerCase().trim();
    }
}
```

Jackson recognizes static factory methods annotated with `@JsonCreator` since version 2.x. Deserialization calls `of()`, which validates, then delegates to the private constructor.

#### With Records

Jackson can deserialize Records since version 2.12, provided the `jackson-module-parameter-names` module is activated (often automatic with Spring Boot). But if you have an ambiguous component name, Jackson can get confused. The clean solution:

```java
public record Email(@JsonProperty("value") String value) {}
```

## What about memory?

This is a legitimate objection you often hear: "a Value Object for a single field means an extra JVM object, so more memory and more GC pressure." And it's... partially true.

A `record Email(String value)` does add an object in memory: roughly 16 bytes of object header (on a 64-bit JVM) plus an 8-byte reference to the internal `String`. So ~24 bytes of overhead per instance, on top of the `String` itself.

But a few nuances are in order.

First, the JVM is not naive. Its JIT compiler practices **escape analysis**: if an object is created locally in a method and never escapes it, the JIT can fully eliminate the allocation and treat the fields as plain local variables — this is called *scalar replacement*. In that case the overhead is literally zero at runtime. However, an `Email` stored in a JPA entity or passed between application layers does escape, and the overhead is real.

Second, this overhead remains marginal in the vast majority of applications. An empty `String` already takes ~40 bytes on the heap. Adding 24 bytes for a wrapper is about a 60% increase over the raw pointer, but in absolute terms we're talking about a few dozen bytes per business instance. On an application handling thousands of users rather than billions of Value Objects per second, this won't overflow the heap.

Finally, if this concerns you for performance reasons, keep an eye on **[Project Valhalla](https://openjdk.org/projects/valhalla/)** (value classes, available in preview since Java 23). The project's explicit goal is precisely to eliminate this overhead for value types, without changing your business code. Your `record Email` will eventually have the same memory footprint as a bare `String`. The pattern you adopt today will be even more performant tomorrow.

The real cost is not memory — it's migrating an existing project that abuses `String` everywhere. We'll talk about that.

## Recommendations (finally!)

After all that, here are the rules I apply daily.

1. **Don't create a Value Object for everything and anything.** The trigger signal is: two primitives of the same type in the same method signature. That's when the compiler can no longer help you. Time to act. A single `String firstName` with no ambiguous neighbor? No need to wrap it.

2. **If a validation rule exists, it belongs to the type.** An email must contain `@`, a zip code must be 5 digits: these rules have no place in a service or a controller. They belong to the type itself, via the constructor or the compact constructor. An invalid `Email` simply must not be able to exist.

3. **Group primitives that never travel alone.** The test: "would any of these fields make sense without the others?" If `street`, `city` and `zipCode` always appear together, that's an `Address`. If `latitude` and `longitude` are always together, that's `Coordinates`. Don't let implicit concepts roam around as separate primitives.

4. **On an existing project, start with the public interfaces.** No question of rewriting everything at once. REST controllers and exposed service methods are where parameter inversions cause the most damage in production, and where the gain is immediate. Internal layers can follow progressively.

5. **`@Value` if Lombok and JPA are already there, Records otherwise.** Consistent with what we've seen: `@Value` + `@With` + `@Builder` form a more complete combination on existing projects. For a new Java 16+ project with no constraints, Records are enough and add zero dependencies.

## Wrapping up

*Primitive Obsession* is one of those code smells we tolerate because the solution seemed too expensive. It no longer costs anything: Lombok's `@Value` for existing projects, Records for Java 16+. One line per type, and the compiler does the rest.

Centralized validation, the impossibility of reversing parameters, states represented in the type system: none of that is reserved for projects that have the luxury of doing DDD "properly" anymore. It fits into any Java project, without ceremony.

*Let's say that the interactions with Spring Data, JPA projections and Records will be the subject of a future post...*

**Feel free to share your use cases in the comments — especially if you've migrated an existing project to this pattern.**
