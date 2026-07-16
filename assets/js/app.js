const { createApp, ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } = Vue
const { createRouter, createWebHistory, useRoute, useRouter } = VueRouter

const api = window.LocalHubAPI
const categories = window.LocalHubData.categories
const homeCategories = [{ id:'all', name:'전체', icon:'fa-solid fa-border-all' }, ...categories]
const placeCategories = categories.filter((item) => item.id !== 'course')
const categoryName = (id) => categories.find((item) => item.id === id)?.name || id

const AppHeader = {
  setup() {
    return { links: [
      { to: '/', label: 'Home' },
      { to: '/info', label: 'Local Info' },
      { to: '/map', label: 'Map' },
      { to: '/board', label: 'Community' },
    ] }
  },
  template: `
    <header class="w-full z-40 sticky top-0 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#EFE6D5] shadow-sm">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 min-h-[76px] flex items-center justify-between gap-4">
        <RouterLink to="/" class="flex items-center gap-3.5 shrink-0">
          <span class="flex items-center gap-2.5 text-[1.7rem] font-bold tracking-tight text-beige-900"><span class="flex w-9 h-9 shrink-0 items-center justify-center overflow-hidden rounded-full" aria-hidden="true"><img src="./assets/images/seoul-logo.png" alt="" class="w-full h-full scale-[1.6] object-cover"></span> SeoulMate</span>
          <span class="hidden sm:inline-flex bg-beige-200/80 px-3 py-1 rounded-full border border-beige-300 text-xs text-beige-800 font-medium">Seoul</span>
        </RouterLink>
        <nav class="top-nav" aria-label="주요 메뉴">
          <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="top-nav-link" active-class="is-active" :exact-active-class="link.to === '/' ? 'is-active' : ''">{{ link.label }}</RouterLink>
        </nav>
      </div>
    </header>`,
}

const StatusPanel = {
  props: { type: { default: 'empty' }, title: { required: true }, message: { default: '' }, retry: { default: null } },
  template: `
    <div class="status-panel" :class="'status-panel--' + type" role="status">
      <span class="status-panel__icon"><i v-if="type === 'loading'" class="fa-solid fa-spinner fa-spin"></i><i v-else-if="type === 'error'" class="fa-solid fa-triangle-exclamation"></i><i v-else class="fa-regular fa-folder-open"></i></span>
      <h3>{{ title }}</h3><p v-if="message">{{ message }}</p>
      <button v-if="type === 'error' && retry" class="btn-secondary mt-3" @click="retry">다시 시도</button>
    </div>`,
}

const PaginationBar = {
  props: ['page', 'totalPages'], emits: ['change'],
  template: `<div class="flex items-center justify-center gap-4 pt-3"><button class="btn-secondary" :disabled="page <= 1" @click="$emit('change', page - 1)">이전</button><span class="text-xs text-beige-800/60 font-mono"><strong class="text-accent-terracotta">{{ page }}</strong> / {{ totalPages }}</span><button class="btn-secondary" :disabled="page >= totalPages" @click="$emit('change', page + 1)">다음</button></div>`,
}

const PasswordModal = {
  props: { open: Boolean, title: { default: '비밀번호 확인' }, error: String, loading: Boolean }, emits: ['confirm', 'close'],
  setup(props) { const password = ref(''); watch(() => props.open, (value) => { if (value) password.value = '' }); return { password } },
  template: `
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" @click.self="$emit('close')">
      <form class="bg-white border border-beige-300 p-8 rounded-2xl max-w-sm w-full space-y-5 text-center shadow-2xl" @submit.prevent="$emit('confirm', password)">
        <i class="fa-solid fa-lock text-accent-terracotta text-2xl"></i><div><h3 class="font-bold text-beige-900 font-serif">{{ title }}</h3><p class="text-xs text-beige-800/70 mt-2">작성할 때 설정한 비밀번호를 입력해 주세요.</p></div>
        <input v-model="password" type="password" required autofocus placeholder="비밀번호 입력" class="form-input text-center"><p v-if="error" class="text-xs text-red-600">{{ error }}</p>
        <div class="flex gap-2"><button class="btn-primary flex-1" :disabled="loading">{{ loading ? '확인 중…' : '확인' }}</button><button type="button" class="btn-secondary" @click="$emit('close')">취소</button></div>
      </form>
    </div>`,
}

const ChatWidget = {
  setup() {
    const open = ref(false), input = ref(''), loading = ref(false), error = ref(''), list = ref(null)
    const messages = ref([{ role: 'assistant', text: '안녕하세요! Seoul Mate 서울 지역정보 안내입니다. 서울 DB를 바탕으로 관광지와 이번 주 축제 정보를 안내해 드릴게요.' }])
    async function send() {
      const text = input.value.trim(); if (!text || loading.value) return
      messages.value.push({ role: 'user', text }); input.value = ''; loading.value = true; error.value = ''
      try { const response = await api.chat(text, messages.value.slice(0, -1)); messages.value.push({ role: 'assistant', text: response.message || response.answer || response.content, sources: response.sources || [] }) }
      catch (err) { error.value = err.message }
      finally { loading.value = false; await nextTick(); if (list.value) list.value.scrollTop = list.value.scrollHeight }
    }
    return { open, input, loading, error, list, messages, send }
  },
  template: `
    <button class="chat-fab" aria-label="지역정보 챗봇 열기" @click="open = !open"><i :class="open ? 'fa-solid fa-xmark' : 'fa-solid fa-comment-dots'"></i></button>
    <section v-if="open" class="chat-panel" aria-label="LocalHub 챗봇"><header><div><strong>LocalHub Guide</strong><p>gpt-5-mini · 서울 DB 안내</p></div><button @click="open = false"><i class="fa-solid fa-xmark"></i></button></header>
      <div ref="list" class="chat-messages"><div v-for="(message, index) in messages" :key="index" class="chat-message" :class="'chat-message--' + message.role"><span class="chat-message-text">{{ message.text }}</span><small v-if="message.sources?.length" class="chat-rag-source"><i class="fa-solid fa-database"></i> 서울 DB {{ message.sources.length }}건 참조</small></div><div v-if="loading" class="chat-message chat-message--assistant"><i class="fa-solid fa-ellipsis fa-beat-fade"></i><small class="chat-rag-loading">서울 DB에서 관련 정보를 찾는 중…</small></div><p v-if="error" class="text-xs text-red-600 text-center">{{ error }}</p></div>
      <form class="chat-input" @submit.prevent="send"><input v-model="input" :disabled="loading" placeholder="서울 지역정보를 물어보세요"><button :disabled="loading"><i class="fa-solid fa-paper-plane"></i></button></form>
    </section>`,
}

const HomeView = {
  components: { StatusPanel },
  setup() {
    const posts = ref([]), loading = ref(true), error = ref(''), festivalItems = ref([]), festivalLoading = ref(true), festivalError = ref('')
    const weather = ref(null), weatherLoading = ref(true), weatherError = ref('')
    const festivalReference = ref('')
    // index.html을 파일로 직접 열어도 축제 카드가 표시되도록 앱에 함께 넣어 둔 데이터입니다.
    // 웹 서버로 실행할 때는 아래 JSON 파일의 전체 데이터를 우선 사용합니다.
    const bundledFestivalItems = [
      {contentid:'2387785',title:'2026 보드게임콘',eventstartdate:'20260716',eventenddate:'20260719',addr1:'서울특별시 강남구 영동대로 513 (삼성동)',addr2:''},
      {contentid:'3509884',title:'서울썸머비치',eventstartdate:'20260720',eventenddate:'20260809',addr1:'서울특별시 종로구 세종대로 지하172 (세종로)',addr2:'광화문광장'},
      {contentid:'2718984',title:'서울일러스트레이션페어V.21',eventstartdate:'20260730',eventenddate:'20260802',addr1:'서울특별시 강남구 영동대로 513 (삼성동)',addr2:''},
      {contentid:'2497537',title:'2026 한강나이트워크42K',eventstartdate:'20260801',eventenddate:'20260802',addr1:'서울특별시 영등포구 여의공원로 68 (여의도동)',addr2:''},
      {contentid:'3351451',title:'K-일러스트레이션페어 마곡 2026',eventstartdate:'20260820',eventenddate:'20260823',addr1:'서울특별시 강서구 마곡중앙로 143 (마곡동)',addr2:''},
      {contentid:'1018469',title:'서울국제작가축제',eventstartdate:'20260911',eventenddate:'20260916',addr1:'서울특별시 종로구 인사동9길 26 (견지동)',addr2:''},
      {contentid:'2556687',title:'문학주간 2026',eventstartdate:'20260916',eventenddate:'20260920',addr1:'서울특별시 종로구 대학로 104 (동숭동)',addr2:''},
      {contentid:'3524889',title:'GES2026 (게임 e스포츠 서울)',eventstartdate:'20260918',eventenddate:'20260920',addr1:'서울특별시 중구 을지로 281 (을지로7가)',addr2:''},
      {contentid:'3544886',title:'서울어텀페스타',eventstartdate:'20260918',eventenddate:'20260918',addr1:'서울특별시 중구 세종대로 110 (태평로1가)',addr2:''},
      {contentid:'2554814',title:'정조대왕 능행차 공동재현',eventstartdate:'20261004',eventenddate:'20261004',addr1:'서울특별시 종로구 사직로 161 (세종로)',addr2:''},
      {contentid:'2612274',title:'관악강감찬축제',eventstartdate:'20261016',eventenddate:'20261018',addr1:'서울특별시 관악구 낙성대로 77 (봉천동)',addr2:''},
      {contentid:'1307813',title:'강동선사문화축제',eventstartdate:'20261016',eventenddate:'20261018',addr1:'서울특별시 강동구 올림픽로 875 (암사동)',addr2:''}
    ]
    const monthNames = Array(12).fill('')
    const dateParts = (value) => { const [startText='',endText='']=String(value||'').split('|'),period=endText?`${startText.slice(0,4)}.${startText.slice(4,6)}.${startText.slice(6,8)} ~ ${endText.slice(0,4)}.${endText.slice(4,6)}.${endText.slice(6,8)}`:startText.slice(6,8);return {year:startText.slice(0,4),month:Number(startText.slice(4,6)),day:period} }
    const formatAddress = (item) => [item.addr||item.addr1,item.addr2].filter(Boolean).join(' ')
    const weatherIconUrl = computed(() => weather.value ? `https://openweathermap.org/img/wn/${weather.value.icon}@2x.png` : '')
    async function loadWeather(){weatherLoading.value=true;weatherError.value='';try{weather.value=await api.getSeoulWeather()}catch(err){weatherError.value=err.message}finally{weatherLoading.value=false}}
    async function loadFestivalSchedule(){festivalLoading.value=true;festivalError.value='';try{const data=await api.getThisWeekFestivals();const start=dateParts(data.week_start),end=dateParts(data.week_end);festivalReference.value=`${start.month}월 ${Number(start.day)}일 ~ ${end.month}월 ${Number(end.day)}일`;festivalItems.value=(data.items||[]).filter((item)=>item.title&&item.eventstartdate<=data.week_end&&item.eventenddate>=data.week_start).sort((a,b)=>{const aStartsThisWeek=a.eventstartdate>=data.week_start?0:1,bStartsThisWeek=b.eventstartdate>=data.week_start?0:1;return aStartsThisWeek-bStartsThisWeek||a.eventstartdate.localeCompare(b.eventstartdate)||a.title.localeCompare(b.title,'ko')}).map((item)=>({...item,eventstartdate:item.eventenddate?`${item.eventstartdate}|${item.eventenddate}`:item.eventstartdate}))}catch(err){festivalItems.value=[];festivalError.value=err.message||'이번 주 축제 일정을 불러오지 못했습니다.'}finally{festivalLoading.value=false}}
    async function load() { loading.value = true; error.value = ''; try { posts.value = (await api.getPosts({ size: 5 })).items } catch (err) { error.value = err.message } finally { loading.value = false } }
    onMounted(()=>{load();loadFestivalSchedule();loadWeather()}); return { homeCategories, posts, loading, error, load, festivalItems, festivalLoading, festivalError, festivalReference, monthNames, dateParts, formatAddress, loadFestivalSchedule, weather, weatherLoading, weatherError, weatherIconUrl, loadWeather }
  },
  template: `
    <section class="space-y-12"><div class="home-intro" style="display:flex;width:100%;min-height:19rem;align-items:center;justify-content:center;flex-direction:column;padding:2rem 1rem 1.5rem;text-align:center;background:transparent;border:0;box-shadow:none"><span style="display:block;margin-bottom:1.35rem;color:#91573d;font-size:.68rem;font-weight:800;letter-spacing:.22em">PUBLIC DATA · COMMUNITY</span><h1 class="whitespace-normal sm:whitespace-nowrap" style="margin:0;color:#2d261b;font-family:'Noto Serif KR',serif;font-size:clamp(1.8rem,4.5vw,3rem);font-weight:900;line-height:1.28;letter-spacing:-.05em">서울의 모든 지역정보를 한곳에서 만나요</h1><p style="margin-top:1.55rem;color:rgba(92,82,67,.72);font-size:.82rem">한국관광공사 공공데이터 기반 · 익명 커뮤니티 · AI 지역정보 챗봇</p><div style="display:flex;justify-content:center;gap:1rem;margin-top:2rem"><RouterLink to="/info" class="btn-primary" style="min-width:12rem;min-height:3rem"><i class="fa-solid fa-compass"></i> 지역정보 둘러보기</RouterLink><RouterLink to="/board" class="btn-secondary" style="min-width:10.8rem;min-height:3rem"><i class="fa-solid fa-comments"></i> 커뮤니티 가기</RouterLink></div></div>
      <div class="home-empty-grid" style="display:grid;grid-template-columns:minmax(18rem,.72fr) minmax(0,1.28fr);gap:2rem;align-items:stretch" aria-label="홈 콘텐츠 영역"><section class="home-empty-card live-card weather-card" style="display:flex;min-height:31rem;flex-direction:column;border:1px solid rgba(224,207,185,.95);border-radius:1.2rem;background:rgba(255,255,255,.94);box-shadow:0 8px 24px rgba(92,82,67,.08);padding:1.5rem" aria-label="서울 실시간 날씨"><header class="live-card__header"><div><h2><i class="fa-solid fa-cloud-sun"></i> 실시간 서울 날씨</h2></div><span class="live-badge">OpenWeather</span></header><div v-if="weatherLoading" class="live-card__state"><i class="fa-solid fa-spinner fa-spin"></i><span>서울 날씨를 불러오는 중입니다.</span></div><div v-else-if="weatherError" class="live-card__state live-card__state--error"><i class="fa-solid fa-cloud-bolt"></i><span>{{ weatherError }}</span><button @click="loadWeather">다시 시도</button></div><div v-else-if="weather" class="weather-content"><div class="weather-now"><div><p class="weather-place"><i class="fa-solid fa-location-dot"></i> {{ weather.location }}</p><strong>{{ weather.temperature }}<sup>°C</sup></strong><p>{{ weather.description }} · 체감 {{ weather.feelsLike }}°C</p></div><img class="weather-api-icon" :src="weatherIconUrl" :alt="weather.description"></div><div class="weather-facts"><span><i class="fa-solid fa-droplet"></i><small>습도</small><b>{{ weather.humidity }}%</b></span><span><i class="fa-solid fa-wind"></i><small>풍속</small><b>{{ weather.windSpeed }}m/s</b></span><span><i class="fa-solid fa-cloud-rain"></i><small>최근 1시간 강수</small><b>{{ weather.rainAmount }}mm</b></span></div><small class="data-credit">Weather data by OpenWeather</small></div></section><section class="home-empty-card festival-schedule-card" style="display:flex;min-height:31rem;flex-direction:column;border:1px solid rgba(224,207,185,.95);border-radius:1.2rem;background:rgba(255,255,255,.94);box-shadow:0 8px 24px rgba(92,82,67,.08);padding:1.5rem" aria-label="가까운 축제 일정"><header class="festival-schedule-header" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.15rem"><h2 style="display:flex;align-items:center;gap:.55rem;margin:0;font-size:1.05rem;color:#382b25"><i class="fa-solid fa-calendar-check" style="color:#9d6043"></i> 가장 가까운 축제 일정</h2><span style="color:#887b72;font-size:.78rem;white-space:nowrap"><i class="fa-regular fa-clock"></i> {{ festivalReference }}</span></header><div v-if="festivalLoading" class="festival-schedule-state"><i class="fa-solid fa-spinner fa-spin"></i><span>축제 일정을 불러오는 중입니다.</span></div><div v-else-if="festivalError" class="festival-schedule-state"><span>{{ festivalError }}</span><button @click="loadFestivalSchedule">다시 시도</button></div><div v-else-if="festivalItems.length" class="festival-schedule-list" style="display:flex;flex-direction:column;gap:.85rem"><RouterLink v-for="item in festivalItems" :key="item.contentid" :to="{path:'/info',query:{category:'festival',search:item.title}}" class="festival-schedule-item" style="display:grid;grid-template-columns:3.8rem minmax(0,1fr) auto;align-items:center;gap:1rem;min-height:5.4rem;padding:.8rem 1rem;border:1px solid #eadfd4;border-radius:1rem;background:#fffdfb;color:inherit;text-decoration:none"><time style="display:flex;min-height:3.6rem;flex-direction:column;align-items:center;justify-content:center;border:1px solid #e5d3c6;border-radius:.75rem;background:#faf3ed;color:#9d6043"><small style="font-size:.61rem;font-weight:700">{{ monthNames[dateParts(item.eventstartdate).month-1] }}</small><strong style="font-size:1.15rem">{{ dateParts(item.eventstartdate).day }}</strong></time><div style="min-width:0"><strong style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#382b25;font-size:.93rem">{{ item.title }}</strong><p style="margin:.38rem 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8a7c72;font-size:.76rem"><i class="fa-solid fa-location-dot" style="color:#d49a61"></i> {{ formatAddress(item) }}</p></div><i class="fa-solid fa-chevron-right" style="color:#9d6043"></i></RouterLink></div><div v-else class="festival-schedule-state"><i class="fa-regular fa-calendar-xmark"></i><span>예정된 축제 일정이 없습니다.</span></div><p class="festival-source" style="margin:auto 0 0;padding-top:.85rem;color:#998a80;font-size:.7rem">출처: 한국관광공사 TourAPI 4.0 · 공공누리 제3유형</p></section></div>
      <div style="margin-top:0!important"><div class="grid grid-cols-2 sm:grid-cols-4 gap-5 lg:gap-8"><RouterLink v-for="cat in homeCategories" :key="cat.id" :to="{ path: '/info', query: { category: cat.id } }" class="category-btn px-4 py-2.5 rounded-xl text-center flex flex-col gap-1.5"><i :class="cat.icon" class="text-lg text-accent-terracotta"></i><span class="text-base font-bold">{{ cat.name }}</span></RouterLink></div></div>
      <div class="space-y-5"><div class="flex justify-between items-center"><h2 class="section-title">RECENT POST</h2><RouterLink to="/board" class="text-xs text-accent-terracotta">전체보기 →</RouterLink></div><StatusPanel v-if="loading" type="loading" title="최근 게시글을 불러오는 중입니다."/><StatusPanel v-else-if="error" type="error" title="게시글을 불러오지 못했습니다." :message="error" :retry="load"/><StatusPanel v-else-if="!posts.length" title="아직 게시글이 없습니다." message="첫 지역 소식을 공유해 보세요."/><div v-else class="space-y-3"><RouterLink v-for="post in posts" :key="post.id" :to="'/board/' + post.id" class="post-row"><span class="tag">{{ post.category }}</span><strong>{{ post.title }}</strong><span class="ml-auto text-xs text-beige-800/60">{{ post.author }}</span></RouterLink></div></div>
    </section>`,
}

const LocalInfoView = {
  components: { StatusPanel, PaginationBar },
  setup() {
    const route = useRoute(), router = useRouter(), locations = ref([]), loading = ref(true), error = ref(''), selected = ref(null)
    const category = ref(route.query.category || 'all'), search = ref(route.query.search || ''), page = ref(1), pageSize = 20
    const total = ref(0), totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
    async function load() { loading.value = true; error.value = ''; try { const data = await api.getLocations({category:category.value,search:search.value,page:page.value});locations.value=data.items;total.value=data.total } catch (err) { error.value = err.message } finally { loading.value = false } }
    function apply() { page.value = 1; router.replace({ query: { ...(category.value !== 'all' && { category: category.value }), ...(search.value && { search: search.value }) } });load() }
    function setCategory(value) { category.value = value; apply() }
    function openMap(item) { window.open(`https://map.kakao.com/link/map/${encodeURIComponent(item.name)},${item.lat},${item.lng}`, '_blank', 'noopener,noreferrer') }
    function changePage(value){page.value=value;load()}
    onMounted(load); return { categories: placeCategories, categoryName, loading, error, selected, category, search, page, total, locations, totalPages, load, apply, setCategory, changePage, openMap }
  },
  template: `
    <section class="space-y-6"><div><span class="eyebrow">SEOUL DIRECTORY</span><h1 class="page-title">PLACE</h1><p class="page-description">카테고리별 서울 관광정보를 확인하세요. <strong class="text-accent-terracotta">총 {{ total.toLocaleString() }}개</strong></p></div>
      <div class="flex flex-wrap gap-2"><button class="filter-pill" :class="{ active: category === 'all' }" @click="setCategory('all')">전체</button><button v-for="cat in categories" :key="cat.id" class="filter-pill" :class="{ active: category === cat.id }" @click="setCategory(cat.id)">{{ cat.name }}</button></div>
      <form class="search-bar" @submit.prevent="apply"><i class="fa-solid fa-magnifying-glass"></i><input v-model="search" placeholder="장소명 · 주소 검색"><button>검색</button></form>
      <StatusPanel v-if="loading" type="loading" title="지역정보를 불러오는 중입니다."/><StatusPanel v-else-if="error" type="error" title="지역정보를 불러오지 못했습니다." :message="error" :retry="load"/><StatusPanel v-else-if="!locations.length" title="검색 결과가 없습니다." message="다른 검색어나 카테고리를 선택해 보세요."/>
      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"><article v-for="item in locations" :key="item.id" class="location-card" @click="selected = item"><img :src="item.image" :alt="item.name"><div><span class="tag">{{ categoryName(item.type) }}</span><h2>{{ item.name }}</h2><p><i class="fa-solid fa-location-dot"></i> {{ item.address }}</p></div></article></div>
      <PaginationBar v-if="locations.length" :page="page" :total-pages="totalPages" @change="changePage"/>
      <div v-if="selected" class="modal-backdrop" @click.self="selected = null"><article class="modal-card"><button class="modal-close" @click="selected = null"><i class="fa-solid fa-xmark"></i></button><img :src="selected.image" :alt="selected.name" style="display:block;width:calc(100% + 3rem) !important;max-width:none !important;height:15rem !important;margin:-1.5rem -1.5rem 1.25rem !important;padding:0;background:#f5eee2;object-fit:cover !important;object-position:center"><span class="tag">{{ categoryName(selected.type) }}</span><h2 class="section-title mt-3">{{ selected.name }}</h2><p class="text-sm text-beige-800 mt-3">{{ selected.desc }}</p><dl class="info-list"><div><dt>주소</dt><dd>{{ selected.address }}</dd></div></dl><button class="btn-primary w-full mt-5" @click="openMap(selected)">카카오맵에서 보기</button></article></div>
    </section>`,
}

const MapView = {
  components: { StatusPanel },
  setup() {
    const locations = ref([]), visibleLocations = ref([]), category = ref('tourist'), loading = ref(true), error = ref(''), selected = ref(null), mapElement = ref(null)
    const filtered = computed(() => visibleLocations.value)
    const seoulCenter = { lat: 37.5547, lng: 126.9707 }
    let map = null, clusterer = null, markers = [], infoWindow = null, sdkPromise = null
    async function loadKakaoSdk() {
      if (window.kakao?.maps) return new Promise((resolve) => window.kakao.maps.load(resolve))
      if (sdkPromise) return sdkPromise
      const response = await fetch('/.netlify/functions/public-config')
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.kakaoMapKey) throw new Error(data?.detail || '카카오맵 JavaScript 키를 불러오지 못했습니다.')
      const key = data.kakaoMapKey
      sdkPromise = new Promise((resolve, reject) => { const script = document.createElement('script'); script.id = 'kakao-map-sdk'; script.async = true; script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=clusterer&autoload=false`; script.onload = () => window.kakao.maps.load(resolve); script.onerror = () => { script.remove(); sdkPromise = null; reject(new Error('카카오맵 SDK를 불러오지 못했습니다. 등록 도메인과 키를 확인해 주세요.')) }; document.head.appendChild(script) })
      return sdkPromise
    }
    function clearMarkers() { clusterer?.clear(); markers.forEach((marker) => marker.setMap(null)); markers = []; infoWindow?.close() }
    function showInfo(item, marker) {
      selected.value = item; const content = document.createElement('div'); content.className = 'kakao-map-info'
      const label = document.createElement('span'); label.className = 'kakao-map-info__category'; label.textContent = categoryName(item.type)
      const title = document.createElement('h3'); title.className = 'kakao-map-info__title'; title.textContent = item.name
      const address = document.createElement('p'); address.className = 'kakao-map-info__description'; address.textContent = item.address
      content.append(label, title, address); infoWindow?.close(); infoWindow = new window.kakao.maps.InfoWindow({ content, removable: true }); infoWindow.open(map, marker)
    }
    function renderMarkers() {
      if (!map || !window.kakao?.maps) return; clearMarkers(); selected.value = null
      locations.value.forEach((item) => { const position = new window.kakao.maps.LatLng(item.lat, item.lng); const marker = new window.kakao.maps.Marker({ position, title: item.name }); window.kakao.maps.event.addListener(marker, 'click', () => showInfo(item, marker)); markers.push(marker) })
      if(clusterer)clusterer.addMarkers(markers);else markers.forEach((marker)=>marker.setMap(map))
      map.setCenter(new window.kakao.maps.LatLng(seoulCenter.lat, seoulCenter.lng)); map.setLevel(6)
      updateVisibleLocations()
    }
    function updateVisibleLocations() {
      if (!map) { visibleLocations.value = []; return }
      const bounds = map.getBounds(), sw = bounds.getSouthWest(), ne = bounds.getNorthEast()
      const minLat = sw.getLat(), maxLat = ne.getLat(), minLng = sw.getLng(), maxLng = ne.getLng()
      visibleLocations.value = locations.value.filter((item) => {
        const lat = Number(item.lat), lng = Number(item.lng)
        return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng
      })
    }
    function resetMapView() { if (!map || !window.kakao?.maps) return; infoWindow?.close(); selected.value = null; map.setCenter(new window.kakao.maps.LatLng(seoulCenter.lat, seoulCenter.lng)); map.setLevel(6); updateVisibleLocations() }
    function selectCategory(value) { resetMapView(); if (category.value !== value) category.value = value }
    function selectLocation(item) { const marker = markers[locations.value.findIndex((location) => location.id === item.id)]; if (!map || !marker) return; map.panTo(marker.getPosition()); map.setLevel(4); showInfo(item, marker) }
    function openExternalMap(item) { window.open(`https://map.kakao.com/link/map/${encodeURIComponent(item.name)},${item.lat},${item.lng}`, '_blank', 'noopener,noreferrer') }
    async function initialize() { loading.value = true; error.value = ''; try { const [items] = await Promise.all([api.getMapLocations(category.value), loadKakaoSdk()]); locations.value = items.filter((item)=>Number.isFinite(Number(item.lat))&&Number.isFinite(Number(item.lng))&&Number(item.lat)>=37.40&&Number(item.lat)<=37.75&&Number(item.lng)>=126.75&&Number(item.lng)<=127.25).sort((a,b)=>((Number(a.lat)-seoulCenter.lat)**2+(Number(a.lng)-seoulCenter.lng)**2)-((Number(b.lat)-seoulCenter.lat)**2+(Number(b.lng)-seoulCenter.lng)**2)); visibleLocations.value = []; await nextTick(); if(!map){map = new window.kakao.maps.Map(mapElement.value, { center: new window.kakao.maps.LatLng(seoulCenter.lat, seoulCenter.lng), level: 6 }); map.addControl(new window.kakao.maps.MapTypeControl(), window.kakao.maps.ControlPosition.TOPRIGHT); map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT); window.kakao.maps.event.addListener(map, 'idle', updateVisibleLocations); window.kakao.maps.event.addListener(map, 'dragend', updateVisibleLocations); window.kakao.maps.event.addListener(map, 'zoom_changed', () => window.setTimeout(updateVisibleLocations, 0)); clusterer = new window.kakao.maps.MarkerClusterer({map,averageCenter:true,minLevel:5,minClusterSize:1,gridSize:72,disableClickZoom:false,styles:[{width:'44px',height:'44px',background:'rgba(145,87,61,.92)',border:'3px solid rgba(255,255,255,.9)',borderRadius:'50%',color:'#fff',textAlign:'center',fontSize:'13px',fontWeight:'800',lineHeight:'38px',boxShadow:'0 5px 14px rgba(45,38,27,.25)'}]})} } catch (err) { error.value = err.message } finally { loading.value = false; await nextTick(); if (map) { map.relayout(); renderMarkers(); window.setTimeout(updateVisibleLocations, 0) } } }
    watch(category, initialize); onMounted(initialize); onUnmounted(clearMarkers)
    return { categories: placeCategories, categoryName, category, loading, error, selected, mapElement, filtered, initialize, selectCategory, selectLocation, openExternalMap }
  },
  template: `
    <section class="space-y-6"><div><span class="eyebrow">LOCATION MAP</span><h1 class="page-title">MAP</h1><p class="page-description">카테고리별 서울 장소를 지도에서 확인하세요.</p></div><div class="flex flex-wrap gap-2"><button v-for="cat in categories" :key="cat.id" class="filter-pill" :class="{ active: category === cat.id }" @click="selectCategory(cat.id)">{{ cat.name }}</button></div>
      <StatusPanel v-if="loading" type="loading" title="카카오맵을 불러오는 중입니다."/><StatusPanel v-else-if="error" type="error" title="카카오맵을 표시할 수 없습니다." :message="error" :retry="initialize"/>
      <div v-show="!loading && !error" class="map-layout"><div ref="mapElement" class="kakao-map-canvas" aria-label="서울 지역정보 지도"></div><aside class="map-list"><button v-for="item in filtered" :key="item.id" :class="{ active: selected?.id === item.id }" @click="selectLocation(item)"><span class="tag">{{ categoryName(item.type) }}</span><strong>{{ item.name }}</strong><small>{{ item.address }}</small><span class="map-list__external" @click.stop="openExternalMap(item)">카카오맵으로 열기 <i class="fa-solid fa-arrow-up-right-from-square"></i></span></button></aside></div>
    </section>`,
}

const BoardListView = {
  components: { StatusPanel, PaginationBar },
  setup() {
    const route = useRoute(), router = useRouter(), posts = ref([]), total = ref(0), loading = ref(true), error = ref('')
    const search = ref(route.query.search || ''), category = ref(route.query.category || 'all'), page = ref(Number(route.query.page) || 1), pageSize = 10
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
    async function load() { loading.value = true; error.value = ''; try { const data = await api.getPosts({ search: search.value, category: category.value, page: page.value, size: pageSize }); posts.value = data.items; total.value = data.total } catch (err) { error.value = err.message } finally { loading.value = false } }
    function syncRoute() { router.replace({ query: { ...(search.value && { search: search.value }), ...(category.value !== 'all' && { category: category.value }), ...(page.value > 1 && { page: page.value }) } }) }
    function apply() { page.value = 1; syncRoute(); load() }
    function setCategory(value) { category.value = value; apply() }
    function changePage(value) { page.value = value; syncRoute(); load() }
    onMounted(load); return { categories, posts, loading, error, search, category, page, totalPages, load, apply, setCategory, changePage }
  },
  template: `
    <section class="space-y-6"><div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><span class="eyebrow">ANONYMOUS COMMUNITY</span><h1 class="page-title">COMMUNITY</h1><p class="page-description">서울의 지역정보와 경험을 자유롭게 공유하세요.</p></div><RouterLink to="/board/new" class="btn-primary shrink-0"><i class="fa-solid fa-pen"></i> 글쓰기</RouterLink></div>
      <div class="board-category-scroll" aria-label="게시판 카테고리"><button class="board-category-pill" :class="{ active: category === 'all' }" @click="setCategory('all')">전체</button><button v-for="cat in categories" :key="cat.id" class="board-category-pill" :class="{ active: category === cat.name }" @click="setCategory(cat.name)">{{ cat.name }}</button></div>
      <form class="search-bar" @submit.prevent="apply"><i class="fa-solid fa-magnifying-glass"></i><input v-model="search" placeholder="제목 검색"><button>검색</button></form>
      <StatusPanel v-if="loading" type="loading" title="게시글을 불러오는 중입니다."/><StatusPanel v-else-if="error" type="error" title="게시글을 불러오지 못했습니다." :message="error" :retry="load"/><StatusPanel v-else-if="!posts.length" title="조건에 맞는 게시글이 없습니다." message="검색 조건을 바꾸거나 첫 글을 작성해 보세요."/>
      <div v-else class="board-table"><div class="board-table__head"><span>분류</span><span>제목</span><span>작성자</span></div><RouterLink v-for="post in posts" :key="post.id" :to="'/board/' + post.id" class="board-table__row"><span><span class="tag">{{ post.category }}</span></span><strong>{{ post.title }}</strong><span>{{ post.author }}</span></RouterLink></div><PaginationBar v-if="posts.length" :page="page" :total-pages="totalPages" @change="changePage"/>
    </section>`,
}

const BoardFormView = {
  components: { StatusPanel }, props: ['id'],
  setup(props) {
    const router = useRouter(), editing = Boolean(props.id), loading = ref(editing), saving = ref(false), error = ref(''), fieldError = ref(''), originalCategory = ref('')
    const form = reactive({ category: categories[0].name, author: '', title: '', content: '', password: '' })
    async function load() { try { const password = form.password; Object.assign(form, await api.getPost(props.id)); originalCategory.value = form.category; form.password = password } catch (err) { error.value = err.message } finally { loading.value = false } }
    async function submit() { fieldError.value = ''; error.value = ''; if (editing) form.category = originalCategory.value; if (![form.author, form.title, form.content, form.password].every((value) => value.trim())) { fieldError.value = '모든 항목을 입력해 주세요.'; return } saving.value = true; try { const post = editing ? await api.updatePost(props.id, form) : await api.createPost(form); router.push('/board/' + post.id) } catch (err) { error.value = err.message } finally { saving.value = false } }
    onMounted(() => { if (editing) { form.password = sessionStorage.getItem(`localhub_edit_password_${props.id}`) || ''; sessionStorage.removeItem(`localhub_edit_password_${props.id}`); load() } })
    return { router, editing, loading, saving, error, fieldError, form, categories, submit }
  },
  template: `<StatusPanel v-if="loading" type="loading" title="게시글을 불러오는 중입니다."/><StatusPanel v-else-if="error && !form.title" type="error" title="게시글을 불러오지 못했습니다." :message="error"/><section v-else class="premium-card p-6 md:p-8 rounded-2xl space-y-6"><div><span class="eyebrow">COMMUNITY</span><h1 class="page-title">{{ editing ? '게시글 수정' : '게시글 작성' }}</h1></div><form class="space-y-5" @submit.prevent="submit"><div class="grid sm:grid-cols-2 gap-4"><label class="form-field"><span>카테고리</span><select v-model="form.category" :disabled="editing" class="form-input disabled:cursor-not-allowed disabled:bg-beige-100 disabled:opacity-70" :title="editing ? '게시글 수정 시 카테고리는 변경할 수 없습니다.' : ''"><option v-for="cat in categories" :key="cat.id">{{ cat.name }}</option></select><small v-if="editing">게시글 수정 시 카테고리는 변경할 수 없습니다.</small></label><label class="form-field"><span>익명 작성자</span><input v-model="form.author" class="form-input" maxlength="30" placeholder="닉네임"></label></div><label class="form-field"><span>제목</span><input v-model="form.title" class="form-input" maxlength="100" placeholder="제목을 입력해 주세요"></label><label class="form-field"><span>내용</span><textarea v-model="form.content" class="form-input min-h-52 resize-y" maxlength="5000" placeholder="지역정보와 경험을 적어 주세요."></textarea></label><label class="form-field max-w-sm"><span>수정용 비밀번호</span><input v-model="form.password" type="password" class="form-input" maxlength="12" placeholder="비밀번호"><small>수정과 삭제에 사용됩니다.</small></label><p v-if="fieldError || error" class="form-error">{{ fieldError || error }}</p><div class="flex gap-3"><button class="btn-primary" :disabled="saving">{{ saving ? '저장 중…' : (editing ? '수정 완료' : '등록') }}</button><button type="button" class="btn-secondary" @click="router.back()">취소</button></div></form></section>`,
}

const BoardDetailView = {
  components: { StatusPanel, PasswordModal }, props: ['id'],
  setup(props) {
    const router = useRouter(), post = ref(null), loading = ref(true), error = ref(''), actionLoading = ref(false), commentError = ref('')
    const comment = reactive({ author: '', content: '', password: '' }), prompt = reactive({ open: false, action: '', commentId: null, error: '' })
    async function load() { loading.value = true; error.value = ''; try { post.value = await api.getPost(props.id) } catch (err) { error.value = err.message } finally { loading.value = false } }
    async function addComment() { commentError.value = ''; if (![comment.author, comment.content, comment.password].every((value) => value.trim())) { commentError.value = '댓글의 모든 항목을 입력해 주세요.'; return } actionLoading.value = true; try { const created = await api.createComment(props.id, comment); post.value.comments = [...(post.value.comments || []), created]; Object.assign(comment, { author: '', content: '', password: '' }) } catch (err) { commentError.value = err.message } finally { actionLoading.value = false } }
    function ask(action, commentId = null) { Object.assign(prompt, { open: true, action, commentId, error: '' }) }
    function closePrompt() { prompt.open = false; prompt.error = '' }
    async function confirm(password) { if (!password) { prompt.error = '비밀번호를 입력해 주세요.'; return } if (prompt.action === 'edit') { sessionStorage.setItem(`localhub_edit_password_${props.id}`, password); closePrompt(); router.push(`/board/${props.id}/edit`); return } actionLoading.value = true; prompt.error = ''; try { if (prompt.action === 'delete') { await api.deletePost(props.id, password); router.push('/board'); return } await api.deleteComment(props.id, prompt.commentId, password); post.value.comments = post.value.comments.filter((item) => String(item.id) !== String(prompt.commentId)); closePrompt() } catch (err) { prompt.error = err.message } finally { actionLoading.value = false } }
    onMounted(load); return { router, post, loading, error, actionLoading, commentError, comment, prompt, load, addComment, ask, closePrompt, confirm }
  },
  template: `<StatusPanel v-if="loading" type="loading" title="게시글을 불러오는 중입니다."/><StatusPanel v-else-if="error" type="error" title="게시글을 불러오지 못했습니다." :message="error" :retry="load"/><section v-else class="space-y-6"><RouterLink to="/board" class="btn-secondary"><i class="fa-solid fa-chevron-left"></i> 글 목록</RouterLink><article class="premium-card p-6 md:p-8 rounded-2xl space-y-6"><span class="tag">{{ post.category }}</span><div class="border-b border-beige-300/60 pb-5 flex flex-col sm:flex-row sm:justify-between gap-4"><div><h1 class="text-2xl font-black font-serif">{{ post.title }}</h1><p class="text-xs text-beige-800/70 mt-2">{{ post.author }} · {{ post.date }}</p></div><div class="flex gap-2"><button class="btn-secondary" @click="ask('edit')">수정</button><button class="btn-danger" @click="ask('delete')">삭제</button></div></div><p class="whitespace-pre-line leading-8 text-sm min-h-40">{{ post.content }}</p></article><div class="space-y-4"><h2 class="section-title text-lg"><i class="fa-regular fa-comment text-accent-terracotta"></i> 댓글 {{ post.comments?.length || 0 }}</h2><form class="comment-form" @submit.prevent="addComment"><div class="grid sm:grid-cols-2 gap-3"><input v-model="comment.author" class="form-input" placeholder="작성자"><input v-model="comment.password" type="password" class="form-input" placeholder="비밀번호"></div><div class="flex gap-2"><input v-model="comment.content" class="form-input" placeholder="건전한 댓글을 입력해 주세요."><button class="btn-primary shrink-0" :disabled="actionLoading">등록</button></div><p v-if="commentError" class="form-error">{{ commentError }}</p></form><StatusPanel v-if="!post.comments?.length" title="아직 댓글이 없습니다." message="첫 댓글을 남겨 보세요."/><div v-else class="space-y-3"><article v-for="item in post.comments" :key="item.id" class="comment-row"><div><strong>{{ item.author }}</strong><small>{{ item.date }}</small><p>{{ item.content }}</p></div><button aria-label="댓글 삭제" @click="ask('deleteComment', item.id)"><i class="fa-solid fa-trash-can"></i></button></article></div></div><PasswordModal :open="prompt.open" :error="prompt.error" :loading="actionLoading" :title="prompt.action === 'deleteComment' ? '댓글 삭제' : prompt.action === 'delete' ? '게시글 삭제' : '게시글 수정'" @confirm="confirm" @close="closePrompt"/></section>`,
}

const NotFoundView = { components: { StatusPanel }, template: `<StatusPanel title="페이지를 찾을 수 없습니다." message="주소를 확인하거나 홈으로 이동해 주세요."/><div class="text-center mt-4"><RouterLink to="/" class="btn-primary">홈으로</RouterLink></div>` }

const routes = [
  { path: '/', component: HomeView }, { path: '/info', component: LocalInfoView }, { path: '/map', component: MapView },
  { path: '/board', component: BoardListView }, { path: '/board/new', component: BoardFormView },
  { path: '/board/:id/edit', component: BoardFormView, props: true }, { path: '/board/:id', component: BoardDetailView, props: true },
  { path: '/:pathMatch(.*)*', component: NotFoundView },
]
const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })
const App = { components: { AppHeader, ChatWidget }, template: `<div class="relative min-h-screen flex flex-col"><AppHeader/><main class="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 md:py-10"><RouterView/></main><footer class="border-t border-beige-300/60 py-6 text-center text-xs text-beige-800/60">LocalHub · 공공데이터 기반 지역정보 커뮤니티</footer><ChatWidget/></div>` }

createApp(App).use(router).mount('#app')
