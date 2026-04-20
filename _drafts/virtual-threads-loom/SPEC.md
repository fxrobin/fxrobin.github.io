# SPEC — Article : Java 25 et Project Loom — Virtual Threads, Structured Concurrency, Scoped Values

**Statut :** spec, pas encore de fichier article  
**Catégorie :** `articles`  
**Langue :** `fr`  
**Audience :** développeur Java intermédiaire/senior, familier avec `ExecutorService` et `ThreadLocal`  
**Java cible :** Java 25 LTS  

---

## Angle éditorial

La trilogie Project Loom est **enfin stabilisée en Java 25 LTS**. Beaucoup de devs ont entendu parler des virtual threads depuis Java 19 (preview) mais n'ont jamais plongé dedans. L'article leur donne le "pourquoi maintenant" et le "comment concrètement" — sans framework, pur JDK.

Fil rouge : **agréger 3 appels d'API distants en parallèle**, d'abord avec l'ancien modèle (ExecutorService + Future), puis refactorisé step by step avec les 3 nouveaux outils.

Ton : vouvoiement (article Java/tech).

---

## Accroche pressentie (pattern "douleur + promesse")

```java
// L'ancien monde : 3 appels, un executor, du Future, et une migraine
ExecutorService pool = Executors.newFixedThreadPool(3);
Future<String> f1 = pool.submit(() -> callServiceA());
Future<String> f2 = pool.submit(() -> callServiceB());
Future<String> f3 = pool.submit(() -> callServiceC());
String result = combine(f1.get(), f2.get(), f3.get());
pool.shutdown();
// Et si callServiceA() plante ? Et le timeout ? Et le contexte utilisateur ?
```

Promesse : à la fin de l'article, le même code tient en 10 lignes, annule proprement, propage le contexte, et scale à des millions de threads.

---

## Plan de sections

```
<div class="intro">  ← douleur ExecutorService/Future + promesse trilogie Loom
<!--excerpt-->

## Threads en Java : le problème de fond
  → Platform threads = OS threads = ressource rare
  → Le mythe du "juste ajouter un thread pool plus grand"
  → Pourquoi le modèle réactif était une réponse — et pourquoi il fait mal

## Virtual Threads — légèreté sans magie noire
  → Ce que c'est : Thread.ofVirtual(), pas une nouveauté d'API, une nouveauté de runtime
  → Démonstration : 100 000 virtual threads vs 100 000 platform threads (OOM vs OK)
  → Le piège n°1 : synchronized pinne le carrier thread — comment le détecter (JFR)
  → Le piège n°2 : ThreadLocal reste fonctionnel mais coûteux sur VT

## Structured Concurrency — l'arbre de tâches qui ne fuit pas
  → Problème : avec ExecutorService, une tâche qui plante n'annule pas les autres
  → StructuredTaskScope : toutes les sous-tâches liées au scope parent
  → Le redesign Java 25 vs Java 21 (ShutdownOnFailure / ShutdownOnSuccess → Joiner API)
  → Démonstration : agrégation 3 API avec annulation propre en cas d'échec

## Scoped Values — ThreadLocal est mort, vive ScopedValue
  → ThreadLocal : mutable, coûteux, dangereux en virtual threads
  → ScopedValue : immuable, borné au scope, propagé aux threads enfants
  → Démonstration : propager un userId à travers l'arbre de tâches sans le passer partout

## Exemple complet : tout assembler
  → Agrégation 3 API : Virtual Threads + StructuredTaskScope + ScopedValue
  → Comparaison côte-à-côte avec l'ancienne version ExecutorService
  → Ce que Java 25 change par rapport à Java 21 (stabilisation APIs)

## En guise de conclusion
  → Récap : 3 outils, 3 problèmes résolus
  → Quand NE PAS utiliser les virtual threads (CPU-bound tasks)
  → Lien vers article suivant pressenti : Quarkus + @RunOnVirtualThread
```

---

## Code démo à produire

Projet Maven minimal (`java 25`, pas de dépendance externe) avec :

1. `OldWay.java` — ExecutorService + Future, les 3 appels simulés avec `Thread.sleep()`
2. `VirtualThreadsDemo.java` — même chose avec `Thread.ofVirtual()`
3. `StructuredDemo.java` — StructuredTaskScope Java 25 (Joiner API)
4. `ScopedValueDemo.java` — ScopedValue propagé dans l'arbre
5. `FullDemo.java` — tout assemblé

Les appels "API distants" = méthodes locales avec `Thread.sleep(200)` pour simuler I/O.

---

## Points techniques à valider avant rédaction

- [ ] Vérifier la Joiner API exacte de StructuredTaskScope en Java 25 (redesign vs Java 21)
- [ ] Vérifier JEP exact pour Scoped Values finalisé (`JEP 506`)
- [ ] Confirmer que `synchronized` pinning est toujours un problème en Java 25 (ou résolu ?)
- [ ] Tester la détection de pinning via JFR : `-Djdk.tracePinnedThreads=full`

---

## Sources de référence

- [JEP 506 — Scoped Values](https://openjdk.org/jeps/506)
- [JEP 505 — Structured Concurrency (5th preview)](https://openjdk.org/jeps/505)
- [JAVAPRO — Virtual Threads + Structured Concurrency + Scoped Values](https://javapro.io/2026/02/19/virtual-threads-structured-concurrency-and-scoped-values-putting-it-all-together/)
- [Java 25 Virtual Threads - javapro.io](https://javapro.io/2026/03/05/java-25-and-the-new-age-of-performance-virtual-threads-and-beyond/)
- [Virtual Threads, Structured Concurrency, and Scoped Values (Apress)](https://link.springer.com/book/10.1007/979-8-8688-0500-4)

---

## Connexions avec articles existants du blog

- Article Lombok → mention possible (ThreadLocal + Lombok `@Builder` interaction)
- Article Eclipse Collections → style "démonstration progressive avant/après"

---

## Front matter pressenti

```yaml
layout: post
title: "Java 25 et Project Loom : Virtual Threads, Structured Concurrency et Scoped Values"
subtitle: "La trilogie qui rend vos ExecutorService obsolètes"
logo: java-loom.png
category: articles
tags: [java, java25, virtual-threads, loom, concurrence, structured-concurrency, scoped-values]
lang: fr
ref: java25-project-loom
permalink: /java25-project-loom/
```
