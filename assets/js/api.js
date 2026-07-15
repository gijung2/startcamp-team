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
  })
  const normalizePost = (item) => ({
    ...item,
    author: item.author || item.nickname || '익명',
    date: (item.date || item.created_at || '').slice(0, 10),
    comments: item.comments || [],
  })
  const normalizePosts = (data) => {
    const value = Array.isArray(data)
      ? { items: data, total: data.length }
      : { items: data?.items || data?.posts || [], total: data?.total ?? data?.count ?? 0 }
    return { ...value, items: value.items.map(normalizePost) }
  }

  window.LocalHubAPI = {
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
    async createComment(postId,payload){ if(!useMock)throw new Error('현재 백엔드에는 댓글 API가 아직 없습니다.');const posts=read(),post=posts.find(p=>String(p.id)===String(postId));const item={...payload,id:Math.max(0,...(post.comments||[]).map(c=>c.id))+1,date:new Date().toISOString().slice(0,10)};post.comments=[...(post.comments||[]),item];write(posts);return wait(item) },
    async deleteComment(postId,commentId,password){ if(!useMock)throw new Error('현재 백엔드에는 댓글 API가 아직 없습니다.');const posts=read(),post=posts.find(p=>String(p.id)===String(postId)),item=post?.comments?.find(c=>String(c.id)===String(commentId));if(item?.password!==password)throw new Error('비밀번호가 일치하지 않습니다.');post.comments=post.comments.filter(c=>String(c.id)!==String(commentId));write(posts);return wait(null) },
    async chat(message,history=[]){ if(!useMock)throw new Error('현재 백엔드에는 챗봇 API가 아직 없습니다.');await wait(null);return {message:`"${message}"에 대한 GPT 응답은 백엔드 연결 후 제공됩니다.`} },
  }
})()
