---
layout: post
title: Functional Switch/Case with Java 8+
subtitle: because the new Switch/Case statement with Java 12 gave me a weird idea
logo: code.png
category: articles
tags: [Java, Lambda, Functional, Fluent API, Builder]
lang: en
ref: functional-switch
permalink: /functional-switch-en
---

<div class="intro" markdown='1'>

Java 12 was released on 20/03/19, bringing a new way to write `switch/case` control structures.
This gave me an idea, admittedly a bit strange, to revisit the traditional `switch/case` from a
functional programming point of view by using lambdas and a *small* `Switch` class, **all in JAVA 8**!

Be careful though, it is *certain* that this approach is much less efficient than a classic `switch/case`,
but I don't give up the beauty of the gesture.

Versions of this article:

- 04/10/2019: first publication.
- 26/02/2020 : following a judicious idea posted on "developpez.com" forums, see the "Let's go further ..." part.

</div>

<!--excerpt-->

## Getting started

With the arrival of Java 12, here is how a new switch/case block can be written:

```java
int initialValue = ... ; // this integer contains an arbitrary value

String returnedValue;  

switch (initialValue)  
{
	case 1 -> returnedValue = "Too small!";  
	case 2, 3, 4, 5 -> returnedValue = "Good value!";  
	case 6 -> returnedValue = "Too big!";  
	default -> returnedValue = "Not applicable!";  
}  
```

The main problem, and it's a pity that this was not taken into account in [JEP 325](http://openjdk.java.net/jeps/325), is the **value ranges**.

Typically, we would have liked something like this in the above example on the value range `2..5`:

```java
switch (initialValue)  
{
	case 1 -> returnedValue = "Too small!";  
	case 2..5 -> returnedValue = "Good value!";  
	case 6 -> returnedValue = "Too big!";  
	default -> returnedValue = "Not applicable!";  
}  
```

Do not try to compile the above code! It is **syntactically incorrect**.

![Atari ST Bombs](/images/bombs.png)
{: style="text-align: center"}

I then thought to myself ...

![Thinking](/images/thinking.jpg)
{: style="text-align: center"}

"In reality, a `switch/case` is globally :

- a value to test,
- a set of predicates (simple or complex) and a function associated to each of them,
- a default case.
  
*Let's code it in a functional way!

## Usage

I started from what I wanted to achieve on the user/developer side with something simple:

```java
String result = Switch.of(initialValue, String.class)
                      .defaultCase(value -> value + " : no case!")
                      .single(10, value -> "10 is the best value!")
                      .single(3, value -> "3 is an exception!")
                      .resolve();
```

Key points:

- obligation to specify a default case, so we start with it,
- simple addition of "matching values" by associating a `function<T,R>` : `T` being the type of the tested value, here `Integer` (auto-boxed int) and `R` the return type, here `String`.
- infinite chaining with the `single` method and thus fashionable method-chaining
- the `resolve()` terminal method which triggers the global execution of the `Switch`.

The return type is completely generic. In this example it is an instance of the `String` class.

With a more advanced usage, which meets my need for a range of values, but not only :

```java
String result = Switch.of(initialValue, String.class)
                      .defaultCase(value -> value + " : no case!")
                      .predicate(value -> value > 10 && value < 15, value -> "superior to 10!")
                      .predicate(value -> value >= 0 && value <= 10, value -> value + " is between 0 and 10")
                      .single(10, value -> "10 is the best value!")
                      .single(3, value -> "3 is an exception!")
                      .resolve();
```

Let's go back to this line:

```java
.predicate(value -> value > 10 && value < 15, value -> "superior to 10!")
```

It is composed of :

- the predicate as first argument, here expressed as a lambda expression `value -> value > 10 && value < 15`
- then the function to be executed, always expressed with a lambda `value -> "superior to 10!`

## The SwitchDefaultCase and SwitchRule technical interfaces

To define a nice *fluent* API, which imposes an order in the sequence of methods, or even makes some of them mandatory,
you have to define technical interfaces that restrict the possible calls according to the last method call.

> Huh? But what does it say?

For example, the static method `of(...)` will be the entry point and we can only chain the `defaultCase` method we want to be mandatory. The `of(...)` method must, therefore, return a restricted set of allowed methods.

The same applies to the `defaultCase(...)`, `predicate(...)` and `single(...)` methods. You cannot chain `single(...)` or `predicate(...)` until you have used `defaultCase(...)`. Also, `resolve()` cannot be triggered until `defaultCase(...)` has been used as well. This ensures a good use of the Switch class, which is the main interest of method-chaining.

> Ok thanks, it's clearer now!

So here is the first technical interface that only allows the `defaultCase(...)` method:

```java
package fr.fxjavadevblog.fs;

import java.util.function.Function;

/**
 * technical interface to restrict method chaining to legal operation order.
 * 
 * @author F.X. Robin
 *
 * @param <T>
 * @param <R>
 */
public interface SwitchDefaultCase <T,R>
{
  /**
   * set the default function that will be executed if no single value nor predicate matches
   * the current value of the switch instance.
   * 
   * @param function
   *    called function when o single value nor predicates matches the current value.
   * @return
   *    current instance of the switch which allows method chaining.
   */
  SwitchStep<T, R> defaultCase(Function<T, R> function);
}
```

And here is the second technical interface that exclusively allows:

- `single(...)`
- `predicate(...)`
- `resolve(...)`

```java
package fr.fxjavadevblog.fs;

import java.util.function.Function;
import java.util.function.Predicate;


/**
 * technical interface to restrict method chaining to use the appropriate operation order.
 * 
 * @author F.X. Robin
 *
 * @param <T>
 * @param <R>
 */
public interface SwitchStep <T,R>
{
  /**
   * binds a value with a function to execute.
   * 
   * @param value
   *    value to test.
   * @param function
   *    function to run if the test succeeds.
   * @return
   *    current instance of the switch which allows method chaining.
   */
  SwitchStep<T, R> single(T value, Function<T, R> function);
  
  /**
   * appends a predicate mapped with a function.
   * 
   * @param predicate
   *    predicate that will be evaluated with the value of the current switch.
   * @param function
   *    function that will be executed if the predicate returns true.
   * @return
   *    current instance of the switch which allows method chaining.
   */
  SwitchStep<T, R> predicate(Predicate<T> predicate, Function<T, R> function);
  
  /**
   * last operation of the switch method chaining which executes the flow
   * of the rules looking for a matching single value, then the list of predicates, then the
   * default function.
   * 
   * @return
       the result of the switch flow.
   */
  R resolve();
}
```

Note the return types of the methods that ensure the correct chaining for method-chaining.

## The Switch class

The `Switch` class is quite classical:

- it hides its constructor to prevent instantiation. Only the `of(...)` method is the entry point.
- it keeps in a `private T value` attribute the value to test.
- it holds a `Map<T, Function <T,R>>` to associate simple values of type `T` with functions that will return a result.
- it holds a list of `Predicate<T>, Function<T,R>` tuples to handle complex cases like ranges of values.
- it has a reference to a function for the default case: `private Function<T,R> defaultCase`,
- and finally it implements of course the two technical interfaces `SwithDefaultCase<T, R>` and `SwitchStep<T, R>` described in the previous paragraph.

```java
package fr.fxjavadevblog.fs;

import java.util.AbstractMap.SimpleEntry;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.function.Function;
import java.util.function.Predicate;

/**
 * an implementation of a "switch-like" structure which can return a value and
 * allows functional calls. The switch flow is built through method chaining.
 * 
 * @author F.X. Robin
 *
 * @param <T>
 *          type of the tested value
 * @param <R>
 *          type of the returned value
 */
public final class Switch<T, R> implements SwitchDefaultCase<T, R>, SwitchStep<T, R>
{
  /**
   * function executed when no value has been found.
   */
  private Function<T, R> defaultCase;
  
  /**
   * value to evaluate.
   */
  private T value;

  /**
   * map of functions keyed by the matching value.
   * Chosen implementation is LinkedHashMap in order to preserve insertion order while iterating over the entries.
   */
  private Map<T, Function<T, R>> singleValuefunctions = new LinkedHashMap<>();

  /**
   * map of functions keyed by predicates. All the predicates are tested.
   */
  private List<Entry<Predicate<T>, Function<T, R>>> predicates = new LinkedList<>();

  /**
   * hidden constructor. the "of" method is the only starting point for building
   * an instance.
   */
  private Switch()
  {

  }

  /**
   * initiates the switch flow with the value to test and the returning type.
   *
   * @param value
   *          value to test
   * @param clazz
   *          returning type
   * @return a new instance of the switch which allows method chaining
   */
  public static <T, R> SwitchDefaultCase<T, R> of(T value, Class<R> clazz)
  {
    Switch<T, R> switchExpression = new Switch<>();
    switchExpression.value = value;
    return switchExpression;
  }

  /**
   * @see {@link SwitchDefaultCase#defaultCase(Function)}
   */
  @Override
  public SwitchStep<T, R> defaultCase(Function<T, R> function)
  {
    this.defaultCase = function;
    return this;
  }

  /**
   * @see {@link SwitchStep#resolve()}
   */
  @Override
  public R resolve()
  {
    return singleValuefunctions.containsKey(value) ? singleValuefunctions.get(value).apply(value) : findAndApplyFirstPredicate();
  }

  // only to reduce complexity in this class.
  private R findAndApplyFirstPredicate()
  {
    return predicates.stream()
                     .filter(p -> p.getKey().test(value))
                     .map(p -> p.getValue().apply(value))
                     .findFirst()
                     .orElse(this.defaultCase.apply(value));
  }

  /**
   * @see {@link SwitchStep#single(Object, Function)}
   */
  @Override
  public SwitchStep<T, R> single(T value, Function<T, R> function)
  {
    singleValuefunctions.put(value, function);
    return this;
  }

  /**
   * @see {@link SwitchStep#predicate(Predicate, Function)}
   */
  @Override
  public SwitchStep<T, R> predicate(Predicate<T> predicate, Function<T, R> function)
  {
    SimpleEntry<Predicate<T>, Function<T, R>> simpleEntry = new SimpleEntry<>(predicate, function);
    predicates.add(simpleEntry);
    return this;
  }
}
```

> Note here the use of the `Entry` interface as well as the `SimpleEntry` class of the Java Collections API to get a list of tuples.

Here is the description of the internal algorithm of the `Switch` class:

1. a search in the Map among the simple values,
2. if nothing is resolved, a search among the list of predicates,
3. if still nothing is resolved, trigger the default function referenced by the `defaultCase` field.

This works with much more advanced predicates than ranges of values, which makes the set much more open than a Java 12 switch/case.

## To go even further, a little optimization

As it is, it is quite satisfactory, but the cost of creating the switch at each call can be very high.

Generally, the different cases and predicates are quite stable and evolve little at *Runtime*.

It would therefore be interesting to be able to :

- build an instance of `Switch`, with no particular value,
- keep a reference of this instance in `static` for example,
- trigger the *flow* with a new `resolve(T value)` method which will take the value to be tested as argument.

> Let's go! Let's have fun!

First step, we introduce a new interface which allows to do only a `resolve(T value)`. Initially `resolve()` did not need a value
since it was provided when calling the `of(...)` method. This interface, I decide to call it `SwitchExpression <T, R>`.

```java
package fr.fxjavadevblog.fs;

/**
 * represents a fully constructed Switch instance which can resolve a specific value.
 * 
 * @author F.X. Robin
 *
 * @param <T>
 * @param <R>
 */
public interface SwitchExpression <T, R>
{
  /**
   * last operation of the switch method chaining which executes the flow
   * of the rules looking for a matching single value, then the list of predicates, then the
   * default function.
   * 
   * @param value
   *          value to test
   * @return
   *          result of the Switch flow.
   */
  R resolve(T value);
}
```

Then, within the `Switch` class, we need a new static `start` method in addition to `of(...)`. 
For lack of inspiration, I call it `start()`.

```java
public static <T, R> SwitchDefaultCase<T, R> start()
{
  return new Switch<T, R>();
}
```

Also, still in the `Switch` class, we now need a method-chaining end method that will return the current instance of the `Switch`, in the form of a `SwitchExpression`. This will require the unique use of `resolve(T value)`. I call this method `build()` :

```java
@Override
public SwitchExpression<T, R> build()
{
  return this;
}
```  

And finally we need to implement the `resolve(T value)` method in the `Switch` class since it now implements the `SwitchExpression <T, R>` interface. Obviously, I reuse the `resolve()` method that already exists:

```java
/**
* @see {@link SwitchExpression#resolve(T)}
*/
@Override
public R resolve(T value)
{
  this.value = value;
  return resolve();
}
```

Everything is ready for some unit tests **JUnit 5** :

```java
public class SwitchTest
{
  public static SwitchExpression<Integer, String> localSwitch;

  @BeforeAll
  public static void init()
  {
    localSwitch = Switch.<Integer, String> start()
                        .defaultCase(value -> value + " : no case!")
                        .predicate(value -> value > 10 && value < 15, value -> "superior to 10!")
                        .predicate(value -> value >= 0 && value <= 10, value -> value + " is between 0 and 10")
                        .single(10, value -> "10 is the best value!")
                        .single(3, value -> "3 is an exception!")
                        .build();
  }

  @Test
  public void staticTest3()
  {
    assertEquals("3 is an exception!", localSwitch.resolve(3));
  }
  
  @Test
  public void staticTest5()
  {
    assertEquals("5 is between 0 and 10", localSwitch.resolve(5));
  }
}
```  

This time the switch is built only once and can be triggered as many times as needed with a different value
each time `resolve(...)` is called.

## Let's go further ...

Let's not stop here!

A wise remark on the developpez.com forums after publication of the first version of this article was made:

> It would be nice if the `SwitchExpression` interface inherited from Function <T, R>. We could use it in a Stream.map() for example.
> Signed "BugFactory", experienced member since 2005.

But yes of course, wonderful idea.

So, we change the `SwitchExpression` interface a bit:

```java

public interface SwitchExpression <T, R> extends Function<T, R>
{
   // unchanged content ...
}
```

Then we implement the `R apply(T t)` method in the `Switch` class by simply adding this:

```java
/**
  * implementation of Function.apply in order to use it as Function<T,R> in
  * Stream.map(...) for example.
  *
  */
@Override
public R apply(T value)
{
  return resolve(value);
}
```

And we only have to test the behavior, which is the most complicated to do:

```java
@Test
public void StreamMapTest()
{
  // switcher could have been written in the map method of the Stream.of(), 
  // but it's defined here for readability only.
  SwitchExpression<Integer, String> switcher = Switch.<Integer, String> start()
                                                     .defaultCase(v -> "ODD")
                                                     .predicate(v -> v % 2 == 0, v -> "EVEN")
                                                     .build();

  // just to check thats everything is fine
  assertNotNull(switcher, "cannot build the switcher");

  // let's run the Stream.map which will call the switcher.
  // the switcher implements Function <R, T> and its apply(T t) method.
  List<String> result = Stream.of(0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
                              .map(switcher)
                              .collect(Collectors.toList());

  // few tests on the list
  assertNotNull(result, "the returned list is null, which is unacceptable!");
  assertEquals(10, result.size(), "the returned list size is wrong, which is totally unacceptable!");
  
  // then lets count the EVEN and the ODD to verify the switcher behavior inside a Stream.map().
  
  Map<String, Long> statistics = result.stream().collect(Collectors.groupingBy(String::toString, Collectors.counting()));
  
  assertNotNull(statistics, "the returned map is null, which is unbelievable!");
  assertEquals(5L, statistics.get("ODD").longValue());
  assertEquals(5L, statistics.get("EVEN").longValue());
  
  // it's working!
  
}
```

Here is the result:

```bash
$ mvn test
[INFO] Scanning for projects...
[INFO] 
[INFO] -----------------< fr.fxjavadevblog:functional-switch >-----------------
[INFO] Building functional-switch 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:2.6:resources (default-resources) @ functional-switch ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.1:compile (default-compile) @ functional-switch ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:2.6:testResources (default-testResources) @ functional-switch ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.1:testCompile (default-testCompile) @ functional-switch ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.0:test (default-test) @ functional-switch ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running fr.fxjavadevblog.fs.SwitchTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.05 s - in fr.fxjavadevblog.fs.SwitchTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  1.938 s
[INFO] Finished at: 2020-02-26T17:54:51+01:00
[INFO] ------------------------------------------------------------------------
```

## End of the story

You can get the source code of this article here: [https://github.com/fxrobin/functional-switch](https://github.com/fxrobin/functional-switch)

Nothing to add, except that I had a lot of fun (again) and that this is the **"end of the story "**.

[The end](/images/the-end.png)
{: style="text-align: center; width: 50%"}
