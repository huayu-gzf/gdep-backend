/* ========================================== 
    1. 立即执行主题检查 (防闪烁核心逻辑) 
    位置：必须放在文件最第一行！ 
    ========================================== */ 
(function() { 
    try { 
        // --- 补丁开始：临时禁用页面所有过渡动画 --- 
        // 这能防止浏览器在颜色切换时“慢慢变黑”，强制瞬间完成 
        var css = '* { transition: none !important; }'; 
        var style = document.createElement('style'); 
        style.id = 'theme-transition-hack'; 
        style.appendChild(document.createTextNode(css)); 
        document.documentElement.appendChild(style); 
        // --- 补丁结束 --- 

        // 1. 读取设置 
        var savedTheme = localStorage.getItem('theme'); 
        var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; 
        
        // 2. 立即应用暗黑模式 (直接操作 html 标签) 
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) { 
            document.documentElement.setAttribute('data-theme', 'dark'); 
        } 

        // 3. 页面加载完后，恢复过渡动画 (延迟 100ms 确保渲染稳定) 
        window.addEventListener('DOMContentLoaded', function() { 
            setTimeout(function() { 
                var hackStyle = document.getElementById('theme-transition-hack'); 
                if (hackStyle) hackStyle.remove(); 
            }, 100); 
        }); 

    } catch (e) { console.log('Theme init error', e); } 
})();

// 扣子SDK集成文件 - 广东工程职业技术学院迎新助手
// 加载扣子SDK脚本
function loadCozeSDK() {
    // 检查SDK是否已加载
    if (window.CozeWebSDK) {
        initializeCoze();
        return;
    }
    
    // 创建并加载SDK脚本
    const script = document.createElement('script');
    script.src = 'https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.10/libs/cn/index.js';
    script.onload = initializeCoze;
    script.onerror = function() {
        console.error('扣子SDK加载失败');
    };
    document.head.appendChild(script);
}

// 初始化扣子SDK
function initializeCoze() {
    if (!window.CozeWebSDK) {
        console.error('扣子SDK未加载，请检查网络连接');
        return;
    }
    
    // 添加全局样式
    addCozeStyles();
    
    // 创建固定容器
    const cozeContainer = document.createElement('div');
    cozeContainer.id = 'coze-container';
    /* 核心修改 1：直接在容器上强制设置样式，防止被全局 CSS 影响 */
    cozeContainer.style.cssText = "position: fixed; bottom: 30px; right: 30px; z-index: 9999; color-scheme: light;";
    document.body.appendChild(cozeContainer);
    
    // 初始化扣子SDK客户端
    try {
        new CozeWebSDK.WebChatClient({
            config: {
                bot_id: '7571636841871441930'
            },
            container: cozeContainer,
            componentProps: {
                // 设置标题
                title: '广东工程职业技术学院 - 迎新助手',
                // 使用官方悬浮模式
                mode: 'floating',
                /* 核心修改 2：显式声明主题为 light，禁止自动随系统变色 */
                theme: 'light',
                // 配置聊天窗口尺寸
                chatWindow: {
                    width: 360,
                    height: 480,
                    /* 尝试强制指定聊天窗口主题（视SDK版本支持情况） */
                    theme: 'light'
                },
                // 配置悬浮按钮
                button: {
                    size: 'large',
                    theme: 'light',
                    icon: 'chat'
                }
            },
            auth: {
                type: 'token',
                token: 'pat_wCBasat4DEuIXnEH7pKUfSOpJZVyQB954nqfeG7Z8R0NfiZFZbkOYeKqts2JsNYm',
                onRefreshToken: function() {
                    return 'pat_wCBasat4DEuIXnEH7pKUfSOpJZVyQB954nqfeG7Z8R0NfiZFZbkOYeKqts2JsNYm'
                }
            }
        });
    } catch (error) {
        console.error('扣子SDK初始化失败:', error);
    }
}

// 添加扣子SDK所需样式
function addCozeStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 确保扣子SDK元素不影响页面其他内容 */
        #coze-web-chat {
            position: fixed !important;
            bottom: 30px !important;
            right: 30px !important;
            z-index: 9999 !important;
        }
        /* 确保聊天窗口正确显示 */
        .coze-chat-window {
            position: fixed !important;
            bottom: 100px !important;
            right: 30px !important;
            z-index: 9999 !important;
        }
        /* 核心修改 3：CSS 层面强制隔离 */
        #coze-container {
            /* 强制重置为浅色模式 */
            color-scheme: light !important;
            /* 确保字体颜色重置为黑色，防止继承页面的白色字体 */
            color: #000000 !important;
        }

        /* 强制覆盖 Coze 内部可能被污染的变量 */
        #coze-container * {
            /* 防止全局暗黑模式下的边框颜色影响组件 */
            border-color: initial;
        }
    `;
    document.head.appendChild(style);
}

// 页面加载完成后初始化
window.addEventListener('load', loadCozeSDK);

// ==========================================
// 全局搜索功能 (自动注入 + 智能高亮)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // 1. 关键词映射表
    const searchMap = {
        '奖学金': 'services-1.html',
        '国家奖学金': 'services-1.html',
        '励志': 'services-2.html',
        '助学金': 'services-3.html',
        '贷款': 'services-4.html',
        '绿色通道': 'services-6.html',
        '勤工助学': 'services-7.html',
        '兼职': 'services-7.html',
        '入党': 'services-8.html',
        '入团': 'services-9.html',
        '学生会': 'services-10.html',
        '社团': 'services-11.html',
        '请假': 'services-12.html',
        '考勤': 'regulations-12.html',
        '违纪': 'regulations-13.html',
        '宿舍': 'regulations-17.html',
        '校歌': 'school-song.html',
        '校徽': 'school-badge.html',
        '简介': 'school-overview.html'
    };

    // 初始化：注入Toast、注入搜索框、执行高亮检测
    createToastElement();
    injectSearchBox();
    checkAndHighlight(); // <-- 新增：进页面就查查有没有要高亮的

    // --- 功能函数定义 ---

    // 注入搜索框到导航栏
    function injectSearchBox() {
        const navList = document.querySelector('.nav-links');
        if (!navList) return;

        const searchLi = document.createElement('li');
        searchLi.className = 'search-item';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '🔍 搜奖学金、请假...';
        input.className = 'nav-search-input';
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const keyword = input.value.trim();
                if (keyword) {
                    performSearch(keyword);
                    input.blur();
                }
            }
        });

        searchLi.appendChild(input);
        navList.appendChild(searchLi);
    }

    // 执行搜索跳转逻辑
    function performSearch(keyword) {
        let targetUrl = '';
        
        // 模糊匹配
        for (const key in searchMap) {
            if (keyword.includes(key) || key.includes(keyword)) {
                targetUrl = searchMap[key];
                break;
            }
        }

        if (targetUrl) {
            // 构建带参数的 URL
            const currentPath = window.location.pathname;
            const basePath = currentPath.includes('/sections/') ? '' : 'sections/';
            
            // 【关键修改】在 URL 后面拼接 ?highlight=关键词
            // encodeURIComponent 用于处理中文编码
            const finalUrl = basePath + targetUrl + '?highlight=' + encodeURIComponent(keyword);
            
            window.location.href = finalUrl;
        } else {
            showToast(`🤔 没找到 "${keyword}"，试试问问右下角的 AI 助手？`);
        }
    }

    // 检查 URL 并执行高亮 (核心新功能)
    function checkAndHighlight() {
        // 1. 获取 URL 中的参数
        const params = new URLSearchParams(window.location.search);
        const keyword = params.get('highlight');

        if (keyword) {
            // 2. 找到主内容区域 (避免高亮导航栏)
            const contentArea = document.querySelector('.main-content') || document.body;
            
            // 3. 执行高亮替换
            highlightTextInNode(contentArea, keyword);

            // 4. 滚动到第一个高亮处
            const firstMatch = document.querySelector('.search-highlight-text');
            if (firstMatch) {
                setTimeout(() => {
                    firstMatch.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center' // 滚到屏幕中间，更舒服
                    });
                }, 500); // 稍微延迟一点，等页面渲染完
            }
        }
    }

    // 递归查找文本节点并替换 (比较安全的做法，不会破坏 HTML 结构)
    function highlightTextInNode(node, keyword) {
        if (node.nodeType === 3) { // 3 代表文本节点
            const text = node.nodeValue;
            if (text.includes(keyword)) {
                const span = document.createElement('span');
                // 使用正则全局替换，添加高亮标签
                const regex = new RegExp(`(${keyword})`, 'gi');
                span.innerHTML = text.replace(regex, '<span class="search-highlight-text">$1</span>');
                
                // 替换原节点
                node.parentNode.replaceChild(span, node);
            }
        } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
            // 如果是元素节点，继续递归 (跳过 script 和 style)
            // 注意：倒序循环，因为 replaceChild 会改变 childNodes 长度
            for (let i = node.childNodes.length - 1; i >= 0; i--) {
                highlightTextInNode(node.childNodes[i], keyword);
            }
        }
    }

    // 创建 Toast 元素
    function createToastElement() {
        if (document.getElementById('custom-toast')) return;
        const toast = document.createElement('div');
        toast.id = 'custom-toast';
        toast.className = 'toast-notification';
        toast.innerHTML = '<span>提示信息</span>';
        document.body.appendChild(toast);
    }

    // 显示 Toast
    function showToast(message) {
        const toast = document.getElementById('custom-toast');
        if (!toast) return;
        toast.innerHTML = `<span>${message}</span>`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ==========================================
    // 移动端侧边栏交互逻辑 (集中管理版)
    // ==========================================
    initMobileSidebar(); // 调用初始化函数



    function initMobileSidebar() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.sidebar');
        
        // 1. 自动创建或获取遮罩层 (防止 HTML 里漏写)
        let overlay = document.getElementById('sidebarOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sidebarOverlay';
            overlay.className = 'sidebar-overlay'; // 对应 CSS 类名
            document.body.appendChild(overlay);
        }

        // 只有当关键元素存在时才执行
        if (menuToggle && sidebar) {
            
            // 2. 重置按钮逻辑 (防止重复绑定)
            const newBtn = menuToggle.cloneNode(true);
            if(menuToggle.parentNode) {
                menuToggle.parentNode.replaceChild(newBtn, menuToggle);
            }
            
            // 点击打开
            newBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                openMenu();
            });

            // 3. 点击遮罩层关闭 (点击空白处)
            overlay.addEventListener('click', function() {
                closeMenu();
            });

            // 4. 点击侧边栏里的链接自动关闭
            const sidebarLinks = sidebar.querySelectorAll('a');
            sidebarLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        closeMenu();
                    }
                });
            });

            // --- 封装打开/关闭函数 ---
            function openMenu() {
                sidebar.classList.add('active');
                overlay.classList.add('active');
                // 给 body 加个标记，CSS 里用这个标记来隐藏按钮
                document.body.classList.add('sidebar-open');
                // 禁止背景滚动
                document.body.style.overflow = 'hidden';
            }

            function closeMenu() {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
                document.body.style.overflow = '';
            }
        }
    }

    // ==========================================
    // 回到顶部按钮逻辑 (修复版：监听 main-content)
    // ==========================================
    initBackToTop();

    function initBackToTop() {
        // 1. 创建按钮元素
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.innerHTML = '↑';
        btn.setAttribute('aria-label', '回到顶部');
        document.body.appendChild(btn);

        // 【关键修改】找到真正滚动的容器
        // 如果是手机端或特定布局，内容是在 .main-content 里滚动的，而不是 window
        const scrollContainer = document.querySelector('.main-content') || window;

        // 2. 监听滚动事件
        // 注意：如果是 window，用 scrollY；如果是元素，用 scrollTop
        const handleScroll = () => {
            let scrollTop = 0;
            if (scrollContainer === window) {
                scrollTop = window.scrollY;
            } else {
                scrollTop = scrollContainer.scrollTop;
            }

            if (scrollTop > 300) {
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
            }
        };

        // 绑定监听器
        scrollContainer.addEventListener('scroll', handleScroll);

        // 3. 点击回到顶部
        btn.addEventListener('click', function() {
            // 平滑滚动回顶部
            scrollContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ==========================================
    // 全站暗黑模式逻辑 (自动记忆)
    // ==========================================
    initThemeToggle();

    function initThemeToggle() {
        // 1. 找到导航栏容器 (插在搜索框后面)
        const navList = document.querySelector('.nav-links');
        if (!navList) return;

        // 2. 创建切换按钮
        const li = document.createElement('li');
        li.className = 'search-item'; // 复用这个类名以便对齐
        
        const btn = document.createElement('button');
        btn.className = 'theme-toggle-btn';
        btn.setAttribute('aria-label', '切换深色模式');
        // 默认显示月亮图标
        btn.innerHTML = '🌙';
        
        li.appendChild(btn);
        navList.appendChild(li);

        // 3. 读取本地存储，恢复用户之前的设置
        const savedTheme = localStorage.getItem('theme');
        // 如果之前存了 dark，或者没存但系统首选是 dark
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            applyTheme('dark');
        }

        // 4. 点击切换
        btn.addEventListener('click', function() {
            // 检查当前是不是暗黑模式
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            applyTheme(newTheme);
        });

        // 应用主题的函数
        function applyTheme(theme) {
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                btn.innerHTML = '☀️'; // 变成太阳
                localStorage.setItem('theme', 'dark'); // 存起来
            } else {
                document.documentElement.removeAttribute('data-theme');
                btn.innerHTML = '🌙'; // 变成月亮
                localStorage.setItem('theme', 'light'); // 存起来
            }
        }
    }
});