---
layout: page-no-aside
title: Atari ST (re)-programming
subtitle:  Ensemble des articles liés à la programmation Atari ST
logo: coding.gif
category: Atari-ST
lang: fr
ref: st-programming
---


{% assign posts = site.posts %}
<div id="left">
<div class="posts" style="margin-top : 4em; width : 75%">
    {% for post in posts %}
    {% if post.tags contains 'Atari' %}
    <div style="margin-top: 2em; border-top : solid black 1px">
        <div style="font-size : 1.5em; font-family : 'atari'; margin-top : 0.5em;"> <a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a></div>
        <div style="font-family : 'volter'; margin-top : 0.5em">> {{ post.subtitle }}</div>
        <div>{{ post.excerpt }}</div>  
        <div class="read-more" style="text-align : right"><a href="{{ site.baseurl }}{{ post.url }}" >{{ site.t[page.lang].read_more }}</a></div>
    </div>              
    {% endif %}
    {% endfor %}
</div>
</div>