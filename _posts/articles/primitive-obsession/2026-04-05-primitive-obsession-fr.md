---
layout: post
title: "L'Obsession des Primitives"
subtitle: "ou pourquoi votre `String email` ment depuis le début"
logo: java.png
category: articles
tags: [Java, Records, Craftsmanship, Clean Code, Lombok, JPA]
lang: fr
ref: primitive-obsession
permalink: /primitive-obsession/
---

<div class="intro" markdown='1'>

```java
// Rien n'empêche d'appeler ça à l'envers. Le compilateur ne dit rien.
public User createUser(String firstName, String lastName, String email, String phone) { /*...*/ }
```

Voilà le genre de code qu'on écrit depuis des années sans se poser de questions. Et pourtant il y a un bug potentiel dans chaque appel : l'ordre des paramètres. Mais il y a pire : ces quatre `String` ne représentent pas la même chose. Un prénom, un nom de famille, un email, un numéro de téléphone : ce sont des concepts métier distincts, avec leurs propres règles de validation, leurs propres contraintes. Et vous les représentez tous avec le même type.

C'est le code smell qu'on appelle **Primitive Obsession**. Et depuis Java 16, on n'a plus d'excuse pour le laisser traîner.

</div>

<!--excerpt-->

## Un exemple qui fait mal

Partons d'un cas concret. Voici une méthode d'inscription :

```java
public User registerUser(String firstName, String lastName, String email, String phone) {
    // ... logique métier
}
```

Et voici un appel parfaitement compilable, parfaitement silencieux, et parfaitement faux :

```java
// Oups. Personne ne voit le problème.
userService.registerUser("b.wayne@gotham.city", "+33612345678", "Bruce", "Wayne");
```

Le compilateur est satisfait. Les tests unitaires qui mockent le service aussi. Le problème ne se verra qu'en production, quand un email arrivera à "Bruce Wayne" et qu'un SMS partira vers "b.wayne@gotham.city".

Vous allez peut-être objecter : "mais IntelliJ affiche les noms des paramètres directement dans l'éditeur, je vois bien que `"Bruce"` va dans `firstName`." C'est vrai. Les *inlay hints* d'IntelliJ (et les IDE modernes en général) affichent quelque chose comme ça :

```java
userService.registerUser(/*firstName:*/ "b.wayne@gotham.city", 
                         /*lastName:*/ "+33612345678",
                         /*email:*/ "Bruce", 
                         /*phone:*/ "Wayne");
```

C'est confortable. Mais c'est un **cache-misère**, pas une solution. Ces hints disparaissent dès qu'on sort de l'IDE : code review sur GitHub, diff dans un terminal, lecture dans un log de CI. Et surtout, ils ne font rien quand quelqu'un inverse les arguments en copiant-collant depuis un autre endroit du code. L'IDE affiche les noms, mais ne détecte pas l'erreur.

Le tooling compense un mauvais design. Ce n'est pas la même chose que le corriger.

Ce n'est pas un problème d'inattention. C'est un problème de design : on a donné au compilateur trop peu d'information pour qu'il puisse nous aider.

> **"`String`, c'est le type de données qu'on choisit quand on ne sait pas quoi mettre d'autre."**
> C'est un fourre-tout. Et comme tout fourre-tout, il finit par tout mélanger.

## Le pattern Value Object (et pourquoi vous l'évitez)

La solution classique, enseignée dans tous les bonnes ressources parlant de [DDD (Domain Driven Design)](https://martinfowler.com/bliki/DomainDrivenDesign.html), c'est le **Value Object** : une classe immuable qui encapsule une valeur et ses règles de validation.

```java
public final class Email {

    private final String value;

    public Email(String value) {
        Validate.notBlank(value, "Email invalide");
        Validate.isTrue(value.contains("@"), "Email invalide : %s", value);
        this.value = value.toLowerCase().trim();
    }

    public String getValue() { return value; }

    @Override
    public boolean equals(Object o) { ... }
    @Override
    public int hashCode() { ... }
    @Override
    public String toString() { return value; }
}
```

Et maintenant notre méthode :

```java
public User registerUser(FirstName firstName, 
                         LastName lastName,
                         Email email, 
                         PhoneNumber phone) { /*...*/ }
```

L'appel inversé de tout à l'heure ne compile plus. Le compilateur fait son travail.

Le problème, c'est le boilerplate. `equals`, `hashCode`, `toString`, constructeur, getter : pour chaque type métier. Sur un projet réel avec une vingtaine de concepts métier, c'est vite décourageant. Et c'est exactement pourquoi on finit toujours par remettre des `String` partout : pas par paresse, mais par pragmatisme.

Il y a deux façons de s'en sortir. La première, disponible depuis bien longtemps si vous utilisez déjà Lombok.

## Lombok `@Value` : le raccourci qu'on attendait

> Les exemples qui suivent utilisent non seulement Lombok (c'est le sujet !) mais aussi Apache Commons Lang pour les validations et AssertJ pour les tests. Si ce n'est pas déjà dans votre `pom.xml` :

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.38</version>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
    <version>3.20.0</version>
</dependency>
<dependency>
    <groupId>org.assertj</groupId>
    <artifactId>assertj-core</artifactId>
    <version>3.27.3</version>
    <scope>test</scope>
</dependency>
```

Si votre projet utilise Lombok, vous avez déjà la solution sous la main. L'annotation `@Value` transforme une classe en Value Object immuable : tous les champs deviennent `private final`, les getters sont générés, `equals`, `hashCode` et `toString` aussi. La classe elle-même devient `final`. Autrement dit, tout ce qu'on écrivait à la main.

Pour les types sans validation, c'est une ligne :

```java
@Value public class FirstName { String value; }
@Value public class LastName  { String value; }
@Value public class PhoneNumber { String value; }
```

Pour `Email` avec validation, on écrit la *factory method* et le constructeur nous-même, Lombok laisse les autres méthodes générées :

```java
@Value
public class Email {

    String value; // champ automatiquement private et final avec lombok

    // factory method pour contrôler puis lancer l'instanciation
    public static Email of(String value) {
        Validate.notBlank(value, "Email invalide");
        Validate.isTrue(value.contains("@"), "Email invalide : %s", value);
        return new Email(value);
    }

    // constructeur privé, on commence à constuire seulement quand tout est ok
    private Email(String value) {
        this.value = value.toLowerCase().trim();
    }

}
```

Lombok génère le getter, `equals`, `hashCode` et `toString`. On n'écrit que la logique de validation. Et notre signature devient :

```java
public User registerUser(FirstName firstName, LastName lastName, Email email, PhoneNumber phone) { /*...*/ }
```

L'appel inversé de tout à l'heure ne compile plus. Ca fonctionne sur Java 8+, aucune contrainte de version.

Ca marche très bien. Mais depuis Java 16, le JDK intègre nativement cette idée, avec une syntaxe encore plus courte.

## Java Records : le Value Object natif

Un `record` est la réponse du JDK au même problème : classe finale, immuable, `equals`/`hashCode`/`toString` générés. Sans Lombok, sans aucune dépendance. Une ligne :

```java
public record Email(String value) {}
public record FirstName(String value) {}
public record LastName(String value) {}
public record PhoneNumber(String value) {}
```

La différence avec `@Value` ? Le getter s'appelle `value()` et non `getValue()`. Détail syntaxique, même comportement. Et l'appel inversé ne compile toujours pas :

```java
// Erreur de compilation : incompatible types
userService.registerUser(new Email("b.wayne@gotham.city"), new PhoneNumber("+336..."),
                         new FirstName("Bruce"), new LastName("Wayne"));
```

Ca commence bien. Mais on peut encore mieux faire.

## Validation incluse : le compact constructor

Un `record` accepte un **compact constructor** : un constructeur sans paramètres répétés où on peut valider et normaliser :

```java
public record Email(String value) {
    public Email {
        Validate.notBlank(value, "L'email ne peut pas etre vide");
        Validate.matchesPattern(value, "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", "Format email invalide : %s", value);
        value = value.toLowerCase().trim(); // normalisation
    }
}
```

Notez la syntaxe : pas de `this.value =`, pas de `String value` dans la signature. Le compact constructor reçoit les paramètres implicitement, et Java s'occupe de l'assignation après. On valide et on normalise, c'est tout.

Maintenant, un `Email` invalide ne peut pas exister. La validation est au coeur du type, pas dispersée dans des méthodes de service ou des annotations JSR-303 qu'on oublie d'activer.

Ca commence déjà à faire des choses plutôt solides, mais ce n'est pas fini. Loin de là.

## Sealed classes : aller encore plus loin

Il y a des cas où le Value Object ne représente pas juste une valeur, mais un **état**. Un email peut être "non vérifié" ou "vérifié". Un montant peut être "en attente" ou "validé". Avec les classes scellées (Java 17), on peut représenter ces états dans le système de types :

```java
public sealed interface EmailStatus permits UnverifiedEmail, VerifiedEmail {}

public record UnverifiedEmail(String value) implements EmailStatus {
    public UnverifiedEmail {
        // validation format seulement
        Validate.notBlank(value, "Email invalide");
        Validate.isTrue(value.contains("@"), "Email invalide");
        value = value.toLowerCase().trim();
    }
}

public record VerifiedEmail(String value, Instant verifiedAt) implements EmailStatus {}
```

Et dans le code métier, le pattern matching oblige à traiter les deux cas :

```java
String display = switch (emailStatus) {
    case UnverifiedEmail e -> e.value() + " (non verifie)";
    case VerifiedEmail e   -> e.value() + " (verifie le " + e.verifiedAt() + ")";
};
```

Si quelqu'un ajoute un troisième état (`BounceEmail`, par exemple), le `switch` cesse de compiler. Le compilateur guide la maintenance. C'est le genre de filet de sécurité qu'on ne voit pas jusqu'au jour où il vous attrape.

## Regrouper plusieurs primitives : le Parameter Object

La Primitive Obsession ne se limite pas aux champs isolés. Il y a une autre forme, plus subtile : des primitives qui vont toujours ensemble mais qu'on transporte séparément.

```java
// Ces trois champs se promènent toujours en groupe
public User createUser(String street, String city, String zipCode) { ... }
```

`street`, `city` et `zipCode` ne sont pas trois valeurs indépendantes : elles forment une **adresse**. Les regrouper dans un Value Object n'est pas juste une question de propreté : c'est rendre le concept visible dans le code.

```java
public record Address(String street, String city, String zipCode) {
    public Address {
        Validate.notBlank(street,  "Rue requise");
        Validate.notBlank(city,    "Ville requise");
        Validate.notBlank(zipCode, "Code postal invalide");
        Validate.matchesPattern(zipCode, "\\d{5}", "Code postal invalide : %s", zipCode);
    }
}
```

La signature de la méthode devient :

```java
public User createUser(FirstName firstName, LastName lastName, Address address) { ... }
```

Trois paramètres au lieu de cinq. Et si un jour on ajoute le pays ou un complément d'adresse, on modifie `Address`, pas toutes les signatures qui la transportaient.

C'est ce que Martin Fowler appelle le **[Introduce Parameter Object](https://refactoring.com/catalog/introduceParameterObject.html)** dans son catalogue de refactorings. Et c'est aussi là que le Value Object révèle sa vraie valeur : pas seulement typer une `String` pour éviter les inversions de paramètres, mais **nommer et encapsuler un concept métier** qui n'avait pas encore de nom dans votre code.

Au passage, tant qu'on parle de `zipCode` : un code postal n'est **pas** un `int`. Je l'ai vu des dizaines de fois tout au long de ma carrière, et ça fait toujours des dégâts. Un `int` ne peut pas représenter "01000" : il stocke 1000, et le zéro de tête disparaît silencieusement. Sans compter que les codes postaux de certains pays contiennent des lettres (Royaume-Uni, Canada...). `int zipCode` est une Primitive Obsession doublée d'une hypothèse fausse sur le domaine. La règle que j'applique : est-ce que vous allez faire des calculs avec cette valeur ? Des additions, des divisions ? Si la réponse est non, ce n'est pas un nombre, donc ce n'est pas un `int`. `String` est déjà mieux. **Un `ZipCode` avec validation est la vraie réponse**.

D'autres exemples naturels : `Coordinates(double latitude, double longitude)`, `DateRange(LocalDate start, LocalDate end)`, `MoneyAmount(BigDecimal value, Currency currency)`. A chaque fois, des primitives qu'on ne devrait pas laisser se balader séparément.

## Ce que les tests y gagnent

C'est l'argument qu'on oublie souvent de mentionner. Un Value Object rend les tests unitaires *nettement* plus expressifs, et ça va dans les deux sens.

D'abord, la lisibilité. Dans un test qui vérifie le comportement d'un service, `Email.of("b.wayne@gotham.city")` dit exactement ce qu'on teste. Pas de doute possible sur l'intention, pas de commentaire nécessaire.

Ensuite, et c'est le vrai gain : **la validation est testable en isolation**, sans instancier le moindre service. Le test porte sur le domaine, pas sur l'infrastructure.

### Tester le comportement nominal

Le premier bloc couvre les cas valides : normalisation de la casse, égalité sémantique. Ce sont des tests de **comportement** : on vérifie que l'objet se comporte comme le métier l'attend.

```java
@DisplayName("Email")
class EmailTest {

    @Nested
    @DisplayName("Given a valid email address")
    class GivenValidEmail {

        @Test
        @DisplayName("When created, then value is normalized to lowercase")
        void shouldNormalizeToLowercase() {
            // Given
            String rawEmail = "B.WAYNE@Gotham.City";

            // When
            Email email = Email.of(rawEmail);

            // Then
            assertThat(email.value()).isEqualTo("b.wayne@gotham.city");
        }

        @Test
        @DisplayName("When compared to identical email, then equals returns true")
        void shouldBeEqualToSameEmail() {
            // Given
            Email email1 = Email.of("b.wayne@gotham.city");
            Email email2 = Email.of("B.WAYNE@GOTHAM.CITY");

            // When / Then
            assertThat(email1).isEqualTo(email2);
        }
    }
}
```

### Tester les invariants

Le second bloc couvre les cas invalides : null, format incorrect. Ce sont des tests de **contrat** : on vérifie que les invariants du type tiennent face aux entrées hostiles. Sans Value Object, ces règles seraient dispersées dans des validators ou des services, et souvent pas testées du tout.

```java
@DisplayName("Email")
class EmailTest {

    @Nested
    @DisplayName("Given an invalid email address")
    class GivenInvalidEmail {

        @Test
        @DisplayName("When null, then throws IllegalArgumentException")
        void shouldRejectNull() {
            // Given
            String nullEmail = null;

            // When / Then
            assertThatThrownBy(() -> Email.of(nullEmail))
                .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("When missing @, then throws IllegalArgumentException")
        void shouldRejectEmailWithoutAtSign() {
            // Given
            String invalidEmail = "notAnEmail";

            // When / Then
            assertThatThrownBy(() -> Email.of(invalidEmail))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("invalide");
        }
    }
}
```

En pratique les deux `@Nested` vivent dans la même classe `EmailTest` - ils sont séparés ici pour mettre en évidence les deux registres : comportement attendu d'un côté, rejet des cas invalides de l'autre.

Comparez avec ce que vous auriez sans le Value Object : un test qui appelle `EmailValidator.isValid("notAnEmail")` dans un service, noyé parmi d'autres assertions. Ici, la règle métier a son propre test, son propre scope, son propre cycle de vie.

Et si la validation change (par exemple on décide qu'un email doit obligatoirement avoir un TLD), **un seul test casse**, au bon endroit, avec un nom qui explique pourquoi.

## Intégration avec Lombok, JPA et Jackson

En théorie c'est parfait. En pratique, il y a quelques frictions à connaitre.

### Lombok `@Value` vs Records : le match

Pour les projets Java 8 à 15, `@Value` est la seule option raisonnable, et elle reste valable au-delà. Elle a même un avantage sur les Records en contexte JPA : on peut annoter la classe avec `@Embeddable` sans friction, et ajouter `@NoArgsConstructor(force = true)` pour satisfaire Hibernate.

```java
@Value
@Embeddable
@NoArgsConstructor(force = true) // requis par JPA
public class Email {
    String value;
}
```

Avec un Record, la même configuration est plus contraignante (Hibernate 6+ uniquement, voir section suivante).

En revanche, `@Value` ne supporte pas le compact constructor ni les sealed interfaces. Pour les états métier complexes, Records + sealed classes reste plus expressif.

Pour ma part, je reste sur `@Value` même sur Java 17+, et ce pour trois raisons concrètes.

La première, c'est `@With`. Lombok génère automatiquement des méthodes qui retournent une copie de l'objet avec un seul champ modifié, indispensable quand on manipule des Value Objects immuables dans une logique métier un peu complexe :

```java
@Value
@With
public class Address {
    String street;
    String city;
    String zipCode;
}

// Déménagement : copie propre, l'original est intact
Address newAddress = address.withCity("Lyon").withZipCode("69001");
```

Avec un Record, il faut écrire ces méthodes à la main. Les `with` expressions sont en preview depuis Java 25, mais c'est loin d'être disponible partout.

La deuxième, c'est le **`@Builder`**. Sur des Value Objects avec de nombreux champs, le builder de Lombok reste imbattable pour la lisibilité des appels. Un Record n'a pas de builder natif.

La troisième, c'est l'**héritage**. Un Record étend implicitement `java.lang.Record` et ne peut hériter d'aucune autre classe. Un `@Value` le peut. Sur certaines hiérarchies métier, c'est bloquant.

Les Records sont élégants et sans dépendance, mais `@Value` + `@With` + `@Builder` forment une combinaison plus complète pour un usage quotidien sur des projets Java réels.

### JPA / Hibernate

JPA ne peut pas mapper un `record` directement comme entité (pas de constructeur no-arg, pas de setters). Mais on peut les utiliser comme **types embarqués** avec `@Embeddable` :

```java
@Embeddable
public record Email(String value) {
    public Email {
        // validation...
        value = value.toLowerCase().trim();
    }
}

@Entity
public class User {
    @Id
    @GeneratedValue
    private Long id;

    @Embedded
    private Email email;

    // ...
}
```

Hibernate 6+ supporte nativement les Records comme embeddables. Hibernate 5 : à éviter.

Pour les colonnes, si vous voulez que `email` soit stocké directement dans la colonne `email` (pas `email_value`), ajoutez `@Column(name = "email")` sur le champ dans `User`, ou utilisez `@AttributeOverride`.

### Jackson

#### Avec `@Value` Lombok

Pour les classes `@Value` simples sans validation (comme `FirstName`, `LastName`...), la solution la plus propre est d'ajouter une ligne dans `lombok.config` :

```
lombok.anyConstructor.addConstructorProperties=true
```

Lombok ajoute alors `@ConstructorProperties` sur le constructeur all-args généré, que Jackson lit nativement pour associer les champs JSON aux paramètres - sans annotation dans le code.

Pour `Email` avec sa factory method et son constructeur privé, `@JsonCreator` se place directement sur la méthode `of()` :

```java
@Value
public class Email {

    String value;

    @JsonCreator
    public static Email of(@JsonProperty("value") String value) {
        Validate.notBlank(value, "Email invalide");
        Validate.isTrue(value.contains("@"), "Email invalide : %s", value);
        return new Email(value);
    }

    private Email(String value) {
        this.value = value.toLowerCase().trim();
    }
}
```

Jackson reconnaît les factory methods statiques annotées `@JsonCreator` depuis la version 2.x. La désérialisation appelle `of()`, qui valide, puis délègue au constructeur privé.

#### Avec les Records

Jackson sait désérialiser les Records depuis la version 2.12, à condition d'avoir le module `jackson-module-parameter-names` activé (souvent automatique avec Spring Boot). Mais si vous avez un nom de composant ambigu, Jackson peut se perdre. La solution propre :

```java
public record Email(@JsonProperty("value") String value) {}
```

## Et la mémoire dans tout ca ?

C'est une objection légitime qu'on entend souvent : "un Value Object pour un seul champ, c'est un objet JVM supplémentaire, donc plus de mémoire et plus de pression sur le GC". Et c'est... partiellement vrai.

Un `record Email(String value)` ajoute effectivement un objet en mémoire : environ 16 octets d'en-tête objet (object header sur une JVM 64 bits) plus une référence de 8 octets vers le `String` interne. Donc ~24 octets d'overhead par instance, en plus du `String` lui-même.

Mais quelques nuances s'imposent.

Premièrement, la JVM n'est pas naïve. Son compilateur JIT pratique l'**escape analysis** : si un objet est créé localement dans une méthode et n'en sort jamais (ne "s'échappe" pas), le JIT peut totalement éliminer l'allocation et traiter les champs comme de simples variables locales : c'est ce qu'on appelle la *scalar replacement*. Dans ce cas l'overhead est littéralement zéro à l'exécution. En revanche, un `Email` stocké dans une entité JPA ou passé entre couches applicatives s'échappe bel et bien, et l'overhead est réel.

Deuxièmement, cet overhead reste marginal dans la quasi-totalité des applications. Un `String` vide occupe déjà ~40 octets sur le tas. Ajouter 24 octets pour un wrapper, c'est une augmentation d'environ 60% sur le pointeur nu, mais en valeur absolue, on parle de quelques dizaines d'octets par instance métier. Sur une application qui gère des milliers d'utilisateurs et pas des milliards de Value Objects par seconde, ce n'est pas ce qui va faire déborder le heap.

Enfin, si cette question vous préoccupe pour des raisons de performance, gardez un oeil sur **[Project Valhalla](https://openjdk.org/projects/valhalla/)** (value classes, disponible en preview depuis Java 23). L'objectif explicite du projet est précisément d'éliminer cet overhead pour les types valeur, sans changer votre code métier. Votre `record Email` aura, à terme, la même empreinte mémoire qu'un `String` nu. Le pattern que vous adoptez aujourd'hui sera encore plus performant demain.

Le vrai coût, ce n'est pas la mémoire : c'est la migration sur un projet existant qui abuse des `String` partout. Ca, on va en parler.

## Préconisations (enfin !)

Apres tout ca, voici les règles que j'applique au quotidien.

1. **Pas de Value Object pour tout et n'importe quoi.** Le signal déclencheur, c'est : deux primitives de même type dans la même signature de méthode. Là, le compilateur ne peut plus vous aider. C'est le moment d'agir. Un seul `String firstName` sans voisin ambigu ? Inutile de le wrapper.

2. **Dès qu'une règle de validation existe, elle appartient au type.** Un email doit contenir `@`, un code postal doit faire 5 chiffres : ces règles n'ont pas leur place dans un service ou un controller. Elles appartiennent au type lui-même, via le constructeur ou le compact constructor. Un `Email` invalide ne doit tout simplement pas pouvoir exister.

3. **Regrouper les primitives qui ne voyagent jamais seules.** Le test : "est-ce qu'un de ces champs aurait un sens sans les autres ?" Si `street`, `city` et `zipCode` apparaissent toujours ensemble, c'est une `Address`. Si `latitude` et `longitude` sont toujours ensemble, c'est des `Coordinates`. Ne pas laisser des concepts implicites se balader en primitives séparées.

4. **Sur un projet existant, commencer par les interfaces publiques.** Pas question de tout refaire d'un coup. Les controllers REST et les méthodes de service exposées, c'est là que les inversions de paramètres font le plus de dégâts en production, et c'est là que le gain est immédiat. Les couches internes peuvent suivre progressivement.

5. **`@Value` si Lombok et JPA sont déjà là, Records sinon.** Cohérent avec ce qu'on a vu : `@Value` + `@With` + `@Builder` forment une combinaison plus complète sur les projets existants. Pour un nouveau projet Java 16+ sans contrainte, les Records suffisent et n'ajoutent aucune dépendance.

## En guise de conclusion

La *Primitive Obsession*, c'est l'un de ces code smells qu'on tolère parce que la solution semblait couter trop cher. Elle ne coute plus rien : `@Value` de Lombok sur les projets existants, Records pour les projets Java 16+. Une ligne par type, et le compilateur fait le reste.

La validation centralisée, l'impossibilité d'inverser les paramètres, les états représentés dans le système de types : tout ça n'est plus réservé aux projets qui ont le luxe de faire du DDD "proprement". Ca rentre dans n'importe quel projet Java, sans ceremony.

*On va dire que les interactions avec Spring Data, les projections JPA et les Records feront partie d'un prochain billet...*

**N'hésitez pas à me faire part de vos usages en commentaire - notamment si vous avez migré un projet existant vers ce pattern.**
