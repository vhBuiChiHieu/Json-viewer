// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "view-as-json",
    title: "View with JSON Viewer",
    contexts: ["selection"]
  });
  
  // Add new option to open in tab
  chrome.contextMenus.create({
    id: "view-as-json-tab",
    title: "View with JSON Viewer (Tab)",
    contexts: ["selection"]
  });
});

// Handle when user clicks on "View As JSON" option
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "view-as-json" && info.selectionText) {
    // Save selected text to storage
    chrome.storage.local.set({ 
      'contextMenuSelection': info.selectionText,
      'openFromContextMenu': true
    }, () => {
      // Open popup
      chrome.action.openPopup();
    });
  }
  
  // Handle when user clicks on "View As JSON (Tab)" option
  if (info.menuItemId === "view-as-json-tab" && info.selectionText) {
    try {
      // Try to parse JSON to check validity and reformat
      const jsonObj = JSON.parse(info.selectionText);
      // Format JSON with 2 spaces
      const formattedJson = JSON.stringify(jsonObj, null, 2);
      
      // Save formatted text to storage
      chrome.storage.local.set({ 
        'tabContextMenuSelection': formattedJson,
        'openTabFromContextMenu': true
      }, () => {
        // Create URL for editor.html
        const editorUrl = chrome.runtime.getURL('editor.html') + '?source=contextMenu';
        
        // Open new tab with editor URL
        chrome.tabs.create({ url: editorUrl });
      });
    } catch (e) {
      // If not valid JSON, still save original text
      chrome.storage.local.set({ 
        'tabContextMenuSelection': info.selectionText,
        'openTabFromContextMenu': true
      }, () => {
        const editorUrl = chrome.runtime.getURL('editor.html') + '?source=contextMenu';
        chrome.tabs.create({ url: editorUrl });
      });
    }
  }
});
