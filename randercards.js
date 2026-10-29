fetch('låtar.json')
    .then(response => response.json())
    .then(data => {
        createCards(data);
    })
    .catch(error => console.error(error));

function createCards(låtar) {
    const container = document.getElementById('card-container');
    const speladLåt = document.getElementById('spelad-låt');
    const speladBild = document.getElementById('spelad-bild');
    const speladTitel = document.getElementById('spelad-titel');
    const speladKnapp = document.getElementById('spelad-knapp');
    const progress = document.getElementById('progress');
    const tidNu = document.getElementById('tid-nu');
    const tidKvar = document.getElementById('tid-kvar');

    const playIkon = '<img class="playBtn" src="bilder/play.svg" alt="Spela">';
    const pauseIkon = '<img class="playBtn" src="bilder/pause.svg" alt="Pausa">';

    container.innerHTML = '';

    let currentAudio = null;
    let currentButton = null;
    let dragging = false; //true medans reglaget dras 

    function tid(sek){
        if (!isFinite(sek) || sek < 0) return '0:00';
        const m = Math.floor(sek/ 60);
        const s = Math.floor(sek % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function sättFyllning(){
        progress.style.setProperty('--fill', progress.value + '%');
    }

    function nyIkon(){
        const spelar = currentAudio && !currentAudio.paused;
        currentButton.innerHTML = spelar ? pauseIkon : playIkon;
        speladKnapp.innerHTML = spelar ? pauseIkon : playIkon;
    }

    function uppdateraTid(){
        if(!currentAudio || dragging){
            return;
        }
        const d = currentAudio.duration;
        tidNu.textContent = tid(currentAudio.currentTime);
        if(isFinite(d)){
            tidKvar.textContent = '-' + tid(d - currentAudio.currentTime);
            progress.value = (currentAudio.currentTime / d) * 100;
            sättFyllning();
        }
    }

    function växla(){
        if(!currentAudio){
            return;
        }
        if(currentAudio.paused){
            currentAudio.play();
        }else{
            currentAudio.pause();
        }
        nyIkon();
    }

    function spelaNy(låt, button){
        if(currentAudio){
            currentAudio.pause();
            currentButton.innerHTML = playIkon;
        }

        currentAudio = new Audio(låt.audio);
        currentButton = button;
        currentAudio.play();

        speladBild.src = låt.image;
        speladBild.alt = låt.name;
        speladTitel.textContent = `${låt.name}, ${låt.artist}`;
        speladLåt.classList.remove('hidden');
        progress.value = 0;
        sättFyllning();
        tidNu.textContent = '0:00';
        tidKvar.textContent = '-0:00';

        currentAudio.addEventListener('timeupdate', uppdateraTid);
        currentAudio.addEventListener('loadedmetadata', uppdateraTid);
        currentAudio.addEventListener('ended', () => {
            button.innerHTML = playIkon;
            speladKnapp.innerHTML = playIkon;
        });
        nyIkon();
    }

    progress.addEventListener('input', () => {
        dragging = true;
        sättFyllning();
        if(currentAudio && isFinite(currentAudio.duration)){
            const t = (progress.value / 100) * currentAudio.duration;
            tidNu.textContent = tid(t);
            tidKvar.textContent = '-' + tid(currentAudio.duration - t);
        }
    });

    progress.addEventListener('change', () =>{
        if(currentAudio && isFinite(currentAudio.duration)){
            currentAudio.currentTime = (progress.value / 100) * currentAudio.duration;
        }
        dragging = false;
    }); 
    speladKnapp.addEventListener('click', växla);


    for(const låt of låtar) {
        const card = document.createElement('div');
        card.classList.add('card');

        card.innerHTML = `
            <img src="${låt.image}" alt="${låt.name}">
            <p>${låt.name}, ${låt.artist}</p>
            <button>${playIkon}</button>
        `;

        const button = card.querySelector('button');
        button.addEventListener('click', () => {
            if(currentButton === button) {
                växla();
                return;
            } 
            spelaNy(låt, button);
            });
        container.appendChild(card);
    }
}