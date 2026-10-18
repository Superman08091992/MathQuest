/**
 * Math Quest - Persistent profiles, backwards-compatible migrations and catalogue.
 * Store owns the source data; UI and game systems must not maintain parallel pet state.
 */
const SaveManager = {
    STORAGE_KEY: 'mathQuestData',
    VERSION: '3.2.0',
    data: null,
    lastSaveError: null,

    // Catalogue ownership is intentionally NOT global: ownership lives on profiles.
    CATALOGUE: {
        regularSkins: [
            { id: 'default', name: 'Default', emoji: '👤', price: 0 },
            { id: 'boy_student', name: 'Boy Student', emoji: '👦', price: 100 },
            { id: 'girl_student', name: 'Girl Student', emoji: '👧', price: 100 },
            { id: 'man', name: 'Man', emoji: '👨', price: 150 },
            { id: 'woman', name: 'Woman', emoji: '👩', price: 150 },
            { id: 'teacher', name: 'Teacher', emoji: '👨‍🏫', price: 200 },
            { id: 'scientist', name: 'Scientist', emoji: '👨‍🔬', price: 250 },
            { id: 'wizard', name: 'Wizard', emoji: '🧙', price: 300 },
            { id: 'ninja', name: 'Ninja', emoji: '🥷', price: 350 },
            { id: 'astronaut', name: 'Astronaut', emoji: '👨‍🚀', price: 400 }
        ],
        legendarySkins: [
            { id: 'robot', name: 'Robot', emoji: '🤖', price: 5, currency: 'crystals' },
            { id: 'alien', name: 'Alien', emoji: '👽', price: 5, currency: 'crystals' },
            { id: 'dragon', name: 'Dragon', emoji: '🐉', price: 10, currency: 'crystals' },
            { id: 'unicorn', name: 'Unicorn', emoji: '🦄', price: 10, currency: 'crystals' },
            { id: 'king', name: 'King', emoji: '🤴', price: 15, currency: 'crystals' },
            { id: 'queen', name: 'Queen', emoji: '👸', price: 15, currency: 'crystals' }
        ],
        pets: [
            { id: 'cat', name: 'Cat', emoji: '🐱', price: 200 },
            { id: 'dog', name: 'Dog', emoji: '🐶', price: 200 },
            { id: 'rabbit', name: 'Rabbit', emoji: '🐰', price: 250 },
            { id: 'fox', name: 'Fox', emoji: '🦊', price: 300 },
            { id: 'panda', name: 'Panda', emoji: '🐼', price: 350 },
            { id: 'lion', name: 'Lion', emoji: '🦁', price: 500 },
            { id: 'dragon_pet', name: 'Dragon', emoji: '🐉', price: 10, currency: 'crystals' },
            { id: 'phoenix', name: 'Phoenix', emoji: '🔥', price: 15, currency: 'crystals' }
        ]
    },

    defaultStats() {
        return {
            level: 1, xp: 0, points: 0, crystals: 0, totalQuestions: 0,
            correctAnswers: 0, gamesPlayed: 0, bestStreak: 0, perfectGames: 0,
            pointsSpent: 0, crystalsSpent: 0
        };
    },

    createDefaultData() {
        return {
            version: this.VERSION,
            lastSaved: Date.now(),
            settings: { sfxVolume: 70, musicVolume: 50, isMuted: false, questionsPerGame: 10 },
            profiles: [], currentProfileId: null,
            globalStats: { totalQuestions: 0, correctAnswers: 0, gamesPlayed: 0, perfectGames: 0 },
            shopInventory: this.getDefaultCatalogue()
        };
    },

    getDefaultCatalogue() {
        return Object.fromEntries(Object.entries(this.CATALOGUE).map(([key, entries]) =>
            [key, entries.map(item => ({ ...item }))]));
    },

    init() { this.load(); },

    isValidStructure(data) {
        return data && typeof data === 'object' && !Array.isArray(data) &&
            Array.isArray(data.profiles) && data.profiles.length <= 100 &&
            data.profiles.every(p => p && typeof p === 'object' && !Array.isArray(p) &&
                typeof p.id === 'string' && p.id.length > 0 && p.id.length <= 100 &&
                typeof p.name === 'string' && p.name.length <= 100 &&
                p.stats && typeof p.stats === 'object' && !Array.isArray(p.stats)) &&
            new Set(data.profiles.map(p => p.id)).size === data.profiles.length;
    },

    load() {
        let stored;
        try {
            stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) {
                this.data = this.createDefaultData();
                return;
            }
            const parsed = JSON.parse(stored);
            if (!this.isValidStructure(parsed)) throw new Error('Invalid stored game data');
            this.data = parsed;
            this.migrateProfiles();
            this.getShopItems();
            this.save();
        } catch (error) {
            console.error('Error loading save:', error);
            // Keep a recoverable copy rather than silently discarding unreadable progress.
            if (stored) {
                try { localStorage.setItem(`${this.STORAGE_KEY}.recovery.${Date.now()}`, stored); }
                catch (backupError) { console.error('Could not back up invalid save:', backupError); }
            }
            this.data = this.createDefaultData();
            this.lastSaveError = 'Saved data could not be loaded. Use Import to restore a backup.';
            if (typeof document !== 'undefined') {
                const warning = document.getElementById('save-warning');
                if (warning) { warning.textContent = this.lastSaveError; warning.hidden = false; }
            }
        }
    },

    nonnegative(value, fallback = 0) {
        return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
    },

    // Called on existing saves AND imports. Never reset valid pet XP/levels.
    migrateProfiles() {
        const defaults = this.createDefaultData();
        if (!this.data.settings || typeof this.data.settings !== 'object' || Array.isArray(this.data.settings)) {
            this.data.settings = defaults.settings;
        }
        const settings = this.data.settings;
        settings.sfxVolume = Utils.clamp(this.nonnegative(Number(settings.sfxVolume), 70), 0, 100);
        settings.musicVolume = Utils.clamp(this.nonnegative(Number(settings.musicVolume), 50), 0, 100);
        settings.isMuted = settings.isMuted === true;
        settings.questionsPerGame = [5, 10, 15, 20].includes(Number(settings.questionsPerGame)) ? Number(settings.questionsPerGame) : 10;
        if (!this.data.globalStats || typeof this.data.globalStats !== 'object') this.data.globalStats = defaults.globalStats;
        for (const [key, defaultValue] of Object.entries(defaults.globalStats)) {
            this.data.globalStats[key] = this.nonnegative(this.data.globalStats[key], defaultValue);
        }

        const legacyShop = this.data.shopInventory || {};
        for (const profile of this.data.profiles) {
            const oldStats = profile.stats;
            for (const [key, defaultValue] of Object.entries(this.defaultStats())) {
                oldStats[key] = this.nonnegative(oldStats[key], defaultValue);
            }
            oldStats.level = Math.max(1, Math.floor(oldStats.level));
            // Do not erase old correct-answer counts if an older save lacked totals.
            oldStats.totalQuestions = Math.max(oldStats.totalQuestions, oldStats.correctAnswers);
            profile.achievements = Array.isArray(profile.achievements) ? [...new Set(profile.achievements.filter(x => typeof x === 'string'))] : [];
            profile.unlockedGrades = Array.isArray(profile.unlockedGrades) ?
                [...new Set(profile.unlockedGrades.filter(g => Number.isInteger(g) && g >= 0 && g <= 12))] : [0, 1, 2];
            const previousCategoryStats = profile.categoryStats && typeof profile.categoryStats === 'object' && !Array.isArray(profile.categoryStats) ? profile.categoryStats : {};
            profile.categoryStats = Object.create(null);
            for (const key of ['arithmetic', 'algebra', 'geometry', 'trigonometry', 'calculus', 'physics', 'reading', 'writing', 'science', 'history', 'economics', 'politics', 'civics', 'astronomy', 'statistics', 'biology', 'chemistry', 'computer_science', 'logic', 'research']) {
                const entry = previousCategoryStats[key];
                if (!entry || typeof entry !== 'object') continue;
                const correctAnswers = this.nonnegative(entry.correctAnswers);
                profile.categoryStats[key] = {
                    totalQuestions: Math.max(this.nonnegative(entry.totalQuestions), correctAnswers),
                    correctAnswers
                };
            }
            if (typeof ReadinessLab !== 'undefined') ReadinessLab.ensure(profile);
            profile.recentQuestionKeys = Array.isArray(profile.recentQuestionKeys) ?
                profile.recentQuestionKeys.filter(k => typeof k === 'string' && /^q[0-9a-f]{8}$/.test(k)).slice(-250) : [];
            profile.pets = Array.isArray(profile.pets) ? profile.pets.filter(p => p && typeof p === 'object' && typeof p.id === 'string' && p.id.length > 0) : [];
            // Permanently lost animals are kept as history, not as adoptable pets.
            profile.petHistory = Array.isArray(profile.petHistory) ? profile.petHistory.filter(p =>
                p && typeof p === 'object' && typeof p.id === 'string' &&
                ['died', 'ran_away'].includes(p.fate) && Number.isFinite(p.lostAt)).slice(-500) : [];
            const stillActive = [];
            for (const pet of profile.pets) {
                if (pet.fate === 'died' || pet.fate === 'ran_away') {
                    profile.petHistory.push({ ...pet, lostAt: Number.isFinite(pet.lostAt) ? pet.lostAt : Date.now() });
                } else stillActive.push(pet);
            }
            profile.pets = stillActive;
            // Old versions stored ownership in a shared catalogue. Retain every recorded
            // owned item when adopting that version's profile data.
            if (!Array.isArray(profile.ownedItems)) {
                profile.ownedItems = ['default', ...(typeof profile.skin === 'string' ? [profile.skin] : [])];
                for (const category of Object.keys(this.CATALOGUE)) {
                    for (const item of (Array.isArray(legacyShop[category]) ? legacyShop[category] : [])) {
                        if (item?.owned && typeof item.id === 'string') profile.ownedItems.push(item.id);
                    }
                }
            }
            profile.ownedItems = [...new Set(['default', ...profile.ownedItems.filter(x => typeof x === 'string')])];
            for (const pet of profile.pets) {
                const cataloguePet = this.CATALOGUE.pets.find(p => p.id === pet.id);
                pet.name = typeof pet.name === 'string' && pet.name.length <= 50 ? pet.name : cataloguePet?.name || 'Pet';
                pet.emoji = typeof pet.emoji === 'string' && pet.emoji.length <= 20 ? pet.emoji : cataloguePet?.emoji || '🐾';
                pet.level = Math.max(1, Math.floor(this.nonnegative(pet.level, 1)));
                pet.xp = this.nonnegative(pet.xp);
                pet.happiness = Utils.clamp(this.nonnegative(pet.happiness, 80), 0, 100);
                pet.hunger = Utils.clamp(this.nonnegative(pet.hunger, 50), 0, 100);
                pet.interactions = Math.floor(this.nonnegative(pet.interactions));
                // On upgrading an old save, start care timing now. Adoption dates
                // may be years old and must not cause immediate retroactive death.
                if (!Number.isFinite(pet.careUpdatedAt) || pet.careUpdatedAt <= 0) pet.careUpdatedAt = Date.now();
                pet.starvingSince = pet.hunger >= 100 && Number.isFinite(pet.starvingSince) &&
                    pet.starvingSince > 0 && pet.starvingSince <= pet.careUpdatedAt ? pet.starvingSince :
                    (pet.hunger >= 100 ? pet.careUpdatedAt : null);
                pet.unhappySince = pet.happiness <= 0 && Number.isFinite(pet.unhappySince) &&
                    pet.unhappySince > 0 && pet.unhappySince <= pet.careUpdatedAt ? pet.unhappySince :
                    (pet.happiness <= 0 ? pet.careUpdatedAt : null);
                if (!profile.ownedItems.includes(pet.id)) profile.ownedItems.push(pet.id);
            }
            // If legacy data recorded a purchased pet without its pet object, restore
            // the pet so the owner can select it. Unknown pet-level history cannot
            // be recreated, so use level 1 instead of inventing past progression.
            for (const cataloguePet of this.CATALOGUE.pets) {
                if (profile.ownedItems.includes(cataloguePet.id) &&
                    !profile.pets.some(p => p.id === cataloguePet.id) &&
                    !profile.petHistory.some(p => p.id === cataloguePet.id)) {
                    profile.pets.push({ id: cataloguePet.id, name: cataloguePet.name,
                        emoji: cataloguePet.emoji, adoptedAt: null,
                        level: 1, xp: 0, happiness: 80, hunger: 50, interactions: 0,
                        careUpdatedAt: Date.now(), starvingSince: null, unhappySince: null });
                }
            }
            profile.pets = profile.pets.filter((p, i, pets) => pets.findIndex(t => t.id === p.id) === i);
            // Old ownership ledgers must not magically recreate dead/runaway pets.
            profile.ownedItems = profile.ownedItems.filter(id =>
                !this.CATALOGUE.pets.some(p => p.id === id) ||
                profile.pets.some(p => p.id === id));
            profile.petHistory = profile.petHistory.slice(-500);
            const oldSelection = typeof profile.selectedPet === 'object' ? profile.selectedPet?.id : profile.selectedPet;
            profile.selectedPet = profile.pets.some(p => p.id === oldSelection) ? oldSelection : (profile.pets[0]?.id || null);
            profile.skin = typeof profile.skin === 'string' && profile.ownedItems.includes(profile.skin) ? profile.skin : 'default';
            const equipped = [...this.CATALOGUE.regularSkins, ...this.CATALOGUE.legendarySkins].find(x => x.id === profile.skin);
            profile.avatar = equipped?.emoji && profile.skin !== 'default' ? equipped.emoji :
                (typeof profile.avatar === 'string' ? profile.avatar : '👤');
            // Tracking older spending accurately is impossible without a transaction log.
            if (!profile.economyTrackingSince) profile.economyTrackingSince = Date.now();
        }
        if (!this.data.profiles.some(p => p.id === this.data.currentProfileId)) {
            this.data.currentProfileId = this.data.profiles[0]?.id || null;
        }
        this.data.version = this.VERSION;
    },

    save() {
        try {
            // Update every profile before saving, even when the player is
            // studying instead of visiting the pet room.
            if (typeof PetManager !== 'undefined') PetManager.refreshAll(Date.now());
            this.data.lastSaved = Date.now();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
            this.lastSaveError = null;
            if (typeof document !== 'undefined') {
                const warning = document.getElementById('save-warning');
                if (warning) warning.hidden = true;
            }
            return true;
        } catch (error) {
            this.lastSaveError = 'Progress cannot be saved on this device. Export a backup before closing the game.';
            if (typeof document !== 'undefined') {
                const warning = document.getElementById('save-warning');
                if (warning) { warning.textContent = this.lastSaveError; warning.hidden = false; }
            }
            console.error('Error saving:', error);
            return false;
        }
    },

    createProfile(name) {
        const profile = {
            id: Utils.generateId(), name: name.trim(), avatar: '👤', skin: 'default',
            stats: this.defaultStats(), unlockedGrades: [0, 1, 2], ownedItems: ['default'],
            achievements: [], pets: [], petHistory: [], selectedPet: null, categoryStats: {}, recentQuestionKeys: [],
            economyTrackingSince: Date.now(), readiness: {track:'balanced',sessions:[],portfolio:[],diagnosticResults:[],checkpoints:[]}
        };
        this.data.profiles.push(profile);
        this.data.currentProfileId = profile.id;
        this.save();
        return profile;
    },

    getCurrentProfile() { return this.data?.profiles.find(p => p.id === this.data.currentProfileId) || null; },
    getProfiles() { return this.data?.profiles || []; },

    deleteProfile(id) {
        const index = this.data.profiles.findIndex(p => p.id === id);
        if (index === -1) return false;
        this.data.profiles.splice(index, 1);
        if (this.data.currentProfileId === id) this.data.currentProfileId = this.data.profiles[0]?.id || null;
        this.save();
        return true;
    },

    setCurrentProfile(id) {
        if (!this.data.profiles.some(p => p.id === id)) return false;
        this.data.currentProfileId = id;
        this.save();
        return true;
    },

    updateProfile(id, updates) {
        const profile = this.data.profiles.find(p => p.id === id);
        if (!profile || !updates || typeof updates !== 'object') return false;
        // This method is for display-level metadata, not arbitrary state replacement.
        for (const key of ['name', 'avatar']) {
            if (typeof updates[key] === 'string') profile[key] = updates[key];
        }
        this.save();
        return true;
    },

    reset() {
        if (!confirm('Delete ALL profiles and progress? This cannot be undone without an exported save.')) return false;
        this.data = this.createDefaultData();
        this.save();
        return true;
    },

    export() { return JSON.stringify(this.data, null, 2); },

    import(jsonString) {
        try {
            if (typeof jsonString !== 'string' || jsonString.length > 10_000_000) {
                return { success: false, error: 'Save file is too large or invalid' };
            }
            const incoming = JSON.parse(jsonString);
            if (!this.isValidStructure(incoming)) return { success: false, error: 'Invalid save structure' };
            if (!confirm('Replace all current profiles with this save? Export your existing save first.')) {
                return { success: false, error: 'Import cancelled' };
            }
            // Only swap data after successful validation/migration; restore on failure.
            const previous = this.data;
            try {
                this.data = incoming;
                this.migrateProfiles();
                this.getShopItems();
                if (!this.save()) throw new Error('Storage unavailable; import not saved');
                return { success: true };
            } catch (error) {
                this.data = previous;
                return { success: false, error: error.message };
            }
        } catch (error) { return { success: false, error: error.message }; }
    },

    getSettings() { return this.data.settings; },

    updateSettings(updates) {
        Object.assign(this.data.settings, updates);
        this.migrateProfiles();
        this.save();
    },

    getShopItems() {
        // Canonical prices/names come from code, not potentially stale or edited
        // localStorage. The legacy shop stays readable during migrateProfiles().
        const shop = this.getDefaultCatalogue();
        this.data.shopInventory = shop;
        return shop;
    }

};

window.SaveManager = SaveManager;
