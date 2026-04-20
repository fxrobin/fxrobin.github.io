---
layout: page-no-aside
title: Retro-Programming ATARI ST / THOMSON
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
<div id="left" style="margin : auto; width : 100%">
    <style>
    .row {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        width: 100%;
    }
    .column {
        display: flex;
        flex-direction: column;
        flex-basis: 100%;
        flex: 1;
        padding: 1.5em;
        min-width: 360px;
    }
    .retro-prog-section {
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.5em;
        box-sizing: border-box;
    }

    .thomson-header {
        font-size: 1.5em;
        font-family: "thomson";
        background-color: darkblue;
        color: white;
        letter-spacing: 0.1em;
    }
    .st-header {
        font-size: 1.6em;
        font-family: "atari";
        background-color: darkgreen;
        color: white;
        letter-spacing: 0.05em;
    }
    .retro-card {
        display: flex;
        align-items: center;
        gap: 0.6em;
        padding: 0.4em 0;
        border-top: 1px solid #333;
    }
    .retro-card-body {
        flex: 1;
        min-width: 0;
    }
    .retro-card-title {
        display: block;
        color: #FFB000;
        text-decoration: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .atari-st .retro-card-title {
        font-family: 'atari';
        font-size: 1.2em;
    }
    .thomson .retro-card-title {
        font-family: 'pixel-operator';
        font-size: 1.3em;
        font-weight: bold;
    }
    .retro-card-title:hover {
        color: #fff;
        text-shadow: 0 0 6px #FFB000;
    }
    .retro-card-sub {
        font-size: 1em;
        color: #888;
        font-family: monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    </style>    
    <div class="posts" style="margin-top : 4em;">
        <div class='row'>
            <div class='column' style="border-right : solid black 2px">
                <div class="atari-st common-header">
                    <div class="retro-prog-section st-header">ATARI ST</div>
                    {% for post in posts %}
                        {% if post.tags contains "Retro" and post.tags contains "Atari" %}
                            {% include display-retro-prog-synopsis.html %}  
                        {% endif %}
                    {% endfor %}
                </div>
            </div>
            <div class='column'>
                <div class="thomson common-header">
                    <div class="retro-prog-section thomson-header">THOMSON</div>
                    {% for post in posts %}
                        {% if post.tags contains "Retro" and post.tags contains "Thomson" %}
                            {% include display-retro-prog-synopsis.html %}  
                        {% endif %}
                    {% endfor %}
                </div>
            </div>
        </div>
    </div>
</div>

<script>
(function () {
  var intro = document.querySelector('.intro');
  if (!intro) return;

  var html = intro.innerHTML.trim();
  var out = '';
  var i = 0;
  var cursor = '<span class="type-cursor">\u2588</span>';

  intro.innerHTML = cursor;

  function tick() {
    if (i >= html.length) {
      intro.innerHTML = html + '<span class="type-cursor type-cursor--done">\u2588</span>';
      return;
    }
    if (html[i] === '<') {
      var end = html.indexOf('>', i);
      if (end === -1) end = html.length - 1;
      out += html.slice(i, end + 1);
      i = end + 1;
      tick();
    } else if (html[i] === '&') {
      var end = html.indexOf(';', i);
      if (end === -1) { out += html[i++]; tick(); return; }
      out += html.slice(i, end + 1);
      i = end + 1;
      tick();
    } else {
      var burst = i;
      while (burst < html.length && html[burst] !== '<' && html[burst] !== '&' && burst - i < 6) burst++;
      if (burst === i) burst = i + 1;
      out += html.slice(i, burst);
      i = burst;
      intro.innerHTML = out + cursor;
      setTimeout(tick, 18);
    }
  }
  tick();
})();
</script>