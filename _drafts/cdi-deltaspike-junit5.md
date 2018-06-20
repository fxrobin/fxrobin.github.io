---
layout: post
title: Découverte de DeltaSpike Data 
subtitle: avec CDI 2.0, Weld 3, JUnit 5, JPA 2.2, EclipseLink 2.7, H2 et Lombok
logo: api-preconditions.png
category: JAVA
tags: [Java, CDI, Weld, JUnit, JPA, EclipseLink, H2, Lombok]
---

<div class="intro" markdown='1'>
Cet article va vous permettre de découvrir `Deltaspike Data`, une alternative à `Spring Data` dans le monde `CDI` et dans notre cas en `CDI 2.0`.

Cette accroche est parlante pour ceux qui connaissent `Spring Data` mais peut-être pas pour les autres : **Deltaspike Data** va permettre d'avoir très simple une fonctionnalité de `DAO` sur des entités JPA et bien plus encore en vous faisant économiser énormément de temps.

</div>
<!--excerpt-->



## CDI et Deltaspike en bref

CDI est une spécification pour l'injection de dépendances, pratique rendue en vogue par Spring IoC. 

> Cet article n'a pas vocation à comparer les deux solutions. Je vous invite à vous rendre sur ce site pour cela : <http://blog.sedona.fr/2015/07/spring-vs-cdi/>

En premier lieu CDI n'est pas une implémentation dont le spec lead est [Antoine Sabot-Durand](https://www.linkedin.com/in/antoinesabotdurand) (cocorico). Il en existe plusieurs actuellement sur le marché :

* JBoss Weld (implem de référence)
* OpenWebBeans (Apache)

CDI offre tout ce qu'il faut pour mettre en place du découplage, essentiellement au moyen d'annotations et de fournir tous les services et l'extensibilité attendue par ce genre d'outils.

Ainsi Deltaspike arrive en complément de CDI et offre de nouvelles fonctionnalités pour des spécifications existantes comme JPA, JSF, Servlet, etc.

Le but de cet article est de se focaliser sur Deltaspike Data et de sa mise en oeuvre simple avec CDI 2.0 au sein de tests unitaires JUnit 5.

## TL;DR
> Too long; did not read

Pour les plus pressés, tout est sur mon repo GitHub dédié : <https://github.com/fxrobin/cdi-deltaspike-demo>

Et voici le fichier pom.xml : <https://github.com/fxrobin/cdi-deltaspike-demo/blob/master/pom.xml>



## DeltaSpike Data @Repository

Grâce à DeltaSpike Data, on pourra donc *coder* très rapidement un service CRUD sur une entité JPA.

```java
@Repository
public interface VideoRepository extends EntityRepository<VideoGame, Long>
{
   // rien à coder ici
}
```

Ensuite, au moyen d'une injection CDI, on pourra obtenir une instance d'un service généré (via ASM) qui offre ton un tas de méthodes et faire donc ce genre de choses dans un test unitaire :

```java
@Inject
private VideoGameRepository repo;

@Test
void test()
{
	VideoGame videoGame = VideoGameFactory.newInstance();
	videoGame.setName("XENON");
	repo.save(videoGame); // on sauvegarde grâce au repo DeltaSpike.
	Assert.assertNotNull(videoGame.getVersion());
	Assert.assertTrue(videoGame.getVersion() > 0);
	log.info("Video Game : {}", videoGame);
}
```

Au moyen d'une simple interface qui hérite de `EntityRepository <E,K>` on obtient pourtant un grand nombre de fonctionnalités :

* save
* saveAndFlush
* saveAndFlushAndRefresh
* attachAndRemove
* flush
* getPrimaryKey
* refresh
* remove
* removeAndFlush
* findAll
* findBy
* findByLike
* count
* countLike

Je ne présente pas le détail de chacune, la JavaDoc est très bien faite à ce sujet (<https://deltaspike.apache.org/javadoc/1.8.0/org/apache/deltaspike/data/api/EntityRepository.html>) d'autant plus que, par conventions de nommage, tout est extensible :

```java
@Repository
public interface VideoRepository extends EntityRepository<VideoGame, Long>
{
   // retourne la liste des jeux vidéo dont le nom est équivalent strictement
   List <VideoGame> findByName(String name);
   
   // retourne la liste des jeux vidéo dont le nom est équivalent (like)
   List <VideoGame> findByNameLike(String name);
}
```

Il n'y a rien de plus à coder, grâce au nommage de la méthode et la reprise du nom d'un attribut JPA, la requête sera générée correctement.

## Mise en oeuvre en Java SE pour les tests unitaires

Autant mettre DeltaSpike dans un projet Java EE (6, 7 ou 8) est vraiment simple et rapide, autant mettre tout en place pour les tests unitaires peut s'avérer un peu fastidieux car il faut dépendre des éléments suivants :

* JUnit 5
* CDI 2.0
* Weld 3
* JPA 2.2
* EclipseLink 2.7 (ou Hibernate)
* H2 (ou tout autre base de données)

Globalement cela parait simple, mais il y a de quoi se prendre les pieds dans le tapis à chaque étape.

## Configuration du projet MAVEN

### Configuration basique du projet

On commence par la partie classique du pom.xml

```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.target>1.8</maven.compiler.target>
    <maven.compiler.source>1.8</maven.compiler.source>
    <deltaspike.version>1.8.2</deltaspike.version>
    <weld.version>3.0.4.Final</weld.version>
</properties>
```

### Configuration pour usage de Deltaspike

Dans la partie `DependencyManagement` il faut ajouter ceci :

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.apache.deltaspike.distribution</groupId>
            <artifactId>distributions-bom</artifactId>
            <version>${deltaspike.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### Dépendances vers les spécifications

Il s'agit de dépendre de CDI 2.0, Transaction API 1.3 et JPA 2.2 :

```xml
<dependency>
    <groupId>javax.enterprise</groupId>
    <artifactId>cdi-api</artifactId>
    <version>2.0</version>
    <scope>provided</scope>
</dependency>

<dependency>
    <groupId>javax.transaction</groupId>
    <artifactId>javax.transaction-api</artifactId>
    <version>1.3</version>
</dependency>   

<dependency>
    <groupId>javax.persistence</groupId>
    <artifactId>javax.persistence-api</artifactId>
    <version>2.2</version>
</dependency>
```

### Dépendances vers DeltaSpike et Weld 3

```xml
<dependency>
    <groupId>org.apache.deltaspike.core</groupId>
    <artifactId>deltaspike-core-api</artifactId>
    <scope>compile</scope>
</dependency>

<dependency>
    <groupId>org.apache.deltaspike.core</groupId>
    <artifactId>deltaspike-core-impl</artifactId>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>org.apache.deltaspike.cdictrl</groupId>
    <artifactId>deltaspike-cdictrl-api</artifactId>
    <scope>compile</scope>
</dependency>

<dependency>
    <groupId>org.jboss.weld.se</groupId>
    <artifactId>weld-se-shaded</artifactId>
    <version>${weld.version}</version>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>org.apache.deltaspike.cdictrl</groupId>
    <artifactId>deltaspike-cdictrl-weld</artifactId>
    <scope>runtime</scope>
</dependency>
```

### Dépendances vers DeltaSpike Data Module

Le voilà le module qui nous intéresse et qui contient tous les services que l'on souhaite utiliser :

```xml
<dependency>
    <groupId>org.apache.deltaspike.modules</groupId>
    <artifactId>deltaspike-data-module-api</artifactId>
    <version>${deltaspike.version}</version>
    <scope>compile</scope>
</dependency>

<dependency>
    <groupId>org.apache.deltaspike.modules</groupId>
    <artifactId>deltaspike-data-module-impl</artifactId>
    <version>${deltaspike.version}</version>
    <scope>runtime</scope>
</dependency>
```

### Dépendances vers EclipseLink 2.7 et H2

EclipseLink sera le moteur de persistence JPA 2.2. La base de données sera embarquées et conservée exclusivement en mémoire pour les tests unitaires au moyen de H2.

```xml
<dependency>
    <groupId>org.eclipse.persistence</groupId>
    <artifactId>org.eclipse.persistence.jpa</artifactId>
    <version>2.7.1</version>
</dependency>

<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <version>1.4.197</version>
    <scope>runtime</scope>
</dependency>
```

### Dépendances vers JUnit 5

Un gros paquet de configuration pour JUnit 5 :

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter-api</artifactId>
    <version>5.1.0</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter-engine</artifactId>
    <version>5.1.0</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.junit.vintage</groupId>
    <artifactId>junit-vintage-engine</artifactId>
    <version>5.1.0</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.junit.platform</groupId>
    <artifactId>junit-platform-launcher</artifactId>
    <version>1.1.0</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.junit.platform</groupId>
    <artifactId>junit-platform-runner</artifactId>
    <version>1.1.0</version>
    <scope>test</scope>
</dependency>
```

### Intégration JUnit 5 et Weld

Pour rendre les tests unitaires JUnit 5 et Weld simple, il faut cette dépendances :

```xml
<dependency>
    <groupId>org.jboss.weld</groupId>
    <artifactId>weld-junit5</artifactId>
    <version>1.2.2.Final</version>
    <scope>test</scope>
</dependency>
```

### Configuration pour JUnit 5 de maven-surefire-plugin

```xml
<build>
    <plugins>
        <plugin>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>2.19.1</version>
            <dependencies>
                <dependency>
                    <groupId>org.junit.platform</groupId>
                    <artifactId>junit-platform-surefire-provider</artifactId>
                    <version>1.0.3</version>
                </dependency>
                <dependency>
                    <groupId>org.junit.jupiter</groupId>
                    <artifactId>junit-jupiter-engine</artifactId>
                    <version>5.0.3</version>
                </dependency>
            </dependencies>
        </plugin>
    </plugins>
</build>
```

## Dépendances complémentaires : Lombok et SLF4J

Histoire d'être succinct, je vais utiliser Lombok et SLF4J :

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.16.20</version>
</dependency>

<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.25</version>
</dependency>

<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-simple</artifactId>
    <version>1.7.25</version>
    <scope>test</scope>
</dependency>
```

## Le projet de démonstration

### Constitution du projet

Voici l'ensemble des fichiers qui constituent le projet de démonstration :

```
main/java/fr/fxjavadevblog
          +-- VideoGame.java (JPA Entity)
          +-- VideoGameFactory.java
          +-- VideoGameRepository.java (interface)
          +-- InjectedUUID.java (annotation def.)
          +-- Producers.java (produces EntityManager and UUID has string)
    /resources/META-INF
          +-- beans.xml
          +-- persistence.xml

test/java/fr/fxjavadevblog
          +-- VideoGameReposityTest.java (JUnit 5)
    /resources/META-INF
          +-- beans.xml
          +-- persistence.
```

### Entité JPA

Il va donc nous falloir une entité JPA `VideoGame`, ah bah oui quand même ! C'est pour elle qu'on fait tout ça ! L'ingrâte ! Elle ne se rend pas compte de tous les efforts que l'on fait pour elle !

```java

// lombok annotations
@NoArgsConstructor(access = AccessLevel.PROTECTED) // to avoid direct instanciation bypassing the factory.
@ToString(of = {"id","name"})

// CDI Annotation
@Dependent

// JPA Annotation
@Entity
public class VideoGame implements Serializable {

    @Id
    @Inject @InjectedUUID // ask CDI to inject an brand new UUID
    @Getter
    private String id;

    @Getter @Setter
    private String name;

    // this field will work as a flag to know if the entity has already been persisted
    @Version
    @Getter
    private Long version;
}
```

On peut y voir l'usage de Lombok de manière assez classique. Les clés primaires seront générées côté applicatif, par un producer de UUID, injecté par CDI au moyen du Qualifier `@InjectedUUID` et de l'annotation `@Inject`.

### La factory de VideoGame

Pour obtenir un objet "Valide" il faudra passer une factory qui s'appuira du CDI pour en obtenir une instance ainsi que l'injection de ses dépendances :

```java
public class VideoGameFactory
{
    /**
     * creates and brand new VideoGame instance with its own UUID as PK.
     *
     * @return instance of a VideoGame
     */
    public static VideoGame newInstance()
    {
        // ask CDI for the instance, injecting required dependencies.
        return CDI.current().select(VideoGame.class).get();
    }
}
```

### Producer d'EntityManager et UUID (version HexaString)

DeltaSpike Data Module réclame un `Producer` CDI d' `EntityManager`. Cela est codé dans la classe `Producers` ainsi que la production de UUID sous forme de chaine hexa-décimale :

```java
@ApplicationScoped
public class Producers
{
    public static final String UNIT_NAME = "cdi-deltaspike-demo";

    /**
     * produces the instance of entity manager for the application and for DeltaSpike.
     */
    @Produces
    @SuppressWarnings("unused")
    private static EntityManager em = Persistence.createEntityManagerFactory(UNIT_NAME).createEntityManager();

    /**
     * produces randomly generated UUID for primary keys.
     *
     * @return UUID as a HEXA-STRING
     *
     */
    @Produces
    @InjectedUUID
    @SuppressWarnings("unused")
    public String produceUUIDAsString()
    {
        return UUID.randomUUID().toString();
    }
}
```

Voici le Qualifier CDI :

```java
@Qualifier
@Retention(RUNTIME)
@Target({METHOD, FIELD, PARAMETER, TYPE})
public @interface InjectedUUID
{
}
```

### Deltaspike @Repository (enfin !)

C'est finalement la chose à plus simple à faire, et pourtant la plus puissante :

```java
@Repository
interface VideoGameRepository extends EntityRepository <VideoGame, String>
{
    // nothing to code here : automatic Repo generated by DeltaSpike
}
```

### Configuration beans.xml et persistence.xml

Quelques fichiers de configuration à dupliquer aussi bien de la partie classique que dans la partie tests.

Fichier **beans.xml** :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://xmlns.jcp.org/xml/ns/javaee" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/beans_2_0.xsd"
       bean-discovery-mode="annotated" version="2.0">
</beans>
```

Fichier **persistence.xml** :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<persistence version="2.2" xmlns="http://xmlns.jcp.org/xml/ns/persistence"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/persistence
                                 http://xmlns.jcp.org/xml/ns/persistence/persistence_2_2.xsd">
    <persistence-unit name="cdi-deltaspike-demo" transaction-type="RESOURCE_LOCAL">

        <class>fr.fxjavadevblog.VideoGame</class>

        <properties>
            <property name="javax.persistence.jdbc.url" value="jdbc:h2:mem:test"/>
            <property name="javax.persistence.jdbc.driver" value="org.h2.Driver"/>
            <property name="javax.persistence.schema-generation.database.action" value="create"/>
        </properties>

    </persistence-unit>
</persistence>
```

### Le test unitaire JUnit 5

Et enfin le test unitaire en lui même :

```java
@Slf4j
@EnableWeld
class VideoGameRepositoryTest
{
    @WeldSetup // This is need to discover Producers and DeltaSpike Repository functionality
    private WeldInitiator weld = WeldInitiator.performDefaultDiscovery();

    @Inject
    private VideoGameRepository repo;

    @Test
    void test()
    {

        VideoGame videoGame = VideoGameFactory.newInstance();
        videoGame.setName("XENON");
        repo.save(videoGame);
        // testing if the ID field had been generated by the JPA Provider.
        Assert.assertNotNull(videoGame.getVersion());
        Assert.assertTrue(videoGame.getVersion() > 0);
        log.info("Video Game : {}", videoGame);
    }

}
```

Grâce à `@EnableWeld`, le test unitaire s'exécute dans un contexte CDI existant. e context est initialisé par `WeldInitiator.performDefaultDiscovery()`, car par défaut dans les tests unitaires, rien n'est découvert par défaut.

## Exécution du test unitaire

Voici ce que l'on obtient après un `mvn test`

```bash
juin 20, 2018 4:29:48 PM org.jboss.weld.bootstrap.WeldStartup <clinit>
INFO: WELD-000900: 3.0.4 (Final)
juin 20, 2018 4:29:48 PM org.apache.deltaspike.core.impl.config.EnvironmentPropertyConfigSourceProvider <init>
INFOS: Custom config found by DeltaSpike. Name: 'META-INF/apache-deltaspike.properties', URL: 'jar:file:/home/robin/.m2/repository/org/apache/deltaspike/modules/deltaspike-jpa-module-impl/1.8.2/deltaspike-jpa-module-impl-1.8.2.jar!/META-INF/apache-deltaspike.properties'

... [coupé car trop long] ...

INFO: WELD-ENV-002003: Weld SE container 1dd47bb7-6243-4eb4-b447-8d8aa8d3a3d8 initialized
[EL Info]: 2018-06-20 16:29:50.164--ServerSession(1374217958)--EclipseLink, version: Eclipse Persistence Services - 2.7.1.v20171221-bd47e8f
[EL Info]: connection: 2018-06-20 16:29:50.362--ServerSession(1374217958)--/file:/home/robin/IdeaProjects/cdi-deltaspike-demo/target/test-classes/_cdi-deltaspike-demo login successful
[main] INFO fr.fxjavadevblog.VideoGameRepositoryTest - Video Game : VideoGame(id=4420686e-088b-494c-b59d-34d4465823c1, name=XENON)
juin 20, 2018 4:29:50 PM org.jboss.weld.environment.se.WeldContainer shutdown

INFO: WELD-ENV-002001: Weld SE container 1dd47bb7-6243-4eb4-b447-8d8aa8d3a3d8 shut down

Process finished with exit code 0
```

> "Il est content Rosco !" &copy; Shérif fais moi peur

A vous de jouer maintenant en découvrant encore plus DeltaSpike Data Module !

## Conclusion

Deltaspike Data Module est vraiment un "*must-have*" si vous faites du Java EE (vraiment Java EE, pas *juste* du Spring) et du CDI et JPA.

Cette solution n'est pas restreinte à du Java EE et fonctionne aussi en Java SE, la preuve avec le test unitaire réalisé précédemment.

En architecture REST avec un back-end Java EE (JAX-RS + CDI + DeltaSpike), on devient vraiment rapide et efficace ! Qu'attendez-vous ?

> J'ai encore réussi à placer [Lombok](/Lombok-Oui-Mais/) dans un article ...

## Liens

* CDI 2.0 : <http://cdi-spec.org/>
* Weld : <http://weld.cdi-spec.org/>
* OpenWebBeans : <http://openwebbeans.apache.org/>
* DeltaSpike : <https://deltaspike.apache.org/>
* DeltaSpike Data : <https://deltaspike.apache.org/documentation/data.html>

Question posée sur Stackoverflow et ma réponse : <https://stackoverflow.com/questions/50688919/test-deltaspike-repositories-cannot-inject-entitymanager>