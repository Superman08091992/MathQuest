/**
 * Math Quest - UI Manager
 */

const UIManager = {
    screens: ['main-menu', 'profiles-screen', 'world-hub', 'mode-selection', 'gameplay', 'results', 'shop', 'pet-room', 'achievements', 'stats', 'settings', 'how-to-play-screen', 'college-lab'],
    currentScreen: null,
    lastGameMode: 'relaxed',
    achievementFilter: 'all',
    
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        // Main menu
        document.getElementById('start-game')?.addEventListener('click', () => {
            AudioSystem.playClick();
            const profile = SaveManager.getCurrentProfile();
            if (profile) {
                this.showScreen('world-hub');
            } else {
                this.showScreen('profiles-screen');
            }
        });
        
        document.getElementById('profiles')?.addEventListener('click', () => {
            AudioSystem.playClick();
            this.showScreen('profiles-screen');
        });
        
        document.getElementById('how-to-play')?.addEventListener('click', () => {
            AudioSystem.playClick();
            this.showScreen('how-to-play-screen');
        });
        
        document.getElementById('settings')?.addEventListener('click', () => {
            AudioSystem.playClick();
            this.showScreen('settings');
        });
        
        // Back buttons
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', () => {
                AudioSystem.playClick();
                this.goBack();
            });
        });
        
        // Hub navigation
        document.querySelectorAll('.hub-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                AudioSystem.playClick();
                const target = btn.id;
                if (target === 'pet-room-btn') this.showScreen('pet-room');
                else if (target === 'shop-btn') this.showScreen('shop');
                else if (target === 'achievements-btn') this.showScreen('achievements');
                else if (target === 'stats-btn') this.showScreen('stats');
                else if (target === 'college-lab-btn') this.showScreen('college-lab');
                else if (target === 'switch-profile-btn') this.showScreen('profiles-screen');
            });
        });
        
        // College Readiness Lab — records original work locally; no fake automatic grading.
        document.getElementById('college-track')?.addEventListener('change', e => {
            const profile=ProfileSystem.getCurrentProfile();
            if(!profile||!Object.hasOwn(ReadinessLab.TRACKS,e.target.value))return;
            ReadinessLab.ensure(profile).track=e.target.value;
            SaveManager.save();this.renderCollegeLab();
        });
        document.getElementById('start-grade-checkpoint')?.addEventListener('click',()=>{
            try{this.startGame('checkpoint');}
            catch(error){alert('Could not start checkpoint: '+error.message);}
        });
        document.getElementById('college-start-diagnostic')?.addEventListener('click', () => {
            try { this.startGame('diagnostic'); }
            catch(error){alert('Could not start diagnostic: '+error.message);}
        });
        document.getElementById('college-assignment')?.addEventListener('change', () => this.renderCollegeAssignment());
        document.getElementById('college-save-portfolio')?.addEventListener('click', () => {
            const profile=ProfileSystem.getCurrentProfile();
            const result=ReadinessLab.addPortfolio(profile,document.getElementById('college-assignment').value,
                document.getElementById('college-writing').value,document.getElementById('college-feedback').value);
            document.getElementById('college-portfolio-message').textContent=result.success?'Original work saved locally. Obtain independent feedback.':result.error;
            if(result.success){document.getElementById('college-writing').value='';document.getElementById('college-feedback').value='';this.renderCollegeLab();}
        });

        // Profile creation
        document.getElementById('create-profile')?.addEventListener('click', () => {
            const nameInput = document.getElementById('new-profile-name');
            const result = ProfileSystem.createProfile(nameInput.value);
            if (result.success) {
                AudioSystem.playLevelUp();
                this.renderProfiles();
                nameInput.value = '';
                this.showScreen('world-hub');
            } else {
                alert(result.error);
            }
        });
        
        // The paid hint can be reviewed without being charged twice.
        document.getElementById('hint-btn')?.addEventListener('click', () => {
            const game = GameManager.currentGame;
            if (!game || game.mode !== 'relaxed') return;
            const index = game.currentQuestionIndex;
            const question = game.questions[index];
            if (!game.hintsUsed.includes(index)) {
                if (!ProfileSystem.deductPoints(10)) {
                    alert('Earn 10 points before purchasing a hint.');
                    return;
                }
                game.hintsUsed.push(index);
            }
            alert(question.hint || 'Try breaking the problem into smaller steps.');
            this.updateGameUI();
        });

        // Pause menu
        document.getElementById('pause-game')?.addEventListener('click', () => {
            GameManager.pause();
            document.getElementById('pause-menu').classList.add('active');
        });
        
        document.getElementById('resume-game')?.addEventListener('click', () => {
            document.getElementById('pause-menu').classList.remove('active');
            GameManager.resume();
        });
        
        document.getElementById('quit-game')?.addEventListener('click', () => {
            GameManager.quit();
            document.getElementById('pause-menu').classList.remove('active');
            this.showScreen('world-hub');
        });
        
        // Results
        document.getElementById('play-again')?.addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('back-to-hub')?.addEventListener('click', () => {
            this.showScreen('world-hub');
        });
        
        // Settings
        document.getElementById('export-data')?.addEventListener('click', () => {
            const data = SaveManager.export();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'math-quest-save.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            // Revoking immediately can cancel the browser's download.
            setTimeout(() => URL.revokeObjectURL(url), 1500);
        });
        
        document.getElementById('import-data')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const result = SaveManager.import(e.target.result);
                        alert(result.success ? 'Data imported!' : result.error);
                        if (result.success) location.reload();
                    };
                    reader.onerror = () => alert('Could not read that save file.');
                    reader.readAsText(file);
                }
            };
            input.click();
        });
        
        document.getElementById('reset-data')?.addEventListener('click', () => {
            if (SaveManager.reset()) location.reload();
        });
        
        document.getElementById('sfx-volume')?.addEventListener('input', (e) => {
            AudioSystem.setSfxVolume(e.target.value);
            document.getElementById('sfx-value').textContent = e.target.value + '%';
        });
        document.getElementById('mute-toggle')?.addEventListener('click', () => {
            AudioSystem.toggleMute();
            this.renderSettings();
        });
        
        document.getElementById('questions-count')?.addEventListener('change', (e) => {
            SaveManager.updateSettings({ questionsPerGame: parseInt(e.target.value) });
        });
        
        // Game mode selection
        document.querySelectorAll('.mode-card').forEach(card => {
            card.querySelector('.btn-select-mode')?.addEventListener('click', () => {
                AudioSystem.playClick();
                const mode = card.dataset.mode;
                this.startGame(mode);
            });
        });
        
        // Category filter
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled || btn.hidden) return;
                MathEngine.setCategory(btn.dataset.category);
                this.renderCategoryFilters();
            });
        });
        
        // Shop tabs
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activateShopTab(tab.dataset.tab);
            });
        });
        
        document.getElementById('adopt-pet-btn')?.addEventListener('click', () => {
            this.showScreen('shop');
            this.activateShopTab('pets');
        });

        // Achievement filters (previously displayed but had no behavior).
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.achievementFilter = btn.dataset.filter;
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
                this.renderAchievements();
            });
        });

        // Scene toys share the same 'play' interaction and charge its normal cost.
        document.querySelectorAll('.pet-toys .toy').forEach(toy => {
            toy.addEventListener('click', () => {
                const result = PetManager.interact('play');
                if (!result.success) { alert(result.error); return; }
                AudioSystem.playCorrect();
                if (result.levelUp) AudioSystem.playLevelUp();
                this.renderPetRoom();
            });
        });

        // Pet interactions
        document.querySelectorAll('.interaction-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const result = PetManager.interact(action);
                if (result.success) {
                    AudioSystem.playCorrect();
                    if (result.levelUp) {
                        AudioSystem.playLevelUp();
                        alert(`Pet leveled up to ${result.newLevel}!`);
                    }
                    this.renderPetRoom();
                } else {
                    alert(result.error);
                }
            });
        });
    },
    
    showScreen(screenId) {
        this.screens.forEach(id => {
            document.getElementById(id)?.classList.remove('active');
        });
        document.getElementById(screenId)?.classList.add('active');
        this.currentScreen = screenId;
        
        // Screen-specific renders
        if (screenId === 'profiles-screen') this.renderProfiles();
        if (screenId === 'mode-selection') this.renderCategoryFilters();
        if (screenId === 'world-hub') this.renderWorldHub();
        if (screenId === 'shop') this.renderShop();
        if (screenId === 'pet-room') this.renderPetRoom();
        if (screenId === 'achievements') this.renderAchievements();
        if (screenId === 'stats') this.renderStats();
        if (screenId === 'settings') this.renderSettings();
        if (screenId === 'college-lab') this.renderCollegeLab();
    },
    
    activateShopTab(tabId) {
        document.querySelectorAll('.shop-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabId));
        document.querySelectorAll('.shop-items').forEach(item => item.classList.toggle('active', item.id === tabId + '-tab'));
    },

    renderCategoryFilters() {
        // Single source of truth: exactly the same registry used to generate a game.
        const grade = MathEngine.currentGrade;
        const gradeName = Utils.getGradeName(grade);
        const templates = MathEngine.getAvailableTemplates(grade, 'all');
        const counts = new Map();
        for (const template of templates) {
            counts.set(template.category, (counts.get(template.category) || 0) + 1);
        }
        if (MathEngine.currentCategory !== 'all' && !counts.has(MathEngine.currentCategory)) {
            MathEngine.setCategory('all');
        }
        document.getElementById('topic-selection-title').textContent = `Step 1: Choose a subject — ${gradeName}`;
        document.getElementById('available-subjects').textContent =
            `${counts.size} subjects available at ${gradeName}. Pick a subject below, then a game mode.`;
        document.querySelectorAll('.category-btn').forEach(btn => {
            const category = btn.dataset.category;
            const count = category === 'all' ? templates.length : (counts.get(category) || 0);
            btn.hidden = count === 0;
            btn.disabled = count === 0;
            btn.classList.toggle('active', category === MathEngine.currentCategory);
            btn.setAttribute('aria-pressed', String(category === MathEngine.currentCategory));
            let counter = btn.querySelector('.topic-count');
            if (!counter) {
                counter = document.createElement('span');
                counter.className = 'topic-count';
                btn.appendChild(counter);
            }
            counter.textContent = String(count);
            btn.title = `${count} playable question ${count === 1 ? 'type' : 'types'}`;
        });
        // New curriculum domains must be clickable, not just present in the data registry.
        const holder=document.querySelector('.category-buttons');
        for(const [category,count] of counts){
            if(count===0||holder.querySelector(`[data-category="${category}"]`))continue;
            const button=document.createElement('button');
            button.className='category-btn';button.dataset.category=category;
            button.textContent=Utils.getCategoryName(category);
            button.addEventListener('click',()=>{
                MathEngine.setCategory(category);this.renderCategoryFilters();
            });
            holder.appendChild(button);
        }
        // Re-apply visibility/active classes to newly registered categories.
        holder.querySelectorAll('.category-btn').forEach(btn=>{
            const category=btn.dataset.category;
            const count=category==='all'?templates.length:(counts.get(category)||0);
            btn.hidden=count===0;btn.disabled=count===0;
            btn.classList.toggle('active', category===MathEngine.currentCategory);
            btn.setAttribute('aria-pressed',String(category===MathEngine.currentCategory));
            let counter=btn.querySelector('.topic-count');
            if(!counter){counter=document.createElement('span');counter.className='topic-count';btn.appendChild(counter);}
            counter.textContent=String(count);
            btn.title=`${count} playable question definitions`;
        });
        // Keep launch disabled if an interrupted install has no valid questions.
        document.querySelectorAll('.btn-select-mode').forEach(btn => {
            btn.disabled = templates.length === 0;
        });
        const learner=ProfileSystem.getCurrentProfile();
        document.getElementById('grade-checkpoint-status').textContent=learner?
            ReadinessLab.gradeStatus(learner,grade).status:'Create a profile to attempt a checkpoint.';
        const label = document.getElementById('question-coverage');
        const selected = MathEngine.getAvailableTemplates();
        const fixedOnly = selected.length > 0 && selected.every(t => t.isFixed);
        label.textContent = `${selected.length} question ${selected.length === 1 ? 'type' : 'types'} selected. ` +
            (fixedOnly ? 'These are fixed questions; a quiz may be shorter to avoid repeats.' :
                'Procedural types can generate different problems.');
    },

    goBack() {
        const backMap = {
            'profiles-screen': 'main-menu',
            'world-hub': 'main-menu',
            'mode-selection': 'world-hub',
            'settings': 'main-menu',
            'how-to-play-screen': 'main-menu',
            'shop': 'world-hub',
            'pet-room': 'world-hub',
            'achievements': 'world-hub',
            'stats': 'world-hub',
            'college-lab': 'world-hub'
        };
        this.showScreen(backMap[this.currentScreen] || 'main-menu');
    },
    
    renderProfiles() {
        const container = document.getElementById('profiles-list');
        if (!container) return;
        
        container.innerHTML = '';
        const profiles = SaveManager.getProfiles();
        
        if (profiles.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#888;">No profiles yet. Create one!</p>';
            return;
        }
        
        profiles.forEach(profile => {
            const card = document.createElement('div');
            card.className = 'profile-card' + (profile.id === SaveManager.data.currentProfileId ? ' active' : '');
            card.innerHTML = `
                <div class="avatar">${Utils.escapeHtml(profile.avatar)}</div>
                <div class="name">${Utils.escapeHtml(profile.name)}</div>
                <div class="level">Level ${profile.stats.level}</div>
                <button class="delete-btn" aria-label="Delete profile" type="button"><i class="fas fa-trash"></i></button>
            `;
            
            card.addEventListener('click', () => {
                ProfileSystem.selectProfile(profile.id);
                this.showScreen('world-hub');
            });
            
            card.querySelector('.delete-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this profile?')) {
                    ProfileSystem.deleteProfile(profile.id);
                    this.renderProfiles();
                }
            });
            
            container.appendChild(card);
        });
    },
    
    renderWorldHub() {
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return;
        
        document.getElementById('player-name').textContent = profile.name;
        document.getElementById('player-avatar').textContent = profile.avatar;
        document.getElementById('player-points').textContent = Utils.formatCompact(profile.stats.points);
        document.getElementById('player-crystals').textContent = profile.stats.crystals;
        document.getElementById('player-level').textContent = profile.stats.level;
        
        const grid = document.getElementById('grade-grid');
        grid.innerHTML = '';
        
        for (let grade = 0; grade <= 12; grade++) {
            const name = Utils.getGradeName(grade);
            const realm = Utils.getRealmName(grade);
            const icon = Utils.getRealmIcon(grade);
            const unlocked = ProfileSystem.isGradeUnlocked(grade);
            const bank = MathEngine.getAvailableTemplates(grade, 'all');
            const subjectCount = new Set(bank.map(t => t.category)).size;
            const coverageSummary = `<div class="grade-coverage">${subjectCount} subjects · ${bank.length} question types</div>`;
            
            const card = document.createElement('div');
            card.className = 'grade-card' + (unlocked ? '' : ' locked');
            card.innerHTML = unlocked ? `
                <div class="grade-icon">${icon}</div>
                <div class="grade-name">${name}</div>
                <div class="grade-realm">${realm}</div>
                ${coverageSummary}
            ` : `
                <div class="grade-icon">${icon}</div>
                <div class="lock-icon"><i class="fas fa-lock"></i></div>
                <div class="grade-name">${name}</div>
                ${coverageSummary}
            `;
            
            if (unlocked) {
                card.addEventListener('click', () => {
                    AudioSystem.playClick();
                    MathEngine.setGrade(grade);
                    // A previously selected Arithmetic filter must not silently
                    // hide other subjects when the learner enters a new grade.
                    MathEngine.setCategory('all');
                    document.getElementById('grade-title').textContent = `${name} - ${realm}`;
                    this.showScreen('mode-selection');
                });
            }
            
            grid.appendChild(card);
        }
    },
    
    renderShop() {
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return;
        
        document.getElementById('shop-points').textContent = Utils.formatCompact(profile.stats.points);
        document.getElementById('shop-crystals').textContent = profile.stats.crystals;
        
        const shop = ShopSystem.getShopItems();
        
        // Owned items must remain selectable; only displaying "Owned" made
        // equipment impossible after the first purchase.
        const makeShopCard = (item, category) => {
            const isPet = category === 'pets';
            const equipped = item.equipped;
            const currency = item.currency === 'crystals' ? 'crystals' : 'points';
            const symbol = currency === 'crystals' ? '💎' : '⭐';
            const affordable = profile.stats[currency] >= item.price;
            const div = document.createElement('div');
            div.className = 'shop-item' + (category === 'legendarySkins' ? ' legendary' : '') + (item.owned ? ' owned' : '');
            div.innerHTML = `
                <div class="item-icon">${Utils.escapeHtml(item.emoji)}</div>
                <div class="item-name">${Utils.escapeHtml(item.name)}</div>
                ${category === 'legendarySkins' ? '<div class="item-rarity legendary">LEGENDARY</div>' : ''}
                <div class="item-price ${currency === 'crystals' ? 'crystals' : ''}">${item.price} ${symbol}</div>
                ${item.owned ? `<span class="owned-badge">${equipped ? 'Selected' : 'Owned'}</span>` : ''}
            `;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'item-action';
            button.disabled = equipped || (!item.owned && !affordable);
            button.textContent = equipped ? (isPet ? 'Selected pet' : 'Equipped') :
                item.owned ? (isPet ? 'Select pet' : 'Equip') :
                    affordable ? `Buy for ${item.price} ${symbol}` : `Need ${item.price} ${symbol}`;
            button.addEventListener('click', () => {
                if (item.owned) {
                    if (isPet) ShopSystem.selectPet(item.id);
                    else ShopSystem.equipSkin(item.id);
                } else {
                    const result = ShopSystem.purchaseItem(item.id);
                    if (!result.success) { alert(result.error); return; }
                    AudioSystem.playLevelUp();
                }
                this.renderShop();
            });
            div.appendChild(button);
            return div;
        };

        // Regular skins
        const regularContainer = document.getElementById('regular-skins');
        regularContainer.innerHTML = '';
        shop.regularSkins.forEach(item => regularContainer.appendChild(makeShopCard(item, 'regularSkins')));

        const legendaryContainer = document.getElementById('legendary-skins');
        legendaryContainer.innerHTML = '';
        shop.legendarySkins.forEach(item => legendaryContainer.appendChild(makeShopCard(item, 'legendarySkins')));

        const petsContainer = document.getElementById('pets-items');
        petsContainer.innerHTML = '';
        shop.pets.forEach(item => petsContainer.appendChild(makeShopCard(item, 'pets')));
    },

    renderPetRoom() {
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return;
        const pet = PetManager.getCurrentPet();
        document.getElementById('current-pet-name').textContent = pet ? pet.name : 'No Pet Selected';
        const empty = document.getElementById('pet-empty-state');
        empty.hidden = Boolean(pet);
        empty.querySelector('h3').textContent = profile.pets.length ? 'Choose a pet' : 'No pet adopted yet';
        empty.querySelector('p').textContent = profile.pets.length ?
            'Select one of your pets below to interact with it.' :
            'Earn points from math questions, then adopt a pet from the shop.';
        document.getElementById('adopt-pet-btn').hidden = profile.pets.length > 0;
        document.getElementById('pet-display-area').hidden = !pet;
        document.getElementById('pet-stats').hidden = !pet;
        document.getElementById('pet-interactions').hidden = !pet;
        document.getElementById('pet-status').hidden = !pet;
        document.getElementById('pet-character').textContent = pet ? PetManager.getPetEmoji(pet) : '';
        for (const [barId, valueId, value] of [
            ['happiness-bar', 'happiness-value', pet?.happiness],
            ['hunger-bar', 'hunger-value', pet?.hunger]
        ]) {
            document.getElementById(barId).style.width = `${value ?? 0}%`;
            document.getElementById(valueId).textContent = pet ? `${value}/100` : '—';
        }
        const xpNeeded = pet ? pet.level * 50 : 0;
        document.getElementById('xp-bar').style.width = pet ? `${Math.min(100, pet.xp / xpNeeded * 100)}%` : '0%';
        document.getElementById('level-display').textContent = pet ? `Lv${pet.level} (${pet.xp}/${xpNeeded})` : '—';
        document.getElementById('pet-status').textContent = pet ? PetManager.getPetStatus(pet).text : '';
        document.querySelectorAll('.interaction-btn').forEach(btn => {
            const cost = PetManager.INTERACTION_COSTS[btn.dataset.action];
            const balance = btn.dataset.action === 'treat' ? profile.stats.crystals : profile.stats.points;
            btn.disabled = !pet || balance < cost;
        });
        document.querySelectorAll('.pet-toys .toy').forEach(btn => {
            btn.disabled = !pet || profile.stats.points < PetManager.INTERACTION_COSTS.play;
        });

        // Always render the owned list, including when selectedPet is missing.
        const petsList = document.getElementById('pets-list');
        petsList.innerHTML = '';
        if (profile.pets.length === 0) {
            const note = document.createElement('p');
            note.className = 'empty-note';
            note.textContent = 'No pets owned. Visit the shop to adopt your first pet.';
            petsList.appendChild(note);
        }
        profile.pets.forEach(ownedPet => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pet-thumbnail' + (ownedPet.id === profile.selectedPet ? ' active' : '');
            btn.setAttribute('aria-pressed', String(ownedPet.id === profile.selectedPet));
            btn.setAttribute('aria-label', `Select ${ownedPet.name}, level ${ownedPet.level}`);
            const emoji = document.createElement('div');
            emoji.className = 'pet-emoji';
            emoji.textContent = ownedPet.emoji;
            const level = document.createElement('div');
            level.className = 'pet-level';
            level.textContent = `${ownedPet.name} · Lv${ownedPet.level}`;
            btn.append(emoji, level);
            btn.addEventListener('click', () => {
                ShopSystem.selectPet(ownedPet.id);
                this.renderPetRoom();
            });
            petsList.appendChild(btn);
        });
    },

    renderAchievements() {
        const container = document.getElementById('achievements-list');
        if (!container) return;
        
        container.innerHTML = '';
        const all = RewardSystem.getAllAchievements();
        const unlocked = RewardSystem.getUnlockedAchievements();
        
        document.getElementById('unlocked-count').textContent = unlocked.length;
        document.getElementById('total-count').textContent = all.length;
        
        all.filter(ach => this.achievementFilter === 'all' || ach.category === this.achievementFilter).forEach(ach => {
            const isUnlocked = unlocked.includes(ach.id);
            const div = document.createElement('div');
            div.className = 'achievement-card' + (isUnlocked ? ' unlocked' : '');
            div.innerHTML = `
                <div class="achievement-icon">${isUnlocked ? '🏆' : '🔒'}</div>
                <div class="achievement-info">
                    <h4>${ach.name}</h4>
                    <p>${ach.desc}</p>
                    ${isUnlocked ? 
                        '<span class="achievement-reward">Unlocked!</span>' : 
                        `<span class="achievement-reward">Reward: ${ach.reward.points || 0} ⭐${ach.reward.crystals ? ' + ' + ach.reward.crystals + ' 💎' : ''}</span>`
                    }
                </div>
            `;
            container.appendChild(div);
        });
    },
    
    renderStats() {
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return;
        
        document.getElementById('stat-total-questions').textContent = profile.stats.totalQuestions;
        document.getElementById('stat-correct-answers').textContent = profile.stats.correctAnswers;
        document.getElementById('stat-accuracy').textContent = 
            Utils.percentage(profile.stats.correctAnswers, profile.stats.totalQuestions) + '%';
        document.getElementById('stat-games-played').textContent = profile.stats.gamesPlayed;
        document.getElementById('stat-best-streak').textContent = profile.stats.bestStreak;
        document.getElementById('stat-total-points').textContent = Utils.formatCompact(profile.stats.points);
        document.getElementById('stat-total-spent').textContent = Utils.formatCompact(profile.stats.pointsSpent);
        document.getElementById('stat-crystals-spent').textContent = profile.stats.crystalsSpent;
        document.getElementById('stat-crystals-earned').textContent = profile.stats.crystals;
        document.getElementById('stat-perfect-games').textContent = profile.stats.perfectGames;
        const categories = document.getElementById('category-stats');
        categories.innerHTML = '';
        const tracked = Object.entries(profile.categoryStats).filter(([, item]) => item.totalQuestions > 0);
        if (tracked.length === 0) {
            categories.textContent = 'No topic breakdown recorded yet. New games will be tracked here.';
        } else {
            for (const [category, item] of tracked.sort((a, b) => b[1].totalQuestions - a[1].totalQuestions)) {
                const line = document.createElement('div');
                line.className = 'stat-item';
                const label = document.createElement('span');
                label.className = 'stat-label';
                label.textContent = Utils.getCategoryName(category) + ':';
                const score = document.createElement('span');
                score.className = 'stat-value';
                score.textContent = `${item.correctAnswers}/${item.totalQuestions} (${Utils.percentage(item.correctAnswers, item.totalQuestions)}%)`;
                line.append(label, score);
                categories.appendChild(line);
            }
        }
    },
    
    renderSettings() {
        const settings = SaveManager.getSettings();
        document.getElementById('sfx-volume').value = settings.sfxVolume;
        document.getElementById('sfx-value').textContent = settings.sfxVolume + '%';
        document.getElementById('mute-toggle').textContent =
            settings.isMuted ? 'Unmute sound' : 'Mute sound';
        document.getElementById('questions-count').value = settings.questionsPerGame;
    },
    
    renderCollegeAssignment() {
        const selected=document.getElementById('college-assignment').value;
        const item=ReadinessLab.CAPSTONES.find(x=>x.id===selected);
        const prompt=document.getElementById('college-assignment-prompt');
        const rubric=document.getElementById('college-assignment-rubric');
        prompt.textContent=item?.prompt||'';rubric.replaceChildren();
        for(const line of (item?.rubric||[])){
            const li=document.createElement('li');li.textContent=line;rubric.appendChild(li);
        }
    },

    renderCollegeLab() {
        const profile=ProfileSystem.getCurrentProfile();if(!profile)return;
        const state=ReadinessLab.ensure(profile);
        const track=document.getElementById('college-track');track.value=state.track;
        document.getElementById('college-track-plan').textContent= 'Suggested focus areas: '+ReadinessLab.TRACKS[state.track].categories.map(Utils.getCategoryName).join(', ')+'. Core literacy and quantitative reasoning remain important for every pathway.';
        const diagnostic=document.getElementById('college-latest-diagnostic');diagnostic.replaceChildren();
        const latest=state.diagnosticResults.at(-1);
        if(!latest){diagnostic.textContent='No diagnostic completed. Start with a baseline before using the results as a study target.';}
        else{
            const h=document.createElement('h4');h.textContent=`Most recent practice diagnostic: ${latest.correct}/${latest.total} (${Math.round(100*latest.correct/latest.total)}%), ${new Date(latest.time).toLocaleDateString()}`;diagnostic.appendChild(h);
            for(const [domain,b] of Object.entries(latest.domains)){
                const p=document.createElement('p');p.textContent=`${domain}: ${b.correct}/${b.total} (${Math.round(100*b.correct/Math.max(1,b.total))}%).`;
                diagnostic.appendChild(p);
            }
        }
        const recs=document.getElementById('college-recommendations');recs.replaceChildren();
        for(const entry of ReadinessLab.recommendations(profile)){
            const row=document.createElement('div');row.className='college-recommendation';
            const text=document.createElement('span');text.textContent=`${Utils.getCategoryName(entry.category)} — ${entry.status}; ${entry.attempts} independent attempts, ${entry.unique} distinct items`;
            const button=document.createElement('button');button.type='button';button.textContent='Practice';button.className='btn-secondary';
            button.addEventListener('click',()=>{
                const best=[9,10,11,12].map(g=>({g,types:MathEngine.getAvailableTemplates(g,entry.category).length})).sort((a,b)=>b.types-a.types)[0];
                if(!best?.types){alert('No questions registered for this subject at advanced grade levels.');return;}
                MathEngine.setGrade(best.g);MathEngine.setCategory(entry.category);
                document.getElementById('grade-title').textContent=`${Utils.getGradeName(best.g)} — ${Utils.getCategoryName(entry.category)} practice`;
                this.showScreen('mode-selection');
            });
            row.append(text,button);recs.appendChild(row);
        }
        const breakdown=document.getElementById('college-practice-summary');breakdown.replaceChildren();
        const h=document.createElement('h4');h.textContent='Recorded subject practice (not a formal credential)';breakdown.appendChild(h);
        for(const entry of ReadinessLab.categorySummary(profile)){
            const p=document.createElement('p');p.textContent=`${Utils.getCategoryName(entry.category)}: ${entry.independentAccuracy??'—'}% independently correct, ${entry.unique} unique items, ${entry.days} days — ${entry.status}`;breakdown.appendChild(p);
        }
        const route=document.getElementById('college-route');route.replaceChildren();
        const routeTitle=document.createElement('h4');routeTitle.textContent='K–12 practice checkpoint record';route.appendChild(routeTitle);
        const completed=Array.from({length:13},(_,g)=>ReadinessLab.gradeStatus(profile,g));
        const progress=document.createElement('p');progress.textContent=`${completed.filter(x=>x.complete).length}/13 grade checkpoints have repeated passing evidence. Each requires two ≥90% no-hint assessments at least 7 days apart with 20+ distinct keyed problems across the pair. All results are unproctored practice, not qualifications.`;route.appendChild(progress);
        for(let grade=0;grade<13;grade++){
            const line=document.createElement('p');line.textContent=`${Utils.getGradeName(grade)}: ${completed[grade].status}`;route.appendChild(line);
        }
        const assignment=document.getElementById('college-assignment');
        if(!assignment.options.length){
            for(const item of ReadinessLab.CAPSTONES){const option=document.createElement('option');option.value=item.id;option.textContent=item.title;assignment.appendChild(option);}
        }
        this.renderCollegeAssignment();
        const portfolio=document.getElementById('college-portfolio-list');portfolio.replaceChildren();
        if(!state.portfolio.length){portfolio.textContent='No portfolio entries yet.';}
        for(const entry of state.portfolio.slice().reverse()){
            const wrap=document.createElement('details');wrap.className='portfolio-item';
            const sum=document.createElement('summary');sum.textContent=`${ReadinessLab.CAPSTONES.find(x=>x.id===entry.assignment)?.title||'Independent work'} — ${new Date(entry.time).toLocaleDateString()} (${entry.text.length} characters)`;
            const work=document.createElement('pre');work.textContent=entry.text;
            const feedback=document.createElement('p');feedback.textContent=entry.feedback?`Self-recorded feedback: ${entry.feedback}`:'No independent feedback documented.';
            wrap.append(sum,work,feedback);portfolio.appendChild(wrap);
        }
    },

    startGame(mode) {
        const questionsPerGame = SaveManager.data?.settings?.questionsPerGame || 10;
        this.lastGameMode = mode || this.lastGameMode;
        if(this.lastGameMode==='checkpoint'){
            MathEngine.setCategory('all');
            const grade=MathEngine.currentGrade;
            GameManager.initCheckpoint(grade,ReadinessLab.buildCheckpoint(grade));
        } else if(this.lastGameMode==='diagnostic'){
            MathEngine.setCategory('all');
            GameManager.initDiagnostic(ReadinessLab.buildDiagnostic());
        } else {
            GameManager.initGame(MathEngine.currentGrade, this.lastGameMode, questionsPerGame);
        }
        GameManager.startGame();
        this.showScreen('gameplay');
        this.renderQuestion();
        if (this.lastGameMode === 'timed') {
            GameManager.startTimer();
        }
        this.updateTimerUI();
        this.updateGameUI();
    },
    
    renderQuestion() {
        const game = GameManager.currentGame;
        const question = game.questions[game.currentQuestionIndex];
        
        document.getElementById('current-grade').textContent = game.mode==='diagnostic' ? 'Grades 9–12' : game.mode==='checkpoint' ? `${Utils.getGradeName(game.grade)} checkpoint` : Utils.getGradeName(game.grade);
        document.getElementById('game-mode').textContent = '• ' + Utils.capitalize(game.mode);
        document.getElementById('current-question').textContent = game.currentQuestionIndex + 1;
        document.getElementById('total-questions').textContent = game.questionsPerGame;
        
        document.getElementById('question-text').textContent = question.text;
        
        if (question.visual) {
            const visual = document.getElementById('visual-aid');
            visual.textContent = question.visual;
            visual.style.display = 'block';
        } else {
            document.getElementById('visual-aid').style.display = 'none';
        }
        
        const hintButton = document.getElementById('hint-btn');
        hintButton.hidden = game.mode !== 'relaxed';
        hintButton.disabled = !game.hintsUsed.includes(game.currentQuestionIndex) &&
            (ProfileSystem.getCurrentProfile()?.stats.points || 0) < 10;
        this.updateTimerUI();

        const grid = document.getElementById('answers-grid');
        grid.innerHTML = '';
        question.answers.forEach(answer => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = answer;
            btn.addEventListener('click', () => {
                this.submitAnswer(answer);
            });
            grid.appendChild(btn);
        });
        
        this.updateGameUI();
    },
    
    updateTimerUI() {
        const game = GameManager.currentGame;
        const container = document.querySelector('.timer-container');
        const bar = document.getElementById('timer-bar');
        if (!game || !container || !bar) return;
        container.hidden = game.mode !== 'timed';
        bar.style.width = `${Math.max(0, GameManager.timeRemaining / GameManager.QUESTION_TIME * 100)}%`;
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-label', 'Time remaining');
        bar.setAttribute('aria-valuemin', '0');
        bar.setAttribute('aria-valuemax', String(GameManager.QUESTION_TIME));
        bar.setAttribute('aria-valuenow', String(GameManager.timeRemaining));
    },

    updateGameUI() {
        const progress = GameManager.getProgress();
        if (progress) {
            document.getElementById('question-progress').style.width = progress.percent + '%';
            document.getElementById('current-question').textContent = progress.current + 1;
            document.getElementById('current-streak').textContent = '🔥' + GameManager.currentGame.stats.streak;
            document.getElementById('current-points').textContent = '⭐' + GameManager.currentGame.stats.points;
        }
    },
    
    submitAnswer(answer) {
        const result = GameManager.submitAnswer(answer);
        if (!result.accepted) return;

        if (result.correct) {
            AudioSystem.playCorrect();
        } else {
            AudioSystem.playIncorrect();
        }
        
        if (result.isLastQuestion) {
            this.showResults();
            GameManager.quit();
        } else {
            this.renderQuestion();
            this.updateGameUI();
        }
    },
    
    showResults() {
        const result = GameManager.endGame();
        
        document.getElementById('correct-count').textContent = result.stats.correct;
        document.getElementById('incorrect-count').textContent = result.stats.incorrect;
        document.getElementById('accuracy-percent').textContent = 
            Math.round(result.stats.correct / (result.stats.correct + result.stats.incorrect) * 100) + '%';
        document.getElementById('best-streak').textContent = result.stats.bestStreak;
        document.getElementById('points-earned').textContent = '+' + result.stats.points;
        document.getElementById('xp-earned').textContent = '+' + result.stats.xp;
        document.getElementById('crystals-earned').textContent = '+' + result.stats.crystals;
        const levelResult = document.getElementById('level-up-result');
        levelResult.hidden = !result.advancement?.leveledUp;
        levelResult.textContent = result.advancement?.leveledUp ?
            `Level up! You reached Level ${result.advancement.newLevel} and unlocked new grade levels.` : '';
        const achievements = document.getElementById('achievements-unlocked');
        achievements.innerHTML = '';
        if (result.achievements.length) {
            const summary = document.createElement('div');
            summary.className = 'achievement-summary';
            const title = document.createElement('h3');
            title.textContent = `New achievements (${result.achievements.length})`;
            const list = document.createElement('ul');
            for (const item of result.achievements) {
                const row = document.createElement('li');
                row.textContent = `${item.name} — ${item.reward.points || 0} points${item.reward.crystals ? `, ${item.reward.crystals} crystals` : ''}`;
                list.appendChild(row);
            }
            summary.append(title, list);
            achievements.appendChild(summary);
        }
        // Independent, inspectable learning feedback — correct choice, entered choice,
        // explanation. It is visible only after a question has been answered.
        const review=document.getElementById('answer-review');
        review.replaceChildren();
        const heading=document.createElement('h3');heading.textContent='Review your answers and explanations';review.appendChild(heading);
        for(const [i,a] of result.results.answers.entries()){
            const item=document.createElement('section');item.className='review-item';
            const h=document.createElement('h4');h.textContent=`${i+1}. ${a.correct?'Correct':'Review needed'} — ${Utils.getCategoryName(a.category||'arithmetic')}`;
            const q=document.createElement('p');q.textContent=a.question;
            const ans=document.createElement('p');ans.textContent=`Your response: ${a.selected||'(No answer)'} | Keyed response: ${a.expected||'Unavailable'}`;
            const why=document.createElement('p');why.textContent=a.explanation||'Review the skill and work through the solution.';
            item.append(h,q,ans,why);review.appendChild(item);
        }
        this.showScreen('results');
    }
};

window.UIManager = UIManager;
