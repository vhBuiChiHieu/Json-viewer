document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const jsonInput = document.getElementById('json-input');
    const jsonDisplay = document.getElementById('json-display');
    const themeBtn = document.getElementById('theme-btn');
    const scrollToggleBtn = document.getElementById('scroll-toggle-btn');
    const historyBtn = document.getElementById('history-btn');
    const historyPopup = document.getElementById('history-popup');
    const closeHistory = document.getElementById('close-history');
    const historyList = document.getElementById('history-list');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    // Variables to keep track of the current mode and theme
    let currentTheme = 'default'; // Mặc định theme là Default
    let scrollEnabled = true; // Mặc định cho phép cuộn ngang
    
    // Load lịch sử JSON đã nhập
    loadJsonHistory();
    
    // Load theme đã lưu
    loadSavedTheme();
    
    // Load trạng thái cuộn đã lưu
    loadScrollState();
    
    // Tự động hiển thị định dạng parsed khi người dùng nhập JSON
    jsonInput.addEventListener('input', function() {
        processJsonInput();
    });
    
    // Xử lý JSON input
    function processJsonInput() {
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
            
            // Hiển thị JSON đã định dạng
            const formattedOutput = formatJsonLikeExample(jsonObj);
            jsonDisplay.innerHTML = formattedOutput;
            
        } catch (e) {
            // Nếu có lỗi, vẫn hiển thị nhưng trong dạng thông báo lỗi
            jsonDisplay.innerHTML = `<div class="error-message"><span class="error-icon">⚠️</span> Lỗi: ${e.message}</div>`;
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
            
        // Number values - màu xanh dương (bao gồm cả số âm và số thập phân)
        formatted = formatted.replace(/: (-?\d+\.?\d*)(,?)/g, ': <span class="json-number">$1</span>$2');
            
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
    
    function showDisplay(content) {
        jsonDisplay.innerHTML = content;
    }
    
    // Toggles scroll state
    function toggleScrollState(enabled) {
        if (enabled) {
            jsonInput.classList.remove('no-horizontal-scroll');
            jsonDisplay.classList.remove('no-horizontal-scroll');
        } else {
            jsonInput.classList.add('no-horizontal-scroll');
            jsonDisplay.classList.add('no-horizontal-scroll');
        }
    }
    
    // Load saved scroll state from storage
    function loadScrollState() {
        chrome.storage.local.get('scrollEnabled', function(data) {
            scrollEnabled = data.scrollEnabled !== undefined ? data.scrollEnabled : true;
            toggleScrollState(scrollEnabled);
            updateScrollToggleButton();
        });
    }
    
    // Update scroll toggle button appearance
    function updateScrollToggleButton() {
        if (scrollEnabled) {
            scrollToggleBtn.classList.add('active');
            scrollToggleBtn.innerHTML = 'Cuộn <span class="material-icons">toggle_on</span>';
        } else {
            scrollToggleBtn.classList.remove('active');
            scrollToggleBtn.innerHTML = 'Cuộn <span class="material-icons">toggle_off</span>';
        }
    }
    
    // Event Listener for scroll toggle button
    scrollToggleBtn.addEventListener('click', function() {
        scrollEnabled = !scrollEnabled;
        
        // Lưu trạng thái cuộn vào storage
        chrome.storage.local.set({ 'scrollEnabled': scrollEnabled });
        
        // Cập nhật giao diện
        toggleScrollState(scrollEnabled);
        updateScrollToggleButton();
    });
    
    // Load saved theme
    function loadSavedTheme() {
        chrome.storage.local.get('theme', function(data) {
            if (data.theme) {
                currentTheme = data.theme;
                applyTheme(currentTheme);
                
                // Highlight the active theme in dropdown
                themeOptions.forEach(option => {
                    if (option.getAttribute('data-theme') === currentTheme) {
                        option.classList.add('active');
                    } else {
                        option.classList.remove('active');
                    }
                });
            }
        });
    }
    
    // Apply theme to the document
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Nếu đã có JSON trong display, cần format lại để áp dụng theme mới
        if (jsonInput.value.trim()) {
            try {
                const jsonObj = JSON.parse(jsonInput.value);
                const formattedOutput = formatJsonLikeExample(jsonObj);
                jsonDisplay.innerHTML = formattedOutput;
            } catch (e) {
                // Bỏ qua lỗi nếu có
            }
        }
    }
    
    // Theme dropdown
    themeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('theme-dropdown-content').classList.toggle('show');
    });
    
    // Theme selection
    themeOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedTheme = this.getAttribute('data-theme');
            
            // Chỉ thay đổi nếu là theme mới
            if (selectedTheme !== currentTheme) {
                // Lưu theme vào storage
                chrome.storage.local.set({ 'theme': selectedTheme });
                
                // Cập nhật giao diện
                currentTheme = selectedTheme;
                applyTheme(currentTheme);
                
                // Highlight theme đang chọn
                themeOptions.forEach(opt => {
                    opt.classList.remove('active');
                });
                this.classList.add('active');
            }
            
            // Đóng dropdown sau khi chọn
            document.getElementById('theme-dropdown-content').classList.remove('show');
        });
    });
    
    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', function(e) {
        if (!themeBtn.contains(e.target)) {
            document.getElementById('theme-dropdown-content').classList.remove('show');
        }
    });
    
    // History button event
    historyBtn.addEventListener('click', function() {
        historyPopup.style.display = 'flex';
    });
    
    // Close history button event
    closeHistory.addEventListener('click', function() {
        historyPopup.style.display = 'none';
    });
    
    // Close history popup when clicking outside
    historyPopup.addEventListener('click', function(e) {
        if (e.target === historyPopup) {
            historyPopup.style.display = 'none';
        }
    });
    
    // Load JSON history
    function loadJsonHistory() {
        chrome.storage.local.get('jsonHistory', function(data) {
            const history = data.jsonHistory || [];
            
            // Hiển thị lịch sử
            displayJsonHistory(history);
        });
    }
    
    // Display JSON history
    function displayJsonHistory(history) {
        if (history.length === 0) {
            historyList.innerHTML = '<li class="empty-history">Chưa có lịch sử JSON nào</li>';
            return;
        }
        
        let historyHTML = '';
        
        // Hiển thị tối đa 30 mục lịch sử gần nhất
        for (let i = 0; i < Math.min(history.length, 30); i++) {
            const item = history[i];
            const date = new Date(item.timestamp);
            const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            // Cắt ngắn JSON cho hiển thị
            let jsonPreview = item.json;
            if (jsonPreview.length > 50) {
                jsonPreview = jsonPreview.substring(0, 50) + '...';
            }
            
            historyHTML += `
                <li class="history-item" data-json="${encodeURIComponent(item.json)}">
                    <div>
                        <div class="history-preview">${jsonPreview}</div>
                        <div class="history-date">${dateString}</div>
                    </div>
                </li>
            `;
        }
        
        historyList.innerHTML = historyHTML;
        
        // Add click event to history items
        const historyItems = document.querySelectorAll('.history-item');
        historyItems.forEach(item => {
            item.addEventListener('click', function() {
                const jsonData = decodeURIComponent(this.getAttribute('data-json'));
                jsonInput.value = jsonData;
                historyPopup.style.display = 'none';
                
                // Process the loaded JSON
                processJsonInput();
            });
        });
    }
    
    // Save to history
    function saveToHistory(jsonText) {
        chrome.storage.local.get('jsonHistory', function(data) {
            let history = data.jsonHistory || [];
            
            // Kiểm tra xem đã có JSON này trong lịch sử chưa
            const exists = history.some(item => item.json === jsonText);
            
            if (!exists) {
                // Thêm vào đầu mảng để hiển thị ở đầu danh sách
                history.unshift({
                    json: jsonText,
                    timestamp: new Date().getTime()
                });
                
                // Giới hạn lịch sử chỉ lưu tối đa 100 mục
                if (history.length > 100) {
                    history = history.slice(0, 100);
                }
                
                // Lưu lịch sử mới vào storage
                chrome.storage.local.set({ 'jsonHistory': history });
            } else {
                // Nếu JSON đã tồn tại, di chuyển nó lên đầu danh sách
                history = history.filter(item => item.json !== jsonText);
                history.unshift({
                    json: jsonText,
                    timestamp: new Date().getTime()
                });
                
                // Lưu lịch sử mới vào storage
                chrome.storage.local.set({ 'jsonHistory': history });
            }
            
            // Cập nhật hiển thị lịch sử
            displayJsonHistory(history);
        });
    }
    
    // Hiệu ứng khi load trang
    document.body.classList.add('loaded');
    
    // Hàm mở URL khi click vào liên kết
    function openUrl(url) {
        // Hiển thị hộp thoại xác nhận
        if (confirm(`Bạn có muốn mở liên kết này không?\n${url}`)) {
            // Mở URL trong tab mới
            window.open(url, '_blank');
        }
    }
    
    // Bắt sự kiện click vào liên kết trong phần JSON
    jsonDisplay.addEventListener('click', function(e) {
        // Kiểm tra xem đã click vào liên kết hay không
        if (e.target && e.target.classList.contains('json-link')) {
            e.preventDefault();
            const url = e.target.getAttribute('data-url');
            openUrl(url);
        }
    });

    // Kiểm tra nếu có URL params
    const urlParams = new URLSearchParams(window.location.search);
    const jsonParam = urlParams.get('json');
    
    if (jsonParam) {
        try {
            // Decode và đặt giá trị vào input
            jsonInput.value = decodeURIComponent(jsonParam);
            // Xử lý JSON input
            processJsonInput();
        } catch (e) {
            console.error('Error loading JSON from URL param:', e);
        }
    }
});
