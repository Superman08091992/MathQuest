/**
 * Math Quest - Audio System
 */

const AudioSystem = {
    context: null,
    sfxVolume: 0.7,
    musicVolume: 0.5,
    isMuted: false,
    
    init() {
        this.sfxVolume = (SaveManager.data?.settings?.sfxVolume ?? 70) / 100;
        this.musicVolume = (SaveManager.data?.settings?.musicVolume ?? 50) / 100;
        this.isMuted = SaveManager.data?.settings?.isMuted || false;
    },
    
    initContext() {
        if (!this.context) {
            const Engine = window.AudioContext || window.webkitAudioContext;
            if (!Engine) return null;
            try { this.context = new Engine(); }
            catch (error) { console.warn('Audio unavailable:', error); return null; }
        }
        return this.context;
    },

    playTone(frequency, duration, type = 'sine') {
        if (this.isMuted || this.sfxVolume <= 0) return;
        const context = this.initContext();
        if (!context) return;  // Missing audio must never stop the game itself.
        try {
            if (context.state === 'suspended') context.resume().catch(() => {});
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.frequency.value = frequency;
            osc.type = type;
            gain.gain.setValueAtTime(this.sfxVolume * 0.3, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
            osc.connect(gain);
            gain.connect(context.destination);
            osc.start(context.currentTime);
            osc.stop(context.currentTime + duration);
        } catch (error) { console.warn('Could not play sound:', error); }
    },
    
    playCorrect() {
        this.playTone(523.25, 0.1, 'sine'); // C5
        setTimeout(() => this.playTone(659.25, 0.1, 'sine'), 50); // E5
        setTimeout(() => this.playTone(783.99, 0.2, 'sine'), 100); // G5
    },
    
    playIncorrect() {
        this.playTone(300, 0.15, 'sawtooth');
        setTimeout(() => this.playTone(200, 0.3, 'sawtooth'), 100);
    },
    
    playClick() {
        this.playTone(800, 0.05, 'sine');
    },
    
    playLevelUp() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine'), i * 100);
        });
    },
    
    playAchievement() {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine'), i * 80);
        });
    },
    
    setSfxVolume(vol) {
        this.sfxVolume = Utils.clamp(Number(vol), 0, 100) / 100;
        SaveManager.updateSettings({ sfxVolume: this.sfxVolume * 100 });
    },
    
    setMusicVolume(vol) {
        this.musicVolume = vol / 100;
    },
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        SaveManager.updateSettings({ isMuted: this.isMuted });
        return this.isMuted;
    }
};

window.AudioSystem = AudioSystem;
