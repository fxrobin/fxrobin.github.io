---
layout: post
title: "GraalVM vs Project Leyden : deux armes pour le même ennemi"
subtitle: "Startup lente, warmup interminable... la JVM a enfin des réponses concrètes"
logo: graal.png
category: articles
tags: [Java, GraalVM, JVM, Quarkus, Build]
lang: fr
ref: graalvm-project-leyden
permalink: /graalvm-project-leyden/
---

<div class="intro" markdown='1'>
Votre application Quarkus démarre en 2,7 secondes. C'est déjà honorable. Mais dans un contexte Kubernetes, avec des pods qui montent et descendent en boucle, 2,7 secondes c'est **une éternité**. Chaque démarrage, c'est du CPU gaspillé, des requêtes en attente, et un *autoscaler* qui stresse.

Sur la démo qui accompagne cet article (Quarkus 3.38.2, 105 jeux en base comme dataset, PostgreSQL sur volume Docker persistant, JDK 25 Corretto 25.0.3, que j'ai poussée sur GitHub pour que vous puissiez reproduire), je mesure **2,7 s sans cache** contre **1,8 s avec le cache AOT Leyden** : **-35%** en moyenne sur 5 runs `benchmark.sh` automatisés et archivés, sans toucher au code applicatif. Côté natif GraalVM, non mesuré sur cette démo : comptez quelques dizaines de millisecondes sur un REST minimal, plutôt quelques centaines sur une app chargée (17 ms et 242 ms d'après le blog Quarkus).

Il existe aujourd'hui **deux approches** pour régler ce problème de warmup JVM. Deux philosophies, deux compromis. L'une est mature et radicale (GraalVM Native Image). L'autre est pragmatique et en pleine ascension (Project Leyden). Je vous propose de trancher, chiffres de la démo à l'appui (spoiler : pour une majorité d'applis Quarkus en prod, la réponse n'est pas forcément GraalVM).
</div>

<!--excerpt-->

## Le problème : pourquoi la JVM est lente au démarrage

La JVM est une machine virtuelle formidable. Elle analyse votre code au fil de l'exécution, optimise les chemins chauds, fait du *speculative optimization*... et atteint des performances de *peak* supérieures à ce qu'un compilateur statique peut produire. Le problème, c'est le chemin pour y arriver.

Au démarrage d'une application Java classique, la JVM fait tout ça **en même temps** :

- Elle scanne des centaines de fichiers JAR sur disque, lit et parse des milliers de fichiers `.class`
- Elle charge les classes en mémoire, les lie entre elles (*linking*), vérifie les bytecodes
- Elle exécute les initialiseurs statiques (`static { ... }`), qui peuvent créer des objets, ouvrir des fichiers de log...
- Si vous utilisez un framework comme Spring ou Quarkus, c'est encore pire : le framework scanne les annotations, crée le contexte CDI, initialise les beans...

Le tout se fait **à la demande**, paresseusement, juste-à-temps. C'est optimisé, oui. Mais c'est beaucoup de travail. Et ce travail est répété **à chaque démarrage**. Spring PetClinic, par exemple, charge et lie environ 21 000 classes au démarrage. Sur un JDK 23 classique, ça prend 4,5 secondes (oui, j'ai chronométré, et c'est long quand votre pod redémarre en boucle).

Dans un monde où les applications tournent dans des conteneurs, où l'*autoscaling* est la norme, où le *serverless* facture au milli-seconde, ce warmup est un vrai problème opérationnel.

## GraalVM Native Image : la solution radicale

### GraalVM, comment ca marche ?

GraalVM propose une approche frontale : **compiler votre application Java en binaire natif** avant de l'exécuter. Plus de JVM au sens classique. Le compilateur AOT (*Ahead-Of-Time*) analyse tout votre code, résout les dépendances, élimine le code mort, et produit un exécutable autonome.

Le résultat est spectaculaire :

- Démarrage en **dizaines à centaines de millisecondes selon l'app** (17 ms sur REST minimal, 242 ms sur grosse app d'après le blog Quarkus)
- Empreinte mémoire réduite (de l'ordre de 50-100 Mo sur une app minimale, contre 200-300+ Mo en JVM classique)
- Idéal pour les conteneurs, le serverless, les CLI

### Les contraintes

Mais cette radicalité a un coût. Le compilateur AOT de GraalVM doit **tout savoir** à l'avance. Or, Java est un langage dynamique par nature : réflexion, chargement dynamique de classes, proxies, sérialisation... Tout ce qui échappe à l'analyse statique pose problème.

Concrètement, il faut déclarer manuellement les éléments qui utilisent la réflexion dans des fichiers de configuration (`reflect-config.json`, `resource-config.json`, etc.). Les frameworks comme Quarkus le font automatiquement pour leurs propres classes, mais vos bibliothèques tierces ? C'est à vous.

Autres limitations notables :

- **Build long** : la compilation AOT peut prendre des dizaines de minutes sur de gros projets
- **Debugging difficile** : pas de JFR classique, pas de `jcmd`, pas de profilage standard
- **Sérialisation** : support partiel, configuration manuelle souvent nécessaire
- **Agents dynamiques** : les agents JVMTI qui réécrivent les classes ne fonctionnent pas

GraalVM est un choix binaire : vous acceptez ces contraintes, ou vous n'y touchez pas. Il n'y a pas de milieu. J'ai vu des équipes jeter l'éponge après deux sprints à chasser du `reflect-config.json`. Croyez-moi, ça pique.

Mais il existe une voie moins radicale. Et elle vient directement d'OpenJDK...

## Project Leyden : l'approche pragmatique

### Leyden, comment ca marche ?

Project Leyden, incubé dans OpenJDK depuis 2022, propose une philosophie différente : **ne pas remplacer la JVM, mais l'accélérer**. Plutôt que de compiler tout le code à l'avance, Leyden décale dans le temps les travaux coûteux du démarrage.

L'idée est simple : vous exécutez votre application une première fois (*training run*), et la JVM enregistre les artefacts d'optimisation dans un fichier cache. Les démarrages suivants réutilisent ce cache et démarrent beaucoup plus vite. Bref, on garde la JVM, on lui offre juste un bon café au démarrage.

### Qu'est-ce qui a ete livre ? (JDK 24, 25, 26)

Leyden a livré quatre JEPs, chacun apportant une brique de cette stratégie :

**JEP 483 - AOT Class Loading & Linking (JDK 24)**

C'est la fondation. Pendant le *training run*, la JVM lit, parse, charge et lie toutes les classes utilisées par l'application, puis stocke le résultat dans un cache AOT. Au démarrage suivant, les classes sont **instantanément disponibles** : plus de scan de JAR, plus de parsing, plus de vérification de bytecode.

Les chiffres parlent d'eux-mêmes :

- Spring PetClinic : de 4,486 s à 2,604 s (gain de 42%)
- Un simple `HelloStream` utilisant les Streams : de 31 ms à 18 ms (gain de 42%)

Le cache AOT occupe 130 Mo pour PetClinic, 11 Mo pour le programme simple. C'est de la place, mais c'est un coût ponctuel.

Sur la démo Quarkus qui accompagne cet article (chrono = ligne `started in` de Quarkus, PostgreSQL persistant hors mesure via `docker-compose.yml` + `init-db.sh`) :

| | Sans cache AOT | Avec cache AOT Leyden | Gain |
|---|---|---|---|
| Run 1 | 2,409 s | 1,869 s | -22% |
| Run 2 | 2,994 s | 1,807 s | -40% |
| Run 3 | 2,493 s | 1,868 s | -25% |
| Run 4 | 3,074 s | 1,646 s | -46% |
| Run 5 | 2,608 s | 1,678 s | -36% |
| **Moyenne (5 runs)** | **2,72 s** | **1,77 s** | **-35%** |
| **Médiane** | **2,608 s** | **1,807 s** | **-31%** |
| Fichier généré | - | `app.aot` 59 Mo (`type=aot`) | - |
| Variante AppCDS | - | `app-cds.jsa` 40 Mo (`type=app-cds`, flag `-XX:SharedArchiveFile`) | - |

Le `app.aot` et le `app-cds.jsa` ne sont jamais produits ensemble : un seul des deux sort du build, selon `quarkus.package.jar.aot.type`. Dans ce PoC (`release=21`), `type=auto` (défaut) produit AppCDS même sous JDK 25, car `auto` se décide sur `maven.compiler.release`, pas sur le JDK du build. Il faut forcer `type=aot` pour obtenir le vrai cache Leyden (le script `benchmark.sh` détecte l'archive produite et adapte le flag). Le chrono est la ligne `started in` reportée par Quarkus lui-même : 5 runs `benchmark.sh`, profil `prod`, BDD persistante hors mesure. Pas mal pour un cache qui ne touche pas à votre code, non ? Notez deux choses : le mode normal est bruité (2,41 s à 3,07 s) alors que le cache stabilise le démarrage (1,65 s à 1,87 s, écart-type divisé par 3). Les 5 runs sont archivés dans le repo démo (`target/benchmark-runs/`).

Et en régime établi, Gatling ne voit aucune différence, run après run : 8 460 requêtes à 100 %, 211,5 rps et p95 à 12 ms avec comme sans cache, sur les 5 runs. Leyden accélère le démarrage, pas le throughput.

**JEP 514 - AOT Command-Line Ergonomics (JDK 25)**

Ce JEP simplifie la ligne de commande pour créer et utiliser le cache AOT. Avant, il fallait manipuler les options CDS historiques (`-Xshare`, `-XX:SharedArchiveFile`, etc.). Maintenant, tout passe par des options `-XX:AOT*` cohérentes et lisibles. C'est du confort, mais c'est important pour l'adoption.

**JEP 515 - AOT Method Profiling (JDK 25)**

Là où le JEP 483 accélère le démarrage, le JEP 515 accélère le **warmup**. Pendant le *training run*, la JVM collecte les profils d'exécution des méthodes (lesquelles sont chaudes, quels types sont rencontrés) et les stocke dans le cache.

Au démarrage suivant, le compilateur JIT dispose immédiatement de ces profils et peut **compiler les méthodes chaudes dès le départ**, sans attendre la période de collecte habituelle. L'application atteint ses performances de *peak* beaucoup plus vite.

Sur un exemple utilisant les Streams (900 classes chargées, 30 méthodes chaudes), le gain est de 19% sur le temps d'exécution total, pour seulement 250 Ko de profils en plus dans le cache.

**JEP 516 - AOT Object Caching with Any GC (JDK 26)**

Le dernier JEP (livré dans JDK 26) résout un problème concret : avant JDK 26, le cache AOT était incompatible avec ZGC (*Z Garbage Collector*). Vous deviez choisir entre une latence GC faible (ZGC) et un démarrage rapide (AOT cache). Pas les deux.

Le JEP 516 change ça en stockant les objets Java du cache dans un format **agnostique du GC** : des indices logiques au lieu d'adresses mémoire. Un thread d'arrière-plan matérialise ces objets au démarrage, en parallèle de l'execution de l'application. Résultat : ZGC et le cache AOT fonctionnent ensemble, sans compromis. La démo n'active pas ZGC (G1 par défaut), c'est donc un gain prospectif à ce stade.

### Les contraintes : ce que Leyden ne fait pas

Leyden reste transparent pour le code applicatif, mais pas sans conditions. Le cache exige exactement le même JDK en build et en run (version, OS, architecture), le même classpath et les mêmes options de modules. Les classes issues de *class loaders* personnalisés ne sont pas mises en cache, et les agents JVMTI qui réécrivent les classes sont exclus. C'est pour cela que Quarkus bascule sur le packaging `aot-jar`, qui délègue le chargement aux class loaders du JDK. Et le training run doit être représentatif : un cache entraîné sur un hello-world n'accélérera pas vos endpoints JPA.

### Et en pratique, on tape quoi ? (vanilla JDK)

Le workflow vanilla Leyden tient en trois étapes :

```bash
# Etape 1 : training run (enregistre la configuration)
java -XX:AOTMode=record -XX:AOTConfiguration=app.aotconf \
     -cp app.jar com.example.App

# Etape 2 : creation du cache
java -XX:AOTMode=create -XX:AOTConfiguration=app.aotconf \
     -XX:AOTCache=app.aot -cp app.jar

# Etape 3 : utilisation en production
java -XX:AOTCache=app.aot -cp app.jar com.example.App
```

Pas de changement de code applicatif. C'est du `java` standard avec des options en plus. Avec Quarkus, ces trois étapes sont encapsulées par le plugin Maven (voir section Quarkus ci-dessous) : pas besoin de les écrire à la main.

### Et la suite ?

Le travail n'est pas terminé. Le dernier JEP manquant est l'**AOT Code Compilation** : compiler les méthodes chaudes en code natif à l'avance, comme le fait GraalVM mais en restant dans la JVM. Ce serait la cerise sur le gâteau : un démarrage quasi-instantané avec les performances de *peak* de la JVM.

D'autres améliorations sont prévues : meilleure gestion des *class loaders* personnalisés et collecte de données de training pendant les runs de production. Notez que le workflow en une seule étape existe déjà depuis le JEP 514 (`-XX:AOTCacheOutput=app.aot`), qui enchaîne training run et création du cache en une seule commande.

## GraalVM vs Leyden : le comparatif

| Critère | GraalVM Native Image | Project Leyden (demo Quarkus 3.38.2) |
|---------|---------------------|----------------|
| **Startup** | Dizaines à centaines de ms (17 ms REST minimal, 242 ms grosse app, blog Quarkus) | **1,77 s** mesuré (-35% vs 2,72 s sans cache, moyenne 5 runs) |
| **Empreinte mémoire** | Réduite, variable selon l'app (50-100 Mo sur app minimale) | Standard JVM (200-300 Mo) + cache 59 Mo (`app.aot`) ou 40 Mo (`app-cds.jsa`) |
| **Warmup** | Quasi-instantané (pas de JIT à chaud) | Accéléré (profils AOT JEP 515) |
| **Peak performance** | Souvent inférieure sur throughput long (pas de JIT adaptatif, PGO possible) | Identique à la JVM |
| **Réflexion / proxies** | Configuration manuelle | Transparent pour le code, sous conditions (pas de class loader custom, même JDK/OS/arch) |
| **Debugging / JFR** | Limité | Standard JVM |
| **Build time** | Long (minutes) | Standard + 1 training run |
| **Compatibilité** | Sous-ensemble de Java | Java standard, même JDK et classpath requis en build et en run |
| **GC** | SubstrateVM (GC interne) | Tous les GC JDK (ZGC depuis JDK 26, G1 mesuré dans la démo) |
| **Maturité** | Production (depuis 2019) | JEP 483/514/515 livrés (JDK 24-25), JEP 516 livré (JDK 26) |

En résumé :

- **GraalVM** est le choix quand le démarrage ultra-rapide est critique (serverless, CLI, *scale-to-zero*) et que vous acceptez les contraintes de compatibilité.
- **Leyden** est le choix quand vous voulez un démarrage significativement plus rapide **sans toucher au code applicatif** (même JDK, OS, archi et classpath requis en build et en run), en gardant toute la puissance de la JVM.

Les deux ne sont pas mutuellement exclusifs. On peut imaginer un monde où Leyden accélère le démarrage de la JVM standard, et où GraalVM reste pour les cas extrêmes.

## Quarkus et les deux approches

Quarkus est le framework qui illustre le mieux cette dualité. Dès sa création, Quarkus a misé sur GraalVM pour le *native compilation*. Et depuis le printemps 2026 (intégration racontée en mars 2026 sur le blog Quarkus, testée ici en 3.38.2 sortie fin juillet 2026), il intègre aussi Project Leyden via une configuration de build. La démo utilise Quarkus 3.38.2 (`pom.xml`), bytecode `release=21` (volontaire : le cache AOT est une optimisation runtime, sans changement de code ni de niveau de bytecode), runtime JDK 25 Corretto 25.0.3.

Concrètement, avec Quarkus :

- **Mode natif** (`-Dquarkus.native.enabled=true`) : Quarkus utilise GraalVM (ou Mandrel) pour produire un binaire natif. Démarrage en dizaines à centaines de ms selon l'app (17 ms sur REST minimal, 242 ms sur grosse app d'après Quarkus, non mesuré ici), empreinte réduite. C'est le mode *serverless* par excellence.
- **Mode JVM + AOT cache Leyden** (`-Dquarkus.package.jar.aot.enabled=true`) : Quarkus produit un cache AOT. Selon `quarkus.package.jar.aot.type`, on obtient **soit** `app.aot` (Leyden, flag `-XX:AOTCache=app.aot`) **soit** `app-cds.jsa` (AppCDS, flag `-XX:SharedArchiveFile=app-cds.jsa`). Dans ce PoC (`release=21`), `type=auto` (défaut) produit AppCDS même sous JDK 25, il faut forcer `type=aot` pour obtenir le vrai cache Leyden. Au démarrage avec le profil `prod` : `java -XX:AOTCache=app.aot -Dquarkus.profile=prod -jar quarkus-run.jar`.
- **Mode JVM classique** : le mode par défaut, sans optimisation de démarrage.

Le point fort de l'intégration Quarkus, c'est le **training run intégré**. Deux options :

- `quarkus.package.jar.aot.phase=build` (recommandé, utilisé dans la démo) : training autonome, pas besoin de tests d'intégration, compatible `-DskipTests`.
- `phase=integration-tests` : les `@QuarkusIntegrationTest` (`GreetingResourceIT`, `RetroGamingResourceIT`) servent de charge de travail et le cache est généré pendant `mvn verify -DskipITs=false`.

La démo isole le temps de démarrage Java pur : PostgreSQL est dans un volume Docker persistant (`docker-compose.yml`), initialisé une seule fois par `init-db.sh` (création manuelle des séquences `*_SEQ` Panache), et le profil `prod` (`application-prod.properties`, `quarkus.hibernate-orm.database.generation=update`) se contente de valider le schéma existant.

```bash
# 1. PostgreSQL persistant + init une seule fois
docker compose up -d
./init-db.sh  # no-op si tables déjà présentes

# 2. Build + training autonome + génération du cache AOT (JDK 25 requis)
JAVA_HOME=$HOME/.sdkman/candidates/java/25.0.3-amzn \
  ./mvnw verify -DskipTests \
  -Dquarkus.package.jar.aot.enabled=true \
  -Dquarkus.package.jar.aot.type=aot \
  -Dquarkus.package.jar.aot.phase=build

# 3. Démarrage en production avec le cache (depuis target/quarkus-app)
cd target/quarkus-app
java -XX:AOTCache=app.aot -Dquarkus.profile=prod -jar quarkus-run.jar
# Variante AppCDS si type=app-cds : java -XX:SharedArchiveFile=app-cds.jsa -Dquarkus.profile=prod -jar quarkus-run.jar

# 4. Benchmark automatisé (détecte app.aot vs app-cds.jsa)
# ../gatling-leyden/benchmark.sh  # Normal vs AOT, tableau startup + Gatling
```

Note : l'image JVM actuelle `src/main/docker/Dockerfile.jvm` (symlink vers `Dockerfile.jvm-hardened`, Corretto 25 jlink sur `amazonlinux:2023-minimal`, 0 CVE au scan Trivy et 252 Mo au jour de la mesure) ne contient **pas** le cache AOT : elle copie `lib/`, `*.jar`, `app/` et `quarkus/` mais pas `app.aot`. Pour embarquer le cache, il faut ajouter `COPY target/quarkus-app/app.aot /deployments/app.aot` et ajuster l'`ENTRYPOINT`.

Le choix dépend de votre contexte :

- Vous déployez sur AWS Lambda, Azure Functions, ou un *scale-to-zero* ? : **GraalVM natif**
- Vous déployez sur Kubernetes avec des pods qui montent et descendent fréquemment ? : **Leyden AOT cache** (via `quarkus.package.jar.aot.enabled=true`)
- Vous avez une application qui tourne en continu depuis des semaines ? : **Mode JVM classique** (le warmup n'est pas un problème)

## Préconisations (enfin...)

Voici les règles d'or que je retiens après avoir suivi l'évolution de ces deux technologies :

**Commencez par Leyden.** Si vous êtes sur JDK 24 ou plus, le cache AOT est la solution la plus simple. Avec Quarkus 3.38+, c'est encore plus simple : `quarkus.package.jar.aot.enabled=true` + `type=aot` + `phase=build` (ou `phase=integration-tests` si vous préférez les ITs), lancé sous JDK 25, et démarré avec `-XX:AOTCache=app.aot -Dquarkus.profile=prod`. Attention au piège (`release=21`) : `type=auto` produit AppCDS (`app-cds.jsa`, `-XX:SharedArchiveFile`) même sous JDK 25, forcez `type=aot`.

**Passez à GraalVM si Leyden ne suffit pas.** Si vous avez besoin de démarrages en dizaines de millisecondes (serverless, CLI), et que votre application fonctionne avec les contraintes de GraalVM, alors le *native image* est le bon choix.

**Ne choisissez pas GraalVM par défaut.** C'est tentant (les chiffres de démarrage sont impressionnants), mais les contraintes sont réelles. Combien de projets ont abandonné le *native* à cause de problèmes de réflexion, de sérialisation, ou de debugging impossible ? Beaucoup.

**Surveillez JDK 27.** Reste l'AOT Code Compilation : compiler les méthodes chaudes à l'avance. Si elle arrive, l'écart avec GraalVM se réduira encore.

## En guise de conclusion

GraalVM et Project Leyden répondent au même problème : le warmup de la JVM. Mais ils l'attaquent par des bouts différents. GraalVM embarque votre code dans un runtime natif, sans JVM classique au run. Leyden accélère la JVM de l'intérieur.

Pour la plupart des applications Java en production aujourd'hui, **Leyden est la voie pragmatique**. Pas de changement de code applicatif, des conditions à respecter (même JDK, classpath identique, training représentatif), et des gains de démarrage significatifs. GraalVM reste le champion du démarrage ultra-rapide, mais au prix d'une compatibilité réduite.

Dans un prochain billet, on parlera de Structured Concurrency, le troisième volet de la trilogie Project Loom. Parce que démarrer vite, c'est bien. Mais exécuter correctement en parallèle, c'est encore mieux.

**N'hésitez pas à me faire part de vos retours et de vos usages en commentaire.**
