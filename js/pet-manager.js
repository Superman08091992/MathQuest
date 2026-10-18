/** Pet stats exist only on owned pets; never display fabricated pet progress. */
const PetManager = {
    INTERACTION_COSTS: { feed: 10, play: 15, pet: 5, train: 20, treat: 1 },

    getCurrentPet() {
        const profile = ProfileSystem.getCurrentProfile();
        return profile?.pets?.find(p => p.id === profile.selectedPet) || null;
    },

    interact(action) {
        const profile = ProfileSystem.getCurrentProfile();
        const pet = this.getCurrentPet();
        if (!pet) return { success: false, error: 'Adopt or select a pet first' };
        if (!Object.hasOwn(this.INTERACTION_COSTS, action)) return { success: false, error: 'Unknown pet interaction' };
        const cost = this.INTERACTION_COSTS[action];
        const currency = action === 'treat' ? 'crystals' : 'points';
        if (profile.stats[currency] < cost) return { success: false, error: `Not enough ${currency}` };

        const previousPet = Utils.deepClone(pet);
        const previousBalance = profile.stats[currency];
        const spentKey = currency === 'points' ? 'pointsSpent' : 'crystalsSpent';
        const previousSpent = profile.stats[spentKey];
        profile.stats[currency] -= cost;
        profile.stats[currency === 'points' ? 'pointsSpent' : 'crystalsSpent'] += cost;
        let xpGain = 0;
        switch (action) {
            case 'feed':
                pet.hunger = Math.max(0, pet.hunger - 20);
                xpGain = 5;
                break;
            case 'play':
                pet.happiness = Math.min(100, pet.happiness + 15);
                pet.hunger = Math.min(100, pet.hunger + 10);
                xpGain = 10;
                break;
            case 'pet':
                pet.happiness = Math.min(100, pet.happiness + 10);
                xpGain = 3;
                break;
            case 'train':
                pet.happiness = Math.max(0, pet.happiness - 5);
                xpGain = 20;
                break;
            case 'treat':
                pet.happiness = Math.min(100, pet.happiness + 25);
                pet.hunger = Math.max(0, pet.hunger - 10);
                xpGain = 15;
                break;
        }
        pet.interactions = (pet.interactions || 0) + 1;
        const levelsGained = this.addPetXP(pet, xpGain);
        if (!SaveManager.save()) {
            Object.assign(pet, previousPet);
            profile.stats[currency] = previousBalance;
            profile.stats[spentKey] = previousSpent;
            return { success: false, error: 'Pet interaction could not be saved. Check storage and try again.' };
        }
        return { success: true, levelUp: levelsGained > 0, levelsGained, newLevel: pet.level };
    },

    addPetXP(pet, amount) {
        if (!Number.isFinite(amount) || amount < 0) return 0;
        pet.xp += amount;
        let levels = 0;
        while (pet.xp >= pet.level * 50) {
            pet.xp -= pet.level * 50;
            pet.level++;
            levels++;
        }
        return levels;
    },

    getPetEmoji(pet) { return pet.emoji; },

    getPetStatus(pet) {
        if (pet.hunger > 70) return { text: 'Hungry', class: 'warning' };
        if (pet.happiness < 30) return { text: 'Sad', class: 'warning' };
        if (pet.happiness > 80 && pet.hunger < 30) return { text: 'Very happy!', class: 'excellent' };
        return { text: 'Content', class: 'normal' };
    }
};
window.PetManager = PetManager;
