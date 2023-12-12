---
layout: post
title: Mon architecture au Père Noël
subtitle: Quelle serait mon architecture applicative rêvée
logo: brain-logo.png
category: articles
tags: [Architecture, Java, CleanCode, CleanArchitecture]
lang: fr
ref: x-mas-architecture
permalink: /x-mas-architecture-fr/
---

<div class="intro" markdown='1'>
Quel architecte n'a jamais rêvé de partir d'une feuille blanche et créer une nouvelle application
sans aucune contrainte ? C'est ce que je vous propose de faire dans cet article.
</div>

<!--excerpt-->

## Cadre

> Bah alors ? Je pensais qu'il n'y avait pas de contrainte et voilà que tu nous sors une première partie "Cadre" ?! WTF!

Certes, il faut quand même un peu donner un peu de contexte avant de définir une architecture technique :
- on veut du Java. Pourquoi ? Parce que c'est super et que c'est bien et qu'on aime beaucoup ;
- on veut développer un backend pour une application web de réservation de supports numériques "old school" de Retro-Gaming / Computing. En gros c'est comme un vidéo-club mais orienté "Retro". Une application de gestion classique avec des clients, des supports, des réservations, des locations, etc.
- on veut pouvoir être appelé par des partenaires, et réciproquement au moyen d'API sur HTTPS ;
- on veut du code robuste, testé, audité et déployable très rapidement ;
- on veut pouvoir faire évoluer le système sans tout casser et surtout à moindre coût.
- on veut que les développeurs aient un environnement standardisé

## Partie "JAVA"

Notez les guillements, car cette partie va être verbeuse.

Cher Père Noël, je veux :
- Java 11 (ou plus) version Amazon Corretto
- Maven 3.x.x
- Quarkus 3.5.x :
    - Panache
    - RestAssured
    - Jackson
- Lombok 1.18.x
- JUnit 5
- AssertJ (même pour le code source qui n'est pas du code de test unitaire)

## Partie "DATA"

Cher Père Noël, je veux :
- PostgreSQL 13.x.x
- Liquibase 4.x.x

## Partie "Interop++"

Cher Père Noël, je veux :
- Kong Gateway for Open Source
- Keycloak

## Partie "DevOps"

Cher Père Noël, je veux :
- Github Enterprise
- Code Factor
- Nexus Repository Manager OSS
- VM sur Google Cloud Platform
- VSCode (+ Github Copilot)