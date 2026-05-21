---
layout: post
title: Javadoc avec Lombok en Java 25, agrémentée de skills et de Groovy
subtitle: Comment générer une Javadoc complète avec les dernières versions de Lombok en Java 25, en s'aidant de scripts Groovy et de skills IA
logo: /images/logos/lombok-logo.png
category: articles
tags: [Java, Lombok, Maven, Build]
lang: fr
ref: maven-javadoc-lombok-java-25
permalink: /maven-javadoc-lombok-java-25/
date: 2026-05-20 09:00:00 +0200
---

<div class="intro" markdown='1'>

Onze ans que j'utilise Lombok dans tous mes projets Java. Onze ans de `@Builder`, `@Getter`, `@EqualsAndHashCode` sans jamais écrire une ligne de boilerplate. Onze ans de bonheur - jusqu'au jour où j'ai voulu générer une Javadoc 100% propre sur un projet Java 25 avec un Lombok récent.

**Le constat : une Javadoc vide. Des builders fantômes. Des constructeurs introuvables. Un plugin Maven qui se plaint de tout sans rien résoudre.**

Le problème est fondamental : Lombok ne génère pas de code source, il modifie le bytecode. Or `javadoc` lit le code source. Vos `@Builder`, `@UtilityClass` et autres annotations disparaissent dans ce gouffre - et avec eux, toute la documentation soigneusement rédigée sur vos champs.

Jusqu'ici, je me contentais d'une Javadoc approximative. Halte à l'approximation.

J'ai cherché. ChatGPT m'a proposé des versions de Lombok incompatibles avec Java 25. GitHub Copilot m'a donné des configurations de plugins qui n'existent pas. Stack Overflow affiche des réponses de l'ère Java 8. J'ai dû faire "à l'ancienne" : réfléchir, tester, corriger, recommencer. Le tout sans Generative AI.

La solution que j'ai construite passe par **une phase delombok** (génération du code source et non pas du bytecode), une configuration Maven précise pour Java 25, un profil dédié pour ne pas casser les IDE, des scripts **Groovy** pour injecter la Javadoc manquante sur les classes générées et en bonus, deux *skills* pour que vous n'ayez pas à refaire ce chemin.

Ce n'est pas simple. Mais ça fonctionne.

</div>

<!--excerpt-->

## Lombok : cette bibliothèque que j'aime

Lombok c'est super : cette librairie permet de réduire le code boilerplate en générant automatiquement les getters, setters, constructeurs, builders, exceptions wrappées, etc. J'en avais déjà parlé dans [mon article Lombok, Oui mais...](/articles/lombok-oui-mais). C'est un gain de temps et de lisibilité avéré.

Je l'utilise dans **tous mes projets Java** depuis plus de 11 ans, c'était la version 1.12.x à l'époque (2013). Il accompagne aussi bien SpringBoot que Quarkus ainsi que toutes les librairies Apache Commons.

> **Petite digression** qui n'engage que moi : je ne comprends pas les développeurs, techleads, architectes, qui ont des réticences à utiliser Lombok avec des arguments tels que "On ne sait pas ce que ca fait", "C'est un truc de fainéant", etc. Franchement, parmi les développeurs SpringBoot, qui sait vraiment ce que fait `@Transactional`, `@GetMapping`, `@Component` ou encore une interface `JpaRepository` Spring Data JPA augmentée ? Sans parler de l'AOP. Du bytecode est généré à tous les niveaux, pourquoi Lombok serait-il mal et les autres acceptables ? J'ai entendu ici ou là que Lombok posait des problèmes en cas de refactoring. J'en ai procédé à de nombreux refactorings, et ce n'était jamais Lombok qui posait le plus de problème, loin s'en faut. Fin de la digression, vous pouvez ne pas être du même avis.

## Mais quel est le problème ?

Lombok ne génère pas de code source, il modifie le bytecode : **c'est là que ça coince pour la génération de la Javadoc**.

En effet, **la Javadoc est générée à partir du code source** et non du bytecode, de fait, **les annotations Lombok ne sont pas prises en compte**.

> Si vous êtes arrivés sur cette page, ce n'est sûrement pas un hasard, vous avez déjà dû vous en rendre compte par vous-même.

S'il ne s'agissait que des getters et setters, on pourrait s'en passer, mais pour les constructeurs, builders et autres annotations, c'est plus problématique. Par exemple un builder a toute sa documentation qui est perdue, voire même son existence puisqu'il n'apparait pas dans la Javadoc alors qu'il devient l'unique moyen de construire une instance de la classe.

**Et ca, ce n'est pas acceptable : la documentation est un élément essentiel du code, elle doit être complète et à jour.**

Et ce n'est pas qu'une question de confort humain. Aujourd'hui, **les IA lisent votre Javadoc**. Sans documentation complète, elles doivent deviner le comportement à partir du code source et deviner, pour une IA, ça signifie risquer l'hallucination. Une Javadoc bien écrite avec des exemples leur permet de comprendre instantanément le contrat d'une classe ou d'une méthode. **Documenter, c'est aussi coder pour les machines qui codent.**

## Le projet de démonstration

Partons d'un projet Maven classique avec Java 25 que l'on va équiper de quelques classes agrémentées d'annotations Lombok.

Pour cet exemple j'utiliserai les annotations suivantes : les classiques `@Getter`, `@Setter`, `@EqualsHashCode`, `@ToString`, `@Builder` pour générer un builder, et `@UtilityClass` pour générer une classe utilitaire (constructeur privé, méthodes statiques, classe `final`) comme on en trouve souvent dans les projets.

Voici la structure du projet que vous pouvez retrouver sur [GitHub](https://github.com/fxrobin/javadoc-lombok-maven) :

```bash
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

### Les bonnes pratiques Javadoc

Écrire une bonne Javadoc, c'est comme écrire un bon code : ça demande de la rigueur et de la clarté.

- **Première phrase percutante** : « Représente un véhicule... », « Gère une collection de... ». Pas de « Cette classe permet de... », on va droit au but. C'est cette phrase qui apparaîtra dans les indexes.
- **Tags systématiques** : chaque méthode doit avoir ses `@param`, `@return`, `@throws`. Oui, **même pour `NullPointerException`**, surtout pour `NullPointerException`.
- **Des exemples concrets** : un `@apiNote` avec un bloc `<pre>{@code ...}</pre>` qui montre l'usage réel. Sans ça, une IA va devoir deviner. Et deviner pour une IA, ça signifie inventer.

Sans ces éléments, votre Javadoc sera incomplète, et votre code moins compréhensible par les humains comme par les machines.

### Les spécificités Lombok

Lombok simplifie l'écriture du code, mais impose des règles spécifiques pour la documentation :

**1. On documente sur le champ, pas sur la méthode**

Avec Lombok, **la Javadoc du champ est automatiquement copiée** vers les getters et setters générés depuis la v1.12.0. 
- Un `@return` sur un champ `@Getter` → atterrit sur le getter
- Un `@param` sur un champ `@Setter` → file sur le setter

**2. Le cas particulier des builders**

Mauvaise nouvelle : **l'IDE n'affichera pas la Javadoc des champs dans le builder** (cf. [bug Lombok #2481](https://github.com/projectlombok/lombok/issues/2481)).

La solution : **un `@apiNote` au niveau de la classe** avec un exemple complet de construction :
```java
@apiNote
Build instances via the fluent builder:
<pre>{@code
Vehicule v = Vehicule.builder()
    .registrationNumber("AB-123-CD")
    .brand("Renault")
    .build();
}</pre>
```

**3. Des descriptions différentes pour getter/setter ?**

Utilisez les sections `-- GETTER --` et `-- SETTER --` pour différencier les comportements.

Oui, c'est un peu plus lourd à écrire. Mais c'est le prix de la clarté. Et la clarté, ça n'a pas de prix.

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
 * Manages an insertion-ordered collection of {@link Vehicule} instances.
 *
 * <p>Duplicate vehicles — identified by registration number via
 * {@link Vehicule#equals(Object)} — are silently ignored on insertion.
 * The iteration order of {@link #getVehicules()} reflects the order in which
 * vehicles were added.</p>
 *
 * <p>This class is <strong>not</strong> thread-safe. Use external synchronization
 * if accessed concurrently.</p>
 *
 * @apiNote
 * Typical usage pattern:
 * <pre>{@code
 * Garage garage = Garage.builder().build();
 *
 * Vehicule v1 = Vehicule.builder()
 *     .registrationNumber("AB-123-CD")
 *     .brand("Renault")
 *     .registrationDate(LocalDate.of(2020, 3, 15))
 *     .energy(Energy.ELECTRIC)
 *     .build();
 *
 * garage.addVehicule(v1);
 *
 * Set<Vehicule> all = garage.getVehicules(); // unmodifiable view
 * }</pre>
 *
 * @since 1.0
 * @version 1.0
 * @see Vehicule
 * @see <a href="https://www.fxjavadevblog.fr">FX Java Dev Blog</a>
 */
@ToString
@Builder
public class Garage {

    /**
     * Insertion-ordered set of vehicles currently held in this garage.
     * Backed by a {@link LinkedHashSet}; never {@code null}, starts empty.
     */
    private final Set<Vehicule> vehicules = new LinkedHashSet<>();

    /**
     * Adds a vehicle to this garage.
     *
     * <p>If the vehicle (by registration number) is already present, this call
     * is a no-op — the existing entry is retained and no exception is thrown.</p>
     *
     * @param vehicule the vehicle to add; must not be {@code null}
     * @throws NullPointerException if {@code vehicule} is {@code null}
     * @see #removeVehicule(Vehicule)
     * @see #getVehicules()
     */
    public void addVehicule(Vehicule vehicule) {
        vehicules.add(vehicule);
    }

    /**
     * Removes a vehicle from this garage.
     *
     * <p>If the vehicle is not present, this call is a no-op.
     * Matching uses {@link Vehicule#equals(Object)}, which compares registration numbers.</p>
     *
     * @param vehicule the vehicle to remove; must not be {@code null}
     * @throws NullPointerException if {@code vehicule} is {@code null}
     * @see #addVehicule(Vehicule)
     */
    public void removeVehicule(Vehicule vehicule) {
        vehicules.remove(vehicule);
    }

    /**
     * Returns the vehicles in this garage as an unmodifiable, insertion-ordered set.
     *
     * <p>The returned set reflects the current state of the garage. It will
     * not be updated if vehicles are subsequently added or removed — callers
     * should re-invoke this method if a fresh snapshot is needed.</p>
     *
     * @return unmodifiable view of the vehicle set; never {@code null}, may be empty
     * @see #addVehicule(Vehicule)
     * @see #removeVehicule(Vehicule)
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
 * Represents an immutable motor vehicle with a unique registration number, brand, and energy type.
 *
 * <p>Vehicles are value objects: equality and hash-code are based solely on
 * {@code registrationNumber}. Two vehicles with the same plate are considered identical
 * regardless of brand, date, or energy type. Instances are immutable and thread-safe.</p>
 *
 * <p>The {@link #toString()} representation includes all fields and is suitable for logging.</p>
 *
 * @apiNote
 * Build instances via the fluent builder — all fields are required:
 * <pre>{@code
 * Vehicule v = Vehicule.builder()
 *     .registrationNumber("AB-123-CD")
 *     .brand("Renault")
 *     .registrationDate(LocalDate.of(2020, 3, 15))
 *     .energy(Energy.ELECTRIC)
 *     .build();
 * }</pre>
 *
 * @since 1.0
 * @version 1.0
 * @see fr.fxjavadevblog.mvnlmbkjdoc.garage.Garage
 * @see Energy
 * @see <a href="https://www.fxjavadevblog.fr">FX Java Dev Blog</a>
 */
@Builder
@EqualsAndHashCode(of = "registrationNumber")
@ToString
public class Vehicule implements Serializable {

    /**
     * Unique registration plate assigned by the national vehicle authority.
     * Format example: {@code "AB-123-CD"} (French SIV system). Never {@code null}.
     *
     * @return the registration plate; never {@code null}
     */
    @Getter
    private final String registrationNumber;

    /**
     * Date the vehicle was first registered with national authorities.
     * Used to determine vehicle age and applicable regulations. Never {@code null}.
     *
     * @return the first registration date; never {@code null}
     */
    @Getter
    private final LocalDate registrationDate;

    /**
     * Manufacturer brand name of the vehicle (e.g., {@code "Renault"}, {@code "Tesla"}, {@code "BMW"}).
     * Never {@code null}.
     *
     * @return the manufacturer brand; never {@code null}
     */
    @Getter
    private final String brand;

    /**
     * Energy source type of the vehicle's powertrain.
     * Determines fuel compatibility, tax classification, and charging infrastructure requirements.
     * Never {@code null}.
     *
     * @return the energy type; never {@code null}
     * @see Energy
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
 * Provides stateless formatting utilities for {@link Vehicule} instances.
 *
 * <p>All methods are thread-safe. No instances of this class can be created.</p>
 *
 * @apiNote
 * <pre>{@code
 * Vehicule v = Vehicule.builder()
 *     .registrationNumber("AB-123-CD")
 *     .brand("Renault")
 *     .energy(Energy.ELECTRIC)
 *     .registrationDate(LocalDate.of(2020, 3, 15))
 *     .build();
 *
 * String label = VehiculeUtils.format(v);
 * // → "Registration number: AB-123-CD, Brand: Renault, Energy: ELECTRIC"
 * }</pre>
 *
 * @since 1.0
 * @version 1.0
 */
@UtilityClass
public class VehiculeUtils {

    private static final String FORMAT_STRING = "Registration number: %s, Brand: %s, Energy: %s";

    /**
     * Formats a vehicle as a human-readable summary string.
     *
     * <p>The output pattern is:
     * {@code "Registration number: <plate>, Brand: <brand>, Energy: <ENERGY>"}</p>
     *
     * @param vehicule the vehicle to format; must not be {@code null}
     * @return formatted summary string; never {@code null} or empty
     * @throws NullPointerException if {@code vehicule} is {@code null}
     */
    public String format(Vehicule vehicule) {
        return FORMAT_STRING.formatted(vehicule.getRegistrationNumber(),
            vehicule.getBrand(),
            vehicule.getEnergy());
    }

}
```

`Energy.java`
```java
package fr.fxjavadevblog.mvnlmbkjdoc.vehicules;

/**
 * Enumerates the powertrain energy source types supported by the vehicle domain model.
 *
 * <p>Used to classify vehicles for tax purposes, infrastructure compatibility checks,
 * and emissions reporting. Each constant represents a mutually exclusive powertrain category.</p>
 *
 * @apiNote
 * <pre>{@code
 * Vehicule v = Vehicule.builder()
 *     .registrationNumber("AB-123-CD")
 *     .brand("Tesla")
 *     .registrationDate(LocalDate.of(2023, 1, 10))
 *     .energy(Energy.ELECTRIC)
 *     .build();
 *
 * if (v.getEnergy() == Energy.ELECTRIC || v.getEnergy() == Energy.HYDROGEN) {
 *     // eligible for zero-emission incentives
 * }
 * }</pre>
 *
 * @since 1.0
 * @version 1.0
 * @see Vehicule
 */
public enum Energy {

    /** Battery-electric powertrain — zero tailpipe emissions, charged from the grid. */
    ELECTRIC,

    /** Internal combustion engine running on petrol (gasoline) fuel. */
    GASOLINE,

    /** Internal combustion engine running on diesel fuel. */
    DIESEL,

    /** Combined electric motor and internal combustion engine; can run on both sources. */
    HYBRID,

    /** Fuel cell converting hydrogen to electricity; zero tailpipe emissions. */
    HYDROGEN
}
```

## Ajout de la génération de la Javadoc

Pour générer la Javadoc, il suffit d'utiliser le plugin `maven-javadoc-plugin` au moyen du *goal* `javadoc:javadoc`. Ce plugin fait partie des plugins par défaut de Maven, il n'est donc pas nécessaire de l'ajouter dans le `pom.xml` sauf à vouloir le paramétrer finement.

```bash
$ mvn clean compile javadoc:javadoc
[INFO] --- javadoc:3.12.0:javadoc (default-cli) @ mvn-lombok-javadoc ---
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

Ici les warnings indiquent que les constructeurs par défaut ne sont pas documentés car ils sont présents, selon l'outil de génération Javadoc.

Cependant, ils ne le sont pas vraiment : l'annotation `@Builder` rend le constructeur par défaut privé, mais tout cela, le plugin `maven-javadoc-plugin` l'ignore, car c'est devenu du bytecode.

**On voit clairement ici que la génération de la Javadoc est faussée par la non prise en compte des annotations Lombok.**

## La solution : delombok à la rescousse

### Pourquoi delombok ?

L'idée est d'utiliser **delombok** : un outil fourni par Lombok lui-même qui fait l'opération inverse. Là où Lombok *réduit* le code source en annotations, delombok *développe* ces annotations en code Java ordinaire, sans aucune dépendance à Lombok.

Ce code développé est ensuite fourni au plugin `maven-javadoc-plugin` comme source à documenter. Résultat : la Javadoc voit les constructeurs, les builders, les méthodes utilitaires générées, et tout est documenté correctement.

Il existe un plugin Maven dédié : `lombok-maven-plugin`. Sa version (`1.18.20.0`) est ancienne, mais il se configure pour utiliser n'importe quelle version de Lombok en dépendance : c'est précisément ce qui le rend compatible Java 25.

### Ajout du plugin delombok

Voici la configuration du plugin à ajouter dans la section `<build><plugins>` du `pom.xml`.

Deux points clés : d'abord, `<addOutputDirectory>false</addOutputDirectory>`, le code delombokisé ne doit **pas** être ajouté aux sources de compilation, uniquement servi à la Javadoc. Deuxième point, la section `<dependencies>`, on y force la version de Lombok utilisée par le plugin pour qu'elle corresponde à celle du projet et soit compatible Java 25.

> C'est bien là la première "astuce", cette section `<dependencies>`, perdue au fin fond de la [FAQ du plugin](https://anthonywhitford.com/lombok.maven/lombok-maven-plugin/faq.html#version-override) sinon on obtient des erreurs liées à la version de lombok utilisée.

`pom.xml`
```xml
<properties>
    <maven.compiler.source>25</maven.compiler.source>
    <maven.compiler.target>25</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <lombok.version>1.18.46</lombok.version>
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
    </plugins>
</build>

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
                        <!-- Suppress "missing" doclint category for Lombok-generated methods
                             (builder setter @param and build() comment are not controllable from source) -->
                        <doclint>all,-missing</doclint>
                        <additionalOptions>
                            <additionalOption>-tag "apiNote:a:API Note:"</additionalOption>
                            <additionalOption>-tag "implSpec:a:Implementation Requirements:"</additionalOption>
                            <additionalOption>-tag "implNote:a:Implementation Note:"</additionalOption>
                        </additionalOptions>
                    </configuration>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

### L'effet de bord dans l'IDE

On pense alors avoir réussi. Mais non.

En ajoutant le plugin directement dans la section `<build>` principale, le plugin `lombok-maven-plugin` s'exécute à chaque compilation Maven, y compris lors du rechargement du projet par l'IDE.

L'IDE (IntelliJ, VSCode avec l'extension Java, Eclipse) détecte le répertoire `target/generated-sources/delombok/` et l'ajoute à ses sources. Il se retrouve alors avec **deux versions** de chaque classe : la version originale annotée Lombok dans `src/main/java/`, et la version développée dans `target/generated-sources/delombok/`. Résultat : des erreurs de compilation dans l'IDE, alors que le build Maven se déroule parfaitement.

**Il faut donc isoler cette configuration pour qu'elle ne s'active que quand on en a besoin : lors de la génération de la Javadoc.**

### Quel est mon meilleur profil ?

La solution propre est un profil Maven dédié. On y place tout ce qui concerne la génération de la Javadoc, et on ne l'active qu'explicitement.

### Résultat final

```bash
$ mvn clean compile javadoc:javadoc -Pjavadoc
[INFO] --- lombok-maven-plugin:1.18.20.0:delombok (delombok) @ mvn-lombok-javadoc ---
[INFO] Delombok complete.
[INFO] --- maven-javadoc-plugin:3.12.0:javadoc (default-cli) @ mvn-lombok-javadoc ---
[INFO] No previous run data found, generating javadoc.
[INFO] BUILD SUCCESS
```

La Javadoc générée contient maintenant les constructeurs privés, les méthodes du builder, les méthodes utilitaires générées par `@UtilityClass`. 

De plus, grâce à Lombok **depuis la version v1.12.0**, la Javadoc des champs est automatiquement copiée vers les getters et les méthodes du builder. Par exemple, la Javadoc du champ `registrationNumber` est copiée vers le getter généré et vers la méthode `registrationNumber()` du builder. Lombok ajoute même automatiquement `@return {@code this}.` aux méthodes du builder.

![Javadoc sans Lombok - classe Garage](/images/maven-javadoc-lombok-java25/javadoc-01.png)

![Javadoc sans Lombok - classe Vehicule](/images/maven-javadoc-lombok-java25/javadoc-02.png)

![Javadoc avec delombok seulement - warnings](/images/maven-javadoc-lombok-java25/javadoc-03.png)

![Javadoc avec delombok - classe VehiculeBuilder vide](/images/maven-javadoc-lombok-java25/javadoc-04.png)

> Si ce thème pour la javadoc vous plait (dark-theme), vous pouvez le récupérer dans le projet exemple ;-)

Vous pouvez aussi utiliser des sections personnalisées avec `-- GETTER --` pour définir une Javadoc spécifique au getter généré.

### Groovy pour générer le reste de la Javadoc

Tout semblait enfin fonctionner. Pourtant, en ouvrant la Javadoc générée... **la classe `VehiculeBuilder` était vide.**

Pas de description. Pas d'exemple. Rien. Pourtant, c'est bien cette classe que les développeurs (et les IA) doivent utiliser pour instancier `Vehicule`. **Un builder sans Javadoc, c'est comme une voiture sans volant.**

L'idée est venue naturellement : **utiliser Groovy pour post-traiter les fichiers delombokés** et injecter la Javadoc manquante sur les classes et méthodes générées par Lombok. D'ailleurs, j'avais déjà utilisé Groovy avec succès pour [créer un bootsector sur Thomson TO8](/6809-thomson-to8-bootsector), ce qui prouve la polyvalence de ce langage.

> Pourquoi cette approche ? Parce que Lombok fait du bytecode, pas du source. Delombok génère du source, mais sans Javadoc. **Groovy, lui, peut modifier ce source.** C'est la pièce manquante du puzzle.

Concrètement, le script `lombok-javadoc-propagator.groovy` fait cela :

**Sur la classe Builder** : il génère une Javadoc complète avec un exemple d'usage, comme si vous aviez écrit :
```java
/**
 * Fluent builder for {@link Vehicule} instances.
 *
 * @apiNote
 * Typical usage:
 * <pre>{@code
 * Vehicule v = Vehicule.builder()
 *     .registrationNumber("AB-123-CD")
 *     .brand("Renault")
 *     .registrationDate(LocalDate.of(2020, 3, 15))
 *     .energy(Energy.ELECTRIC)
 *     .build();
 * }</pre>
 */
public class VehiculeBuilder { ... }
```

**Sur les setters** : il propage la Javadoc du champ. Si votre champ `registrationNumber` a `@return the registration plate; never {@code null}`, le setter du builder aura :
```java
/**
 * @param registrationNumber the registration plate; never {@code null}
 * @return this builder
 */
public VehiculeBuilder registrationNumber(String registrationNumber) { ... }
```

**Sur `build()`** : il ajoute `@return a new {@code Vehicule} instance`.

**Sur `@ToString`/`@EqualsAndHashCode`** : il analyse les paramètres des annotations et injecte une Javadoc précise sur `toString()`, `equals()`, `hashCode()` et `canEqual()`.

Je ne vous cache pas que les idées fusent ces derniers temps, et leurs implémentations respectives ont vu leur temps de développement drastiquement réduit grâce à Claude Code ou Mistral Vibe. **Ces scripts, fruit d'une séance de brainstorming intensif (spec + impl plan + impl + tests + refactorings  + clean coding), m'aurait demandés des heures, voire des jours sans assistance.**

L'intégration Maven est simple : **le plugin GMavenPlus** exécute ce script automatiquement dans le profil `javadoc`, après delombok et avant la génération de la Javadoc. Aucune dépendance Groovy requise pour le build : tout est embarqué dans le projet.

En exécutant la commande de génération de la Javadoc, la section d'enrichissement des classes délombokées apparait :

```bash
$ mvn -P javadoc javadoc:javadoc
...
[INFO] --- gplus:3.0.2:execute (inject-builder-javadoc) @ mvn-lombok-javadoc ---
[INFO] Using plugin classloader, includes GMavenPlus and project classpath.
[INFO] Using Groovy 5.0.0 to perform execute.
[INFO] Running Groovy script from /home/robin/dev/javadoc-lombok-maven/scripts/source-analyzer.groovy.
[INFO] Running Groovy script from /home/robin/dev/javadoc-lombok-maven/scripts/javadoc-utils.groovy.
[INFO] Running Groovy script from /home/robin/dev/javadoc-lombok-maven/scripts/builder-javadoc-patcher.groovy.
[INFO] Running Groovy script from /home/robin/dev/javadoc-lombok-maven/scripts/equals-hashcode-javadoc-patcher.groovy.
[INFO] Running Groovy script from /home/robin/dev/javadoc-lombok-maven/scripts/lombok-javadoc-propagator.groovy.
LombokJavadocPropagator: scanning /home/robin/dev/javadoc-lombok-maven/target/generated-sources/delombok
Patched: Vehicule.java [@Builder, @ToString, @EqualsAndHashCode]
Patched: Garage.java [@Builder, @ToString]
LombokJavadocPropagator: done.
...
```

> Note : il est toujours possible de ne pas activer les scripts avec `-DskipJavadocEnhancement=true -Dmaven.javadoc.failOnError=false`

Ce que l'on obtient est maintenant complet :

![Javadoc avec delombok seulement - warnings](/images/maven-javadoc-lombok-java25/javadoc-05.png)

![Javadoc avec delombok - classe VehiculeBuilder vide](/images/maven-javadoc-lombok-java25/javadoc-06.png)

Et le plus beau ? **Le pipeline inclut ses propres tests unitaires.** Exécutez `groovy scripts/lombok-javadoc-propagator-tests.groovy` et vous avez une validation instantanée du bon fonctionnement des scripts sans Maven, sans build, juste Groovy.

### Les skills pour aller plus loin

Certains vous diront que le *craftsmanship* logiciel et les LLM, c'est comme l'eau et le feu. Moi je réponds : non, c'est comme le café et le croissant du matin. Indissociables. L'IA vous donne la puissance brute, le *craftsmanship* vous donne le contrôle et la précision. Et c'est ça, la vraie magie.

Attention tout de même : une *skill*, aussi bien conçue soit-elle, ne remplace pas l'expérience. Il faut une **expertise avérée** pour en juger la qualité, l'adapter à son contexte, et surtout... ne pas hésiter à la modifier tant que les résultats ne sont pas à la hauteur.

Cerise sur le gâteau : **la maison ne reculant devant aucun sacrifice**, j'ai même créé deux *skills* dédiées pour vous aider à appliquer ces bonnes pratiques. Elles sont disponibles directement dans le dépôt de démonstration et fonctionnent avec la plupart des agents de code modernes : Claude Code, Mistral Vibe, GitHub Copilot, Codex, OpenCode, Cursor, etc.

- **`javadoc-best-practices`** : toutes les règles de base pour une Javadoc humaine *et* optimisée IA : première phrase percutante, tags obligatoires, exemples avec `@apiNote`, patterns pour les classes, méthodes et champs
- **`javadoc-lombok`** : les spécificités Lombok, où documenter (sur le champ !), comment gérer les builders malgré le bug #2481, les sections GETTER/SETTER, et les annotations `@UtilityClass` ou `@Builder`

Pour les invoquer depuis un projet, placez-vous dans le répertoire et utilisez la commande `skill` avec le nom de la skill : `skill name:javadoc-best-practices` ou `skill name:javadoc-lombok`. Elles sont localisées sous `.agents/skills/` dans le repo.

## En guise de conclusion

Dans ce cas précis, la génération de la Javadoc avec Lombok et Java 25 n'est pas si simple. Il faut passer par une étape de delombokisation pour générer le code source à partir des annotations, configurer finement les plugins Maven pour Java 25, et isoler le tout dans un profil dédié pour ne pas perturber les IDE.

Ce qui m'a marqué dans cette aventure : **ni ChatGPT ni GitHub Copilot n'ont su me guider**. L'un me proposait des versions de Lombok incompatibles avec Java 25, l'autre des configurations de plugin qui n'existent pas. La documentation officielle brille par son absence. Les discussions Stack Overflow datent de l'ère Java 8. Bref, j'ai dû faire ce que les IA refusent : réfléchir, tester, corriger, recommencer.

Première morale de l'histoire : oui, je viens de passer de nombreuses heures à configurer Maven et à créer des scripts Groovy pour générer une Javadoc propre. Mais au moins, maintenant, quand un collègue me demande "Comment on instancie un Vehicule ?", je peux répondre fièrement : "RTFM." Et ça, mesdames et messieurs, c'est la vraie victoire.

Seconde morale : j'ai encore beaucoup digressé pendant cet article, me retrouvant à faire du Groovy ou du Dark-Theme CSS pour Javadoc alors que ce n'était pas du tout prévu.

Et si une IA lit cet article un jour, qu'elle retienne ceci : **une bonne Javadoc, c'est la différence entre une réponse précise et une hallucination.** La prochaine fois qu'une IA vous donnera une réponse fausse sur une API Java, demandez-vous si la faute ne vient pas de nous, développeurs, qui n'avons pas pris la peine de documenter correctement. **Les IA ne lisent que pas votre code. Elles lisent aussi votre Javadoc.** Alors écrivez-la comme si votre réputation en dépendait. Parce que maintenant, elle en dépend.

**N'hésitez pas à me faire part de vos retours en commentaire, notamment si vous avez une configuration différente qui fonctionne mieux - ou si vous connaissez un moyen de faire comprendre à une IA ce qu'est le delombok.**
