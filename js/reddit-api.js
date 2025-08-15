/**
 * Reddit API Module pour RedditTix - Version Vercel
 * Gestion des appels API Reddit côté client avec gestion CORS
 */

class RedditAPI {
    constructor() {
        this.frenchSubreddits = [
            'france', 'rance', 'paslegorafi', 'commeditlajeunemariee',
            'rienabranler', 'francedigeste', 'AskFrance'
        ];
        
        // Fallback posts en cas d'échec de l'API
        this.fallbackPosts = [
            {
                id: 'fallback_1',
                title: 'Mon chat mange mes croissants tous les matins',
                content: 'Je me lève tous les matins à 7h pour préparer mes croissants. Mais Maurice, mon chat roux de 3 ans, a développé une obsession pour la pâte feuilletée. Dès que je pose les croissants sur la table, il saute dessus et en dévore un entier. Ma femme dit que c\'est mignon mais moi je n\'ai plus jamais de petit-déjeuner !',
                url: 'https://reddit.com/r/france/example1',
                source: 'fallback'
            },
            {
                id: 'fallback_2',
                title: 'Ma voisine collectionne 400 nains de jardin',
                content: 'Hier, j\'ai découvert que ma voisine Henriette collectionne plus de 400 nains de jardin dans son appartement parisien de 30m². Elle les a disposés sur chaque étagère, dans chaque coin. Quand je lui demande pourquoi, elle me répond qu\'ils lui tiennent compagnie depuis la mort de son mari. C\'est touchant mais terrifiants quand on entre chez elle !',
                url: 'https://reddit.com/r/france/example2',
                source: 'fallback'
            }
        ];
    }

    /**
     * Point d'entrée principal pour récupérer un post Reddit
     * @returns {Promise<Object>} Post Reddit formaté
     */
    async fetchRandomFrenchPost() {
        console.log('🔍 Recherche d\'un post Reddit français...');
        
        try {
            // Tentative via fonction serverless Vercel (priorité)
            const post = await this.fetchViaServerless();
            if (post) {
                console.log('✅ Post Reddit récupéré via serverless');
                return post;
            }
        } catch (error) {
            console.warn('⚠️ Erreur fonction serverless:', error.message);
        }

        try {
            // Tentative d'appel direct à l'API Reddit
            const post = await this.fetchFromRedditAPI();
            if (post) {
                console.log('✅ Post Reddit récupéré avec succès');
                return post;
            }
        } catch (error) {
            console.warn('⚠️ Erreur API Reddit:', error.message);
        }

        // Tentative via proxy CORS
        try {
            const post = await this.fetchViaProxy();
            if (post) {
                console.log('✅ Post Reddit récupéré via proxy');
                return post;
            }
        } catch (error) {
            console.warn('⚠️ Erreur proxy CORS:', error.message);
        }

        // Fallback: utiliser un post pré-défini
        console.log('🔄 Utilisation d\'un post de fallback');
        return this.getFallbackPost();
    }

    /**
     * Appel via fonction serverless Vercel (solution optimale)
     * @returns {Promise<Object|null>}
     */
    async fetchViaServerless() {
        const subreddit = this.frenchSubreddits[Math.floor(Math.random() * this.frenchSubreddits.length)];
        
        // Déterminer l'URL de base (local vs déployé)
        const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? window.location.origin
            : window.location.origin;
            
        const apiUrl = `${baseUrl}/api/reddit?subreddit=${subreddit}`;
        
        console.log(`🔄 Appel serverless: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Aucun post français trouvé dans ce subreddit');
            }
            throw new Error(`Serverless API error: ${response.status}`);
        }

        const post = await response.json();
        
        if (post.fallback) {
            throw new Error('Fonction serverless en mode fallback');
        }

        return post;
    }

    /**
     * Appel direct à l'API Reddit (peut échouer à cause de CORS)
     * @returns {Promise<Object|null>}
     */
    async fetchFromRedditAPI() {
        const subreddit = this.frenchSubreddits[Math.floor(Math.random() * this.frenchSubreddits.length)];
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'RedditTix:v1.0.0 (by /u/RedditTix)'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return this.processRedditResponse(data, subreddit);
    }

    /**
     * Appel via proxy CORS (alternative)
     * @returns {Promise<Object|null>}
     */
    async fetchViaProxy() {
        const subreddit = this.frenchSubreddits[Math.floor(Math.random() * this.frenchSubreddits.length)];
        const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
        
        // Liste de proxies CORS à essayer
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(redditUrl)}`,
            `https://cors-anywhere.herokuapp.com/${redditUrl}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(redditUrl)}`,
            `https://thingproxy.freeboard.io/fetch/${redditUrl}`
        ];

        for (const proxyUrl of proxies) {
            try {
                console.log(`🔄 Tentative avec proxy: ${proxyUrl.split('/')[2]}`);
                
                const response = await fetch(proxyUrl, {
                    headers: {
                        'User-Agent': 'RedditTix:v1.0.0 (by /u/RedditTix)'
                    }
                });

                if (!response.ok) {
                    console.warn(`❌ Proxy failed: ${response.status}`);
                    continue;
                }

                const data = await response.json();
                const post = this.processRedditResponse(data, subreddit);
                
                if (post) {
                    console.log(`✅ Post récupéré via ${proxyUrl.split('/')[2]}`);
                    return post;
                }
            } catch (error) {
                console.warn(`❌ Erreur proxy ${proxyUrl.split('/')[2]}:`, error.message);
                continue;
            }
        }

        throw new Error('Tous les proxies ont échoué');
    }

    /**
     * Traitement de la réponse de l'API Reddit
     * @param {Object} data - Données JSON de Reddit
     * @param {string} subreddit - Nom du subreddit
     * @returns {Object|null}
     */
    processRedditResponse(data, subreddit) {
        if (!data.data || !data.data.children || data.data.children.length === 0) {
            return null;
        }

        // Filtrer les posts appropriés
        const validPosts = data.data.children.filter(child => {
            const post = child.data;
            return post.selftext && 
                   post.selftext.length > 100 && 
                   post.selftext.length < 2000 &&
                   !post.over_18 &&
                   !post.stickied &&
                   this.containsFrenchWords(post.selftext);
        });

        if (validPosts.length === 0) {
            return null;
        }

        // Sélectionner un post aléatoire
        const selectedPost = validPosts[Math.floor(Math.random() * validPosts.length)].data;

        return {
            id: selectedPost.id,
            title: selectedPost.title,
            content: selectedPost.selftext,
            url: `https://reddit.com${selectedPost.permalink}`,
            author: selectedPost.author,
            subreddit: selectedPost.subreddit,
            score: selectedPost.score,
            created: new Date(selectedPost.created_utc * 1000),
            source: 'reddit'
        };
    }

    /**
     * Détection basique de contenu français
     * @param {string} text - Texte à analyser
     * @returns {boolean}
     */
    containsFrenchWords(text) {
        const frenchIndicators = [
            // Articles français
            'le ', 'la ', 'les ', 'un ', 'une ', 'des ',
            // Pronoms
            'je ', 'tu ', 'il ', 'elle ', 'nous ', 'vous ', 'ils ', 'elles ',
            // Mots courants français
            'est ', 'sont ', 'avoir ', 'être ', 'faire ', 'aller ', 'avec ', 'dans ',
            'pour ', 'sur ', 'par ', 'mais ', 'donc ', 'alors ', 'quand ', 'comment ',
            // Expressions françaises
            'c\'est ', 'il y a ', 'qu\'est-ce que ', 'est-ce que ',
            // Accents
            'à ', 'où ', 'ça ', 'déjà ', 'français', 'être', 'hôtel'
        ];

        const lowerText = text.toLowerCase();
        return frenchIndicators.some(indicator => lowerText.includes(indicator));
    }

    /**
     * Récupération d'un post de fallback
     * @returns {Object}
     */
    getFallbackPost() {
        const post = this.fallbackPosts[Math.floor(Math.random() * this.fallbackPosts.length)];
        
        return {
            ...post,
            created: new Date(),
            score: Math.floor(Math.random() * 100) + 10
        };
    }

    /**
     * Validation d'un post avant utilisation
     * @param {Object} post - Post à valider
     * @returns {boolean}
     */
    validatePost(post) {
        return post && 
               post.title && 
               post.content && 
               post.content.length > 50 &&
               post.url;
    }
}

// Instance globale
window.redditAPI = new RedditAPI();