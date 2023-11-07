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
    padding : 2em;
    min-width : 400px;
    }
    .retro-prog-section
    {
        background-color: darkblue;
        color: white;
        font-size : 2em;
        padding : 0.5em;
        text-align: center;
    }
    .atari-st
    {
        background-color : #b6fcc9;
        padding: 1em;
        border-radius: 0.5em 0.5em 0.5em 0.5em
    }
    .thomson
    {
        background-color : #cfdffa;
        padding: 1em;
        border-radius: 0.5em 0.5em 0.5em 0.5em
    }
    .retro-prog-title
    {
        font-size : 2.5em; 
        font-family : 'greenberet'; 
        margin-top : 0.5em;
    }

    .retro-prog-title A
    {
        color : black;
        text-shadow: 2px 2px 1px white;
    }

    </style>    
    <div class="posts" style="margin-top : 4em;">
        <div class='row'>
            <div class='column' style="border-right : solid black 2px">
                <div class="atari-st">
                    <div style="text-align:center"><img src="/images/atari-st.png" /></div>
                    <div class="retro-prog-section">Articles Atari ST</div>
                    {% for post in posts %}
                        {% if post.tags contains "Retro-Prog" and post.tags contains "Atari" %}
                            {% include display-retro-prog-synopsis.html %}  
                        {% endif %}
                    {% endfor %}
                </div>
            </div>
            <div class='column'>
                <div class="thomson">
                    <div style="text-align:center"><img src="/images/to8.png" height="187" /></div>
                    <div class="retro-prog-section">Articles Thomson</div>
                    {% for post in posts %}
                        {% if post.tags contains "Retro-Prog" and post.tags contains "Thomson" %}
                            {% include display-retro-prog-synopsis.html %}  
                        {% endif %}
                    {% endfor %}
                </div>
            </div>
        </div>
    </div>
</div>