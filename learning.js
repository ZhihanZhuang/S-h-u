(() => {
  "use strict";
  const entries = window.DICTIONARY_DATA.entries;
  const alphabet = {
    vowel: ["a", "e", "i", "o", "u", "ʉ", "ɔ", "ø", "ã", "ẽ", "ĩ", "ũ", "ë", "â", "ê", "î", "û", "ô", "ɔ̂", "ē"],
    consonant: ["w", "d", "s", "z", "ɕ", "v", "c", "b", "n", "m", "l", "k", "h", "g", "f", "p", "t", "r", "ŋ", "ħ", "ʑ", "tɕ", "cɕ", "cz"]
  };
  const audioExamples = {
    a: "ara", e: "gecze", i: "sêħi", o: "guêdo", u: "ubu", "ʉ": "ʉëriã", "ɔ": "dãsɔ", "ø": "bøcz",
    "ã": "ãmô", "ẽ": "sẽti", "ĩ": "ĩħer", "ũ": "kũgɔ", "ë": "ëħu", "â": "dofâ", "ê": "bêsê", "î": "îħiã", "û": "âgû", "ô": "lôdi", "ɔ̂": "ɔcɔ̂", "ē": "zêrē",
    w: "wêdã", d: "diħië", s: "së", z: "zħnʉ", "ɕ": "ɕɔbãħio", v: "vucɕĩ", c: "ɔcɔ̂", b: "bêɕã", n: "nõ", m: "mê", l: "lĩ", k: "kũgɔ", h: "huɕē", g: "ga", f: "fõ", p: "piɔriã", t: "loti", r: "virë", "ŋ": "ŋabu", "ħ": "bãħio", "ʑ": "ʑĩ", "tɕ": "tɕiu", "cɕ": "cɕē", cz: "czøħo"
  };
  const dailyButton = document.querySelector("#dailyWordButton");

  const todayEntry = () => {
    const now = new Date();
    const day = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
    return entries[day % entries.length];
  };

  function renderDaily() {
    if (!dailyButton) return;
    const entry = todayEntry();
    document.querySelector("#dailyNative").textContent = entry.native;
    document.querySelector("#dailyEnglish").textContent = entry.english;
    document.querySelector("#dailyMeta").textContent = `${entry.partOfSpeech || "Uncategorized"} · ${entry.category || "No category"}`;
    const example = document.querySelector("#dailyExample");
    if (entry.example || entry.exampleTranslation) {
      example.hidden = false;
      document.querySelector("#dailyExampleNative").textContent = entry.example;
      document.querySelector("#dailyExampleEnglish").textContent = entry.exampleTranslation;
    }
  }

  function renderAlphabet() {
    const root = document.querySelector("#alphabetGroups");
    if (!root) return;
    const fragment = document.createDocumentFragment();
    for (const [kind, letters] of Object.entries(alphabet)) {
      const group = document.createElement("section"); group.className = "alphabet-group";
      const heading = document.createElement("h3"); heading.textContent = kind; group.append(heading);
      const grid = document.createElement("div"); grid.className = "alphabet-grid";
      const offset = kind === "vowel" ? 0 : alphabet.vowel.length;
      letters.forEach((letter, index) => {
        const card = document.createElement("article"); card.className = "letter-card";
        const button = document.createElement("button"); button.type = "button"; button.className = "letter-button"; button.setAttribute("aria-label", `Play pronunciation for ${letter}`);
        button.innerHTML = `<span class="letter-symbol"></span><span class="play-label">Play sound</span>`; button.firstChild.textContent = letter;
        const audio = document.createElement("audio"); audio.preload = "none"; audio.src = `audio/letters/letter-${String(offset + index + 1).padStart(2, "0")}.wav`;
        const sampleNative = audioExamples[letter];
        const sample = entries.find((entry) => entry.native.normalize("NFC") === sampleNative.normalize("NFC"));
        const example = document.createElement("p"); example.className = "letter-example"; example.innerHTML = "<span>Example</span>";
        const word = document.createElement("strong"); word.textContent = sample ? `${sample.native} — ${sample.english}` : `${sampleNative} — example`; example.append(word);
        const status = document.createElement("p"); status.className = "audio-status"; status.textContent = "Ready to play";
        button.addEventListener("click", () => audio.play().then(() => { status.textContent = "Playing"; }).catch(() => { status.textContent = "Add MP3 to play"; }));
        audio.addEventListener("ended", () => { status.textContent = "Audio ready"; });
        card.append(button, example, status, audio); grid.append(card);
      });
      group.append(grid); fragment.append(group);
    }
    root.append(fragment);
  }
  renderDaily(); renderAlphabet();
})();
