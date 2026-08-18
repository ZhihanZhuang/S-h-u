# Sãhëħëħu Zdi

This repository contains the Sãhëħëħu-English dictionary, deployed as a static GitHub Pages site.

## Open in WebStorm

Open this folder as a project in WebStorm. No package installation is required. Use the built-in terminal and run `python3 -m http.server 4173`, then open `http://127.0.0.1:4173/`.

Before pushing, set the repository remote if needed:

```bash
git remote set-url origin https://github.com/ZhihanZhuang/S-h-u.git
git add .
git commit -m "Update dictionary"
git push origin main
```

WebStorm's GitHub integration can also handle login and push from the Git tool window.

## Alphabet audio

The Alphabet section has one WAV filename per letter. The current recordings are converted from the supplied M4A files and stored in `audio/letters/` using this order:

- `letter-01.wav` to `letter-20.wav`: vowels, in the order shown on the site
- `letter-21.wav` to `letter-44.wav`: consonants, in the order shown on the site

The website already has touch/click playback controls. The example word on each card follows the corresponding audio filename.

## Online editing

The editor is private by possession of the GitHub credential: click **GitHub sync** and enter a fine-grained token that has `Contents: Read and write` access to `ZhihanZhuang/S-h-u`. The token is stored only in the current browser's local storage. Each saved entry is committed directly to `data.js` on the `main` branch, so the change becomes part of the repository and is picked up by GitHub Pages.

For security, create a token limited to this repository and never commit it to the repository or share it in chat.
