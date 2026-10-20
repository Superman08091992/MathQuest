/**
 * Math Quest - UI Manager
 */

const UIManager = {
    screens: ['main-menu', 'profiles-screen', 'world-hub', 'mode-selection', 'gameplay', 'results', 'shop', 'pet-room', 'achievements', 'stats', 'settings', 'how-to-play-screen', 'college-lab'],
    currentScreen: null,
    lastGameMode: 'relaxed',
    achievementFilter: 'all',
    shopPreview: null,
    answerPending: false,
    answerLast: false,
    
    init() {
        this.bindEvents();
        // The initial screen is visible before any navigation event occurs.
        this.currentScreen = 'main-menu';
        this.renderMainMenu();
        // The Linux launcher can open the actual player's home directly.
        // Never skip the title screen unless a saved profile already exists.
        if (new URLSearchParams(window.location.search).get('screen') === 'world-hub' &&
            ProfileSystem.getCurrentProfile()) {
            this.showScreen('world-hub');
        }
        const updateCare = () => {
            if (!SaveManager.data) return;
            PetManager.refreshAndSave();
            if (this.currentScreen === 'pet-room') this.renderPetRoom();
            else if (this.currentScreen === 'world-hub') this.renderPetCareAlert();
            else if (this.currentScreen === 'shop') this.renderShop();
            else if (this.currentScreen === 'gameplay') this.renderStudyCompanion();
        };
        // Browser background timers may be throttled. Recompute from real elapsed
        // time on resume/focus, in addition to updating the active room each minute.
        window.addEventListener('focus', updateCare);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) updateCare();
        });
        setInterval(updateCare, 60_000);
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
        
        document.getElementById('hub-companion-action')?.addEventListener('click', () => {
            AudioSystem.playClick();
            this.showScreen(PetManager.getCurrentPet() ? 'pet-room' : 'shop');
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
        document.getElementById('grade-project-save')?.addEventListener('click',()=>{
            const profile=ProfileSystem.getCurrentProfile(),grade=MathEngine.currentGrade;
            const result=ReadinessLab.submitGradeProject(profile,grade,document.getElementById('grade-project-response').value);
            document.getElementById('grade-project-message').textContent=result.success?
                'Project draft saved with your profile (not independently graded).':result.error;
            if(result.success){this.renderGradeProject(grade);SaveManager.save();}
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

        // Students can review the exact marked answer before moving on.
        document.getElementById('answer-continue')?.addEventListener('click', () => this.continueAfterAnswer());

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
                if (typeof Character3D !== 'undefined') Character3D.react(document.getElementById('pet-model-stage'), 'play');
            });
        });

        // 3D viewer rotation and actions are visual only; pet care still uses
        // the existing priced, persisted PetManager interactions.
        document.querySelectorAll('[data-character-stage]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof Character3D === 'undefined') return;
                const stage = document.getElementById(btn.dataset.characterStage);
                if (btn.hasAttribute('data-turn')) Character3D.rotate(stage, Number(btn.dataset.turn));
                if (btn.dataset.characterAction) Character3D.react(stage, btn.dataset.characterAction);
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
                    if (typeof Character3D !== 'undefined') Character3D.react(document.getElementById('pet-model-stage'), action);
                } else {
                    alert(result.error);
                }
            });
        });
    },
    
    renderMainMenu() {
        if (typeof Character3D === 'undefined') return;
        const profile = SaveManager.getCurrentProfile();
        const avatarId = Character3D.getDefinition('avatar', profile?.skin) ? profile.skin : 'default';
        Character3D.render(document.getElementById('welcome-avatar-stage'), {
            kind: 'avatar', id: avatarId, name: profile?.name || 'Adventurer', emoji: profile?.avatar || '👤'
        });
        const pet = profile ? PetManager.getCurrentPet() : null;
        const petId = Character3D.getDefinition('pet', pet?.id) ? pet.id : 'cat';
        Character3D.render(document.getElementById('welcome-pet-stage'), {
            kind: 'pet', id: petId, name: pet?.name || 'Cat', emoji: pet?.emoji || '🐱',
            happiness: pet?.happiness ?? 80, hunger: pet?.hunger ?? 50
        });
        const avatarLabel = document.getElementById('welcome-avatar-caption');
        if (avatarLabel) avatarLabel.textContent = profile ? `${profile.name} — selected avatar` : 'Adventurer preview';
        const petLabel = document.getElementById('welcome-pet-caption');
        if (petLabel) petLabel.textContent = pet ? `${pet.name} — your pet` : 'Cat preview — adopt pets in the Shop';
        const returning = document.getElementById('home-returning-player');
        const actionText = document.querySelector('#start-game > span:first-child');
        if (returning) {
            returning.hidden = !profile;
            returning.textContent = profile ? `Welcome back, ${profile.name}. Your adventure is waiting.` : '';
        }
        if (actionText) actionText.textContent = profile ? 'Continue Your Quest' : 'Enter the Quest';
    },

    showScreen(screenId) {
        // A WebGL context lives only while its screen is visible. Releasing
        // it prevents background GPU work and mobile context exhaustion.
        if (this.currentScreen !== screenId && typeof Character3D !== 'undefined') Character3D.releaseAll();
        if (this.currentScreen !== screenId && screenId === 'shop') this.shopPreview = null;
        this.screens.forEach(id => {
            document.getElementById(id)?.classList.remove('active');
        });
        document.getElementById(screenId)?.classList.add('active');
        this.currentScreen = screenId;
        PetManager.refreshAndSave();
        // Screen-specific renders
        if (screenId === 'main-menu') this.renderMainMenu();
        if (screenId === 'profiles-screen') this.renderProfiles();
        if (screenId === 'mode-selection') this.renderCategoryFilters();
        if (screenId === 'world-hub') this.renderWorldHub();
        if (screenId === 'shop') this.renderShop();
        if (screenId === 'pet-room') this.renderPetRoom();
        if (screenId === 'gameplay') this.renderStudyCompanion();
        if (screenId === 'achievements') this.renderAchievements();
        if (screenId === 'stats') this.renderStats();
        if (screenId === 'settings') this.renderSettings();
        if (screenId === 'college-lab') this.renderCollegeLab();
    },
    
    activateShopTab(tabId) {
        if (!['skins', 'pets'].includes(tabId)) return;
        const current = document.querySelector('.shop-tab.active')?.dataset.tab;
        document.querySelectorAll('.shop-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabId));
        document.querySelectorAll('.shop-items').forEach(item => item.classList.toggle('active', item.id === tabId + '-tab'));
        if (current !== tabId) this.shopPreview = null;
        if (this.currentScreen === 'shop') this.renderShopPreview();
    },

    previewShopItem(kind, id) {
        if (!['pet', 'avatar'].includes(kind)) return;
        if (typeof Character3D === 'undefined' || !Character3D.getDefinition(kind, id)) return;
        this.shopPreview = { kind, id };
        this.renderShopPreview();
    },

    renderShopPreview() {
        if (this.currentScreen !== 'shop' || typeof Character3D === 'undefined') return;
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return;
        const stage = document.getElementById('shop-model-stage');
        const tab = document.querySelector('.shop-tab.active')?.dataset.tab || 'skins';
        const kind = tab === 'pets' ? 'pet' : 'avatar';
        const id = this.shopPreview?.kind === kind ? this.shopPreview.id :
            (kind === 'pet' ? profile.selectedPet || 'cat' : profile.skin || 'default');
        const catalogue = SaveManager.getShopItems();
        const item = [...catalogue.regularSkins, ...catalogue.legendarySkins, ...catalogue.pets]
            .find(x => x.id === id);
        if (!item) return;
        const ownedPet = profile.pets.find(p => p.id === id);
        const name = item.name;
        const status = item.owned ? (item.equipped ? 'Currently selected' : 'Owned') : 'Not owned';
        document.getElementById('shop-model-heading').textContent = name + ' — 3D preview';
        document.getElementById('shop-model-description').textContent = `${status}. Drag the model to examine the character from every angle. Previewing is free and does not change your selection.`;
        Character3D.render(stage, { kind, id, name, emoji: item.emoji,
            happiness: ownedPet?.happiness ?? 80, hunger: ownedPet?.hunger ?? 50 });
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
        const goals=document.getElementById('grade-competencies');
        if(goals){goals.replaceChildren(); for(const goal of ReadinessLab.GRADE_GOALS[grade]){
            const li=document.createElement('li');li.textContent=goal;goals.appendChild(li);
        }}
        this.renderGradeProject(grade);
        const learner=ProfileSystem.getCurrentProfile();
        document.getElementById('grade-checkpoint-status').textContent=learner?
            `${ReadinessLab.gradeStatus(learner,grade).status}. This checkpoint also reviews earlier grades (when applicable).` :
            'Create a profile to attempt a checkpoint.';
        const label = document.getElementById('question-coverage');
        const selected = MathEngine.getAvailableTemplates();
        const fixedOnly = selected.length > 0 && selected.every(t => t.isFixed);
        label.textContent = `${selected.length} question ${selected.length === 1 ? 'type' : 'types'} selected. ` +
            (fixedOnly ? 'These are fixed questions; a quiz may be shorter to avoid repeats.' :
                'Procedural types can generate different problems.');
    },

    renderGradeProject(grade){
        const assignment=ReadinessLab.GRADE_PROJECTS[grade];
        const profile=ProfileSystem.getCurrentProfile();
        if(!assignment||!profile)return;
        document.getElementById('grade-project-title').textContent=`Grade assignment: ${assignment.title}`;
        document.getElementById('grade-project-prompt').textContent=assignment.prompt;
        const rubric=document.getElementById('grade-project-rubric');rubric.replaceChildren();
        for(const criterion of assignment.rubric){const li=document.createElement('li');li.textContent=criterion;rubric.appendChild(li);}
        const status=ReadinessLab.gradeProjectStatus(profile,grade);
        document.getElementById('grade-project-status').textContent=
            `${status.status}. Minimum ${assignment.minimum} characters; work is kept in your exportable local save.`;
        const answer=document.getElementById('grade-project-response');
        // Restore the student's own latest draft on every grade visit.
        if(answer.dataset.grade!==`${profile.id}:${grade}`){
            answer.value=status.latest?.text||'';
            answer.dataset.grade=`${profile.id}:${grade}`;
            document.getElementById('grade-project-message').textContent='';
        }
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
        
        const preview = document.getElementById('profile-model-preview');
        if (preview) preview.hidden = profiles.length === 0;
        if (profiles.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#888;">No profiles yet. Create one!</p>';
            if (typeof Character3D !== 'undefined') Character3D.release(document.getElementById('profile-model-stage'));
            return;
        }
        const showProfileModel = candidate => {
            if (typeof Character3D === 'undefined') return;
            document.getElementById('profile-model-name').textContent = candidate.name;
            Character3D.render(document.getElementById('profile-model-stage'), {
                kind: 'avatar', id: candidate.skin || 'default', name: candidate.name, emoji: candidate.avatar
            });
        };
        showProfileModel(profiles.find(p => p.id === SaveManager.data.currentProfileId) || profiles[0]);

        profiles.forEach(profile => {
            const card = document.createElement('div');
            card.className = 'profile-card' + (profile.id === SaveManager.data.currentProfileId ? ' active' : '');
            card.innerHTML = `
                <div class="avatar">${Utils.escapeHtml(profile.avatar)}</div>
                <div class="name">${Utils.escapeHtml(profile.name)}</div>
                <div class="level">Level ${profile.stats.level}</div>
                <button class="delete-btn" aria-label="Delete profile" type="button"><i class="fas fa-trash"></i></button>
            `;
            
            card.addEventListener('mouseenter', () => showProfileModel(profile));
            card.addEventListener('focusin', () => showProfileModel(profile));
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
    
    openGrade(grade) {
        if (!Number.isInteger(grade) || grade < 0 || grade > 12 || !ProfileSystem.isGradeUnlocked(grade)) return false;
        AudioSystem.playClick();
        MathEngine.setGrade(grade);
        // Every grade opens with all available subjects; no stale arithmetic filter.
        MathEngine.setCategory('all');
        document.getElementById('grade-title').textContent = `${Utils.getGradeName(grade)} - ${Utils.getRealmName(grade)}`;
        this.showScreen('mode-selection');
        return true;
    },

    renderWorldHub() {
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return;

        document.getElementById('player-name').textContent = profile.name;
        document.getElementById('player-avatar').textContent = profile.avatar;
        document.getElementById('player-points').textContent = Utils.formatCompact(profile.stats.points);
        document.getElementById('player-crystals').textContent = profile.stats.crystals;
        document.getElementById('player-level').textContent = profile.stats.level;
        const heroName = document.getElementById('hub-character-name');
        if (heroName) heroName.textContent = profile.name;

        // Keep the real profile's avatar/pet rather than creating fictional ownership.
        if (typeof Character3D !== 'undefined') {
            Character3D.render(document.getElementById('hub-avatar-stage'), {
                kind: 'avatar', id: profile.skin || 'default', name: profile.name, emoji: profile.avatar
            });
            const pet = PetManager.getCurrentPet();
            const candidate = pet && Character3D.getDefinition('pet', pet.id) ? pet.id : 'cat';
            Character3D.render(document.getElementById('hub-pet-stage'), {
                kind: 'pet', id: candidate, name: pet?.name || 'Cat preview',
                emoji: pet?.emoji || '🐱', happiness: pet?.happiness ?? 80, hunger: pet?.hunger ?? 50
            });
            const petName = document.getElementById('hub-pet-name');
            if (petName) petName.textContent = pet ? pet.name : 'Pet preview';
            const petAction = document.getElementById('hub-companion-action');
            if (petAction) petAction.textContent = pet ? 'Care for Your Pet' : 'Adopt a Pet';
        }
        this.renderPetCareAlert();

        const pathway = ReadinessLab.pathwayReport(profile);
        const summary = document.getElementById('academic-pathway-summary');
        if (summary) summary.textContent = pathway.label + (pathway.complete ?
            '. Completed practice still requires independent assessment.' : '.');

        const recorded = pathway.grades.filter(g => g.complete && g.project?.submitted).length;
        const count = document.getElementById('hub-pathway-count');
        if (count) count.textContent = `${recorded} / 13`;
        const progress = document.getElementById('hub-pathway-progress');
        if (progress) progress.value = recorded;

        const grid = document.getElementById('grade-grid');
        grid.replaceChildren();
        const focusGrade = Number.isInteger(pathway.next) ? pathway.next : 12;
        const unlockedGrades = Array.from({ length: 13 }, (_, g) => g).filter(g => ProfileSystem.isGradeUnlocked(g));
        const available = document.getElementById('hub-available-grades');
        if (available) available.textContent = `${unlockedGrades.length} of 13 worlds available`;
        // A future academic focus can be locked by XP. Continue takes players to
        // the most advanced accessible grade at or below that focus.
        const nextPlayable = unlockedGrades.filter(g => g <= focusGrade).at(-1) ?? unlockedGrades[0] ?? 0;
        const nextName = document.getElementById('hub-next-grade');
        if (nextName) nextName.textContent = Utils.getGradeName(nextPlayable);
        const nextNote = document.getElementById('hub-next-note');
        if (nextNote) nextNote.textContent = nextPlayable < focusGrade ?
            `Keep exploring to unlock ${Utils.getGradeName(focusGrade)}.` :
            pathway.grades[nextPlayable]?.complete ? 'Keep practicing and expanding your skills.' : 'New things are waiting to be discovered.';
        const continueBtn = document.getElementById('hub-continue');
        if (continueBtn) {
            continueBtn.disabled = !ProfileSystem.isGradeUnlocked(nextPlayable);
            continueBtn.onclick = () => this.openGrade(nextPlayable);
        }

        const regions = ['forest', 'forest', 'forest', 'forest', 'valley', 'valley', 'valley', 'cosmos', 'cosmos', 'cosmos', 'summit', 'summit', 'summit'];
        for (let grade = 0; grade <= 12; grade++) {
            const name = Utils.getGradeName(grade);
            const realm = Utils.getRealmName(grade);
            const icon = Utils.getRealmIcon(grade);
            const unlocked = ProfileSystem.isGradeUnlocked(grade);
            const bank = MathEngine.getAvailableTemplates(grade, 'all');
            const subjectCount = new Set(bank.map(t => t.category)).size;
            const status = pathway.grades[grade];
            const completed = Boolean(status.complete && status.project?.submitted);
            const statusLabel = completed ? 'Practice milestone recorded' :
                status.complete ? 'Project work needed' : status.passes ? 'Return for the next checkpoint' :
                grade === pathway.next ? 'Current learning goal' : 'Continue exploring';

            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'grade-card hub-world-card' + (unlocked ? '' : ' locked') +
                (completed ? ' hub-world-complete' : '') + (grade === nextPlayable && unlocked ? ' hub-world-featured' : '');
            card.dataset.grade = String(grade);
            card.dataset.region = regions[grade];
            card.disabled = !unlocked;
            card.setAttribute('aria-label', `${name}, ${subjectCount} subjects, ${unlocked ? statusLabel : 'locked'}`);
            // The title/icon/realm are local, fixed curriculum labels, not user content.
            card.innerHTML = `
                <div class="hub-world-card-top"><span class="hub-world-number">WORLD ${String(grade + 1).padStart(2,'0')}</span><span class="hub-world-status-symbol" aria-hidden="true">${completed ? '✓' : unlocked ? '➜' : '🔒'}</span></div>
                <div class="grade-icon" aria-hidden="true">${icon}</div>
                <div class="grade-name">${name}</div>
                <div class="grade-realm">${unlocked ? realm : 'Unlock by exploring'}</div>
                <div class="grade-coverage">${subjectCount} subjects · ${bank.length} question types</div>
                <div class="grade-academic-status">${unlocked ? statusLabel : 'Locked'}</div>
            `;
            if (unlocked) card.addEventListener('click', () => this.openGrade(grade));
            grid.appendChild(card);
        }
    },

    renderPetCareAlert() {
        const alert = document.getElementById('pet-care-alert');
        if (!alert) return;
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) { alert.hidden = true; return; }
        const atRisk = profile.pets.filter(p =>
            p.hunger >= 75 || p.happiness <= 25);
        const lost = profile.petHistory?.length || 0;
        alert.hidden = atRisk.length === 0 && lost === 0;
        alert.textContent = atRisk.length ?
            `Care needed: ${atRisk.length} pet${atRisk.length === 1 ? '' : 's'}` :
            `${lost} pet${lost === 1 ? '' : 's'} lost`;
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
                this.shopPreview = { kind: isPet ? 'pet' : 'avatar', id: item.id };
                this.renderShop();
            });
            const preview = document.createElement('button');
            preview.type = 'button';
            preview.className = 'shop-preview-button';
            preview.textContent = 'View in 3D';
            preview.setAttribute('aria-label', `Preview ${item.name} in 3D`);
            preview.addEventListener('click', () => this.previewShopItem(isPet ? 'pet' : 'avatar', item.id));
            div.append(button, preview);
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
        this.renderShopPreview();
    },

    renderStudyCompanion() {
        const wrap = document.getElementById('study-companion');
        const stage = document.getElementById('study-pet-stage');
        const pet = PetManager.getCurrentPet();
        if (!wrap || !stage) return;
        wrap.hidden = !pet;
        if (!pet || typeof Character3D === 'undefined') {
            if (typeof Character3D !== 'undefined') Character3D.release(stage);
            return;
        }
        document.getElementById('study-pet-name').textContent = pet.name;
        document.getElementById('study-pet-caption').textContent = 'Ready to learn with you!';
        Character3D.render(stage, {kind:'pet',id:pet.id,name:pet.name,emoji:pet.emoji,
            hunger:pet.hunger,happiness:pet.happiness});
    },

    renderPetRoom() {
        const refresh = PetManager.refreshAndSave();
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return;
        const pet = PetManager.getCurrentPet();
        document.getElementById('current-pet-name').textContent = pet ? pet.name : 'No Pet Selected';
        const empty = document.getElementById('pet-empty-state');
        empty.hidden = Boolean(pet);
        empty.querySelector('h3').textContent = profile.pets.length ? 'Choose a living pet' : 'No living pet selected';
        empty.querySelector('p').textContent = profile.pets.length ?
            'Select one of your pets below to interact with it.' :
            (profile.petHistory?.length ?
                'Your previous pet is no longer here. See its history below, or adopt another pet.' :
                'Earn points from questions, then adopt a pet from the shop.');
        document.getElementById('adopt-pet-btn').hidden = profile.pets.length > 0;
        document.getElementById('pet-display-area').hidden = !pet;
        document.getElementById('pet-stats').hidden = !pet;
        document.getElementById('pet-interactions').hidden = !pet;
        const status = document.getElementById('pet-status');
        status.hidden = !pet;
        status.textContent = pet ? PetManager.getPetStatus(pet).text : '';
        status.className = 'pet-status ' + (pet ? PetManager.getPetStatus(pet).class : '');
        document.getElementById('pet-character').textContent = pet ? PetManager.getPetEmoji(pet) : '';
        const petStage = document.getElementById('pet-model-stage');
        if (typeof Character3D !== 'undefined') {
            if (pet) Character3D.render(petStage, {
                kind: 'pet', id: pet.id, name: pet.name, emoji: pet.emoji,
                happiness: pet.happiness, hunger: pet.hunger
            });
            else Character3D.release(petStage);
        }
        const mood = document.getElementById('pet-mood-indicator');
        if (mood) {
            const state = pet ? PetManager.getPetStatus(pet) : null;
            mood.textContent = !pet ? 'No active pet' : pet.hunger >= 100 ? 'Starving' :
                pet.happiness <= 0 ? 'Extremely unhappy' : pet.hunger >= 75 ? 'Hungry' :
                pet.happiness <= 25 ? 'Lonely' : pet.happiness >= 75 && pet.hunger < 35 ? 'Thriving' : 'Content';
            mood.className = `pet-mood-indicator ${state?.class === 'critical' ? 'critical' : state?.class === 'warning' ? 'warning' : ''}`;
        }
        for (const [barId, valueId, value] of [
            ['happiness-bar', 'happiness-value', pet?.happiness],
            ['hunger-bar', 'hunger-value', pet?.hunger]
        ]) {
            document.getElementById(barId).style.width = `${value ?? 0}%`;
            document.getElementById(valueId).textContent = pet ? `${Math.round(value)}/100` : '—';
        }
        const xpNeeded = pet ? pet.level * 50 : 0;
        document.getElementById('xp-bar').style.width = pet ? `${Math.min(100, pet.xp / xpNeeded * 100)}%` : '0%';
        document.getElementById('level-display').textContent = pet ? `Lv${pet.level} (${pet.xp}/${xpNeeded})` : '—';
        document.querySelectorAll('.interaction-btn').forEach(btn => {
            const cost = PetManager.INTERACTION_COSTS[btn.dataset.action];
            const balance = btn.dataset.action === 'treat' ? profile.stats.crystals : profile.stats.points;
            btn.disabled = !pet || balance < cost;
        });
        document.querySelectorAll('.pet-toys .toy').forEach(btn => {
            btn.disabled = !pet || profile.stats.points < PetManager.INTERACTION_COSTS.play;
        });

        const petsList = document.getElementById('pets-list');
        petsList.replaceChildren();
        if (profile.pets.length === 0) {
            const note = document.createElement('p');
            note.className = 'empty-note';
            note.textContent = (profile.petHistory?.length ? 'No living pets. ' : 'No pets owned. ') + 'Visit the shop to adopt a new pet.';
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
            const care = document.createElement('div');
            care.className = 'pet-care-state';
            const state = PetManager.getPetStatus(ownedPet);
            care.textContent = state.class === 'critical' ? 'Critical care' :
                state.class === 'warning' ? 'Needs care' : 'Safe';
            btn.append(emoji, level, care);
            btn.addEventListener('click', () => {
                if (!ShopSystem.selectPet(ownedPet.id)) return;
                this.renderPetRoom();
            });
            petsList.appendChild(btn);
        });

        const history = document.getElementById('pet-history');
        const historyList = document.getElementById('pet-history-list');
        historyList.replaceChildren();
        history.hidden = !(profile.petHistory?.length);
        for (const record of (profile.petHistory || []).slice(-10).reverse()) {
            const entry = document.createElement('p');
            entry.className = 'pet-loss-record';
            const when = new Date(record.lostAt);
            entry.textContent = `${record.emoji || '🐾'} ${PetManager.getLossMessage(record)} ` +
                `(level ${record.level || 1}; ${Number.isNaN(when.getTime()) ? 'time unknown' : when.toLocaleString()})`;
            historyList.appendChild(entry);
        }
        if (refresh.error) {
            const warning = document.getElementById('save-warning');
            warning.textContent = refresh.error;
            warning.hidden = false;
        }
        this.renderPetCareAlert();
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
        const routeTitle=document.createElement('h4');routeTitle.textContent='Grades K–12: foundational academic pathway';route.appendChild(routeTitle);
        const pathway=ReadinessLab.pathwayReport(profile);
        const progress=document.createElement('p');progress.textContent=`${pathway.mastered}/13 grade checkpoints have repeated passing evidence and ${pathway.submitted}/13 applied assignments have drafts recorded. Each checkpoint needs two no-hint cumulative assessments ≥90% overall and in current-grade material, with review of previous grades and at least seven days between passes. Submitted writing is not automatically assessed. XP remains separate, and these unproctored practice results are not qualifications.`;route.appendChild(progress);
        for(let grade=0;grade<13;grade++){
            const line=document.createElement('p');line.textContent=`${Utils.getGradeName(grade)}: ${pathway.grades[grade].status}; ${pathway.grades[grade].project.status}`;route.appendChild(line);
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
        this.answerPending = false;
        this.answerLast = false;
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
        if (!question) return;
        this.answerPending = false;
        GameManager.awaitingContinue = false;
        document.getElementById('answer-feedback').hidden = true;
        
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
            btn.dataset.questionId = question.id;
            btn.addEventListener('click', () => {
                this.submitAnswer(answer, question.id);
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
    
    submitAnswer(answer, questionId = null) {
        if (this.answerPending) return;
        const result = GameManager.submitAnswer(answer, questionId);
        if (!result.accepted) return;

        this.answerPending = true;
        this.answerLast = result.isLastQuestion;
        GameManager.awaitingContinue = true;
        if (result.correct) AudioSystem.playCorrect();
        else if (!result.timedOut) AudioSystem.playIncorrect();
        if (typeof Character3D !== 'undefined' && PetManager.getCurrentPet()) {
            const stage = document.getElementById('study-pet-stage');
            Character3D.react(stage, result.correct ? 'play' : 'incorrect');
            document.getElementById('study-pet-caption').textContent = result.correct ?
                'Nice work!' : result.timedOut ? 'Time expired!' : 'Keep trying!';
        }
        const feedback = document.getElementById('answer-feedback');
        feedback.hidden = false;
        feedback.classList.toggle('correct', result.correct);
        feedback.classList.toggle('timed-out', result.timedOut);
        document.getElementById('answer-feedback-title').textContent = result.correct ?
            `Correct! ${result.expected}` : result.timedOut ?
            `Time expired — correct answer: ${result.expected}` :
            `Not quite — correct answer: ${result.expected}`;
        document.getElementById('answer-feedback-detail').textContent =
            `${result.questionText} — ${result.explanation}`;
        const continueButton = document.getElementById('answer-continue');
        continueButton.textContent = result.isLastQuestion ? 'View results' : 'Next question';
        for (const button of document.querySelectorAll('#answers-grid .answer-btn')) {
            const value = button.textContent;
            button.disabled = true;
            button.classList.toggle('answer-correct', MathEngine.validateAnswer({answer: result.expected, caseSensitive: result.caseSensitive}, value));
            button.classList.toggle('answer-incorrect', !result.correct && !result.timedOut && String(value) === String(result.selected));
        }
        document.getElementById('hint-btn').disabled = true;
        document.querySelector('.timer-container').hidden = true;
    },

    continueAfterAnswer() {
        if (!this.answerPending || !GameManager.currentGame || GameManager.isPaused) return;
        const last = this.answerLast;
        this.answerPending = false;
        this.answerLast = false;
        GameManager.awaitingContinue = false;
        if (last) {
            this.showResults();
            GameManager.quit();
            return;
        }
        GameManager.loadNextQuestion();
        this.renderQuestion();
        if (GameManager.currentGame.mode === 'timed') GameManager.startTimer();
        this.updateGameUI();
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
            const h=document.createElement('h4');h.textContent=`${i+1}. ${a.correct?'Correct':a.timedOut?'Time expired':'Review needed'} — ${Utils.getCategoryName(a.category||'arithmetic')}`;
            const q=document.createElement('p');q.textContent=a.question;
            const ans=document.createElement('p');ans.textContent=`Your response: ${a.selected||'(No answer)'} | Keyed response: ${a.expected||'Unavailable'}${a.attempted ? ' | Tap after timeout: ' + a.attempted : ''}`;
            const why=document.createElement('p');why.textContent=a.explanation||'Review the skill and work through the solution.';
            item.append(h,q,ans,why);review.appendChild(item);
        }
        this.showScreen('results');
    }
};

window.UIManager = UIManager;
