/**
 * Math Quest - Reward System & Achievements
 */

const RewardSystem = {
    achievements: [],
    
    init() {
        this.generateAchievements();
    },
    
    generateAchievements() {
        this.achievements = [
            // Streak achievements
            { id: 'streak_5', name: 'On Fire!', desc: 'Get a 5-question streak', category: 'streak', requirement: 5, reward: { points: 50 }, check: (s) => s.bestStreak >= 5 },
            { id: 'streak_10', name: 'Unstoppable!', desc: 'Get a 10-question streak', category: 'streak', requirement: 10, reward: { points: 100, crystals: 1 }, check: (s) => s.bestStreak >= 10 },
            { id: 'streak_25', name: 'Legendary!', desc: 'Get a 25-question streak', category: 'streak', requirement: 25, reward: { points: 250, crystals: 2 }, check: (s) => s.bestStreak >= 25 },
            
            // Accuracy achievements
            { id: 'perfect_game', name: 'Perfect Game', desc: 'Answer all questions correctly in one game', category: 'accuracy', reward: { points: 100, crystals: 1 }, check: (s, g) => g?.perfect },
            { id: 'accuracy_50', name: 'Getting Better', desc: 'Answer 50 questions correctly', category: 'accuracy', requirement: 50, reward: { points: 100 }, check: (s) => s.correctAnswers >= 50 },
            { id: 'accuracy_100', name: 'Math Whiz', desc: 'Answer 100 questions correctly', category: 'accuracy', requirement: 100, reward: { points: 250, crystals: 1 }, check: (s) => s.correctAnswers >= 100 },
            { id: 'accuracy_500', name: 'Math Master', desc: 'Answer 500 questions correctly', category: 'accuracy', requirement: 500, reward: { points: 1000, crystals: 5 }, check: (s) => s.correctAnswers >= 500 },
            
            // Volume achievements
            { id: 'games_10', name: 'Dedicated', desc: 'Play 10 games', category: 'volume', requirement: 10, reward: { points: 100 }, check: (s) => s.gamesPlayed >= 10 },
            { id: 'games_50', name: 'Committed', desc: 'Play 50 games', category: 'volume', requirement: 50, reward: { points: 300, crystals: 1 }, check: (s) => s.gamesPlayed >= 50 },
            { id: 'games_100', name: 'Math Addict', desc: 'Play 100 games', category: 'volume', requirement: 100, reward: { points: 500, crystals: 3 }, check: (s) => s.gamesPlayed >= 100 },
            
            // Progression achievements
            { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', category: 'progression', requirement: 5, reward: { points: 100 }, check: (s) => s.level >= 5 },
            { id: 'level_10', name: 'Experienced', desc: 'Reach level 10', category: 'progression', requirement: 10, reward: { points: 250, crystals: 1 }, check: (s) => s.level >= 10 },
            { id: 'level_20', name: 'Veteran', desc: 'Reach level 20', category: 'progression', requirement: 20, reward: { points: 500, crystals: 3 }, check: (s) => s.level >= 20 },
            
            // Grade unlock achievements
            { id: 'grade_3', name: 'Elementary Graduate', desc: 'Unlock Grade 3', category: 'progression', reward: { points: 50 }, check: (s, g) => s.highestGradeUnlocked >= 3 },
            { id: 'grade_6', name: 'Middle Schooler', desc: 'Unlock Grade 6', category: 'progression', reward: { points: 100, crystals: 1 }, check: (s, g) => s.highestGradeUnlocked >= 6 },
            { id: 'grade_9', name: 'High Schooler', desc: 'Unlock Grade 9', category: 'progression', reward: { points: 250, crystals: 2 }, check: (s, g) => s.highestGradeUnlocked >= 9 },
            { id: 'grade_12', name: 'Math Graduate', desc: 'Unlock Grade 12', category: 'progression', reward: { points: 500, crystals: 5 }, check: (s, g) => s.highestGradeUnlocked >= 12 },
            
            // First steps
            { id: 'first_question', name: 'First Steps', desc: 'Answer your first question', category: 'volume', reward: { points: 10 }, check: (s) => s.totalQuestions >= 1 },
            { id: 'first_game', name: 'Game On', desc: 'Complete your first game', category: 'volume', reward: { points: 25 }, check: (s) => s.gamesPlayed >= 1 }
        ];
    },
    
    checkAchievements(stats, gameResults) {
        const unlocked = [];
        const profile = ProfileSystem.getCurrentProfile();
        
        if (!profile) return unlocked;
        
        for (const achievement of this.achievements) {
            if (profile.achievements?.includes(achievement.id)) continue;
            
            if (achievement.check(stats, gameResults)) {
                unlocked.push(achievement);
                profile.achievements.push(achievement.id);
                
                // Grant rewards
                if (achievement.reward.points) {
                    ProfileSystem.addPoints(achievement.reward.points);
                }
                if (achievement.reward.crystals) {
                    ProfileSystem.addCrystals(achievement.reward.crystals);
                }
            }
        }
        
        if (unlocked.length > 0) {
            SaveManager.save();
        }
        
        return unlocked;
    },
    
    getAllAchievements() {
        return this.achievements;
    },
    
    getUnlockedAchievements() {
        const profile = ProfileSystem.getCurrentProfile();
        return profile?.achievements || [];
    },
    
    getAchievementById(id) {
        return this.achievements.find(a => a.id === id);
    }
};

window.RewardSystem = RewardSystem;
