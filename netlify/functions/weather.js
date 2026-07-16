const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
})

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { detail: '허용되지 않은 요청입니다.' })

  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) return json(500, { detail: 'OPENWEATHER_API_KEY 환경변수가 설정되지 않았습니다.' })

  const query = new URLSearchParams({
    lat: '37.5665',
    lon: '126.9780',
    appid: apiKey,
    units: 'metric',
    lang: 'kr',
  })

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?${query}`)
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const message = response.status === 401
        ? '날씨 API 키가 아직 활성화되지 않았거나 올바르지 않습니다.'
        : data?.message || '서울 날씨를 불러오지 못했습니다.'
      return json(response.status, { detail: message })
    }

    return json(200, {
      location: '서울특별시',
      temperature: Math.round(Number(data.main?.temp || 0) * 10) / 10,
      feelsLike: Math.round(Number(data.main?.feels_like || 0) * 10) / 10,
      humidity: Number(data.main?.humidity || 0),
      windSpeed: Math.round(Number(data.wind?.speed || 0) * 10) / 10,
      rainAmount: Number(data.rain?.['1h'] || data.snow?.['1h'] || 0),
      description: data.weather?.[0]?.description || '날씨 정보 없음',
      icon: data.weather?.[0]?.icon || '01d',
      observedAt: data.dt ? new Date(data.dt * 1000).toISOString() : new Date().toISOString(),
    })
  } catch (_error) {
    return json(502, { detail: 'OpenWeather API에 연결하지 못했습니다.' })
  }
}
