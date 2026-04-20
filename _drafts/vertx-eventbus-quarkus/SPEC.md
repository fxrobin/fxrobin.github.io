# SPEC — Article : L'EventBus Vert.x dans Quarkus — le bus d'événements que vous avez déjà sans le savoir

**Statut :** spec, pas encore de fichier article  
**Catégorie :** `articles`  
**Langue :** `fr`  
**Audience :** développeur Java/Quarkus intermédiaire, sait faire des endpoints REST, découvre l'architecture événementielle  
**Stack cible :** Quarkus 3.x LTS, Java 21+  

---

## Angle éditorial

Quarkus tourne sur Vert.x. Vert.x embarque un EventBus. Chaque application Quarkus **a déjà un bus d'événements intégré** — et presque personne ne le sait ni ne l'utilise.

L'article part d'un problème concret : un monolithe modulaire où les composants s'appellent directement, créant du couplage fort. L'EventBus règle ça sans Kafka, sans RabbitMQ, sans infrastructure externe — juste une annotation.

Fil rouge : **une application de traitement de commandes** (commande créée → notification → facturation → stock). D'abord couplée, puis découplée step by step avec l'EventBus.

Ton : vouvoiement (article Java/tech).

---

## Accroche pressentie (pattern "révélation cachée")

```java
// Vous utilisez Quarkus. Vert.x tourne sous le capot.
// Vert.x a un EventBus. Vous l'avez déjà.
// Voici comment ne plus appeler vos services directement :

@Inject
EventBus bus;

bus.publish("commande.creee", commande); // tous les consommateurs reçoivent
bus.send("facturation.calculer", commande); // un seul consommateur reçoit
bus.request("stock.verifier", produitId)   // request/reply asynchrone
   .onItem().transform(Response::body);
```

Promesse : à la fin, votre architecture est découplée, testable indépendamment, et extensible sans modifier le code existant.

---

## Plan de sections

```
<div class="intro">  ← révélation : EventBus déjà là + promesse découplage
<!--excerpt-->

## Vert.x sous Quarkus — ce que vous ignorez peut-être
  → Architecture : Quarkus = Vert.x + CDI + extensions
  → L'event loop Vert.x et pourquoi elle est importante
  → L'EventBus : le système nerveux de Vert.x

## Les trois patterns de communication
  → publish() : Publish-Subscribe (tous les consommateurs)
  → send() : Point-to-Point (un seul consommateur, round-robin)
  → request() : Request-Reply (réponse attendue, timeout configurable)
  → Tableau récapitulatif : quand utiliser quoi

## Premier pas : @ConsumeEvent
  → Déclarer un consommateur avec @ConsumeEvent("adresse")
  → Envoyer un message avec EventBus injecté
  → Sérialisation : String, JSON, objets (codec)
  → Démonstration : NotificationService découplé de OrderService

## Aller plus loin : codecs et objets métier
  → Codec par défaut : JSON via Jackson
  → Codec personnalisé pour objets non-sérialisables
  → MessageCodec : enregistrement dans Quarkus

## Gestion des erreurs et timeouts
  → Ce qui se passe si le consommateur plante
  → reply failure vs timeout
  → Pattern : dead letter avec @ConsumeEvent de fallback

## EventBus et Virtual Threads
  → @ConsumeEvent(blocking = true) — l'ancien modèle
  → @RunOnVirtualThread sur un consommateur EventBus
  → Quand bloquer est acceptable (appels JDBC, I/O)

## EventBus et contexte Quarkus
  → Propagation de la sécurité (identité, rôles) — le piège
  → Propagation du contexte CDI (@RequestScoped = mort sur EventBus)
  → Solution : Vert.x Context + Quarkus Security utilities
  → Propagation de la trace OpenTelemetry

## Tests — découplage = testabilité
  → Tester un consommateur isolément avec @QuarkusTest
  → Mocker l'EventBus pour tester l'émetteur
  → Test d'intégration : vérifier qu'un message est bien publié

## Et si l'application scale ? — aperçu du mode cluster
  → EventBus in-process vs distribué
  → Cluster manager : Hazelcast ou Infinispan
  → Ce qui change (et ce qui ne change pas) dans le code
  → Note : hors scope de cet article, piste vers documentation officielle

## Préconisations (enfin !)
  → Quand utiliser l'EventBus vs un appel de service direct
  → Quand NE PAS utiliser l'EventBus (synchrone pur, transaction distribuée)
  → EventBus vs Reactive Messaging (SmallRye) : la frontière

## En guise de conclusion
  → Récap : 3 patterns, 1 annotation, 0 infrastructure externe
  → L'EventBus = première étape vers architecture événementielle
  → Lien vers article suivant pressenti : SmallRye Reactive Messaging + Kafka
```

---

## Code démo / projet à produire

Projet Maven Quarkus (`quarkus-vertx`, `quarkus-rest`, `quarkus-jackson`) :

```
src/main/java/
  order/
    OrderResource.java        ← POST /orders → publie sur "commande.creee"
    OrderService.java         ← logique métier, émet via EventBus
  notification/
    NotificationService.java  ← @ConsumeEvent("commande.creee") — send email simulé
  billing/
    BillingService.java       ← @ConsumeEvent("commande.creee") — calcul facture
  stock/
    StockService.java         ← @ConsumeEvent("stock.verifier") — request/reply
  codec/
    OrderCodec.java           ← MessageCodec<Order, Order> custom
src/test/java/
  NotificationServiceTest.java  ← test consommateur isolé
  OrderServiceTest.java         ← test avec EventBus mocké
```

---

## Points techniques à valider avant rédaction

- [ ] Confirmer que `@RunOnVirtualThread` fonctionne sur `@ConsumeEvent` en Quarkus 3.x LTS
- [ ] Vérifier propagation sécurité Quarkus via EventBus (identité perdue ?)
- [ ] Tester propagation OpenTelemetry trace ID sur EventBus (extension `quarkus-opentelemetry`)
- [ ] Confirmer version actuelle `quarkus-vertx` dans Quarkus 3.x LTS (inclus par défaut ?)
- [ ] Vérifier codec JSON automatique : `@ConsumeEvent` sur objet POJO sans codec explicite

---

## Sources de référence

- [Guide officiel Quarkus — Using the event bus](https://quarkus.io/guides/reactive-event-bus)
- [Vert.x Core — EventBus documentation](https://vertx.io/docs/vertx-core/java/)
- [Quarkus + Vert.x integration best practices](https://blog.poespas.me/posts/2024/05/26/quarkus-vertx-integration-best-practices/)
- [Propagate thread context — discussion Quarkus GitHub](https://github.com/quarkusio/quarkus/discussions/27709)
- [Decoupling with EventBus — e-commerce example](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-4)

---

## Connexions avec articles existants du blog

- Article Loom (spec) → `@RunOnVirtualThread` sur consommateur EventBus = pont naturel
- Article LangChain4j/MCP (idée) → LangChain4j `@Tool` déclenche des événements sur le bus
- Architecture Père Noël (draft mis de côté) → EventBus = brique centrale à réhabiliter

---

## Front matter pressenti

```yaml
layout: post
title: "L'EventBus Vert.x dans Quarkus : le bus d'événements que vous avez déjà"
subtitle: "Découpler vos composants sans Kafka, sans RabbitMQ, juste une annotation"
logo: vertx.png
category: articles
tags: [java, quarkus, vertx, eventbus, evenements, architecture, reactive]
lang: fr
ref: quarkus-vertx-eventbus
permalink: /quarkus-vertx-eventbus/
```
