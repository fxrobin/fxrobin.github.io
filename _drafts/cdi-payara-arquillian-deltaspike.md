---
layout: post
title: Testing CDI 2.0 DeltaSpike Data in Java EE 8
subtitle: with Payara 5 Embedded, Arquillian and JUnit 5
logo: delta-spike-payara.png
category: JAVAEE
tags: [JavaEE, Payara, Arquillian, JUnit 5]
---


<div class="intro" markdown='1'>
The main goal of this article is to present the using of JUnit 5 tests with DeltaSpike inside an embedded Payara Server 5 through Arquillian.
</div>
<!--excerpt-->


## The problem

Here are the main caracteristics of the Java EE 7 plateform :

* Managed environment, containing CDI, EJB, JPA implementations
* proxified transactional EJBs, addressing both model and service layer through entities and stateless EJB.
* Pooled JDBC Connections, managed by the application server

In the other hand, here are the caracteristics of a standard JUnit environment :

* running on Java Standard Edition
* no managed transaction
* no connection pool

## The solution

To cover the needs, we will setup a test environment using those components and services : 

* Embedded AppServer will be launched by JUnit : Payara Embedded
* Setting up a connection pool within the AppServer :
* Embedding a Database Server : using H2 Database
* Setting up JPA to use the connection POOL

## Unit testing thoughs

Here is my opinion about unit testing Java EE artefacts :

* A JUnit test case must be easy to create and must be able to use @Inject for CDI bean and EJB injections. It must be run as seamlessly as possible without the need of creating specific testing artefacts. 

* Close mocking isn't a good pattern for testing**. Abusing of mockito, for example, makes tests not so real. For example, if you want to be sure about your JPA annotations regarding association mappings, you cannot by-pass a database check

# Putting all together with Arquillian

Arquillian will :

* serve as a bridge between the AppServer and the JUnit test using `@RunWith`
* setup the AppServer : JNDI JDBC Ressource and Connection Pool
* allow to use `@Inject` into the JUnit test case.
* deploy only needed classes and packages and jars thanx to a `ShrinkWrap`

# The tested application

The example Java EE application will use the following :

* Web Profile packaging : EJB Lite are enough, no EAR composed by EJB-JAR and WAR modules
* Lombok for simplifying classes boilerplate
* a single JPA Entity
* a single CRUD Service thanks to DeltaSpike Data `@Repository`

# Architecture details

Here are the details of what would be link together in order to run the tests :

* JUnit 4 + Surefire + configuration
* Arquillian + arquillian.xml
* JUnit container
* Payara embedded container
* Embbeded "in-memory" H2 
* JPA : persistence.xml for testing purpose only
* fine Logging (Surefire)

# The pom.xml


## Conclusion


