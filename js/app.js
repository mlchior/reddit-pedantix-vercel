/**
 * Application principale pour RedditTix - Version Vercel
 * Coordination entre l'API Reddit et la logique du jeu
 */

class RedditTixApp {
    constructor() {
        this.isLoading = false;
        this.currentPost = null;
        
        // Références aux modules
        this.redditAPI = window.redditAPI;
        this.gameLogic = window.gameLogic;
        
        // Système de scoring local
        this.scores = this.loadScoresFromStorage();
        
        this.initializeApp();
    }

    /**
     * Initialisation de l'application
     */
    async initializeApp() {
        console.log('🚀 Initialisation de RedditTix...');
        
        this.setupEventListeners();
        await this.loadNewPost();
    }

    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        // Bouton de soumission
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleGuess());
        }

        // Bouton révéler
        const revealBtn = document.getElementById('revealBtn');
        if (revealBtn) {
            revealBtn.addEventListener('click', () => this.revealPost());
        }

        // Bouton nouveau post
        const newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.loadNewPost());
        }

        // Input de saisie
        const wordInput = document.getElementById('wordInput');
        if (wordInput) {
            wordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleGuess();
                }
            });
        }
    }

    /**
     * Chargement d'un nouveau post Reddit
     */
    async loadNewPost() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);
        
        try {
            console.log('📡 Récupération d\'un nouveau post...');
            
            const post = await this.redditAPI.fetchRandomFrenchPost();
            
            if (!post || !this.redditAPI.validatePost(post)) {
                throw new Error('Post invalide reçu');
            }

            this.currentPost = post;
            this.gameLogic.resetGame();
            this.gameLogic.initializeGame(post);
            
            this.showLoading(false);
            this.focusInput();
            
            console.log('✅ Nouveau jeu initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement du post:', error);
            this.showError('Erreur lors du chargement du post Reddit. Veuillez réessayer.');
            this.showLoading(false);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Gestion d'une tentative de devinette
     */
    handleGuess() {
        const wordInput = document.getElementById('wordInput');
        if (!wordInput || this.gameLogic.gameWon) return;

        const guess = wordInput.value.trim();
        if (!guess) {
            this.showMessage('Veuillez saisir un mot', 'warning');
            return;
        }

        const result = this.gameLogic.handleGuess();
        wordInput.value = '';

        // Feedback à l'utilisateur
        if (result && result.message) {
            const messageType = result.success ? 'success' : 'info';
            this.showMessage(result.message, messageType);
        }

        // Vérifier si le jeu est gagné
        if (this.gameLogic.gameWon) {
            this.handleGameWon();
        }
    }

    /**
     * Révélation complète du post
     */
    revealPost() {
        if (confirm('Êtes-vous sûr de vouloir révéler tout le post ?')) {
            this.gameLogic.revealAll();
            this.showMessage('Post révélé ! Cliquez sur "Nouveau Post" pour continuer.', 'info');
        }
    }

    /**
     * Gestion de la victoire
     */
    handleGameWon() {
        const score = this.calculateScore();
        this.saveScore(score);
        
        console.log('🎉 Jeu terminé ! Score:', score);
    }

    /**
     * Calcul du score basé sur les tentatives
     * @returns {number}
     */
    calculateScore() {
        const baseScore = 1000;
        const penalty = Math.max(0, this.gameLogic.attempts - 5) * 10;
        return Math.max(100, baseScore - penalty);
    }

    /**
     * Sauvegarde du score dans localStorage
     * @param {number} score
     */
    saveScore(score) {
        const scoreData = {
            score: score,
            attempts: this.gameLogic.attempts,
            wordsFound: this.gameLogic.foundWords.size,
            postTitle: this.currentPost ? this.currentPost.title : 'Inconnu',
            date: new Date().toISOString(),
            postId: this.currentPost ? this.currentPost.id : 'unknown'
        };

        this.scores.push(scoreData);
        
        // Garder seulement les 50 meilleurs scores
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 50);
        
        localStorage.setItem('redditTixScores', JSON.stringify(this.scores));
    }

    /**
     * Chargement des scores depuis localStorage
     * @returns {Array}
     */
    loadScoresFromStorage() {
        try {
            const stored = localStorage.getItem('redditTixScores');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Erreur lecture scores:', error);
            return [];
        }
    }

    /**
     * Affichage/masquage du chargement
     * @param {boolean} show
     */
    showLoading(show) {
        const loading = document.getElementById('loading');
        const gameContent = document.getElementById('game-content');

        if (loading && gameContent) {
            loading.style.display = show ? 'block' : 'none';
            gameContent.style.display = show ? 'none' : 'block';
        }
    }

    /**
     * Focus sur l'input de saisie
     */
    focusInput() {
        const wordInput = document.getElementById('wordInput');
        if (wordInput && !wordInput.disabled) {
            setTimeout(() => wordInput.focus(), 100);
        }
    }

    /**
     * Affichage d'un message temporaire
     * @param {string} message
     * @param {string} type - success, warning, info, error
     */
    showMessage(message, type = 'info') {
        // Créer un élément de notification temporaire
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Couleurs selon le type
        const colors = {
            success: '#4caf50',
            warning: '#ff9800',
            info: '#2196f3',
            error: '#f44336'
        };

        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Suppression automatique
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Affichage d'une erreur
     * @param {string} message
     */
    showError(message) {
        this.showMessage(message, 'error');
        console.error('🚨', message);
    }

    /**
     * Obtention des meilleurs scores
     * @param {number} limit
     * @returns {Array}
     */
    getTopScores(limit = 10) {
        return this.scores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Statistiques de jeu
     * @returns {Object}
     */
    getGameStats() {
        if (this.scores.length === 0) {
            return {
                totalGames: 0,
                averageScore: 0,
                bestScore: 0,
                averageAttempts: 0
            };
        }

        const totalGames = this.scores.length;
        const totalScore = this.scores.reduce((sum, score) => sum + score.score, 0);
        const totalAttempts = this.scores.reduce((sum, score) => sum + score.attempts, 0);
        const bestScore = Math.max(...this.scores.map(s => s.score));

        return {
            totalGames,
            averageScore: Math.round(totalScore / totalGames),
            bestScore,
            averageAttempts: Math.round(totalAttempts / totalGames)
        };
    }
}

// Fonctions globales pour l'HTML
window.loadNewPost = () => {
    if (window.app) {
        window.app.loadNewPost();
    }
};

window.revealPost = () => {
    if (window.app) {
        window.app.revealPost();
    }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 RedditTix Version Vercel - Initialisation...');
    window.app = new RedditTixApp();
});

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur globale:', event.error);
    if (window.app) {
        window.app.showError('Une erreur inattendue s\'est produite. Veuillez recharger la page.');
    }
});

// Export pour debug/tests
window.RedditTixApp = RedditTixApp;