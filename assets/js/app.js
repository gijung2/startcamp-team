const { createApp, ref, computed, nextTick, onMounted, watch } = Vue;

        createApp({
            setup() {
                // Currently Selected Region Context (Toggleable between Seoul and Kyungbuk/Gumi)
                const currentRegion = ref('Seoul');

                // System Tabs matching the top right navigation in image_7a7c03.png
                const tabs = [
                    { id: 'home', name: 'Home' },
                    { id: 'info', name: 'Local Info' },
                    { id: 'map', name: 'Map' },
                    { id: 'board', name: 'Community' }
                ];
                const activeTab = ref('home');

                // 보유한 서울 지역 JSON 데이터 기준 카테고리
                const categories = [
                    { id: 'tourist', name: '관광지', icon: 'fa-solid fa-tree' },
                    { id: 'sports', name: '레포츠', icon: 'fa-solid fa-person-running' },
                    { id: 'culture', name: '문화시설', icon: 'fa-solid fa-landmark' },
                    { id: 'shopping', name: '쇼핑', icon: 'fa-solid fa-bag-shopping' },
                    { id: 'stay', name: '숙박', icon: 'fa-solid fa-hotel' },
                    { id: 'course', name: '여행코스', icon: 'fa-solid fa-route' },
                    { id: 'festival', name: '축제공연행사', icon: 'fa-solid fa-calendar-days' }
                ];
                const activeCategory = ref('');

                // Recent posts strictly mirroring the list in image_7a7c03.png
                const samplePosts = ref([
                    { id: 1, category: '쇼핑', title: '동대문 야시장 쇼핑 팁', author: '쇼핑고수', content: '동대문 패션타운 야시장은 금, 토 야간에 도매 물건이 활성화되어 볼거리가 가득합니다. 개인 구매 시에는 현금을 챙기시는 편이 가격 협상에 아주 유용합니다. 주차는 인근 공영주차장 이용을 적극 권장해 드립니다.', password: '1234', views: 17, date: '2026-07-10', comments: [] },
                    { id: 2, category: '숙박', title: '강남 근처 가성비 숙소 후기', author: '출장맨', content: '출장 차 방문했는데 역삼역 도보 5분 거리에 1박 8만원대 깨끗하고 가성비 훌륭한 비즈니스 호텔이 있어 공유해드립니다. 침구류 위생 상태가 수준급이며 어메니티 패키지도 풍부합니다.', password: '1234', views: 1, date: '2026-07-12', comments: [] },
                    { id: 3, category: '축제공연행사', title: '이번 달 서울 축제 일정 공유', author: '축제요정', content: '반포 한강공원에서 야간 도깨비 야시장 및 분수 쇼 일정이 이번주 주말부터 정식으로 시작됩니다. 가족 연인분들이 돗자리 펴고 저녁 푸드트럭 야식도 먹고 가을 강바람을 쐬기에 알맞은 코스입니다.', password: '1234', views: 3, date: '2026-07-13', comments: [] },
                    { id: 4, category: '레포츠', title: '잠실종합운동장 러닝 코스 후기', author: '러닝초보', content: '잠실종합운동장 주변은 평탄한 보행로와 한강 접근성이 좋아 가볍게 달리기 좋은 코스입니다. 저녁 시간에는 이용자가 많으므로 보행자와 자전거 통행에 주의하면서 이용하는 것을 추천합니다.', password: '1234', views: 1, date: '2026-07-14', comments: [] },
                    { id: 5, category: '관광지', title: '양화한강공원 자전거 코스 추천', author: '여행러버', content: '선유도 일원으로 넘어가는 양화나루 코스가 시원하게 자전거 타기에 참 멋집니다. 주말 정체 구간이 덜하고 노을 경관이 수려해 오후 6시 전후 시간대에 꼭 자전거 라이딩 가보시는 것을 추천드립니다.', password: '1234', views: 7, date: '2026-07-14', comments: [] }
                ]);

                // Region database directories (Seoul only)
                const directoryLocations = [
                    { name: '양화 한강공원', type: 'tourist', lat: 37.5385, lng: 126.8971, address: '서울 영등포구 노들로 110', phone: '02-3780-0581', desc: '선유도 공원과 맞닿은 수려한 한강 조망 명소이며 시원하게 잘 뚫린 한강 종주 자전거 코스 및 정원 쉼터가 있습니다.' },
                    { name: '세종문화회관', type: 'culture', lat: 37.5724, lng: 126.9757, address: '서울 종로구 세종대로 175', phone: '02-399-1000', desc: '다양한 클래식, 뮤지컬, 현대 예술 전시가 연중 끊이지 않는 대한민국 대표 문화 예술 전시 극장 공간입니다.' },
                    { name: '반포 한강 달빛축제', type: 'festival', lat: 37.5113, lng: 126.9967, address: '서울 서초구 반포동 한강공원', phone: '02-120', desc: '반포대교 무지개분수 연동 무대 아래 화려한 먹거리 푸드트럭 야시장 장터가 함께 서는 밤의 시그니처 축제 마당입니다.' },
                    { name: '남산 둘레길 코스', type: 'course', lat: 37.5512, lng: 126.9882, address: '서울 중구 회현동 남산', phone: '02-3783-5900', desc: '도심 속 울창한 숲터널을 안전하고 산뜻하게 걸을 수 있는 가벼운 보행 전용 데크 산책로입니다.' },
                    { name: '잠실 스포츠 복합단지', type: 'sports', lat: 37.5148, lng: 127.0729, address: '서울 송파구 올림픽로 25', phone: '02-2240-8800', desc: '야구, 축구, 마라톤 등 다양한 육상 구기 체험과 레포츠 활성화를 지원하는 메가 체육 단지 시설입니다.' },
                    { name: '강남 비즈니스 관광 호텔', type: 'stay', lat: 37.5005, lng: 127.0362, address: '서울 강남구 테헤란로 12', phone: '02-555-0012', desc: '가성비와 청결함, 뛰어난 교통망을 지녀 출장맨 및 도심 호캉스 휴가족들이 즐겨 찾는 고성능 위생 휴식처입니다.' },
                    { name: '동대문 평화패션 타운', type: 'shopping', lat: 37.5694, lng: 127.0097, address: '서울 중구 을지로6가', phone: '02-2262-0114', desc: '개성 넘치는 다양한 신상 의류들과 소품을 24시간 도소매 가격으로 가장 먼저 소비해볼 수 있는 한국의 패션 심장입니다.' }
                ];

                const activeInfoCategory = ref('all');
                const infoSearch = ref('');
                const infoCurrentPage = ref(1);
                const infoPageSize = 20;
                const selectedInfoItem = ref(null);

                // API에서 image_url, firstimage, image 등의 필드가 내려오면 우선 사용합니다.
                // 이미지가 없는 샘플 데이터는 카테고리별 기본 이미지를 사용합니다.
                const locationFallbackImages = {
                    tourist: 'https://images.unsplash.com/photo-1538485399081-7c8971a7a58b?auto=format&fit=crop&w=900&q=80',
                    culture: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=80',
                    festival: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
                    course: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=80',
                    sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80',
                    stay: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
                    shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80'
                };

                // Board and Community variables
                const boardFilter = ref('all');
                const boardSearch = ref('');
                const boardCurrentPage = ref(1);
                const boardPageSize = 10;
                const currentPost = ref(null);
                const isWriting = ref(false);
                const isEditing = ref(false);
                const form = ref({
                    id: null,
                    category: '관광지',
                    author: '',
                    title: '',
                    content: '',
                    password: ''
                });

                const commentForm = ref({
                    author: '',
                    content: '',
                    password: ''
                });

                const passwordPrompt = ref({
                    show: false,
                    action: '',
                    postId: null,
                    commentId: null,
                    passwordInput: '',
                    error: ''
                });

                const selectedLocationName = ref('');

                // Kakao map state. Replace this value with the JavaScript key issued in Kakao Developers.
                const KAKAO_MAP_APP_KEY = 'YOUR_KAKAO_JAVASCRIPT_KEY';
                const mapCategory = ref('tourist');
                const mapSetupRequired = ref(KAKAO_MAP_APP_KEY === 'YOUR_KAKAO_JAVASCRIPT_KEY');

                const filteredMapLocations = computed(() => {
                    return directoryLocations.filter(item => item.type === mapCategory.value);
                });

                // Filter items according to categories and search
                const filteredInfoItems = computed(() => {
                    const keyword = infoSearch.value.trim().toLowerCase();

                    return directoryLocations.filter(item => {
                        const catMatch = activeInfoCategory.value === 'all' || item.type === activeInfoCategory.value;
                        const searchableText = [item.name, item.address, item.desc]
                            .filter(Boolean)
                            .join(' ')
                            .toLowerCase();
                        const searchMatch = !keyword || searchableText.includes(keyword);
                        return catMatch && searchMatch;
                    });
                });

                const infoTotalPages = computed(() => {
                    return Math.max(1, Math.ceil(filteredInfoItems.value.length / infoPageSize));
                });

                const paginatedInfoItems = computed(() => {
                    const start = (infoCurrentPage.value - 1) * infoPageSize;
                    return filteredInfoItems.value.slice(start, start + infoPageSize);
                });

                watch([activeInfoCategory, infoSearch], () => {
                    infoCurrentPage.value = 1;
                });

                // Filtered posts for community search
                const filteredBoardPosts = computed(() => {
                    const keyword = boardSearch.value.trim().toLowerCase();

                    return samplePosts.value.filter(post => {
                        const catKey = categories.find(c => c.id === boardFilter.value)?.name;
                        const catMatch = boardFilter.value === 'all' || post.category === catKey;
                        const searchableText = [post.title, post.content, post.author]
                            .filter(Boolean)
                            .join(' ')
                            .toLowerCase();
                        const searchMatch = !keyword || searchableText.includes(keyword);
                        return catMatch && searchMatch;
                    });
                });

                const boardTotalPages = computed(() => {
                    return Math.max(1, Math.ceil(filteredBoardPosts.value.length / boardPageSize));
                });

                const paginatedBoardPosts = computed(() => {
                    const start = (boardCurrentPage.value - 1) * boardPageSize;
                    return filteredBoardPosts.value.slice(start, start + boardPageSize);
                });

                watch([boardFilter, boardSearch], () => {
                    boardCurrentPage.value = 1;
                });

                watch(boardTotalPages, (totalPages) => {
                    if (boardCurrentPage.value > totalPages) {
                        boardCurrentPage.value = totalPages;
                    }
                });

                const setInfoCategory = (categoryId) => {
                    activeInfoCategory.value = categoryId;
                    infoCurrentPage.value = 1;
                };

                const applyInfoSearch = () => {
                    infoCurrentPage.value = 1;
                };

                const goToInfoPage = (page) => {
                    infoCurrentPage.value = Math.min(Math.max(page, 1), infoTotalPages.value);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };

                const goToBoardPage = (page) => {
                    boardCurrentPage.value = Math.min(Math.max(page, 1), boardTotalPages.value);
                };

                const getLocationImage = (item) => {
                    return item.image_url || item.imageUrl || item.firstimage || item.firstImage || item.image || locationFallbackImages[item.type] || locationFallbackImages.tourist;
                };

                const handleLocationImageError = (event) => {
                    const fallback = locationFallbackImages.tourist;
                    if (event.target.src !== fallback) {
                        event.target.src = fallback;
                    }
                };

                const openInfoModal = (item) => {
                    selectedInfoItem.value = item;
                };

                const closeInfoModal = () => {
                    selectedInfoItem.value = null;
                };

                const openKakaoMap = (item) => {
                    if (!item) return;

                    const placeName = encodeURIComponent(item.name || '장소');
                    const lat = Number(item.lat);
                    const lng = Number(item.lng);
                    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
                    const url = hasCoordinates
                        ? `https://map.kakao.com/link/map/${placeName},${lat},${lng}`
                        : `https://map.kakao.com/link/search/${placeName}`;

                    const popup = window.open(url, '_blank');
                    if (popup) popup.opener = null;
                };

                // Quick Filter trigger on Home Screen
                const filterByCategory = (catId) => {
                    activeCategory.value = catId;
                    activeInfoCategory.value = catId;
                    infoCurrentPage.value = 1;
                    activeTab.value = 'info';
                };

                const getCategoryName = (typeId) => {
                    return categories.find(c => c.id === typeId)?.name || '';
                };

                const getCategoryIcon = (typeId) => {
                    return categories.find(c => c.id === typeId)?.icon || 'fa-solid fa-map-pin';
                };

                const changeTab = (tabId) => {
                    activeTab.value = tabId;
                    isWriting.value = false;
                    currentPost.value = null;
                    selectedInfoItem.value = null;
                    if (tabId === 'map') {
                        nextTick(() => {
                            initKakaoMap();
                        });
                    }
                };

                const viewRecentPost = (post) => {
                    currentPost.value = post;
                    isWriting.value = false;
                    activeTab.value = 'board';
                };

                const startWriting = () => {
                    isWriting.value = true;
                    isEditing.value = false;
                    form.value = { id: null, category: '관광지', author: '', title: '', content: '', password: '' };
                };

                const viewPost = (post) => {
                    currentPost.value = post;
                    post.views++;
                    isWriting.value = false;
                };

                const backToList = () => {
                    currentPost.value = null;
                    isWriting.value = false;
                };

                const cancelWriting = () => {
                    isWriting.value = false;
                    isEditing.value = false;
                };

                const savePost = () => {
                    const f = form.value;
                    if (!f.title.trim() || !f.content.trim() || !f.author.trim() || !f.password.trim()) {
                        alert('모든 입력란 및 비밀번호를 명확히 기재하십시오.');
                        return;
                    }

                    if (isEditing.value) {
                        const index = samplePosts.value.findIndex(p => p.id === f.id);
                        if (index !== -1) {
                            samplePosts.value[index].title = f.title;
                            samplePosts.value[index].content = f.content;
                            samplePosts.value[index].category = f.category;
                            samplePosts.value[index].author = f.author;
                            currentPost.value = samplePosts.value[index];
                        }
                        isEditing.value = false;
                        isWriting.value = false;
                    } else {
                        const newId = samplePosts.value.length > 0 ? Math.max(...samplePosts.value.map(p => p.id)) + 1 : 1;
                        const newPost = {
                            id: newId,
                            category: f.category,
                            title: f.title,
                            content: f.content,
                            author: f.author,
                            password: f.password,
                            views: 0,
                            date: new Date().toISOString().split('T')[0],
                            comments: []
                        };
                        samplePosts.value.unshift(newPost);
                        isWriting.value = false;
                    }
                };

                const addComment = () => {
                    const cf = commentForm.value;
                    if (!cf.author.trim() || !cf.content.trim() || !cf.password.trim()) {
                        alert('댓글 입력란을 확인해 주십시오.');
                        return;
                    }
                    if (!currentPost.value.comments) {
                        currentPost.value.comments = [];
                    }
                    const newId = currentPost.value.comments.length > 0 ? Math.max(...currentPost.value.comments.map(c => c.id)) + 1 : 1;
                    currentPost.value.comments.push({
                        id: newId,
                        author: cf.author,
                        content: cf.content,
                        password: cf.password,
                        date: new Date().toISOString().split('T')[0]
                    });
                    commentForm.value = { author: '', content: '', password: '' };
                };

                const triggerPasswordModal = (action, postId, commentId = null) => {
                    passwordPrompt.value = {
                        show: true,
                        action: action,
                        postId: postId,
                        commentId: commentId,
                        passwordInput: '',
                        error: ''
                    };
                };

                const closePasswordModal = () => {
                    passwordPrompt.value = { show: false, action: '', postId: null, commentId: null, passwordInput: '', error: '' };
                };

                const verifyPassword = () => {
                    const prompt = passwordPrompt.value;
                    const post = samplePosts.value.find(p => p.id === prompt.postId);
                    if (!post) {
                        closePasswordModal();
                        return;
                    }

                    if (prompt.action === 'edit_post') {
                        if (post.password === prompt.passwordInput) {
                            form.value = {
                                id: post.id,
                                category: post.category,
                                author: post.author,
                                title: post.title,
                                content: post.content,
                                password: post.password
                            };
                            isWriting.value = true;
                            isEditing.value = true;
                            closePasswordModal();
                        } else {
                            prompt.error = '비밀번호가 일치하지 않습니다.';
                        }
                    } else if (prompt.action === 'delete_post') {
                        if (post.password === prompt.passwordInput) {
                            samplePosts.value = samplePosts.value.filter(p => p.id !== prompt.postId);
                            currentPost.value = null;
                            closePasswordModal();
                        } else {
                            prompt.error = '비밀번호가 일치하지 않습니다.';
                        }
                    } else if (prompt.action === 'delete_comment') {
                        const comment = post.comments.find(c => c.id === prompt.commentId);
                        if (comment && comment.password === prompt.passwordInput) {
                            post.comments = post.comments.filter(c => c.id !== prompt.commentId);
                            closePasswordModal();
                        } else {
                            prompt.error = '비밀번호가 일치하지 않습니다.';
                        }
                    }
                };

                // Kakao Maps JavaScript API integration
                let mapInstance = null;
                let markerClusterer = null;
                let mapMarkers = [];
                let activeInfoWindow = null;
                let kakaoSdkPromise = null;

                // LocalHub의 테라코타 포인트 컬러에 맞춘 Kakao 지도 마커
                const TERRACOTTA_MARKER_SVG = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="50" viewBox="0 0 38 50">
                        <defs>
                            <filter id="shadow" x="-30%" y="-20%" width="160%" height="170%">
                                <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#5c5243" flood-opacity="0.28"/>
                            </filter>
                        </defs>
                        <path filter="url(#shadow)" fill="#91573d" d="M19 1.5C9.7 1.5 2.2 9 2.2 18.3c0 12.5 16.8 29.9 16.8 29.9s16.8-17.4 16.8-29.9C35.8 9 28.3 1.5 19 1.5z"/>
                        <circle cx="19" cy="18.5" r="7.2" fill="#fdfcf7"/>
                        <circle cx="19" cy="18.5" r="3.2" fill="#d0bfa7"/>
                    </svg>`;
                const TERRACOTTA_MARKER_SRC = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(TERRACOTTA_MARKER_SVG)}`;

                const loadKakaoMapsSdk = () => {
                    if (window.kakao?.maps) {
                        return Promise.resolve();
                    }

                    if (mapSetupRequired.value) {
                        return Promise.reject(new Error('Kakao Maps JavaScript key is not configured.'));
                    }

                    if (kakaoSdkPromise) return kakaoSdkPromise;

                    kakaoSdkPromise = new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_APP_KEY}&libraries=clusterer&autoload=false`;
                        script.async = true;
                        script.onload = () => {
                            if (!window.kakao?.maps) {
                                reject(new Error('Kakao Maps SDK failed to initialize.'));
                                return;
                            }
                            window.kakao.maps.load(resolve);
                        };
                        script.onerror = () => reject(new Error('Kakao Maps SDK could not be loaded.'));
                        document.head.appendChild(script);
                    });

                    return kakaoSdkPromise;
                };

                const initKakaoMap = async () => {
                    if (mapSetupRequired.value) return;

                    try {
                        await loadKakaoMapsSdk();

                        if (!mapInstance) {
                            const container = document.getElementById('map-container');
                            mapInstance = new kakao.maps.Map(container, {
                                center: new kakao.maps.LatLng(37.5665, 126.9780),
                                level: 8
                            });

                            markerClusterer = new kakao.maps.MarkerClusterer({
                                map: mapInstance,
                                averageCenter: true,
                                minLevel: 7,
                                disableClickZoom: false,
                                calculator: [10, 50, 100],
                                styles: [
                                    {
                                        width: '38px', height: '38px',
                                        background: 'rgba(145, 87, 61, 0.92)',
                                        border: '3px solid rgba(255,255,255,0.92)',
                                        borderRadius: '50%', color: '#fff',
                                        textAlign: 'center', fontWeight: '800',
                                        lineHeight: '32px',
                                        boxShadow: '0 5px 15px rgba(145, 87, 61, 0.28)'
                                    },
                                    {
                                        width: '44px', height: '44px',
                                        background: 'rgba(145, 87, 61, 0.94)',
                                        border: '3px solid rgba(255,255,255,0.92)',
                                        borderRadius: '50%', color: '#fff',
                                        textAlign: 'center', fontWeight: '800',
                                        lineHeight: '38px',
                                        boxShadow: '0 5px 16px rgba(145, 87, 61, 0.30)'
                                    },
                                    {
                                        width: '50px', height: '50px',
                                        background: 'rgba(122, 71, 48, 0.94)',
                                        border: '3px solid rgba(255,255,255,0.92)',
                                        borderRadius: '50%', color: '#fff',
                                        textAlign: 'center', fontWeight: '800',
                                        lineHeight: '44px',
                                        boxShadow: '0 6px 18px rgba(122, 71, 48, 0.32)'
                                    },
                                    {
                                        width: '56px', height: '56px',
                                        background: 'rgba(92, 82, 67, 0.95)',
                                        border: '3px solid rgba(255,255,255,0.92)',
                                        borderRadius: '50%', color: '#fff',
                                        textAlign: 'center', fontWeight: '800',
                                        lineHeight: '50px',
                                        boxShadow: '0 7px 20px rgba(92, 82, 67, 0.34)'
                                    }
                                ]
                            });
                        } else {
                            mapInstance.relayout();
                        }

                        renderKakaoMarkers();
                    } catch (error) {
                        console.error(error);
                        mapSetupRequired.value = true;
                    }
                };

                const clearKakaoMarkers = () => {
                    if (activeInfoWindow) {
                        activeInfoWindow.close();
                        activeInfoWindow = null;
                    }
                    if (markerClusterer) markerClusterer.clear();
                    mapMarkers.forEach(marker => marker.setMap(null));
                    mapMarkers = [];
                };

                const createInfoWindowContent = (loc) => `
                    <div class="kakao-map-info">
                        <span class="kakao-map-info__category">${getCategoryName(loc.type)}</span>
                        <h4 class="kakao-map-info__title">${loc.name}</h4>
                        <p class="kakao-map-info__description">${loc.desc}</p>
                    </div>
                `;

                const renderKakaoMarkers = () => {
                    if (!mapInstance || !window.kakao?.maps) return;

                    clearKakaoMarkers();
                    const locations = filteredMapLocations.value;
                    if (locations.length === 0) return;

                    const bounds = new kakao.maps.LatLngBounds();

                    const markerImage = new kakao.maps.MarkerImage(
                        TERRACOTTA_MARKER_SRC,
                        new kakao.maps.Size(38, 50),
                        { offset: new kakao.maps.Point(19, 50) }
                    );

                    mapMarkers = locations.map(loc => {
                        const position = new kakao.maps.LatLng(loc.lat, loc.lng);
                        const marker = new kakao.maps.Marker({
                            position,
                            title: loc.name,
                            image: markerImage
                        });

                        kakao.maps.event.addListener(marker, 'click', () => {
                            selectedLocationName.value = loc.name;
                            if (activeInfoWindow) activeInfoWindow.close();
                            activeInfoWindow = new kakao.maps.InfoWindow({
                                content: createInfoWindowContent(loc),
                                removable: true
                            });
                            activeInfoWindow.open(mapInstance, marker);
                        });

                        bounds.extend(position);
                        return marker;
                    });

                    if (markerClusterer) {
                        markerClusterer.addMarkers(mapMarkers);
                    } else {
                        mapMarkers.forEach(marker => marker.setMap(mapInstance));
                    }

                    if (locations.length === 1) {
                        mapInstance.setCenter(bounds.getSouthWest());
                        mapInstance.setLevel(5);
                    } else {
                        mapInstance.setBounds(bounds, 70, 70, 70, 70);
                    }
                };

                const selectMapCategory = (categoryId) => {
                    mapCategory.value = categoryId;
                    selectedLocationName.value = '';
                    nextTick(() => {
                        if (mapInstance) {
                            mapInstance.relayout();
                            renderKakaoMarkers();
                        } else {
                            initKakaoMap();
                        }
                    });
                };

                const panToLocation = (loc) => {
                    selectedLocationName.value = loc.name;
                    mapCategory.value = loc.type;

                    nextTick(async () => {
                        await initKakaoMap();
                        if (!mapInstance || !window.kakao?.maps) return;
                        mapInstance.setCenter(new kakao.maps.LatLng(loc.lat, loc.lng));
                        mapInstance.setLevel(4);
                    });
                };

                const showOnMap = (item) => {
                    mapCategory.value = item.type;
                    activeTab.value = 'map';
                    nextTick(async () => {
                        await initKakaoMap();
                        panToLocation(item);
                    });
                };

                // AI Chatbot simulation state (FastAPI Rest API integrated structure)
                const chatbot = ref({
                    open: false,
                    messages: [
                        { role: 'assistant', text: '반갑습니다! LocalHub AI 안내봇입니다. 선택하신 지역의 축제 일정이나 숨겨진 명소 정보를 한국관광공사 수집 데이터 바탕으로 신속하고 친절하게 대답해 드리겠습니다!' }
                    ],
                    input: '',
                    loading: false
                });

                const sendChat = async () => {
                    const text = chatbot.value.input.trim();
                    if (!text) return;

                    chatbot.value.messages.push({ role: 'user', text: text });
                    chatbot.value.input = '';
                    chatbot.value.loading = true;

                    // Automatically focus chat list bottom
                    nextTick(() => {
                        const box = document.querySelector('.overflow-y-auto.p-4.space-y-3.bg-beige-50\\/50');
                        if (box) box.scrollTop = box.scrollHeight;
                    });

                    // Quick automated mock AI replies matching schema parameters
                    let response = '';
                    const lowered = text.toLowerCase();
                    
                    setTimeout(() => {
                        if (lowered.includes('관광지') || lowered.includes('추천') || lowered.includes('어디')) {
                            response = `📍 **서울의 대표 추천 스팟 안내해 드립니다:**

1. **양화 한강공원**
   - **설명:** 가족, 연인과 함께 주말 피크닉이나 산책에 안성맞춤인 친자연적인 명소입니다.
2. **세종문화회관 및 둘레길**
   - **설명:** 우수한 전망 모노레일 및 풍부한 산림 휴식처를 품고 있어 휴일 도심 근방 피서지로 큰 인기를 끕니다.`;
                        } else if (lowered.includes('맛집') || lowered.includes('음식점') || lowered.includes('노포')) {
                            response = `🍲 **서울 지역 최고 인기 노포 맛집 정보:**

- **종로 피맛골 식당 골목**
  - **시그니처:** 오래도록 한 자리를 지켜온 얼큰하고 진한 육수의 전통 국밥과 감칠맛 넘치는 묵은지 요리가 미식가들 사이에서 대단히 화제입니다.`;
                        } else if (lowered.includes('축제') || lowered.includes('행사') || lowered.includes('일정')) {
                            response = `🎉 **서울 연간 주요 축제 가이드:**

- **반포 한강 달빛 광장 축제**
  - **특징:** 다채로운 길거리 푸드 트럭과 화려한 야경 경관이 어우러져 매년 수만 명의 방문객이 방문하는 대표 로컬 이벤트입니다.`;
                        } else {
                            response = `💡 **서울 공공데이터에 기반해 분석을 제공합니다.**

- 명소/관광지 추천 여부
- 요일별 로컬 소울푸드 및 맛집 
- 게시판 최근 글과 연계한 실시간 커뮤니티 동향 정보

문의사항을 상세하게 입력하시면 정확한 AI 가이드를 제공해 드리겠습니다.`;
                        }

                        chatbot.value.messages.push({ role: 'assistant', text: response });
                        chatbot.value.loading = false;

                        nextTick(() => {
                            const box = document.querySelector('.overflow-y-auto.p-4.space-y-3.bg-beige-50\\/50');
                            if (box) box.scrollTop = box.scrollHeight;
                        });
                    }, 800);
                };

                return {
                    currentRegion,
                    tabs,
                    activeTab,
                    categories,
                    activeCategory,
                    samplePosts,
                    directoryLocations,
                    activeInfoCategory,
                    infoSearch,
                    infoCurrentPage,
                    infoTotalPages,
                    paginatedInfoItems,
                    selectedInfoItem,
                    boardFilter,
                    boardSearch,
                    boardCurrentPage,
                    boardPageSize,
                    boardTotalPages,
                    paginatedBoardPosts,
                    currentPost,
                    isWriting,
                    isEditing,
                    form,
                    commentForm,
                    passwordPrompt,
                    selectedLocationName,
                    mapCategory,
                    mapSetupRequired,
                    filteredMapLocations,
                    filteredInfoItems,
                    filteredBoardPosts,
                    setInfoCategory,
                    applyInfoSearch,
                    goToInfoPage,
                    goToBoardPage,
                    getLocationImage,
                    handleLocationImageError,
                    openInfoModal,
                    closeInfoModal,
                    openKakaoMap,
                    filterByCategory,
                    getCategoryName,
                    getCategoryIcon,
                    changeTab,
                    viewRecentPost,
                    startWriting,
                    viewPost,
                    backToList,
                    cancelWriting,
                    savePost,
                    addComment,
                    triggerPasswordModal,
                    closePasswordModal,
                    verifyPassword,
                    selectMapCategory,
                    panToLocation,
                    showOnMap,
                    chatbot,
                    sendChat
                };
            }
        }).mount('#app');
