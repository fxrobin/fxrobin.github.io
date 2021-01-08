---
layout: post
title: A la découvert d'Eclipse Collections
subtitle: pour donner un coup de fouet à vos applis
logo: eclipse.png
category: articles
tags:
  - JAVA_SE
  - API
  - Eclipse Foundation
  - Collections
  - Collection
  - List
  - Set
  - Map
---

# eclipse-collections

Tout le monde connait \(ou doit connaitre\) les API Collections offertes par le JDK et notamment les interfaces de haut niveau : `Collection` et `Map` et très certainement des interfaces spécialisées comme `List` ou `Set`. Bien qu'ayant subi un léger lifting à l'occasion du passage à Java 8, notamment grâce à \(ou à cause de\) la streaming API, cette API historique souffre toujours de divers manques voire de performance dans certains cas.

Il n'est donc pas rare de voir Guava ou Apache Commons Collections être rajoutés aux dépendances d'un projet qui ont malheureusement chacune leur désavantage : dans le cas de Guava tout est récupéré et pas uniquement ce qui nous intéresse, ce qui peut être génant ... et pour Apache Commons Collections, malgré sa puissance, cette API ne supporte pas les lambdas et les références de méthodes ayant été conçue avant Java 8.

Je vais donc vous présenter **Eclipse Collections**, une API légère, performante et très efficace qui gagne à être connue. &lt;/div&gt; 

## A vos marques ! Prêts ? Partez !

On commence donc par un projet Maven classique avec son POM Java 8 SE, ainsi que les dépendances vers Eclipse Collections, auquel on ajoute JUnit 5, SLF4J et Lombok pour faire nos petits essais.

Voici à quoi ressemble notre `pom.xml`

```markup
<dependency>
  <groupId>org.eclipse.collections</groupId>
  <artifactId>eclipse-collections-api</artifactId>
  <version>9.2.0</version>
</dependency>

<dependency>
  <groupId>org.eclipse.collections</groupId>
  <artifactId>eclipse-collections</artifactId>
  <version>9.2.0</version>
</dependency>
```

## Petit tour de l'API

## Exemples concrêts

## Conclusions

