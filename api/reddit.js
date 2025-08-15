/**
 * Serverless function Vercel pour contourner CORS avec Reddit API
 */

export default async function handler(req, res) {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Gestion des requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { subreddit = 'france' } = req.query;
        
        console.log(`🔍 Récupération posts de r/${subreddit}`);

        // Appel à l'API Reddit depuis le serveur Vercel
        const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
        
        const response = await fetch(redditUrl, {
            headers: {
                'User-Agent': 'RedditTix:v1.0.0 (by /u/RedditTix)',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Reddit API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Filtrer les posts valides
        const validPosts = data.data.children.filter(child => {
            const post = child.data;
            return post.selftext && 
                   post.selftext.length > 100 && 
                   post.selftext.length < 2000 &&
                   !post.over_18 &&
                   !post.stickied &&
                   containsFrenchWords(post.selftext);
        });

        if (validPosts.length === 0) {
            res.status(404).json({ 
                error: 'No valid French posts found',
                subreddit: subreddit 
            });
            return;
        }

        // Sélectionner un post aléatoire
        const selectedPost = validPosts[Math.floor(Math.random() * validPosts.length)].data;

        const formattedPost = {
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

        console.log(`✅ Post Reddit récupéré: ${formattedPost.title.substring(0, 50)}...`);

        res.status(200).json(formattedPost);

    } catch (error) {
        console.error('❌ Erreur API Reddit:', error.message);
        
        res.status(500).json({ 
            error: 'Failed to fetch Reddit post',
            message: error.message,
            fallback: true
        });
    }
}

/**
 * Détection basique de contenu français
 */
function containsFrenchWords(text) {
    const frenchIndicators = [
        'le ', 'la ', 'les ', 'un ', 'une ', 'des ',
        'je ', 'tu ', 'il ', 'elle ', 'nous ', 'vous ', 'ils ', 'elles ',
        'est ', 'sont ', 'avoir ', 'être ', 'faire ', 'aller ', 'avec ', 'dans ',
        'pour ', 'sur ', 'par ', 'mais ', 'donc ', 'alors ', 'quand ', 'comment ',
        'c\'est ', 'il y a ', 'qu\'est-ce que ', 'est-ce que ',
        'à ', 'où ', 'ça ', 'déjà ', 'français', 'être', 'hôtel'
    ];

    const lowerText = text.toLowerCase();
    return frenchIndicators.some(indicator => lowerText.includes(indicator));
}