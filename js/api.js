// TomTom API Key - استبدل بمفتاحك
const TOMTOM_API_KEY = 'aZObCSP9KauA65mYDWRqhRUmUyWBeNRs';

// ملف API للتواصل مع واجهات برمجة التطبيقات الخلفية
class APIService {
    constructor() {
        this.baseURL = 'https://breatheapp-production.up.railway.app/api/';
        this.useMockData = false;
    }

    async makeRequest(endpoint, params = {}) {
        try {
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
            const queryString = new URLSearchParams(params).toString();
            
            // الإصلاح: استخدام ? لفصل المعاملات
            const url = `${this.baseURL}${cleanEndpoint}${queryString ? `?${queryString}` : ''}`;
            
            console.log(`🔄 Making API request to: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ API Response for ${endpoint}:`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ API Request failed for ${endpoint}:`, error);
            // استخدم البيانات التجريبية في حالة الخطأ
            return this.getMockData(endpoint, params);
        }
    }

    // بيانات تجريبية للاختبار
    getMockData(endpoint, params) {
        console.log(`📋 Using mock data for: ${endpoint}`);
        
        const mockData = {
            'air-quality': { aqi: Math.floor(Math.random() * 5) + 1 },
            'safety-score': { safety_score: Math.floor(Math.random() * 5) + 1 },
            'weather': { 
                current: { 
                    temp_c: Math.floor(Math.random() * 35) + 5,
                    condition: { text: ['مشمس', 'غائم', 'ممطر'][Math.floor(Math.random() * 3)] },
                    humidity: Math.floor(Math.random() * 100),
                    wind_kph: Math.floor(Math.random() * 30),
                    feelslike_c: Math.floor(Math.random() * 35) + 5
                } 
            },
            'best-route': { 
                distance: Math.floor(Math.random() * 10000) + 1000,
                duration: Math.floor(Math.random() * 3600) + 600,
                points: []
            },
            'comprehensive-safety': {
                air_quality: Math.floor(Math.random() * 5) + 1,
                safety_score: Math.floor(Math.random() * 5) + 1,
                nasa_earth_data: { sample: 'بيانات تجريبية من ناسا' }
            },
            'future-air-quality': {
                future_air_quality: Array.from({length: 3}, (_, i) => ({
                    date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    predicted_aqi: Math.floor(Math.random() * 5) + 1
                }))
            },
            'future-weather': Array.from({length: 3}, (_, i) => ({
                date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                day: {
                    maxtemp_c: Math.floor(Math.random() * 35) + 10,
                    mintemp_c: Math.floor(Math.random() * 15) + 5,
                    condition: { text: ['مشمس', 'غائم', 'ممطر'][Math.floor(Math.random() * 3)] }
                }
            }))
        };

        return new Promise(resolve => {
            setTimeout(() => {
                const key = endpoint.replace('/', '');
                resolve(mockData[key] || { error: 'Endpoint not found in mock data' });
            }, 800);
        });
    }

    // جودة الهواء
    async getAirQuality(lat, lon) {
        return await this.makeRequest('air-quality/', { lat, lon });
    }

    // جودة الهواء المستقبلية
    async getFutureAirQuality(lat, lon, days = 3) {
        return await this.makeRequest('future-air-quality/', { lat, lon, days });
    }

    // درجة السلامة
    async getSafetyScore(lat, lon) {
        return await this.makeRequest('safety-score/', { lat, lon });
    }

    // أفضل مسار
    async getBestRoute(startLat, startLon, endLat, endLon) {
        return await this.makeRequest('best-route/', {
            start_lat: startLat,
            start_lon: startLon,
            end_lat: endLat,
            end_lon: endLon
        });
    }

    // أقرب موقع آمن
    async getNearestSafeLocation(lat, lon) {
        return await this.makeRequest('nearest-safe-location/', { lat, lon });
    }

    // بيانات شاملة
    async getComprehensiveSafety(lat, lon) {
        return await this.makeRequest('comprehensive-safety/', { lat, lon });
    }

    // بيانات الطقس
    async getWeather(lat, lon) {
        return await this.makeRequest('weather/', { lat, lon });
    }

    // طقس مستقبلي
    async getFutureWeather(lat, lon, days = 3) {
        return await this.makeRequest('future-weather/', { lat, lon, days });
    }

    // نصائح الذكاء الاصطناعي
    async getAIAdvice(lat, lon, prompt) {
        if (this.useMockData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        advice: `بناءً على موقعك (${lat.toFixed(4)}, ${lon.toFixed(4)}):

🎯 **نصائح السلامة البيئية:**

✅ **جودة الهواء جيدة** - مثالي للأنشطة الخارجية
✅ **الطقس مناسب** للمشي والتمارين الرياضية  
✅ **حافظ على الترطيب** بشرب الماء بانتظام
✅ **استخدم الواقي الشمسي** في الأوقات المشمسة
✅ **اختر الأماكن المفتوحة** للترفيه العائلي

${prompt ? `\n❓ **رد على سؤالك:** ${prompt}\n` : ''}
                        `,
                        safety_score: 4,
                        air_quality: 2,
                        location: { lat, lon }
                    });
                }, 1500);
            });
        }

        try {
            const url = `${this.baseURL}ai-advice/`;
            console.log(`🤖 Making AI request to: ${url}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lat, lon, prompt })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('AI Advice request failed:', error);
            // استخدم البيانات التجريبية في حالة الخطأ
            return this.getMockAIAdvice(lat, lon, prompt);
        }
    }

    // بيانات تجريبية للذكاء الاصطناعي
    getMockAIAdvice(lat, lon, prompt) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    advice: `📍 **الموقع:** ${lat.toFixed(4)}, ${lon.toFixed(4)}

🌤️ **حالة الطقس:** مشمس ومعتدل
🌬️ **جودة الهواء:** جيدة (مستوى 2/5)
🛡️ **درجة السلامة:** عالية (4/5)

💡 **التوصيات:**
- الظروف مثالية للأنشطة الخارجية
- مناسب لجميع الفئات العمرية
- يمكن ممارسة الرياضة بأمان
- مثالي للنزهات العائلية

${prompt ? `\n📝 رد على استفسارك: ${prompt}\n` : ''}
                    `,
                    safety_score: 4,
                    air_quality: 2
                });
            }, 1200);
        });
    }

    // البحث عن أماكن قريبة باستخدام TomTom
    async searchNearbyPlaces(lat, lon, category) {
        try {
            const categoryMap = {
                'hospital': 'hospital',
                'restaurant': 'restaurant',
                'park': 'park',
                'pharmacy': 'pharmacy'
            };

            const searchCategory = categoryMap[category] || 'hospital';
            const url = `https://api.tomtom.com/search/2/nearbySearch/.json?key=${TOMTOM_API_KEY}&lat=${lat}&lon=${lon}&radius=10000&categorySet=${searchCategory}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`TomTom API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('TomTom search failed:', error);
            return { results: [] };
        }
    }
}

// إنشاء نسخة عامة من خدمة API
const apiService = new APIService();