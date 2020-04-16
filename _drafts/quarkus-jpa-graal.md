---
layout: post
title: REST API avec Quarkus, JPA, PostGreSQL et GraalVM
subtitle: réduire l'empreinte serveur d'une API REST en JAVA sans perdre en productivité
logo: graal.png
category: articles
tags: [Java, Quarkus, Bean Validation, JAX-RS, REST, GraalVM]
lang: fr
ref: quarkus-jpa-graalvm
---

<div class="intro" markdown='1'>

Ce tutoriel Quarkus-JPA-PostgreSQL met en oeuvre :

- une API Rest partielle (GET) avec JAX-RS et Quarkus sur une source de données JPA
- des tests unitaires
- des tests d'intégration au niveau API (http) avec un PostGreSQL lancé par un plugin maven Docker
- une distribution native, compilée avec Graal VM et une image docker de l'application compilée

> Réalisé sous Linux Mint 19 mais devrait convenir à de nombreuses distributions, voire à Windows.

</div>
<!--excerpt-->

## Choix techniques

L'objectif de cet article est de faire tourner une API REST avec Quarkus fonctionnant avec :

- JAX-RS 2 : Avec RESTEasy et Jackson pour la sérialization JSON
- CDI 2 : avec l'implémentation interne partielle de QUARKUS
- JPA 2 : avec Hibernate
- Bean Validation : avec Hibernate Validator
- Health Check et Metrics : avec SmallRye Health et SmallRye Metrics

On équipera le projet de diverses bibliothèques pour accéler le développement

- Spring Data JPA : pour ses `Repository` CRUD JPA
- Lombok : pour réduire le *boiler plate* ([> Voir mon article sur Lombok](/Lombok-Oui-Mais))
- Open API avec Swagger 2 (mais ce n'est pas l'objet de ce tutorial)

> Nativement Quarkus est fourni avec Google Guava, ce qui servira dans le cadre de ce tutoriel.

Le projet au complet est diponible sur GitHub : {%include github.html repository="fxrobin/quarkus-tuto" %}

## Qu'est-ce que Quarkus

![Quarkus-Logo](/images/quarkus-logo.svg)

Sur la page d'accueil de [Quarkus](https://quarkus.io/), on peut lire :

> Quarkus : Supersonic Subatomic Java
> A Kubernetes Native Java stack tailored for OpenJDK HotSpot and GraalVM, crafted from the best of breed Java libraries and standards.

Jolie *punch line* !

En substance, c'est un framework constitué des meilleurs standards et bibliothèques Java pour réaliser des applications pour le cloud en mode REST.

Ses concurrents directs sont les fameux :

- Micronaut,
- Thorntail,
- SpringBoot (et toute la plateforme Spring),
- dans une moindre mesure, Payara-micro.

## Structure globale du projet

Avant de commencer à entrer dans le détail des divers éléments, voici la structure du projet Maven :

{:.preformatted}
[quarkus-tuto]
├── src
│   ├── main
│   │   ├── docker
│   │   │   ├── Dockerfile.jvm
│   │   │   └── Dockerfile.native
│   │   ├── java
│   │   │   └── fr
│   │   │       └── fxjavadevblog
│   │   │           └── qjg
│   │   │               ├── genre
│   │   │               │   ├── Genre.java
│   │   │               │   ├── GenreConverterProvider.java
│   │   │               │   └── GenreResource.java
│   │   │               ├── health
│   │   │                   └── SimpleHealthCheck.java
│   │   │               ├── ping
│   │   │               │   └── PingService.java
│   │   │               ├── utils
│   │   │               │   ├── GenericEnumConverter.java
│   │   │               │   ├── InjectUUID.java
│   │   │               │   └── UUIDProducer.java
│   │   │               ├── videogame
│   │   │               │   ├── VideoGame.java
│   │   │               │   ├── VideoGameFactory.java
│   │   │               │   ├── VideoGameRepository.java
│   │   │               │   └── VideoGameResource.java
│   │   │               └── ApiDefinition.java
│   │   └── resources
│   │       ├── application.properties
│   │       └── import.sql
│   ├── test
│   │   ├── java
│   │   │   └── fr
│   │   │       └── fxjavadevblog
│   │   │           └── qjg
│   │   │               ├── global
│   │   │               │   └── TestingGroups.java
│   │   │               ├── ping
│   │   │               │   └── PingTest.java
│   │   │               └── utils
│   │   │                   ├── CDITest.java
│   │   │                   ├── DummyTest.java
│   │   │                   └── GenericEnumConverterTest.java
│   │   └── resources
│   │       └── application.properties
│   └── test-integration
│       ├── java
│       │   └── fr
│       │       └── fxjavadevblog
│       │           └── qjg
│       │               ├── utils
│       │               │   └── IT_DummyTest.java
│       │               └── videogame
│       │                   └── IT_VideoGameResource.java
│       └── resources
│           └── application.properties
├── target
│   ├── classes
│   │   ├── application.properties
│   │   └── import.sql
│   └── test-classes
│       └── application.properties
├── .dockerignore
├── README.md
└── pom.xml

La structure du projet se décompose ainsi :

- `src/main` : contient les sources JAVA `main/java` et les ressources pour Quarkus `main\resources` : `application.properties` et `import.sql`
- `src/test` : contient les tests unitaires `test/java` et les ressources pour les tests unitaires sans base de données PostgreSQL `test\resources`
- `src/test-integration` : contient les tests d'intégration `test-integration/java` et les ressources pour les tests unitaires avec PostgreSQL `test-integration\resources`
- `src/main/docker` : contient les Dockerfile nécessaires à la génération de l'image conteneurisée de l'application

La partie JAVA se décompose en 3 packages :

{:.preformatted}
fxjavadevblog
└── qjg
    ├── genre
    │   ├── Genre.java                    : enum qui contient tous les genres de jeux vidéo
    │   ├── GenreConverterProvider.java   : fournisseur de conversion de Genre pour les paramètres JAX-RS
    │   └── GenreResource.java            : point d'accès REST via JAX-RS aux genres de jeux vidéo
    ├── health
    │   └── SimpleHealthCheck.java        : retour simple de Health Check (optionnel)
    ├── ping
    │   └── PingService.java              : pour vérifier que JAX-RS est bien opérationnel
    ├── utils
    │   ├── GenericEnumConverter.java     : convertisseur générique d'enum en Json
    │   ├── InjectUUID.java               : annotation pour injecter des UUID sous forme de String
    │   └── UUIDProducer.java             : générateur de UUID
    ├── videogame
    │   ├── VideoGame.java                : classe métier, persistante via JPA (Hibernate)
    │   ├── VideoGameFactory.java         : Factory de jeux video via CDI pour bénéficier de @InjectUUID en mode programmatique
    │   ├── VideoGameRepository.java      : un repository CRUD JPA généré par Spring Data JPA
    │   └── VideoGameResource.java        : le point d'accès REST via JAX-RS aux jeux vidéo
    └── ApiDefinition.java                : pour les informations de l'API via Swagger

La partie tests unitaires est consituée des éléments suivants :

{:.preformatted}
test
├── java
│   └── fr
│       └── fxjavadevblog
│           └── qjg
│               ├── global
│               │   └── TestingGroups.java   : définitions de constantes pour les groupes de tests JUnit 5
│               ├── ping
│               │   └── PingTest.java        : Vérifie que le "ping" fonctionne
│               └── utils
│                   ├── CDITest.java                    : permet de vérifier que CDI est opérationnel
│                   ├── DummyTest.java                  : un test vide
│                   └── GenericEnumConverterTest.java   : vérification de la conversion générique d'enum
└── resources
    └── application.properties               : fichier de paramétrage de Quarkus spécifique pour les tests unitaires

> `DummyTest.java` : un test *vide* afin de vérifier que les tests unitaires s'exécutent correctement (un méta-test, lol)

## Maven et son pom.xml

D'abord il nous faut quelques paramétrages classiques MAVEN :

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>fr.fxjavadevblog</groupId>
    <artifactId>quarkus-tuto</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>Quarkus-JPA-PostgreSQL</name>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <maven.compiler.target>1.8</maven.compiler.target>
        <maven.compiler.source>1.8</maven.compiler.source>
        <lombok.version>1.18.12</lombok.version>
        <commons-lang.version>3.9</commons-lang.version>
        <quarkus-version>1.3.1.Final</quarkus-version>
        <surefire-plugin.version>2.22.2</surefire-plugin.version>
    </properties>

</project>
```

> Pour ce tutoriel l'usage de Java 8 sera effectué.

On ajoute les dépendences classiques :

```xml
<dependencies>
       <dependency>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
              <version>${lombok.version}</version>
              <scope>provided</scope>
       </dependency>
</dependencies>
```

Pour utiliser Quarkus :

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>io.quarkus</groupId>
            <artifactId>quarkus-bom</artifactId>
            <version>${quarkus-version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

puis :

```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-spring-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-jackson</artifactId>
</dependency>
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-resteasy-jackson</artifactId>
</dependency>
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-jdbc-postgresql</artifactId>
</dependency>

<!-- OPEN API via Swagger 2 -->
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-smallrye-openapi</artifactId>
</dependency>

<!-- Health Check -->
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-smallrye-health</artifactId>
</dependency>

<!-- Metrics -->
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-smallrye-metrics</artifactId>
</dependency>

<!-- for testing -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-junit5</artifactId>
    <scope>test</scope>
</dependency>
<!-- for testing -->
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <scope>test</scope>
</dependency>
```

## Les plugins de build

Attention, ils sont nombreux, mais ce n'est pas rare pour des projets MAVEN. Il nous faut de quoi :

- générer tout ce qui est traité par Quarkus
- lancer les tests unitaires sans base de données
- lancer notre base de données PostgreSQL avec Docker pendant les tests d'intégration JUnit 5. On est ainsi à mi-chemin entre des tests unitaires et des tests d'intégration. Je préfère cette solution plutôt que de *mocker* les tests. Cela nécessite évidemment que Docker soit installé sur l'environnement.

```xml
<build>
    <plugins>
      <plugin>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.8.1</version>
      </plugin>

      <plugin>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-maven-plugin</artifactId>
        <version>${quarkus-version}</version>
        <executions>
          <execution>
            <goals>
              <goal>build</goal>
            </goals>
          </execution>
        </executions>
      </plugin>

      <plugin>
        <artifactId>maven-resources-plugin</artifactId>
        <version>3.1.0</version>
        <executions>
          <execution>
            <id>copy-resources</id>
            <phase>pre-integration-test</phase>
            <goals>
              <goal>copy-resources</goal>
            </goals>
            <configuration>
              <overwrite>true</overwrite>
              <outputDirectory>${basedir}/target/test-classes</outputDirectory>
              <resources>
                <resource>
                  <directory>src/test-integration/resources</directory>
                  <filtering>true</filtering>
                </resource>
              </resources>
            </configuration>
          </execution>
        </executions>
      </plugin>

      <!-- tests unitaires -->
      <plugin>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>${surefire-plugin.version}</version>
        <configuration>
          <excludes>
            <exclude>**/IT_*.java</exclude>
          </excludes>
          <systemProperties>
            <java.util.logging.manager>org.jboss.logmanager.LogManager</java.util.logging.manager>
          </systemProperties>
          <skipTests>${skip.surefire.tests}</skipTests>
        </configuration>
      </plugin>

      <!-- tests d'integration -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-failsafe-plugin</artifactId>
        <version>${surefire-plugin.version}</version>
        <executions>
          <execution>
            <goals>
              <goal>integration-test</goal>
              <goal>verify</goal>
            </goals>
          </execution>
        </executions>
      </plugin>

      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>build-helper-maven-plugin</artifactId>
        <version>3.1.0</version>
        <executions>
          <execution>
            <id>add-integration-test-sources</id>
            <phase>generate-test-sources</phase>
            <goals>
              <goal>add-test-source</goal>
            </goals>
            <configuration>
              <sources>
                <source>src/test-integration/java</source>
              </sources>
            </configuration>
          </execution>
          <execution>
            <id>add-integration-test-resource</id>
            <phase>generate-test-resources</phase>
            <goals>
              <goal>add-test-resource</goal>
            </goals>
            <configuration>
              <resources>
                <resource>
                  <directory>src/test-integration/resources</directory>
                </resource>
              </resources>
            </configuration>
          </execution>
        </executions>
      </plugin>



      <plugin>
        <groupId>io.fabric8</groupId>
        <artifactId>docker-maven-plugin</artifactId>
        <version>0.33.0</version>
        <configuration>
          <skip>${skip.integration.tests}</skip>
          <images>
            <image>
              <name>postgres:12.2</name>
              <alias>postgresql</alias>
              <run>
                <env>
                  <POSTGRES_USER>quarkus_tuto</POSTGRES_USER>
                  <POSTGRES_PASSWORD>quarkus_tuto</POSTGRES_PASSWORD>
                  <POSTGRES_DB>quarkus_tuto</POSTGRES_DB>
                </env>
                <ports>
                  <port>5432:5432</port>
                </ports>
                <log>
                  <prefix>PostgreSQL Server : </prefix>
                  <date>default</date>
                  <color>green</color>
                </log>
                <wait>
                  <tcp>
                    <mode>mapped</mode>
                    <ports>
                      <port>5432</port>
                    </ports>
                  </tcp>
                  <time>10000</time>
                </wait>
              </run>
            </image>
          </images>
        </configuration>
        <executions>
          <execution>
            <id>docker:start</id>
            <phase>pre-integration-test</phase>
            <goals>
              <goal>stop</goal>
              <goal>start</goal>
            </goals>
          </execution>
          <execution>
            <id>docker:stop</id>
            <phase>post-integration-test</phase>
            <goals>
              <goal>stop</goal>
            </goals>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>
```

Et enfin, pour atteindre le Graal du code Java compilé en binaire natif, il nous faut rajouter un petit profil MAVEN :

```xml
<profiles>
    <profile>
        <id>native</id>
        <activation>
            <property>
                <name>native</name>
            </property>
        </activation>
        <build>
            <plugins>
                <plugin>
                    <groupId>io.quarkus</groupId>
                    <artifactId>quarkus-maven-plugin</artifactId>
                    <version>${quarkus-plugin.version}</version>
                    <executions>
                        <execution>
                            <goals>
                                <goal>native-image</goal>
                            </goals>
                            <configuration>
                                <enableHttpUrlHandler>true</enableHttpUrlHandler>
                            </configuration>
                        </execution>
                    </executions>
                </plugin>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-failsafe-plugin</artifactId>
                    <version>${surefire-plugin.version}</version>
                    <executions>
                        <execution>
                            <goals>
                                <goal>integration-test</goal>
                                <goal>verify</goal>
                            </goals>
                            <configuration>
                                <systemProperties>
                                    <native.image.path>${project.build.directory}/${project.build.finalName}-runner</native.image.path>
                                </systemProperties>
                            </configuration>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

Et voilà, le `pom.xml` est entièrement configuré.

Il est temps de coder quelques classes Quarkus dans votre IDE favori.

## Un simple /ping

Pour vérifier que tout va bien, on va faire un simple endpoint HTTP Rest avec JAX-RS qui va répondre à `/api/ping/v1`.

```java
package fr.fxjavadevblog.qjg.ping;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

/**
 * Simple JAX-WS endoint to check if the application is running.
 * 
 * @author robin
 *
 */

@Path("/api/ping")
public class PingService
{
    @Path("/v1")
    @GET
    @Produces("text/plain")
    public String ping()
    {
        return "pong";
    }
}
```

On compile et on lance Quarkus en mode DEV.

```bash
$ mvn clean compile quarkus:dev
...
... ( build maven ...)
...

Listening for transport dt_socket at address: 5005
SLF4J: Class path contains multiple SLF4J bindings.
SLF4J: Found binding in [jar:file:/home/robin/.m2/repository/ch/qos/logback/logback-classic/1.2.3/logback-classic-1.2.3.jar!/org/slf4j/impl/StaticLoggerBinder.class]
SLF4J: Found binding in [jar:file:/home/robin/.m2/repository/org/jboss/slf4j/slf4j-jboss-logging/1.2.0.Final/slf4j-jboss-logging-1.2.0.Final.jar!/org/slf4j/impl/StaticLoggerBinder.class]
SLF4J: See http://www.slf4j.org/codes.html#multiple_bindings for an explanation.
SLF4J: Actual binding is of type [ch.qos.logback.classic.util.ContextSelectorStaticBinder]
11:26:09.593 [Thread-20] DEBUG io.netty.util.internal.logging.InternalLoggerFactory - Using SLF4J as the default logging framework
11:26:09.599 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent0 - -Dio.netty.noUnsafe: false
11:26:09.600 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent0 - Java version: 8
11:26:09.601 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.theUnsafe: available
11:26:09.601 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent0 - sun.misc.Unsafe.copyMemory: available
11:26:09.602 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Buffer.address: available
11:26:09.603 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent0 - direct buffer constructor: available
11:26:09.604 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.Bits.unaligned: available, true
11:26:09.605 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent0 - jdk.internal.misc.Unsafe.allocateUninitializedArray(int): unavailable prior to Java9
11:26:09.605 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent0 - java.nio.DirectByteBuffer.<init>(long, int): available
11:26:09.606 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent - sun.misc.Unsafe: available
11:26:09.607 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.tmpdir: /tmp (java.io.tmpdir)
11:26:09.607 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.bitMode: 64 (sun.arch.data.model)
11:26:09.608 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.maxDirectMemory: 3704094720 bytes
11:26:09.608 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.uninitializedArrayAllocationThreshold: -1
__  ____  __  _____   ___  __ ____  ______ 
 --/ __ \/ / / / _ | / _ \/ //_/ / / / __/ 
 -/ /_/ / /_/ / __ |/ , _/ ,< / /_/ /\ \   
--\___\_\____/_/ |_/_/|_/_/|_|\____/___/   
2020-04-02 11:26:08,775 WARN  [io.qua.agr.dep.AgroalProcessor] (build-13) The Agroal dependency is present but no JDBC datasources have been defined.
11:26:09.608 [Thread-20] DEBUG io.netty.util.internal.CleanerJava6 - java.nio.ByteBuffer.cleaner(): available
11:26:09.608 [Thread-20] DEBUG io.netty.util.internal.PlatformDependent - -Dio.netty.noPreferDirect: false
11:26:09.610 [Thread-20] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.processId: 12872 (auto-detected)
11:26:09.611 [Thread-20] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv4Stack: false
11:26:09.611 [Thread-20] DEBUG io.netty.util.NetUtil - -Djava.net.preferIPv6Addresses: false
11:26:09.612 [Thread-20] DEBUG io.netty.util.NetUtil - Loopback interface: lo (lo, 0:0:0:0:0:0:0:1%lo)
11:26:09.613 [Thread-20] DEBUG io.netty.util.NetUtil - /proc/sys/net/core/somaxconn: 128
11:26:09.613 [Thread-20] DEBUG io.netty.channel.DefaultChannelId - -Dio.netty.machineId: 18:31:bf:ff:fe:17:85:36 (auto-detected)
11:26:09.625 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.level: simple
11:26:09.625 [main] DEBUG io.netty.util.ResourceLeakDetector - -Dio.netty.leakDetection.targetRecords: 4
11:26:09.632 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.initialSize: 1024
11:26:09.632 [main] DEBUG io.netty.util.internal.InternalThreadLocalMap - -Dio.netty.threadLocalMap.stringBuilder.maxSize: 4096
11:26:09.639 [main] DEBUG io.netty.channel.MultithreadEventLoopGroup - -Dio.netty.eventLoopThreads: 16
11:26:09.648 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.noKeySetOptimization: false
11:26:09.649 [main] DEBUG io.netty.channel.nio.NioEventLoop - -Dio.netty.selectorAutoRebuildThreshold: 512
11:26:09.649 [main] DEBUG io.netty.util.internal.PlatformDependent - org.jctools-core.MpscChunkedArrayQueue: available
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numHeapArenas: 16
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.numDirectArenas: 16
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.pageSize: 8192
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxOrder: 1
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.chunkSize: 16384
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.tinyCacheSize: 512
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.smallCacheSize: 256
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.normalCacheSize: 64
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedBufferCapacity: 32768
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimInterval: 8192
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.cacheTrimIntervalMillis: 0
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.useCacheForAllThreads: true
11:26:09.704 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.PooledByteBufAllocator - -Dio.netty.allocator.maxCachedByteBuffersPerChunk: 1023
11:26:09.809 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.allocator.type: pooled
11:26:09.809 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.threadLocalDirectBufferSize: 0
11:26:09.809 [vert.x-eventloop-thread-1] DEBUG io.netty.buffer.ByteBufUtil - -Dio.netty.maxThreadLocalCharBufferSize: 16384
2020-04-02 11:26:09,816 INFO  [io.quarkus] (main) quarkus-tuto 0.0.1-SNAPSHOT (powered by Quarkus 1.3.1.Final) started in 1.415s. Listening on: http://0.0.0.0:8080
2020-04-02 11:26:09,818 INFO  [io.quarkus] (main) Profile dev activated. Live Coding activated.
2020-04-02 11:26:09,819 INFO  [io.quarkus] (main) Installed features: [agroal, cdi, hibernate-orm, hibernate-orm-panache, hibernate-validator, jdbc-postgresql, narayana-jta, resteasy, resteasy-jsonb, spring-data-jpa, spring-di]
```

> Quakus se lance en très peu de temps alors qu'il est *simplement* en mode JVM classique. Vivement le build GraalVM natif... patience.

On peut tester le service manuellement :

```bash
$ curl http://localhost:8080/api/ping/v1
pong
```

Si on modifie le code java et qu'on le sauvegarde, il se recompile automatiquement grâce au mode **dev** de Quarkus.
Par exemple : on change le `return "pong";` par `return PONG;` et on sauvegarde le fichier.

```bash
$ curl http://localhost:8080/api/ping/v1
PONG
```

C'est vraiment très pratique ce *live reload* !

> Attention avec Lombok toutefois, Quarkus ne semble pas relancer l'annotation processor et donc il ne génère pas le bytecode de Lombok.
> Lien vers cette anomalie : <https://github.com/quarkusio/quarkus/issues/4224>

## Compilation en binaire avec GraalVM

En pré-requis, il faut s'assurer que GraalVM est bien installé. Je vous conseille d'utilser SDKMAN pour cela. SDKMAN est une plateforme pour gérer plusieurs outils de développement présents sur votre poste en plusieurs versions et vous permet de les activer simplement et rapidement, même le temps d'une session shell. (TODO, pas bien compris)

### Installation de SDKMAN

Rien de bien compliqué, sous Linux tout du moins :

```bash
$ curl -s "https://get.sdkman.io" | bash
$ source "$HOME/.sdkman/bin/sdkman-init.sh"
$ sdk version
```

### Installation de GraalVM

Grâce à SDKMAN c'est vraiment simple :

```bash
$ sdk install java 19.3.1.r11-grl

Downloading: java 19.3.1.r11-grl

In progress...

0%###################################################################### 100,0%

Repackaging Java 19.3.1.r11-grl...

Done repackaging...

Installing: java 19.3.1.r11-grl
Done installing!

Do you want java 19.3.1.r11-grl to be set as default? (Y/n): Y

Setting java 19.3.1.r11-grl as default.
```

Dans cet exemple, j'ai choisi de mettre GraalVM en version 19.3.1 et de le déclarer comme JDK par défaut.

GraalVM s'est en fait installé dans le répertoire de SDKMAN `/home/robin/.sdkman/candidates/java/19.3.1.r11-grl`
et tout a été *linké* correctement pour en faire le JDK par défaut.

```bash
$ echo $JAVA_HOME
/home/robin/.sdkman/candidates/java/current
$ ll /home/robin/.sdkman/candidates/java/current
lrwxrwxrwx 1 robin robin 50 avril  2 10:25 /home/robin/.sdkman/candidates/java/current -> /home/robin/.sdkman/candidates/java/19.3.1.r11-grl/
$ whereis java
java: /usr/bin/java /usr/lib/java /usr/share/java /home/robin/.sdkman/candidates/java/19.3.1.r11-grl/bin/java
```

Pour pouvoir compiler du code Java en code natif, il faut rajouter une variable d'environnement au fichier `~/.mavenrc` (à créer s'il n'existe pas).

```text
export JAVA_HOME=/home/robin/.sdkman/candidates/java/current
export GRAALVM_HOME=$JAVA_HOME
```

En relançant un shell, on vérifie que tout est correctement affecté :

```bash
$ mvn -version
Apache Maven 3.6.3 (cecedd343002696d0abb50b32b541b8a6ba2883f)
Maven home: /home/robin/.sdkman/candidates/maven/current
Java version: 11.0.6, vendor: Oracle Corporation, runtime: /home/robin/.sdkman/candidates/java/19.3.1.r11-grl
Default locale: fr_FR, platform encoding: UTF-8
OS name: "linux", version: "5.3.0-45-generic", arch: "amd64", family: "unix"
```

Ensuite il faut installer l'outil `native-image` :

```bash
$ gu install native-image
Downloading: Component catalog from www.graalvm.org
Processing Component: Native Image
Downloading: Component native-image: Native Image  from github.com
Installing new component: Native Image (org.graalvm.native-image, version 19.3.1)
```

Tout est prêt pour pouvoir compiler notre application en code natif.

### Compilation en code natif

Il suffit de lancer maven avec le profil *native* qui est présent dans le pom XML.
C'est un peu long, c'est normal, mais le résultat en vaut la chandelle.

```bash
$ mvn package -Pnative
...
...
... (vous pouvez allez vous aérer la compilation est assez longue ...)
...
...
...
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]    classlist:  10 076,23 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]        (cap):   1 186,64 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]        setup:   3 325,77 ms
17:25:16,623 INFO  [org.hib.val.int.uti.Version] HV000001: Hibernate Validator 6.1.2.Final
17:25:18,675 INFO  [org.jbo.threads] JBoss Threads version 3.0.1.Final
17:25:42,598 INFO  [org.hib.Version] HHH000412: Hibernate ORM core version 5.4.12.Final
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]   (typeflow):  20 083,90 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]    (objects):  16 238,17 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]   (features):     742,27 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]     analysis:  38 874,58 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]     (clinit):     658,58 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]     universe:   2 171,74 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]      (parse):   2 662,69 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]     (inline):   4 485,66 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]    (compile):  29 844,86 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]      compile:  39 558,51 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]        image:   2 916,45 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]        write:     817,69 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:1965]      [total]:  98 480,45 ms
[INFO] [io.quarkus.deployment.QuarkusAugmentor] Quarkus augmentation completed in 101129ms
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  01:51 min
[INFO] Finished at: 2020-04-02T17:26:40+02:00
[INFO] ------------------------------------------------------------------------
```

La construction du binaire natif a pris presque 2 minutes !

Mais on va lancer l'application qui a été générée, classiquement, dans le répertoire `target` :

```bash
$ ./target/quarkus-tuto-0.0.1-SNAPSHOT-runner 
__  ____  __  _____   ___  __ ____  ______ 
 --/ __ \/ / / / _ | / _ \/ //_/ / / / __/ 
 -/ /_/ / /_/ / __ |/ , _/ ,< / /_/ /\ \   
--\___\_\____/_/ |_/_/|_/_/|_|\____/___/   
2020-04-02 17:29:01,484 INFO  [io.quarkus] (main) quarkus-tuto 0.0.1-SNAPSHOT (powered by Quarkus 1.3.1.Final) started in 0.016s. Listening on: http://0.0.0.0:8080
2020-04-02 17:29:01,484 INFO  [io.quarkus] (main) Profile prod activated. 
2020-04-02 17:29:01,484 INFO  [io.quarkus] (main) Installed features: [agroal, cdi, hibernate-orm, hibernate-orm-panache, hibernate-validator, jdbc-postgresql, narayana-jta, resteasy, resteasy-jsonb, spring-data-jpa, spring-di]
```

Oui c'est bien la réalité : notre application a démarré en 0.016 secondes !

Pour l'arrêter, il suffit de *tuer* le process ou simplement avec un `CTRL+C` dans le terminal.

## Configuration de l'accès aux données

### Lancement de PostgreSQL via Docker

Dans la configuration MAVEN, on a paramétré une image Docker de PostgreSQL 12 qui se lance pendant la phase de tests d'intégration.

Pendant la phase de développement, il faut donc une instance de PostgreSQL qui tourne avec la base de données. Je vais utiliser encore une fois Docker pour cela.

```bash
$ docker run --ulimit memlock=-1:-1 -it --rm=true --memory-swappiness=0 --name quarkus_tuto -e POSTGRES_USER=quarkus_tuto -e POSTGRES_PASSWORD=quarkus_tuto -e POSTGRES_DB=quarkus_tuto -p 5432:5432 postgres:12.2
Unable to find image 'postgres:12.2' locally
12.2: Pulling from library/postgres
c499e6d256d6: Pull complete 
67a768c93810: Pull complete 
3befaea70a64: Pull complete 
b72dde2f70c9: Pull complete 
9af5f5958937: Pull complete 
79f4f06e2acc: Pull complete 
bc35aa1d8687: Pull complete 
276504d44bd7: Pull complete 
56cfad4df2a4: Pull complete 
28bfa2f917aa: Pull complete 
bbbebba2bc39: Pull complete 
d2407cea5efb: Pull complete 
92dae474b380: Pull complete 
c71da770d20d: Pull complete 
Digest: sha256:d480b197ab8e01edced54cbbbba9707373473f42006468b60be04da07ce97823
Status: Downloaded newer image for postgres:12.2
The files belonging to this database system will be owned by user "postgres".
This user must also own the server process.

The database cluster will be initialized with locale "en_US.utf8".
The default database encoding has accordingly been set to "UTF8".
The default text search configuration will be set to "english".

Data page checksums are disabled.

fixing permissions on existing directory /var/lib/postgresql/data ... ok
creating subdirectories ... ok
selecting dynamic shared memory implementation ... posix
selecting default max_connections ... 100
selecting default shared_buffers ... 128MB
selecting default time zone ... Etc/UTC
creating configuration files ... ok
running bootstrap script ... ok
performing post-bootstrap initialization ... ok
syncing data to disk ... ok

initdb: warning: enabling "trust" authentication for local connections
You can change this by editing pg_hba.conf or using the option -A, or
--auth-local and --auth-host, the next time you run initdb.

Success. You can now start the database server using:

    pg_ctl -D /var/lib/postgresql/data -l logfile start

waiting for server to start....2020-04-02 15:40:28.357 UTC [47] LOG:  starting PostgreSQL 12.2 (Debian 12.2-2.pgdg100+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 8.3.0-6) 8.3.0, 64-bit
2020-04-02 15:40:28.360 UTC [47] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
2020-04-02 15:40:28.383 UTC [48] LOG:  database system was shut down at 2020-04-02 15:40:28 UTC
2020-04-02 15:40:28.389 UTC [47] LOG:  database system is ready to accept connections
 done
server started
CREATE DATABASE


/usr/local/bin/docker-entrypoint.sh: ignoring /docker-entrypoint-initdb.d/*

2020-04-02 15:40:28.603 UTC [47] LOG:  received fast shutdown request
waiting for server to shut down....2020-04-02 15:40:28.605 UTC [47] LOG:  aborting any active transactions
2020-04-02 15:40:28.608 UTC [47] LOG:  background worker "logical replication launcher" (PID 54) exited with exit code 1
2020-04-02 15:40:28.609 UTC [49] LOG:  shutting down
2020-04-02 15:40:28.633 UTC [47] LOG:  database system is shut down
 done
server stopped

PostgreSQL init process complete; ready for start up.

2020-04-02 15:40:28.739 UTC [1] LOG:  starting PostgreSQL 12.2 (Debian 12.2-2.pgdg100+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 8.3.0-6) 8.3.0, 64-bit
2020-04-02 15:40:28.740 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
2020-04-02 15:40:28.740 UTC [1] LOG:  listening on IPv6 address "::", port 5432
2020-04-02 15:40:28.744 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
2020-04-02 15:40:28.764 UTC [65] LOG:  database system was shut down at 2020-04-02 15:40:28 UTC
2020-04-02 15:40:28.770 UTC [1] LOG:  database system is ready to accept connections
```

Laissons PostgreSQL fonctionner dans son terminal.

### Paramétrage de l'application

Il faut créer un fichier `application.properties` comme ressource du projet MAVEN dans la partie JAVA.

```text
# CDI 
quarkus.arc.remove-unused-beans=false

%dev.quarkus.smallrye-openapi.path=/openapi
%dev.quarkus.swagger-ui.always-include=true
%dev.quarkus.swagger-ui.path=/openapi-ui

# DEV with PostgreSQL
%dev.quarkus.datasource.db-kind=postgresql
%dev.quarkus.datasource.jdbc.url=jdbc:postgresql:quarkus_tuto
%dev.quarkus.datasource.username=quarkus_tuto
%dev.quarkus.datasource.password=quarkus_tuto
%dev.quarkus.datasource.jdbc.max-size=8
%dev.us.datasource.jdbc.min-size=2
%dev.quarkus.hibernate-orm.log.sql=false
%dev.quarkus.hibernate-orm.database.generation=drop-and-create
%dev.quarkus.hibernate-orm.sql-load-script=import.sql
%dev.quarkus.log.level=INFO
%dev.quarkus.log.category."org.hibernate".level=INFO
%dev.quarkus.log.category."fr.fxjavadevblog".level=DEBUG

# PROD
%prod.quarkus.datasource.db-kind=postgresql
%prod.quarkus.datasource.jdbc.url=jdbc:postgresql:quarkus_tuto
%prod.quarkus.datasource.username=quarkus_tuto
%prod.quarkus.datasource.password=quarkus_tuto
%prod.quarkus.hibernate-orm.database.generation=drop-and-create
%prod.quarkus.hibernate-orm.sql-load-script=import.sql
```

> Remarque importante : quand on construit l'image native de l'application, Quarkus se met automatiquement en mode `prod`.
> Cela signifie que certains paramètres sont ignorés par défaut comme le `drop-and-create` et le `sql-load-script`.
> C'est une très bonne pratique, cependant dans le cadre de ce tutoriel où les données ne persistent pas, je force, même en mode 
> `prod`, la création de la base de données et l'import du script SQL.
> Dans le fichier ci-dessus, ce sont les lignes `%prod.*` qui s'activent en production AUSSI.
> Je le redis : à ne pas faire dans un vrai projet !

Pour les tests unitaires et les tests d'intégration, nous aurons donc des fichiers `application.properties` différents.

## Des entités à persister

Bien évidemment, il nous faut au moins une classe persistente. J'ai repris ici des exemples d'un précédent article :

- VideoGame : classe persistante JPA
- Genre : une enum JAVA persistée sous forme de String
- Producers : des producers CDI pour les UUID qui serviront de `@Id` dans la classe persistance comme clé primaire
- VideoGameReposity : le CRUD issu de Spring Data JPA
- VideoGameFactory : de quoi créer des instances de la classe VideoGame en bénéficiant de l'injection automatique de UUID

### VideoGame et Genre

```java
package fr.fxjavadevblog.qjg.videogame;

import java.io.Serializable;

import javax.enterprise.context.Dependent;
import javax.inject.Inject;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Version;

import fr.fxjavadevblog.qjg.utils.InjectUUID;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@SuppressWarnings("serial")

// TODO
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EqualsAndHashCode(of = "id")
@ToString(of = { "id", "name" })

// CDI Annotation
@Dependent

// JPA Annotation
@Entity
@Table(name = "VIDEO_GAME")
public class VideoGame implements Serializable
{
    @Id
    @Inject
    @InjectUUID
    @Getter
    @Column(length = 36)
    private String id;

    @Getter
    @Setter
    @Column(name = "NAME", nullable = false, unique = true)
    private String name;

    @Getter
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(name = "GENRE", nullable = false)
    private Genre genre;

    @Version
    @Getter
    @Column(name = "VERSION")
    private Long version;
}
```

```java
/**
 * Enumeration of genres of Video Games for Atari ST.
 * 
 * @author robin
 *
 */
public enum Genre
{
   ARCADE, EDUCATION, FIGHTING, PINBALL, PLATFORM, REFLEXION, RPG, SHOOT_THEM_UP, SIMULATION, SPORT;
}
```

### Producers CDI et annotation

L'annotation `@InjectUUID` est utilisée sur la classe `VideoGame`.

```java
package fr.fxjavadevblog.qjg;


import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import javax.inject.Qualifier;

/**
 * annotation to mark a field to be injected by CDI with a UUID.
 * 
 * @author robin
 *
 */

@Qualifier
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.METHOD})
public @interface InjectUUID
{
}
```

Et son "traitement" par le Producer CDI suivant :

```java
package fr.fxjavadevblog.qjg.utils;

import java.util.UUID;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.inject.Produces;

@ApplicationScoped
public class Producers
{
    /**
     * produces randomly generated UUID for primary keys.
     *
     * @return UUID as a HEXA-STRING
     *
     */
    @Produces
    @InjectUUID
    public String produceUUIDAsString()
    {
        return UUID.randomUUID().toString();
    }
}
```

### Le repository CRUD avec Spring Data JPA

```java
package fr.fxjavadevblog.qjg.videogame;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

/**
 * CRUD repository for the VideoGame class. Primary key is a UUID represented by a String.
 * This repository is created by Hibernate Data JPA.
 * 
 * @author robin
 *
 */

public interface VideoGameRepository extends CrudRepository<VideoGame, String>
{
    /**
     * gets every Video Game filtered by the given Genre.
     * 
     * @param genre
     *    genre of video game
     *    @see Genre
     *    
     * @return
     *    a list of video games
     */
    List<VideoGame> findByGenre(Genre genre);
}
```

## Le endpoint REST JAX-WS

Et enfin de quoi servir le tout sur HTTP avec JAX-WS qui répond à l'URL `/api/videogames/v1` :

```java
package fr.fxjavadevblog.qjg.videogame;

import java.util.List;

import javax.ws.rs.BadRequestException;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;

/**
 * JAX-WS endpoint for Video Games.
 * 
 * @author robin
 *
 */

@Path("/api/videogames/v1")
public class VideoGameResource
{
    private final VideoGameRepository videoGameRepository;

    public VideoGameResource(VideoGameRepository videoGameRepository)
    {
        this.videoGameRepository = videoGameRepository;
    }

    @GET
    @Produces("application/json")
    public Iterable<VideoGame> findAll()
    {
        return videoGameRepository.findAll();
    }

    @GET
    @Path("/genre/{genre}")
    @Produces("application/json")
    public List<VideoGame> findByGenre(@PathParam(value = "genre") String genre)
    {
        try
        {
            Genre convertedGenre = Genre.valueOf(genre.replace("-", "_").toUpperCase());
            return videoGameRepository.findByGenre(convertedGenre);
        }
        catch (java.lang.IllegalArgumentException e)
        {
            throw new BadRequestException("Genre " + genre + "does not exist.");
        }
    }
}
```

Il suffit ensuite de déclencher la requête REST suivante pour obtenir tous les jeux vidéo :

```bash
$ curl http://localhost:8080//api/videogames/v1
[
    {
        "id": "896b9c77-4f6d-4bd6-b681-2791acfa0d51",
        "name": "100 4 1",
        "genre": "RELEXION",
        "version": 1
    },
    {
        "id": "6bf157fa-bd95-46ce-bbca-58afb87ebb9b",
        "name": "10TH FRAME",
        "genre": "SPORT",
        "version": 1
    },
    {
        "id": "e603e430-0853-46b0-9f44-d4f662f56c51",
        "name": "1943 : THE BATTLE OF MIDWAY",
        "genre": "SHOOT_THEM_UP",
        "version": 1
    },
    {
        "id": "61ec5869-d9f5-497a-9ffc-8e3612892c4b",
        "name": "1ST DIVISION MANAGER",
        "genre": "SPORT",
        "version": 1
    },
    {
        "id": "ed1233c4-c130-49f4-b329-314a6dd957a3",
        "name": "1ST SERVE TENNIS",
        "genre": "SPORT",
        "version": 1
    },
    {
        "id": "85d071ca-95bc-488a-afdc-494c430f03d9",
        "name": "20000 LEAGUES UNDER THE SEA",
        "genre": "RPG",
        "version": 1
    },

    ... etc ...
```

De la même manière pour filtrer sur le genre de jeu :

```bash
$ curl http://localhost:8080/api/videogames/v1/genre/SHOOT_THEM_UP
[
    {
        "id": "e603e430-0853-46b0-9f44-d4f662f56c51",
        "name": "1943 : THE BATTLE OF MIDWAY",
        "genre": "SHOOT_THEM_UP",
        "version": 1
    },
    {
        "id": "fa02815b-f6d2-4ba1-9f63-5c8f575d06b6",
        "name": "AIR SUPPLY",
        "genre": "SHOOT_THEM_UP",
        "version": 1
    },
    {
        "id": "07638287-8f45-4be8-a887-c57f350a9ce7",
        "name": "ALBEDO",
        "genre": "SHOOT_THEM_UP",
        "version": 1
    },
    {
        "id": "56417168-1e57-4197-a490-56258e5405eb",
        "name": "ALCON",
        "genre": "SHOOT_THEM_UP",
        "version": 1
    },
    {
        "id": "d5bd6aaa-674d-4e7f-ae8e-53118de897c6",
        "name": "ALIEN BLAST",
        "genre": "SHOOT_THEM_UP",
        "version": 1
    },
    {
        "id": "2589d502-4619-4728-b688-9cece2a8a3ab",
        "name": "ALIEN BUSTERS IV",
        "genre": "SHOOT_THEM_UP",
        "version": 1
    }

    ... etc ...
```

Cela fonctionne, mais je trouve que ce n'est pas satisfaisant concernant les URL d'invocation pour les genres, ainsi que le résultat JSON qui sérialise en majuscles les valeurs de l'enum. C'est normal, mais ce n'est pas très "HTTP Friendly".

On va y rémédier dans le paragraphe qui suit !

## Convertisseur générique pour les valeurs de l'enum

Pour résumer le problème, les URL d'appel ainsi que le contenu du retour JSON ne respectent pas les conventions de nommage classique de REST.

> En plus, les manipulations comme `Genre.valueOf(genre.replace("-", "_").toUpperCase());` ce n'est pas très joli, à mon goût.

Ce que l'on souhaite pour les URL d'appel et les retours JSON :

- utiliser des "-" au lieu des "_" pour séparer les mots clés
- basculer tout en minuscules

Vous pouvez retrouver ces recommandations ici : [https://restfulapi.net/resource-naming/](https://restfulapi.net/resource-naming/)

Exemple : l'appel de `/api/videogames/v1/genre/shoot-them-up` doit retourner :

```json
[
  ...
  ...
    {
        "id": "d5bd6aaa-674d-4e7f-ae8e-53118de897c6",
        "name": "ALIEN BLAST",
        "genre": "shoot-them-up",
        "version": 1
    },
  ...
  ...
]
```

Mais, on ne veut pas toucher aux conventions de nommage de l'enum `Genre` ! C'est du Java et on doit pouvoir garder les choses ainsi !

Il y a pleins de solutions pour cela. Celle que je vais privilégier est l'usage de l'annotation @JsonProperty de Jackson que l'on va placer sur chacune des valeurs de l'enum :

```java
public enum Genre
{
   @JsonProperty(value = "arcade")
   ARCADE, 
   
   @JsonProperty(value = "education")
   EDUCATION, 
   
   @JsonProperty(value = "fighting")
   FIGHTING, 
   
   @JsonProperty(value = "pinball")
   PINBALL, 
   
   @JsonProperty(value = "platform")
   PLATFORM, 
   
   @JsonProperty(value = "reflexion")
   REFLEXION, 
   
   @JsonProperty(value = "rpg")
   RPG, 
   
   @JsonProperty(value = "shoot-them-up")
   SHOOT_THEM_UP, 
   
   @JsonProperty(value = "simulation")
   SIMULATION,
   
   @JsonProperty(value = "sport")
   SPORT;
}
```

Avec cela, on règle déjà un premier problème : le contenu du retour JSON !

```bash
$ curl http://localhost:8080//api/videogames/v1/genre/SHOOT_THEM_UP
[
    {
        "id": "e603e430-0853-46b0-9f44-d4f662f56c51",
        "name": "1943 : THE BATTLE OF MIDWAY",
        "genre": "shoot-them-up",
        "version": 1
    },

    ... etc ...

 ```

Mais le problème persiste pour l'URL ! Il faut donc créer un ParamConverter JAX-RS !

> Un quoi ?????

Un `ParamConverter<T>` est un convertisseur JAX-RS qui va être invoqué à différent moment du traitement de la requête. Son travail est de fournir une conversion bidrectionnelle de `<T>` vers `String` et de `String` vers `<T>`.

Mais on va en créer un générique qui va aller chercher la valeur de l'annotation Jackson `@JsonProperty`.

```java
package fr.fxjavadevblog.qjg.utils;

import java.util.EnumSet;
import java.util.Optional;

import javax.ws.rs.ext.ParamConverter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;

/**
 * Generic JAX-RS Enum converter based on the Jackson JsonProperty annotation to
 * get the mapping.
 * 
 * @author robin
 *
 * @param <T>
 */

public class GenericEnumConverter<T extends Enum<T>> implements ParamConverter<T>
{
    private static final Logger log = LoggerFactory.getLogger(GenericEnumConverter.class);
    
    /**
     * bi-directionnal Map to store enum value as key and its string representation as value.
     * The string representation is retrieved through the JsonProperty annotation put on the enum constant. 
     */
    private final BiMap<T, String> biMap =  HashBiMap.create();

    /**
     * returns a Generic converter for an enum class in the context of JAX-RS ParamConverter.
     * 
     * @param <T>
     *    enum type
     * @param t
     *    enum type class
     * @return
     *    a generic converter used by JAX-RS.
     */
    public static <T extends Enum<T>> ParamConverter<T> of(Class<T> t)
    {
        return new GenericEnumConverter<>(t);
    }
    
    private GenericEnumConverter(Class<T> t)
    {
        log.debug("Generating conversion map for enum {}", t);
        EnumSet.allOf(t).forEach(v -> {
            try
            {
                String enumValue = v.name();
                JsonProperty annotation =  v.getClass().getDeclaredField(enumValue).getAnnotation(JsonProperty.class);
                // get the annotation if it exists or take the classic enum representation
                String result = Optional.ofNullable(annotation).map(JsonProperty::value).orElse(enumValue);
                log.debug("Enum value {}.{} is mapped to \"{}\"", t.getSimpleName(), v.name(), result);
                biMap.put(v, result);
            }
            catch (NoSuchFieldException | SecurityException e)
            {
                log.error("Error while populating BiMap of enum {}", t.getClass());
                log.error("Thrown by ", e);
            }
        });
    }

    /**
     * returns the enum type constant from this string representation.
     */
    @Override
    public T fromString(String value)
    {
        T returnedValue = biMap.inverse().get(value); 
        log.debug("Converting String \"{}\" to {}.{}", value, returnedValue.getClass(), returnedValue);
        return returnedValue;
    }

    /**
     * returns the string represenation from this enum type constant.
     */
    @Override
    public String toString(T t)
    {
        String returnedValue = biMap.get(t);
        log.debug("Converting Enum {}.{} to String \"{}\"", t.getClass(), t, returnedValue);
        return returnedValue;
    }
}
```

Les concepts de cette classe sont les suivants :

- elle est instanciée en prenant une enum comme argument : `ParamConverter<Genre> converter = GenericEnumConverter.of(Genre.class);`
- elle instrospecte l'enum pendant sa construction à la recherche des annotations `@JsonProperty` sur chaque valeur
- pour chaque valeur, elle récupère le contenu de l'annotation `@JsonProperty` et peuple une BiMap (Map bidrectionnele Guava, incluse dans Quarkus)
- si l'annotation n'est pas présente (on ne sait jamais), la valeur `toString()` de l'enum sera prise par défaut

La partie "générique" permet de s'adapter à n'importe quelle *enum*.

A la fin de la construction de cette classe, la BiMap contient les tuples suivants :

```text
Generating conversion map for enum class fr.fxjavadevblog.qjg.genre.Genre
Enum value Genre.ARCADE is mapped to "arcade"
Enum value Genre.EDUCATION is mapped to "education"
Enum value Genre.FIGHTING is mapped to "fighting"
Enum value Genre.PINBALL is mapped to "pinball"
Enum value Genre.PLATFORM is mapped to "platform"
Enum value Genre.REFLEXION is mapped to "reflexion"
Enum value Genre.RPG is mapped to "rpg"
Enum value Genre.SHOOT_THEM_UP is mapped to "shoot-them-up"
Enum value Genre.SIMULATION is mapped to "simulation"
Enum value Genre.SPORT is mapped to "sport"
```

Ensuite il faut *enregistrer* ce convertisseur automatique auprès de JAX-RS : cela se fait au moyen d'une classe qui implémente l'interface `ParamConverterProvider` et d'une annotation `@Provider` :

```java
package fr.fxjavadevblog.qjg.genre;

import java.lang.annotation.Annotation;
import java.lang.reflect.Type;

import javax.ws.rs.ext.ParamConverter;
import javax.ws.rs.ext.ParamConverterProvider;
import javax.ws.rs.ext.Provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import fr.fxjavadevblog.qjg.utils.GenericEnumConverter;

/**
 * JAX-RS provider for Genre conversion. This converter is registered because of
 * the Provider annotation.
 * 
 * @author robin
 */

@Provider
public class GenreConverterProvider implements ParamConverterProvider
{
    private final Logger log = LoggerFactory.getLogger(GenreConverterProvider.class);
    private final ParamConverter<Genre> converter = GenericEnumConverter.of(Genre.class);

    @SuppressWarnings("unchecked")
    @Override
    public <T> ParamConverter<T> getConverter(Class<T> rawType, Type genericType, Annotation[] annotations)
    {
        log.debug("Registering GenreConverter");
        return (Genre.class.equals(rawType)) ? (ParamConverter<T>) converter : null;
    }
}
```

Le endpoint REST de la classe `VideoGameResource` change légèrement pour se simplifier :

```java
@GET
@Path("/genre/{genre}")
public List<VideoGame> findByGenre(@PathParam("genre") Genre genre)
{
    return videoGameRepository.findByGenre(genre);
}
```

> Notez, ici l'appel au convertisseur générique précédemment codé.

Grâce à tout ceci, on obtient le comportement souhaité :

```bash
$ curl http://localhost:8080//api/videogames/v1/genre/shoot-them-up
[
    {
        "id": "e603e430-0853-46b0-9f44-d4f662f56c51",
        "name": "1943 : THE BATTLE OF MIDWAY",
        "genre": "shoot-them-up",
        "version": 1
    },
    {
        "id": "fa02815b-f6d2-4ba1-9f63-5c8f575d06b6",
        "name": "AIR SUPPLY",
        "genre": "shoot-them-up",
        "version": 1
    },
    {
        "id": "07638287-8f45-4be8-a887-c57f350a9ce7",
        "name": "ALBEDO",
        "genre": "shoot-them-up",
        "version": 1
    },
    {
        "id": "56417168-1e57-4197-a490-56258e5405eb",
        "name": "ALCON",
        "genre": "shoot-them-up",
        "version": 1
    },
    {
        "id": "d5bd6aaa-674d-4e7f-ae8e-53118de897c6",
        "name": "ALIEN BLAST",
        "genre": "shoot-them-up",
        "version": 1
    },
    {
        "id": "2589d502-4619-4728-b688-9cece2a8a3ab",
        "name": "ALIEN BUSTERS IV",
        "genre": "shoot-them-up",
        "version": 1
    }

    ... etc ...

 ```  

De plus, quand on invoque l'URL avec un genre qui ne peut pas être mappé, on obtient une erreur 404. Ce comportement est très satisfaisant.

```bash
$ curl -s -o /dev/null -D - http://localhost:8080//api/videogames/v1/genre/SHOOT_THEM_UP
HTTP/1.1 404 Not Found
Content-Length: 0
Content-Type: application/json
```

## Tests

### Tests unitaires

Ces tests sont classiquement dans le répertoire "test". Les points particuliers sont les suivants :

- la base de données n'est pas créée dans ce cas
- `@QuarkusTest` est présent sur quelques classes de tests unitaires pour vérifier le comportement de CDI
- les tests unitaires nommés `IT_*` sont ignorés par convention (tests d'intégration)
- le profil `test` de Quarkus est automatique, un fichier spécifique `application.properties` est utilisé à cet effet
- la propriété `quarkus.arc.remove-unused-beans=false` permet de conserver dans le contexte CDI tous les beans injectables

Pour lancer les tests unitaires :

```bash
$ mvn clean test
...
...
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ quarkus-tuto ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running fr.fxjavadevblog.qjg.ping.PingTest
2020-04-14 19:25:27,022 INFO  [io.quarkus] (main) Quarkus 1.3.1.Final started in 4.701s. Listening on: http://0.0.0.0:8081
2020-04-14 19:25:27,030 INFO  [io.quarkus] (main) Profile test activated. 
2020-04-14 19:25:27,031 INFO  [io.quarkus] (main) Installed features: [agroal, cdi, hibernate-orm, hibernate-orm-panache, hibernate-validator, jdbc-postgresql, narayana-jta, resteasy, resteasy-jackson, smallrye-openapi, spring-data-jpa, spring-di, swagger-ui]
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 7.947 s - in fr.fxjavadevblog.qjg.ping.PingTest
[INFO] Running fr.fxjavadevblog.qjg.utils.GenericEnumConverterTest
[INFO] Tests run: 100, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.174 s - in fr.fxjavadevblog.qjg.utils.GenericEnumConverterTest
[INFO] Running fr.fxjavadevblog.qjg.utils.CDITest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.001 s - in fr.fxjavadevblog.qjg.utils.CDITest
[INFO] Running fr.fxjavadevblog.qjg.utils.DummyTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0 s - in fr.fxjavadevblog.qjg.utils.DummyTest
2020-04-14 19:25:28,697 INFO  [io.quarkus] (main) Quarkus stopped in 0.056s
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 105, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  13.888 s
[INFO] Finished at: 2020-04-14T19:25:29+02:00
[INFO] ------------------------------------------------------------------------
```

### Tests d'intégration

Ces tests sont placés dans le répertoire "test-integration". Les points particuliers sont les suivants :

- une image Docker PostgreSQL pour les tests d'intégration est lancée
- `@QuarkusTest` est présent sur tous les tests afin de disposer de l'environnement complet
- Les tests sont *assurés* avec *Rest Assured*

```java
package fr.fxjavadevblog.qjg.videogame;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.containsString;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import fr.fxjavadevblog.qjg.global.TestingGroups;
import io.quarkus.test.junit.QuarkusTest;

@QuarkusTest
@Tag(TestingGroups.INTEGRATION_TESTING)
class IT_VideoGameResource
{
    public static final String ENDPOINT = "/api/videogames/v1";

    @Test
    @DisplayName("Get " + ENDPOINT)
    void testGetAllVideoGames()
    {        
        given().when()
               .get(ENDPOINT + "/")
               .then()
               .statusCode(200)
               .assertThat().body(containsString("XENON"), 
                                  containsString("RICK"), 
                                  containsString("LOTUS"));
    }
}
```

Pour lancer les tests d'intégration :

- s'assurer que le PostgreSQL de dev n'est pas lancé
- lancer la commande `$ mvn -Dskip.surefire.tests verify`

```bash
$ mvn -Dskip.surefire.tests verify
canning for projects...
[INFO] 
[INFO] -------------------< fr.fxjavadevblog:quarkus-tuto >--------------------
[INFO] Building Quarkus-JPA-PostgreSQL 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:3.1.0:resources (default-resources) @ quarkus-tuto ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 2 resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:compile (default-compile) @ quarkus-tuto ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- build-helper-maven-plugin:3.1.0:add-test-source (add-integration-test-sources) @ quarkus-tuto ---
[INFO] Test Source directory: /home/robin/git/quarkus-tuto/src/test-integration/java added.
[INFO] 
[INFO] --- build-helper-maven-plugin:3.1.0:add-test-resource (add-integration-test-resource) @ quarkus-tuto ---
[INFO] 
[INFO] --- maven-resources-plugin:3.1.0:testResources (default-testResources) @ quarkus-tuto ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 1 resource
[INFO] Copying 1 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:testCompile (default-testCompile) @ quarkus-tuto ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ quarkus-tuto ---
[INFO] Tests are skipped.
[INFO] 
[INFO] --- maven-jar-plugin:2.4:jar (default-jar) @ quarkus-tuto ---
[INFO] 
[INFO] --- quarkus-maven-plugin:1.3.1.Final:build (default) @ quarkus-tuto ---
[INFO] [org.jboss.threads] JBoss Threads version 3.0.1.Final
[INFO] [org.hibernate.Version] HHH000412: Hibernate ORM core version 5.4.12.Final
[INFO] [io.quarkus.deployment.pkg.steps.JarResultBuildStep] Building thin jar: /home/robin/git/quarkus-tuto/target/quarkus-tuto-0.0.1-SNAPSHOT-runner.jar
[INFO] [io.quarkus.deployment.QuarkusAugmentor] Quarkus augmentation completed in 1647ms
[INFO] 
[INFO] --- maven-resources-plugin:3.1.0:copy-resources (copy-resources) @ quarkus-tuto ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 1 resource
[INFO] 
[INFO] --- docker-maven-plugin:0.33.0:stop (docker:start) @ quarkus-tuto ---
[INFO] 
[INFO] --- docker-maven-plugin:0.33.0:start (docker:start) @ quarkus-tuto ---
[INFO] DOCKER> [postgres:12.2] "postgresql": Start container ca6a77a7d1e3
[INFO] DOCKER> [postgres:12.2] "postgresql": Waiting for mapped ports [5432] on host localhost
[INFO] DOCKER> [postgres:12.2] "postgresql": Waited on tcp port '[localhost/127.0.0.1:5432]' 4 ms
[INFO] 
[INFO] --- maven-failsafe-plugin:2.22.2:integration-test (default) @ quarkus-tuto ---
19:29:19.154 PostgreSQL Server :The files belonging to this database system will be owned by user "postgres".
19:29:19.154 PostgreSQL Server :This user must also own the server process.
19:29:19.154 PostgreSQL Server :
19:29:19.154 PostgreSQL Server :The database cluster will be initialized with locale "en_US.utf8".
19:29:19.154 PostgreSQL Server :The default database encoding has accordingly been set to "UTF8".
19:29:19.154 PostgreSQL Server :The default text search configuration will be set to "english".
19:29:19.154 PostgreSQL Server :
19:29:19.154 PostgreSQL Server :Data page checksums are disabled.
19:29:19.154 PostgreSQL Server :
19:29:19.154 PostgreSQL Server :fixing permissions on existing directory /var/lib/postgresql/data ... ok
19:29:19.155 PostgreSQL Server :creating subdirectories ... ok
19:29:19.155 PostgreSQL Server :selecting dynamic shared memory implementation ... posix
19:29:19.171 PostgreSQL Server :selecting default max_connections ... 100
19:29:19.197 PostgreSQL Server :selecting default shared_buffers ... 128MB
19:29:19.243 PostgreSQL Server :selecting default time zone ... Etc/UTC
19:29:19.244 PostgreSQL Server :creating configuration files ... ok
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
19:29:19.393 PostgreSQL Server :running bootstrap script ... ok
19:29:20.011 PostgreSQL Server :performing post-bootstrap initialization ... ok
[INFO] Running fr.fxjavadevblog.qjg.utils.IT_DummyTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.032 s - in fr.fxjavadevblog.qjg.utils.IT_DummyTest
[INFO] Running fr.fxjavadevblog.qjg.videogame.IT_VideoGameResource
19:29:20.174 PostgreSQL Server :syncing data to disk ... ok
19:29:20.174 PostgreSQL Server :
19:29:20.174 PostgreSQL Server :
19:29:20.174 PostgreSQL Server :Success. You can now start the database server using:
19:29:20.174 PostgreSQL Server :
19:29:20.174 PostgreSQL Server :    pg_ctl -D /var/lib/postgresql/data -l logfile start
19:29:20.174 PostgreSQL Server :
19:29:20.174 PostgreSQL Server :initdb: warning: enabling "trust" authentication for local connections
19:29:20.174 PostgreSQL Server :You can change this by editing pg_hba.conf or using the option -A, or
19:29:20.174 PostgreSQL Server :--auth-local and --auth-host, the next time you run initdb.
19:29:20.201 PostgreSQL Server :waiting for server to start....2020-04-14 17:29:20.201 UTC [47] LOG:  starting PostgreSQL 12.2 (Debian 12.2-2.pgdg100+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 8.3.0-6) 8.3.0, 64-bit
19:29:20.203 PostgreSQL Server :2020-04-14 17:29:20.203 UTC [47] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
19:29:20.218 PostgreSQL Server :2020-04-14 17:29:20.218 UTC [48] LOG:  database system was shut down at 2020-04-14 17:29:19 UTC
19:29:20.223 PostgreSQL Server :2020-04-14 17:29:20.223 UTC [47] LOG:  database system is ready to accept connections
19:29:20.292 PostgreSQL Server : done
19:29:20.292 PostgreSQL Server :server started
19:29:20.418 PostgreSQL Server :CREATE DATABASE
19:29:20.419 PostgreSQL Server :
19:29:20.419 PostgreSQL Server :
19:29:20.419 PostgreSQL Server :/usr/local/bin/docker-entrypoint.sh: ignoring /docker-entrypoint-initdb.d/*
19:29:20.419 PostgreSQL Server :
19:29:20.420 PostgreSQL Server :2020-04-14 17:29:20.420 UTC [47] LOG:  received fast shutdown request
19:29:20.422 PostgreSQL Server :waiting for server to shut down....2020-04-14 17:29:20.422 UTC [47] LOG:  aborting any active transactions
19:29:20.423 PostgreSQL Server :2020-04-14 17:29:20.423 UTC [47] LOG:  background worker "logical replication launcher" (PID 54) exited with exit code 1
19:29:20.424 PostgreSQL Server :2020-04-14 17:29:20.424 UTC [49] LOG:  shutting down
19:29:20.437 PostgreSQL Server :2020-04-14 17:29:20.436 UTC [47] LOG:  database system is shut down
19:29:20.520 PostgreSQL Server : done
19:29:20.520 PostgreSQL Server :server stopped
19:29:20.520 PostgreSQL Server :
19:29:20.520 PostgreSQL Server :PostgreSQL init process complete; ready for start up.
19:29:20.520 PostgreSQL Server :
19:29:20.537 PostgreSQL Server :2020-04-14 17:29:20.537 UTC [1] LOG:  starting PostgreSQL 12.2 (Debian 12.2-2.pgdg100+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 8.3.0-6) 8.3.0, 64-bit
19:29:20.538 PostgreSQL Server :2020-04-14 17:29:20.537 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
19:29:20.538 PostgreSQL Server :2020-04-14 17:29:20.537 UTC [1] LOG:  listening on IPv6 address "::", port 5432
19:29:20.541 PostgreSQL Server :2020-04-14 17:29:20.541 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
19:29:20.555 PostgreSQL Server :2020-04-14 17:29:20.555 UTC [65] LOG:  database system was shut down at 2020-04-14 17:29:20 UTC
19:29:20.560 PostgreSQL Server :2020-04-14 17:29:20.560 UTC [1] LOG:  database system is ready to accept connections
Hibernate: 
    
    drop table if exists VIDEO_GAME cascade
Hibernate: 
    
    create table VIDEO_GAME (
       id varchar(36) not null,
        GENRE varchar(255) not null,
        NAME varchar(255) not null,
        VERSION int8,
        primary key (id)
    )
Hibernate: 
    
    alter table if exists VIDEO_GAME 
       add constraint UK_jg5tlrbpecd0wd8c9vjo6b429 unique (NAME)

Hibernate: 
    INSERT INTO VIDEO_GAME(ID,NAME,GENRE,VERSION) VALUES ('896b9c77-4f6d-4bd6-b681-2791acfa0d51','100 4 1','REFLEXION',1)
Hibernate: 
    INSERT INTO VIDEO_GAME(ID,NAME,GENRE,VERSION) VALUES ('6bf157fa-bd95-46ce-bbca-58afb87ebb9b','10TH FRAME','SPORT',1)
Hibernate: 
    INSERT INTO VIDEO_GAME(ID,NAME,GENRE,VERSION) VALUES ('e603e430-0853-46b0-9f44-d4f662f56c51','1943 : THE BATTLE OF MIDWAY','SHOOT_THEM_UP',1)
Hibernate: 
    INSERT INTO VIDEO_GAME(ID,NAME,GENRE,VERSION) VALUES ('61ec5869-d9f5-497a-9ffc-8e3612892c4b','1ST DIVISION MANAGER','SPORT',1)       

... etc ...

Hibernate: 
    select
        videogame0_.id as id1_0_,
        videogame0_.GENRE as genre2_0_,
        videogame0_.NAME as name3_0_,
        videogame0_.VERSION as version4_0_ 
    from
        VIDEO_GAME videogame0_ limit ?
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 8.89 s - in fr.fxjavadevblog.qjg.videogame.IT_VideoGameResource
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] 
[INFO] --- docker-maven-plugin:0.33.0:stop (docker:stop) @ quarkus-tuto ---
19:29:29.455 PostgreSQL Server :2020-04-14 17:29:29.454 UTC [1] LOG:  received smart shutdown request
19:29:29.460 PostgreSQL Server :2020-04-14 17:29:29.459 UTC [1] LOG:  background worker "logical replication launcher" (PID 71) exited with exit code 1
19:29:29.460 PostgreSQL Server :2020-04-14 17:29:29.460 UTC [66] LOG:  shutting down
19:29:29.496 PostgreSQL Server :2020-04-14 17:29:29.496 UTC [1] LOG:  database system is shut down
[INFO] DOCKER> [postgres:12.2] "postgresql": Stop and removed container ca6a77a7d1e3 after 0 ms
[INFO] 
[INFO] --- maven-failsafe-plugin:2.22.2:verify (default) @ quarkus-tuto ---
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

## Version native et image Docker

Pour générer l'image Docker de l'application native, rien de plus facile que de lancer :

```bash
$ mvn clean package -Pnative -Dquarkus.native.container-build=true -Dskip.surefire.tests

...
...
[INFO] [io.quarkus.deployment.pkg.steps.NativeImageBuildStep] Pulling image quay.io/quarkus/ubi-quarkus-native-image:19.3.1-java11
19.3.1-java11: Pulling from quarkus/ubi-quarkus-native-image
57de4da701b5: Pull complete 
cf0f3ebe9f53: Pull complete 
e9da77aa316d: Pull complete 
Digest: sha256:b18b701bd6f9d0a7778129f63b9f2dd666be2a2574854b56cd60e3cbd42b73d3
Status: Downloaded newer image for quay.io/quarkus/ubi-quarkus-native-image:19.3.1-java11
quay.io/quarkus/ubi-quarkus-native-image:19.3.1-java11
[INFO] [io.quarkus.deployment.pkg.steps.NativeImageBuildStep] Running Quarkus native-image plugin on GraalVM Version 19.3.1 CE
[INFO] [io.quarkus.deployment.pkg.steps.NativeImageBuildStep] docker run -v /home/robin/git/quarkus-tuto/target/quarkus-tuto-0.0.1-SNAPSHOT-native-image-source-jar:/project:z --env LANG=C --user 1000:1000 --rm quay.io/quarkus/ubi-quarkus-native-image:19.3.1-java11 -J-Djava.util.logging.manager=org.jboss.logmanager.LogManager -J-Dsun.nio.ch.maxUpdateArraySize=100 -J-DCoordinatorEnvironmentBean.transactionStatusManagerEnable=false -J-Dvertx.logger-delegate-factory-class-name=io.quarkus.vertx.core.runtime.VertxLogDelegateFactory -J-Dvertx.disableDnsResolver=true -J-Dio.netty.leakDetection.level=DISABLED -J-Dio.netty.allocator.maxOrder=1 -J-Duser.language=fr -J-Dfile.encoding=UTF-8 --initialize-at-build-time= -H:InitialCollectionPolicy=com.oracle.svm.core.genscavenge.CollectionPolicy$BySpaceAndTime -H:+JNI -jar quarkus-tuto-0.0.1-SNAPSHOT-runner.jar -H:FallbackThreshold=0 -H:+ReportExceptionStackTraces -H:-AddAllCharsets -H:-IncludeAllTimeZones -H:EnableURLProtocols=http,https --enable-all-security-services --no-server -H:-UseServiceLoaderFeature -H:+StackTrace quarkus-tuto-0.0.1-SNAPSHOT-runner
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]    classlist:  10 740,32 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]        (cap):     793,01 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]        setup:   2 161,94 ms
08:35:25,649 INFO  [org.hib.Version] HHH000412: Hibernate ORM core version 5.4.12.Final
08:35:25,663 INFO  [org.hib.ann.com.Version] HCANN000001: Hibernate Commons Annotations {5.1.0.Final}
08:35:25,705 INFO  [org.hib.dia.Dialect] HHH000400: Using dialect: io.quarkus.hibernate.orm.runtime.dialect.QuarkusPostgreSQL10Dialect
08:35:25,848 INFO  [org.hib.val.int.uti.Version] HV000001: Hibernate Validator 6.1.2.Final
08:35:27,547 INFO  [org.jbo.threads] JBoss Threads version 3.0.1.Final
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]   (typeflow):  47 866,54 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]    (objects):  33 462,47 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]   (features):   1 692,11 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]     analysis:  87 791,76 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]     (clinit):   1 211,71 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]     universe:   5 195,59 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]      (parse):   6 258,47 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]     (inline):   8 432,95 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]    (compile):  55 066,12 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]      compile:  74 232,51 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]        image:   5 742,28 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]        write:   1 469,31 ms
[quarkus-tuto-0.0.1-SNAPSHOT-runner:24]      [total]: 187 812,32 ms
[INFO] [io.quarkus.deployment.QuarkusAugmentor] Quarkus augmentation completed in 223001ms
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  03:50 min
[INFO] Finished at: 2020-04-15T10:38:21+02:00
[INFO] ------------------------------------------------------------------------
```

Cette commande a réalisée un chose essentielle : elle a compilé en une version native LINUX, quel que soit votre environnement de travail au moyen d'un conteneur dédié à la compilation.
TODO : elle a compilé quoi ?

Pour faire simple, un conteneur Docker `ubi-quarkus-native-image:19.3.1-java11` a été récupéré puis lancé pour compiler l'application au format LINUX même si vous êtes sous Windows. Cela nécessite toutefois d'avoir GraalVM installé nativement, mais cela peut-être contourné (cf : <https://quarkus.io/guides/building-native-image>)

Une fois compilée, il faut maintenant créer l'image du conteneur Docker. Cette création est possible en ayant préalablement créé 2 fichiers dans `/src/main/docker` :
TODO : qui est compilé ?

- `/src/main/docker/Dockerfile.native` : fichier pour la génération en mode natif
- `.dockerignore` : fichier pour la génération en mode JVM *normal* à la racine du projet MAVEN

> Il peut aussi exister un fichier `Dockerfile.jvm` mais ce n'est pas l'objet de ce tutoriel.

Voici le contenu de ces fichiers :

**Dockerfile.native** :

```text
FROM registry.access.redhat.com/ubi8/ubi-minimal
WORKDIR /work/
COPY target/*-runner /work/application
RUN chmod 775 /work
EXPOSE 8080
CMD ["./application", "-Dquarkus.http.host=0.0.0.0"]
```

**.dockerignore** :

```text
*
!target/*-runner
!target/*-runner.jar
```

On peut alors lancer la création de l'image Docker :

```bash
$ docker build -f src/main/docker/Dockerfile.native -t quarkus-tuto .
Sending build context to Docker daemon  102.9MB
Step 1/6 : FROM registry.access.redhat.com/ubi8/ubi-minimal
latest: Pulling from ubi8/ubi-minimal
b26afdf22be4: Pull complete 
218f593046ab: Pull complete 
Digest: sha256:df6f9e5d689e4a0b295ff12abc6e2ae2932a1f3e479ae1124ab76cf40c3a8cdd
Status: Downloaded newer image for registry.access.redhat.com/ubi8/ubi-minimal:latest
 ---> 91d23a64fdf2
Step 2/6 : WORKDIR /work/
 ---> Running in 40a5ee141273
Removing intermediate container 40a5ee141273
 ---> 6ab61dca9bf2
Step 3/6 : COPY target/*-runner /work/application
 ---> 3aae05f5ee7d
Step 4/6 : RUN chmod 775 /work
 ---> Running in 8387b2b6e071
Removing intermediate container 8387b2b6e071
 ---> 0c03e70d6326
Step 5/6 : EXPOSE 8080
 ---> Running in 1813737fd08e
Removing intermediate container 1813737fd08e
 ---> 978251ac9f2b
Step 6/6 : CMD ["./application", "-Dquarkus.http.host=0.0.0.0"]
 ---> Running in c93ab35754d4
Removing intermediate container c93ab35754d4
 ---> 6009aee9381b
Successfully built 6009aee9381b
Successfully tagged quarkus-tuto:latest
```

Une fois le conteneur créé, il suffit de le lancer, en ayant lancé préalablement une instance de PostgreSQL (encore avec Docker, comme en DEV) :

```bash
$ docker run -i --rm -p 8080:8080 --network="host" quarkus-tuto
```

> Le paramètre `--network="host"` permet à l'application de se connecter au PostgreSQL exposé par Docker.

```bash
$ curl http://localhost:8080/api/videogames/v1/genre/rpg
[
    {
        "id": "75a9b985-c5a9-40a0-87ba-086850683bfc",
        "name": "20000 LIEUES SOUS LES MERS",
        "genre": "rpg",
        "version": 1
    },
    {
        "id": "2b412dd7-d090-4328-8180-869b60bbc106",
        "name": "ADVENTURE",
        "genre": "rpg",
        "version": 1
    },
    {
        "id": "885a3475-63c9-49f3-b120-e218ce9c9510",
        "name": "ADVENTURER, THE",
        "genre": "rpg",
        "version": 1
    },
    {
        "id": "a500c1a6-6008-45d4-b3f4-5b668b77499a",
        "name": "ADVENTURES OF ROBIN HOOD, THE",
        "genre": "rpg",
        "version": 1
    },
 ... etc ...
]
```

## Health Check et Metrics

Quarkus embarque les extensions SmallRye Health et Metrics, qui sont les implémentations respectives de Eclipse MicroProfile Health et Metrics.

Le simple ajout dans le pom de ces deux dépendances rend ces fonctionnalités opérationnelles :

```xml
<!-- Health Check -->
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-smallrye-health</artifactId>
</dependency>

<!-- Metrics -->
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-smallrye-metrics</artifactId>
</dependency>
```

Une fois l'application lancée et qu'elle est sollicitée, on peut obtenir un état de son bon fonctionnement :

```bash
$ curl http://localhost:8080/health
{
    "status": "UP",
    "checks": [
        {
            "name": "Application",
            "status": "UP"
        },
        {
            "name": "Database connections health check",
            "status": "UP"
        }
    ]
}
```

On peut obtenir quelques mesures qui auront été calculées au moyen de l'annotation `@Timed` sur les méthodes de la classe `VideoGameResource` :

```java
@Timed(name = "videogames-find-by-all", absolute = true,
       description = "A measure of how long it takes to fetch all video games.", 
       unit = MetricUnits.MILLISECONDS)
public Iterable<VideoGame> findAll()
{
    return videoGameRepository.findAll();
}

@Timed(name = "videogames-find-by-genre", absolute = true, 
       description = "A measure of how long it takes to fetch all video games filtered by a given genre.", 
       unit = MetricUnits.MILLISECONDS)
public List<VideoGame> findByGenre(@PathParam("genre") Genre genre)
{
    return videoGameRepository.findByGenre(genre);
}
```

> l'attribut `absolute=true` empêche la concaténation du nom du package et de la classe au nom de la mesure. Ceci sera plus agréable à lire dans les outils de restitution qui exploiteront cette information du retour JSON. Je préfère cette notation car elle aura un impact direct sur les URL d'appels des mesures.

Voici les mesures obtenues après 20 appels de l'URL `/api/videogames/v1/genre/shoot-them-up` :

```bash
$ curl -H"Accept: application/json" localhost:8080/metrics/application/videogames-find-by-genre
{
    "videogames-find-by-genre": {
        "p99": 10.044791,
        "min": 2.335977,
        "max": 10.044791,
        "mean": 3.6114086322681627,
        "p50": 3.19797,
        "p999": 10.044791,
        "stddev": 1.6164326637605608,
        "p95": 5.663952,
        "p98": 10.044791,
        "p75": 3.752217,
        "fiveMinRate": 0.06305266722909629,
        "fifteenMinRate": 0.021812705995763727,
        "meanRate": 0.008589683736876096,
        "count": 20,
        "oneMinRate": 0.252757448780742
    }
}
```

> Il faut ensuite utiliser un collecteur de Metrics comme Prometheus couplé à Grafana pour obtenir de jolis tableaux de bord.

## Conclusions

Quarkus est, à mon humble avis, un framework de développement de Web Services REST très intéressant sur de nombreux aspects :

- il est facile à prendre en main
- le mode *dev* et le *hot reload* offrent un gain de temps important, même si l'usage conjoint de Lombok n'est pas encore optimum
- la documentation est claire et il y a de nombreux exemples officiels sur GitHub
- la conformité aux specs Java EE et Microprofile est très intéressante et rassurante ( JAX-RS, etc) : pas de nouvelle API propriétaire à apprendre
- le plugin de compilation native avec GraalVM est fourni et le résultat est à la hauteur des espérances
- l'usage du Health Check et des Metrics sont vraiment bien intégrés et facile à mettre en oeuvre
- il est facile de rajouter la gestion de token JWT et la liaison avec KeyCloak
- la communauté semble très active

Je vous encourage donc vivement à vous pencher sérieusement sur Quarkus !