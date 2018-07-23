---
layout: page
title: Blanka Cave
subtitle:  Quand Blanka pas content, Blanka écrire ici
logo: blanka.png
category: blanka
---

<div class="intro" markdown='1'>
J'héberge à titre gracieux sur ce site tous les billets d'humeur de Blanka. Le connaissant depuis de nombreuses années et connaissant aussi à quel point il peut s'énerver facilement, je n'ai pas refusé quand il m'a envoyé le mail suivant :

```
from blanka@streetfighters.cap.com
to fx@fxjavadevblog.fr
 
Blanka t'avoir souvent écraser crâne, mais toi vieil ami,
Blanka vouloir espace internet, Blanka vouloir dire rage,
Blanka connaitre Markdown, Markdown ami Blanka aussi.
Blanka attendre reponse rapide, sinon Blanka te casser crâne

Blanka ami.
```

J'étais ravi d'avoir de ses nouvelles. Visiblement, il va bien et il a du succès aussi bien professionnellement que personnellement. Cela fait plaisir.

Devant cet élan d'amitié, je ne pouvais donc pas refuser, les sections suivantes contiennent les articles de mon ami Blanka.

> Cela étant, je ne suis pas responsable du nombre de trolls lancés par Blanka ...
</div>
<!--excerpt-->

## Reactive Programming

Blanka pas content encoRRREEEEE !

Blanka trouver que "reactive programming" buzzword pour pattern `Observer/Observable` connu depuis 1994 !

Blanka pas aimer Buzzwords !

## GWT, AngularJS, GoogleMaps, Kotlin

Blanka pas aimer quand Google rien avoir à faire des développeurs. Google casser API, Google arrêter API, Google faire payer API quand Google dire gratuit.

Blanka lister Google bad-habits :

* Google abandonner GWT -> Google créer GWT2
* Google abandonner GWT2 -> Google créér AngularJS
* Google abandonner AngularJS -> Google créer Angular2
* Google donner GoogleMaps -> Google faire payer GoogleMaps
* Google procès Java JVM -> Google encourager JavaScript (EcmaScript)
* Google procès Java API -> Google encourager Kotlin

## Web Components

Blanka pas content du tout quand Blanka obligé écrire JavaScript + CSS + HTML dans même fichier !

Blanka trouve programmation gros crado :

```javascript
<script src="node_modules/@webcomponents/webcomponents-bundle.js"></script>
  <script type="module">
    import {LitElement, html} from '@polymer/lit-element';

    class MyElement extends LitElement {

      static get properties() { return { mood: String }}

      _render({mood}) {
        return html`<style> .mood { color: green; } </style>
          Web Components are <span class="mood">${mood}</span>!`;
      }

    }

    customElements.define('my-element', MyElement);
  </script>

  <my-element mood="happy"></my-element>
  ```

## Angular 2 et + / AngularJS

Blanka chercher documentation sur Angular 2+ !!! Google retourner trop exemples AngularJS inutiles !!!

ARRRRRRRGGGGGH !

Google devoir proposer meilleure recherche pour Angular 2+ !

## XML / JSON

RGGGGHHHH ! Gens pas aimer XML, Gens préférer JSON + HTML ...

HTML être XML aussi ... (quand HTML bien écrit)

Gens créer tags avec Angular ou Web Components ... Tags XML ...

Gens bizarres ...

Gens aimer HTTP aussi pour applications ... Gens trop bizarres

## EJB / Nothing

RGHHHH ! Gens pas aimer EJB et AppServers Java EE ...

Gens préférer TOMCAT Leger ...

Leger + Spring IoC + Spring Data + Hibernate + Spring REST = PAS LEGER !

Blanka préferer Thin Java EE War + MicroAppServer (Payara Micro)

Gens préférer TOMCAT car TOMCAT mouliner JSP ? TOMCAT pas léger non plus.