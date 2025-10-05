// التطبيق الرئيسي
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة المكونات
    initApp();
});

function initApp() {
    console.log('Application initialized');
    
    // إظهار بطاقة معلومات الموقع
    document.getElementById('locationInfoCard').style.display = 'block';
}

// الحصول على بيانات الموقع وعرضها
async function getLocationData(lat, lon, isAreaAnalysis = false) {
    try {
        showLoading('locationInfo', 'جاري تحليل بيانات الموقع...');
        showLoading('currentAnalysis', 'جاري تحليل البيانات...');
        showLoading('futurePredictions', 'جاري تحليل التنبؤات...');

        // جلب البيانات بالتوازي
        const [weatherData, airQualityData, safetyData, comprehensiveData, futureAirQuality, futureWeather] = await Promise.all([
            apiService.getWeather(lat, lon),
            apiService.getAirQuality(lat, lon),
            apiService.getSafetyScore(lat, lon),
            apiService.getComprehensiveSafety(lat, lon),
            apiService.getFutureAirQuality(lat, lon),
            apiService.getFutureWeather(lat, lon)
        ]);

        // عرض معلومات الموقع
        displayLocationInfo(lat, lon, weatherData, airQualityData, safetyData);
        
        // عرض التحليل الحالي
        displayCurrentAnalysis(comprehensiveData, isAreaAnalysis);
        
        // عرض التنبؤات المستقبلية
        displayFuturePredictions(futureAirQuality, futureWeather);

    } catch (error) {
        console.error('Error fetching location data:', error);
        document.getElementById('locationInfo').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-times-circle me-2"></i>
                فشل في تحميل بيانات الموقع
            </div>
        `;
    }
}

// عرض معلومات الموقع
function displayLocationInfo(lat, lon, weatherData, airQualityData, safetyData) {
    const weather = weatherData.current || {};
    const aqi = airQualityData.aqi || 3;
    const safetyScore = safetyData.safety_score || 3;

    const aqiLevels = {
        1: { text: 'ممتاز', class: 'bg-success' },
        2: { text: 'جيد', class: 'bg-info' },
        3: { text: 'متوسط', class: 'bg-warning' },
        4: { text: 'سيء', class: 'bg-danger' },
        5: { text: 'خطير', class: 'bg-dark' }
    };

    const safetyLevels = {
        1: { text: 'منخفضة', class: 'bg-danger' },
        2: { text: 'متوسطة منخفضة', class: 'bg-warning' },
        3: { text: 'متوسطة', class: 'bg-info' },
        4: { text: 'جيدة', class: 'bg-success' },
        5: { text: 'ممتازة', class: 'bg-success' }
    };

    const aqiInfo = aqiLevels[aqi] || aqiLevels[3];
    const safetyInfo = safetyLevels[safetyScore] || safetyLevels[3];

    document.getElementById('locationInfo').innerHTML = `
        <div class="location-details">
            <h6><i class="fas fa-map-pin me-2"></i>معلومات الموقع</h6>
            <p class="mb-2"><strong>الإحداثيات:</strong> ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
            
            <div class="row text-center mt-3">
                <div class="col-4">
                    <div class="border rounded p-2">
                        <i class="fas fa-temperature-half text-warning fa-lg mb-2"></i>
                        <div class="small">${weather.temp_c || '--'}°C</div>
                        <div class="very-small text-muted">الحرارة</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="border rounded p-2">
                        <i class="fas fa-wind text-info fa-lg mb-2"></i>
                        <div class="small">
                            <span class="badge ${aqiInfo.class}">${aqiInfo.text}</span>
                        </div>
                        <div class="very-small text-muted">جودة الهواء</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="border rounded p-2">
                        <i class="fas fa-shield-alt text-success fa-lg mb-2"></i>
                        <div class="small">
                            <span class="badge ${safetyInfo.class}">${safetyInfo.text}</span>
                        </div>
                        <div class="very-small text-muted">السلامة</div>
                    </div>
                </div>
            </div>
            
            ${weather.condition ? `
            <div class="mt-3">
                <p class="mb-1"><strong>حالة الطقس:</strong> ${weather.condition.text}</p>
                <p class="mb-1"><strong>الرطوبة:</strong> ${weather.humidity}%</p>
                <p class="mb-0"><strong>سرعة الرياح:</strong> ${weather.wind_kph} كم/س</p>
            </div>
            ` : ''}
        </div>
    `;
}

// عرض التحليل الحالي
function displayCurrentAnalysis(comprehensiveData, isAreaAnalysis) {
    const aqi = comprehensiveData.air_quality || 3;
    const safetyScore = comprehensiveData.safety_score || 3;
    
    let analysisHTML = `
        <div class="analysis-result">
            <h6><i class="fas fa-chart-bar me-2"></i>التحليل الحالي</h6>
    `;

    if (isAreaAnalysis) {
        analysisHTML += `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                تحليل شامل للمنطقة المحيطة
            </div>
        `;
    }

    analysisHTML += `
            <div class="progress mb-2" style="height: 20px;">
                <div class="progress-bar bg-success" style="width: ${(safetyScore / 5) * 100}%">
                    درجة السلامة: ${safetyScore}/5
                </div>
            </div>
            
            <div class="progress mb-3" style="height: 20px;">
                <div class="progress-bar ${aqi <= 2 ? 'bg-info' : aqi <= 3 ? 'bg-warning' : 'bg-danger'}" 
                     style="width: ${(aqi / 5) * 100}%">
                    جودة الهواء: ${aqi}/5
                </div>
            </div>

            <div class="safety-tips">
                <h6>نصائح السلامة:</h6>
                <ul class="list-unstyled">
                    ${getSafetyTips(aqi, safetyScore)}
                </ul>
            </div>
        </div>
    `;

    document.getElementById('currentAnalysis').innerHTML = analysisHTML;
}

// عرض التنبؤات المستقبلية
function displayFuturePredictions(futureAirQuality, futureWeather) {
    let predictionsHTML = `
        <div class="future-predictions">
            <h6><i class="fas fa-clock me-2"></i>التنبؤات المستقبلية</h6>
    `;

    if (futureAirQuality.future_air_quality && futureWeather.length > 0) {
        predictionsHTML += `
            <div class="row text-center">
        `;

        futureAirQuality.future_air_quality.forEach((day, index) => {
            const weather = futureWeather[index] || {};
            const aqiLevels = {
                1: { text: 'ممتاز', class: 'bg-success' },
                2: { text: 'جيد', class: 'bg-info' },
                3: { text: 'متوسط', class: 'bg-warning' },
                4: { text: 'سيء', class: 'bg-danger' },
                5: { text: 'خطير', class: 'bg-dark' }
            };
            
            const aqiInfo = aqiLevels[day.predicted_aqi] || aqiLevels[3];

            predictionsHTML += `
                <div class="col-4">
                    <div class="border rounded p-2 mb-2">
                        <div class="small fw-bold">${formatDate(day.date)}</div>
                        <div class="my-1">
                            <span class="badge ${aqiInfo.class}">${aqiInfo.text}</span>
                        </div>
                        ${weather.day ? `
                        <div class="very-small">
                            ${weather.day.maxtemp_c}° / ${weather.day.mintemp_c}°<br>
                            ${weather.day.condition.text}
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        predictionsHTML += `
            </div>
            <div class="mt-2 text-muted very-small">
                <i class="fas fa-info-circle me-1"></i>
                تنبؤات بناءً على البيانات التاريخية والأنماط الحالية
            </div>
        `;
    } else {
        predictionsHTML += `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                لا توجد تنبؤات متاحة حاليًا
            </div>
        `;
    }

    predictionsHTML += `</div>`;
    document.getElementById('futurePredictions').innerHTML = predictionsHTML;
}

// الحصول على نصائح الذكاء الاصطناعي
async function getAIAdvice() {
    const prompt = document.getElementById('aiPrompt').value;
    if (!prompt.trim()) {
        alert('يرجى إدخال سؤال أو استفسار');
        return;
    }

    if (!currentLocationMarker) {
        alert('يرجى تحديد موقعك أولاً');
        return;
    }

    const lngLat = currentLocationMarker.getLngLat();
    const lat = lngLat.lat;
    const lon = lngLat.lng;

    try {
        document.getElementById('aiAdvice').style.display = 'block';
        document.getElementById('aiAdvice').innerHTML = `
            <div class="text-center">
                <div class="loading-spinner mb-2"></div>
                <div class="text-muted">جاري تحليل سؤالك وإعداد النصائح...</div>
            </div>
        `;

        const adviceData = await apiService.getAIAdvice(lat, lon, prompt);
        
        document.getElementById('aiAdvice').innerHTML = `
            <div class="ai-response">
                <h6><i class="fas fa-robot me-2"></i>نصائح الذكاء الاصطناعي</h6>
                <div class="response-content">
                    ${adviceData.advice || 'لا توجد نصائح متاحة حالياً.'}
                </div>
                <div class="mt-2 text-muted very-small">
                    <i class="fas fa-map-pin me-1"></i>
                    بناءً على موقعك (${lat.toFixed(4)}, ${lon.toFixed(4)})
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error getting AI advice:', error);
        document.getElementById('aiAdvice').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-times-circle me-2"></i>
                فشل في الحصول على النصائح. يرجى المحاولة مرة أخرى.
            </div>
        `;
    }
}

// الحصول على نصائح السلامة
function getSafetyTips(aqi, safetyScore) {
    const tips = [];
    
    if (aqi <= 2) {
        tips.push('<li><i class="fas fa-check text-success me-2"></i>جودة الهواء ممتازة - مثالي للأنشطة الخارجية</li>');
    } else if (aqi <= 3) {
        tips.push('<li><i class="fas fa-info-circle text-info me-2"></i>جودة الهواء مقبولة - مناسب لمعظم الأشخاص</li>');
    } else {
        tips.push('<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>يفضل تجنب الأنشطة الخارجية المطولة</li>');
    }

    if (safetyScore >= 4) {
        tips.push('<li><i class="fas fa-check text-success me-2"></i>المنطقة آمنة للزيارة والأنشطة</li>');
    } else if (safetyScore >= 3) {
        tips.push('<li><i class="fas fa-info-circle text-info me-2"></i>اتخذ الاحتياطات المعتادة</li>');
    } else {
        tips.push('<li><i class="fas fa-exclamation-triangle text-warning me-2"></i>يُنصح بالحذر واتخاذ إجراءات السلامة</li>');
    }

    tips.push('<li><i class="fas fa-sun text-warning me-2"></i>حافظ على الترطيب خاصة في الأجواء الحارة</li>');
    tips.push('<li><i class="fas fa-mobile-alt text-primary me-2"></i>احتفظ بأرقام الطوارئ في متناول اليد</li>');

    return tips.join('');
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        month: 'short',
        day: 'numeric'
    });
}

// التمرير إلى قسم معين
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: 'smooth'
    });
}

// إضافة بعض الأنماط الإضافية
const style = document.createElement('style');
style.textContent = `
    .very-small {
        font-size: 0.75rem;
    }
    
    .custom-marker {
        cursor: pointer;
    }
    
    .safety-tips ul li {
        margin-bottom: 0.5rem;
        padding-right: 1rem;
    }
    
    .ai-response .response-content {
        background: white;
        padding: 1rem;
        border-radius: 0.375rem;
        border-right: 4px solid #0dcaf0;
    }
    
    .progress-bar {
        font-size: 0.75rem;
        font-weight: bold;
    }
`;
document.head.appendChild(style);