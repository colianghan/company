document.addEventListener('DOMContentLoaded', function() {
    const tableContainer = document.getElementById('tableContainer');
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const loading = document.getElementById('loading');
    const searchInput = document.getElementById('searchInput');
    const updateTimeElement = document.getElementById('updateTime');
    
    // 检测是否为移动设备
    const isMobile = window.innerWidth < 768;
    document.body.classList.add(isMobile ? 'mobile-view' : 'desktop-view');
    
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        const newIsMobile = window.innerWidth < 768;
        if ((newIsMobile && !document.body.classList.contains('mobile-view')) || 
            (!newIsMobile && document.body.classList.contains('mobile-view'))) {
            document.body.classList.toggle('mobile-view');
            document.body.classList.toggle('desktop-view');
            if (window.originalData) {
                renderView(window.originalData);
            }
        }
    });
    
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
            
            // 根据设备渲染视图
            renderView(jsonData);
            
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
            renderView(window.originalData);
            return;
        }
        
        const filteredData = window.originalData.filter(item => {
            // 在所有字段中搜索
            return Object.values(item).some(value => 
                String(value).toLowerCase().includes(searchTerm)
            );
        });
        
        renderView(filteredData);
    });
    
    // 根据设备类型选择渲染方式
    function renderView(data) {
        if (document.body.classList.contains('mobile-view')) {
            renderCards(data);
        } else {
            renderTable(data);
        }
    }
    
    // 渲染卡片视图（移动端）
    function renderCards(data) {
        if (!data || data.length === 0) {
            tableContainer.innerHTML = '<div class="no-data">没有找到匹配的数据</div>';
            return;
        }
        
        // 清空表格元素
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';
        
        // 创建卡片容器
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container';
        
        // 生成卡片
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // 获取图片
            let imgSrc = '';
            if (item['图片'] && typeof item['图片'] === 'string' && 
                item['图片'].includes('image_') && 
                item['图片'].match(/\.(jpe?g|png|gif|bmp|tiff)/i)) {
                imgSrc = item['图片'];
            }
            
            // 获取产品信息
            const productName = item['产品名称\r\nProduct name'] || '';
            const price = item['单价\r\nUnitprice'] ? `${item['单价\r\nUnitprice']}` : '';
            const quantity = item['数量\r\nquantity'] ? `${item['数量\r\nquantity']}` : '';
            
            // 创建卡片内容
            card.innerHTML = `
                <div class="card-image">
                    <img src="${imgSrc}" alt="商品图片" class="product-card-image" onclick="showImageModal('${imgSrc}')">
                </div>
                <div class="card-info">
                    <h3 class="product-title">${productName}</h3>
                    <div class="product-price">￥${price}</div>
                    <div class="product-quantity">${quantity}</div>
                </div>
            `;
            
            cardsContainer.appendChild(card);
        });
        
        // 将卡片容器添加到表格容器
        tableContainer.innerHTML = '';
        tableContainer.appendChild(cardsContainer);
    }
    
    // 渲染表格函数（桌面端）
    function renderTable(data) {
        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="100%">没有找到匹配的数据</td></tr>';
            return;
        }
        
        // 恢复表格容器
        tableContainer.innerHTML = '';
        const table = document.createElement('table');
        table.id = 'priceTable';
        table.innerHTML = '<thead id="tableHead"></thead><tbody id="tableBody"></tbody>';
        tableContainer.appendChild(table);
        
        // 更新引用
        const tableHead = document.getElementById('tableHead');
        const tableBody = document.getElementById('tableBody');
        
        // 获取表头（列名）
        const columns = Object.keys(data[0]);
        
        // 重新排序列，将图片列放在最前面
        const reorderedColumns = ['图片'];
        columns.forEach(column => {
            if (column !== '图片') {
                reorderedColumns.push(column);
            }
        });
        
        // 生成表头
        let headerRow = '<tr>';
        reorderedColumns.forEach(column => {
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
            reorderedColumns.forEach(column => {
                let cellValue = item[column] !== undefined ? item[column] : '';
                
                // 检查是否是图片路径
                if (column === '图片' && typeof cellValue === 'string' && 
                    cellValue.includes('image_') && 
                    cellValue.match(/\.(jpe?g|png|gif|bmp|tiff)/i)) {
                    cellValue = `<img src="${cellValue}" alt="商品图片" class="product-image" onclick="showImageModal(this.src)">`;
                }
                
                row += `<td>${cellValue}</td>`;
            });
            row += '</tr>';
            rows += row;
        });
        tableBody.innerHTML = rows;
    }
    
    // 创建图片查看模态框
    let modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <img id="modal-image" src="" alt="商品大图">
        </div>
    `;
    document.body.appendChild(modal);
    
    // 点击图片显示大图
    window.showImageModal = function(src) {
        const modalImg = document.getElementById('modal-image');
        modalImg.src = src;
        modal.style.display = 'flex';
    }
    
    // 点击关闭按钮关闭模态框
    document.querySelector('.close-modal').addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 点击模态框外部关闭模态框
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}); 