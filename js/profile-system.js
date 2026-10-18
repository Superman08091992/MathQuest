/**
 * Math Quest - Profile System
 * Handles user profiles, creation, selection, and management
 */

const ProfileSystem = {
    init() {
        // Profile system is ready
        console.log('ProfileSystem initialized');
    },

    /**
     * Create a new profile
     */
    createProfile(name) {
        if (!name || name.trim().length === 0) {
            return { success: false, error: 'Please enter a name' };
        }
        
        if (name.trim().length > 20) {
            return { success: false, error: 'Name must be 20 characters or less' };
        }

        const profile = SaveManager.createProfile(name.trim());
        return { success: true, profile };
    },

    /**
     * Get all profiles
     */
    getProfiles() {
        return SaveManager.getProfiles();
    },

    /**
     * Select a profile as current
     */
    selectProfile(id) {
        const result = SaveManager.setCurrentProfile(id);
        return result;
    },

    /**
     * Delete a profile
     */
    deleteProfile(id) {
        const result = SaveManager.deleteProfile(id);
        return result;
    },

    /**
     * Get the current active profile
     */
    getCurrentProfile() {
        return SaveManager.getCurrentProfile();
    },

    /**
     * Check if a grade is unlocked for current profile
     */
    isGradeUnlocked(grade) {
        const profile = this.getCurrentProfile();
        if (!profile) return false;
        
        // Level-based unlocking: each level unlocks the next grade
        // Level 1 = Grade K unlocked (0)
        // Level 2 = Grade K, 1 unlocked (up to 1)
        // etc.
        // Starting realms: K, 1 and 2; each new level unlocks another grade.
        const maxUnlockedGrade = Math.min(12, profile.stats.level + 1);
        return grade <= maxUnlockedGrade;
    },

    /**
     * Add XP to current profile and handle level ups
     */
    addXP(amount) {
        const profile = this.getCurrentProfile();
        if (!profile || !Number.isFinite(amount) || amount < 0) return { leveledUp: false };

        profile.stats.xp += amount;
        
        let leveledUp = false;
        let newLevel = profile.stats.level;
        
        // Check for level up - XP needed = level * 100
        while (profile.stats.xp >= this.getXPNeededForLevel(newLevel + 1)) {
            profile.stats.xp -= this.getXPNeededForLevel(newLevel + 1);
            newLevel++;
            leveledUp = true;
        }
        
        if (leveledUp) {
            profile.stats.level = newLevel;
            // Unlock new grades based on level
            for (let g = 0; g <= 12; g++) {
                if (this.isGradeUnlocked(g) && !profile.unlockedGrades.includes(g)) {
                    profile.unlockedGrades.push(g);
                }
            }
        }
        
        SaveManager.save();
        return { leveledUp, newLevel };
    },

    /**
     * Get XP needed for a level
     */
    getXPNeededForLevel(level) {
        // XP required to advance from the preceding level.
        return Math.max(100, (level - 1) * 100);
    },

    /**
     * Add points to current profile
     */
    addPoints(amount) {
        const profile = this.getCurrentProfile();
        if (!profile || !Number.isFinite(amount) || amount < 0) return false;
        profile.stats.points += amount;
        SaveManager.save();
    },

    /**
     * Add crystals to current profile
     */
    addCrystals(amount) {
        const profile = this.getCurrentProfile();
        if (!profile || !Number.isFinite(amount) || amount < 0) return false;
        profile.stats.crystals += amount;
        SaveManager.save();
    },

    /**
     * Deduct points from current profile
     */
    deductPoints(amount) {
        const profile = this.getCurrentProfile();
        if (!profile || !Number.isFinite(amount) || amount < 0) return false;
        if (profile.stats.points < amount) return false;
        profile.stats.points -= amount;
        profile.stats.pointsSpent += amount;
        SaveManager.save();
        return true;
    },

    /**
     * Deduct crystals from current profile
     */
    deductCrystals(amount) {
        const profile = this.getCurrentProfile();
        if (!profile || !Number.isFinite(amount) || amount < 0) return false;
        if (profile.stats.crystals < amount) return false;
        profile.stats.crystals -= amount;
        profile.stats.crystalsSpent += amount;
        SaveManager.save();
        return true;
    }
};

window.ProfileSystem = ProfileSystem;
