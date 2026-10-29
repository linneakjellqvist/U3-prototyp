const searchInput = document.getElementById('search');
const searchContainer = document.getElementById('search-container');
const searchResults = document.getElementById('search-results');
const volumeSlider = document.getElementById('volume');
const container = document.getElementById('card-container');

const speladLåt = document.getElementById('spelad-låt');
const speladBild = document.getElementById('spelad-bild');
const speladTitel = document.getElementById('spelad-titel');
const progress = document.getElementById('progress');
const tidNu = document.getElementById('tid-nu');
const tidKvar = document.getElementById('tid-kvar');
const köLista = document.getElementById('kö-lista');

const plus = document.getElementById('plus');
const minus = document.getElementById('minus');

const köRäknare = document.getElementById('kö-räknare');
const msg = document.getElementById('msg');
const köBtn = document.getElementById('kö')
const köLi = document.getElementById('kö-li');

let songs = [];
let currentAudio = null;
const kö = [];
let msgTimer;

fetch('låtar.json')
    .then(response => response.json())
    .then(data => {
        songs = data;
        createCards(data);
    })
    .catch(error => console.error(error));

const playIkon = '<img class="playBtn" src="bilder/play.svg" alt="Spela">';
const köIkon = '<img class="köIkon" src="bilder/ko.svg" alt="Kö">';

function aktuellIkon() {
    if (currentAudio) {
        return köIkon;
    } else {
        return playIkon;
    }
}

function nyKnapp() {
    const btn = document.querySelectorAll('.låt-knapp');

    for (const b of btn) {
        b.innerHTML = aktuellIkon();
    }
}

function meddelande(text){
    msg.textContent = text;
    msg.classList.remove('hidden')

    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => msg.classList.add('hidden'), 2500);
}

function tid(sek) {

    if (sek === 0) {
        return '0:00';
    }
    if (!isFinite(sek)) { // isFinite används för att audio duration är nan innan ljudet har laddats 
        return '0:00';
    }
    if (sek < 0) {
        return '0:00';
    }

    let minuter = Math.floor(sek / 60);
    let sekunder = Math.floor(sek % 60);

    if (sekunder < 10) {
        sekunder = '0' + sekunder;
    }

    return minuter + ':' + sekunder;
}

köBtn.addEventListener('click', ()=>{
    köLista.classList.toggle('hidden');
    speladLåt.classList.toggle('utökad');
})

function visaKö() {
    köLi.innerHTML = '';

    for (const låt of kö) {

        const li = document.createElement('li');
        li.textContent = `${låt.name}, ${låt.artist}`;
        köLi.append(li);
    }

    köRäknare.textContent = kö.length;
    köRäknare.classList.toggle('hidden', kö.length === 0);
}

function uppdateraTid() {
    if (!currentAudio) {
        return;
    }

    const låtLängd = currentAudio.duration; //duration är låtens längd i sekunder

    tidNu.textContent = tid(currentAudio.currentTime);

    if (isFinite(låtLängd)) {
        tidKvar.textContent = '-' + tid(låtLängd - currentAudio.currentTime);// currentTime var i låten man är just nu 
        progress.value = currentAudio.currentTime / låtLängd;//progress är hur mycket inputen är ifylld, currentTime / duration räkna ut procenten 
    }
}

function spela(låt) {

    currentAudio = new Audio(låt.audio); //skapar ett nytt ljudobjekt 
    currentAudio.volume = volumeSlider.value / 100; //gör om volymreglaget 
    currentAudio.play(); //play startar låten 

    speladBild.src = låt.image;
    speladTitel.textContent = `${låt.name}, ${låt.artist}`;
    speladLåt.classList.remove('hidden');
    progress.value = 0;
    tidNu.textContent = '0:00';
    tidKvar.textContent = '-0:00';

    currentAudio.addEventListener('timeupdate', uppdateraTid); //när currentTime ändras
    currentAudio.addEventListener('loadedmetadata', uppdateraTid); //när webbläsaren läst in metadata alltså duration
    currentAudio.addEventListener('ended', nästaLåt); //när ljudet är slut 
    nyKnapp();
    visaKö();

    const cards = document.querySelectorAll('.card');

    for (const c of cards){
    c.classList.remove('new-card');
    }

    const i = songs.indexOf(låt);

    if(cards[i]){
        cards[i].classList.add('new-card');
    }
}

function nästaLåt() {
    if (kö.length > 0) {
        spela(kö.shift());//tar bort första elementet ur arrayen, och spelar låten
    } else {
        currentAudio = null;
        speladLåt.classList.add('hidden');
        nyKnapp();
        visaKö();
    }
}

function väljLåt(låt) {
    if (!currentAudio) {
        spela(låt);
    } else {
        kö.push(låt);//lägger till låten som är köad i kön 
        visaKö();
        meddelande(`${låt.name} har lagts till i kölistan`);
    }
}

function skapaKnapp(låt) {
    const button = document.createElement('button');
    button.classList.add('låt-knapp');
    button.innerHTML = aktuellIkon();

    button.addEventListener('click', function () {
    väljLåt(låt);
    });

    return button;
}

function createCards(låtar) {

    container.innerHTML = '';


    for (const låt of låtar) {
        const card = document.createElement('div');
        card.classList.add('card');

        card.innerHTML = `
            <img src="${låt.image}" alt="${låt.name}">
            <p>${låt.name}, ${låt.artist}</p>`;

        container.append(card);
        card.append(skapaKnapp(låt));
    }
}

searchInput.addEventListener('input', () => {
    const value = searchInput.value.toLowerCase().trim();
    searchResults.innerHTML = "";

    if (value === "") {
        return;
    }

    const filtered = songs.filter(song => song.name.toLowerCase().includes(value));

    if (filtered.length === 0) {
        searchResults.innerHTML = "<p>Denna låt finns inte i vårt system </p>";
        return;
    }

    for (const song of filtered) {
        const li = document.createElement('li');
        li.classList.add('search-result');

        li.textContent = `${song.name}, ${song.artist}`;
        li.append(skapaKnapp(song));


        searchResults.append(li);
    }
});

volumeSlider.addEventListener('input', uppdateraVolym);

function uppdateraVolym(){
    if(currentAudio){
        currentAudio.volume = volumeSlider.value / 100;
    }
}

plus.addEventListener('click', () => {
    volumeSlider.stepUp(5); 
    uppdateraVolym();
});

minus.addEventListener('click', () => {
    volumeSlider.stepDown(5);
    uppdateraVolym();
});


