/**
 * Game Logic Module pour RedditTix - Version Vercel
 * Gestion de la logique du jeu Pedantix avec posts Reddit
 */

class GameLogic {
    constructor() {
        this.currentPost = null;
        this.words = [];
        this.guessedWords = new Set();
        this.foundWords = new Set();
        this.attempts = 0;
        this.gameWon = false;
        
        // Configuration du jeu
        this.config = {
            minWordLength: 3,
            victoryThreshold: 0.8,
            keywordProbability: 0.15,
            importantWordProbability: 0.3
        };

        // Mots français courants à ignorer pour les mots-clés
        this.commonWords = new Set([
            'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'des',
            'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
            'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
            'notre', 'votre', 'leur', 'leurs', 'ce', 'cette', 'ces',
            'qui', 'que', 'quoi', 'dont', 'où', 'comment', 'quand', 'pourquoi',
            'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or',
            'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par', 'vers',
            'chez', 'entre', 'parmi', 'selon', 'pendant', 'depuis',
            'est', 'sont', 'était', 'étaient', 'sera', 'seront',
            'a', 'ont', 'avait', 'avaient', 'aura', 'auront',
            'très', 'plus', 'moins', 'assez', 'trop', 'bien', 'mal',
            'oui', 'non', 'peut', 'être', 'avoir', 'faire', 'dire', 'aller',
            'voir', 'savoir', 'pouvoir', 'vouloir', 'venir', 'falloir',
            'devoir', 'croire', 'partir', 'prendre', 'donner', 'mettre'
        ]);

        // Initialisation des événements
        this.initializeEventListeners();
    }

    /**
     * Initialisation du jeu avec un nouveau post
     * @param {Object} post - Post Reddit à utiliser
     */
    initializeGame(post) {
        console.log('🎮 Initialisation du jeu avec post:', post.title);
        
        this.currentPost = post;
        this.guessedWords.clear();
        this.foundWords.clear();
        this.attempts = 0;
        this.gameWon = false;
        
        // Traitement du texte
        this.processText(post.title + ' ' + post.content);
        
        // Affichage initial
        this.renderGame();
        this.updateStats();
        this.updateStatusIndicator(post.source);
    }

    /**
     * Traitement du texte en mots avec classification
     * @param {string} text - Texte à traiter
     */
    processText(text) {
        // Nettoyage et tokenisation du texte
        const cleanText = text
            .replace(/[^\w\sÀ-ÿ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        const wordList = cleanText.split(' ').filter(word => 
            word.length >= this.config.minWordLength
        );

        // Classification des mots
        this.words = wordList.map((word, index) => {
            const lowerWord = word.toLowerCase();
            let category = 'common';

            // Détermination de la catégorie
            if (!this.commonWords.has(lowerWord)) {
                if (Math.random() < this.config.keywordProbability) {
                    category = 'keyword';
                } else if (Math.random() < this.config.importantWordProbability) {
                    category = 'important';
                }
            }

            return {
                text: word,
                original: word,
                lower: lowerWord,
                category: category,
                found: false,
                index: index
            };
        });

        console.log(`📝 ${this.words.length} mots traités`);
        console.log(`🔑 Mots-clés: ${this.words.filter(w => w.category === 'keyword').length}`);
        console.log(`⚠️ Mots importants: ${this.words.filter(w => w.category === 'important').length}`);
    }

    /**
     * Tentative de deviner un mot
     * @param {string} guess - Mot proposé par l'utilisateur
     * @returns {Object} Résultat de la tentative
     */
    makeGuess(guess) {
        const cleanGuess = guess.toLowerCase().trim();
        
        if (cleanGuess.length < 2) {
            return { success: false, message: 'Mot trop court (minimum 2 caractères)' };
        }

        if (this.guessedWords.has(cleanGuess)) {
            return { success: false, message: 'Mot déjà essayé' };
        }

        this.attempts++;
        this.guessedWords.add(cleanGuess);

        // Recherche par inclusion
        const matchingWords = this.words.filter(word => 
            word.lower.includes(cleanGuess) && !word.found
        );

        if (matchingWords.length > 0) {
            // Marquer les mots trouvés
            matchingWords.forEach(word => {
                word.found = true;
                this.foundWords.add(word.lower);
            });

            this.updateDisplay();
            this.updateStats();
            this.checkVictory();

            return {
                success: true,
                matchCount: matchingWords.length,
                message: `Trouvé ${matchingWords.length} mot${matchingWords.length > 1 ? 's' : ''} !`
            };
        }

        this.updateStats();
        return {
            success: false,
            message: 'Aucun mot trouvé'
        };
    }

    /**
     * Révélation de tous les mots
     */
    revealAll() {
        this.words.forEach(word => {
            word.found = true;
            this.foundWords.add(word.lower);
        });

        this.gameWon = true;
        this.updateDisplay();
        this.showVictory(true);
        
        // Afficher le lien Reddit
        const redditLink = document.getElementById('redditLink');
        if (redditLink && this.currentPost) {
            redditLink.href = this.currentPost.url;
            redditLink.style.display = 'inline-flex';
        }
    }

    /**
     * Vérification des conditions de victoire
     */
    checkVictory() {
        const keywordWords = this.words.filter(w => w.category === 'keyword');
        const importantWords = this.words.filter(w => w.category === 'important');
        const targetWords = [...keywordWords, ...importantWords];

        if (targetWords.length === 0) {
            return;
        }

        const foundTargetWords = targetWords.filter(w => w.found);
        const progressRatio = foundTargetWords.length / targetWords.length;

        if (progressRatio >= this.config.victoryThreshold) {
            this.gameWon = true;
            this.showVictory(false);
            
            // Révéler automatiquement tous les mots restants
            this.words.forEach(word => {
                if (!word.found) {
                    word.found = true;
                    this.foundWords.add(word.lower);
                }
            });
            
            this.updateDisplay();
            
            // Afficher le lien Reddit
            const redditLink = document.getElementById('redditLink');
            if (redditLink && this.currentPost) {
                redditLink.href = this.currentPost.url;
                redditLink.style.display = 'inline-flex';
            }
        }
    }

    /**
     * Affichage de la victoire
     * @param {boolean} revealed - Si les mots ont été révélés manuellement
     */
    showVictory(revealed) {
        const victoryMessage = document.getElementById('victoryMessage');
        const finalStats = document.getElementById('finalStats');
        
        if (victoryMessage && finalStats) {
            const message = revealed 
                ? 'Post révélé - Essayez un autre post !' 
                : `Bravo ! Vous avez trouvé le post en ${this.attempts} tentative${this.attempts > 1 ? 's' : ''} !`;
                
            finalStats.textContent = message;
            victoryMessage.classList.add('show');
        }

        // Désactiver les contrôles
        const wordInput = document.getElementById('wordInput');
        const submitBtn = document.getElementById('submitBtn');
        const revealBtn = document.getElementById('revealBtn');

        if (wordInput) wordInput.disabled = true;
        if (submitBtn) submitBtn.disabled = true;
        if (revealBtn) revealBtn.disabled = true;
    }

    /**
     * Rendu du jeu dans le DOM
     */
    renderGame() {
        const textContainer = document.getElementById('textContainer');
        if (!textContainer) return;

        textContainer.innerHTML = this.words
            .map(word => this.renderWord(word))
            .join(' ');

        this.updateGuessedWordsList();
    }

    /**
     * Rendu d'un mot individuel
     * @param {Object} word - Mot à rendre
     * @returns {string} HTML du mot
     */
    renderWord(word) {
        if (!word.found) {
            return `<span class="word word-hidden">${'█'.repeat(word.text.length)}</span>`;
        }

        const categoryClass = `word-found-${word.category === 'keyword' ? 'high' : 
                                         word.category === 'important' ? 'medium' : 'low'}`;

        return `<span class="word ${categoryClass}" title="${word.category}">${word.text}</span>`;
    }

    /**
     * Mise à jour de l'affichage après une trouvaille
     */
    updateDisplay() {
        this.renderGame();
        this.updateGuessedWordsList();
    }

    /**
     * Mise à jour des statistiques
     */
    updateStats() {
        const attemptsEl = document.getElementById('attempts');
        const wordsFoundEl = document.getElementById('wordsFound');
        const progressEl = document.getElementById('progress');

        if (attemptsEl) attemptsEl.textContent = this.attempts;
        if (wordsFoundEl) wordsFoundEl.textContent = this.foundWords.size;

        // Calcul du pourcentage basé sur les mots cibles
        const targetWords = this.words.filter(w => 
            w.category === 'keyword' || w.category === 'important'
        );
        const foundTargetWords = targetWords.filter(w => w.found);
        const percentage = targetWords.length > 0 
            ? Math.round((foundTargetWords.length / targetWords.length) * 100)
            : 0;

        if (progressEl) progressEl.textContent = `${percentage}%`;
    }

    /**
     * Mise à jour de la liste des mots essayés
     */
    updateGuessedWordsList() {
        const guessedWordsList = document.getElementById('guessedWordsList');
        if (!guessedWordsList) return;

        guessedWordsList.innerHTML = Array.from(this.guessedWords)
            .map(word => {
                const found = this.words.some(w => w.lower.includes(word) && w.found);
                const className = found ? 'guessed-word found' : 'guessed-word not-found';
                return `<span class="${className}">${word}</span>`;
            })
            .join(' ');
    }

    /**
     * Mise à jour de l'indicateur de statut
     * @param {string} source - Source du post (reddit/fallback)
     */
    updateStatusIndicator(source) {
        const statusIndicator = document.getElementById('statusIndicator');
        if (!statusIndicator) return;

        if (source === 'reddit') {
            statusIndicator.className = 'status-indicator status-reddit';
            statusIndicator.textContent = '✅ Post Reddit authentique sélectionné aléatoirement';
        } else {
            statusIndicator.className = 'status-indicator status-fallback';
            statusIndicator.textContent = '⚠️ Post de démonstration (API Reddit indisponible)';
        }
    }

    /**
     * Réinitialisation pour un nouveau jeu
     */
    resetGame() {
        // Réactiver les contrôles
        const wordInput = document.getElementById('wordInput');
        const submitBtn = document.getElementById('submitBtn');
        const revealBtn = document.getElementById('revealBtn');

        if (wordInput) {
            wordInput.disabled = false;
            wordInput.value = '';
        }
        if (submitBtn) submitBtn.disabled = false;
        if (revealBtn) revealBtn.disabled = false;

        // Cacher les messages de victoire
        const victoryMessage = document.getElementById('victoryMessage');
        if (victoryMessage) {
            victoryMessage.classList.remove('show');
        }

        // Cacher le lien Reddit
        const redditLink = document.getElementById('redditLink');
        if (redditLink) {
            redditLink.style.display = 'none';
        }
    }

    /**
     * Initialisation des écouteurs d'événements
     */
    initializeEventListeners() {
        // Soumission par Enter
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const wordInput = document.getElementById('wordInput');
                if (wordInput && wordInput === document.activeElement) {
                    this.handleGuess();
                }
            }
        });
    }

    /**
     * Gestion d'une tentative de devinette
     */
    handleGuess() {
        const wordInput = document.getElementById('wordInput');
        if (!wordInput || this.gameWon) return;

        const guess = wordInput.value.trim();
        if (!guess) return;

        const result = this.makeGuess(guess);
        wordInput.value = '';

        // Feedback visuel
        console.log(result.message);
    }
}

// Instance globale
window.gameLogic = new GameLogic();