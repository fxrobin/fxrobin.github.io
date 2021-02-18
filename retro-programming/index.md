---
layout: page-no-aside
title: Retro-Programming Atari / Thomson
subtitle:  Ensemble des articles liés à la programmation "Rétro" sur Atari ST, Thomson MO5 et TO8
logo: coding.gif
category: RETRO
lang: fr
ref: retro-programming
---

<div class="post">
<div class="entry">
<div class="intro" style="clear :both ; margin-top : 2em">
Bienvenue dans la partie la plus "Rétro" de ce site ! 
<br />
Ici, que de vieux trucs, mais avec quelques outils modernes ou presque.
</div>

{% assign posts = site.posts %}
<div id="left" style="margin : auto; width : 85%">
<div class="posts" style="margin-top : 4em;">
    {% for post in posts %}
    {% if post.tags contains 'Retro-Prog' %}
  
    <div style="margin-top: 2em; border-top : solid black 1px">
          <div style="float : right; margin-left : 2em; margin-top : 1em"> <a href="{{ site.baseurl }}{{ post.url }}" class="hvr-buzz-out">
                        <img src="{{ site.baseurl }}/images/logos/{{ post.logo }}" class="logo"	alt="{{ post.title }}" title="{{ post.title }}" />
                    </a></div>
        <div style="font-size : 2.5em; font-family : 'greenberet'; margin-top : 0.5em;"> <a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a></div>
        <div style="font-family : 'amiga'; margin-top : 0.5em">> {{ post.subtitle }}</div>
        <div>{{ post.excerpt }}</div>  
        <div class="read-more" style="text-align : right"><a href="{{ site.baseurl }}{{ post.url }}" >{{ site.t[page.lang].read_more }}</a></div>
    </div>      
    <div style="clear: both"></div>        
    {% endif %}
    {% endfor %}
</div>
</div>