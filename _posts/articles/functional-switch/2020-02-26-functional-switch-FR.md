---
layout: post
title: Functional Switch/Case en Java 8 et +
subtitle: parce que le nouveau Switch/Case de Java 12 m'a donné cette idée saugrenue
logo: code.png
category: articles
tags: [Java, Lambda, Functional, Fluent API, Builder]
lang: fr
ref: functional-switch
permalink: /functional-switch
redirect_from:
  - /functional-switch-FR
---

<div class="intro" markdown='1'>

Java 12 est sorti le 20/03/19, apportant une nouvelle façon d'écrire des structures de contrôle `switch/case`.
Cela m'a donné une idée, certes un peu étrange, de revoir le traditionnel `switch/case` d'un point de vue
programmation fonctionnelle en s'appuyant sur des lambdas et une *petite* classe `Switch`, **le tout en JAVA 8** !

Attention toutefois, il est *certain* que cette approche est beaucoup moins performante qu'un `switch/case` classique,
mais je ne renonce pas à la beauté du geste.

Versions de cet article :

- 04/10/2019 : première publication.
- 26/02/2020 : suite à idée judicieuse postée sur les forums "developpez.com", voir la partie "Let's go further ..."

</div>

<!--excerpt-->

## Mise en jambe

Avec l'arrivée de Java 12, voici comment un nouveau bloc switch/case peut s'écrire :

```java
int initialValue = ... ; // cet entier contient une valeur arbitraire

String returnedValue;  

switch (initialValue)  
{
	case 1 -> returnedValue = "Too small!";  
	case 2, 3, 4, 5 -> returnedValue = "Good value!";  
	case 6 -> returnedValue = "Too big!";  
	default -> returnedValue = "Not applicable!";  
}  
```

Le principal problème, et c'est malheureusement bien dommage que cela n'ait pas été pris en compte dans la [JEP 325](http://openjdk.java.net/jeps/325), ce sont des **plages de valeurs**.

Typiquement, on aurait bien aimé quelque chose dans ce genre dans l'exemple précedent sur la plage de valeur `2..5` :

```java
switch (initialValue)  
{
	case 1 -> returnedValue = "Too small!";  
	case 2..5 -> returnedValue = "Good value!";  
	case 6 -> returnedValue = "Too big!";  
	default -> returnedValue = "Not applicable!";  
}  
```

Ne cherchez pas à compiler le code ci-dessus ! Il est **syntaxiquement incorrect**.

![Atari ST Bombs](/images/bombs.png)
{: style="text-align : center"}

Je me suis alors fait la réflexion suivante ...

![Pensif](/images/thinking.jpg)
{: style="text-align : center"}

« En vrai, un `switch/case` c'est globalement :

- une valeur à tester,
- un ensemble de prédicats (simples ou complexes) et une fonction associée à chacun d'entre-eux,
- un cas par défaut. »
  
*Let's code it in a functional way!*

## Usage

Je suis parti de ce que je voulais obtenir côté « utilisateur/développeur » avec quelque chose de simple :

```java
String result = Switch.of(initialValue, String.class)
                      .defaultCase(value -> value + " : no case!")
                      .single(10, value -> "10 is the best value!")
                      .single(3, value -> "3 is an exception!")
                      .resolve();
```

Dans les points clés :

- obligation de spécifier un cas par défaut, donc on commence par lui,
- ajout simple de "matching values" en associant une `function<T,R>` : `T` étant le type de la valeur testée, ici `Integer` (int auto-boxé) et `R` le type de retour, ici `String`.
- un enchaînement infini avec la methode `single` et donc du method-chaining à la mode
- la méthode terminale `resolve()` qui déclenche l'exécution globale du `Switch`.

Le type de retour est complètement générique. Dans cet exemple il s'agit d'une instance de la classe `String`.

Avec un usage plus avancé, qui permet de répondre à mon besoin de plage de valeurs, mais pas seulement :

```java
String result = Switch.of(initialValue, String.class)
                      .defaultCase(value -> value + " : no case!")
                      .predicate(value -> value > 10 && value < 15, value -> "superior to 10!")
                      .predicate(value -> value >= 0 && value <= 10, value -> value + " is between 0 and 10")
                      .single(10, value -> "10 is the best value!")
                      .single(3, value -> "3 is an exception!")
                      .resolve();
```

Revenons un peu sur cette ligne :

```java
.predicate(value -> value > 10 && value < 15, value -> "superior to 10!")
```

Elle est composée :

- du prédicat en premier argument, ici exprimé sous forme d'expression lambda `value -> value > 10 && value < 15`
- puis de la fonction à exécuter le cas échéant, toujours exprimée avec une lambda `value -> "superior to 10!"`

## Les interfaces techniques SwitchDefaultCase et SwitchRule

Pour définir une belle API *fluent*, qui impose un ordre dans l'enchaînement des méthodes, voire qui en rend obligatoire certaines,
il faut passer par la définition d'interfaces techniques qui restreignent les appels possibles en fonction du dernier appel de méthode.

> Hein ? Mais qu'est-ce qu'il dit ?

Par exemple, la méthode statique `of(...)` sera le point d'entrée et on ne pourra chaîner que la méthode `defaultCase` que l'on souhaite obligatoire. La méthode `of(...)` doit, par conséquent, retourner un ensemble restreint des méthodes autorisées.

Il en va de même pour les méthodes `defaultCase(...)`, `predicate(...)` et `single(...)`. On ne pourra pas enchaîner les `single(...)` ou `predicate(...)` tant que l'on a pas utilisé `defaultCase(...)`. De plus, on ne pourra pas déclencher `resolve()` tant que `defaultCase(...)` n'a pas été utilisé non plus. Cela assure un bon usage de la classe Switch, ce qui est le principal intérêt du method-chaining.

> Ok merci c'est plus clair maintenant !

Voici donc la première interface technique qui autorise uniquement la méthode `defaultCase(...)` :

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

Et voici la seconde interface technique qui autorise exclusivement les méthodes :

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

Notez les types de retour des méthodes qui assurent le chaînage correct pour le "method-chaining".

## La classe Switch

La classe `Switch` est assez classique :

- elle masque son constructeur pour empêcher l'instanciation. Seule la méthode `of(...)` est le point d'entrée.
- elle conserve dans un attribut `private T value` la valeur à tester.
- elle détient une `Map<T, Function <T,R>>` pour associer les valeurs simples de type `T` à des fonctions qui retourneront un résultat.
- elle détient une liste de tuples `Predicate<T>, Function<T,R>` pour gérer les cas complexes comme des plages de valeurs.
- elle détient une réference vers une fonction pour le cas par défaut : `private Function<T, R> defaultCase`,
- et enfin elle implémente bien évidemment les deux interfaces techniques `SwithDefaultCase<T, R>` et `SwitchStep<T, R>` décrites au paragraphe précédent.

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

> Notez ici l'usage de l'interface `Entry` ainsi que de la classe `SimpleEntry` de l'API Collections de Java pour obtenir une liste de tuples.

Voici la description de l'algorithme interne de la classe `Switch` :

1. une recherche dans la Map parmi les valeurs simples,
2. si rien n'est résolu, une recherche parmi la liste des prédicats,
3. si toujours rien n'est résolu, déclenchement de la fonction par défaut référencée par le champ `defaultCase`.

Cela fonctionne avec des prédicats bien plus évolués que des plages de valeurs, ce qui rend l'ensemble bien plus ouvert qu'un `switch/case` Java 12.

## Pour aller encore plus loin, petite optimisation

En l'état, c'est assez satisfaisant, mais le coût de création du Switch à chaque appel peu être très élevé.

Généralement, les différents cas et prédicats sont assez stables et évoluent assez peu au *Runtime*.

Il serait donc intéressant de pouvoir :

- construire une instance de `Switch`, sans valeur particulière,
- conserver une référence de cette instance en `static` par exemple,
- déclencher le *flow* au moyen d'une nouvelle méthode `resolve(T value)` qui prendra en argument la valeur à tester.

> C'est parti ! Let's have fun!

Première étape, on introduit une nouvelle interface qui permet de faire uniquement un `resolve(T value)`. Initialement `resolve()` n'avait pas besoin de valeur
puisque celle-ci était fournie à l'appel de la méthode `of(...)`. Cette interface, je décide de l'appeler `SwitchExpression <T, R>`.

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

Ensuite, au sein de classe `Switch`, il nous faut une nouvelle méthode de "démarrage" statique en complément de `of(...)`. 
En manque d'inspiration, je la nomme `start()`.

```java
public static <T, R> SwitchDefaultCase<T, R> start()
{
  return new Switch<T, R>();
}
```

De plus, toujours dans la classe `Switch`, il nous faut maintenant une méthode terminale de method-chaining qui retournera l'instance actuelle du `Switch`, sous forme de `SwitchExpression`. Cela imposera l'usage unique de `resolve(T value)`. J'appelle cette méthode `build()` :

```java
@Override
public SwitchExpression<T, R> build()
{
  return this;
}
```  

Et enfin il faut implementer la méthode `resolve(T value)` dans la classe `Switch` puisqu'elle implémente maintenant l'interface `SwitchExpression <T, R>`. Evidemment, je réutilise la méthode `resolve()` qui existe déjà :

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

Tout est prêt pour quelques tests unitaires **JUnit 5** :

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

Cette fois-ci le `Switch` n'est construit qu'une seule fois et peut être déclenché autant de fois que nécessaire avec une valeur différente
à chaque appel de `resolve(...)`.

## Let's go further ...

Ne nous arrêtons pas en si bon chemin !

Une remarque judicieuse sur les forums de developpez.com après publication de la première version cet article a été formulée :

> Ce serait bien si l'interface `SwitchExpression` héritait de Function <T, R>. On pourrait l'utiliser dans un Stream.map() par exemple.
> Signé "BugFactory", membre expérimenté depuis 2005.

Mais oui bien évidemment, merveilleuse idée.

Donc, on change un peu l'interface `SwitchExpression` :

```java

public interface SwitchExpression <T, R> extends Function<T, R>
{
   // unchanged content ...
}
```

Ensuite on implémente la méthode `R apply(T t)` au niveau de la classe `Switch` en ajoutant simplement ceci :

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

Et on a plus qu'à tester le comportement, ce qui est le plus compliquer à faire finalement :

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

Et voilà :

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

## Fin de l'histoire

Vous pouvez récupérer le code source de cet article ici : [https://github.com/fxrobin/functional-switch](https://github.com/fxrobin/functional-switch)

Rien à ajouter, sinon que je me suis (encore) bien amusé et qu'il s'agit de la **« fin de l'histoire »**.

![The end](/images/the-end.png)
{: style="text-align : center; width : 50%"}