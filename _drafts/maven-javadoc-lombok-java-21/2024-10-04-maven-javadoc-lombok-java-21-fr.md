---
layout: post
title: Maven site et Javadoc avec Lombok et Java 21
subtitle: Comment générer un site Maven avec Javadoc et Lombok en Java 21 et ce n'est pas si simple.
logo: lombok-logo.png
category: articles
tags: [lombok,java,maven,javadoc]
lang: fr
ref: maven-javadoc-lombok-java-21
permalink: /maven-javadoc-lombok-java-21/
---

<div class="intro" markdown='1'>

Une règle que j'applique sans exception : **la documentation doit être complète**. Getters, builders, constructeurs : tout doit apparaitre dans la Javadoc. Et avec Lombok + Java 21, Maven génère une Javadoc incomplète. Muette sur les builders. Truffée de warnings.

Il existe une solution. Elle n'est pas évidente, elle n'est pas documentée clairement, et ni ChatGPT ni Copilot ne vous la donneront. Mais je vais vous la montrer.

</div>

<!--excerpt-->

## Lombok : cette bibliothèque que j'aime

Lombok c'est super : cette librairie permet de réduire le code boilerplate en générant automatiquement les getters, setters, constructeurs, builders, exceptions wrappées, etc. C'est un gain de temps et de lisibilité avéré.

Je l'utilise dans **tous mes projets Java** depuis plus de 11 ans, c'était la version 1.12.x à l'époque (2013). Il accompagne aussi bien SpringBoot que Quarkus ainsi que toutes les librairies Apache Commons.

> **Petite digression** qui n'engage que moi : je ne comprends pas les développeurs, techleads, architectes, qui ont des réticences à utiliser Lombok avec des arguments tels que "On ne sait pas ce que ca fait", "C'est un truc de fainéant", etc. Franchement, parmi les développeurs SpringBoot, qui sait vraiment ce que fait `@Transactional`, `@GetMapping`, `@Component` ou encore une interface `JpaRepository` Spring Data JPA augmentée ? Sans parler de l'AOP. Du bytecode est généré à tous les niveaux, pourquoi Lombok serait-il mal et les autres acceptables ? J'ai entendu ici ou là que Lombok posait des problèmes en cas de refactoring. J'en ai procédé à de nombreux refactorings, et ce n'était jamais Lombok qui posait le plus de problème, loin s'en faut. Fin de la digression, vous pouvez ne pas être du même avis.

## Mais quel est le problème ?

Lombok ne génère pas de code source, il modifie le bytecode : **c'est là que ca coince pour la génération de la Javadoc**.

En effet, **la Javadoc est générée à partir du code source** et non du bytecode, de fait, **les annotations Lombok ne sont pas prises en compte**.

> Si vous êtes arrivés sur cette page, ce n'est sûrement pas un hasard, vous avez déjà dû vous en rendre compte par vous-même.

S'il ne s'agissait que des getters et setters, on pourrait s'en passer, mais pour les constructeurs, builders et autres annotations, c'est plus problématique. Par exemple un builder a toute sa documentation qui est perdue, voire même son existence puisqu'il n'apparait pas dans la Javadoc alors qu'il devient l'unique moyen de construire une instance de la classe.

**Et ca, ce n'est pas acceptable : la documentation est un élément essentiel du code, elle doit être complète et à jour.**

## Le projet de démonstration

Partons d'un projet Maven classique avec Java 21 que l'on va équiper de quelques classes agrémentées d'annotations Lombok.

Pour cet exemple j'utiliserai les annotations suivantes :
- les classiques `@Getter`, `@Setter`, `@EqualsHashCode`, `@ToString` ;
- `@Builder` pour générer un builder ;
- `@UtilityClass` pour générer une classe utilitaire (constructeur privé, méthodes statiques, classe `final`) comme on en trouve souvent dans les projets.

Voici la structure du projet que vous pouvez retrouver sur [GitHub](https://github.com/fxrobin/maven-javadoc-lombok-java-21) :

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

Ce qui est intéressant ici, ce sont les classes `Garage` et `Vehicule` qui sont agrémentées d'annotations Lombok.

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

    /** The registration number of the vehicle. */
    @Getter
    private final String registrationNumber;

    /** The registration date of the vehicle. */
    @Getter
    private final LocalDate registrationDate;

    /** The brand of the vehicle. */
    @Getter
    private final String brand;

    /** The energy of the vehicle. */
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
     * @param vehicule the vehicule to format
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

Cependant, ils ne le sont pas vraiment : l'annotation `@Builder` rend le constructeur par défaut privé, mais tout cela, le plugin `maven-javadoc-plugin` l'ignore, car c'est devenu du bytecode.

**On voit clairement ici que la génération de la Javadoc est faussée par la non prise en compte des annotations Lombok.**

## La solution : delombok à la rescousse

### Pourquoi delombok ?

L'idée est d'utiliser **delombok** : un outil fourni par Lombok lui-même qui fait l'opération inverse. Là où Lombok *réduit* le code source en annotations, delombok *développe* ces annotations en code Java ordinaire, sans aucune dépendance à Lombok.

Ce code développé est ensuite fourni au plugin `maven-javadoc-plugin` comme source à documenter. Résultat : la Javadoc voit les constructeurs, les builders, les méthodes utilitaires générées, et tout est documenté correctement.

Il existe un plugin Maven dédié : `lombok-maven-plugin`. Sa version (`1.18.20.0`) est ancienne, mais il se configure pour utiliser n'importe quelle version de Lombok en dépendance : c'est précisément ce qui le rend compatible Java 21.

### Ajout du plugin delombok

Voici la configuration du plugin à ajouter dans la section `<build><plugins>` du `pom.xml`.

Deux points clés :
- `<addOutputDirectory>false</addOutputDirectory>` : le code delombokisé ne doit **pas** être ajouté aux sources de compilation, uniquement servi à la Javadoc.
- `<dependencies>` : on force la version de Lombok utilisée par le plugin pour qu'elle corresponde à celle du projet et soit compatible Java 21.

`pom.xml`
```xml
<properties>
    <maven.compiler.source>21</maven.compiler.source>
    <maven.compiler.target>21</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <lombok.version>1.18.42</lombok.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>${lombok.version}</version>
        <scope>provided</scope>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.14.0</version>
            <configuration>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>${lombok.version}</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>

        <plugin>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok-maven-plugin</artifactId>
            <version>1.18.20.0</version>
            <executions>
                <execution>
                    <id>delombok</id>
                    <phase>generate-sources</phase>
                    <goals>
                        <goal>delombok</goal>
                    </goals>
                    <configuration>
                        <addOutputDirectory>false</addOutputDirectory>
                        <sourceDirectory>src/main/java</sourceDirectory>
                        <verbose>true</verbose>
                    </configuration>
                </execution>
            </executions>
            <!-- Forcer la version de Lombok pour la compatibilité Java 21 -->
            <dependencies>
                <dependency>
                    <groupId>org.projectlombok</groupId>
                    <artifactId>lombok</artifactId>
                    <version>${lombok.version}</version>
                </dependency>
            </dependencies>
        </plugin>

        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-javadoc-plugin</artifactId>
            <version>3.12.0</version>
            <configuration>
                <!-- Pointer vers le code delombokisé, pas le code source original -->
                <sourcepath>${project.build.directory}/generated-sources/delombok</sourcepath>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### L'effet de bord dans l'IDE

On pense alors avoir réussi. Mais non.

En ajoutant le plugin directement dans la section `<build>` principale, le plugin `lombok-maven-plugin` s'exécute à chaque compilation Maven, y compris lors du rechargement du projet par l'IDE.

L'IDE (IntelliJ, VSCode avec l'extension Java, Eclipse) détecte le répertoire `target/generated-sources/delombok/` et l'ajoute à ses sources. Il se retrouve alors avec **deux versions** de chaque classe : la version originale annotée Lombok dans `src/main/java/`, et la version développée dans `target/generated-sources/delombok/`. Résultat : des erreurs de compilation dans l'IDE, alors que le build Maven se déroule parfaitement.

**Il faut donc isoler cette configuration pour qu'elle ne s'active que quand on en a besoin : lors de la génération de la Javadoc.**

### Quel est mon meilleur profil ?

La solution propre est un profil Maven dédié. On y place tout ce qui concerne la génération de la Javadoc, et on ne l'active qu'explicitement.

`pom.xml` (section `<profiles>`)
```xml
<profiles>
    <profile>
        <id>javadoc</id>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.projectlombok</groupId>
                    <artifactId>lombok-maven-plugin</artifactId>
                    <version>1.18.20.0</version>
                    <executions>
                        <execution>
                            <id>delombok</id>
                            <phase>generate-sources</phase>
                            <goals>
                                <goal>delombok</goal>
                            </goals>
                            <configuration>
                                <addOutputDirectory>false</addOutputDirectory>
                                <sourceDirectory>src/main/java</sourceDirectory>
                                <verbose>true</verbose>
                            </configuration>
                        </execution>
                    </executions>
                    <dependencies>
                        <dependency>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>${lombok.version}</version>
                        </dependency>
                    </dependencies>
                </plugin>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-javadoc-plugin</artifactId>
                    <version>3.12.0</version>
                    <configuration>
                        <sourcepath>${project.build.directory}/generated-sources/delombok</sourcepath>
                    </configuration>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

L'IDE n'activera jamais ce profil de lui-même (sauf configuration explicite). Le delombok ne s'exécute donc que lors d'un appel Maven avec `-Pjavadoc`. L'IDE retrouve sa sérénité.

### Résultat final

```bash
$ mvn clean compile javadoc:javadoc -Pjavadoc
[INFO] --- lombok-maven-plugin:1.18.20.0:delombok (delombok) @ mvn-lombok-javadoc ---
[INFO] Delombok complete.
[INFO] --- maven-javadoc-plugin:3.12.0:javadoc (default-cli) @ mvn-lombok-javadoc ---
[INFO] No previous run data found, generating javadoc.
[INFO] BUILD SUCCESS
```

Plus aucun warning. La Javadoc générée contient maintenant les constructeurs privés, les méthodes du builder, les méthodes utilitaires générées par `@UtilityClass`. Tout y est, tout est documentable.

Constat : déjà plus d'une heure de recherche pour arriver à ca. Et pourtant ce n'est pas fini...

## En guise de conclusion

Dans ce cas précis, la génération de la Javadoc avec Lombok et Java 21 n'est pas si simple. Il faut passer par une étape de "delombokisation" pour générer le code source à partir des annotations, configurer correctement les plugins Maven pour Java 21, et isoler tout ca dans un profil pour ne pas perturber les IDE.

Ce qui m'a frappé dans cette résolution : **ni ChatGPT ni GitHub Copilot n'ont pu m'aider**. Les deux m'ont proposé des configurations qui ne fonctionnent pas, des versions incompatibles, des options inexistantes. La documentation officielle du plugin est parcellaire. Les Stack Overflow de l'époque évoquaient des versions bien antérieures à Java 21. Il a fallu creuser, tester, échouer, recommencer. La bonne vieille méthode.

Ca rassure un peu de se dire que certains problèmes résistent encore à la génération automatique... (humour)

**N'hésitez pas à me faire part de vos retours en commentaire, notamment si vous avez une configuration différente qui fonctionne mieux chez vous.**
