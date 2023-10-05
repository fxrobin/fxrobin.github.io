---
layout: post
title: 'Java: How to generate Windows, Linux and MacOS executables?'
subtitle: In favor of a "command line" type program, with Maven
logo: java.png
category: articles
tags: [Java, Maven, JAR, EXE, SH, LAUNCH4, maven-assembly]
lang: en
ref: maven-generer-executables
---



<div class="intro" markdown='1'>
If, like me, you are tired of making command line programs in Java and having to run them with this kind of things:
```bash
$ java -jar demo-app-v1.0.0-SNAPSHOT.jar arg1 arg2 arg3`
```
This little article should please you.
You will then be able to do this directly:

```bash
$ ./demo-app arg1 arg2 arg3
```

Appetizing!

In this little tutorial, I will generate an executable file :
- for Linux and MacOSX, 
- for Windows, an `.EXE`, 
- as a *classic Runnable JAR*.

> However, this requires the presence of a JAVA Runtime (JRE and/or JDK) on the machine that will run it, although there are also solutions to embed a JRE.

> The solutions I will describe do not use GRAALVM and its native compilation.
</div>

<!--excerpt-->

## The JAVA program to be transformed

I'm going to make it very simple for this example, using the [PICOCLI] library (https://picocli.info/) to make something fast and (almost) clean.

> If you don't know picocli yet, I strongly encourage you to discover it quickly !


Here is the "beast": `fr.fxjavadevblog.mvngenexec.MainProg`

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

For the moment, its `pom.xml` is quite succinct.

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

To generate the executable JAR, I will use the MAVEN plugin `maven-shade-plugin`.

So I add the plugin configuration to the `pom.xml` indicating which class
which will be the entry point with its `static void main(String... args)` :

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

I launch the compilation and the packaging:

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

and I check that I can run my standalone JAVA program, as usual:

```bash
$ java -jar ./target/maven-generer-executables-0.0.1-SNAPSHOT.jar arg1 arg2 arg3
[2022-12-12 16:16:16] [INFOS  ] Running ... 
[2022-12-12 16:16:16] [INFOS  ] Arguments : arg1,arg2,arg3 
[2022-12-12 16:16:16] [INFOS  ] Finished! 
```

For the moment, nothing new on the horizon, that's the subject of the next paragraphs.

## Generation of the Linux and MacOSX executable

To generate the executable for Linux and MaxOSX I will use the following principle: a JAR file can contain an executable part in preamble, in particular a shell script. 

> This is actually the same mechanism that is offered by the ZIP format and that allows to obtain self-extracting ZIP files.

The idea behind this solution is to have a shell script at the beginning of the file that loads and launches the JAR that is located just behind it (in the same file). The technique is described here: <https://skife.org/java/unix/2011/06/20/really_executable_jars.html>

This is not a recent technique, but it is not well known. 

Fortunately, we have a Maven plugin to help us with this task:

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

And I'm re-launching the application's packaging:

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

I get a Linux and MacOSX executable in the target directory:

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

That I hasten to launch to see if it works:

```bash
$ ./target/demo-app arg1 arg2 arg3
[2022-12-12 16:37:41] [INFOS  ] Running ... 
[2022-12-12 16:37:41] [INFOS  ] Arguments : arg1,arg2,arg3 
[2022-12-12 16:37:41] [INFOS  ] Finished! 
```

Yes ! No need to do the classic `$ java -jar ...` ! Very nice. It requires at least a JVM present on the system able to launch the program, which is, obviously, my case.

And it also works as is on MacOSX. Thanks for being a UNIX derivative! Just like on RaspBerry, since it's still *script* and Java: no native code.

## Generating .EXE for Windows

The solution of the previous paragraph requires a script execution environment (bash, sh, zsh, etc.).

On Windows one could also use it as is with Cygwin or MinGW. On Windows 10 I could even [enable a BASH interpreter](https://people.montefiore.uliege.be/nvecoven/ci/files/tuto_bash/tuto_bash.html) using a LINUX subsystem.

But I will use something else: Launch4J. It will be able to generate an `.EXE` even from my Linux, and all with a Maven plugin. It just needs a little bit of configuration.

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

I trigger the generation:

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

I get a *nice* executable file for windows `demo-app.exe` :

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

## The Icing Or Cherry On The Cake : ZIP of the 3 executables

I'm going to package the 3 executables (Linux/MaxOS, Windows, Java) in a single ZIP file to be able to "distribute" it to users, for example.

To do this, I will use the `maven-assembly` plugin with a descriptor.

The descriptor placed in `./src/main/assembly/zip.xml`:
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

and the declaration of the plugin in the `pom.xml`:

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

I launch the creation of the package:

```bash
$ mvn package
...
[INFO] --- maven-assembly-plugin:3.4.2:single (make-assembly) @ demo-app ---
[INFO] Reading assembly descriptor: src/main/assembly/zip.xml
[INFO] Building zip: ./maven-gener-executables/pom.xml/target/demo-app-0.0.1-SNAPSHOT.zip
...
```

and I get a nice ZIP file in `./target`:

```bash
$ ll target/*.zip
-rw-rw-r-- 1 robin robin 1174675 déc.  12 17:28 target/demo-app-0.0.1-SNAPSHOT.zip
```

It contains my executables:

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

A simple article, a simple conclusion: it's cool, isn't it?
Thank you Maven and all its plugins!

Nothing more to add, thanks for reading this far!

