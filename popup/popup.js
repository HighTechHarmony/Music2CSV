var popup_url = chrome.runtime.getURL("popup/new_popup.html");


// On page load, create a new chrome tab with the popup.html page
chrome.tabs.create({"url":popup_url}, function(tab){
    alert("Tab with id: "+tab.id+" created!");
}); 
