/**
 * Math Quest - Progression System
 * Handles grade progression and unlocks
 */

const ProgressionSystem = {
    grades: [],
    
    init() {
        this.grades = this.defineGrades();
        console.log('ProgressionSystem initialized');
    },

    defineGrades() {
        return [
            { grade: 0, name: 'Kindergarten', icon: '🌱', theme: 'Forest', minLevel: 1 },
            { grade: 1, name: 'Grade 1', icon: '🌳', theme: 'Forest', minLevel: 1 },
            { grade: 2, name: 'Grade 2', icon: '🍃', theme: 'Forest', minLevel: 1 },
            { grade: 3, name: 'Grade 3', icon: '🏡', theme: 'Village', minLevel: 2 },
            { grade: 4, name: 'Grade 4', icon: '🏘️', theme: 'Village', minLevel: 3 },
            { grade: 5, name: 'Grade 5', icon: '🏞️', theme: 'Village', minLevel: 4 },
            { grade: 6, name: 'Grade 6', icon: '🏢', theme: 'City', minLevel: 5 },
            { grade: 7, name: 'Grade 7', icon: '🏙️', theme: 'City', minLevel: 6 },
            { grade: 8, name: 'Grade 8', icon: '🌆', theme: 'City', minLevel: 7 },
            { grade: 9, name: 'Grade 9', icon: '⛰️', theme: 'Mountains', minLevel: 8 },
            { grade: 10, name: 'Grade 10', icon: '🏔️', theme: 'Mountains', minLevel: 9 },
            { grade: 11, name: 'Grade 11', icon: '🌌', theme: 'Cosmos', minLevel: 10 },
            { grade: 12, name: 'Grade 12', icon: '✨', theme: 'Cosmos', minLevel: 11 }
        ];
    },

    getGradeInfo(gradeLevel) {
        return this.grades.find(g => g.grade === gradeLevel) || this.grades[0];
    },

    isGradeUnlocked(gradeLevel) {
        return ProfileSystem.isGradeUnlocked(gradeLevel);
    },

    canUnlockGrade(gradeLevel) {
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return false;

        const gradeInfo = this.getGradeInfo(gradeLevel);
        return profile.stats.level >= gradeInfo.minLevel;
    },

    unlockGrade(gradeLevel) {
        if (this.canUnlockGrade(gradeLevel)) {
            const profile = ProfileSystem.getCurrentProfile();
            if (profile && !profile.unlockedGrades.includes(gradeLevel)) {
                profile.unlockedGrades.push(gradeLevel);
                SaveManager.save();
                return true;
            }
        }
        return false;
    },

    getUnlockedGrades() {
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return [];
        return profile.unlockedGrades;
    },

    updateGradeProgress(gradeLevel, questionsCompleted, questionsCorrect) {
        // Check if next grade should be unlocked
        const nextGrade = gradeLevel + 1;
        if (nextGrade <= 12 && this.canUnlockGrade(nextGrade)) {
            this.unlockGrade(nextGrade);
        }
    },

    selectGrade(gradeLevel) {
        MathEngine.setGrade(gradeLevel);
        AudioSystem.playClick();
    },

    getAdaptiveDifficulty(accuracy) {
        if (accuracy >= 90) return 'hard';
        if (accuracy >= 70) return 'medium';
        return 'easy';
    },

    calculateXPReward(questionsCorrect, totalQuestions, streak, timeTaken) {
        let baseXP = questionsCorrect * 10;
        
        // Accuracy bonus
        const accuracy = (questionsCorrect / totalQuestions) * 100;
        if (accuracy >= 90) baseXP *= 1.5;
        else if (accuracy >= 75) baseXP *= 1.25;
        
        // Streak bonus
        const streakBonus = Math.floor(streak * 5);
        
        // Speed bonus (if completed quickly)
        const speedBonus = timeTaken < 300 ? 20 : 0;
        
        return Math.round(baseXP + streakBonus + speedBonus);
    },

    checkLevelUp() {
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return false;

        const xpNeeded = ProfileSystem.getXPNeededForLevel(profile.stats.level + 1);
        return profile.stats.xp >= xpNeeded;
    }
};

window.ProgressionSystem = ProgressionSystem;
