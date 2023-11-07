---
layout: post
title: Gradle-Travis_CI-GitHub
subtitle: Automatiser les builds avec Travis CI et GitHub
logo: java.png
category: JAVA
tags: [Java, Craftsmanship]
---

<div class="intro" markdown='1'>

A écrire

</div>
<!--excerpt-->

## Pré-requis

- gem
- java runtime

## Build JAR en fonction version TAG GIT

avec le pluging gradle : [https://github.com/palantir/gradle-git-version]

source : [https://98elements.com/blog/automatic-versioning-of-java-applications-using-git-version-gradle-plugin/]

## Générer TOKEN GitHub

## Installer TRAVIS CLI

```
$ gem install travis
```

## Encrypter le TOKEN

```
$ travis encrypt --add --repo GitHubAccount/RepoName GITHUB_TOKEN=GitHubToken
```