document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const jsonInput = document.getElementById('json-input');
    const jsonDisplay = document.getElementById('json-display');
    const rawBtn = document.getElementById('raw-btn');
    const parsedBtn = document.getElementById('parsed-btn');
    const themeBtn = document.getElementById('theme-btn');
    const scrollToggleBtn = document.getElementById('scroll-toggle-btn');
    const historyBtn = document.getElementById('history-btn');
    const historyPopup = document.getElementById('history-popup');
    const closeHistory = document.getElementById('close-history');
    const historyList = document.getElementById('history-list');
    const editorContainer = document.querySelector('.editor-container');
    const content = document.querySelector('.content');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    // Variables to keep track of the current mode and theme
    let isRawMode = true; // Mặc định ở chế độ Raw khi mới mở extension
    let currentTheme = 'default'; // Mặc định theme là Default
    let scrollEnabled = true; // Mặc định cho phép cuộn ngang
    
    // Load lịch sử JSON đã nhập
    loadJsonHistory();
    
    // Load theme đã lưu
    loadSavedTheme();
    
    // Load trạng thái cuộn đã lưu
    loadScrollState();
    
    // Kiểm tra xem có mở popup từ context menu không
    checkForContextMenuText();

    // Format JSON
    function formatJSON() {
        try {
            const jsonText = jsonInput.value.trim();
            if (!jsonText) {
                showDisplay('<div class="empty-message">Vui lòng nhập dữ liệu JSON</div>');
                return;
            }
            
            // Parse the JSON to ensure it's valid
            const jsonObj = JSON.parse(jsonText);
            
            // Lưu vào lịch sử nếu JSON hợp lệ
            saveToHistory(jsonText);
            
            // Hiệu ứng khi format thành công
            editorContainer.classList.add('format-success');
            setTimeout(() => {
                editorContainer.classList.remove('format-success');
            }, 500);
            
            if (isRawMode) {
                // Raw mode - just show the text
                showDisplay(jsonText);
            } else {
                // Parsed mode - prettify the JSON
                const formattedJSON = JSON.stringify(jsonObj, null, 4);
                showDisplayWithSyntaxHighlighting(formattedJSON);
            }
        } catch (error) {
            // Hiệu ứng khi gặp lỗi
            editorContainer.classList.add('format-error');
            setTimeout(() => {
                editorContainer.classList.remove('format-error');
            }, 500);
            
            showDisplay(`<div class="error-message"><span class="error-icon">⚠️</span> Lỗi: ${error.message}</div>`, true);
        }
    }
    
    // Show content in the display area
    function showDisplay(content, isError = false) {
        // Thêm hiệu ứng chuyển đổi
        jsonDisplay.style.opacity = '0';
        jsonInput.style.display = 'none';
        jsonDisplay.style.display = 'block';
        
        // Sử dụng setTimeout để tạo hiệu ứng hiển thị mượt mà
        setTimeout(() => {
            if (isError) {
                jsonDisplay.innerHTML = content;
            } else {
                if (typeof content === 'string' && content.startsWith('<div')) {
                    jsonDisplay.innerHTML = content;
                } else {
                    jsonDisplay.textContent = content;
                }
            }
            jsonDisplay.style.opacity = '1';
        }, 50);
    }
    
    // Apply syntax highlighting to the JSON
    function showDisplayWithSyntaxHighlighting(json) {
        jsonDisplay.style.display = 'block';
        jsonInput.style.display = 'none';
        
        // Chuẩn bị hiển thị
        jsonDisplay.style.opacity = '0';
        
        try {
            // Parse JSON để đảm bảo đúng định dạng
            const obj = JSON.parse(json);
            
            // Định dạng JSON theo kiểu trong hình mẫu
            const formattedOutput = formatJsonLikeExample(obj);
            
            // Hiển thị kết quả
            jsonDisplay.innerHTML = formattedOutput;
            
            // Hiệu ứng xuất hiện mượt mà
            setTimeout(() => {
                jsonDisplay.style.opacity = '1';
            }, 50);
        } catch (e) {
            // Nếu có lỗi, vẫn hiển thị nhưng trong dạng thông báo lỗi
            jsonDisplay.innerHTML = `<div class="error-message"><span class="error-icon">⚠️</span> Lỗi: ${e.message}</div>`;
            jsonDisplay.style.opacity = '1';
        }
    }
    
    // Hàm định dạng JSON theo mẫu của người dùng và theme hiện tại
    function formatJsonLikeExample(obj) {
        // Chuyển đổi JSON sang chuỗi có định dạng
        const jsonString = JSON.stringify(obj, null, 2);
        
        // Escape HTML characters
        const escaped = jsonString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Function tạo liên kết cho URL
        const linkifyUrl = (text) => {
            // Regex để phát hiện URL
            const urlRegex = /(https?:\/\/[^\s"]+)/g;
            return text.replace(urlRegex, url => `<a href="#" class="json-link" data-url="${url}">${url}</a>`);
        };
        
        // Thay thế các ký tự cho keys và values
        let formatted = escaped
            // Keys - đóng khung với nền màu nhạt
            .replace(/"([^"]+)":/g, '"<span class="json-key">$1</span>":');
            
        // String values - màu xanh lá và phát hiện URL
        formatted = formatted.replace(/: "([^"]*)"(,?)/g, (match, p1, p2) => {
            // Kiểm tra xem chuỗi có chứa URL hay không
            const processedString = linkifyUrl(p1);
            return `: "<span class="json-string">${processedString}</span>"${p2}`;
        });
            
        // Number values - màu xanh dương
        formatted = formatted.replace(/: (\d+)(,?)/g, ': <span class="json-number">$1</span>$2');
            
        // Boolean values - màu cam
        formatted = formatted.replace(/: (true|false)(,?)/g, ': <span class="json-boolean">$1</span>$2');
            
        // Null values - màu xám
        formatted = formatted.replace(/: (null)(,?)/g, ': <span class="json-null">$1</span>$2');
        
        // Nếu là theme mặc định, không áp dụng class theme
        if (currentTheme === 'default') {
            return formatted;
        } else {
            // Nếu không phải theme mặc định, bọc trong div có class theme tương ứng
            const themeClass = `json-theme-${currentTheme}`;
            return `<div class="${themeClass}">${formatted}</div>`;
        }
    }
    
    // Switch to input mode
    function showInput() {
        // Thêm hiệu ứng chuyển đổi
        jsonInput.style.opacity = '0';
        jsonDisplay.style.display = 'none';
        jsonInput.style.display = 'block';
        
        // Sử dụng setTimeout để tạo hiệu ứng hiển thị mượt mà
        setTimeout(() => {
            jsonInput.style.opacity = '1';
            jsonInput.focus();
        }, 50);
    }
    
    // Hàm mở URL khi click vào liên kết
    function openUrl(url) {
        // Hiển thị hộp thoại xác nhận
        if (confirm(`Bạn có muốn mở liên kết này không?\n${url}`)) {
            // Mở URL trong tab mới
            window.open(url, '_blank');
        }
    }
    
    // Event Listeners
    // Bắt sự kiện click vào liên kết trong phần Parsed JSON
    jsonDisplay.addEventListener('click', function(e) {
        // Kiểm tra xem đã click vào liên kết hay không
        if (e.target && e.target.classList.contains('json-link')) {
            e.preventDefault();
            const url = e.target.getAttribute('data-url');
            if (url) {
                openUrl(url);
            }
            return;
        }
        
        // Nếu không phải click vào liên kết và đang ở chế độ Raw, chuyển về chế độ nhập text
        if (isRawMode) {
            showInput();
        }
    });
    
    // Chỉ định dạng JSON khi người dùng bấm nút Parsed hoặc dùng phím tắt Ctrl+Enter
    
    rawBtn.addEventListener('click', function() {
        isRawMode = true;
        rawBtn.classList.add('active');
        parsedBtn.classList.remove('active');
        showInput();
    });
    
    parsedBtn.addEventListener('click', function() {
        isRawMode = false;
        parsedBtn.classList.add('active');
        rawBtn.classList.remove('active');
        formatJSON();
    });
    
    // Toggle between input and display view on click
    // Chỉ chuyển về chế độ nhập text khi đang ở chế độ Raw
    jsonDisplay.addEventListener('click', function() {
        if (isRawMode) {
            showInput();
        }
        // Không làm gì khi đang ở chế độ Parsed
    });
    
    // Hàm để thêm vào lịch sử khi có nội dung hợp lệ
    function saveToHistory(text) {
        // Nếu có nội dung hợp lệ, thêm vào lịch sử
        if (text && text.trim()) {
            addToJsonHistory(text);
        }
    }
    
    // Hàm thêm JSON vào lịch sử
    function addToJsonHistory(jsonText) {
        chrome.storage.local.get('jsonHistory', function(data) {
            let history = data.jsonHistory || [];
            
            // Kiểm tra xem jsonText đã có trong lịch sử chưa
            const existingIndex = history.findIndex(item => item === jsonText);
            
            // Nếu đã có, xóa mục cũ để không bị trùng lặp
            if (existingIndex !== -1) {
                history.splice(existingIndex, 1);
            }
            
            // Thêm vào đầu mảng
            history.unshift(jsonText);
            
            // Giữ tối đa 10 mục trong lịch sử
            if (history.length > 10) {
                history = history.slice(0, 10);
            }
            
            // Lưu lịch sử mới
            chrome.storage.local.set({ 'jsonHistory': history }, function() {
                console.log('Lịch sử JSON đã được cập nhật');
                // Cập nhật giao diện lịch sử nếu đang mở
                if (historyPopup.classList.contains('show')) {
                    updateHistoryUI();
                }
            });
        });
    }
    
    // Hàm tải lịch sử JSON
    function loadJsonHistory() {
        chrome.storage.local.get('jsonHistory', function(data) {
            if (data.jsonHistory && data.jsonHistory.length > 0) {
                updateHistoryUI();
            }
        });
    }
    
    // Hàm cập nhật giao diện lịch sử
    function updateHistoryUI() {
        chrome.storage.local.get('jsonHistory', function(data) {
            const history = data.jsonHistory || [];
            
            // Xóa tất cả mục hiện tại trong danh sách
            historyList.innerHTML = '';
            
            if (history.length === 0) {
                // Hiển thị thông báo nếu không có lịch sử
                const emptyMessage = document.createElement('li');
                emptyMessage.classList.add('empty-history');
                emptyMessage.textContent = 'Chưa có lịch sử nào';
                historyList.appendChild(emptyMessage);
            } else {
                // Tạo các mục lịch sử
                history.forEach((jsonText, index) => {
                    const item = document.createElement('li');
                    item.classList.add('history-item');
                    
                    // Hàm tạo chuỗi JSON tối giản (bỏ khoảng trắng)
                    let minifiedJson = '';
                    try {
                        // Parse và chuyển đổi thành JSON tối giản
                        minifiedJson = JSON.stringify(JSON.parse(jsonText));
                    } catch (e) {
                        // Nếu có lỗi, dùng chuỗi gốc
                        minifiedJson = jsonText.replace(/\s+/g, ' ');
                    }
                    
                    // Giới hạn độ dài hiển thị
                    let displayText = minifiedJson.substring(0, 40);
                    if (minifiedJson.length > 40) {
                        displayText += '...';
                    }
                    
                    item.textContent = displayText;
                    
                    // Thêm sự kiện click để chọn mục lịch sử
                    item.addEventListener('click', function() {
                        jsonInput.value = jsonText;
                        saveToHistory(jsonText); // Đảm bảo mục này lên đầu lịch sử
                        historyPopup.classList.remove('show'); // Đóng popup
                        showInput(); // Chuyển về chế độ nhập
                        rawBtn.classList.add('active');
                        parsedBtn.classList.remove('active');
                        isRawMode = true;
                    });
                    
                    historyList.appendChild(item);
                });
            }
        });
    }
    
    // Hàm kiểm tra và hiển thị văn bản được chọn từ context menu
    function checkForContextMenuText() {
        chrome.storage.local.get(['contextMenuSelection', 'openFromContextMenu'], function(data) {
            if (data.openFromContextMenu && data.contextMenuSelection) {
                let jsonText = data.contextMenuSelection;
                
                // Lưu vào lịch sử nếu là JSON hợp lệ
                try {
                    // Kiểm tra xem đã là JSON hợp lệ chưa
                    const parsedJson = JSON.parse(jsonText);
                    
                    // Định dạng lại JSON với indent để làm đẹp và gán vào input
                    jsonInput.value = JSON.stringify(parsedJson, null, 4);
                    
                    // Nếu đến được đây thì là JSON hợp lệ, lưu vào lịch sử
                    saveToHistory(jsonInput.value);
                    
                    // Chuyển sang chế độ parsed
                    isRawMode = false;
                    parsedBtn.classList.add('active');
                    rawBtn.classList.remove('active');
                    formatJSON();
                } catch (e) {
                    // Nếu không phải JSON hợp lệ, chỉ hiển thị text thô
                    jsonInput.value = jsonText;
                    console.log('Văn bản được chọn không phải là JSON hợp lệ:', e.message);
                }
                
                // Đặt lại cờ đã đọc để tránh hiển thị lại nếu reload popup
                chrome.storage.local.set({ 'openFromContextMenu': false });
            }
        });
    }
    
    // Initialize the UI
    showInput();
    jsonInput.setAttribute('placeholder', 'Dán hoặc nhập JSON vào đây...');
    
    // Đảm bảo interface hiển thị đúng với chế độ raw mode ban đầu
    rawBtn.classList.add('active');
    parsedBtn.classList.remove('active');
    
    // Hiển thị theme mặc định trên nút
    themeBtn.innerHTML = `Theme: Default <span class="material-icons">arrow_drop_down</span>`;
    

    
    // Thêm phím tắt để xóa nội dung và các chức năng khác
    
// Hàm bật/tắt trạng thái cuộn ngang
function toggleScrollState(enabled) {
    if (enabled) {
        // Bật cuộn ngang
        jsonInput.classList.remove('no-horizontal-scroll');
        jsonDisplay.classList.remove('no-horizontal-scroll');
        scrollToggleBtn.innerHTML = 'Cuộn <span class="material-icons">toggle_on</span>';
        scrollToggleBtn.classList.add('active');
    } else {
        // Tắt cuộn ngang
        jsonInput.classList.add('no-horizontal-scroll');
        jsonDisplay.classList.add('no-horizontal-scroll');
        scrollToggleBtn.innerHTML = 'Cuộn <span class="material-icons">toggle_off</span>';
        scrollToggleBtn.classList.remove('active');
    }
}
    
    // Hàm áp dụng theme cho toàn bộ giao diện
    function applyTheme(theme) {
        // Xóa tất cả các data-theme cũ
        document.documentElement.removeAttribute('data-theme');
        
        // Thêm data-theme mới nếu không phải default
        if (theme !== 'default') {
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        // Cập nhật nội dung nút Theme
        themeBtn.innerHTML = `Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} <span class="material-icons">arrow_drop_down</span>`;
    }
    
    // Hàm load trạng thái cuộn đã lưu
    function loadScrollState() {
        chrome.storage.local.get('scrollEnabled', function(data) {
            // Mặc định trạng thái cuộn là bật (true) nếu chưa từng lưu
            scrollEnabled = data.scrollEnabled !== undefined ? data.scrollEnabled : true;
            
            // Áp dụng trạng thái cuộn
            toggleScrollState(scrollEnabled);
        });
    }
    
    // Hàm load theme đã lưu từ trước
    function loadSavedTheme() {
        chrome.storage.local.get('currentTheme', function(data) {
            if (data.currentTheme) {
                // Cập nhật biến currentTheme
                currentTheme = data.currentTheme;
                
                // Cập nhật UI - đánh dấu theme đang được chọn
                themeOptions.forEach(opt => {
                    opt.classList.remove('active');
                    if (opt.getAttribute('data-theme') === currentTheme) {
                        opt.classList.add('active');
                    }
                });
                
                // Áp dụng theme cho toàn bộ giao diện
                applyTheme(currentTheme);
                
                // Nếu đang ở chế độ Parsed, cập nhật lại hiển thị JSON với theme mới
                if (!isRawMode && jsonInput.value.trim()) {
                    formatJSON();
                }
            }
        });
    }
    
    // Xử lý hiển thị/ẩn dropdown theme khi click
    themeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('theme-dropdown-content').classList.toggle('show');
    });
    
    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('theme-dropdown-content');
        if (!dropdown.contains(event.target) && event.target !== themeBtn) {
            dropdown.classList.remove('show');
        }
    });
    
    // Xử lý khi người dùng chọn theme từ dropdown
    themeOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Lấy theme được chọn từ data attribute
            const selectedTheme = this.getAttribute('data-theme');
            
            // Cập nhật theme hiện tại
            currentTheme = selectedTheme;
            
            // Cập nhật UI - đánh dấu theme đang được chọn
            themeOptions.forEach(opt => {
                opt.classList.remove('active');
                if (opt.getAttribute('data-theme') === selectedTheme) {
                    opt.classList.add('active');
                }
            });
            
            // Áp dụng theme cho toàn bộ giao diện
            applyTheme(selectedTheme);
            
            // Lưu theme hiện tại vào storage
            chrome.storage.local.set({ 'currentTheme': selectedTheme });
            
            // Đóng dropdown sau khi chọn theme
            document.getElementById('theme-dropdown-content').classList.remove('show');
            
            // Nếu đang ở chế độ Parsed, cập nhật lại hiển thị JSON với theme mới
            if (!isRawMode && jsonInput.value.trim()) {
                formatJSON();
            }
        });
    });
    
    // Xử lý nút lịch sử
    historyBtn.addEventListener('click', function(event) {
        event.stopPropagation(); // Ngăn sự kiện click lan tỏa đến document
        historyPopup.classList.toggle('show');
        
        // Cập nhật UI lịch sử nếu đang hiển thị
        if (historyPopup.classList.contains('show')) {
            updateHistoryUI();
        }
    });
    
    // Đóng lịch sử khi bấm nút đóng
    closeHistory.addEventListener('click', function(event) {
        event.stopPropagation();
        historyPopup.classList.remove('show');
    });
    
    // Đóng lịch sử khi click ra ngoài
    document.addEventListener('click', function(event) {
        // Kiểm tra nếu click ngoài popup và ngoài nút history
        if (!historyPopup.contains(event.target) && event.target !== historyBtn) {
            historyPopup.classList.remove('show');
        }
    });
    
    // Ngăn sự kiện click trong popup lan tỏa ra ngoài
    historyPopup.addEventListener('click', function(event) {
        event.stopPropagation();
    });
    
    // Xử lý sự kiện khi nhấn nút bật/tắt cuộn ngang
    scrollToggleBtn.addEventListener('click', function() {
        // Đảo ngược trạng thái cuộn
        scrollEnabled = !scrollEnabled;
        
        // Cập nhật UI và áp dụng trạng thái cuộn
        toggleScrollState(scrollEnabled);
        
        // Lưu trạng thái cuộn vào storage
        chrome.storage.local.set({ 'scrollEnabled': scrollEnabled });
    });
    jsonInput.addEventListener('keydown', function(event) {
        // Ctrl+X hoặc Command+X để xóa nội dung
        if ((event.ctrlKey || event.metaKey) && event.key === 'x' && !event.shiftKey) {
            jsonInput.value = '';
            jsonDisplay.innerHTML = '';
            editorContainer.classList.add('clear-effect');
            setTimeout(() => {
                editorContainer.classList.remove('clear-effect');
            }, 300);
            event.preventDefault();
        }
        
        // Format khi nhấn Ctrl+Enter hoặc Command+Enter
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            isRawMode = false;
            parsedBtn.classList.add('active');
            rawBtn.classList.remove('active');
            formatJSON();
            event.preventDefault();
        }
    });
    
    // Thêm hiệu ứng focus vào input
    jsonInput.addEventListener('focus', function() {
        editorContainer.classList.add('focused');
    });
    
    jsonInput.addEventListener('blur', function() {
        editorContainer.classList.remove('focused');
    });
});
