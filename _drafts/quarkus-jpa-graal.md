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

Ce tutorial Quarkus-JPA-PostgreSQL met en oeuvre :

- une API Rest partielle (GET) avec JAX-RS et Quarkus sur une source de données JPA
- des tests unitaires
- des tests d'intégration au niveau API (http) avec un PostGreSQL lancé par un plugin maven Docker.
- une distribution native, compilée avec Graal VM et une image docker de l'application compilée

> Réalisé sous Linux Mint 19 mais devrait convenir à de nombreuses distributions, voire à Windows.

</div>
<!--excerpt-->

## Choix techniques

L'objectif de cet article est de faire tourner une API REST avec Quarkus fonctionnant avec :

- JAX-RS 2 : Avec RESTEasy
- CDI 2 : avec l'implémentation interne partielle de QUARKUS.
- JPA 2 : avec Hibernate
- Bean Validation : avev Hibernate Validator

On équipera le projet de diverses bibliothèques pour accéler le développement

- Spring Data JPA : pour ses `Repository` CRUD JPA
- Lombok : pour réduire le *boiler plate*. ([> Voir mon article sur Lombok](/Lombok-Oui-Mais))
- Commons Lang : car on a toujours besoin de son meilleur ami Commons Lang.

<< A COMPLETER >>

Le projet au complet est diponible sur GitHub : {%include github.html repository="fxrobin/quarkus-tuto" %}

## Structure globale du projet

Avant de commencer à entrer dans le détail des divers éléments, voici la structure du projet Maven :

{:.preformatted}
[quarkus-tuto]
├── src
│   ├── main
│   │   ├── java
│   │   │   └── fr
│   │   │       └── fxjavadevblog
│   │   │           └── qjg
│   │   │               ├── ping
│   │   │               │   └── PingService.java
│   │   │               ├── utils
│   │   │               │   ├── InjectUUID.java
│   │   │               │   └── UUIDProducer.java
│   │   │               └── videogame
│   │   │                   ├── Genre.java
│   │   │                   ├── VideoGame.java
│   │   │                   ├── VideoGameFactory.java
│   │   │                   ├── VideoGameRepository.java
│   │   │                   └── VideoGameResource.java
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
│   │   │                   └── DummyTest.java
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
└── pom.xml


La structure du projet de décompose ainsi :

- `src/main` : contient les sources JAVA `main/java` et les ressources pour Quarkus `main\resources` : `application.properties` et `import.sql`.
- `src/test` : contient les tests unitaires `test/java` et les ressources pour les tests unitaires sans base de données PostgreSQL `test\resources`
- `src/test-integration` : contient les tests d'intégration `test-integration/java` et les ressources pour les tests unitaires avec PostgreSQL `test-integration\resources`

La partie JAVA se décompose en 3 packages :

{:.preformatted}
fxjavadevblog
└── qjg
    ├── ping
    │   └── PingService.java             : pour vérifier que JAX-RS est bien opérationnel
    ├── utils
    │   ├── InjectUUID.java              : annotation pour injecter des UUID sous forme de String
    │   └── UUIDProducer.java            : générateur de UUID
    └── videogame
        ├── Genre.java                : enum qui contient tous les genres de jeux vidéo
        ├── VideoGameFactory.java     : factory de création de VideoGame via CDI
        ├── VideoGame.java            : classe métier, persistante via JPA (Hibernate)
        ├── VideoGameRepository.java  : un repository CRUD JPA généré par Spring Data JP
        └── VideoGameResource.java    : le point d'accès REST via JAX-RS aux jeux vidéo.


La partie tests unitaires est consituée des éléments suivants :

{:.preformatted}
test
├── java
│   └── fr
│       └── fxjavadevblog
│           └── qjg
│               ├── global
│               │   └── TestingGroups.java   : définitions de contantes pour les groupes de tests JUnit 5
│               ├── ping
│               │   └── PingTest.java
│               └── utils
│                   ├── CDITest.java         : permet de vérifier que CDI est opérationnel.
│                   └── DummyTest.java       : un test vide
└── resources
    └── application.properties               : fichier de paramétrage de Quarkus spécifique pour les tests unitaires.

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

> Pour ce tutorial l'usage de Java 8 sera effectué.

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
    <artifactId>quarkus-resteasy-jsonb</artifactId>
</dependency>
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-hibernate-validator</artifactId>
</dependency>
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-jdbc-postgresql</artifactId>
</dependency>
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
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
- lancer les tests unitaires sans base de données.
- lancer notre base de données PostgreSQL avec docker pendant les tests d'intégration JUnit 5. On est ainsi à mi-chemin entre des tests unitaires et des tests d'intégration. Je préfère cette solution plutôt que de *mocker* les tests. Cela nécessite évidemment que docker soit installé sur l'environnement.

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

Et enfin, pour atteindre le Graal du code Java compilé en binaire natif, il nous faut rajouter un petit profile MAVEN :

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

Pour que vérifier que tout va bien, on va faire un simple endpoint HTTP Rest avec JAX-RS qui va répondre à `/api/ping/v1`.

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


Quakus se lance en très peu de temps déjà, en mode JVM classique pourtant. 

On peut tester le service manuellement :

```bash
$ curl http://localhost:8080/api/ping/v1
pong
```

Si on modifie le code java et qu'on le sauvegarde, il se recompile automatiquement grâce au mode **dev** de de quarkus.
Par exemple : on change le `return "pong";` par `return PONG;` et on sauvegarde le fichier.

```bash
$ curl http://localhost:8080/api/ping/v1
PONG
```

C'est vraiment très pratique ce *live reload* !

> Attention avec Lombok toutefois, Quarkus ne semble pas relancer l'annotation processor et donc il ne génère pas le bytecode de Lombok.
> Lien vers cette anomalie : <https://github.com/quarkusio/quarkus/issues/4224>

## Compilation en binaire avec GraalVM

En pré-requis, il faut d'assurer que GraalVM est bien installé. Je vous conseille d'utilser SDKMAN pour cela. SDKMAN est une plateforme pour gérer plusieurs outils de développement présents sur votre poste en plusieurs versions et vous permet de les activer simplement et rapidement, même le temps d'une session shell.

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

Il suffit de lancer maven avec le profile *native* qui est présent de le pom XML.
C'est un peu long, c'est normal, mais le résultat en vaut la chandelle.

```bash
$ mvn package -Pnative
...
...
... (vous pouvez allez  vous aérer la compilation est assez longue ...)
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

Dans la configuration MAVEN on a paramétré une image Docker de PostgreSQL 12 qui se lance pendant la phase de tests.

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

# DEV with PostgreSQL
%dev.quarkus.datasource.db-kind=postgresql
%dev.quarkus.datasource.jdbc.url=jdbc:postgresql:quarkus_tuto
%dev.quarkus.datasource.username=quarkus_tuto
%dev.quarkus.datasource.password=quarkus_tuto
%dev.quarkus.datasource.jdbc.max-size=8
%dev.us.datasource.jdbc.min-size=2
%dev.quarkus.hibernate-orm.log.sql=true
%dev.quarkus.hibernate-orm.database.generation=drop-and-create
%dev.quarkus.hibernate-orm.sql-load-script=import.sql

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
> C'est une très bonne pratique, cependant dans le cadre de ce tutoriel où les données ne persistent pas, je force même en mode 
> `prod` la création de la base de données et l'import du script SQL.
> Dans le fichier ci-dessus, ce sont les ligne `%prod.*` qui s'activent en production AUSSI.
> Je le redis : à ne pas faire dans un vrai projet !

Pour les tests unitaires et les tests d'intégration, nous auront deux autres fichiers `application.properties` différents.

## Des entités à persister

Bien évidemment, il nous faut au moins une classe persistente. J'ai repris ici des exemples d'un précédent article :

- VideoGame : classe persistante JPA
- Genre : une enum JAVA persistée sous forme de String
- Producers : des producers CDI pour les UUID qui serviront de `@Id` dans la classe persistance comme clé primaire.
- VideoGameReposity : le CRUD issu de Spring Data JPA
- VideoGameFactory : de quoi créer des instances de la classe VideoGame en bénéficiant de l'injection automatique de UUID.

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

import fr.fxjavadevblog.qjg.utils.InjectedUUID;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@SuppressWarnings("serial")
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
    String id;

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
   ARCADE, EDUCATION, FIGHTING, PINBALL, PLATEFORM, REFLEXION, RPG, SHOOT_THEM_UP, SIMULATION, SPORT;
}
```

### Producers CDI et annotation

L'annotation `@InjectedUUID` qui est utilisée sur la classe `VideoGame`.

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
    @InjectedUUID
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

import org.apache.commons.lang3.StringUtils;

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
            Genre realGenre = Genre.valueOf(StringUtils.replace(genre, "-", "_").toUpperCase());
            return videoGameRepository.findByGenre(realGenre);
        }
        catch (java.lang.IllegalArgumentException e)
        {
            throw new BadRequestException("Genre " + genre + "does not exist.");
        }
    }
}
```