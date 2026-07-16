const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
})

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { detail: '허용되지 않은 요청입니다.' })

  const kakaoMapKey = process.env.KAKAO_MAP_KEY
  if (!kakaoMapKey) return json(500, { detail: 'KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다.' })

  return json(200, { kakaoMapKey })
}
