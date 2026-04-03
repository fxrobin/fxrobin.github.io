---
layout: post
title: "Eclipse Collections : l'API Collections que vous ne connaissez pas (encore)"
subtitle: "Parce que les Stream c'est bien, mais parfois on peut faire tellement mieux"
logo: eclipse.png
category: articles
tags: [Java, Collections, Eclipse Collections, API, Fonctionnel, Lambda]
lang: fr
ref: eclipse-collections
permalink: /eclipse-collections/
---

<div class="intro" markdown='1'>

Tout le monde connait (ou doit connaitre) les API Collections offertes par le JDK et notamment les interfaces de haut niveau : `Collection`, `Map` et très certainement les interfaces spécialisées comme `List` ou `Set`.

Bien qu'ayant subi un léger lifting lors du passage à Java 8, notamment grâce à (ou à cause de) la Stream API, cette API historique souffre toujours de divers manques et d'une verbosité parfois pénible.

Il n'est donc pas rare de voir Guava ou Apache Commons Collections ajoutées aux dépendances d'un projet, chacune avec ses inconvénients : Guava embarque tout (y compris ce qu'on ne veut pas), et Apache Commons Collections ne supporte pas les lambdas, ayant été conçue avant Java 8.

Je vais donc vous présenter **Eclipse Collections**, une API légère, performante et vraiment efficace qui gagne à être connue. Et je vais vous montrer concrètement pourquoi, une fois qu'on y a goûté, on ne revient pas en arrière.

</div>

<!--excerpt-->

## Le constat : la Stream API, c'est bien ... mais verbeux

Prenons un exemple simple. On a une liste de super-héros, et on veut récupérer ceux qui habitent à Gotham, transformer leurs noms en majuscules, et obtenir une nouvelle liste.

Avec le JDK classique :

```java
List<String> nomsGothamiens = personnes.stream()
    .filter(p -> "Gotham".equals(p.getVille()))
    .map(Personne::getNom)
    .map(String::toUpperCase)
    .collect(Collectors.toList());
```

Ca fonctionne très bien. Mais on passe systématiquement par `.stream()`, `.collect()`, `Collectors.toList()`. C'est verbeux, et ca devient vite lourd quand on enchaîne les opérations.

Voici le même code avec Eclipse Collections :

```java
MutableList<String> nomsGothamiens = personnes
    .select(p -> "Gotham".equals(p.getVille()))
    .collect(Personne::getNom)
    .collect(String::toUpperCase);
```

Les opérations sont directement sur la collection. Plus de `.stream()`, plus de `.collect(Collectors.toList())`. On lit le code comme une phrase.

Ca commence bien. Allons plus loin.

## A vos marques ! Prêts ? Partez !

On commence par un projet Maven classique en Java 17, avec les dépendances vers Eclipse Collections, Lombok pour nos classes de domaine, et JUnit 5 pour les tests.

`pom.xml`
```xml
<properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>

<dependencies>
    <dependency>
        <groupId>org.eclipse.collections</groupId>
        <artifactId>eclipse-collections-api</artifactId>
        <version>12.0.0</version>
    </dependency>
    <dependency>
        <groupId>org.eclipse.collections</groupId>
        <artifactId>eclipse-collections</artifactId>
        <version>12.0.0</version>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.32</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

> Deux artefacts Maven pour Eclipse Collections : l'API (`eclipse-collections-api`) et l'implémentation (`eclipse-collections`). C'est la même séparation que pour SLF4J : on dépend de l'API, l'implémentation arrive à l'exécution. Ici on prend les deux, mais c'est une bonne habitude d'y penser.

Notre classe de domaine pour tous les exemples, avec Lombok pour éviter le boilerplate (voir [l'article dédié](/Lombok-Oui-Mais/) si ce n'est pas encore fait) :

```java
@Value
@Builder
public class Personne {
    String nom;
    int age;
    String ville;
}
```

Et notre jeu de données :

```java
MutableList<Personne> personnes = Lists.mutable.of(
    Personne.builder().nom("Bruce").age(32).ville("Gotham").build(),    // Batman
    Personne.builder().nom("Peter").age(17).ville("Metropolis").build(), // Spider-Man
    Personne.builder().nom("Tony").age(45).ville("Gotham").build(),      // Iron Man
    Personne.builder().nom("Natasha").age(28).ville("Wakanda").build(),  // Black Widow
    Personne.builder().nom("Dick").age(15).ville("Metropolis").build(),  // Robin
    Personne.builder().nom("Carol").age(38).ville("Gotham").build()      // Captain Marvel
);
```

Notez la factory `Lists.mutable.of(...)`. Eclipse Collections propose des factories pour tous ses types : `Lists`, `Sets`, `Maps`, `Bags`. Très pratique et très lisible.

## Petit tour de l'API

### select et reject : filtrer dans les deux sens

`select` est l'équivalent de `Stream.filter`. Mais Eclipse Collections offre aussi `reject`, l'opération inverse, qui n'a pas d'équivalent direct en Stream API.

```java
// Les majeurs
MutableList<Personne> majeurs = personnes.select(p -> p.getAge() >= 18);

// Les mineurs (sans inverser le prédicat manuellement)
MutableList<Personne> mineurs = personnes.reject(p -> p.getAge() >= 18);
```

Avec la Stream API, pour `reject` on serait obligé d'écrire `filter(p -> !(p.getAge() >= 18))`. Ca marche, mais `reject` est tellement plus expressif.

### collect : transformer les éléments

`collect` ici correspond à `Stream.map` (attention, pas de confusion avec `Collectors.toList()` de la Stream API).

```java
// Les noms de tous les résidents de Gotham, en majuscules
MutableList<String> nomsGothamiens = personnes
    .select(p -> "Gotham".equals(p.getVille()))
    .collect(Personne::getNom)
    .collect(String::toUpperCase);

System.out.println(nomsGothamiens.makeString(", "));
```

```
BRUCE, TONY, CAROL
```

`makeString(separator)` remplace avantageusement `Collectors.joining()`. Petit, pratique, lisible.

### partition : diviser une collection en deux d'un coup

Ca, c'est un vrai coup de coeur. `partition` découpe la collection en deux parts selon un prédicat, et retourne un `PartitionMutableList` avec les deux.

```java
PartitionMutableList<Personne> partition = personnes.partition(p -> p.getAge() >= 18);

MutableList<Personne> majeurs  = partition.getSelected();
MutableList<Personne> mineurs  = partition.getRejected();
```

Avec la Stream API, obtenir les deux groupes en un seul passage nécessite `Collectors.partitioningBy`, qui retourne une `Map<Boolean, List<T>>`. C'est fonctionnel mais peu expressif. `getSelected()` et `getRejected()` sont nettement plus parlants que `get(true)` et `get(false)`.

### groupBy : regrouper sans effort

```java
MutableListMultimap<String, Personne> parVille = personnes.groupBy(Personne::getVille);

MutableList<Personne> metropolisiens = parVille.get("Metropolis");
```

Le résultat est un `Multimap` : une map dont les valeurs sont des collections. C'est exactement ce dont on a besoin pour grouper, et c'est bien plus pratique que `Collectors.groupingBy` qui retourne une `Map<K, List<V>>`.

```java
// Afficher le nombre de héros par ville
parVille.forEachKeyMultiValues((ville, habitants) ->
    System.out.printf("%s : %d héros%n", ville, habitants.size())
);
```

```
Gotham : 3 héros
Metropolis : 2 héros
Wakanda : 1 héros
```

### Les collections de primitifs : adieu le boxing

C'est peut-être la fonctionnalité la plus méconnue d'Eclipse Collections. Le JDK n'a pas de `List<int>` : on est obligé de passer par `List<Integer>`, avec le boxing/unboxing que ca implique.

Eclipse Collections propose des collections de primitifs : `IntList`, `LongList`, `DoubleList`, etc.

```java
// Extraire les ages dans une IntList, sans boxing
IntList ages = personnes.collectInt(Personne::getAge);

int ageMin   = ages.min();
int ageMax   = ages.max();
double ageMoyen = ages.average();

System.out.printf("Ages : min=%d, max=%d, moyenne=%.1f%n", ageMin, ageMax, ageMoyen);
```

```
Ages : min=15, max=45, moyenne=29,2
```

Pas de `mapToInt().summaryStatistics()`. Juste `.collectInt()` et les méthodes statistiques sont directement là. Pratique et performant.

### anySatisfy, allSatisfy, noneSatisfy

Ces trois méthodes correspondent à `anyMatch`, `allMatch`, `noneMatch` de Stream, mais encore une fois sans passer par `.stream()`.

```java
boolean auMoinsUnGothamien = personnes.anySatisfy(p -> "Gotham".equals(p.getVille()));  // true
boolean tousMajeurs        = personnes.allSatisfy(p -> p.getAge() >= 18);               // false
boolean aucunRetraite      = personnes.noneSatisfy(p -> p.getAge() >= 65);              // true
```

## Mutabilité et immutabilité : un choix explicite

Un aspect souvent négligé dans le JDK : `Collections.unmodifiableList()` retourne une vue non modifiable, mais ca reste une `List` standard. Rien dans le type n'indique que la liste est immuable.

Eclipse Collections rend ca explicite au niveau du type.

```java
// Mutable
MutableList<Personne> mutable = Lists.mutable.of(bruce, peter);
mutable.add(tony); // OK

// Immutable : le type le dit clairement
ImmutableList<Personne> immutable = Lists.immutable.of(bruce, peter);
immutable.add(tony); // Ne compile pas
```

Et la conversion dans les deux sens est triviale :

```java
ImmutableList<Personne> figee     = mutable.toImmutable();
MutableList<Personne>   modifiable = immutable.toList();
```

## Préconisations (enfin !)

Quelques recommandations après usage :

* **Interopérabilité** : si votre API publique retourne des `List<T>` JDK, utilisez `.toList()` avant de retourner. Ne pas exposer les types EC dans les signatures publiques si le contexte ne s'y prête pas.
* **Pas de migration en bloc** : Eclipse Collections s'ajoute progressivement. On l'utilise là où ca apporte de la lisibilité, pas pour tout réécrire d'un coup.
* **`Bag<T>` pour les fréquences** : si vous avez besoin de compter des occurrences, `MutableBag<T>` remplace avantageusement un `Map<T, Integer>` fait main.
* **Primitives pour la perf** : si vous manipulez de grands volumes de données numériques, les collections de primitifs (`IntList`, `LongList`, `DoubleList`) évitent le boxing et font une vraie différence.

## En guise de conclusion

Eclipse Collections, c'est une API qui fait une chose et la fait bien : rendre la manipulation de collections plus expressive, plus lisible, et souvent plus performante. Elle ne remplace pas la Stream API (les deux coexistent très bien), mais elle offre une alternative directe et moins verbeuse pour la majorité des cas du quotidien.

`select`, `reject`, `partition`, `groupBy`, `collectInt`... une fois qu'on a ces outils en main, revenir aux `stream().filter().collect(Collectors.toList())` parait vraiment laborieux.

Il reste encore beaucoup à explorer : les `Bag`, les `Multimap` avancées, les `LazyIterable` pour l'évaluation différée, et les `SortedMap` / `BiMap`. On va dire que ca fera l'objet d'un prochain billet...

**N'hésitez pas à me faire part de vos usages d'Eclipse Collections en commentaire, ou des cas où vous avez préféré rester sur la Stream API.**
