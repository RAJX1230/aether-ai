function exportCurrentChat() {
  if (!currentChatId || !chats[currentChatId]) {
    alert("Koi chat select nahi hai.");
    return;
  }

  const chat = chats[currentChatId];
  const history = chat.history;

  if (history.length === 0) {
    alert("Ye chat khaali hai, export karne ko kuch nahi hai.");
    return;
  }

  let content = `AETHER AI - Chat Export\n`;
  content += `Chat Title: ${chat.title}\n`;
  content += `Exported: ${new Date().toLocaleString()}\n`;
  content += `${"=".repeat(40)}\n\n`;

  history.forEach(item => {
    if (item.role === "user") {
      const textPart = item.parts.find(p => p.text);
      const filePart = item.parts.find(p => p.inline_data);
      content += `YOU: ${textPart ? textPart.text : ""}`;
      if (filePart) content += ` [File attached]`;
      content += `\n\n`;
    } else {
      const text = item.parts[0].text;
      const answerMatch = text.match(/Answer:(.*)/s);
      const finalText = answerMatch ? answerMatch[1].trim() : text;
      content += `AETHER: ${finalText}\n\n`;
    }
  });

  const blob = new Blob(["\ufeff" + content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${chat.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
