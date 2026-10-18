/**
 * Pet care simulation. Hunger is 0 (full) to 100 (starving); happiness is
 * 100 (content) to 0 (miserable). All elapsed time uses saved wall-clock
 * timestamps, so returning after days offline has the same result as playing.
 * Pet death/departure is permanent within normal gameplay and recorded per
 * profile. The local device's clock is the time authority; see PET_CARE.md.
 */
const PetManager = {
    INTERACTION_COSTS: { feed: 10, play: 15, pet: 5, train: 20, treat: 1 },
    HOUR_MS: 60 * 60 * 1000,
    HUNGER_PER_HOUR: 2,
    HAPPINESS_LOSS_PER_HOUR: 1.25,
    STARVATION_GRACE_HOURS: 36,
    RUNAWAY_GRACE_HOURS: 48,

    // Pure, chronological advancement of one pet. Never award XP for waiting.
    advancePet(pet, timestamp = Date.now()) {
        if (!pet || !Number.isFinite(timestamp)) return { changed: false, loss: null };
        const last = pet.careUpdatedAt;
        if (!Number.isFinite(last) || last <= 0) {
            // Legacy pets receive their first care timestamp on upgrade. They
            // are not punished retroactively for time before this feature existed.
            pet.careUpdatedAt = timestamp;
            pet.starvingSince = pet.hunger >= 100 ? timestamp : null;
            pet.unhappySince = pet.happiness <= 0 ? timestamp : null;
            return { changed: true, loss: null };
        }
        const now = Math.max(timestamp, last); // Ignore backwards clock jumps.
        if (now === last) return { changed: false, loss: null };
        const hungerRate = this.HUNGER_PER_HOUR / this.HOUR_MS;
        const happinessRate = this.HAPPINESS_LOSS_PER_HOUR / this.HOUR_MS;
        const hungerStart = Utils.clamp(pet.hunger, 0, 100);
        const happinessStart = Utils.clamp(pet.happiness, 0, 100);
        // Derive the threshold crossing instant, not merely the final state.
        // This makes a single 10-day offline update identical to hourly ticks.
        const fullAt = hungerStart >= 100 ?
            (Number.isFinite(pet.starvingSince) ? Math.min(pet.starvingSince, last) : last) :
            last + (100 - hungerStart) / hungerRate;
        const unhappyAt = happinessStart <= 0 ?
            (Number.isFinite(pet.unhappySince) ? Math.min(pet.unhappySince, last) : last) :
            last + happinessStart / happinessRate;
        const deathAt = fullAt + this.STARVATION_GRACE_HOURS * this.HOUR_MS;
        const departureAt = unhappyAt + this.RUNAWAY_GRACE_HOURS * this.HOUR_MS;
        const deathFirst = deathAt <= departureAt;
        const lossAt = deathFirst ? deathAt : departureAt;
        const loss = lossAt <= now ? {
            fate: deathFirst ? 'died' : 'ran_away',
            reason: deathFirst ? 'starvation' : 'neglect',
            lostAt: Math.round(lossAt)
        } : null;
        const end = loss ? lossAt : now;
        const elapsed = (end - last) / this.HOUR_MS;
        pet.hunger = Utils.clamp(hungerStart + this.HUNGER_PER_HOUR * elapsed, 0, 100);
        pet.happiness = Utils.clamp(happinessStart - this.HAPPINESS_LOSS_PER_HOUR * elapsed, 0, 100);
        pet.careUpdatedAt = Math.round(end);
        pet.starvingSince = pet.hunger >= 100 ? fullAt : null;
        pet.unhappySince = pet.happiness <= 0 ? unhappyAt : null;
        return { changed: true, loss };
    },

    refreshProfile(profile, timestamp = Date.now()) {
        if (!profile || !Array.isArray(profile.pets)) return { changed: false, losses: [] };
        let changed = false;
        const losses = [];
        for (const pet of [...profile.pets]) {
            const result = this.advancePet(pet, timestamp);
            if (result.changed) changed = true;
            if (!result.loss) continue;
            // Preserve the individual pet's identity, earned levels and fate.
            const record = { ...pet, ...result.loss };
            if (!Array.isArray(profile.petHistory)) profile.petHistory = [];
            profile.petHistory.push(record);
            losses.push(record);
            profile.pets = profile.pets.filter(p => p !== pet);
            // A species can be purchased again, but the lost pet cannot be revived.
            if (!profile.pets.some(p => p.id === pet.id)) {
                profile.ownedItems = (profile.ownedItems || []).filter(id => id !== pet.id);
            }
        }
        if (!profile.pets.some(p => p.id === profile.selectedPet)) {
            const selection = profile.pets[0]?.id || null;
            if (profile.selectedPet !== selection) changed = true;
            profile.selectedPet = selection;
        }
        return { changed, losses };
    },

    refreshAll(timestamp = Date.now()) {
        const profiles = SaveManager.data?.profiles || [];
        let changed = false;
        const losses = [];
        for (const profile of profiles) {
            const result = this.refreshProfile(profile, timestamp);
            changed = result.changed || changed;
            losses.push(...result.losses);
        }
        return { changed, losses };
    },

    // Before any interaction or shop action, resolve time-based consequences.
    refreshAndSave() {
        const result = this.refreshAll();
        if (result.changed && !SaveManager.save()) {
            return { ...result, error: 'Pet progress could not be saved. Check storage and try again.' };
        }
        return result;
    },

    getCurrentPet() {
        const profile = ProfileSystem.getCurrentProfile();
        return profile?.pets?.find(p => p.id === profile.selectedPet) || null;
    },

    interact(action) {
        if (!Object.hasOwn(this.INTERACTION_COSTS, action)) return { success: false, error: 'Unknown pet interaction' };
        const refresh = this.refreshAndSave();
        if (refresh.error) return { success: false, error: refresh.error };
        const profile = ProfileSystem.getCurrentProfile();
        const pet = this.getCurrentPet();
        if (!pet) return { success: false, error: 'No living pet selected. Visit the pet room to view what happened or adopt another.' };
        const cost = this.INTERACTION_COSTS[action];
        const currency = action === 'treat' ? 'crystals' : 'points';
        if (profile.stats[currency] < cost) return { success: false, error: `Not enough ${currency}` };

        const previousPet = Utils.deepClone(pet);
        const previousBalance = profile.stats[currency];
        const spentKey = currency === 'points' ? 'pointsSpent' : 'crystalsSpent';
        const previousSpent = profile.stats[spentKey];
        profile.stats[currency] -= cost;
        profile.stats[spentKey] += cost;
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
        if (pet.hunger < 100) pet.starvingSince = null;
        if (pet.happiness > 0) pet.unhappySince = null;
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

    hoursRemaining(until, now = Date.now()) {
        const hours = Math.max(0, (until - now) / this.HOUR_MS);
        return hours < 1 ? 'less than 1 hour' : `${Math.ceil(hours)} hours`;
    },

    getPetStatus(pet, now = Date.now()) {
        const messages = [];
        const full = pet.hunger >= 100;
        const unhappy = pet.happiness <= 0;
        if (full) {
            const start = Number.isFinite(pet.starvingSince) ? pet.starvingSince : pet.careUpdatedAt;
            messages.push(`Starving! Feed within ${this.hoursRemaining(start + this.STARVATION_GRACE_HOURS * this.HOUR_MS, now)} or your pet may die.`);
        } else if (pet.hunger >= 75) {
            messages.push('Very hungry — feed soon.');
        }
        if (unhappy) {
            const start = Number.isFinite(pet.unhappySince) ? pet.unhappySince : pet.careUpdatedAt;
            messages.push(`Very unhappy! Cheer up within ${this.hoursRemaining(start + this.RUNAWAY_GRACE_HOURS * this.HOUR_MS, now)} or your pet will run away.`);
        } else if (pet.happiness <= 25) {
            messages.push('Very unhappy — play or pet soon.');
        }
        if (messages.length) return { text: messages.join(' '), class: (full || unhappy) ? 'critical' : 'warning' };
        if (pet.happiness > 80 && pet.hunger < 30) return { text: 'Very happy and well fed!', class: 'excellent' };
        return { text: 'Content', class: 'normal' };
    },

    getLossMessage(record) {
        return record.fate === 'died' ?
            `${record.name} died of starvation after going too long without food.` :
            `${record.name} ran away after being unhappy for too long.`;
    }
};
window.PetManager = PetManager;
