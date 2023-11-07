---
layout: post
title: Web Components
logo: blanka.png
category: blanka
lang: fr
sitemap: false
---

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