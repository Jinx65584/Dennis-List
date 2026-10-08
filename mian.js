// Danh sách người chơi lấy từ Appwrite
    let leaderboardData = [];

    let currentMode = 'all';
    let searchQuery = '';

    // Hàm gọi dữ liệu trực tiếp từ Appwrite Collection
    async function fetchLeaderboardFromAppwrite() {
        const container = document.getElementById('leaderboard-body');
        if (container) {
            container.innerHTML = `
                <div class="py-16 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                    <span>Đang đồng bộ dữ liệu từ Appwrite...</span>
                </div>
            `;
        }

        try {
            // Gọi API công khai của Appwrite (Yêu cầu collection players đã bật quyền Read cho 'Any')
            const response = await fetch(`https://sgp.cloud.appwrite.io/v1/databases/6abe0bb6000caab818b9/collections/6abe0d8300108a42b831/documents`, {
                headers: {
                    'X-Appwrite-Project': '6abe0b1f00000e883399',
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.documents) {
                // Map dữ liệu từ Appwrite chuẩn hóa vào leaderboardData với cơ chế xử lý tiers thông minh
                leaderboardData = data.documents.map(doc => {
                    let parsedTiers = { Sword: doc.tier || "Unranked" };
                    
                    if (doc.tiers) {
                        if (typeof doc.tiers === 'object') {
                            parsedTiers = doc.tiers;
                        } else if (typeof doc.tiers === 'string') {
                            try {
                                parsedTiers = JSON.parse(doc.tiers);
                            } catch (e) {
                                // Nếu người dùng gõ dạng thô như "Sword: HT1" hoặc "HT1"
                                if (doc.tiers.includes(':')) {
                                    const parts = doc.tiers.split(':');
                                    parsedTiers = { [parts[0].trim()]: parts[1].trim() };
                                } else {
                                    parsedTiers = { Sword: doc.tiers.trim() };
                                }
                            }
                        }
                    }

                    return {
                        name: doc.name || doc.username || "Unknown",
                        points: doc.points || 0,
                        skin: doc.skin || doc.name || "Steve",
                        tiers: parsedTiers
                    };
                });
            }

            renderLeaderboard();
        } catch (error) {
            console.error("Lỗi tải dữ liệu từ Appwrite:", error);
            if (container) {
                container.innerHTML = `
                    <div class="py-16 text-center text-red-400 text-xs flex flex-col items-center justify-center gap-2">
                        <span>Không thể kết nối tới cơ sở dữ liệu Appwrite!</span>
                    </div>
                `;
            }
        }
    }

    // Hàm render danh sách ra HTML
    function renderLeaderboard() {
        const container = document.getElementById('leaderboard-body');
        if (!container) return;

        // Lọc theo từ khóa tìm kiếm
        let filtered = leaderboardData.filter(player => 
            player.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="py-16 text-center text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
                    <img src="https://api.iconify.design/twemoji:open-mailbox-with-lowered-flag.svg" class="w-8 h-8 opacity-60" alt="Empty">
                    <span>Chưa có người chơi nào được cập nhật tier trong chế độ này.</span>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map((player, index) => {
            const tierDisplay = currentMode === 'all' 
                ? (player.tiers.Sword || 'Unranked') 
                : (player.tiers[currentMode] || 'Unranked');

            const avatarUrl = `https://vzge.me/avatars/100/${player.skin}`;

            return `
                <div class="grid grid-cols-12 px-8 py-4 items-center hover:bg-gray-800/30 transition-colors">
                    <div class="col-span-1 font-extrabold text-gray-400 text-sm">#${index + 1}</div>
                    <div class="col-span-5 flex items-center gap-3.5">
                        <div class="w-10 h-10 rounded-2xl bg-gray-800/80 border border-gray-700/50 overflow-hidden flex items-center justify-center shadow-md">
                            <img src="${avatarUrl}" class="w-full h-full object-cover" alt="${player.name}" onerror="this.src='https://api.iconify.design/twemoji:bust-in-silhouette.svg'">
                        </div>
                        <span class="font-bold text-white text-sm tracking-wide">${player.name}</span>
                    </div>
                    <div class="col-span-2 text-center font-extrabold text-pink-400 text-sm">${player.points} pts</div>
                    <div class="col-span-4 flex items-center justify-end gap-2 pr-4">
                        <span class="text-xs bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-xl text-pink-300 font-bold shadow-sm">${tierDisplay}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Hàm xử lý khi bấm nút chọn chế độ chơi
    function filterMode(mode) {
        currentMode = mode;

        const buttons = document.querySelectorAll('.mode-btn');
        buttons.forEach(btn => {
            const btnMode = btn.getAttribute('data-mode');
            if (btnMode === mode) {
                btn.className = "mode-btn flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-[11px] font-bold bg-gradient-to-r from-pink-400 to-rose-500 text-gray-950 shadow-lg shadow-pink-500/20 whitespace-nowrap transition-all duration-300 min-w-[85px]";
            } else {
                btn.className = "mode-btn flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-[11px] font-semibold bg-gray-900/80 text-gray-400 hover:text-pink-300 hover:bg-gray-800 border border-gray-800/80 hover:border-pink-500/30 whitespace-nowrap transition-all duration-300 min-w-[85px]";
            }
        });

        renderLeaderboard();
    }

    // Lắng nghe sự kiện tìm kiếm và khởi chạy
    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim();
                renderLeaderboard();
            });
        }

        // Tự động tải dữ liệu từ Appwrite ngay khi load trang
        fetchLeaderboardFromAppwrite();
        filterMode('all');
    });