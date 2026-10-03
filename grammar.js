(() => {
  "use strict";
  const root = document.querySelector("#grammarContent");
  const escape = (value) => value.replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  const inline = (value) => escape(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");

  function render(markdown) {
    const lines = markdown.replace(/^\uFEFF/, "").split(/\r?\n/);
    const html = [];
    let paragraph = []; let list = false; let quote = false; let table = false;
    const flushParagraph = () => { if (paragraph.length) { html.push(`<p>${inline(paragraph.join(" "))}</p>`); paragraph = []; } };
    const closeList = () => { if (list) { html.push("</ul>"); list = false; } };
    const closeQuote = () => { if (quote) { html.push("</blockquote>"); quote = false; } };
    const closeTable = () => { if (table) { html.push("</tbody></table>"); table = false; } };
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) { flushParagraph(); closeList(); closeQuote(); closeTable(); continue; }
      if (/^\|/.test(line)) {
        flushParagraph(); closeList(); closeQuote();
        const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
        if (cells.every((cell) => /^[-: ]+$/.test(cell))) continue;
        if (!table) { html.push(`<table><thead><tr>${cells.map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead><tbody>`); table = true; }
        else html.push(`<tr>${cells.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`);
        continue;
      }
      closeTable();
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) { flushParagraph(); closeList(); closeQuote(); const level = heading[1].length; html.push(`<h${level}>${inline(heading[2])}</h${level}>`); continue; }
      if (/^>\s?/.test(line)) { flushParagraph(); closeList(); if (!quote) { html.push("<blockquote>"); quote = true; } html.push(`<p>${inline(line.replace(/^>\s?/, ""))}</p>`); continue; }
      const bullet = line.match(/^[-*+]\s+(.+)$/);
      if (bullet) { flushParagraph(); closeQuote(); if (!list) { html.push("<ul>"); list = true; } html.push(`<li>${inline(bullet[1])}</li>`); continue; }
      const code = line.match(/^\s{4}(.+)$/);
      if (code) { flushParagraph(); closeList(); closeQuote(); html.push(`<pre><code>${escape(code[1])}</code></pre>`); continue; }
      flushParagraph(); paragraph.push(line);
    }
    flushParagraph(); closeList(); closeQuote(); closeTable(); root.innerHTML = html.join("\n");
  }
  fetch("Grammatica_Sahehehu.md").then((response) => { if (!response.ok) throw new Error("Grammar file unavailable"); return response.text(); }).then(render).catch((error) => { root.innerHTML = `<p class="empty-state">${escape(error.message)}</p>`; });
})();
