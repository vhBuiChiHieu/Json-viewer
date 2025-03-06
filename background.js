// Tạo menu chuột phải khi extension được cài đặt
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "view-as-json",
    title: "View As JSON",
    contexts: ["selection"]
  });
});

// Xử lý khi người dùng bấm vào tùy chọn "Xem như JSON"
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "view-as-json" && info.selectionText) {
    // Lưu văn bản được chọn vào storage
    chrome.storage.local.set({ 
      'contextMenuSelection': info.selectionText,
      'openFromContextMenu': true
    }, () => {
      // Mở popup
      chrome.action.openPopup();
    });
  }
});
