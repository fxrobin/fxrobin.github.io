---
layout: post
title: Testing CDI 2.0 DeltaSpike Data in Java EE 8
subtitle: with Payara 5 Embedded, Arquillian and JUnit 5
logo: delta-spike-payara.png
category: JAVAEE
tags: [JavaEE, Payara, Arquillian, JUnit 5]
---

<div class="intro" markdown='1'>
L'objectif de ce post est de présenter la mise en oeuvre de tests unitaires
JUnit 5 de DeltaSpike Data dans un environnement embarqué Payara 5 avec Arquillian
</div>
<!--excerpt-->


## The problem

Here are the main caracteristics of the Java EE 7 plateform
* Managed environment, containing CDI, EJB, JPA implementations
* proxified transactional EJBs, addressing both model and service layer through entities and stateless EJB.
* Pooled JDBC Connections, managed by the application server

In the other hand, here are the caracteristics of a JUnit environment
* running on Java Standard Edition
* no managed transaction
* no connection pool

# The solution

* Embedded AppServer will be launched by JUnit : Payara Embedded
* Setting up a connection pool within the AppServer :
* Embedding a Database Server : using H2 Database
* Setting up JPA to use the connection POOL

> A JUnit test case must be easy to create and must be able to use @Inject for CDI bean and EJB injections.

# Putting all together with Arquillian

Arquillian will :
* serve as a bridge between the AppServer and the JUnit test using `@RunWith`
* setup the AppServer : JNDI JDBC Ressource and Connection Pool
* allow to use `@Inject` into the JUnit test case.
* deploy only needed classes and packages and jars thanx to a `ShrinkWrap`

# The tested application

* using the Web Profile packaging : EJB Lite are enough, no EAR composed by EJB-JAR and WAR modules
* using Lombok for simplifying classes boilerplate
* using one JPA Entity Only
* using one CRUD Service using DeltaSpike Data `@Repository`

# Architecture details

* JUnit 4 + Surefire + configuration
* Arquillian + arquillian.xml
* JUnit container
* Payara embedded container
* Embbeded "in-memory" H2 
* JPA : persistence.xml for testing purpose only
* fine Logging (Surefire)

# The pom.xml



## TOMCAT 9, paramétrage

## Définition du backend REST

## Implémentation du backend avec JAX-RS

## Implémentation du backend avec NodeJS

## Test et mesures de performances

## Conclusion


