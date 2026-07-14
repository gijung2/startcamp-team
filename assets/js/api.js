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
  const read = () => { const value=localStorage.getItem(key); if(value) return JSON.parse(value); localStorage.setItem(key,JSON.stringify(initial)); return JSON.parse(JSON.stringify(initial)) }
  const write = (posts) => localStorage.setItem(key,JSON.stringify(posts))
  async function request(path, options={}) {
    const response=await fetch(baseUrl+path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options})
    const data=response.status===204?null:await response.json().catch(()=>null)
    if(!response.ok) throw new Error(data?.detail||data?.message||'요청 처리에 실패했습니다.')
    return data
  }
  const normalize=(data)=>Array.isArray(data)?{items:data,total:data.length}:{items:data?.items||data?.posts||[],total:data?.total??data?.count??0}

  window.LocalHubAPI = {
    async getLocations(){ if(!useMock){const data=await request('/api/locations');return data.items||data.locations||data} return wait(window.LocalHubData.locations) },
    async getPosts({search='',category='all',page=1,size=10}={}){
      if(!useMock){const q=new URLSearchParams({search,category,page,size});return normalize(await request('/api/posts?'+q))}
      const word=search.trim().toLowerCase(); const all=read().filter(p=>(category==='all'||p.category===category)&&(!word||`${p.title} ${p.content}`.toLowerCase().includes(word))); const start=(page-1)*size; return wait({items:all.slice(start,start+size),total:all.length})
    },
    async getPost(id){ if(!useMock)return request('/api/posts/'+id); const post=read().find(p=>String(p.id)===String(id));if(!post)throw new Error('게시글을 찾을 수 없습니다.');return wait(post) },
    async createPost(payload){ if(!useMock)return request('/api/posts',{method:'POST',body:JSON.stringify(payload)});const posts=read();const post={...payload,id:Math.max(0,...posts.map(p=>p.id))+1,date:new Date().toISOString().slice(0,10),comments:[]};posts.unshift(post);write(posts);return wait(post) },
    async updatePost(id,payload){ if(!useMock)return request('/api/posts/'+id,{method:'PUT',body:JSON.stringify(payload)});const posts=read(),i=posts.findIndex(p=>String(p.id)===String(id));if(i<0)throw new Error('게시글을 찾을 수 없습니다.');if(posts[i].password!==payload.password)throw new Error('비밀번호가 일치하지 않습니다.');posts[i]={...posts[i],...payload,id:posts[i].id};write(posts);return wait(posts[i]) },
    async deletePost(id,password){ if(!useMock)return request('/api/posts/'+id,{method:'DELETE',body:JSON.stringify({password})});const posts=read(),post=posts.find(p=>String(p.id)===String(id));if(post?.password!==password)throw new Error('비밀번호가 일치하지 않습니다.');write(posts.filter(p=>String(p.id)!==String(id)));return wait(null) },
    async createComment(postId,payload){ if(!useMock)return request(`/api/posts/${postId}/comments`,{method:'POST',body:JSON.stringify(payload)});const posts=read(),post=posts.find(p=>String(p.id)===String(postId));const item={...payload,id:Math.max(0,...(post.comments||[]).map(c=>c.id))+1,date:new Date().toISOString().slice(0,10)};post.comments=[...(post.comments||[]),item];write(posts);return wait(item) },
    async deleteComment(postId,commentId,password){ if(!useMock)return request(`/api/posts/${postId}/comments/${commentId}`,{method:'DELETE',body:JSON.stringify({password})});const posts=read(),post=posts.find(p=>String(p.id)===String(postId)),item=post?.comments?.find(c=>String(c.id)===String(commentId));if(item?.password!==password)throw new Error('비밀번호가 일치하지 않습니다.');post.comments=post.comments.filter(c=>String(c.id)!==String(commentId));write(posts);return wait(null) },
    async chat(message,history=[]){ if(!useMock)return request('/api/chat',{method:'POST',body:JSON.stringify({message,history})});await wait(null);return {message:`"${message}"에 대한 GPT 응답은 백엔드 연결 후 제공됩니다.`} },
  }
})()
