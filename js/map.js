// خريطة TomTom
let map = null;
let markers = [];
let currentLocationMarker = null;
let layers = {
    weather: true,
    airQuality: true,
    nasa: false
};

// تهيئة الخريطة
function initMap() {
    map = tt.map({
        key: TOMTOM_API_KEY,
        container: 'map',
        center: [46.6753, 24.7136], // الرياض
        zoom: 10,
        language: 'ar'
    });

    // إضافة تحكم التكبير/التصغير
    map.addControl(new tt.NavigationControl());

    // حدث النقر على الخريطة
    map.on('click', function(e) {
        const lngLat = e.lngLat;
        addMarker(lngLat.lng, lngLat.lat, 'موقع محدد');
        getLocationData(lngLat.lat, lngLat.lng);
    });

    console.log('TomTom map initialized successfully');
}

// إضافة علامة على الخريطة
function addMarker(lng, lat, title, color = '#FF0000') {
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.style.width = '20px';
    markerElement.style.height = '20px';
    markerElement.style.backgroundColor = color;
    markerElement.style.borderRadius = '50%';
    markerElement.style.border = '2px solid white';
    markerElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

    const marker = new tt.Marker({
        element: markerElement,
        anchor: 'bottom'
    })
    .setLngLat([lng, lat])
    .addTo(map);

    if (title) {
        const popup = new tt.Popup({ offset: 25 })
            .setHTML(`<div class="text-center"><strong>${title}</strong></div>`);
        marker.setPopup(popup);
    }

    markers.push(marker);
    return marker;
}

// الحصول على الموقع الحالي
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('المتصفح لا يدعم خدمة تحديد الموقع');
        return;
    }

    showLoading('locationInfo', 'جاري تحديد موقعك...');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // إزالة العلامة السابقة إذا وجدت
            if (currentLocationMarker) {
                currentLocationMarker.remove();
            }
            
            // إضافة علامة الموقع الحالي
            currentLocationMarker = addMarker(lon, lat, 'موقعك الحالي', '#4CAF50');
            
            // تحريك الخريطة للموقع الحالي
            map.flyTo({
                center: [lon, lat],
                zoom: 14
            });
            
            // جلب بيانات الموقع
            await getLocationData(lat, lon);
        },
        (error) => {
            console.error('Error getting location:', error);
            alert('فشل في تحديد الموقع. يرجى التأكد من تفعيل خدمة الموقع.');
            hideLoading('locationInfo');
        }
    );
}

// استخدام الموقع الحالي لنقطة البداية أو النهاية
function useCurrentLocation(type) {
    if (!navigator.geolocation) {
        alert('المتصفح لا يدعم خدمة تحديد الموقع');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            if (type === 'start') {
                document.getElementById('startPoint').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            } else {
                document.getElementById('endPoint').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            }
        },
        (error) => {
            alert('فشل في تحديد الموقع');
        }
    );
}

// البحث عن أفضل مسار
async function findBestRoute() {
    const startPoint = document.getElementById('startPoint').value;
    const endPoint = document.getElementById('endPoint').value;
    
    if (!startPoint || !endPoint) {
        alert('يرجى إدخال نقطتي البداية والنهاية');
        return;
    }

    try {
        // تحويل العناوين إلى إحداثيات (في تطبيق حقيقي، استخدم خدمة Geocoding)
        const startCoords = startPoint.split(',').map(coord => parseFloat(coord.trim()));
        const endCoords = endPoint.split(',').map(coord => parseFloat(coord.trim()));
        
        if (startCoords.length !== 2 || endCoords.length !== 2) {
            alert('يرجى إدخال الإحداثيات بصيغة صحيحة: خط العرض, خط الطول');
            return;
        }

        showLoading('routeResults', 'جاري البحث عن أفضل مسار آمن...');

        const routeData = await apiService.getBestRoute(
            startCoords[0], startCoords[1], 
            endCoords[0], endCoords[1]
        );

        if (routeData.error) {
            document.getElementById('routeResults').innerHTML = 
                '<div class="alert alert-danger">فشل في العثور على مسار آمن</div>';
        } else {
            displayRouteOnMap(routeData, startCoords, endCoords);
        }
    } catch (error) {
        console.error('Error finding route:', error);
        document.getElementById('routeResults').innerHTML = 
            '<div class="alert alert-danger">حدث خطأ أثناء البحث عن المسار</div>';
    }
}

// عرض المسار على الخريطة
function displayRouteOnMap(routeData, startCoords, endCoords) {
    // مسح المسارات السابقة
    clearRoutes();
    
    // إضافة علامات البداية والنهاية
    addMarker(startCoords[1], startCoords[0], 'نقطة البداية', '#4CAF50');
    addMarker(endCoords[1], endCoords[0], 'نقطة النهاية', '#F44336');
    
    // عرض معلومات المسار
    const distanceKm = (routeData.distance / 1000).toFixed(1);
    const durationMin = Math.round(routeData.duration / 60);
    
    document.getElementById('routeResults').innerHTML = `
        <div class="alert alert-success">
            <h6><i class="fas fa-route me-2"></i>أفضل مسار آمن</h6>
            <p class="mb-1"><strong>المسافة:</strong> ${distanceKm} كم</p>
            <p class="mb-1"><strong>الوقت المتوقع:</strong> ${durationMin} دقيقة</p>
            <p class="mb-0"><strong>مستوى السلامة:</strong> <span class="badge bg-success">ممتاز</span></p>
        </div>
    `;
}

// البحث عن أماكن قريبة
async function findNearbyPlaces() {
    const placeType = document.getElementById('placeType').value;
    if (!placeType) return;

    if (!currentLocationMarker) {
        alert('يرجى تحديد موقعك أولاً');
        return;
    }

    const lngLat = currentLocationMarker.getLngLat();
    const lat = lngLat.lat;
    const lon = lngLat.lng;

    try {
        showLoading('locationInfo', `جاري البحث عن ${getPlaceTypeName(placeType)}...`);

        const placesData = await apiService.searchNearbyPlaces(lat, lon, placeType);
        
        // مسح العلامات السابقة (باستثناء الموقع الحالي)
        markers.forEach(marker => {
            if (marker !== currentLocationMarker) {
                marker.remove();
            }
        });
        markers = currentLocationMarker ? [currentLocationMarker] : [];

        // إضافة أماكن جديدة
        if (placesData.results && placesData.results.length > 0) {
            placesData.results.slice(0, 10).forEach(place => {
                const marker = addMarker(
                    place.position.lon, 
                    place.position.lat, 
                    place.poi ? place.poi.name : 'مكان',
                    '#2196F3'
                );
            });

            document.getElementById('locationInfo').innerHTML = `
                <div class="alert alert-info">
                    <h6><i class="fas fa-map-marker-alt me-2"></i>${getPlaceTypeName(placeType)} القريبة</h6>
                    <p class="mb-0">تم العثور على ${placesData.results.length} مكان</p>
                </div>
            `;
        } else {
            document.getElementById('locationInfo').innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    لم يتم العثور على ${getPlaceTypeName(placeType)} قريبة
                </div>
            `;
        }
    } catch (error) {
        console.error('Error finding nearby places:', error);
        document.getElementById('locationInfo').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-times-circle me-2"></i>
                فشل في البحث عن الأماكن القريبة
            </div>
        `;
    }
}

// تحليل سلامة المنطقة
async function analyzeAreaSafety() {
    if (!currentLocationMarker) {
        alert('يرجى تحديد موقعك أولاً');
        return;
    }

    const lngLat = currentLocationMarker.getLngLat();
    await getLocationData(lngLat.lat, lngLat.lng, true);
}

// تبديل طبقات الخريطة
function toggleLayer(layer) {
    layers[layer] = !layers[layer];
    // هنا يمكنك إضافة منطق لعرض/إخفاء الطبقات
    console.log(`Layer ${layer}:`, layers[layer] ? 'visible' : 'hidden');
}

// مسح الخريطة
function clearMap() {
    markers.forEach(marker => marker.remove());
    markers = [];
    currentLocationMarker = null;
    document.getElementById('locationInfo').innerHTML = '';
    document.getElementById('locationInfoCard').style.display = 'none';
}

// تكبير الخريطة
function zoomIn() {
    map.zoomIn();
}

// تصغير الخريطة
function zoomOut() {
    map.zoomOut();
}

// مسح المسارات
function clearRoutes() {
    // في تطبيق حقيقي، ستزيل طبقة المسارات هنا
}

// الحصول على اسم نوع المكان
function getPlaceTypeName(type) {
    const names = {
        'hospital': 'المستشفيات',
        'restaurant': 'المطاعم',
        'park': 'الحدائق',
        'pharmacy': 'الصيدليات'
    };
    return names[type] || type;
}

// وظائف مساعدة للتحميل
function showLoading(elementId, message = 'جاري التحميل...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="text-center">
                <div class="loading-spinner mb-2"></div>
                <div class="text-muted">${message}</div>
            </div>
        `;
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

// تهيئة الخريطة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initMap();
});