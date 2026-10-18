/* Progressive Web App installation and offline registration. */
(() => {
    let installPrompt = null;
    const installButton = document.getElementById('install-app');
    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        installPrompt = event;
        if (installButton) installButton.hidden = false;
    });
    installButton?.addEventListener('click', async () => {
        if (!installPrompt) return;
        const prompt = installPrompt;
        installPrompt = null;
        installButton.hidden = true;
        await prompt.prompt();
    });
    window.addEventListener('appinstalled', () => {
        installPrompt = null;
        if (installButton) installButton.hidden = true;
    });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js').catch(error => {
                console.warn('Offline cache unavailable:', error);
            });
        });
    }
})();
