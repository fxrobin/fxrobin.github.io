---
layout: post
title: Maven site et Javadoc avec Lombok et Java 21
subtitle: Comment générer un site Maven avec Javadoc et Lombok en Java 21 et ce n'est pas si simple.
logo: lombok-logo.png
category: articles
tags: [lombok,java,maven,javadoc]
lang: fr
ref: maven-javadoc-lombok-java-21
permalink: /maven-javadoc-lombok-java-21-fr/
---

<div class="intro" markdown='1'>
Dans ma vie de développeur j'ai plusieurs amis :

- la bibliothèque Lombok pour Java ;
- Maven comme outil de build ;
- la documentation de code avec Javadoc.

Cependant, ces trois larons ne s'entendent pas toujours bien ensemble.

Voici comment j'ai réussi à générer un site Maven avec Javadoc et Lombok en Java 21.

</div>
<!--excerpt-->

## Lombok: cette bibliothèque que j'aime

Lombok c'est super: cette librarie permet de réduire le code boilerplate en générant automatiquement les getters, setters, constructeurs, builders, exceptions wrappées, etc. C'est un gain de temps et de lisibilité avéré. 

Je l'utilise dans **tous mes projets Java** depuis plus de 11 ans, c'était la version 1.12.x à l'époque (2013). Il accompagne aussi bien SpringBoot que Quarkus ainsi que toutes les librairies Apache Commons.

> **Petite digression** qui n'engage que moi : je ne comprends pas les développeurs, techleads, architectes, qui ont des réticences à utiliser Lombok avec des arguments tels que "On ne sait pas ce que ça fait", "C'est un truc de fainéant", etc. Franchement, parmis les développeurs SpringBoot, qui sait vraiment ce que fait `@Transactional`, `@GetMapping`, `@Component` ou encore une interface `JpaRepository` Spring Data JPA augmentée ? Sans parler de l'AOP. Du bytecode est généré à tous les niveaux, pourquoi Lombok serait-il mal et les autres acceptables ? Qui sait comment se comportent finement le garbage collector, le JIT, le classloader, etc. ? Java est fondé sur un principe de "Magie" depuis son origine où plein de choses s'exécutent en *backstage*. J'ai entendu ici ou la que Lombok posait des problèmes en cas de refactoring. J'en ai procédé à de nombreux refactoring, et ce n'était jamais lombok qui posait le plus de problème, loin s'en faut. Fin de la digression, vous pouvez ne pas être du même avis.

## Mais quel est le problème ?

Lombok ne génère pas de code source, il modifie le bytecode : **c'est là que ça coince pour la génération de la Javadoc**. 

En effet, **la Javadoc est générée à partir du code source** et non du bytecode, de fait, **les annotations Lombok ne sont pas prises en compte**.

> Si vous êtes arrivés sur cette page, ce n'est sûrement pas hasard, vous avez déjà dû vous en rendre compte par vous-même.

S'il ne s'agissait que des getters et setters, on pourrait s'en passer, mais pour les constructeurs, builders et autres annotations, c'est plus problématique. Par exemple un builder a toute sa documentation qui est perdue, voire même son existence puisqu'il n'apparait pas dans la Javadoc alors qu'il devient l'unique moyen de construire une instance de la classe.

**Et ça, ce n'est pas acceptable : la documentation est un élément essentiel du code, elle doit être complète et à jour.**

## Le projet de démonstration

Partons d'un projet Maven classique avec Java 21 que l'on va équiper de quelques classes aggrémenteés d'annotations Lombok. 

Pour cet exemple j'utiliserais les annotations suivantes :
- les classiques `@Getter`, `@Setter`, `@EqualsHashcode`, `@ToString` ;
- `@Builder` pour générer un builder ;
- `@UtilityClass` pour générer une classe utilitaire (constructeur privé, méthodes statiques, classe `final`) comme on en trouve souvent dans les projets.

Voici la structure du projet que vous pouvez retrouver sur [GitHub](https://https://github.com/fxrobin/maven-javadoc-lombok-java-21) :

```
$ exa --tree
.
├── pom.xml
├── README.md
└── src
   └── main
      └── java
         └── fr
            └── fxjavadevblog
               └── mvnlmbkjdoc
                  ├── garage
                  │  ├── Garage.java
                  │  └── package-info.java
                  └── vehicules
                     ├── Energy.java
                     ├── package-info.java
                     ├── Vehicule.java
                     └── VehiculeUtils.java
```		

Ce qui est intéressant ici, ce sont les classes `Garage` et `Vehicule` qui sont aggrémentées d'annotations Lombok.

`Garage.java`
```java
package fr.fxjavadevblog.mvnlmbkjdoc.garage;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

import fr.fxjavadevblog.mvnlmbkjdoc.vehicules.Vehicule;
import lombok.Builder;
import lombok.ToString;

/**
 * Garage class is a simple class to demonstrate the use of Javadoc.
 * 
 * @version 1.0
 * @since 1.0
 * @see <a href="https://fxjavadevblog.fr">FX Java Dev Blog</a>
 */
@ToString
@Builder
public class Garage {

    /**
     * The set of vehicles in the garage.
     */
    private final Set<Vehicule> vehicules = new LinkedHashSet<>();

    /**
     * Add a vehicle to the garage.
     * 
     * @param vehicule the vehicle to add
     */
    public void addVehicule(Vehicule vehicule) {
        vehicules.add(vehicule);
    }

    /**
     * Remove a vehicle from the garage.
     * 
     * @param vehicule the vehicle to remove
     */
    public void removeVehicule(Vehicule vehicule) {
        vehicules.remove(vehicule);
    }

    /**
     * Get the set of vehicles in the garage as an unmodifiable set.
     * 
     * @return unmodifiable set of vehicles
     */
    public Set<Vehicule> getVehicules() {
        return Collections.unmodifiableSet(vehicules);
    }

}
```

`Vehicule.java`
```java
package fr.fxjavadevblog.mvnlmbkjdoc.vehicules;

import java.io.Serializable;
import java.time.LocalDate;

import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

/**
 * Vehicule class is a simple class to demonstrate the use of Javadoc.
 * 
 * @version 1.0
 * @since 1.0
 * @see <a href="https://www.fxjavadevblog.fr">FX Java Dev Blog</a>
 */
@Builder
@EqualsAndHashCode(of = "registrationNumber")
@ToString
public class Vehicule implements Serializable {

    /**
     * The registration number of the vehicle.
     */
    @Getter
    private final String registrationNumber;

    /**
     * The registration date of the vehicle.
     */
    @Getter
    private final LocalDate registrationDate;

    /**
     * The brand of the vehicle.
     */
    @Getter
    private final String brand;

    /**
     * The energy of the vehicle.
     */
    @Getter
    private final Energy energy;
}
```

`VehiculeUtils.java`
```java
package fr.fxjavadevblog.mvnlmbkjdoc.vehicules;

import lombok.experimental.UtilityClass;


/**
 * Utility class for vehicules.
 * 
 * This class contains utility methods to:
 * <li>format a vehicule as a string for pretty printing.</li>
 * 
 */
@UtilityClass
class VehiculeUtils {

    private static final String FORMAT_STRING = "Registration number: %s, Brand: %s, Energy: %s";

    /**
     * Format a vehicule as a string for pretty printing.
     * 
     * @param vehicule
     * @return a formatted string representing the vehicule.
     */
    String format(Vehicule vehicule) {
        return String.format(FORMAT_STRING, 
            vehicule.getRegistrationNumber(), 
            vehicule.getBrand(), 
            vehicule.getEnergy());
    }

}
```

## Ajout de la génération de la JavaDoc

Pour générer la Javadoc, il suffit d'utiliser le plugin `maven-javadoc-plugin` au moyen du *goal* `javadoc:javadoc`. Ce plugin fait partie des plugins par défaut de Maven, il n'est donc pas nécessaire de l'ajouter dans le `pom.xml` sauf à vouloir le paramétrer finement.

```bash
$ mvn clean compile javadoc:javadoc
[INFO] --- javadoc:3.10.1:javadoc (default-cli) @ mvn-lombok-javadoc ---
[INFO] No previous run data found, generating javadoc.
[WARNING] Javadoc Warnings
[WARNING] ./src/main/java/fr/fxjavadevblog/mvnlmbkjdoc/garage/Garage.java:20: warning: use of default constructor, which does not provide a comment
[WARNING] public class Garage {
[WARNING] ^
[WARNING] ./src/main/java/fr/fxjavadevblog/mvnlmbkjdoc/vehicules/Vehicule.java:21: warning: use of default constructor, which does not provide a comment
[WARNING] public class Vehicule implements Serializable {
[WARNING] ^
[WARNING] 2 warnings
```

> **Note** : petit rappel, si une classe ne possède pas de constructeur, Java en génère un par défaut avec une visibilité par défaut et sans argument.

Premier constat, 2 warnings apparaissent lors de la génération de la Javadoc.

Ici les warnings indiquent que les constructeurs par défaut ne sont pas documentés car ils sont présents, selon l'outil de génération JavaDoc.

Cependant, il ne le sont pas vraiment : l'annotation `@Builder` rend le constructeur par défaut privé, mais tout cela, le plugin `maven-javadoc-plugin` l'ignore, car c'est devenu du bytecode.

**On voit clairement ici que la génération de la Javadoc est faussée par la non prise en compte des annotations Lombok.**

## Solution

L'idée est donc d'utiliser "delombok" pour générer le code source Java à partir des annotations Lombok. 

Il existe un plugin qui fait le travail, `delombok-maven-plugin`, mais il n'est pas maintenu depuis plusieurs mois en date d'écriture et ne fonctionne pas Java 21 directement, sauf à le paramétrer finement.

### Ajout du plugin delombok

> Pourquoi a-t-on besoin de délomboker le code ? 

Parce que la Javadoc est générée à partir du code source et non du bytecode. Il faut donc générer le code source à partir des annotations.

Le problème, c'est que le plugin delombok recommande de placer le code source java aggrémenté d'annotations Lombok dans un répertoire spécifique `src/main/lombok`, ce qui n'est pas pratique pour un projet Maven voire même contre-intuitif. Je ne peux pas que l'usage d'un bibliothèque doit imposer une structure de projet.

De plus, le plugin ne supporte pas en l'état Java 21. En consultant la FAQ du plugin, on trouve une solution pour le faire fonctionner avec cette version, en force la librairie de Lombok à utiliser en corrélation avec la version utilisée par l'application :

```xml
```

### Quel est mon meilleur profil ?

On pense alors avoir réussi à faire ce qu'on voulait, mais non ! En effet, le plugin `delombok-maven-plugin` provoque un effet de bord : l'IDE ne sais plus où trouver des classes. Une partie des classes été traité par l'annotation processor, mais aussi par le plugin de l'IDE (aussi bien IntelliJ, VSCode, que Eclipse).

On se retrouve avec des erreurs de compilation dans l'IDE, alors que le projet compile correctement avec Maven.

Il faut donc trouver un moyen de produire la JavaDoc dans certaines conditions et de laisser le projet Maven dans un état plus standard pour les IDE : Un profil maven.

L'objectif est donc de placer dans un profil tout ce qui sera nécessaire pour la génération de la Javadoc et uniquement pour cela.

```xml




## En conclusion

Dans ce cas précis, la génération de la Javadoc avec Lombok et Java 21 n'est pas si simple. Il faut passer par une étape de "delomboking" pour générer le code source à partir des annotations Lombok.

Et malheureusement, ni ChatGPT, ni GitHub Copilot ne peuvent aider à trouver la solution. Il faut se débrouiller tout seul et j'espère que cet article vous aidera si vous êtes confronté à ce problème.

