document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const jsonInput = document.getElementById('json-input');
    const jsonDisplay = document.getElementById('json-display');
    const rawBtn = document.getElementById('raw-btn');
    const parsedBtn = document.getElementById('parsed-btn');
    const themeBtn = document.getElementById('theme-btn');
    const editorContainer = document.querySelector('.editor-container');
    const content = document.querySelector('.content');
    
    // Variable to keep track of the current mode
    let isRawMode = true; // Mặc định ở chế độ Raw khi mới mở extension

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
    
    // Hàm định dạng JSON theo mẫu của người dùng
    function formatJsonLikeExample(obj) {
        // Chuyển đổi JSON sang chuỗi có định dạng
        const jsonString = JSON.stringify(obj, null, 2);
        
        // Escape HTML characters
        const escaped = jsonString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Thay thế các ký tự cho keys và values
        const formatted = escaped
            // Keys - đóng khung với nền màu nhạt
            .replace(/"([^"]+)":/g, '"<span class="json-key">$1</span>":')
            // String values - màu xanh lá
            .replace(/: "([^"]*)"(,?)/g, ': "<span class="json-string">$1</span>"$2')
            // Number values - màu xanh dương
            .replace(/: (\d+)(,?)/g, ': <span class="json-number">$1</span>$2')
            // Boolean values - màu cam
            .replace(/: (true|false)(,?)/g, ': <span class="json-boolean">$1</span>$2')
            // Null values - màu xám
            .replace(/: (null)(,?)/g, ': <span class="json-null">$1</span>$2');
        
        return formatted;
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
    
    // Event Listeners
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
    
    // Initialize the UI
    showInput();
    jsonInput.setAttribute('placeholder', 'Dán hoặc nhập JSON vào đây...');
    
    // Đảm bảo interface hiển thị đúng với chế độ raw mode ban đầu
    rawBtn.classList.add('active');
    parsedBtn.classList.remove('active');
    
    // Thêm phím tắt để xóa nội dung và các chức năng khác
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
        
        // Ctrl+Enter hoặc Command+Enter để format JSON
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
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
