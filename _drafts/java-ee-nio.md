---
layout: post
title: Non Blocking IO et Java EE
subtitle: NodeJS n'a pas l'exclusivité des non blocking IO
logo: api-preconditions.png
category: JAVA
tags:
  - Java
  - Tomcat
  - NIO2
  - NodeJS
---

# java-ee-nio

 Oula, ce post sent encore le troll sur NodeJS, mais j'en ai assez de lire de choses fausses sur Java ici et là sur divers blogs mettant en avant le côté "novateur" de NodeJS quant à sa gestion des threads \(ou plutôt de son Thread\) et des IO Non bloquantes Asynchrones.

Tomcat par exemple sait très bien le faire avec son connecteur NIO \(Non Block I/O\) depuis Tomcat 6, sorti en 2006 ! Tomcat 8 quant à lui peut s'appuyer sur Java NIO2 \(Non Block I/O v2\), depuis 2014.

Attention j'aime bien NodeJS, ce n'est pas le sujet. Ce petit article a simplement pour objectif de redorer un peu le blason de Java EE, si tant est qu'il faille le faire ...

&lt;/div&gt; 

## Objectifs

On va donc récupérer TOMCAT 9, regarder sa configuration par défaut, la modifier pour activer NIO2 pour le traitement des requêtes HTTP puis, on va mesurer les écarts.

On fera les mêmes tests avec NodeJS, parce qu'à un moment, il faut bien comparer in situ les deux solutions.

## TOMCAT 9, paramétrage

## Définition du backend REST

## Implémentation du backend avec JAX-RS

## Implémentation du backend avec NodeJS

## Test et mesures de performances

## Conclusion

