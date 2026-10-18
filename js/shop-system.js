/** Purchases and equipment are scoped to one profile, not the shared catalogue. */
const ShopSystem = {
    isOwned(profile, item) {
        return item.id === 'default' ||
            (profile.ownedItems || []).includes(item.id) ||
            (profile.pets || []).some(p => p.id === item.id) ||
            profile.skin === item.id;
    },

    getShopItems() {
        PetManager.refreshAndSave();
        const profile = SaveManager.getCurrentProfile();
        const shop = SaveManager.getShopItems();
        const withOwnership = items => items.map(item => ({
            ...item, owned: profile ? this.isOwned(profile, item) : item.id === 'default',
            equipped: profile ? (profile.skin === item.id || profile.selectedPet === item.id) : false
        }));
        return {
            regularSkins: withOwnership(shop.regularSkins),
            legendarySkins: withOwnership(shop.legendarySkins),
            pets: withOwnership(shop.pets)
        };
    },

    purchaseItem(itemId) {
        const refresh = PetManager.refreshAndSave();
        if (refresh.error) return { success: false, error: refresh.error };
        const profile = SaveManager.getCurrentProfile();
        if (!profile) return { success: false, error: 'No profile selected' };
        const catalogue = SaveManager.getShopItems();
        const allItems = [...catalogue.regularSkins, ...catalogue.legendarySkins, ...catalogue.pets];
        const item = allItems.find(entry => entry.id === itemId);
        if (!item || this.isOwned(profile, item)) return { success: false, error: 'Item already owned or unavailable' };
        const currency = item.currency === 'crystals' ? 'crystals' : 'points';
        if (!Number.isFinite(item.price) || item.price < 0) return { success: false, error: 'Invalid item price' };
        if (profile.stats[currency] < item.price) return { success: false, error: `Not enough ${currency}` };

        const before = Utils.deepClone(profile);
        profile.stats[currency] -= item.price;
        profile.stats[currency === 'points' ? 'pointsSpent' : 'crystalsSpent'] += item.price;
        profile.ownedItems.push(item.id);
        const isPet = catalogue.pets.some(p => p.id === itemId);
        if (isPet) {
            profile.pets.push({ id: item.id, name: item.name, emoji: item.emoji,
                adoptedAt: Date.now(), careUpdatedAt: Date.now(),
                starvingSince: null, unhappySince: null, level: 1, xp: 0,
                happiness: 80, hunger: 50, interactions: 0 });
            profile.selectedPet = item.id;
        } else {
            profile.skin = item.id;
            profile.avatar = item.emoji;
        }
        if (!SaveManager.save()) {
            Object.keys(profile).forEach(key => delete profile[key]);
            Object.assign(profile, before);
            return { success: false, error: 'Purchase could not be saved. Check storage and try again.' };
        }
        return { success: true, isPet, itemId };
    },

    equipSkin(skinId) {
        const profile = SaveManager.getCurrentProfile();
        if (!profile) return false;
        const shop = SaveManager.getShopItems();
        const skin = [...shop.regularSkins, ...shop.legendarySkins].find(s => s.id === skinId);
        if (!skin || !this.isOwned(profile, skin)) return false;
        profile.skin = skinId;
        profile.avatar = skin.emoji;
        SaveManager.save();
        return true;
    },

    selectPet(petId) {
        const refresh = PetManager.refreshAndSave();
        if (refresh.error) return false;
        const profile = SaveManager.getCurrentProfile();
        if (!profile || !profile.pets.some(p => p.id === petId)) return false;
        profile.selectedPet = petId;
        SaveManager.save();
        return true;
    },

    getPetStats(petId) { return SaveManager.getCurrentProfile()?.pets?.find(p => p.id === petId) || null; },

    updatePet(petId, updates) {
        // Names are editable; welfare stats may ONLY change through paid care
        // actions and elapsed time, not via arbitrary shop updates.
        const refresh = PetManager.refreshAndSave();
        if (refresh.error) return false;
        const pet = this.getPetStats(petId);
        if (!pet || !updates || typeof updates.name !== 'string' ||
            !updates.name.trim() || updates.name.length > 50 ||
            Object.keys(updates).some(key => key !== 'name')) return false;
        const previous = pet.name;
        pet.name = updates.name.trim();
        if (!SaveManager.save()) { pet.name = previous; return false; }
        return true;
    }
};
window.ShopSystem = ShopSystem;
