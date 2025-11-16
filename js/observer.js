/*
======================================================================
observer.js

Ernie Wright  2 June 2013
====================================================================== */
/*
======================================================================
observer.js - مع إضافة إدارة المواقع الجغرافية

 الإصدار المترجم والمطور

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

function Observer() {
   var d = new Date();
   this.jd = Astro.JD_1970 + d.getTime() / 86400000.0;
   this.longitude = Astro.degrad(-0.25 * d.getTimezoneOffset());
   this.latitude = Astro.degrad(40.0);
   this.savedLocations = [];
   this.initLST();
   this.loadSavedLocations();
}

Observer.prototype.setJD = function(jd) {
   this.jd = jd;
   this.initLST();
}

Observer.prototype.getDate = function() {
   return new Date(Math.round((this.jd - Astro.JD_1970) * 86400000.0));
}

Observer.prototype.setDate = function(date) {
   this.jd = Astro.JD_1970 + date.getTime() / 86400000.0;
   this.initLST();
}

Observer.prototype.incHour = function(count) {
   this.jd += count / 24.0;
   this.initLST();
}

Observer.prototype.getLatDegrees = function() {
   return Math.round(Astro.raddeg(this.latitude));
}

Observer.prototype.setLatDegrees = function(lat) {
   this.latitude = Astro.degrad(lat);
}

Observer.prototype.getLonDegrees = function() {
   return Math.round(Astro.raddeg(this.longitude));
}

Observer.prototype.setLon = function(lon) {
   this.longitude = lon;
   this.initLST();
}

Observer.prototype.setLonDegrees = function(lon) {
   this.longitude = Astro.degrad(lon);
   this.initLST();
}

Observer.prototype.jd_day = function() {
   return Math.floor(this.jd - 0.5) + 0.5;
}

Observer.prototype.jd_hour = function() {
   return (this.jd - this.jd_day()) * 24.0;
}

Observer.prototype.initLST = function() {
   this.lst = Astro.range(this.gst() + this.longitude, 2 * Math.PI);
}

Observer.prototype.gst = function() {
   var t = (this.jd_day() - Astro.JD_J2000) / 36525;
   var theta = 1.753368559146 + t * (628.331970688835 +
      t * (6.770708e-6 + t * -1.48e-6));
   return Astro.range(theta + Astro.hrrad(this.jd_hour()), 2 * Math.PI);
}

/* ========== الدوال الجديدة لإدارة المواقع الجغرافية ========== */

// البحث عن الموقع الجغرافي الحالي
Observer.prototype.getCurrentLocation = function() {
   return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
         reject(new Error("المتصفح لا يدعم خدمة الموقع الجغرافي"));
         return;
      }

      navigator.geolocation.getCurrentPosition(
         (position) => {
            var location = {
               latitude: position.coords.latitude,
               longitude: position.coords.longitude,
               accuracy: position.coords.accuracy,
               timestamp: new Date().toISOString(),
               name: "الموقع الحالي"
            };
            resolve(location);
         },
         (error) => {
            var errorMessage = "تعذر الحصول على الموقع: ";
            switch (error.code) {
               case error.PERMISSION_DENIED:
                  errorMessage += "تم رفض الإذن";
                  break;
               case error.POSITION_UNAVAILABLE:
                  errorMessage += "الموقع غير متاح";
                  break;
               case error.TIMEOUT:
                  errorMessage += "انتهت المهلة";
                  break;
               default:
                  errorMessage += "خطأ غير معروف";
            }
            reject(new Error(errorMessage));
         },
         {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
         }
      );
   });
}

// البحث عن موقع بالاسم باستخدام خدمة geocoding
Observer.prototype.searchLocationByName = function(query) {
   return new Promise((resolve, reject) => {
      // استخدام خدمة Nominatim (OpenStreetMap)
      var url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=ar`;
      
      fetch(url)
         .then(response => {
            if (!response.ok) {
               throw new Error('خطأ في الشبكة');
            }
            return response.json();
         })
         .then(data => {
            if (data.length === 0) {
               reject(new Error("لم يتم العثور على موقع بهذا الاسم"));
               return;
            }

            var location = {
               name: data[0].display_name,
               latitude: parseFloat(data[0].lat),
               longitude: parseFloat(data[0].lon),
               type: data[0].type,
               importance: data[0].importance,
               timestamp: new Date().toISOString()
            };
            resolve(location);
         })
         .catch(error => {
            reject(new Error("تعذر البحث عن الموقع: " + error.message));
         });
   });
}

// حفظ موقع جديد
Observer.prototype.saveLocation = function(location) {
   // التأكد من أن الاسم فريد
   var existingIndex = this.savedLocations.findIndex(loc => loc.name === location.name);
   if (existingIndex !== -1) {
      this.savedLocations[existingIndex] = location;
   } else {
      this.savedLocations.push(location);
   }
   this.saveToLocalStorage();
   return this.savedLocations;
}

// حذف موقع محفوظ
Observer.prototype.deleteLocation = function(locationName) {
   this.savedLocations = this.savedLocations.filter(loc => loc.name !== locationName);
   this.saveToLocalStorage();
   return this.savedLocations;
}

// تعيين الموقع الحالي إلى موقع محفوظ مع تحديث الاسم
Observer.prototype.setToSavedLocation = function(locationName) {
   var location = this.savedLocations.find(loc => loc.name === locationName);
   if (location) {
      this.setLatDegrees(location.latitude);
      this.setLonDegrees(location.longitude);
      this.currentLocationName = location.name; // تحديث اسم الموقع الحالي
      return true;
   }
   return false;
};

// الحصول على قائمة المواقع المحفوظة
Observer.prototype.getSavedLocations = function() {
   return this.savedLocations;
}

// حفظ المواقع في localStorage
Observer.prototype.saveToLocalStorage = function() {
   try {
      localStorage.setItem('astroSavedLocations', JSON.stringify(this.savedLocations));
      return true;
   } catch (error) {
      console.error('خطأ في حفظ المواقع:', error);
      return false;
   }
}

// تحميل المواقع من localStorage
Observer.prototype.loadSavedLocations = function() {
   try {
      var saved = localStorage.getItem('astroSavedLocations');
      if (saved) {
         this.savedLocations = JSON.parse(saved);
      } else {
         this.savedLocations = [];
      }
      return this.savedLocations;
   } catch (error) {
      console.error('خطأ في تحميل المواقع:', error);
      this.savedLocations = [];
      return [];
   }
}

// تصدير المواقع إلى ملف JSON
Observer.prototype.exportLocations = function() {
   var dataStr = JSON.stringify(this.savedLocations, null, 2);
   var dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
   
   var exportFileDefaultName = 'المواقع_الجغرافية_' + new Date().toISOString().split('T')[0] + '.json';
   
   var linkElement = document.createElement('a');
   linkElement.setAttribute('href', dataUri);
   linkElement.setAttribute('download', exportFileDefaultName);
   linkElement.click();
}

// استيراد المواقع من ملف JSON
Observer.prototype.importLocations = function(file) {
   return new Promise((resolve, reject) => {
      var reader = new FileReader();
      
      reader.onload = (event) => {
         try {
            var importedLocations = JSON.parse(event.target.result);
            
            if (!Array.isArray(importedLocations)) {
               reject(new Error("تنسيق الملف غير صحيح"));
               return;
            }
            
            // دمج المواقع المستوردة مع الحالية
            importedLocations.forEach(location => {
               this.saveLocation(location);
            });
            
            resolve(this.savedLocations);
         } catch (error) {
            reject(new Error("خطأ في قراءة الملف: " + error.message));
         }
      };
      
      reader.onerror = () => {
         reject(new Error("تعذر قراءة الملف"));
      };
      
      reader.readAsText(file);
   });
}

// الحصول على معلومات الموقع الحالي (للعرض)
Observer.prototype.getCurrentLocationInfo = function() {
   return {
      name: "الموقع الحالي",
      latitude: this.getLatDegrees(),
      longitude: this.getLonDegrees(),
      latitudeRad: this.latitude,
      longitudeRad: this.longitude
   };
}

// الحصول على الإحداثيات بشكل نصي مع الفاصلة العشرية
Observer.prototype.getFormattedCoords = function() {
    return {
        latitude: this.latitude.toFixed(6),
        longitude: this.longitude.toFixed(6),
        latitudeDeg: Astro.raddeg(this.latitude).toFixed(6),
        longitudeDeg: Astro.raddeg(this.longitude).toFixed(6)
    };
};

// تحديث اسم الموقع الحالي
Observer.prototype.setCurrentLocationName = function(name) {
    this.currentLocationName = name;
};

// الحصول على اسم الموقع الحالي مع البحث في المواقع المخزنة
Observer.prototype.getCurrentLocationName = function() {
   if (this.currentLocationName) {
      return this.currentLocationName;
   }
   
   // البحث عن الموقع الحالي في المواقع المخزنة
   var currentLat = this.getLatDegrees();
   var currentLon = this.getLonDegrees();
   
   var savedLocation = this.savedLocations.find(loc => 
      Math.abs(loc.latitude - currentLat) < 0.001 && 
      Math.abs(loc.longitude - currentLon) < 0.001
   );
   
   if (savedLocation) {
      this.currentLocationName = savedLocation.name;
      return savedLocation.name;
   }
   
   return "موقع غير محدد";
};



