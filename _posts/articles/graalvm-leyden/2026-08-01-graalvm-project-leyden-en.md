---
layout: post
title: "GraalVM vs Project Leyden: two weapons for the same enemy"
subtitle: "Slow startup, endless warmup... the JVM finally has concrete answers"
logo: graal.png
category: articles
tags: [Java, GraalVM, JVM, Performance, Leyden, Native Image, Startup, JDK 26]
lang: en
ref: graalvm-project-leyden
permalink: /en/graalvm-project-leyden/
---

<div class="intro" markdown='1'>
Your Quarkus application starts in 1.8 seconds. That's already fast. But in a Kubernetes world, where pods scale up and down constantly, 1.8 seconds is **an eternity**. Every startup burns CPU, leaves requests waiting, and stresses the *autoscaler*.

On the demo that accompanies this article (Quarkus 3.38.2, 105 games, PostgreSQL on a persistent Docker volume, JDK 25 Corretto 25.0.3), we measure **~1.8 s without cache** vs **~0.41 s with the Leyden AOT cache**: **-77%** without changing a single line of code. And with GraalVM native, it drops to **~10 ms**.

Two approaches now exist to solve the JVM warmup problem. Two philosophies, two trade-offs. One is mature and radical (GraalVM Native Image). The other is pragmatic and on the rise (Project Leyden). This article helps you choose which one to use, and when - with real numbers from the demo to back it up.
</div>

<!--excerpt-->

## The problem: why the JVM is slow to start

The JVM is a fantastic virtual machine. It analyzes your code as it runs, optimizes hot paths, does *speculative optimization*... and reaches peak performance beyond what a static compiler can deliver. The problem is getting there.

At startup, a classic Java application makes the JVM do all of this **at once**:

- It scans hundreds of JAR files on disk, reads and parses thousands of `.class` files
- It loads classes into memory, links them together (*linking*), verifies bytecodes
- It executes static initializers (`static { ... }`), which may create objects, open log files...
- If you use a framework like Spring or Quarkus, it gets worse: the framework scans annotations, creates the CDI context, initializes beans...

All of this happens **on demand**, lazily, just-in-time. It is optimized, yes. But it is a lot of work. And that work is repeated **on every startup**. Spring PetClinic, for example, loads and links about 21,000 classes at startup. On a classic JDK 23, it takes 4.5 seconds.

In a world where applications run in containers, where *autoscaling* is the norm, where *serverless* is billed by the millisecond, this warmup is a real operational problem.

## GraalVM Native Image: the radical solution

### The principle

GraalVM takes a frontal approach: **compile your Java application into a native binary** before running it. No more classic JVM. The AOT (*Ahead-Of-Time*) compiler analyzes all your code, resolves dependencies, eliminates dead code, and produces a standalone executable.

The result is spectacular:

- Startup in **a few milliseconds**
- Reduced memory footprint (50-100 MB instead of 300+ MB)
- Ideal for containers, serverless, CLIs

### The constraints

But that radical approach has a cost. The GraalVM AOT compiler must **know everything** up front. Yet Java is a dynamic language by nature: reflection, dynamic class loading, proxies, serialization... Anything that escapes static analysis is a problem.

In practice, you must manually declare reflection usage in configuration files (`reflect-config.json`, `resource-config.json`, etc.). Frameworks like Quarkus do it automatically for their own classes, but your third-party libraries? That is on you.

Other notable limitations:

- **Long build**: AOT compilation can take tens of minutes on large projects
- **Hard debugging**: no classic JFR, no `jcmd`, no standard profiling
- **Serialization**: partial support, often requires manual configuration
- **Dynamic agents**: JVMTI agents that rewrite classes do not work

GraalVM is a binary choice: you accept these constraints, or you stay away. There is no middle ground.

## Project Leyden: the pragmatic approach

### The principle

Project Leyden, incubated in OpenJDK since 2022, takes a different philosophy: **do not replace the JVM, accelerate it**. Rather than compiling all code ahead of time, Leyden shifts the costly startup work in time.

The idea is simple: you run your application once (*training run*), and the JVM records optimization artifacts in a cache file. Subsequent startups reuse that cache and start much faster.

### What has shipped (JDK 24, 25, 26)

Leyden has delivered four JEPs, each adding a brick to that strategy:

**JEP 483 - AOT Class Loading & Linking (JDK 24)**

The foundation. During the *training run*, the JVM reads, parses, loads and links all classes used by the application, then stores the result in an AOT cache. On the next startup, classes are **instantly available**: no more JAR scanning, no more parsing, no more bytecode verification.

The numbers speak for themselves:

- Spring PetClinic: from 4.486 s to 2.604 s (42% gain)
- A simple `HelloStream` using Streams: from 31 ms to 18 ms (42% gain)

The AOT cache takes 130 MB for PetClinic, 11 MB for the simple program. That is space, but a one-time cost.

On the Quarkus demo that accompanies this article (pure Java measurement, persistent PostgreSQL excluded from measurement via `docker-compose.yml` + `init-db.sh`):

| | Without AOT cache | With Leyden AOT cache | Gain |
|---|---|---|---|
| Run 1 | 1.518 s | 0.317 s | -79% |
| Run 2 | 2.644 s | 0.608 s | -77% |
| Run 3 | 1.219 s | 0.320 s | -74% |
| **Average** | **~1.8 s** | **~0.41 s** | **~77%** |
| Generated file | - | `app.aot` ~59 MB (`type=aot`) | - |
| AppCDS variant | - | `app-cds.jsa` ~40 MB (`type=app-cds`, flag `-XX:SharedArchiveFile`) | - |

`app.aot` and `app-cds.jsa` are never produced together: `quarkus.package.jar.aot.type` defaults to `auto` and `auto` is decided from the **bytecode target version** (`maven.compiler.release=21` in `pom.xml`), not from the JDK running the build. With `release=21`, `auto` falls back to AppCDS even under JDK 25.

**JEP 514 - AOT Command-Line Ergonomics (JDK 25)**

This JEP simplifies the command line to create and use the AOT cache. Before, you had to manipulate historical CDS options (`-Xshare`, `-XX:SharedArchiveFile`, etc.). Now everything goes through consistent, readable `-XX:AOT*` options. It is just ergonomics, but it matters for adoption.

**JEP 515 - AOT Method Profiling (JDK 25)**

Where JEP 483 accelerates startup, JEP 515 accelerates **warmup**. During the *training run*, the JVM collects method execution profiles (which methods are hot, which types are encountered) and stores them in the cache.

On the next startup, the JIT compiler immediately has those profiles and can **compile hot methods right away**, without waiting for the usual collection period. The application reaches its peak performance much faster.

On an example using Streams (900 classes loaded, 30 hot methods), the gain is 19% on total execution time, for only 250 KB of extra profiles in the cache.

**JEP 516 - AOT Object Caching with Any GC (JDK 26)**

The latest JEP (planned for JDK 26, already in EA builds) solves a concrete problem: before JDK 26, the AOT cache was incompatible with ZGC (*Z Garbage Collector*). You had to choose between low GC latency (ZGC) and fast startup (AOT cache). Not both.

JEP 516 changes that by storing Java objects from the cache in a **GC-agnostic** format: logical indices instead of memory addresses. A background thread materializes those objects at startup, in parallel with application execution. Result: ZGC and the AOT cache work together with no compromise. The demo does not enable ZGC (G1 by default), so this is a prospective gain at this stage.

### Command in practice (vanilla JDK)

The vanilla Leyden workflow takes three steps:

```bash
# Step 1: training run (records configuration)
java -XX:AOTMode=record -XX:AOTConfiguration=app.aotconf \
     -cp app.jar com.example.App

# Step 2: cache creation
java -XX:AOTMode=create -XX:AOTConfiguration=app.aotconf \
     -XX:AOTCache=app.aot -cp app.jar

# Step 3: production use
java -XX:AOTCache=app.aot -cp app.jar com.example.App
```

No application code change. It is standard `java` with extra options. With Quarkus, these three steps are encapsulated by the Maven plugin (see Quarkus section below): no need to write them by hand.

### What is still to come

Work is not finished. The last missing JEP is **AOT Code Compilation**: compiling hot methods to native code ahead of time, like GraalVM does but while staying inside the JVM. That would be the cherry on top: near-instant startup with the JVM's peak performance.

Other improvements are planned: better handling of custom *class loaders*, a simplified one-step workflow (instead of record + create), and training data collection during production runs.

## GraalVM vs Leyden: the comparison

| Criterion | GraalVM Native Image | Project Leyden (demo Quarkus 3.38.2) |
|---------|---------------------|----------------|
| **Startup** | ~10 ms | **~0.41 s** measured (-77% vs ~1.8 s without cache); ~500 ms generic |
| **Memory footprint** | 50-100 MB | Standard JVM (~200-300 MB) + cache ~59 MB (`app.aot`) or ~40 MB (`app-cds.jsa`) |
| **Warmup** | Instant (no JIT) | Accelerated (AOT profiles JEP 515) |
| **Peak performance** | Lower (no adaptive JIT) | Identical to the JVM |
| **Reflection / proxies** | Manual configuration | Transparent |
| **Debugging / JFR** | Limited | Standard JVM |
| **Build time** | Long (minutes) | Standard + 1 training run |
| **Compatibility** | Subset of Java | 100% Java |
| **GC** | SubstrateVM (internal GC) | All JDK GCs (ZGC since JDK 26 EA, G1 measured in demo) |
| **Maturity** | Production (since 2019) | JEP 483/514/515 delivered (JDK 24-25), JEP 516 EA (JDK 26) |

In short:

- **GraalVM** is the right choice when ultra-fast startup is critical (serverless, CLI, *scale-to-zero*) and you accept the compatibility constraints.
- **Leyden** is the right choice when you want significantly faster startup **without changing anything** in your application, while keeping the full power of the JVM.

The two are not mutually exclusive. You can imagine a world where Leyden accelerates the standard JVM's startup, and GraalVM remains for extreme cases.

## Quarkus and the two approaches

Quarkus is the framework that best illustrates this duality. From day one, Quarkus bet on GraalVM for *native compilation*. And since Quarkus 3.38+ (March 2026), it also integrates Project Leyden natively via build configuration. The demo uses Quarkus 3.38.2 (`pom.xml`), bytecode `release=21`, runtime JDK 25 Corretto 25.0.3.

Concretely, with Quarkus:

- **Native mode** (`-Dquarkus.native.enabled=true`): Quarkus uses GraalVM (or Mandrel) to produce a native binary. Startup in ~10 ms, footprint ~50 MB. The *serverless* mode par excellence.
- **JVM + Leyden AOT cache** (`-Dquarkus.package.jar.aot.enabled=true`): Quarkus produces an AOT cache. Depending on `quarkus.package.jar.aot.type`, you get **either** `app.aot` (Leyden, flag `-XX:AOTCache=app.aot`) **or** `app-cds.jsa` (AppCDS, flag `-XX:SharedArchiveFile=app-cds.jsa`). With `release=21`, `type=auto` (default) falls back to AppCDS even under JDK 25 - you must force `type=aot` to get the real Leyden cache. At startup with the `prod` profile: `java -XX:AOTCache=app.aot -Dquarkus.profile=prod -jar quarkus-run.jar`.
- **Classic JVM mode**: the default, without startup optimization.

The strength of the Quarkus integration is the **integrated training run**. Two options:

- `quarkus.package.jar.aot.phase=build` (recommended, used in demo): self-contained training, no need for integration tests, compatible with `-DskipTests`.
- `phase=integration-tests`: the `@QuarkusIntegrationTest` (`GreetingResourceIT`, `RetroGamingResourceIT`) serve as workload and the cache is generated during `mvn verify -DskipITs=false`.

The demo isolates pure Java startup time: PostgreSQL lives in a persistent Docker volume (`docker-compose.yml`), initialized once by `init-db.sh` (manual creation of Panache `*_SEQ` sequences), and the `prod` profile (`application-prod.properties`, `quarkus.hibernate-orm.database.generation=update`) only validates the existing schema.

```bash
# 1. Persistent PostgreSQL + one-time init
docker compose up -d
./init-db.sh  # no-op if tables already exist

# 2. Build + self-contained training + AOT cache generation (JDK 25 required)
JAVA_HOME=$HOME/.sdkman/candidates/java/25.0.3-amzn \
  ./mvnw verify -DskipTests \
  -Dquarkus.package.jar.aot.enabled=true \
  -Dquarkus.package.jar.aot.type=aot \
  -Dquarkus.package.jar.aot.phase=build

# 3. Production startup with the cache (from target/quarkus-app)
cd target/quarkus-app
java -XX:AOTCache=app.aot -Dquarkus.profile=prod -jar quarkus-run.jar
# AppCDS variant if type=app-cds: java -XX:SharedArchiveFile=app-cds.jsa -Dquarkus.profile=prod -jar quarkus-run.jar

# 4. Automated benchmark (detects app.aot vs app-cds.jsa)
# ../gatling-leyden/benchmark.sh  # Normal vs AOT, startup table + Gatling
```

Note: the current JVM image `src/main/docker/Dockerfile.jvm` (symlink to `Dockerfile.jvm-hardened`, Corretto 25 jlink on `amazonlinux:2023-minimal`, 0 CVE, 252 MB) does **not** contain the AOT cache - it copies `lib/`, `*.jar`, `app/` and `quarkus/` but not `app.aot`. To embed the cache, add `COPY target/quarkus-app/app.aot /deployments/app.aot` and adjust the `ENTRYPOINT`.

The choice depends on your context:

- You deploy on AWS Lambda, Azure Functions, or a *scale-to-zero* setup? -> **GraalVM native**
- You deploy on Kubernetes with pods scaling up and down frequently? -> **Leyden AOT cache** (via `quarkus.package.jar.aot.enabled=true`)
- You have an application that has been running continuously for weeks? -> **Classic JVM mode** (warmup is not an issue)

## Recommendations (finally...)

Here are the golden rules I take away after following the evolution of these two technologies:

**Start with Leyden.** If you are on JDK 24 or later, the AOT cache is the simplest solution. With Quarkus 3.38+, it is even simpler: `quarkus.package.jar.aot.enabled=true` + `type=aot` + `phase=build` (or `phase=integration-tests` if you prefer ITs), run under JDK 25, and start with `-XX:AOTCache=app.aot -Dquarkus.profile=prod`. Watch out for the `maven.compiler.release=21` trap: `type=auto` falls back to AppCDS (`app-cds.jsa`, `-XX:SharedArchiveFile`) even under JDK 25.

**Switch to GraalVM if Leyden is not enough.** If you need millisecond startups (serverless, CLI) and your application works within GraalVM's constraints, then *native image* is the right choice.

**Do not choose GraalVM by default.** It is tempting (the startup numbers are impressive), but the constraints are real. How many projects have abandoned *native* due to reflection, serialization, or impossible debugging? Many.

**Watch JDK 27.** AOT Code Compilation, when it arrives, could be a game changer. If Leyden can compile hot methods ahead of time, the gap with GraalVM will shrink significantly.

## In conclusion

GraalVM and Project Leyden solve the same problem: JVM warmup. But they attack it from different ends. GraalVM eliminates the JVM. Leyden accelerates it from within.

For most Java applications in production today, **Leyden is the pragmatic path**. No code change, no compatibility constraints, and significant startup gains. GraalVM remains the champion of ultra-fast startup, but at the cost of reduced compatibility.

In a future post, we will talk about Structured Concurrency, the third pillar of the Project Loom trilogy. Because starting fast is good. But executing correctly in parallel is even better.

**Feel free to share your feedback and your use cases in the comments.**
