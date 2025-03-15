document.addEventListener('DOMContentLoaded', function() {
    const tableContainer = document.getElementById('tableContainer');
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const loading = document.getElementById('loading');
    const searchInput = document.getElementById('searchInput');
    const updateTimeElement = document.getElementById('updateTime');
    
    // 设置更新时间
    const now = new Date();
    updateTimeElement.textContent = now.toLocaleString('zh-CN');
    
    // 加载JSON文件
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载JSON文件');
            }
            return response.json();
        })
        .then(jsonData => {
            if (!jsonData || jsonData.length === 0) {
                throw new Error('JSON文件中没有数据');
            }
            
            // 处理数据中的换行符，并确保图片路径正确
            jsonData = processData(jsonData);
            
            // 缓存原始数据用于搜索
            window.originalData = jsonData;
            
            // 渲染表格
            renderTable(jsonData);
            
            // 显示表格容器，隐藏加载指示器
            loading.style.display = 'none';
            tableContainer.style.display = 'block';
        })
        .catch(error => {
            console.error('加载数据时出错:', error);
            loading.innerHTML = `<p class="error">加载数据时出错: ${error.message}</p>`;
        });
    
    // 处理数据中的换行符和图片路径
    function processData(data) {
        return data.map(item => {
            const newItem = {...item};
            
            // 处理每个字段
            Object.keys(newItem).forEach(key => {
                // 处理换行符，使其在HTML中正确显示
                if (typeof newItem[key] === 'string') {
                    newItem[key] = newItem[key].replace(/\r\n/g, '<br>');
                }
            });
            
            // 确保图片路径正确
            if (newItem['图片'] && typeof newItem['图片'] === 'string') {
                // 如果图片字段存在并且不为空
                if (!newItem['图片'].startsWith('public/')) {
                    newItem['图片'] = `public/${newItem['图片']}`;
                }
            }
            
            return newItem;
        });
    }
    
    // 搜索功能
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (!window.originalData) return;
        
        if (searchTerm === '') {
            renderTable(window.originalData);
            return;
        }
        
        const filteredData = window.originalData.filter(item => {
            // 在所有字段中搜索
            return Object.values(item).some(value => 
                String(value).toLowerCase().includes(searchTerm)
            );
        });
        
        renderTable(filteredData);
    });
    
    // 渲染表格函数
    function renderTable(data) {
        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="100%">没有找到匹配的数据</td></tr>';
            return;
        }
        
        // 获取表头（列名）
        const columns = Object.keys(data[0]);
        
        // 生成表头
        let headerRow = '<tr>';
        columns.forEach(column => {
            // 如果列名包含<br>标签，只显示第一部分
            const columnText = column.split('<br>')[0];
            headerRow += `<th>${columnText}</th>`;
        });
        headerRow += '</tr>';
        tableHead.innerHTML = headerRow;
        
        // 生成表格行
        let rows = '';
        data.forEach(item => {
            let row = '<tr>';
            columns.forEach(column => {
                let cellValue = item[column] !== undefined ? item[column] : '';
                
                // 检查是否是图片路径
                if (column === '图片' && typeof cellValue === 'string' && 
                    cellValue.includes('image_') && 
                    cellValue.match(/\.(jpe?g|png|gif|bmp|tiff)/i)) {
                    cellValue = `<img src="${cellValue}" alt="商品图片" class="product-image">`;
                }
                
                row += `<td>${cellValue}</td>`;
            });
            row += '</tr>';
            rows += row;
        });
        tableBody.innerHTML = rows;
    }
}); 