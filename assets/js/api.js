(function () {
  const config = window.LOCALHUB_CONFIG || {}
  const baseUrl = (config.API_BASE_URL || '').replace(/\/$/, '')
  const useMock = config.USE_MOCK_API !== false || !baseUrl
  const key = 'localhub_posts_v2'
  const initial = [
    {id:1,category:'쇼핑',title:'동대문 야시장 쇼핑 팁',author:'쇼핑고수',content:'동대문 패션타운 야시장은 금, 토 야간에 도매 물건이 활성화되어 볼거리가 가득합니다.',password:'1234',date:'2026-07-10',comments:[]},
    {id:2,category:'숙박',title:'강남 근처 가성비 숙소 후기',author:'출장맨',content:'역삼역 도보 5분 거리에 깔끔하고 가성비 좋은 숙소가 있어 공유합니다.',password:'1234',date:'2026-07-12',comments:[]},
    {id:3,category:'축제공연행사',title:'이번 달 서울 축제 일정 공유',author:'축제요정',content:'반포 한강공원에서 야시장과 분수 쇼가 열립니다.',password:'1234',date:'2026-07-13',comments:[]},
  ]
  const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(JSON.parse(JSON.stringify(value))), 180))
  const categories = window.LocalHubData?.categories || []
  const categoryName = (code) => categories.find((item) => item.id === code)?.name || code
  const categoryCode = (name) => categories.find((item) => item.name === name)?.id || name
  const fallbackImage = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="#f5eee2"/><circle cx="400" cy="205" r="54" fill="#eaddcb"/><text x="400" y="207" text-anchor="middle" dominant-baseline="middle" font-size="52">📷</text><text x="400" y="310" text-anchor="middle" fill="#91573d" font-family="Pretendard, Arial, sans-serif" font-size="34" font-weight="700">사진 준비중</text></svg>')
  const read = () => { const value=localStorage.getItem(key); if(value) return JSON.parse(value); localStorage.setItem(key,JSON.stringify(initial)); return JSON.parse(JSON.stringify(initial)) }
  const write = (posts) => localStorage.setItem(key,JSON.stringify(posts))
  async function request(path, options={}) {
    const response=await fetch(baseUrl+path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options})
    const data=response.status===204?null:await response.json().catch(()=>null)
    if(!response.ok) throw new Error(data?.detail||data?.message||'요청 처리에 실패했습니다.')
    return data
  }
  const normalizePlace = (item) => ({
    id: item.contentid,
    name: item.title,
    type: categoryCode(item.category),
    address: [item.addr1, item.addr2].filter(Boolean).join(' ') || item.addr || '주소 정보 없음',
    lat: item.mapy,
    lng: item.mapx,
    image: item.firstimage || item.firstimage2 || fallbackImage,
    desc: item.tel || '한국관광공사 TourAPI 제공 장소 정보',
    startDate: item.eventstartdate || item.event_start_date || item.start_date || '',
    endDate: item.eventenddate || item.event_end_date || item.end_date || '',
  })
  const normalizeComment = (item) => ({
    ...item,
    author: item.author || item.nickname || '익명',
    date: (item.date || item.created_at || '').slice(0, 10),
  })
  const normalizePost = (item) => ({
    ...item,
    author: item.author || item.nickname || '익명',
    date: (item.date || item.created_at || '').slice(0, 10),
    comments: (item.comments || []).map(normalizeComment),
  })
  const normalizePosts = (data) => {
    const value = Array.isArray(data)
      ? { items: data, total: data.length }
      : { items: data?.items || data?.posts || [], total: data?.total ?? data?.count ?? 0 }
    return { ...value, items: value.items.map(normalizePost) }
  }

  const ragCategories = {
    tourist: { label:'관광지', aliases:['관광','관광지','명소','공원','고궁','데이트','나들이'] },
    sports: { label:'레포츠', aliases:['레포츠','스포츠','운동','체험'] },
    culture: { label:'문화시설', aliases:['문화','문화시설','미술관','박물관','공연장','전시'] },
    shopping: { label:'쇼핑', aliases:['쇼핑','시장','백화점','상점','몰'] },
    stay: { label:'숙박', aliases:['숙박','숙소','호텔','게스트하우스','펜션'] },
    festival: { label:'축제공연행사', aliases:['축제','공연','행사','페스티벌'] },
  }
  const seoulDistricts = ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구']
  const ragStopWords = new Set(['서울','서울시','서울특별시','지역','정보','장소','곳','어디','뭐','무엇','추천','추천해줘','알려줘','알려주세요','찾아줘','찾아주세요','있어','있나요','있을까','가볼만한','좋은','관련','근처','주변','이번','이번주','이번달','오늘','내일'])
  const normalizeRagText = (value) => String(value||'').toLowerCase().replace(/[^0-9a-z가-힣\s]/g,' ').replace(/\s+/g,' ').trim()
  const detectRagCategory = (message) => {
    const text=normalizeRagText(message)
    return Object.entries(ragCategories).find(([,value])=>value.aliases.some((alias)=>text.includes(alias)))?.[0] || ''
  }
  const extractRagTerms = (message, category) => {
    const text=normalizeRagText(message), terms=[]
    seoulDistricts.forEach((district)=>{if(text.includes(district)||text.includes(district.replace(/구$/,'')))terms.push(district)})
    text.split(' ').forEach((token)=>{
      const word=token.replace(/(에서|으로|까지|부터|에게|하고|이랑|랑|과|와|의|쪽)$/g,'').replace(/(추천해줘|알려줘|찾아줘|보여줘)$/g,'')
      if(word.length<2||ragStopWords.has(word))return
      if(category&&ragCategories[category].aliases.some((alias)=>word.includes(alias)))return
      if(seoulDistricts.some((district)=>word.includes(district.replace(/구$/,''))))return
      terms.push(word)
    })
    return [...new Set(terms)].slice(0,4)
  }
  const toRagRecord = (item, extra={}) => ({
    id:String(item.contentid??item.id??`${item.title||item.name}-${item.addr1||item.address||''}`),
    name:item.title||item.name||'',
    category:item.categoryName||item.category||item.type||'',
    address:[item.addr1||item.addr||item.address,item.addr2].filter(Boolean).join(' '),
    description:item.overview||item.desc||item.tel||'',
    startDate:item.eventstartdate||item.event_start_date||item.startDate||'',
    endDate:item.eventenddate||item.event_end_date||item.endDate||'',
    lat:item.mapy??item.lat??'',
    lng:item.mapx??item.lng??'',
    ...extra,
  })
  const ragDate = (value) => {
    const text=String(value||'')
    return /^\d{8}$/.test(text)?`${text.slice(0,4)}.${text.slice(4,6)}.${text.slice(6,8)}`:text
  }
  const retrieveRagContext = async (message) => {
    const category=detectRagCategory(message), terms=extractRagTerms(message,category), records=[]
    const add=(items,extra={})=>(items||[]).forEach((item)=>records.push(toRagRecord(item,{_order:records.length,...extra})))
    add(window.LocalHubData?.locations||[],{source:'프론트 서울 데이터'})
    if(!useMock){
      const queryTerms=terms.length?terms.slice(0,3):['']
      const placeRequests=queryTerms.map((term)=>{
        const q=new URLSearchParams({page:'1'})
        if(category)q.set('category',ragCategories[category].label)
        if(term)q.set('keyword',term)
        return request('/api/places?'+q)
      })
      const results=await Promise.allSettled(placeRequests)
      results.forEach((result)=>{if(result.status==='fulfilled')add(result.value?.items,{source:'LocalHub 서울 DB'})})
      if(category==='festival'||/이번\s*주|축제|공연|행사/.test(message)){
        try{const weekly=await request('/api/places/festivals/this-week');add(weekly?.items,{source:'LocalHub 이번 주 축제 DB',weekly:true})}catch(_){/* 일반 장소 검색 결과를 사용합니다. */}
      }
    }
    const label=category?ragCategories[category].label:''
    const unique=[...new Map(records.filter((item)=>item.name).map((item)=>[`${item.id}-${item.name}`,item])).values()]
    const ranked=unique.map((item)=>{
      const haystack=normalizeRagText(`${item.name} ${item.category} ${item.address} ${item.description}`)
      let score=item.weekly?30:0
      if(label&&haystack.includes(normalizeRagText(label)))score+=8
      terms.forEach((term)=>{const value=normalizeRagText(term);if(haystack.includes(value))score+=item.name&&normalizeRagText(item.name).includes(value)?12:6})
      return {...item,_score:score}
    }).sort((a,b)=>b._score-a._score||a._order-b._order).slice(0,8)
    return {items:ranked,category,terms}
  }
  const formatRagContext = (items) => items.length
    ? items.map((item,index)=>[
        `[${index+1}] 장소명: ${item.name}`,
        `카테고리: ${item.category||'미분류'}`,
        `주소: ${item.address||'주소 정보 없음'}`,
        item.startDate?`일정: ${ragDate(item.startDate)}${item.endDate?` ~ ${ragDate(item.endDate)}`:''}`:'',
        item.description?`설명: ${item.description}`:'',
      ].filter(Boolean).join('\n')).join('\n\n')
    : '검색된 LocalHub 서울 데이터가 없습니다.'

  window.LocalHubAPI = {
    async getThisWeekFestivals(){
      if(useMock)return {week_start:'',week_end:'',total:0,items:[]}
      const data=await request('/api/places/festivals/this-week')
      return {
        week_start:data.week_start||'',
        week_end:data.week_end||'',
        total:data.total||0,
        items:(data.items||[]).map((item)=>({
          ...item,
          addr1:item.addr||item.addr1||'',
          addr2:item.addr2||'',
        })),
      }
    },
    async getSeoulWeather(){
      const response=await fetch('/.netlify/functions/weather')
      const data=await response.json().catch(()=>null)
      if(!response.ok)throw new Error(data?.detail||'서울 날씨를 불러오지 못했습니다.')
      return data
    },
    async getLocations({category='all',search='',page=1}={}){
      if(!useMock){
        const q=new URLSearchParams({page})
        if(category!=='all')q.set('category',categoryName(category))
        if(search)q.set('keyword',search)
        const data=await request('/api/places?'+q)
        return {items:(data.items||[]).map(normalizePlace),total:data.total||0,page:data.page||page,size:data.page_size||20}
      }
      const word=search.trim().toLowerCase()
      const all=window.LocalHubData.locations.filter((item)=>(category==='all'||item.type===category)&&(!word||`${item.name} ${item.address} ${item.desc}`.toLowerCase().includes(word)))
      const size=20,start=(page-1)*size
      return wait({items:all.slice(start,start+size),total:all.length,page,size})
    },
    async getMapLocations(category){
      if(!useMock){
        const q=new URLSearchParams({category:categoryName(category)})
        const data=await request('/api/places/map?'+q)
        return data.map((item)=>normalizePlace({...item,category:categoryName(category),addr1:item.addr}))
      }
      return wait(window.LocalHubData.locations.filter((item)=>item.type===category))
    },
    async getPosts({search='',category='all',page=1,size=10}={}){
      if(!useMock){
        if(!search&&category==='all'&&page===1&&size===5)return normalizePosts(await request('/api/community/recent'))
        const q=new URLSearchParams({title:search,category:category==='all'?'전체':category,page})
        return normalizePosts(await request('/api/community?'+q))
      }
      const word=search.trim().toLowerCase(); const all=read().filter(p=>(category==='all'||p.category===category)&&(!word||`${p.title} ${p.content}`.toLowerCase().includes(word))); const start=(page-1)*size; return wait({items:all.slice(start,start+size),total:all.length})
    },
    async getPost(id){ if(!useMock)return normalizePost(await request('/api/community/'+id)); const post=read().find(p=>String(p.id)===String(id));if(!post)throw new Error('게시글을 찾을 수 없습니다.');return wait(post) },
    async createPost(payload){ if(!useMock)return normalizePost(await request('/api/community',{method:'POST',body:JSON.stringify({...payload,nickname:payload.author})}));const posts=read();const post={...payload,id:Math.max(0,...posts.map(p=>p.id))+1,date:new Date().toISOString().slice(0,10),comments:[]};posts.unshift(post);write(posts);return wait(post) },
    async updatePost(id,payload){ if(!useMock)return normalizePost(await request('/api/community/'+id,{method:'PUT',body:JSON.stringify({title:payload.title,content:payload.content,password:payload.password})}));const posts=read(),i=posts.findIndex(p=>String(p.id)===String(id));if(i<0)throw new Error('게시글을 찾을 수 없습니다.');if(posts[i].password!==payload.password)throw new Error('비밀번호가 일치하지 않습니다.');posts[i]={...posts[i],...payload,id:posts[i].id};write(posts);return wait(posts[i]) },
    async deletePost(id,password){ if(!useMock)return request('/api/community/'+id,{method:'DELETE',body:JSON.stringify({password})});const posts=read(),post=posts.find(p=>String(p.id)===String(id));if(post?.password!==password)throw new Error('비밀번호가 일치하지 않습니다.');write(posts.filter(p=>String(p.id)!==String(id)));return wait(null) },
    async getComments(postId){
      if(!useMock){
        const data=await request(`/api/community/${postId}/comments`)
        return {total:data.total||0,items:(data.items||[]).map(normalizeComment)}
      }
      const post=read().find(p=>String(p.id)===String(postId))
      if(!post)throw new Error('게시글을 찾을 수 없습니다.')
      return wait({total:(post.comments||[]).length,items:(post.comments||[]).map(normalizeComment)})
    },
    async createComment(postId,payload){
      if(!useMock){
        const item=await request(`/api/community/${postId}/comments`,{
          method:'POST',
          body:JSON.stringify({nickname:payload.author,content:payload.content,password:payload.password}),
        })
        return normalizeComment(item)
      }
      const posts=read(),post=posts.find(p=>String(p.id)===String(postId))
      if(!post)throw new Error('게시글을 찾을 수 없습니다.')
      const item={...payload,id:Math.max(0,...(post.comments||[]).map(c=>c.id))+1,date:new Date().toISOString().slice(0,10)}
      post.comments=[...(post.comments||[]),item];write(posts);return wait(normalizeComment(item))
    },
    async updateComment(commentId,payload){
      if(!useMock){
        return normalizeComment(await request(`/api/community/comments/${commentId}`,{
          method:'PUT',
          body:JSON.stringify({content:payload.content,password:payload.password}),
        }))
      }
      const posts=read();let found=null
      for(const post of posts){
        const item=(post.comments||[]).find(c=>String(c.id)===String(commentId))
        if(item){if(item.password!==payload.password)throw new Error('비밀번호가 일치하지 않습니다.');item.content=payload.content;found=item;break}
      }
      if(!found)throw new Error('댓글을 찾을 수 없습니다.')
      write(posts);return wait(normalizeComment(found))
    },
    async deleteComment(postId,commentId,password){
      if(!useMock)return request(`/api/community/comments/${commentId}`,{method:'DELETE',body:JSON.stringify({password})})
      const posts=read(),post=posts.find(p=>String(p.id)===String(postId)),item=post?.comments?.find(c=>String(c.id)===String(commentId))
      if(!item)throw new Error('댓글을 찾을 수 없습니다.')
      if(item.password!==password)throw new Error('비밀번호가 일치하지 않습니다.')
      post.comments=post.comments.filter(c=>String(c.id)!==String(commentId));write(posts);return wait(null)
    },
    async chat(message,history=[]){
      const retrieval=await retrieveRagContext(message)
      const input=(history||[]).filter((item)=>item?.text&&['user','assistant'].includes(item.role)).slice(-8).map((item)=>({role:item.role,content:item.text}))
      input.push({role:'user',content:`<localhub_context>\n${formatRagContext(retrieval.items)}\n</localhub_context>\n\n사용자 질문: ${message}`})
      const response=await fetch('/.netlify/functions/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input})})
      const data=await response.json().catch(()=>null)
      if(!response.ok)throw new Error(data?.detail||'GPT 응답을 불러오지 못했습니다.')
      return {message:data.message,sources:retrieval.items.map((item)=>({id:item.id,name:item.name,address:item.address,source:item.source}))}
    },
  }
})()
