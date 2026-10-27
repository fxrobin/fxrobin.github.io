const cvData = {
    about: {
        name: "François-Xavier ROBIN",
        title: "Lead Software Engineer & Crafter",
        subtitle: "Architecte SI, Expert Java, API Manager",
        location: "Lyon, France",
        experience: "27 ans de développement logiciel",
        bio: [
            "Expert Java et Architecte SI, ancien officier de l'armée de Terre (1998-2018).",
            "J'ai piloté les préconisations techniques Java et l'adoption de la SOA au",
            "ministère des Armées, puis formé plus de 100 développeurs par an (2011-2018).",
            "",
            "API Manager au ministère des Armées (2020-2023) : guide de conception d'API",
            "REST, accompagnement des projets, applications de référence avec Quarkus.",
            "",
            "Aujourd'hui Lead Software Engineer chez Capgemini, au sein d'une cellule",
            "d'excellence technique dédiée au Craftsmanship : qualité, performance et",
            "maintenabilité des applications du groupe.",
            "",
            "Pionnier de l'IA depuis 1996, certifié GitHub Copilot, utilisateur quotidien",
            "de Claude Code et OpenCode. PoC GenAI : RAG, LLM locaux (Ollama), Agentic AI."
        ]
    },
    skills: [
        ["Java", ["Java 1.1 -> Java 21+", "Quarkus 3", "Spring Boot 3", "Jakarta EE", "Vert.x", "JAX-RS", "JavaFX", "Lombok", "Maven", "Gradle"]],
        ["Craftsmanship", ["Clean Code", "Architecture hexagonale", "DDD", "Eclipse Collections", "JUnit 5", "AssertJ", "Mockito", "Testcontainers"]],
        ["Langages", ["C (depuis 1993)", "C++ (jusqu'à C++14)", "ASM 6809 / 68000 / x86", "TypeScript", "Python", "Bash", "Lua", "Ada", "Perl"]],
        ["IA", ["GitHub Copilot (certifié)", "Claude Code", "OpenCode", "Ollama", "Mistral", "Llama", "LangChain", "MCP avec Quarkus", "RAG", "Prompt Engineering"]],
        ["APIs", ["REST", "HATEOAS", "OpenAPI 3", "AsyncAPI", "GraphQL", "SOAP", "SOA/ESB", "Event-Driven", "MQTT", "Bruno"]],
        ["Sécurité", ["OWASP Top 10 Web/API", "Security by Design", "Keycloak", "OAuth2", "OpenID Connect", "JWT", "SAML"]],
        ["DevOps", ["Docker", "Podman", "Kubernetes", "Helm", "GitHub Actions", "GitLab CI", "Jenkins", "SonarQube", "CodeQL", "Nexus"]],
        ["Systèmes", ["Linux (Debian, Ubuntu)", "Ansible", "Terraform", "VMware", "QEMU/KVM"]],
        ["Données", ["PostgreSQL", "Oracle", "MySQL", "Redis", "Elasticsearch", "MongoDB", "Drools"]],
        ["Web", ["Vue.js", "Angular", "React", "Svelte", "Web Components", "Tailwind", "SASS", "Jekyll", "Hugo"]]
    ],
    experience: [
        {
            id: "capgemini",
            title: "Lead Software Engineer & Crafter",
            company: "Capgemini",
            location: "Lyon",
            period: "sept. 2023 - Présent",
            highlights: [
                "Cellule Craftsmanship au profit de l'ensemble des projets du groupe",
                "PoC GenAI pour les développeurs (Copilot, Ollama, Continue, RAG)",
                "Refonte Java 8/Spring 5 vers Java 21/Quarkus 3 en mode réactif",
                "Techlead d'une équipe de 5 développeurs",
                "PoC GraalVM natif (Quarkus 3, Spring Boot 3)",
                "Coding Dojos, katas Java, speaker, avant-vente"
            ]
        },
        {
            id: "minarm-api",
            title: "API Manager",
            company: "Ministère des Armées, DGNUM",
            location: "Bruz",
            period: "juil. 2020 - sept. 2023",
            highlights: [
                "Analyse et validation d'API REST (OpenAPI 3, Swagger 2)",
                "Rédaction du guide de conception API du ministère",
                "Application Quarkus de référence appliquant le guide",
                "Outillage de validation et de comparaison des API"
            ]
        },
        {
            id: "apside",
            title: "TechLead",
            company: "APSIDE",
            location: "Rennes",
            period: "mai 2018 - juin 2020",
            highlights: [
                "Expertise Java EE et interopérabilité pour toutes les agences",
                "Architectures techniques, scénarios de migration, audits",
                "Coaching de juniors, formation interne, laboratoire d'innovation",
                "Speaker : Breizhcamp, TNT..."
            ]
        },
        {
            id: "etrs-manager",
            title: "Responsable de formations de développeurs",
            company: "Ministère des Armées, ETRS",
            location: "Cesson-Sévigné",
            period: "janv. 2015 - avr. 2018",
            highlights: [
                "Management de 10 formateurs, ~100 stagiaires développeurs par an",
                "Forge logicielle (Git/SVN, Nexus, Maven, Sonar)",
                "Jeu vidéo old-school pour apprendre à développer",
                "Recueil de bonnes pratiques de développement sécurisé"
            ]
        },
        {
            id: "etrs-formateur",
            title: "Formateur Java EE et SOA",
            company: "Ministère des Armées, ETRS",
            location: "Cesson-Sévigné",
            period: "juil. 2011 - janv. 2015",
            highlights: [
                "Refonte des contenus pédagogiques de Java EE 5 à Java EE 7",
                "VM Linux (Debian/XFCE) packagées pour les stagiaires"
            ]
        },
        {
            id: "cpsiat",
            title: "Architecte technique Java EE et SOA",
            company: "Ministère de la Défense, CPSIAT",
            location: "Région parisienne",
            period: "oct. 1998 - juil. 2011",
            highlights: [
                "Co-rédacteur de la directive technique Java EE/SOA de l'armée de Terre",
                "Outillage SOA (UDDI, ESB, SOAP, REST), cloud privé VMware",
                "Animateur de la communauté Java du ministère",
                "Audits techniques et sécurité, AMOE/AMOA sur 30+ projets"
            ]
        }
    ],
    education: [
        { year: "2022", degree: "Certification SAFe DevSecOps", school: "Scaled Agile" },
        { year: "1998-2018", degree: "Officier de l'armée de Terre", school: "Diplôme technique militaire \"Systèmes d'Information\"" },
        { year: "2013", degree: "TOEIC : 865", school: "Anglais" },
        { year: "1997", degree: "Maîtrise d'informatique", school: "Université de Versailles-St-Quentin" },
        { year: "1996", degree: "Licence d'informatique", school: "Université de Versailles-St-Quentin" },
        { year: "1995", degree: "DUT d'informatique", school: "Université d'Orléans" }
    ],
    projects: [
        "Gestion d'équipe et des compétences",
        "Ingénierie pédagogique, suivi et gestion RH",
        "Conduite et gestion de projet, analyse, UML",
        "SCRUM, méthodes agiles",
        "Rédaction de spécifications et de cadres normatifs"
    ],
    interests: [
        ["Capitaliser", "Écrire, publier, partager, former, progresser"],
        ["Craftsmanship", "Clean Code : \"Less code, less bugs\""],
        ["Architecture", "Architectures logicielles Java et SI"],
        ["IA", "Algorithmes génétiques, réseaux de neurones, IA générative"]
    ],
    hobbies: [
        "Sports : tennis, course à pied, badminton",
        "Musique : guitare et chant dans un groupe de reprises pop/rock",
        "RetroCoding : MO5/TO8 (ASM 6809), Atari ST (ASM 68000), groupe wide-dot",
        "Voyages"
    ],
    contact: [
        ["LinkedIn", "linkedin.com/in/fxrobin"],
        ["GitHub", "github.com/fxrobin"],
        ["Blog", "www.fxjavadevblog.fr"],
        ["Articles", "fxrobin.developpez.com"],
        ["SO", "stackoverflow.com/users/3017541/fxrobin"]
    ]
};
