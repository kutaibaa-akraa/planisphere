/*
======================================================================
plani.js

Ernie Wright  2 June 2013, 26 May 2014
====================================================================== */

/*
======================================================================
plani.js - الإصدار المترجم والمطور

المؤلف الأصلي: Ernie Wright (2 June 2013, 26 May 2014)
الترجمة والتطوير: قتيبة أقرع (2025-11-16)

التعديلات الرئيسية:
- ترجمة الواجهة إلى العربية
- إضافة نظام الإحداثيات القطبية  
- تحسين إدارة المواقع الجغرافية
- إضافة البحث عن الأجرام السماوية
- تحسينات في تجربة المستخدم

المشروع الأصلي: http://www.etwright.org/astro/plani.html
======================================================================
*/

var now = {};
var immoons = new Image();
immoons.src = "images/moons.png";
var clipped = false;
var ck_starlabels = false;
var ck_conlabels = false;
var ck_dsos = true;
var ck_conlines = true;


function draw_star( context, s )
{
   context.fillStyle = s.color;
   context.beginPath();
   context.arc( s.pos.x, s.pos.y, s.radius, 0, 2 * Math.PI );
   context.closePath();
   context.fill();
}


function draw_planet( context, p )
{
   draw_star( context, p );
   context.fillStyle = p.color;
   context.font = "13px Sans-Serif";
   var name = p.name == "Earth" ? "الشمس" : p.name;
   context.fillText( name, p.pos.x + 5, p.pos.y );
}


function draw_star_label( context, p )
{
   context.fillStyle = "#888";
   context.strokeStyle = "#888";
   context.font = "10px Sans-Serif";
   context.fillText( p.label, p.pos.x + 5, p.pos.y );
}

   
function draw_con_label( context, p )
{
   context.fillStyle = "#394060";
   context.strokeStyle = "#394060";
   context.font = "10px Sans-Serif";
   var s = p.name.toUpperCase();
   var w = context.measureText( s ).width;
   context.fillText( s, p.pos.x - w / 2, p.pos.y );
}

   
function ellipse( context, cx, cy, rx, ry, filled )
{
   context.save();
   context.beginPath();
   context.translate( cx - rx, cy - ry );
   context.scale( rx, ry );
   context.arc( 1, 1, 1, 0, 2 * Math.PI, false );
   context.closePath();
   context.restore();
   if ( filled )
      context.fill();
   else
      context.stroke();
}


function draw_dso( context, m )
{
   context.fillStyle = m.color;
   context.strokeStyle = m.color;
   context.font = "10px Sans-Serif";
   context.fillText( m.name, m.pos.x + m.offsetx, m.pos.y + m.offsety );
   if ( m.catalog == 1 && m.id == 45 ) return;
   switch ( m.type ) {
      case 1:
      case 2:
         context.beginPath();
         context.arc( m.pos.x, m.pos.y, 2.5, 0, 2 * Math.PI );
         context.closePath();
         context.stroke();
         break;
      case 3:
      case 4:
      case 5:  context.strokeRect( m.pos.x - 2, m.pos.y - 2, 4, 4 );  break;
      case 6:  ellipse( context, m.pos.x, m.pos.y, 4, 2, true );  break;
      default:
         context.beginPath();
         context.moveTo( m.pos.x - 2, m.pos.y );
         context.lineTo( m.pos.x + 2, m.pos.y );
         context.moveTo( m.pos.x, m.pos.y - 2 );
         context.lineTo( m.pos.x, m.pos.y + 2 );
         context.stroke();
         break;
   }
}


function draw_moon( context )
{
   context.globalCompositeOperation = "source-over";
   var i = Math.floor(( Astro.raddeg( moon.phase ) + 180 ) / 12 );
   context.drawImage( immoons, i * 16, 0, 16, 16, moon.pos.x - 8, moon.pos.y - 8, 16, 16 );
   context.globalCompositeOperation = "lighter";
   context.fillStyle = "#FFF0E0";
   context.font = "12px Sans-Serif";
   context.fillText( "القمر", moon.pos.x + 8, moon.pos.y );
}


function draw_line( context, s1, s2 )
{
   if ( s1.pos.visible && s2.pos.visible ) {
      context.beginPath();
      context.moveTo( s1.pos.x, s1.pos.y );
      context.lineTo( s2.pos.x, s2.pos.y );
      context.stroke();
   }
}


function draw_sky( context, w, h )
{
   /* ----- calculate Earth (sun) position */
   find_planet( planet[ 2 ], null, now.jd );
   var azalt = skypos_transform( planet[ 2 ].pos, now, w, h );
   var bgcolor;
   if ( azalt[ 1 ] > 0 ) bgcolor = "#182448";              // 24, 36, 72
   else if ( azalt[ 1 ] > -0.10472 ) bgcolor = "#121B36";  // 18, 27, 54
   else if ( azalt[ 1 ] > -0.20944 ) bgcolor = "#0C1224";  // 12, 18, 36
   else if ( azalt[ 1 ] > -0.31416 ) bgcolor = "#060912";  //  6,  9, 18
   else bgcolor = "#000000";

   /* ---- background, blue if sun up, black otherwise */
   context.clearRect( 0, 0, w, h );
   context.globalCompositeOperation = "source-over";
   context.fillStyle = bgcolor;  // planet[ 2 ].pos.visible ? "#182448" : "#000000";
   context.beginPath();
   context.arc( w / 2, h / 2, w / 2, 0, 2 * Math.PI );
   context.closePath();
   context.fill();
   if ( !clipped ) {
      context.clip();
      clipped = true;
   }

   context.globalCompositeOperation = "lighter";
   context.lineWidth = 0.51;

   /* ----- horizon labels */
   context.textBaseline = "middle";
   context.fillStyle = "#FF0000";
   context.font = "15px Sans-Serif";
   context.fillText( "شمال", ( w - 10 ) / 2, 9 );
   context.fillText( "جنوب", ( w - 10 ) / 2, h - 9 );
   context.fillText( "شرق", 2, h / 2 );
   context.fillText( "غرب", w - 30, h / 2 - 2 );

   /* ---- stars */
   var len = star.length;
   for ( var i = 0; i < len; i++ ) {
      skypos_transform( star[ i ].pos, now, w, h );
      if ( star[ i ].pos.visible )
         draw_star( context, star[ i ] );
   }

   /* ---- star labels */
   if ( ck_starlabels ) {
      var len = starname.length;
      for ( i = 0; i < len; i++ ) {
         skypos_transform( starname[ i ].pos, now, w, h );
         if ( starname[ i ].pos.visible )
            draw_star_label( context, starname[ i ] );
      }
   }

   /* ---- constellation labels */
   if ( ck_conlabels ) {
      var len = conname.length;
      for ( i = 0; i < len; i++ ) {
         skypos_transform( conname[ i ].pos, now, w, h );
         if ( conname[ i ].pos.visible )
            draw_con_label( context, conname[ i ] );
      }
   }
   
   /* ---- constellation lines */
   if ( ck_conlines ) {
      context.strokeStyle = "#808080";
      len = conline.length;
      for ( i = 0; i < len; i++ )
         draw_line( context, star[ conline[ i ][ 0 ]], star[ conline[ i ][ 1 ]] );
   }

   /* ---- planets */
   for ( i = 0; i < 9; i++ ) {
      if ( i != 2 ) {
         find_planet( planet[ i ], planet[ 2 ], now.jd );
         skypos_transform( planet[ i ].pos, now, w, h );
      }
      if ( planet[ i ].pos.visible )
         draw_planet( context, planet[ i ] );
   }
   
   /* ---- DSOs */
   if ( ck_dsos ) {
      len = dso.length;
      for ( i = 0; i < len; i++ ) {
         skypos_transform( dso[ i ].pos, now, w, h );
         if ( dso[ i ].pos.visible )
            draw_dso( context, dso[ i ] );
      }
   }

   /* ----- Moon */
   find_moon( moon, planet[ 2 ], now.jd );
   console.log( "phase: " + Astro.raddeg( moon.phase ));
   skypos_transform( moon.pos, now, w, h );
   if ( moon.pos.visible )
      draw_moon( context );
}


// تحديث دالة refresh لاستخدام النظام الجديد
function refresh() {
    var canvas = document.getElementById("planicanvas");
    if (!canvas || !canvas.getContext) return;
    var context = canvas.getContext("2d");
    draw_sky_updated(context, canvas.width, canvas.height);
}


/*function set_user_obs()
{
   var dt = document.getElementById( "user_date" );
   var lon = document.getElementById( "user_lon" );
   var lat = document.getElementById( "user_lat" );
   var slab = document.getElementById( "user_starlab" );
   var clab = document.getElementById( "user_conlab" );
   var idso = document.getElementById( "user_dsos" );
   var clin = document.getElementById( "user_conline" );

   d = now.getDate();
   dt.value = d.toString().slice( 0, 33 );
   lon.value = now.getLonDegrees();
   lat.value = now.getLatDegrees();
   slab.checked = ck_starlabels;
   clab.checked = ck_conlabels;
   idso.checked = ck_dsos;
   clin.checked = ck_conlines;
}
*/

function get_user_obs()
{
   var dt = document.getElementById( "user_date" );
   var lon = document.getElementById( "user_lon" );
   var lat = document.getElementById( "user_lat" );
   var slab = document.getElementById( "user_starlab" );
   var clab = document.getElementById( "user_conlab" );
   var idso = document.getElementById( "user_dsos" );
   var clin = document.getElementById( "user_conline" );

   var n = Date.parse( dt.value );
   if ( isNaN( n )) {
      alert( "Your browser doesn't think\n'" + dt.value + "'\nis a valid date." );
      set_user_obs();
      return;
   }
   var d = new Date( n );
   now.setDate( d );

   if ( lon.value >= -180 && lon.value < 360 )
      now.setLonDegrees( lon.value );
      
   if ( lat.value >= -90 && lat.value <= 90 )
      now.setLatDegrees( lat.value );

   ck_starlabels = slab.checked;
   ck_conlabels = clab.checked;
   ck_dsos = idso.checked;
   ck_conlines = clin.checked;
   console.log( "slab " + ck_starlabels + " dsos " + ck_dsos );
   set_user_obs();
   refresh();
}


function inc_button()
{
   var inc = document.getElementById( "increment" );
   now.incHour( inc.value );
   set_user_obs();
   refresh();
}


function dec_button()
{
   var inc = document.getElementById( "increment" );
   now.incHour( -inc.value );
   set_user_obs();
   refresh();
}


function now_button()
{
   now.setDate( new Date() );
   set_user_obs();
   refresh();
}

// دالة مساعدة لتحديث اسم الموقع عند التحميل الأولي
function initializeLocationName() {
   // البحث عن الموقع الافتراضي في المواقع المخزنة
   var currentLat = now.getLatDegrees();
   var currentLon = now.getLonDegrees();
   
   var locations = now.getSavedLocations();
   var matchingLocation = locations.find(loc => 
      Math.abs(loc.latitude - currentLat) < 0.001 && 
      Math.abs(loc.longitude - currentLon) < 0.001
   );
   
   if (matchingLocation) {
      now.setCurrentLocationName(matchingLocation.name);
   }
}

// تحديث دالة canvasApp لاستدعاء التهيئة
// تحديث canvasApp
function canvasApp() {
    init_stars(star);
    init_dsos(dso);
    init_planets(planet);
    now = new Observer();
    initializeLocationName();
    initCelestialObjects(); // تهيئة قائمة الأجرام
    set_user_obs();
    
    updateCoordinateSystemButton();
    updateCoordinateGridButton();
    
    refresh();
    
    setTimeout(function() {
        startAutoUpdate();
    }, 3000);
}


function getGeoPos() {
   navigator.geolocation.getCurrentPosition( setGeoPos );
}

// إضافة دوال التحكم بالموقع في plani.js

// تحديث دالة setGeoPos الحالية
function setGeoPos(geopos) {
   now.setLatDegrees(geopos.coords.latitude);
   now.setLonDegrees(geopos.coords.longitude);
   set_user_obs();
   refresh();
}


// دالة للبحث عن موقع بالاسم
function searchAndSetLocation() {
   var query = prompt('أدخل اسم المدينة أو المنطقة:');
   if (query) {
      now.searchLocationByName(query)
         .then(location => {
            now.setLatDegrees(location.latitude);
            now.setLonDegrees(location.longitude);
            set_user_obs();
            refresh();
            alert('تم تعيين الموقع: ' + location.name);
         })
         .catch(error => {
            alert(error.message);
         });
   }
}

// تحديث دالة showSavedLocations لعرض الأسماء بشكل صحيح
function showSavedLocations() {
   var locations = now.getSavedLocations();
   var modal = document.getElementById('locationsModal');
   var list = document.getElementById('savedLocationsList');
   
   if (locations.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">لا توجد مواقع محفوظة</div>';
   } else {
      list.innerHTML = locations.map((location, index) => `
         <div class="location-item" onclick="setLocationFromList('${location.name.replace(/'/g, "\\'")}')">
            <div>
               <div class="location-item-name">${location.name}</div>
               <div class="location-item-coords">عرض: ${location.latitude.toFixed(6)}° | طول: ${location.longitude.toFixed(6)}°</div>
            </div>
            <button onclick="event.stopPropagation(); deleteLocation('${location.name.replace(/'/g, "\\'")}')" 
                    style="background: none; border: none; color: #F44; cursor: pointer;">✕</button>
         </div>
      `).join('');
   }
   
   modal.style.display = 'block';
}

function closeLocationsModal() {
    document.getElementById('locationsModal').style.display = 'none';
}

function setLocationFromList(locationName) {
    if (now.setToSavedLocation(locationName)) {
        set_user_obs();
        refresh();
        closeLocationsModal();
        alert('تم تعيين الموقع: ' + locationName);
    }
}

function deleteLocation(locationName) {
    if (confirm('هل أنت متأكد من حذف الموقع "' + locationName + '"؟')) {
        now.deleteLocation(locationName);
        showSavedLocations(); // تحديث القائمة
    }
}

function exportLocations() {
    now.exportLocations();
    alert('تم تصدير المواقع إلى ملف JSON');
}

function importLocations() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        var file = event.target.files[0];
        if (file) {
            now.importLocations(file)
                .then(() => {
                    alert('تم استيراد المواقع بنجاح');
                })
                .catch(error => {
                    alert(error.message);
                });
        }
    };
    input.click();
}

// إغلاق النافذة عند النقر خارجها
document.addEventListener('click', function(event) {
    var modal = document.getElementById('locationsModal');
    if (event.target === modal) {
        closeLocationsModal();
    }
});

// تحديث دالة set_user_obs لإظهار اسم الموقع والإحداثيات
function set_user_obs() {
   var dt = document.getElementById("user_date");
   var lon = document.getElementById("user_lon");
   var lat = document.getElementById("user_lat");
   var slab = document.getElementById("user_starlab");
   var clab = document.getElementById("user_conlab");
   var idso = document.getElementById("user_dsos");
   var clin = document.getElementById("user_conline");

   d = now.getDate();
   dt.value = d.toString().slice(0, 33);
   
   // تحديث الإحداثيات مع الفاصلة العشرية
   var coords = now.getFormattedCoords();
   lon.value = coords.longitudeDeg;
   lat.value = coords.latitudeDeg;
   
   // تحديث اسم الموقع والإحداثيات المعروضة
   updateLocationDisplay();
   
   // تحديث وقت العرض
   updateLastUpdateTime();
   
   slab.checked = ck_starlabels;
   clab.checked = ck_conlabels;
   idso.checked = ck_dsos;
   clin.checked = ck_conlines;
}

// تحديث عرض معلومات الموقع
function updateLocationDisplay() {
    var locationDisplay = document.getElementById('currentLocationDisplay');
    if (!locationDisplay) return;
    
    var coords = now.getFormattedCoords();
    var locationName = now.getCurrentLocationName();
    
    locationDisplay.innerHTML = `
        <div class="location-name">${locationName}</div>
        <div class="location-coords">عرض: ${coords.latitudeDeg}° شمالاً | طول: ${coords.longitudeDeg}° شرقاً</div>
    `;
}

// دوال إدارة المواقع الجغرافية
// تحديث دوال إدارة المواقع
function getAndSaveCurrentLocation() {
    now.getCurrentLocation()
        .then(location => {
            var locationName = prompt('أدخل اسم لهذا الموقع:', location.name);
            if (locationName) {
                location.name = locationName;
                now.saveLocation(location);
                now.setLatDegrees(location.latitude);
                now.setLonDegrees(location.longitude);
                now.setCurrentLocationName(locationName);
                set_user_obs();
                refresh();
                alert('تم حفظ وتعيين الموقع: ' + locationName);
            }
        })
        .catch(error => {
            alert(error.message);
        });
		updateLocationDisplay();
}

function searchLocationByName() {
    var query = prompt('أدخل اسم المدينة أو المنطقة:');
    if (query) {
        now.searchLocationByName(query)
            .then(location => {
                var save = confirm('هل تريد حفظ هذا الموقع؟\n' + location.name);
                if (save) {
                    var locationName = prompt('أدخل اسم للموقع:', location.name);
                    if (locationName) {
                        location.name = locationName;
                        now.saveLocation(location);
                        now.setCurrentLocationName(locationName);
                    }
                } else {
                    now.setCurrentLocationName(location.name);
                }
                now.setLatDegrees(location.latitude);
                now.setLonDegrees(location.longitude);
                set_user_obs();
                refresh();
                alert('تم تعيين الموقع: ' + location.name);
            })
            .catch(error => {
                alert(error.message);
            });
    }
}

// متغيرات التحديث التلقائي
var autoUpdateInterval = null;
var autoUpdateEnabled = false;
var updateFrequency = 60000; // تحديث كل دقيقة (بالمللي ثانية)

// تحديث دالة التحديث التلقائي لتحديث مواقع الكواكب
function startAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
    }
    
    autoUpdateInterval = setInterval(function() {
        // تحديث الوقت إلى الوقت الحالي
        now.setDate(new Date());
        set_user_obs();
        
        // إذا كان هناك جرم مختار وكوكب، تحديث موقعه
        if (selectedCelestialObject && selectedCelestialObject.type === "planet") {
            calculatePlanetPosition(selectedCelestialObject);
            // تحديث صناديق الإدخال
            document.getElementById('celestialRA').value = radiansToHMS(selectedCelestialObject.ra);
            document.getElementById('celestialDEC').value = radiansToDMS(selectedCelestialObject.dec);
        }
        
        refresh();
        updateLastUpdateTime();
    }, updateFrequency);
    
    autoUpdateEnabled = true;
    updateAutoUpdateButton();
    console.log("بدأ التحديث التلقائي");
}

// إيقاف التحديث التلقائي
function stopAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
    }
    autoUpdateEnabled = false;
    updateAutoUpdateButton();
    console.log("توقف التحديث التلقائي");
}

// تبديل التحديث التلقائي
function toggleAutoUpdate() {
    if (autoUpdateEnabled) {
		stopAutoUpdate();        
    } else {
        startAutoUpdate();
    }
}

// تحديث حالة زر التحديث التلقائي
function updateAutoUpdateButton() {
    var button = document.getElementById('autoUpdateBtn');
    if (button) {
        if (autoUpdateEnabled) {
            button.innerHTML = '⏸ إيقاف التحديث التلقائي';
            button.style.backgroundColor = '#3a3240';
        } else {
            button.innerHTML = '▶ بدء التحديث التلقائي';
            button.style.backgroundColor = '#2b2632';
        }
    }
}

// تحديث وقت آخر تحديث
function updateLastUpdateTime() {
    var timeDisplay = document.getElementById('lastUpdateTime');
    if (timeDisplay) {
        var now = new Date();
        var timeString = now.toLocaleTimeString('ar-EG');
        timeDisplay.textContent = 'آخر تحديث: ' + timeString;
    }
}

// تحديث تردد التحديث
function setUpdateFrequency(frequency) {
    updateFrequency = frequency;
    if (autoUpdateEnabled) {
        stopAutoUpdate();
        startAutoUpdate();
    }
}



// تحديث دالة now_button لتعيد تشغيل التحديث التلقائي
function now_button() {
    now.setDate(new Date());
    set_user_obs();
    refresh();
    
    // إذا كان التحديث التلقائي متوقفاً، إعادة تشغيله
    if (!autoUpdateEnabled) {
        startAutoUpdate();
    }
    
    updateLastUpdateTime();
}

// تحديث تردد التحديث مع تحديث الواجهة
function setUpdateFrequency(frequency) {
    updateFrequency = frequency;
    
    // تحديث الأزرار النشطة
    var buttons = document.querySelectorAll('.frequency-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // تحديد الزر النشط بناءً على التردد
    var activeBtn = Array.from(buttons).find(btn => {
        var btnFreq = parseInt(btn.getAttribute('onclick').match(/\d+/)[0]);
        return btnFreq === frequency;
    });
    
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // إعادة تشغيل التحديث التلقائي إذا كان نشطاً
    if (autoUpdateEnabled) {
        stopAutoUpdate();
        startAutoUpdate();
    }
}


//=============================================
// متغيرات نظام الإحداثيات
var coordinateSystem = "altaz"; // "altaz" للسـمتية, "polar" للقطبية
var showCoordinateGrid = true;

// دوال التحويل بين الأنظمة
function convertToPolarCoords(pos, now, w, h) {
    try {
        var coord = [pos.ra, pos.dec];
        
        // 1. الاعتدال الفلكي من J2000 إلى الوقت الحالي
        Astro.precess(Astro.JD_J2000, now.jd, coord);
        
        // 2. حساب زاوية الساعة
        var hourAngle = Astro.range(now.lst - coord[0], Math.PI * 2);
        var dec = coord[1];
        
        // 3. تحديد الرؤية (للقطب الشمالي)
        var latitude = now.latitude;
        if (dec < -Math.PI/2 + latitude) { // تعديل حسب خط العرض
            pos.visible = false;
        } else {
            pos.visible = true;
            
            // 4. التحويل القطبي الصحيح
            // نصف القطر يتناسب مع بعد الجرم عن القطب
            var maxRadius = w / 2;
            var radius = maxRadius * (1 - dec / (Math.PI / 2));
            
            // 5. الزاوية هي زاوية الساعة (مع تعديل الاتجاه)
            var angle = hourAngle;
            
            pos.x = w / 2 + radius * Math.sin(angle);
            pos.y = h / 2 + radius * Math.cos(angle);
            
            // 6. التحقق من أن النقطة داخل الدائرة
            var distanceFromCenter = Math.sqrt(
                Math.pow(pos.x - w/2, 2) + Math.pow(pos.y - h/2, 2)
            );
            if (distanceFromCenter > maxRadius) {
                pos.visible = false;
            }
        }
        
        return [hourAngle, dec];
        
    } catch (error) {
        console.log('❌ خطأ في التحويل القطبي:', error);
        pos.visible = false;
        return [0, 0];
    }
}

// دالة الرسم المحدثة مع دعم النظامين
function draw_sky_updated(context, w, h) {
    /* ----- calculate Earth (sun) position */
    find_planet(planet[2], null, now.jd);
    var azalt = coordinateSystem === "altaz" ? 
                skypos_transform(planet[2].pos, now, w, h) :
                convertToPolarCoords(planet[2].pos, now, w, h);
    
    var bgcolor;
    if (azalt[1] > 0) bgcolor = "#182448";
    else if (azalt[1] > -0.10472) bgcolor = "#121B36";
    else if (azalt[1] > -0.20944) bgcolor = "#0C1224";
    else if (azalt[1] > -0.31416) bgcolor = "#060912";
    else bgcolor = "#000000";

    /* ---- background */
    context.clearRect(0, 0, w, h);
    context.globalCompositeOperation = "source-over";
    context.fillStyle = bgcolor;
    context.beginPath();
    
    if (coordinateSystem === "polar") {
        // دائرة كاملة للنظام القطبي
        context.arc(w / 2, h / 2, w / 2, 0, 2 * Math.PI);
    } else {
        // نصف دائرة للنظام السـمتي
        context.arc(w / 2, h / 2, w / 2, 0, 2 * Math.PI);
    }
    
    context.closePath();
    context.fill();
    
    if (!clipped) {
        context.clip();
        clipped = true;
    }

    context.globalCompositeOperation = "lighter";
    context.lineWidth = 0.51;

    /* ----- رسم الشبكة الإحداثية */
    if (showCoordinateGrid) {
        drawCoordinateGrid(context, w, h);
    }

    /* ----- الاتجاهات الجغرافية */
    context.textBaseline = "middle";
    context.fillStyle = "#FF0000";
    context.font = "15px Sans-Serif";
    
    if (coordinateSystem === "altaz") {
        context.fillText("شمال", (w - 10) / 2, 9);
        context.fillText("جنوب", (w - 10) / 2, h - 9);
        context.fillText("شرق", 2, h / 2);
        context.fillText("غرب", w - 30, h / 2 - 2);
    } else {
        // الاتجاهات للنظام القطبي
        context.fillText("N", (w - 10) / 2, 9);
        context.fillText("S", (w - 10) / 2, h - 9);
        context.fillText("E", 2, h / 2);
        context.fillText("W", w - 30, h / 2 - 2);
    }

    /* ---- النجوم */
    var len = star.length;
    for (var i = 0; i < len; i++) {
        if (coordinateSystem === "altaz") {
            skypos_transform(star[i].pos, now, w, h);
        } else {
            convertToPolarCoords(star[i].pos, now, w, h);
        }
        if (star[i].pos.visible)
            draw_star(context, star[i]);
    }

    /* ---- تسميات النجوم */
    if (ck_starlabels) {
        var len = starname.length;
        for (i = 0; i < len; i++) {
            if (coordinateSystem === "altaz") {
                skypos_transform(starname[i].pos, now, w, h);
            } else {
                convertToPolarCoords(starname[i].pos, now, w, h);
            }
            if (starname[i].pos.visible)
                draw_star_label(context, starname[i]);
        }
    }

    /* ---- تسميات الكوكبات */
    if (ck_conlabels) {
        var len = conname.length;
        for (i = 0; i < len; i++) {
            if (coordinateSystem === "altaz") {
                skypos_transform(conname[i].pos, now, w, h);
            } else {
                convertToPolarCoords(conname[i].pos, now, w, h);
            }
            if (conname[i].pos.visible)
                draw_con_label(context, conname[i]);
        }
    }
    
    /* ---- خطوط الكوكبات */
    if (ck_conlines) {
        context.strokeStyle = "#303030";
        len = conline.length;
        for (i = 0; i < len; i++) {
            // تأكد من تحويل إحداثيات النجوم المرتبطة
            if (coordinateSystem === "altaz") {
                skypos_transform(star[conline[i][0]].pos, now, w, h);
                skypos_transform(star[conline[i][1]].pos, now, w, h);
            } else {
                convertToPolarCoords(star[conline[i][0]].pos, now, w, h);
                convertToPolarCoords(star[conline[i][1]].pos, now, w, h);
            }
            draw_line(context, star[conline[i][0]], star[conline[i][1]]);
        }
    }

    /* ---- الكواكب */
    for (i = 0; i < 9; i++) {
        if (i != 2) {
            find_planet(planet[i], planet[2], now.jd);
            if (coordinateSystem === "altaz") {
                skypos_transform(planet[i].pos, now, w, h);
            } else {
                convertToPolarCoords(planet[i].pos, now, w, h);
            }
        }
        if (planet[i].pos.visible)
            draw_planet(context, planet[i]);
    }
    
    /* ---- الأجرام السماوية الخافتة */
    if (ck_dsos) {
        len = dso.length;
        for (i = 0; i < len; i++) {
            if (coordinateSystem === "altaz") {
                skypos_transform(dso[i].pos, now, w, h);
            } else {
                convertToPolarCoords(dso[i].pos, now, w, h);
            }
            if (dso[i].pos.visible)
                draw_dso(context, dso[i]);
        }
    }

    /* ----- القمر */
    find_moon(moon, planet[2], now.jd);
    if (coordinateSystem === "altaz") {
        skypos_transform(moon.pos, now, w, h);
    } else {
        convertToPolarCoords(moon.pos, now, w, h);
    }
    if (moon.pos.visible)
        draw_moon(context);
	
	    /* ---- رسم التمييز */
    drawCelestialHighlight(context, w, h);
}

// دالة رسم الشبكة الإحداثية
function drawCoordinateGrid(context, w, h) {
    context.strokeStyle = "rgba(100, 100, 150, 0.3)";
    context.lineWidth = 0.5;
    
    if (coordinateSystem === "altaz") {
        // شبكة السـمت (خطوط أفقية ورأسية)
        for (var i = 1; i < 6; i++) {
            var radius = (w / 2) * (i / 5);
            context.beginPath();
            context.arc(w / 2, h / 2, radius, 0, 2 * Math.PI);
            context.stroke();
        }
        
        // خطوط الزوايا
        for (var j = 0; j < 12; j++) {
            var angle = (j * 30 * Math.PI) / 180;
            context.beginPath();
            context.moveTo(w / 2, h / 2);
            context.lineTo(w / 2 + (w / 2) * Math.sin(angle), h / 2 - (h / 2) * Math.cos(angle));
            context.stroke();
        }
    } else {
        // شبكة قطبية (حلقات متحدة المركز)
        var centerX = w / 2;
        var centerY = h / 2;
        var maxRadius = w / 2;
        
        // دوائر الارتفاع
        for (var alt = 15; alt <= 90; alt += 15) {
            var radius = maxRadius * (1 - alt / 90);
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            context.stroke();
            
            // تسميات الارتفاع
            if (alt > 0 && alt < 90) {
                context.fillStyle = "rgba(100, 100, 150, 0.7)";
                context.font = "10px Sans-Serif";
                context.fillText(alt + "°", centerX + radius + 5, centerY);
            }
        }
        
        // خطوط السـمت
        for (var az = 0; az < 360; az += 30) {
            var angle = (az * Math.PI) / 180;
            context.beginPath();
            context.moveTo(centerX, centerY);
            context.lineTo(centerX + maxRadius * Math.sin(angle), centerY - maxRadius * Math.cos(angle));
            context.stroke();
        }
    }
}

// دوال التحكم في نظام الإحداثيات
// تحديث دالة toggleCoordinateSystem
function toggleCoordinateSystem() {
    coordinateSystem = coordinateSystem === "altaz" ? "polar" : "altaz";
    updateCoordinateSystemButton();
    updateCoordinateSystemInfo();
    refresh();
}

function toggleCoordinateGrid() {
    showCoordinateGrid = !showCoordinateGrid;
    updateCoordinateGridButton();
    refresh();
}

function updateCoordinateSystemButton() {
    var button = document.getElementById('coordSystemBtn');
    if (button) {
        if (coordinateSystem === "altaz") {
            button.innerHTML = '🜨 نظام سـمتي';
        } else {
            button.innerHTML = '⬤ نظام قطبي';
        }
    }
}

function updateCoordinateGridButton() {
    var button = document.getElementById('coordGridBtn');
    if (button) {
        if (showCoordinateGrid) {
            button.innerHTML = '🗺 إخفاء الشبكة';
            button.style.backgroundColor = '#3a3240';
        } else {
            button.innerHTML = '🗺 إظهار الشبكة';
            button.style.backgroundColor = '#2b2632';
        }
    }
}


// تحديث معلومات نظام الإحداثيات المعروضة
function updateCoordinateSystemInfo() {
    var info = document.getElementById('coordSystemInfo');
    if (info) {
        if (coordinateSystem === "altaz") {
            info.textContent = "النظام السـمتي (الارتفاع-السـمت)";
        } else {
            info.textContent = "النظام القطبي (الميل-الزاوية)";
        }
    }
}



//==================================البحث عن الأجرام السماوية ===============
// متغيرات البحث عن الأجرام السماوية
var selectedCelestialObject = null;
var celestialObjectsList = [];
var highlightInterval = null;

// تحديث دالة initCelestialObjects
function initCelestialObjects() {
    celestialObjectsList = [];
    
    // إضافة النجوم اللامعة
    starname.forEach(star => {
        celestialObjectsList.push({
            name: star.label,
            type: "star",
            ra: star.pos.ra,
            dec: star.pos.dec,
            magnitude: getStarMagnitude(star.label),
            isFixed: true // إشارة إلى أن الإحداثيات ثابتة
        });
    });
    
    // إضافة الكواكب (بدون إحداثيات ثابتة)
    planet.forEach((p, index) => {
        if (p.name !== "Earth") {
            celestialObjectsList.push({
                name: p.name,
                type: "planet",
                ra: 0, // سيتم حسابها لاحقاً
                dec: 0, // سيتم حسابها لاحقاً
                magnitude: getPlanetMagnitude(index),
                isFixed: false, // إشارة إلى أن الإحداثيات متغيرة
                planetIndex: index
            });
        }
    });
    
    // إضافة الأجرام السماوية العميقة (DSOs)
    dso.forEach(obj => {
        celestialObjectsList.push({
            name: getDSOName(obj),
            type: "dso",
            ra: obj.pos.ra,
            dec: obj.pos.dec,
            magnitude: getDSOMagnitude(obj),
            isFixed: true
        });
    });
    
    // ترتيب القائمة أبجدياً
    celestialObjectsList.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}


// دوال مساعدة للحصول على المعلومات
function getStarMagnitude(starName) {
    var star = starname.find(s => s.label === starName);
    if (star) {
        var baseStar = findBaseStar(star);
        return baseStar ? baseStar.mag : 0;
    }
    return 0;
}

function findBaseStar(starObj) {
    return star.find(s => 
        Math.abs(s.pos.ra - starObj.pos.ra) < 0.01 && 
        Math.abs(s.pos.dec - starObj.pos.dec) < 0.01
    );
}

function getPlanetMagnitude(planetIndex) {
    // قيم تقريبية للقدر الظاهري للكواكب
    var magnitudes = [0, -4, -26, -2, -2, 0, 6, 8, 14];
    return magnitudes[planetIndex] || 0;
}

function getDSOName(dsoObj) {
    switch (dsoObj.catalog) {
        case 1: return "M" + dsoObj.id;
        case 2: return "NGC " + dsoObj.id;
        case 0: return dsoObj.id == 2 ? "SMC" : "LMC";
        default: return "DSO " + dsoObj.id;
    }
}

function getDSOMagnitude(dsoObj) {
    // قيم تقريبية للقدر الظاهري للأجرام
    return 6; // قيمة افتراضية
}

// البحث في قائمة الأجرام
function searchCelestialObjects(query) {
    if (!query) return celestialObjectsList;
    
    return celestialObjectsList.filter(obj => 
        obj.name.includes(query) || 
        obj.name.toLowerCase().includes(query.toLowerCase())
    );
}

// تحديث دالة selectCelestialObject
function selectCelestialObject(objectName) {
    var obj = celestialObjectsList.find(o => o.name === objectName);
    if (obj) {
        selectedCelestialObject = obj;
        
        // إذا كان الكوكب، حساب موقعه الحالي
        if (obj.type === "planet" && !obj.isFixed) {
            calculatePlanetPosition(obj);
        }
        
        // تحديث صناديق الإدخال
        document.getElementById('celestialRA').value = radiansToHMS(obj.ra);
        document.getElementById('celestialDEC').value = radiansToDMS(obj.dec);
        
        // إظهار المعلومات
        document.getElementById('celestialInfo').innerHTML = `
            <strong>${obj.name}</strong><br>
            النوع: ${getTypeName(obj.type)}<br>
            القدر: ${obj.magnitude.toFixed(1)}<br>
            ${obj.isFixed ? 'إحداثيات ثابتة' : 'موقع متغير'}
        `;
        
        // بدء التمييز
        startHighlighting();
        refresh();
    }
}

// تحويل الراديان إلى ساعات ودقائق وثواني
function radiansToHMS(radians) {
    var hours = radians * 12 / Math.PI;
    var h = Math.floor(hours);
    var m = Math.floor((hours - h) * 60);
    var s = Math.floor(((hours - h) * 60 - m) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// تحويل الراديان إلى درجات ودقائق وثواني
function radiansToDMS(radians) {
    var degrees = radians * 180 / Math.PI;
    var sign = degrees < 0 ? -1 : 1;
    degrees = Math.abs(degrees);
    var d = Math.floor(degrees);
    var m = Math.floor((degrees - d) * 60);
    var s = Math.floor(((degrees - d) * 60 - m) * 60);
    return `${sign < 0 ? '-' : '+'}${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'${s.toString().padStart(2, '0')}"`;
}

// الحصول على اسم النوع بالعربية
function getTypeName(type) {
    var names = {
        "star": "نجم",
        "planet": "كوكب", 
        "dso": "جرم سماوي عميق"
    };
    return names[type] || type;
}

// بدء تمييز الجرم السماوي
function startHighlighting() {
    if (highlightInterval) {
        clearInterval(highlightInterval);
    }
    
    highlightInterval = setInterval(() => {
        refresh();
    }, 500); // تحديث كل 500 مللي ثانية للوميض
}

// إيقاف التمييز
function stopHighlighting() {
    if (highlightInterval) {
        clearInterval(highlightInterval);
        highlightInterval = null;
    }
    selectedCelestialObject = null;
    refresh();
}

// البحث في القائمة
function searchObjects() {
    var query = document.getElementById('objectSearch').value;
    var results = searchCelestialObjects(query);
    updateSearchResults(results);
}

// تحديث نتائج البحث
// تحديث دالة عرض نتائج البحث
function updateSearchResults(results) {
    var dropdown = document.getElementById('searchResults');
    dropdown.innerHTML = '';
    
    if (results.length === 0) {
        dropdown.innerHTML = '<div class="search-result-item">لا توجد نتائج</div>';
        return;
    }
    
    results.slice(0, 10).forEach(obj => {
        var item = document.createElement('div');
        item.className = 'search-result-item';
        
        var statusBadge = obj.isFixed ? 
            '<span class="object-status">ثابت</span>' : 
            '<span class="object-status">متحرك</span>';
        
        item.innerHTML = `
            <div>
                <strong>${obj.name}</strong>
                ${statusBadge}
            </div>
            <div>
                <span class="object-type">${getTypeName(obj.type)}</span>
                <span class="object-magnitude">${obj.magnitude.toFixed(1)}</span>
            </div>
        `;
        item.onclick = () => selectCelestialObject(obj.name);
        dropdown.appendChild(item);
    });
}


// تحديث دالة drawCelestialHighlight لتعمل مع الكواكب المتحركة
function drawCelestialHighlight(context, w, h) {
    if (!selectedCelestialObject) return;
    
    // إذا كان كوكباً، إعادة حساب موقعه
    if (selectedCelestialObject.type === "planet" && !selectedCelestialObject.isFixed) {
        calculatePlanetPosition(selectedCelestialObject);
    }
    
    // إنشاء كائن مؤقت للرسم
    var tempObj = {
        pos: {
            ra: selectedCelestialObject.ra,
            dec: selectedCelestialObject.dec,
            x: 0,
            y: 0,
            visible: false
        }
    };
    
    // تحويل الإحداثيات
    if (coordinateSystem === "altaz") {
        skypos_transform(tempObj.pos, now, w, h);
    } else {
        convertToPolarCoords(tempObj.pos, now, w, h);
    }
    
    if (!tempObj.pos.visible) {
        // إذا لم يكن الجرم مرئياً، عرض رسالة
        document.getElementById('celestialInfo').innerHTML += '<br><span style="color: #F44;">⚠ الجرم غير مرئي حالياً</span>';
        return;
    }
    
    // رسم دائرة متصالبة متميزة
    var flash = Math.sin(Date.now() / 200) > 0; // تأثير الوميض
    
    if (flash) {
        context.strokeStyle = "#FFFF00";
        context.fillStyle = "rgba(255, 255, 0, 0.2)";
        context.lineWidth = 3;
        
        // دائرة خارجية
        context.beginPath();
        context.arc(tempObj.pos.x, tempObj.pos.y, 15, 0, 2 * Math.PI);
        context.stroke();
        
        // خطوط متصالبة
        context.beginPath();
        context.moveTo(tempObj.pos.x - 10, tempObj.pos.y);
        context.lineTo(tempObj.pos.x + 10, tempObj.pos.y);
        context.moveTo(tempObj.pos.x, tempObj.pos.y - 10);
        context.lineTo(tempObj.pos.x, tempObj.pos.y + 10);
        context.stroke();
        
        // دائرة داخلية
        context.beginPath();
        context.arc(tempObj.pos.x, tempObj.pos.y, 5, 0, 2 * Math.PI);
        context.fill();
        
        // تسمية الجرم
        context.fillStyle = "#FFFF00";
        context.font = "12px Sans-Serif";
        context.fillText(selectedCelestialObject.name, tempObj.pos.x + 20, tempObj.pos.y - 20);
    }
}



// دالة جديدة لحساب موقع الكوكب الحالي
function calculatePlanetPosition(celestialObj) {
    if (celestialObj.type === "planet" && celestialObj.planetIndex !== undefined) {
        var planetIndex = celestialObj.planetIndex;
        
        // حساب موقع الأرض أولاً
        find_planet(planet[2], null, now.jd);
        
        // حساب موقع الكوكب المطلوب
        if (planetIndex !== 2) { // ليس الأرض
            find_planet(planet[planetIndex], planet[2], now.jd);
            celestialObj.ra = planet[planetIndex].pos.ra;
            celestialObj.dec = planet[planetIndex].pos.dec;
        } else {
            // الأرض (الشمس في السماء)
            celestialObj.ra = planet[2].pos.ra;
            celestialObj.dec = planet[2].pos.dec;
        }
        
        console.log(`موقع ${celestialObj.name}: RA=${celestialObj.ra.toFixed(4)}, DEC=${celestialObj.dec.toFixed(4)}`);
    }
}



// إضافة زر لتحديث موقع الجرم المختار
function updateSelectedObject() {
    if (selectedCelestialObject) {
        if (selectedCelestialObject.type === "planet") {
            calculatePlanetPosition(selectedCelestialObject);
            document.getElementById('celestialRA').value = radiansToHMS(selectedCelestialObject.ra);
            document.getElementById('celestialDEC').value = radiansToDMS(selectedCelestialObject.dec);
            refresh();
        }
    }
}