# SPEC — Article : UUID, de v1 à v7 — versions, représentations, alternatives et benchmarks JMH

**Statut :** spec, pas encore de fichier article  
**Catégorie :** `articles`  
**Langue :** `fr`  
**Audience :** développeur Java intermédiaire, utilise `UUID.randomUUID()` sans se poser de questions  
**Java cible :** Java 21+ (JMH via Maven)  

---

## Angle éditorial

Tout le monde utilise `UUID.randomUUID()` en Java. Presque personne ne sait qu'il existe 8 versions, que v4 est catastrophique pour les index B-tree, que v7 règle ça élégamment, et que la représentation 36 caractères avec tirets est souvent un gaspillage. L'article part de la douleur concrète (lenteur d'insertion en base, UUID v4 non sortable) et remonte à la théorie, puis aux solutions pratiques.

Fil rouge : **générer un identifiant pour une entité persistée en base de données** — quel UUID choisir, sous quelle forme, avec quelle bibliothèque ?

Ton : vouvoiement (article Java/tech).

---

## Accroche pressentie (pattern "idée reçue fracassée")

```java
// Ce que tout le monde fait
UUID id = UUID.randomUUID(); // "ça marche, non ?"

// Ce que PostgreSQL voit dans son index B-tree
// a3f1b2c4-... puis 00012345-... puis f9e8d7c6-...
// Insertions aléatoires → fragmentation → performances dégradées
```

Promesse : à la fin, vous saurez choisir la bonne version, la bonne représentation, la bonne bibliothèque — et vous aurez des chiffres JMH pour le prouver.

---

## Plan de sections

```
<div class="intro">  ← idée reçue + douleur index B-tree + promesse
<!--excerpt-->

## Qu'est-ce qu'un UUID, vraiment ?
  → RFC 9562 (révision 2024 de la RFC 4122)
  → Structure : 128 bits, 5 champs, version (bits 48-51), variant (bits 64-65)
  → Représentation canonique : 36 chars hex + tirets — et pourquoi c'est verbeux

## Les versions — tour d'horizon
  → v1 : time-based + MAC address (sortable, mais fuite d'infos réseau)
  → v2 : DCE Security (quasi-mort, historique seulement)
  → v3 : namespace + MD5 (déterministe, reproductible)
  → v4 : full random (le plus utilisé, le moins adapté aux index)
  → v5 : namespace + SHA-1 (v3 en mieux)
  → v6 : reordered time (v1 reordonné pour tri, peu supporté)
  → v7 : Unix Epoch ms + random (★ le nouveau standard recommandé)
  → v8 : custom (expérimental, défini par l'implémenteur)

## UUID v7 — pourquoi c'est important pour vos bases de données
  → Structure : 48 bits timestamp ms | 4 bits version | 12 bits seq | 62 bits random
  → Tri lexicographique = tri chronologique = insertions B-tree ordonnées
  → Impact concret : fragmentation réduite, index plus denses, perf INSERT améliorée
  → Support natif : PostgreSQL 17+, MySQL 9+, pas encore java.util.UUID (Java 26 ?)

## Représentations alternatives — quand 36 caractères c'est trop
  → Base64 URL-safe : 22 chars (UUID encodé en base64, perte des tirets)
  → Base32 / ULID : 26 chars, sortable, lisible humain
  → Short UUID : encode/décode un UUID standard en base58 (~22 chars)
  → NanoID : pas un UUID — identifiant court URL-safe, non-déterministe
  → Tableau comparatif : longueur / sortable / URL-safe / UUID-compatible / lisibilité

## Bibliothèques Java — l'écosystème
  → `java.util.UUID` — v4 seulement nativement (+ v3 via nameUUIDFromBytes)
  → `java-uuid-generator` (JUG, FasterXML) — v1 à v7, mature, battle-tested
  → `uuid-creator` (f4b6a912) — API fluente, toutes versions, très rapide
  → `com.github.f4b6a912:ulid-creator` — ULID dédié
  → Dépendance Maven pour chaque bibliothèque

## Benchmarks JMH — les chiffres qui tranchent
  → Setup : Maven + JMH plugin, Java 21+
  → Scénarios benchmarkés :
    - `UUID.randomUUID()` (v4 JDK)
    - JUG v4, v7
    - uuid-creator v4, v7
    - Short UUID encoding d'un v7
    - ULID (ulid-creator)
  → Métriques : throughtput (ops/ms), allocation mémoire (via GC profiler)
  → Résultats commentés : quel gagnant pour quel cas d'usage

## Préconisations (enfin !)
  → Règle d'or : UUIDv7 pour tout identifiant persisté en base relationnelle
  → Représentation : canonique si interop standard, base58 si URL/lisibilité
  → Bibliothèque : uuid-creator si perf prioritaire, JUG si maturité/écosystème
  → Quand utiliser NanoID/ULID plutôt qu'UUID

## En guise de conclusion
  → Récap 3 décisions : version / représentation / bibliothèque
  → UUID v4 n'est pas "mauvais" — juste inadapté aux index
  → Lien vers spec Loom (suite possible : UUID v7 comme corrélation ID dans structured concurrency)
```

---

## Code démo / projet à produire

Projet Maven (`java 21`, `jmh-core`, `jmh-generator-annprocess`) :

```
src/
  main/java/
    UuidShowcase.java       ← exemples de génération par version, affichage structure
    RepresentationDemo.java ← même UUID en canonique / base64 / base58 / ULID
  jmh/java/
    UuidBenchmark.java      ← @Benchmark pour chaque lib + version
```

Dépendances Maven à inclure dans l'article :
- `com.fasterxml.uuid:java-uuid-generator` (JUG)
- `com.github.f4b6a912:uuid-creator`
- `com.github.f4b6a912:ulid-creator`
- `org.openjdk.jmh:jmh-core` + `jmh-generator-annprocess`

---

## Points techniques à valider avant rédaction

- [ ] Vérifier support UUID v7 natif dans Java 26 (JEP en discussion ?)
- [ ] Confirmer version actuelle de `uuid-creator` et `java-uuid-generator` sur Maven Central
- [ ] Vérifier PostgreSQL 17 UUID v7 support natif (`gen_random_uuid()` v7 ?)
- [ ] Tester le JMH plugin Maven (`maven-shade-plugin` + exec) sur Java 21
- [ ] Valider que Short UUID (base58) est UUID-compatible (round-trip)

---

## Sources de référence

- [RFC 9562 — UUID standard 2024](https://www.rfc-editor.org/rfc/rfc9562)
- [JUG — java-uuid-generator GitHub](https://github.com/cowtowncoder/java-uuid-generator)
- [uuid-creator GitHub](https://github.com/f4b6a912/uuid-creator)
- [JMH Benchmark UUID libs GitHub](https://github.com/ajbrown/uuid-generator-benchmark)
- [UUID v7 in Java — belief-driven-design](https://belief-driven-design.com/uuid-v7-java-3ccbb/)
- [UUID alternatives comparison — createuuid.com](https://createuuid.com/articles/uuid-alternatives)
- [Understanding UUID v1, v4, v7 — Medium](https://febrihasan.medium.com/understanding-uuid-versions-1-4-and-7-a-complete-technical-guide-for-modern-applications-d5bc68329aca)

---

## Connexions avec articles existants du blog

- Article Eclipse Collections → même style "tableau comparatif + démonstration code"
- Article Primitive Obsession (idée) → UUID comme Value Object = `record UserId(UUID value) {}`
- Article Loom (spec) → UUID v7 comme correlation ID propagé via ScopedValue

---

## Front matter pressenti

```yaml
layout: post
title: "UUID de v1 à v7 : versions, représentations, bibliothèques et benchmarks JMH"
subtitle: "Parce que UUID.randomUUID() ne suffit plus"
logo: uuid.png
category: articles
tags: [java, uuid, uuidv7, jmh, benchmark, performance, identifiant]
lang: fr
ref: uuid-versions-jmh
permalink: /uuid-versions-jmh/
```
