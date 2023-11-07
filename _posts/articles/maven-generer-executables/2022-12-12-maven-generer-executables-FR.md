---
layout: post
title: 'Java: Générer des exécutables Windows, Linux et MacOS'
subtitle: Au profit d'un programme type "ligne de commande", avec Maven
logo: java.png
category: articles
tags: [Java, Maven, JAR, EXE, SH, LAUNCH4, maven-assembly]
lang: fr
ref: maven-generer-executables
permalink: /generer-executables-java-avec-maven
---



<div class="intro" markdown='1'>
Si comme moi tu en as assez de faire des programmes types "ligne de commande" en Java et d'être
obligé de les lancer avec ce genre de choses :
```bash
$ java -jar demo-app-v1.0.0-SNAPSHOT.jar arg1 arg2 arg3`
```
Ce petit article devrait te plaire.
Tu pourras alors faire directement ça :

```bash
$ ./demo-app arg1 arg2 arg3
```

Appétissant !

Dans ce petit tutoriel, je vais donc générer un exécutable :
- pour Linux et MacOSX, 
- pour Windows, un `.EXE`, 
- sous forme de *Runnable JAR*,  *classique*.

> Cela nécessite toutefois la présence d'un Runtime JAVA (JRE et/ou JDK) sur la machine qui l'exécutera, bien qu'il existe aussi des solutions pour embarquer un JRE.

> Les solutions, que je vais décrire, n'utilisent pas GRAALVM et sa compilation native.
</div>

<!--excerpt-->

## Le programme JAVA à transformer

Je vais faire très simple pour cet exemple, mais je vais utiliser la bibliothèque [PICOCLI](https://picocli.info/) pour faire quelque chose de rapide et (presque) propre.

> Si tu ne connais pas encore picocli, je t'encourage vivement à aller le découvrir rapidement !


Voic donc la "bête" : `fr.fxjavadevblog.mvngenexec.MainProg`
```java
package fr.fxjavadevblog.mvngenexec;

import java.util.concurrent.Callable;
import java.util.logging.Level;
import java.util.logging.Logger;

import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Parameters;

@Command(name = "demo-app", version = "1.0.0", 
         mixinStandardHelpOptions = true, 
         description = "Demo Command-line App written in Java with Picocli")
public final class MainProg implements Callable<Integer>
{
	private static Logger log;

	static
	{
		log = Logger.getLogger(MainProg.class.toString());
		System.setProperty("java.util.logging.SimpleFormatter.format", "[%1$tF %1$tT] [%4$-7s] %5$s %n");
	}

	@Parameters(index = "0..*")
	private String[] allArguments;

	@Override
	public Integer call() throws Exception
	{
		log.info("Running ...");
		if (allArguments != null && log.isLoggable(Level.INFO))
		{
			log.info("Arguments : " + String.join(",", allArguments));
		}
		log.info("Finished!");

		return 0;
	}

	private MainProg()
	{
		// protecting constructor
	}

	public static void main(String... args)
	{
		int exitCode = new CommandLine(new MainProg()).execute(args);
		System.exit(exitCode);
	}

}
```

Pour le moment, son `pom.xml` est assez succinct.

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<groupId>fr.fxjavadevblog</groupId>
	<artifactId>demo-app</artifactId>
	<version>0.0.1-SNAPSHOT</version>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<maven.compiler.target>11</maven.compiler.target>
		<maven.compiler.source>11</maven.compiler.source>
	</properties>

	<dependencies>
		<dependency>
			<groupId>info.picocli</groupId>
			<artifactId>picocli</artifactId>
			<version>4.7.0</version>
		</dependency>
	</dependencies>

</project>
```

## Transformation en JAR exécutable : rien de bien nouveau

Pour générer le JAR exécutable, je vais utiliser le plugin MAVEN `maven-shade-plugin`.

J'ajoute donc la configuration du plugin au `pom.xml` en indiquant quelle est la classe
qui sera le point d'entrée avec son `static void main(String... args)` :

```xml
<build>
	<plugins>
		<plugin>
			<groupId>org.apache.maven.plugins</groupId>
			<artifactId>maven-shade-plugin</artifactId>
			<version>3.4.1</version>
			<executions>
				<execution>
					<phase>package</phase>
					<goals>
						<goal>shade</goal>
					</goals>
					<configuration>
						<transformers>
							<transformer implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer" />
							<transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
								<mainClass>fr.fxjavadevblog.mvngenexec.MainProg</mainClass>
							</transformer>
						</transformers>	
						<filters>
							<filter>
								<artifact>*:*</artifact>
								<excludes>
									<exclude>module-info.class</exclude>
									<exclude>META-INF/*.MF</exclude>
									<exclude>META-INF/*.SF</exclude>
									<exclude>META-INF/*.DSA</exclude>
									<exclude>META-INF/*.RSA</exclude>
								</excludes>
							</filter>
						</filters>						
					</configuration>
				</execution>
			</executions>
		</plugin>
	</plugins>
</build>
```

Je lance la compilation et le packaging :

```bash

$ mvn package
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------< fr.fxjavadevblog:maven-generer-executables >-------------
[INFO] Building maven-generer-executables 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:2.6:resources (default-resources) @ maven-generer-executables ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.1:compile (default-compile) @ maven-generer-executables ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 1 source file to ./maven-gener-executables/target/classes
[INFO] 
[INFO] --- maven-resources-plugin:2.6:testResources (default-testResources) @ maven-generer-executables ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.1:testCompile (default-testCompile) @ maven-generer-executables ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-surefire-plugin:2.12.4:test (default-test) @ maven-generer-executables ---
[INFO] 
[INFO] --- maven-jar-plugin:2.4:jar (default-jar) @ maven-generer-executables ---
[INFO] Building jar: ./maven-gener-executables/target/maven-generer-executables-0.0.1-SNAPSHOT.jar
[INFO] 
[INFO] --- maven-shade-plugin:3.4.1:shade (default) @ maven-generer-executables ---
[INFO] Including info.picocli:picocli:jar:4.7.0 in the shaded jar.
[INFO] Dependency-reduced POM written at: ./maven-gener-executables/dependency-reduced-pom.xml
[INFO] Replacing original artifact with shaded artifact.
[INFO] Replacing ./maven-gener-executables/target/maven-generer-executables-0.0.1-SNAPSHOT.jar with ./maven-gener-executables/target/maven-generer-executables-0.0.1-SNAPSHOT-shaded.jar
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  1.525 s
[INFO] Finished at: 2022-12-12T16:14:17+01:00
[INFO] ------------------------------------------------------------------------
```

et je vérifie que j'arrive à lancer mon programme JAVA autonome, comme d'habitude :

```bash
$ java -jar ./target/maven-generer-executables-0.0.1-SNAPSHOT.jar arg1 arg2 arg3
[2022-12-12 16:16:16] [INFOS  ] Running ... 
[2022-12-12 16:16:16] [INFOS  ] Arguments : arg1,arg2,arg3 
[2022-12-12 16:16:16] [INFOS  ] Finished! 
```

Pour l'instant rien de neuf à l'horizon.C'est l'objet des prochains paragraphes.

## Génération de l'exécutable Linux et MacOSX

Pour générer l'exécutable pour Linux et MaxOSX je vais passer par le principe suivant : un fichier JAR peut contenir une partie exécutable en préambule, notamment un script shell. 

> C'est en réalité le même mécanisme qui est offert par le format ZIP et qui permet d'obtenir des fichiers ZIP auto-extractibles.

L'idée qui se cache derrière cette solution est donc d'avoir en début de fichier un script shell qui charge et lance le JAR qui est situé juste derrière lui (dans le même fichier). La technique est décrite ici : <https://skife.org/java/unix/2011/06/20/really_executable_jars.html>

Ce n'est pas une technique récente, mais elle n'est pas très connue. 

Fort heureusement, nous avons un plugin Maven pour nous aider dans cette tâche :

```xml
<plugin>
	<groupId>org.skife.maven</groupId>
	<artifactId>really-executable-jar-maven-plugin</artifactId>
	<version>1.5.0</version>
	<configuration>
		<flags>-Xmx1G</flags>
		<programFile>${project.artifactId}</programFile>
	</configuration>
	<executions>
		<execution>
			<phase>package</phase>
			<goals>
				<goal>really-executable-jar</goal>
			</goals>
		</execution>
	</executions>
</plugin>
```

Et je relance le packaging de l'application :

```bash
$ mvn package
[INFO] Scanning for projects...
[INFO] 
[INFO] ---------------------< fr.fxjavadevblog:demo-app >----------------------
[INFO] Building demo-app 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:2.6:resources (default-resources) @ demo-app ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.1:compile (default-compile) @ demo-app ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 1 source file to ./maven-gener-executables/target/classes
[INFO] 
[INFO] --- maven-resources-plugin:2.6:testResources (default-testResources) @ demo-app ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.1:testCompile (default-testCompile) @ demo-app ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-surefire-plugin:2.12.4:test (default-test) @ demo-app ---
[INFO] 
[INFO] --- maven-jar-plugin:2.4:jar (default-jar) @ demo-app ---
[INFO] Building jar: ./maven-gener-executables/target/demo-app-0.0.1-SNAPSHOT.jar
[INFO] 
[INFO] --- maven-shade-plugin:3.4.1:shade (default) @ demo-app ---
[INFO] Including info.picocli:picocli:jar:4.7.0 in the shaded jar.
[INFO] Replacing original artifact with shaded artifact.
[INFO] Replacing ./maven-gener-executables/target/demo-app-0.0.1-SNAPSHOT.jar with ./maven-gener-executables/target/demo-app-0.0.1-SNAPSHOT-shaded.jar
[INFO] 
[INFO] --- really-executable-jar-maven-plugin:1.5.0:really-executable-jar (default) @ demo-app ---
[INFO] Successfully made JAR [./maven-gener-executables/target/demo-app] executable
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  1.353 s
[INFO] Finished at: 2022-12-12T16:35:38+01:00
[INFO] ------------------------------------------------------------------------
```

J'obtiens un exécutable Linux et MacOSX dans le répertoire target :

```bash
$ ll target
total 848
drwxrwxr-x 7 robin robin   4096 déc.  12 16:35 ./
drwxrwxr-x 5 robin robin   4096 déc.  12 16:35 ../
drwxrwxr-x 3 robin robin   4096 déc.  12 16:35 classes/
-rwxrwxr-x 1 robin robin 416303 déc.  12 16:35 demo-app*
-rw-rw-r-- 1 robin robin 416259 déc.  12 16:35 demo-app-0.0.1-SNAPSHOT.jar
drwxrwxr-x 3 robin robin   4096 déc.  12 16:35 generated-sources/
drwxrwxr-x 2 robin robin   4096 déc.  12 16:35 maven-archiver/
drwxrwxr-x 3 robin robin   4096 déc.  12 16:35 maven-status/
-rw-rw-r-- 1 robin robin   3858 déc.  12 16:35 original-demo-app-0.0.1-SNAPSHOT.jar
drwxrwxr-x 2 robin robin   4096 déc.  12 16:35 test-classes/
```

Que je m'empresse de lancer pour voir s'il fonctionne :

```bash
$ ./target/demo-app arg1 arg2 arg3
[2022-12-12 16:37:41] [INFOS  ] Running ... 
[2022-12-12 16:37:41] [INFOS  ] Arguments : arg1,arg2,arg3 
[2022-12-12 16:37:41] [INFOS  ] Finished! 
```

Yes ! Pas eu besoin de faire le `$ java -jar ...` classique ! Très sympa. Cela nécessite tout du moins une JVM présente sur le système capable de lancer le programme, ce qui est, évidemment, mon cas.

Et ça fonctionne aussi tel quel sur MacOSX. Merci d'être un dérivé d'UNIX ! Tout comme sur RaspBerry, étant donné que ça reste du *script* et du Java : pas de code natif.

## Génération .EXE pour Windows

La solution du paragraphe précédent nécessite un environnement d'exécution de script (bash, sh, zsh, etc.).

Sous Windows on pourrait aussi l'utiliser tel quel avec Cygwin ou MinGW. Sous Windows 10 je pourrais même [activer un interpréteur BASH](https://people.montefiore.uliege.be/nvecoven/ci/files/tuto_bash/tuto_bash.html) au moyen d'un sous-système LINUX.

Mais je vais utiliser autre chose : Launch4J. Ce dernier va être capable de générer un `.EXE` même depuis mon Linux, et le tout avec un plugin Maven. Il faut juste un petit peu de configuration.

```xml
<plugin>
	<groupId>com.akathist.maven.plugins.launch4j</groupId>
	<artifactId>launch4j-maven-plugin</artifactId>
	<executions>
		<execution>
			<id>l4j-clui</id>
			<phase>package</phase>
			<goals>
				<goal>launch4j</goal>
			</goals>
				<configuration>
				<headerType>console</headerType>
				<jar>target/${project.artifactId}-${project.version}.jar</jar>
				<outfile>target/${project.artifactId}.exe</outfile>
				<classPath>
					<mainClass>fr.fxjavadevblog.mvngenexec.MainProg</mainClass>
				</classPath>
				<jre>
					<path>${JAVA_HOME}</path>
					<minVersion>11</minVersion>
				</jre>
				<versionInfo>
					<fileVersion>1.0.0.0</fileVersion>
					<txtFileVersion>1.0.0.0</txtFileVersion>
					<fileDescription>${project.name}</fileDescription>
					<copyright>C</copyright>
					<productVersion>1.0.0.0</productVersion>
					<txtProductVersion>1.0.0.0</txtProductVersion>
					<productName>${project.name}</productName>
					<internalName>${project.name}</internalName>
					<originalFilename>${project.artifactId}.exe</originalFilename>
				</versionInfo>
			</configuration>
		</execution>
	</executions>
</plugin>
```

Je déclenche la génération :

```bash
$ mvn package

...
[INFO] --- launch4j-maven-plugin:2.1.2:launch4j (l4j-clui) @ demo-app ---
[INFO] Platform-specific work directory already exists: /home/robin/.m2/repository/net/sf/launch4j/launch4j/3.14/launch4j-3.14-workdir-linux64
[INFO] launch4j: Compiling resources
[INFO] launch4j: Linking
[INFO] launch4j: Wrapping
WARNING: Sign the executable to minimize antivirus false positives or use launching instead of wrapping.
[INFO] launch4j: Successfully created ./maven-gener-executables/target/demo-app.exe
...
```

J'obtiens un *joli* fichier exécutable pour windows `demo-app.exe` :

```bash
$ ll target
total 1296
drwxrwxr-x 7 robin robin   4096 déc.  12 16:49 ./
drwxrwxr-x 5 robin robin   4096 déc.  12 16:47 ../
drwxrwxr-x 4 robin robin   4096 déc.  12 16:48 classes/
-rwxrwxr-x 1 robin robin 416733 déc.  12 16:48 demo-app*
-rw-rw-r-- 1 robin robin 416689 déc.  12 16:48 demo-app-0.0.1-SNAPSHOT.jar
-rwxrwxr-x 1 robin robin 453041 déc.  12 16:49 demo-app.exe*
drwxrwxr-x 3 robin robin   4096 déc.  12 16:47 generated-sources/
drwxrwxr-x 2 robin robin   4096 déc.  12 16:47 maven-archiver/
drwxrwxr-x 3 robin robin   4096 déc.  12 16:47 maven-status/
-rw-rw-r-- 1 robin robin   4288 déc.  12 16:48 original-demo-app-0.0.1-SNAPSHOT.jar
drwxrwxr-x 2 robin robin   4096 déc.  12 16:47 test-classes/
```

## The Icing Or Cherry On The Cake : ZIP des 3 exécutables

Petite digression pour les anglophiles non avertis, tels que moi, on peut dire aussi bien "[*Cherry on the cake*](https://dictionary.cambridge.org/dictionary/english/cherry-on-top-of-the-cake)" que "[*Icing on the cake*](https://dictionary.cambridge.org/dictionary/english/icing-on-the-cake)" pour dire "Cerise sur le gâteau" dans notre belle langue de Molière. Cependant cela semble être devenu plutôt péjoratif en français, comme pour accumuler un élement négatif à un ensemble déjà pas terrible. Ce n'est pas mon cas dans cet article, je vais donc conserver l'expression anglaise.

Je vais packager les 3 exécutables (Linux/MaxOS, Windows, Java) au sein d'un seul fichier ZIP pour pouvoir le "distribuer" à des utilisateurs, par exemple.

Pour ce faire, je vais utiliser le plugin `maven-assembly` avec un descripteur.

Le descripteur placé dans `./src/main/assembly/zip.xml` :
```xml
<assembly xmlns="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.2 http://maven.apache.org/xsd/assembly-1.1.2.xsd">
    <id>zip</id>
    <includeBaseDirectory>false</includeBaseDirectory>
    <formats>
        <format>zip</format>
    </formats>
    <files>
        <!--fichier JAR executable -->
        <file>
            <source>${project.build.directory}/${project.artifactId}-${project.version}.jar</source>
            <outputDirectory>/</outputDirectory>
        </file>
        <!--fichier EXE Windows -->
		<file>
            <source>${project.build.directory}/${project.artifactId}.exe</source>
            <outputDirectory>/</outputDirectory>
        </file>
        <!--fichier LINUX et MacOSX -->
		<file>
            <source>${project.build.directory}/${project.artifactId}</source>
            <outputDirectory>/</outputDirectory>
        </file>
    </files>
</assembly>
```

et la déclaration du plugin dans le `pom.xml` :

```xml
<plugin>
	<artifactId>maven-assembly-plugin</artifactId>
	<version>3.4.2</version>
	<configuration>
		<descriptors>
			<descriptor>src/main/assembly/zip.xml</descriptor>
		</descriptors>
		<finalName>${project.name}-${project.version}</finalName>
		<appendAssemblyId>false</appendAssemblyId>
	</configuration>
	<executions>
		<execution>
			<id>make-assembly</id> <!-- this is used for inheritance merges -->
			<phase>package</phase> <!-- bind to the packaging phase -->
			<goals>
				<goal>single</goal>
			</goals>
		</execution>
	</executions>
</plugin>
```

Je lance la création du package :

```bash
$ mvn package
...
[INFO] --- maven-assembly-plugin:3.4.2:single (make-assembly) @ demo-app ---
[INFO] Reading assembly descriptor: src/main/assembly/zip.xml
[INFO] Building zip: ./maven-gener-executables/pom.xml/target/demo-app-0.0.1-SNAPSHOT.zip
...
```

et j'obtiens ainsi un joli fichier ZIP dans `./target` :

```bash
$ ll target/*.zip
-rw-rw-r-- 1 robin robin 1174675 déc.  12 17:28 target/demo-app-0.0.1-SNAPSHOT.zip
```

Il contient bien mes exécutables :

```bash
$ unzip -v ./target/demo-app-0.0.1-SNAPSHOT.zip
Archive:  ./target/demo-app-0.0.1-SNAPSHOT.zip
 Length   Method    Size  Cmpr    Date    Time   CRC-32   Name
--------  ------  ------- ---- ---------- ----- --------  ----
  416684  Defl:N   385722   7% 2022-12-12 17:29 7d992b35  demo-app-0.0.1-SNAPSHOT.jar
  453036  Defl:N   402854  11% 2022-12-12 17:29 b876a4a6  demo-app.exe
  416728  Defl:N   385755   7% 2022-12-12 17:29 4bd62989  demo-app
--------          -------  ---                            -------
 1286448          1174331   9%                            3 files
```

## Conclusion

À Article simple, conclusion simple : c'est cool ! Non ?
Merci Maven et tous ses plugins !

Rien de plus à ajouter, merci d'avoir lu jusqu'ici !

