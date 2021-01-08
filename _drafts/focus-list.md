---
layout: post
title: Focus sur List <T> en Java
subtitle: cachez moi cette ArrayList que je ne saurais voir !
logo: java.png
category: JAVA
tags:
  - Java
  - Craftsmanship
---

# focus-list

A force de faire le tour des divers exemples et tutos en Java, je suis frappé comme à chaque fois l'implémentation de `List<T>` choisie est toujours `ArrayList`.

De fait, tout le monde utilise `ArrayList` sans trop réfléchir et pourtant cela à un impact sur les performances. Dans cet article, on parlera donc de complexité algorithme, mais rassurez-vous, rien de bien compliqué !

&lt;/div&gt; 

## Ah parce qu'il y plusieurs implémentations de List ?

A ne consulter que des exemples avec `ArrayList` on en oublierait presque qu'il faut faire un choix au moment du développement.

Et effectivement, dans les implémentations par défaut du JDK, on peut choisir entre :

* `ArrayList` : fondée sur les tableaux
* `LinkedList` :  fondée sur une liste chainée
* `Stack` et `Vector` : retro-compatibilité depuis Java 1.0 !

Cet article va simplement évoquer les différences entre `ArrayList` et `LinkedList`

## Conclusion

