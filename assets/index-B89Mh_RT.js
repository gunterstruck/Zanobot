const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./data-CHglu3FA.js","./vendor-idb-DQ2Q1noU.js"])))=>i.map(i=>d[i]);
var oe=Object.defineProperty;var le=(m,e,t)=>e in m?oe(m,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):m[e]=t;var l=(m,e,t)=>le(m,typeof e!="symbol"?e+"":e,t);import{l as r,g as I,s as L,a as ce,u as de,b as G,e as he,i as ue,c as me,d as j,f as fe}from"./data-CHglu3FA.js";import{H as ge}from"./vendor-qr-DORAJuxy.js";import{D as E,e as pe,a as ye}from"./dsp-CDZtT2db.js";import{a as ve,t as Se,c as K,S as we,L as be,b as Me,g as P,M as F,d as Q,e as Ee}from"./ml-DKXvlLf-.js";import"./vendor-idb-DQ2Q1noU.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function t(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(n){if(n.ep)return;n.ep=!0;const a=t(n);fetch(n.href,a)}})();(function(){const m="./config.json",e="zanobot-theme",t="neon",i=["neon","light","brand"],n="zanobot.view-level",a="basic",s=["basic","advanced","expert"];function o(){try{return localStorage.getItem(e)||t}catch(h){return console.warn("localStorage not available:",h),t}}function c(){try{const h=localStorage.getItem(n);return h&&s.includes(h)?h:a}catch(h){return console.warn("localStorage not available:",h),a}}function d(h){document.documentElement.setAttribute("data-theme",h)}function u(h){document.documentElement.setAttribute("data-view-level",h)}async function g(){try{const h=await fetch(m);if(!h.ok)throw new Error(`Failed to load config: ${h.status}`);const f=await h.json();o()==="brand"&&f.branding&&f.branding.colors&&y(f.branding.colors),window.ZANOBOT_CONFIG=f}catch(h){console.warn("Could not load config.json, using defaults:",h)}}function y(h){const f=document.documentElement;h.primary&&f.style.setProperty("--primary-color",h.primary),h.primaryHover&&f.style.setProperty("--primary-hover",h.primaryHover),h.secondary&&f.style.setProperty("--secondary-color",h.secondary),h.accent&&f.style.setProperty("--accent-color",h.accent),h.background&&f.style.setProperty("--bg-primary",h.background),h.backgroundSecondary&&f.style.setProperty("--bg-secondary",h.backgroundSecondary)}function v(){const h=o();d(h);const f=c();u(f),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",g):g(),window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",b=>{localStorage.getItem(e)||d(b.matches?"neon":"light")})}window.ZanobotTheme={setTheme:function(h){if(!i.includes(h)){console.warn("Invalid theme:",h,"- Available:",i);return}try{localStorage.setItem(e,h)}catch(f){console.warn("Could not save theme preference:",f)}d(h),h==="brand"&&window.ZANOBOT_CONFIG?.branding?.colors&&y(window.ZANOBOT_CONFIG.branding.colors),window.dispatchEvent(new CustomEvent("themechange",{detail:{theme:h}}))},getTheme:function(){return o()},toggleTheme:function(){const h=o(),S=(i.indexOf(h)+1)%i.length;return this.setTheme(i[S]),i[S]},getAvailableThemes:function(){return[...i]},getThemeDisplayName:function(h){return{neon:"Neon Industrial",light:"Daylight",brand:"Zanobo"}[h]||h},getThemeDescription:function(h){return{neon:"Cyberpunk-Style mit Neon Cyan & Orange. Perfekt für dunkle Umgebungen.",light:"Heller High-Contrast-Modus. Optimal für Sonnenlicht & Outdoor.",brand:"Original Zanobo Design. Ausgewogen & professionell."}[h]||""},applyCustomColors:function(h){y(h)},reset:function(){try{localStorage.removeItem(e)}catch(h){console.warn("Could not reset theme:",h)}d(t)}},v()})();class xe{constructor(){l(this,"container",null);l(this,"toasts",new Map);l(this,"toastCounter",0);l(this,"pendingToasts",[]);l(this,"currentPosition","top-right");this.initContainer()}initContainer(){if(typeof document>"u")return;if(!document.body){document.addEventListener("DOMContentLoaded",()=>{this.initContainer()},{once:!0});return}let e=document.getElementById("toast-container");e||(e=document.createElement("div"),e.id="toast-container",e.className="toast-container",e.setAttribute("aria-live","polite"),e.setAttribute("aria-atomic","true"),document.body.appendChild(e)),this.container=e,this.container.classList.add(`toast-container--${this.currentPosition}`),this.flushPendingToasts()}show(e){const i={...{message:"",title:"",type:"info",duration:5e3,dismissible:!0,position:"top-right"},...e},n=this.createToastId();return this.container||this.initContainer(),this.container?(this.renderToast(n,i),n):(this.pendingToasts.push({id:n,options:i}),n)}flushPendingToasts(){if(!this.container||this.pendingToasts.length===0)return;const e=[...this.pendingToasts];this.pendingToasts=[],e.forEach(({id:t,options:i})=>{this.renderToast(t,{...i})})}renderToast(e,t){if(!this.container)return;this.applyPosition(t.position);const i=this.createToastElement(e,t);this.container.appendChild(i),this.toasts.set(e,i),setTimeout(()=>i.classList.add("toast-show"),10),t.duration>0&&setTimeout(()=>this.hide(e),t.duration)}applyPosition(e){!this.container||this.currentPosition===e||(this.container.classList.remove(`toast-container--${this.currentPosition}`),this.container.classList.add(`toast-container--${e}`),this.currentPosition=e)}createToastId(){return`toast-${++this.toastCounter}`}hide(e){const t=this.toasts.get(e);t&&(t.classList.remove("toast-show"),t.classList.add("toast-hide"),setTimeout(()=>{this.container&&t.parentNode===this.container&&this.container.removeChild(t),this.toasts.delete(e)},300))}hideAll(){this.toasts.forEach((e,t)=>this.hide(t))}createToastElement(e,t){const i=document.createElement("div");i.id=e,i.className=`toast toast-${t.type}`,i.setAttribute("role",t.type==="error"?"alert":"status");const n=this.getIcon(t.type),a=t.title?`<div class="toast-title">${this.escapeHTML(t.title)}</div>`:"",s=`<div class="toast-message">${this.escapeHTML(t.message)}</div>`,o=t.dismissible?`<button class="toast-close" aria-label="Close notification" data-toast-id="${e}">×</button>`:"";if(i.innerHTML=`
      <div class="toast-icon">${n}</div>
      <div class="toast-content">
        ${a}
        ${s}
      </div>
      ${o}
    `,t.dismissible){const c=i.querySelector(".toast-close");c&&c.addEventListener("click",()=>this.hide(e))}return i}getIcon(e){const t={success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"};return t[e]||t.info}escapeHTML(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}success(e,t,i=5e3){return this.show({message:e,title:t,type:"success",duration:i})}error(e,t,i=0){return this.show({message:e,title:t,type:"error",duration:i})}warning(e,t,i=7e3){return this.show({message:e,title:t,type:"warning",duration:i})}info(e,t,i=5e3){return this.show({message:e,title:t,type:"info",duration:i})}}const Ce=new xe;class Ie{success(e,t){this.show("success",{message:e,...t}),r.info("✅ Success:",e)}error(e,t,i){let n=e;t&&t instanceof Error&&t.message&&(n=`${e}

Details: ${t.message}`),this.show("error",{message:n,...i}),t?r.error("❌ Error:",t,e):r.error("❌ Error:",e)}warning(e,t){this.show("warning",{message:e,...t}),r.warn("⚠️ Warning:",e)}info(e,t){this.show("info",{message:e,...t}),r.info("ℹ️ Info:",e)}async confirm(e,t="Bestätigung erforderlich"){return typeof window>"u"||typeof window.confirm!="function"?(r.warn("⚠️ Confirm dialog not available in non-browser context. Defaulting to false."),!1):confirm(`${t}

${e}`)}show(e,t){const n={...{message:"",duration:e==="error"?0:5e3,dismissible:!0},...t};typeof window<"u"&&this.showNativeNotification(e,n)}showNativeNotification(e,t){Ce.show({message:t.message,title:t.title,type:e,duration:t.duration,dismissible:t.dismissible})}getIcon(e){return{success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"}[e]||""}}const p=new Ie;function A(){return["iPad Simulator","iPhone Simulator","iPod Simulator","iPad","iPhone","iPod"].includes(navigator.platform)||navigator.userAgent.includes("Mac")&&"ontouchend"in document}class w{static analyzeCurrentDevice(e,t){const i={status:"good",reason:"Hardware geeignet für Maschinendiagnose",deviceLabel:e,sampleRate:t,recommendations:[]},n=e.toLowerCase(),a=this.PROBLEMATIC_KEYWORDS.find(s=>n.includes(s));return a?(i.status="warning",i.reason="Sprach-optimierte Hardware filtert Maschinengeräusche.",i.recommendations=["Verwenden Sie ein Studio-Mikrofon oder das eingebaute Geräte-Mikrofon","Headsets und Bluetooth-Geräte sind für Sprachanrufe optimiert","Maschinengeräusche könnten gefiltert oder unterdrückt werden"],r.warn(`⚠️ Problematic audio hardware detected: "${e}" (keyword: "${a}")`),i):t<this.MIN_SAMPLE_RATE?(i.status="warning",i.reason=`Sample Rate zu niedrig (${t} Hz < 44.1 kHz).`,i.recommendations=[`Aktuelle Sample Rate: ${t} Hz`,`Empfohlen: ${this.MIN_SAMPLE_RATE} Hz oder höher`,"Niedrige Sample Rates können hochfrequente Maschinensignale nicht erfassen"],r.warn(`⚠️ Low sample rate detected: ${t} Hz (recommended: ${this.MIN_SAMPLE_RATE} Hz)`),i):(r.info(`✅ Audio hardware check passed: "${e}" @ ${t} Hz`),i)}static async getAvailableDevices(){let e=null;try{e=await navigator.mediaDevices.getUserMedia({audio:!0});const i=(await navigator.mediaDevices.enumerateDevices()).filter(n=>n.kind==="audioinput").map(n=>({deviceId:n.deviceId,label:n.label||`Mikrofon ${n.deviceId.substring(0,8)}`,kind:n.kind,groupId:n.groupId}));return r.info(`Found ${i.length} audio input devices`),i}catch(t){throw r.error("Failed to enumerate audio devices:",t),new Error("Mikrofonzugriff verweigert oder nicht verfügbar")}finally{e&&(e.getTracks().forEach(t=>t.stop()),r.debug("🎤 Permission stream released in getAvailableDevices()"))}}static async getCurrentDevice(e){try{const t=e.getAudioTracks();if(t.length===0)return r.warn("No audio tracks in stream"),null;const n=t[0].getSettings().deviceId;return n?(await this.getAvailableDevices()).find(o=>o.deviceId===n)||null:(r.warn("No deviceId in track settings"),null)}catch(t){return r.error("Failed to get current device:",t),null}}static isLikelyBuiltIn(e){const t=e.toLowerCase();return["built-in","internal","integriert","eingebaut","default","array","macbook","imac"].some(n=>t.includes(n))}static async getiOSRearMicStream(){if(!A())return r.debug("📱 getiOSRearMicStream: Not iOS, skipping"),null;let e=null;try{r.info("📱 iOS detected: Attempting rear microphone via camera workaround..."),e=await navigator.mediaDevices.getUserMedia({video:{facingMode:{exact:"environment"},width:{ideal:1},height:{ideal:1}},audio:{echoCancellation:!1,autoGainControl:!1,noiseSuppression:!1}});const t=e.getAudioTracks();if(t.length===0)return r.warn("📱 iOS rear mic workaround: No audio tracks received"),null;e.getVideoTracks().forEach(n=>{r.debug(`📱 Stopping video track: ${n.label}`),n.stop()});const i=new MediaStream(t);return r.info(`✅ iOS rear mic workaround successful: "${t[0].label}" (via back camera)`),e=null,i}catch(t){const i=t instanceof Error?t.message:String(t),n=t instanceof Error?t.name:"Unknown";return n==="NotAllowedError"?r.info("📱 iOS rear mic: Camera permission denied, falling back to default mic"):n==="OverconstrainedError"?r.info("📱 iOS rear mic: No back camera available, falling back to default mic"):r.warn(`📱 iOS rear mic workaround failed: ${n} - ${i}`),null}finally{e&&(e.getTracks().forEach(t=>t.stop()),r.debug("📱 iOS rear mic stream released in finally block"))}}static async findBestMicrophone(){try{if(A()){r.info("📱 findBestMicrophone: iOS detected, attempting rear mic workaround...");const n=await this.getiOSRearMicStream();if(n){const a=n.getAudioTracks()[0]?.label||"iPhone Rückseiten-Mikrofon";return n.getTracks().forEach(s=>s.stop()),r.info(`✅ iOS: Rear microphone available: "${a}"`),{deviceId:this.IOS_REAR_MIC_DEVICE_ID,label:`${a} (optimiert für Diagnose)`}}r.info("📱 iOS: Rear mic not available, using default microphone");return}const t=(await navigator.mediaDevices.enumerateDevices()).filter(n=>n.kind==="audioinput");if(!t.some(n=>n.label&&n.label.length>0)){r.warn("🎤 findBestMicrophone: No device labels available (permission may be required)");return}r.info(`🎤 findBestMicrophone: Scanning ${t.length} audio inputs...`);for(const n of this.PREFERRED_MIC_KEYWORDS)for(const a of t)if(a.label.toLowerCase().includes(n))return r.info(`✅ findBestMicrophone: Found preferred mic "${a.label}" (keyword: "${n}")`),{deviceId:a.deviceId,label:a.label};r.info("🎤 findBestMicrophone: No preferred mic found, using system default");return}catch(e){r.error("❌ findBestMicrophone: Failed to enumerate devices:",e);return}}}l(w,"PROBLEMATIC_KEYWORDS",["jabra","plantronics","sennheiser","hands-free","handsfree","headset","airpods","bluetooth","bt audio","wireless"]),l(w,"MIN_SAMPLE_RATE",44100),l(w,"PREFERRED_MIC_KEYWORDS",["back","rück","rear","environment","camcorder","video","camera"]),l(w,"IOS_REAR_MIC_DEVICE_ID","__ios_rear_mic__");const T={audio:{echoCancellation:!1,autoGainControl:!1,noiseSuppression:!1,channelCount:1,sampleRate:48e3}};function q(m){return{audio:{echoCancellation:!1,autoGainControl:!1,noiseSuppression:!1,channelCount:T.audio.channelCount,sampleRate:T.audio.sampleRate,...m&&{deviceId:{exact:m}}}}}const ke={audio:{echoCancellation:!1,autoGainControl:!1,noiseSuppression:!1,channelCount:1,sampleRate:48e3}},Re={warmUpDuration:5e3,signalThreshold:A()?.002:.01,maxWaitTime:3e4,adaptiveTrigger:!0,adaptiveLearningPeriod:2e3};async function C(m){try{if(m===w.IOS_REAR_MIC_DEVICE_ID){r.info("📱 getRawAudioStream: iOS rear mic workaround requested");const t=await w.getiOSRearMicStream();if(t)return r.info("✅ iOS rear mic stream obtained successfully"),t;r.warn("📱 iOS rear mic workaround failed, falling back to default microphone");const i=q(void 0);return await navigator.mediaDevices.getUserMedia(i)}const e=q(m);return await navigator.mediaDevices.getUserMedia(e)}catch(e){r.warn("⚠️ Exact constraints failed, using fallback:",e);try{const t={audio:{...ke.audio}};return await navigator.mediaDevices.getUserMedia(t)}catch(t){throw r.error("❌ Failed to get audio stream:",t),new Error("Failed to access microphone. Please grant permission and ensure no other app is using it.")}}}function Y(m){switch(m.phase){case"idle":return"Bereit";case"warmup":return`Akustische Stabilisierung... ${m.remainingWarmUp?Math.ceil(m.remainingWarmUp/1e3):0}s`;case"waiting":return"Warte auf Signal...";case"recording":return"Aufnahme läuft";default:return"Bereit"}}class Ae{constructor(e){l(this,"onMachineSelected");l(this,"html5QrCode",null);l(this,"scannerModal",null);l(this,"isScanning",!1);l(this,"currentAudioStream",null);l(this,"selectedDeviceId");l(this,"audioQualityReport",null);this.onMachineSelected=e}init(){const e=document.getElementById("scan-btn");e&&e.addEventListener("click",()=>this.handleScan());const t=document.getElementById("create-machine-btn");t&&t.addEventListener("click",()=>this.handleCreateMachine()),this.scannerModal=document.getElementById("scanner-modal");const i=document.getElementById("close-scanner-modal"),n=document.getElementById("manual-input-btn"),a=document.getElementById("manual-input-confirm"),s=document.getElementById("manual-input-cancel"),o=document.getElementById("close-manual-input-modal"),c=document.getElementById("manual-input-modal");i&&i.addEventListener("click",()=>this.closeScanner()),n&&n.addEventListener("click",()=>this.handleManualInput()),a&&a.addEventListener("click",()=>this.submitManualInput()),s&&s.addEventListener("click",()=>this.closeManualInputModal()),o&&o.addEventListener("click",()=>this.closeManualInputModal()),c&&c.addEventListener("click",u=>{u.target===c&&this.closeManualInputModal()}),this.scannerModal&&this.scannerModal.addEventListener("click",u=>{u.target===this.scannerModal&&this.closeScanner()});const d=document.getElementById("change-microphone-btn");d&&d.addEventListener("click",()=>this.showMicrophoneSelection()),this.initializeHardwareCheck(),this.loadMachineHistory()}async handleScan(){try{this.openScannerModal(),await this.startScanner()}catch(e){r.error("Scan error:",e),this.showScannerError("Fehler beim Starten des Scanners")}}openScannerModal(){if(this.scannerModal){this.scannerModal.style.display="flex";const e=document.getElementById("scanner-error"),t=document.getElementById("scanner-success"),i=document.getElementById("scanner-container");e&&(e.style.display="none"),t&&(t.style.display="none"),i&&(i.style.display="block")}}async startScanner(){if(!this.isScanning)try{this.isScanning=!0,this.html5QrCode=new ge("qr-reader");const e={fps:10,qrbox:{width:250,height:250},formatsToSupport:[0,8,13,14]};await this.html5QrCode.start({facingMode:"environment"},e,this.onScanSuccess.bind(this),this.onScanFailure.bind(this))}catch(e){r.error("Failed to start scanner:",e),this.isScanning=!1,this.html5QrCode=null;const t=e instanceof Error,i=t?e.name:"",n=t?e.message:String(e);i==="NotAllowedError"||n.includes("Permission")?this.showScannerError("Kamerazugriff wurde verweigert","Bitte erlauben Sie den Kamerazugriff in Ihren Browser-Einstellungen"):i==="NotFoundError"?this.showScannerError("Keine Kamera gefunden","Bitte stellen Sie sicher, dass Ihr Gerät eine Kamera hat"):this.showScannerError("Scanner konnte nicht gestartet werden","Bitte versuchen Sie die manuelle Eingabe")}}async onScanSuccess(e,t){r.info("Code detected:",e),await this.stopScanner(),this.playSuccessBeep(),this.showScannerSuccess(e),setTimeout(async()=>{try{await this.processScannedCode(e)}catch(i){r.error("Failed to process scanned code:",i),p.error("Fehler beim Verarbeiten des QR-Codes",i,{title:"Scanfehler",duration:0})}finally{this.closeScanner()}},800)}onScanFailure(e){e.includes("No MultiFormat Readers")||r.debug("Scan attempt:",e)}async processScannedCode(e){try{const t=e.trim(),i=this.validateMachineId(t);if(!i.valid){this.showError(i.error||"Ungültiger Code gescannt");return}await this.handleMachineId(t)}catch(t){r.error("Error processing scanned code:",t),this.showError("Fehler beim Verarbeiten des Codes")}}async stopScanner(){if(this.html5QrCode&&this.isScanning)try{await this.html5QrCode.stop(),this.html5QrCode.clear()}catch(e){r.error("Error stopping scanner:",e)}finally{this.isScanning=!1}}async closeScanner(){await this.stopScanner(),this.scannerModal&&(this.scannerModal.style.display="none")}showScannerError(e,t){const i=document.getElementById("scanner-error"),n=document.getElementById("scanner-success"),a=document.getElementById("scanner-container"),s=document.getElementById("scanner-error-message"),o=document.querySelector(".scanner-error-hint");i&&(i.style.display="flex"),n&&(n.style.display="none"),a&&(a.style.display="none"),s&&(s.textContent=e),o&&(o.textContent=t||"")}showScannerSuccess(e){const t=document.getElementById("scanner-error"),i=document.getElementById("scanner-success"),n=document.getElementById("scanner-container"),a=document.getElementById("scanner-success-message");t&&(t.style.display="none"),i&&(i.style.display="flex"),n&&(n.style.display="none"),a&&(a.textContent=`Code erkannt: ${e}`)}playSuccessBeep(){try{const e=window.AudioContext||window.webkitAudioContext;if(!e){r.warn("AudioContext not supported in this browser");return}const t=new e,i=t.createOscillator(),n=t.createGain();i.connect(n),n.connect(t.destination),i.frequency.value=800,i.type="sine",n.gain.setValueAtTime(.3,t.currentTime),n.gain.exponentialRampToValueAtTime(.01,t.currentTime+.2),i.start(t.currentTime),i.stop(t.currentTime+.2),setTimeout(()=>{if(t&&t.state!=="closed")try{t.close()}catch(a){r.warn("⚠️ Error closing AudioContext:",a)}},250)}catch(e){r.warn("Could not play beep sound:",e)}}async handleManualInput(){await this.closeScanner(),this.openManualInputModal()}async submitManualInput(){const e=document.getElementById("manual-machine-id-input");if(!e){this.showError("Manuelle Eingabe konnte nicht geladen werden");return}const t=e.value.trim(),i=this.validateMachineId(t);if(!i.valid){this.showError(i.error||"Ungültige Maschinen-ID");return}this.closeManualInputModal(),await this.handleMachineId(t)}openManualInputModal(){const e=document.getElementById("manual-input-modal"),t=document.getElementById("manual-machine-id-input");e&&(e.style.display="flex"),t&&(t.value="",t.focus())}closeManualInputModal(){const e=document.getElementById("manual-input-modal");e&&(e.style.display="none")}async handleMachineId(e){try{const t=await I(e);if(t){p.success(`Maschine "${t.name}" geladen`),this.onMachineSelected(t);return}const i=`Maschine ${e}`,n={id:e,name:i,createdAt:Date.now(),referenceModels:[]};await L(n),p.success(`Neue Maschine "${i}" automatisch angelegt.`),this.onMachineSelected(n)}catch(t){r.error("Error handling machine ID:",t),p.error("Fehler beim Laden der Maschine",t)}}async handleCreateMachine(){try{const e=document.getElementById("machine-name-input"),t=document.getElementById("machine-id-input");if(!e||!t)throw new Error("Input elements not found");const i=e.value.trim(),n=t.value.trim();if(!i){this.showError("Bitte geben Sie einen Maschinennamen ein");return}if(!/\S/.test(i)){this.showError("Maschinenname darf nicht nur aus Leerzeichen bestehen");return}if(i.length>100){this.showError("Maschinenname ist zu lang (maximal 100 Zeichen)");return}let a;if(n){const c=this.validateMachineId(n);if(!c.valid){this.showError(c.error||"Ungültige Maschinen-ID");return}a=n}else a=this.generateMachineId();if(await I(a)){this.showError("Eine Maschine mit dieser ID existiert bereits");return}const o={id:a,name:i,createdAt:Date.now(),referenceModels:[]};await L(o),r.debug("✅ Machine Created:",{id:o.id,name:o.name,createdAt:new Date(o.createdAt).toLocaleString()}),r.debug("📞 Calling onMachineSelected() with new machine..."),e.value="",t.value="",this.showNotification(`Maschine erstellt: ${i}`),this.onMachineSelected(o)}catch(e){r.error("Create machine error:",e),this.showError("Fehler beim Erstellen der Maschine")}}generateMachineId(){const e=Date.now().toString(36),t=Math.random().toString(36).substring(2,7);return`${e}-${t}`.toUpperCase()}validateMachineId(e){const t=e.trim();return t?t.length<1?{valid:!1,error:"Maschinen-ID ist zu kurz"}:t.length>100?{valid:!1,error:"Maschinen-ID ist zu lang (maximal 100 Zeichen)"}:/\S/.test(t)?{valid:!0}:{valid:!1,error:"Maschinen-ID darf nicht nur aus Leerzeichen bestehen"}:{valid:!1,error:"Maschinen-ID darf nicht leer sein"}}showNotification(e){p.success(e)}showError(e){p.error(e)}async initializeHardwareCheck(){let e=null;try{e=await C(this.selectedDeviceId);const t=await w.findBestMicrophone();t&&t.deviceId!==this.selectedDeviceId&&(r.info(`🎤 Smart Auto-Selection: Switching to "${t.label}"`),e.getTracks().forEach(n=>n.stop()),e=null,this.selectedDeviceId=t.deviceId,e=await C(this.selectedDeviceId),p.success(`Mikrofon automatisch auf "${t.label}" optimiert für beste Diagnose`));const i=await w.getCurrentDevice(e);if(i){const n=e.getAudioTracks();if(n.length===0){r.warn("No audio tracks found on device");return}const o=n[0].getSettings().sampleRate||44100;this.audioQualityReport=w.analyzeCurrentDevice(i.label,o),this.updateHardwareInfoCard()}}catch(t){r.error("Failed to initialize hardware check:",t)}finally{e&&(e.getTracks().forEach(t=>t.stop()),e=null)}}updateHardwareInfoCard(){if(!this.audioQualityReport)return;const e=document.getElementById("hardware-status-icon"),t=document.getElementById("hardware-device-label"),i=document.getElementById("hardware-status-text");!e||!t||!i||(t.textContent=this.audioQualityReport.deviceLabel,this.audioQualityReport.status==="good"?(e.innerHTML=`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--status-healthy)" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      `,i.textContent=this.audioQualityReport.reason,i.style.color="var(--status-healthy)"):(e.innerHTML=`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--status-warning)" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `,i.textContent=this.audioQualityReport.reason,i.style.color="var(--status-warning)"))}async showMicrophoneSelection(){try{const e=await w.getAvailableDevices(),t=document.getElementById("microphone-selection-modal");if(!t){r.error("Microphone selection modal not found in DOM");return}const i=document.getElementById("microphone-device-list");if(!i){r.error("Device list container not found");return}i.innerHTML="",e.forEach(a=>{const s=document.createElement("div");s.className="microphone-device-item",s.dataset.deviceId=a.deviceId;const o=this.selectedDeviceId===a.deviceId||!this.selectedDeviceId&&a.deviceId==="default";o&&s.classList.add("selected");const c=T.audio.sampleRate,d=w.analyzeCurrentDevice(a.label,c),u=d.status==="good"?"status-good":"status-warning",g=document.createElement("div");g.className="device-info";const y=document.createElement("div");y.className=`device-icon ${u}`,d.status==="good"?y.innerHTML=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>`:y.innerHTML=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>`;const v=document.createElement("div");v.className="device-details";const h=document.createElement("div");h.className="device-name",h.textContent=a.label;const f=document.createElement("div");if(f.className="device-status",f.textContent=d.reason,v.appendChild(h),v.appendChild(f),g.appendChild(y),g.appendChild(v),s.appendChild(g),o){const S=document.createElement("div");S.className="device-checkmark",S.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',s.appendChild(S)}s.addEventListener("click",()=>this.selectMicrophone(a)),i.appendChild(s)}),t.style.display="flex";const n=document.getElementById("close-microphone-modal");n&&(n.onclick=()=>this.closeMicrophoneModal()),t.onclick=a=>{a.target===t&&this.closeMicrophoneModal()}}catch(e){r.error("Failed to show microphone selection:",e),this.showError("Fehler beim Laden der Mikrofone")}}async selectMicrophone(e){try{r.info(`Selecting microphone: ${e.label}`),this.currentAudioStream&&this.currentAudioStream.getTracks().forEach(s=>s.stop()),this.selectedDeviceId=e.deviceId,this.currentAudioStream=await C(e.deviceId);const t=this.currentAudioStream.getAudioTracks();if(t.length===0)throw new Error("No audio tracks available on selected device");const a=t[0].getSettings().sampleRate||44100;this.audioQualityReport=w.analyzeCurrentDevice(e.label,a),this.updateHardwareInfoCard(),this.closeMicrophoneModal(),p.success(`Mikrofon gewechselt: ${e.label}`)}catch(t){r.error("Failed to select microphone:",t),this.showError("Fehler beim Wechseln des Mikrofons")}}closeMicrophoneModal(){const e=document.getElementById("microphone-selection-modal");e&&(e.style.display="none")}getSelectedDeviceId(){return this.selectedDeviceId}async loadMachineHistory(){try{const t=(await ce()).filter(i=>i.referenceModels&&i.referenceModels.length>0);t.sort((i,n)=>{const a=i.referenceModels.length>0?Math.max(...i.referenceModels.map(o=>o.trainingDate||0)):0;return(n.referenceModels.length>0?Math.max(...n.referenceModels.map(o=>o.trainingDate||0)):0)-a}),this.renderQuickSelectList(t.slice(0,10))}catch(e){r.error("Failed to load machine history:",e),this.hideQuickSelectSection()}}renderQuickSelectList(e){const t=document.getElementById("quick-select-section"),i=document.getElementById("quick-select-list");if(!t||!i){r.warn("Quick select elements not found in DOM");return}if(e.length===0){t.style.display="none";return}t.style.display="block",i.innerHTML="",e.forEach(n=>{const a=document.createElement("div");a.className="quick-select-item",a.dataset.machineId=n.id;const s=document.createElement("div");s.className="quick-select-item-info";const o=document.createElement("div");o.className="quick-select-machine-name",o.textContent=n.name;const c=document.createElement("div");c.className="quick-select-machine-id",c.textContent=n.id,s.appendChild(o),s.appendChild(c);const d=document.createElementNS("http://www.w3.org/2000/svg","svg");d.setAttribute("width","20"),d.setAttribute("height","20"),d.setAttribute("viewBox","0 0 24 24"),d.setAttribute("fill","none"),d.setAttribute("stroke","currentColor"),d.setAttribute("stroke-width","2"),d.style.color="var(--text-muted)",d.style.flexShrink="0";const u=document.createElementNS("http://www.w3.org/2000/svg","polyline");u.setAttribute("points","9 18 15 12 9 6"),d.appendChild(u),a.appendChild(s),a.appendChild(d),a.addEventListener("click",()=>this.handleQuickSelect(n)),i.appendChild(a)})}async handleQuickSelect(e){try{r.info(`Quick select: ${e.name} (${e.id})`),r.debug("🎯 Quick-Select Clicked:",{id:e.id,name:e.name,numModels:e.referenceModels?.length||0}),r.debug("📞 Calling onMachineSelected() with quick-selected machine..."),this.showNotification(`Maschine geladen: ${e.name}`),this.onMachineSelected(e)}catch(t){r.error("Failed to quick select machine:",t),this.showError("Fehler beim Laden der Maschine")}}hideQuickSelectSection(){const e=document.getElementById("quick-select-section");e&&(e.style.display="none")}cleanup(){this.currentAudioStream&&(this.currentAudioStream.getTracks().forEach(e=>e.stop()),this.currentAudioStream=null)}}const Be="modulepreload",De=function(m,e){return new URL(m,e).href},O={},U=function(e,t,i){let n=Promise.resolve();if(t&&t.length>0){let s=function(u){return Promise.all(u.map(g=>Promise.resolve(g).then(y=>({status:"fulfilled",value:y}),y=>({status:"rejected",reason:y}))))};const o=document.getElementsByTagName("link"),c=document.querySelector("meta[property=csp-nonce]"),d=c?.nonce||c?.getAttribute("nonce");n=s(t.map(u=>{if(u=De(u,i),u in O)return;O[u]=!0;const g=u.endsWith(".css"),y=g?'[rel="stylesheet"]':"";if(!!i)for(let f=o.length-1;f>=0;f--){const S=o[f];if(S.href===u&&(!g||S.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${u}"]${y}`))return;const h=document.createElement("link");if(h.rel=g?"stylesheet":Be,g||(h.as="script"),h.crossOrigin="",h.href=u,d&&h.setAttribute("nonce",d),document.head.appendChild(h),g)return new Promise((f,S)=>{h.addEventListener("load",f),h.addEventListener("error",()=>S(new Error(`Unable to preload CSS for ${u}`)))})}))}function a(s){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=s,window.dispatchEvent(o),!o.defaultPrevented)throw s}return n.then(s=>{for(const o of s||[])o.status==="rejected"&&a(o.reason);return e().catch(a)})},z="zanobot:visualizer-settings-change",Z="zanobot.visualizer.settings",H={frequencyScale:"linear",amplitudeScale:"linear"},J=()=>{try{const m=localStorage.getItem(Z);if(!m)return{...H};const e=JSON.parse(m);return{frequencyScale:e.frequencyScale==="log"?"log":"linear",amplitudeScale:e.amplitudeScale==="log"?"log":"linear"}}catch{return{...H}}},X=()=>J(),W=m=>{const e=J(),t={frequencyScale:m.frequencyScale??e.frequencyScale,amplitudeScale:m.amplitudeScale??e.amplitudeScale};try{localStorage.setItem(Z,JSON.stringify(t))}catch{}return window.dispatchEvent(new CustomEvent(z,{detail:t})),t};class ee{constructor(e){l(this,"canvas");l(this,"ctx");l(this,"analyser",null);l(this,"animationFrame",null);l(this,"dataArray",null);l(this,"visualizerSettings");l(this,"settingsListener",null);l(this,"source",null);l(this,"gainNode",null);l(this,"fftSize",2048);l(this,"smoothing",.75);l(this,"barCount",128);l(this,"sampleRate",48e3);const t=document.getElementById(e);if(!t)throw new Error(`Canvas element not found: ${e}`);this.canvas=t;const i=t.getContext("2d");if(!i)throw new Error("Could not get 2D context");this.ctx=i,this.setCanvasSize(),this.visualizerSettings=X(),this.settingsListener=n=>{const a=n.detail;a&&(this.visualizerSettings=a)},window.addEventListener(z,this.settingsListener)}setCanvasSize(){const e=window.devicePixelRatio||1,t=this.canvas.getBoundingClientRect();this.canvas.width=t.width*e,this.canvas.height=t.height*e,this.ctx.setTransform(1,0,0,1,0,0),this.ctx.scale(e,e)}start(e,t){this.stop(),this.sampleRate=e.sampleRate,this.analyser=e.createAnalyser(),this.analyser.fftSize=this.fftSize,this.analyser.smoothingTimeConstant=this.smoothing,this.analyser.minDecibels=-90,this.analyser.maxDecibels=-10,this.gainNode=e.createGain(),this.gainNode.gain.value=A()?3:1,this.source=e.createMediaStreamSource(t),this.source.connect(this.gainNode),this.gainNode.connect(this.analyser);const i=this.analyser.frequencyBinCount;this.dataArray=new Uint8Array(i),r.debug(`📊 FFT Visualizer started: ${this.fftSize} samples, ${i} bins, sampleRate=${this.sampleRate}Hz`),this.render()}stop(){this.animationFrame&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=null),this.source&&(this.source.disconnect(),this.source=null),this.gainNode&&(this.gainNode.disconnect(),this.gainNode=null),this.analyser=null,this.dataArray=null;const e=this.canvas.width/(window.devicePixelRatio||1),t=this.canvas.height/(window.devicePixelRatio||1);this.ctx.clearRect(0,0,e,t)}render(){if(!this.analyser||!this.dataArray)return;const e=this.canvas.width/(window.devicePixelRatio||1),t=this.canvas.height/(window.devicePixelRatio||1);this.analyser.getByteFrequencyData(this.dataArray);const i=getComputedStyle(document.documentElement).getPropertyValue("--viz-bg").trim();this.ctx.fillStyle=i||"#0a0a0a",this.ctx.fillRect(0,0,e,t),this.drawGrid(e,t),this.drawSpectrum(e,t),this.drawFrequencyLabels(e,t),this.animationFrame=requestAnimationFrame(()=>this.render())}drawGrid(e,t){const i=getComputedStyle(document.documentElement).getPropertyValue("--viz-grid").trim();this.ctx.strokeStyle=i||"rgba(255, 255, 255, 0.05)",this.ctx.lineWidth=1;for(let a=0;a<=4;a++){const s=t/4*a;this.ctx.beginPath(),this.ctx.moveTo(0,s),this.ctx.lineTo(e,s),this.ctx.stroke()}[0,.25,.5,.75,1].forEach(a=>{const s=e*a;this.ctx.beginPath(),this.ctx.moveTo(s,0),this.ctx.lineTo(s,t),this.ctx.stroke()})}drawSpectrum(e,t){if(!this.dataArray)return;const i=e/this.barCount;for(let n=0;n<this.barCount;n++){const a=this.getNormalizedValueForBar(n),s=a*t,o=this.getIntensityColor(a),c=n*i,d=t-s;this.ctx.fillStyle=o,this.ctx.fillRect(c,d,i-1,s),a>.7&&(this.ctx.shadowBlur=10,this.ctx.shadowColor=o,this.ctx.fillRect(c,d,i-1,s),this.ctx.shadowBlur=0)}this.drawFilledSpectrum(e,t)}drawFilledSpectrum(e,t){if(!this.dataArray)return;const i=[],n=e/this.barCount;for(let a=0;a<this.barCount;a++){const o=this.getNormalizedValueForBar(a)*t;i.push({x:a*n+n/2,y:t-o})}if(i.length>1){this.ctx.beginPath(),this.ctx.moveTo(0,t),this.ctx.lineTo(i[0].x,i[0].y);for(let g=0;g<i.length-1;g++){const y=(i[g].x+i[g+1].x)/2,v=(i[g].y+i[g+1].y)/2;this.ctx.quadraticCurveTo(i[g].x,i[g].y,y,v)}const a=i[i.length-1];this.ctx.lineTo(a.x,a.y),this.ctx.lineTo(e,t),this.ctx.closePath();const s=getComputedStyle(document.documentElement),o=s.getPropertyValue("--viz-fill-top").trim(),c=s.getPropertyValue("--viz-fill-bottom").trim(),d=s.getPropertyValue("--viz-primary").trim(),u=this.ctx.createLinearGradient(0,0,0,t);u.addColorStop(0,o||"rgba(59, 130, 246, 0.3)"),u.addColorStop(1,c||"rgba(59, 130, 246, 0.05)"),this.ctx.fillStyle=u,this.ctx.fill(),this.ctx.strokeStyle=d||"rgba(59, 130, 246, 0.8)",this.ctx.lineWidth=2,this.ctx.stroke()}}getIntensityColor(e){const t=getComputedStyle(document.documentElement),i=t.getPropertyValue("--primary-color").trim(),n=t.getPropertyValue("--accent-color").trim();if(e<.5){const a=this.hexToRgb(i)||{r:0,g:243,b:255};return`rgba(${a.r}, ${a.g}, ${a.b}, ${.3+e})`}else{const a=this.hexToRgb(n)||{r:255,g:136,b:0};return`rgba(${a.r}, ${a.g}, ${a.b}, ${.6+e*.4})`}}hexToRgb(e){return e=e.replace("#",""),e.length===6?{r:parseInt(e.substring(0,2),16),g:parseInt(e.substring(2,4),16),b:parseInt(e.substring(4,6),16)}:null}drawFrequencyLabels(e,t){const i=this.sampleRate/2,n=this.visualizerSettings.frequencyScale==="log",a=u=>u===0?"0":u>=1e3?`${Math.round(u/1e3)}k`:u.toString(),s=n?[{pos:0,freq:0},{freq:20},{freq:50},{freq:100},{freq:500},{freq:1e3},{freq:5e3},{freq:1e4},{freq:i}].map(u=>{if(u.freq===0)return{pos:0,freq:0};const g=Math.min(20,i),y=Math.log10(g),v=Math.log10(i),h=Math.min(Math.max(u.freq,g),i);return{pos:(Math.log10(h)-y)/(v-y),freq:h}}):[{pos:0,freq:0},{pos:.25,freq:i*.25},{pos:.5,freq:i*.5},{pos:.75,freq:i*.75},{pos:1,freq:i}],o=getComputedStyle(document.documentElement).getPropertyValue("--viz-text").trim(),c=getComputedStyle(document.documentElement).getPropertyValue("--font-primary").trim()||"system-ui, sans-serif";this.ctx.font=`10px ${c}`,this.ctx.fillStyle=o||"rgba(255, 255, 255, 0.4)",this.ctx.textAlign="center",s.forEach(u=>{const g=e*u.pos,y=t-5;this.ctx.fillText(a(u.freq)+" Hz",g,y)}),this.ctx.textAlign="left";const d=this.visualizerSettings.amplitudeScale==="log"?"Amplitude (dB, log)":"Amplitude (dB)";this.ctx.fillText(d,5,15)}drawWaveform(e){const t=this.canvas.width/(window.devicePixelRatio||1),i=this.canvas.height/(window.devicePixelRatio||1),n=getComputedStyle(document.documentElement).getPropertyValue("--viz-bg").trim();if(this.ctx.fillStyle=n||"#0a0a0a",this.ctx.fillRect(0,0,t,i),t<=0)return;const a=e.getChannelData(0),s=Math.ceil(a.length/t),o=getComputedStyle(document.documentElement).getPropertyValue("--viz-primary").trim();this.ctx.strokeStyle=o||"#3b82f6",this.ctx.lineWidth=2,this.ctx.beginPath();for(let d=0;d<t;d++){const u=d*s,g=a[u],y=d,v=(1+g)*i/2;d===0?this.ctx.moveTo(y,v):this.ctx.lineTo(y,v)}this.ctx.stroke();const c=getComputedStyle(document.documentElement).getPropertyValue("--viz-grid").trim();this.ctx.strokeStyle=c||"#333333",this.ctx.lineWidth=1,this.ctx.beginPath(),this.ctx.moveTo(0,i/2),this.ctx.lineTo(t,i/2),this.ctx.stroke()}destroy(){this.stop(),this.settingsListener&&window.removeEventListener(z,this.settingsListener)}getNormalizedValueForBar(e){if(!this.dataArray)return 0;const{start:t,end:i}=this.getFrequencyBinRange(e);let n=0,a=0;for(let c=t;c<i;c++)c>=0&&c<this.dataArray.length&&(n+=this.dataArray[c],a++);let o=(a>0?n/a:0)/255;return this.visualizerSettings.amplitudeScale==="log"&&(o=Math.log10(1+o*9)),o}getFrequencyBinRange(e){if(!this.dataArray)return{start:0,end:0};const t=this.dataArray.length,i=t-1;if(this.visualizerSettings.frequencyScale!=="log"||this.sampleRate<=0){const h=Math.max(1,Math.floor(t/this.barCount)),f=Math.min(e*h,t-1),S=Math.min(f+h,t);return{start:f,end:S}}const n=this.sampleRate/2,a=Math.min(20,n);if(n<=a){const h=Math.max(1,Math.floor(t/this.barCount)),f=Math.min(e*h,t-1),S=Math.min(f+h,t);return{start:f,end:S}}const s=Math.log10(a),o=Math.log10(n),c=e/this.barCount,d=(e+1)/this.barCount,u=e===0?0:Math.pow(10,s+(o-s)*c),g=Math.pow(10,s+(o-s)*d),y=Math.floor(u/n*i),v=Math.min(i+1,Math.max(y+1,Math.ceil(g/n*i)));return{start:y,end:v}}}class ${constructor(e){l(this,"audioContext",null);l(this,"workletNode",null);l(this,"sourceNode",null);l(this,"config");l(this,"ringBuffer");l(this,"currentWritePos",0);this.config=e,this.ringBuffer=new Float32Array(e.bufferSize)}async init(e,t){this.audioContext=e;try{const i=new URL("audio-processor.worklet.js",window.location.href);r.info(`Loading AudioWorklet from: ${i.href}`),await e.audioWorklet.addModule(i.href),this.workletNode=new AudioWorkletNode(e,"zanobot-audio-processor"),this.workletNode.port.onmessage=n=>{this.handleWorkletMessage(n.data)},this.sourceNode=e.createMediaStreamSource(t),this.sourceNode.connect(this.workletNode),this.workletNode.port.postMessage({type:"init",sampleRate:e.sampleRate,warmUpDuration:this.config.warmUpDuration||5e3}),r.info("✅ AudioWorklet initialized")}catch(i){throw r.error("❌ AudioWorklet initialization failed:",i),new Error("Failed to initialize AudioWorklet. Browser may not support it.")}}handleWorkletMessage(e){switch(e.type){case"init-complete":r.info(`✅ Worklet initialized: sampleRate=${e.sampleRate}Hz, chunkSize=${e.chunkSize} samples, bufferSize=${e.bufferSize} samples`),e.bufferSize&&e.bufferSize>this.ringBuffer.length&&(r.info(`📊 Resizing local ring buffer from ${this.ringBuffer.length} to ${e.bufferSize} samples`),this.ringBuffer=new Float32Array(e.bufferSize),this.currentWritePos=0);break;case"audio-data-ready":this.currentWritePos=e.writePos,this.config.onAudioData&&this.config.onAudioData(e.writePos);break;case"audio-chunk":if(e.chunk){const t=new Float32Array(e.chunk);e.writePos,this.fillRingBuffer(t),this.config.onAudioChunk&&this.config.onAudioChunk(t)}break;case"smart-start-state":this.config.onSmartStartStateChange&&this.config.onSmartStartStateChange({phase:e.phase,remainingWarmUp:e.remainingWarmUp});break;case"smart-start-complete":this.config.onSmartStartComplete&&this.config.onSmartStartComplete(e.rms);break;case"smart-start-timeout":this.config.onSmartStartTimeout&&this.config.onSmartStartTimeout();break;case"debug-rms":r.debug(`🎙️ Signal RMS: ${e.rms.toFixed(4)} (threshold: ${e.threshold.toFixed(4)})`);break}}fillRingBuffer(e){for(let t=0;t<e.length;t++)this.ringBuffer[this.currentWritePos]=e[t],this.currentWritePos=(this.currentWritePos+1)%this.ringBuffer.length}startSmartStart(){if(!this.workletNode){r.error("AudioWorklet not initialized");return}this.workletNode.port.postMessage({type:"start-smart-start"})}skipToRecording(){if(!this.workletNode){r.error("AudioWorklet not initialized");return}this.workletNode.port.postMessage({type:"skip-to-recording"})}stop(){this.workletNode&&this.workletNode.port.postMessage({type:"stop"})}resetBuffer(){this.workletNode&&(this.ringBuffer.fill(0),this.currentWritePos=0,this.workletNode.port.postMessage({type:"reset-buffer"}))}readLatestChunk(e){const t=new Float32Array(e);let i=this.currentWritePos-e;i<0&&(i+=this.ringBuffer.length);for(let n=0;n<e;n++)t[n]=this.ringBuffer[i],i=(i+1)%this.ringBuffer.length;return t}cleanup(){this.workletNode&&(this.workletNode.port.onmessage=null,this.workletNode.disconnect(),this.workletNode=null),this.sourceNode&&(this.sourceNode.disconnect(),this.sourceNode=null),this.audioContext=null,this.ringBuffer.fill(0),this.currentWritePos=0}static isSupported(){const e=typeof AudioContext<"u"?AudioContext:typeof globalThis.webkitAudioContext<"u"?globalThis.webkitAudioContext:void 0;return e?"audioWorklet"in e.prototype:!1}}function te(){return $.isSupported()}const ie={STOP_REFERENCE:"Stop",STOP_DIAGNOSE:"Stop & Save"},Le={RECORDING_DIAGNOSE:"Live Diagnosis - Find Sweet Spot"};class Te{constructor(e,t){l(this,"machine");l(this,"selectedDeviceId");l(this,"onMachineUpdated",null);l(this,"audioContext",null);l(this,"mediaStream",null);l(this,"cameraStream",null);l(this,"mediaRecorder",null);l(this,"audioChunks",[]);l(this,"visualizer",null);l(this,"recordingDuration",15);l(this,"warmUpDuration",5);l(this,"audioWorkletManager",null);l(this,"isRecordingActive",!1);l(this,"recordedBlob",null);l(this,"useAudioWorklet",!0);l(this,"recordingStartTime",0);l(this,"timerInterval",null);l(this,"isRecordingStarting",!1);l(this,"autoStopTimer",null);l(this,"smartStartWasUsed",!1);l(this,"currentAudioBuffer",null);l(this,"currentFeatures",[]);l(this,"currentQualityResult",null);l(this,"currentTrainingData",null);l(this,"recordButtonClickHandler",null);l(this,"capturedReferenceImage",null);l(this,"reviewImageUrl",null);this.machine=e,this.selectedDeviceId=t,r.debug("📝 ReferencePhase Constructor:",{machineId:e.id,machineName:e.name,numExistingModels:e.referenceModels?.length||0})}setOnMachineUpdated(e){this.onMachineUpdated=e}init(){this.applyAppShellLayout();const e=document.getElementById("record-btn");e&&(this.recordButtonClickHandler=()=>this.startRecording(),e.addEventListener("click",this.recordButtonClickHandler))}async startRecording(){if(this.isRecordingStarting||this.isRecordingActive||this.mediaStream){p.warning("Eine Aufnahme läuft bereits.");return}this.isRecordingStarting=!0;try{r.info("🎙️ Phase 2: Starting reference recording with Smart Start..."),this.useAudioWorklet=te(),this.useAudioWorklet||r.warn("⚠️ AudioWorklet not supported, Smart Start disabled"),this.mediaStream=await C(this.selectedDeviceId);try{this.cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:!1}),r.info("📷 Camera access granted for reference image")}catch(i){r.warn("⚠️ Camera access denied or not available - continuing without reference image",i),p.info("Kamera nicht verfügbar. Aufnahme wird ohne Positionsbild fortgesetzt.",{title:"Kamera optional"}),this.cameraStream=null}if(typeof MediaRecorder>"u"){p.error("Ihr Browser unterstützt keine Audioaufnahme. Bitte verwenden Sie einen aktuellen Browser.",new Error("MediaRecorder not supported"),{title:"Browser nicht kompatibel",duration:0}),this.cleanup();return}this.audioContext=new AudioContext({sampleRate:48e3});const e=this.audioContext.sampleRate;if(e!==48e3&&(r.warn(`⚠️ AudioContext sample rate is ${e}Hz instead of requested 48000Hz`),r.info(`✅ Feature extraction will use actual sample rate: ${e}Hz`)),this.showRecordingModal(),document.getElementById("waveform-canvas")&&(this.visualizer=new ee("waveform-canvas"),this.visualizer.start(this.audioContext,this.mediaStream)),this.useAudioWorklet){const i=Math.floor(.33*e),n=Math.max(32768,i*2);this.audioWorkletManager=new $({bufferSize:n,warmUpDuration:this.warmUpDuration*1e3,onSmartStartStateChange:a=>{const s=Y(a);this.updateStatusMessage(s)},onSmartStartComplete:a=>{r.info(`✅ Smart Start: Signal detected! RMS: ${a.toFixed(4)}`),this.smartStartWasUsed=!0,this.updateStatusMessage("Aufnahme läuft"),this.actuallyStartRecording()},onSmartStartTimeout:()=>{r.warn("⏱️ Smart Start timeout - cleaning up resources"),this.smartStartWasUsed=!1,p.warning("Bitte näher an die Maschine gehen und erneut versuchen.",{title:"Kein Signal erkannt"}),this.cleanup(),this.hideRecordingModal()}}),await this.audioWorkletManager.init(this.audioContext,this.mediaStream),this.audioWorkletManager.startSmartStart()}else r.info("⏭️ Skipping Smart Start (AudioWorklet not supported)"),this.updateStatusMessage("Aufnahme läuft"),setTimeout(()=>this.actuallyStartRecording(),500)}catch(e){r.error("Recording error:",e),p.error("Mikrofonzugriff fehlgeschlagen",e,{title:"Zugriff verweigert",duration:0}),this.cleanup(),this.hideRecordingModal()}}cleanup(){if(this.isRecordingActive=!1,this.isRecordingStarting=!1,this.smartStartWasUsed=!1,this.timerInterval!==null&&(clearInterval(this.timerInterval),this.timerInterval=null),this.autoStopTimer!==null&&(clearTimeout(this.autoStopTimer),this.autoStopTimer=null),this.mediaRecorder&&this.mediaRecorder.state!=="inactive"&&(this.mediaRecorder.ondataavailable=null,this.mediaRecorder.onstop=null,this.mediaRecorder.stop(),this.mediaRecorder=null),this.visualizer&&this.visualizer.stop(),this.audioWorkletManager&&(this.audioWorkletManager.cleanup(),this.audioWorkletManager=null),this.mediaStream&&(this.mediaStream.getTracks().forEach(e=>e.stop()),this.mediaStream=null),this.cameraStream&&(this.cameraStream.getTracks().forEach(e=>e.stop()),this.cameraStream=null),this.audioContext&&this.audioContext.state!=="closed")try{this.audioContext.close()}catch(e){r.warn("⚠️ Error closing AudioContext:",e)}finally{this.audioContext=null}r.debug("🧹 Reference phase cleanup complete")}actuallyStartRecording(){if(!this.mediaStream)return;this.audioWorkletManager&&this.audioWorkletManager.stop();let e;MediaRecorder.isTypeSupported("audio/webm;codecs=opus")?e="audio/webm;codecs=opus":MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")?e="audio/ogg;codecs=opus":MediaRecorder.isTypeSupported("audio/mp4")&&(e="audio/mp4"),r.info(`🎙️ Using MediaRecorder MIME type: ${e??"browser default"}`),this.audioChunks=[];const t=e?{mimeType:e}:void 0;this.mediaRecorder=t?new MediaRecorder(this.mediaStream,t):new MediaRecorder(this.mediaStream),this.isRecordingActive=!0,this.isRecordingStarting=!1,this.mediaRecorder.ondataavailable=i=>{i.data.size>0&&this.audioChunks.push(i.data)},this.mediaRecorder.onstop=()=>this.processRecording(),this.mediaRecorder.onstart=()=>{this.recordingStartTime=Date.now(),this.startTimer();const i=this.smartStartWasUsed?10:this.recordingDuration;this.autoStopTimer=setTimeout(()=>{this.stopRecording()},i*1e3);const n=this.smartStartWasUsed?5e3:1e4;setTimeout(()=>{this.captureReferenceSnapshot()},n)},this.mediaRecorder.start()}captureReferenceSnapshot(){if(!this.cameraStream){r.info("📷 No camera stream available - skipping reference snapshot");return}try{const e=document.getElementById("reference-video");if(!e||e.videoWidth===0){r.warn("⚠️ Video element not ready - skipping snapshot");return}const t=document.createElement("canvas");t.width=e.videoWidth,t.height=e.videoHeight;const i=t.getContext("2d");if(!i){r.error("❌ Failed to get canvas context");return}i.drawImage(e,0,0,t.width,t.height),t.toBlob(n=>{if(n){this.capturedReferenceImage=n,r.info(`📸 Reference snapshot captured: ${n.size} bytes (${t.width}x${t.height})`);const a=document.getElementById("reference-video-container");a&&(a.style.borderColor="var(--status-healthy)",setTimeout(()=>{a.style.borderColor="var(--primary-color)"},300))}else r.error("❌ Failed to create blob from canvas")},"image/jpeg",.8)}catch(e){r.error("Snapshot capture error:",e)}}stopRecording(){if(this.mediaRecorder&&this.mediaRecorder.state!=="inactive"){this.mediaRecorder.stop();return}(this.audioWorkletManager||this.isRecordingActive||this.isRecordingStarting)&&(this.audioWorkletManager&&this.audioWorkletManager.cleanup(),this.cleanup(),this.hideRecordingModal())}async processRecording(){try{if(!this.audioContext)throw new Error("Audio context not initialized");const e=this.mediaRecorder?.mimeType||"",t=e?{type:e}:void 0,i=t?new Blob(this.audioChunks,t):new Blob(this.audioChunks);this.recordedBlob=i,r.info(`📦 Created audio blob with MIME type: ${e}`);const n=await i.arrayBuffer(),a=await this.audioContext.decodeAudioData(n);r.info(`🎙️ Recording complete: ${a.duration.toFixed(2)}s`);const s=a.sampleRate,o=this.smartStartWasUsed?0:Math.floor(this.warmUpDuration*s),d=a.length-o;this.smartStartWasUsed?(r.info("📊 Using full recording (Smart Start handled warmup):"),r.info(`   Total duration: ${a.duration.toFixed(2)}s - ALL USED FOR TRAINING`)):(r.info("📊 Slicing audio buffer (fallback mode without Smart Start):"),r.info(`   Total duration: ${a.duration.toFixed(2)}s`),r.info(`   Warmup period: ${this.warmUpDuration}s (${o} samples) - DISCARDED`),r.info(`   Training period: ${(d/s).toFixed(2)}s (${d} samples) - USED`));const u=5,g=Math.floor(u*s);if(d<=0)throw new Error(`Aufnahme zu kurz: ${a.duration.toFixed(2)}s Gesamtdauer ist kürzer als die ${this.warmUpDuration}s Warmup-Phase. Mindestdauer: ${(this.warmUpDuration+u).toFixed(1)}s`);if(d<g)throw new Error(`Trainings-Daten zu kurz: ${(d/s).toFixed(2)}s (nach Warmup-Phase). Minimum erforderlich: ${u}s. Bitte mindestens ${(this.warmUpDuration+u).toFixed(1)}s aufnehmen.`);const y=this.audioContext.createBuffer(a.numberOfChannels,d,s);for(let M=0;M<a.numberOfChannels;M++){const B=a.getChannelData(M),se=y.getChannelData(M);for(let k=0;k<d;k++)se[k]=B[o+k]}const v=this.audioContext.sampleRate,h={...E,sampleRate:v,frequencyRange:[0,v/2]};r.debug(`📊 DSP Config: sampleRate=${h.sampleRate}Hz, frequencyRange=[${h.frequencyRange[0]}, ${h.frequencyRange[1]}]Hz`),r.info("📊 Extracting features from stable signal...");const f=pe(y,h);r.info(`   Extracted ${f.length} feature vectors`);const S=ve(f),b={featureVectors:f.map(M=>M.features),machineId:this.machine.id,recordingId:`ref-${Date.now()}`,numSamples:f.length,config:h};this.currentAudioBuffer=a,this.currentFeatures=f,this.currentQualityResult=S,this.currentTrainingData=b,this.cleanup(),this.hideRecordingModal(),this.showReviewModal()}catch(e){r.error("Processing error:",e),p.error("Aufnahme konnte nicht verarbeitet werden",e,{title:"Verarbeitungsfehler",duration:0}),this.cleanup(),this.hideRecordingModal()}}showSuccessWithExport(){const e=new Date().toISOString().replace(/[:.]/g,"-").slice(0,-5);let t="webm";this.recordedBlob&&(this.recordedBlob.type.includes("ogg")?t="ogg":this.recordedBlob.type.includes("mp4")&&(t="m4a"));const i=`${this.machine.id}_REF_${e}.${t}`;confirm(`✅ Referenzmodell erfolgreich trainiert!

Maschine: ${this.machine.name}

Möchten Sie die Referenz-Audiodatei herunterladen?
(Empfohlen für Backup)`)&&this.recordedBlob&&this.exportReferenceAudio(i)}exportReferenceAudio(e){if(!this.recordedBlob){p.warning("Bitte zuerst eine Referenzaufnahme erstellen.",{title:"Keine Audiodatei verfügbar"});return}try{const t=URL.createObjectURL(this.recordedBlob),i=document.createElement("a");i.href=t,i.download=e,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(t),r.info(`📥 Reference audio exported: ${e}`)}catch(t){r.error("Export error:",t),p.error("Export fehlgeschlagen",t,{title:"Exportfehler"})}}updateStatusMessage(e){const t=document.getElementById("recording-status");t&&(t.textContent=e);const i=document.querySelector("#recording-modal .modal-header h3");i&&e.includes("Kalibrierung")?i.textContent="Referenzaufnahme - Kalibrierung":i&&e.includes("Warte")?i.textContent="Referenzaufnahme - Warte auf Signal":i&&e.includes("Aufnahme")&&(i.textContent="Referenzaufnahme - Läuft")}showRecordingModal(){const e=document.getElementById("recording-modal");e&&(e.style.display="flex");const t=document.getElementById("machine-id");t&&(t.textContent=`${this.machine.name} (${this.machine.id})`,r.debug("✅ Modal machine name updated:",this.machine.name));const i=document.querySelector("#recording-modal .modal-body");if(i&&!document.getElementById("recording-status")){const a=this.machine.referenceModels||[],s=a.length>0?a.map(u=>{const g=new Date(u.trainingDate).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});return`${u.label} (${g})`}).join(", "):"Noch keine Referenzmodelle vorhanden",o=document.createElement("div");o.className="existing-models-info",o.style.cssText="background: rgba(0, 212, 255, 0.1); border-left: 3px solid var(--primary-color); padding: 8px 12px; margin-bottom: 12px; border-radius: 4px;",o.innerHTML=`
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">VORHANDENE MODELLE:</div>
        <div style="font-size: 0.85rem; color: var(--text-primary); font-weight: 500;">${s}</div>
        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">${a.length} Zustand(e) bereits trainiert</div>
      `;const c=i.querySelector("#visualizer-container");c?c.insertAdjacentElement("afterend",o):i.insertBefore(o,i.firstChild);const d=document.createElement("div");d.id="recording-status",d.className="recording-status",d.textContent="Initialisierung...",o.insertAdjacentElement("afterend",d)}const n=document.getElementById("stop-recording-btn");if(n&&(n.textContent=ie.STOP_REFERENCE,n.onclick=()=>this.stopRecording()),this.cameraStream&&i){const a=document.createElement("div");a.id="reference-video-container",a.className="reference-video-container",a.style.cssText=`
        position: relative;
        width: 100%;
        max-width: 300px;
        margin: 12px auto;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid var(--primary-color);
      `;const s=document.createElement("video");s.id="reference-video",s.autoplay=!0,s.playsInline=!0,s.muted=!0,s.style.cssText=`
        width: 100%;
        height: auto;
        display: block;
      `,s.srcObject=this.cameraStream;const o=document.createElement("p");o.className="video-hint",o.style.cssText=`
        font-size: 0.75rem;
        color: var(--text-muted);
        text-align: center;
        margin-top: 8px;
      `,o.textContent="📷 Positionsbild wird automatisch aufgenommen",a.appendChild(s),i.insertBefore(a,i.firstChild),i.insertBefore(o,a.nextSibling),r.info("✅ Reference video preview added to modal")}}hideRecordingModal(){const e=document.getElementById("recording-modal");e&&(e.style.display="none");const t=document.getElementById("recording-status");t&&t.remove();const i=e?.querySelector(".existing-models-info");i&&i.remove();const n=document.getElementById("reference-video-container");n&&n.remove();const a=e?.querySelector(".video-hint");a&&a.remove()}startTimer(){this.timerInterval!==null&&(clearInterval(this.timerInterval),this.timerInterval=null);let e=0;const t=document.getElementById("recording-timer"),i=document.getElementById("recording-status"),n=this.smartStartWasUsed?10:this.recordingDuration,a=this.smartStartWasUsed?0:this.warmUpDuration;this.timerInterval=setInterval(()=>{if(!this.isRecordingActive){this.timerInterval!==null&&(clearInterval(this.timerInterval),this.timerInterval=null);return}if(e++,!this.smartStartWasUsed&&e<=a){if(i){const s=a-e+1;i.textContent=`Stabilisierung... ${s}s`}t&&(t.textContent="--:--")}else{const s=this.smartStartWasUsed?e:e-a,o=this.smartStartWasUsed?10:this.recordingDuration-a;if(i&&(i.textContent="Aufnahme läuft..."),t){const c=Math.floor(s/60),d=s%60;t.textContent=`${c.toString().padStart(2,"0")}:${d.toString().padStart(2,"0")} / ${Math.floor(o/60).toString().padStart(2,"0")}:${(o%60).toString().padStart(2,"0")}`}}e>=n&&this.timerInterval!==null&&(clearInterval(this.timerInterval),this.timerInterval=null)},1e3)}showReviewModal(){if(!this.recordedBlob||!this.currentQualityResult){r.error("Cannot show review modal: missing data");return}const e=document.getElementById("review-modal");if(!e){r.error("Review modal element not found");return}const t=document.getElementById("review-audio"),i=document.getElementById("review-audio-source");if(!t||!i){r.error("Audio player elements not found");return}const n=URL.createObjectURL(this.recordedBlob);i.src=n,i.type=this.recordedBlob.type||"audio/webm",t.load();const a=document.getElementById("review-reference-image-container"),s=document.getElementById("review-reference-image");a&&s&&(this.capturedReferenceImage?(this.reviewImageUrl&&URL.revokeObjectURL(this.reviewImageUrl),this.reviewImageUrl=URL.createObjectURL(this.capturedReferenceImage),s.src=this.reviewImageUrl,a.style.display="block"):(s.removeAttribute("src"),a.style.display="none")),this.updateQualityIndicator(this.currentQualityResult);const o=document.getElementById("review-discard-btn"),c=document.getElementById("review-save-btn");o&&(o.onclick=()=>this.handleReviewDiscard()),c&&(c.onclick=()=>this.handleReviewSave()),e.style.display="flex",r.info("🔍 Review modal displayed")}hideReviewModal(){const e=document.getElementById("review-modal");e&&(e.style.display="none");const t=document.getElementById("review-audio");if(t){t.pause();const a=document.getElementById("review-audio-source");a&&a.src&&(URL.revokeObjectURL(a.src),a.src="")}this.reviewImageUrl&&(URL.revokeObjectURL(this.reviewImageUrl),this.reviewImageUrl=null);const i=document.getElementById("review-reference-image-container"),n=document.getElementById("review-reference-image");i&&n&&(n.removeAttribute("src"),i.style.display="none")}updateQualityIndicator(e){const t=document.getElementById("quality-score");t&&(t.textContent=e.score.toString());const i=document.getElementById("quality-rating-text"),n=document.getElementById("quality-icon");if(i&&n)switch(i.className="quality-rating",n.className="quality-icon",n.innerHTML="",e.rating){case"GOOD":i.classList.add("good"),i.textContent="✓ Signal stabil",n.classList.add("good"),n.innerHTML="✓";break;case"OK":i.classList.add("ok"),i.textContent="⚠ Leichte Unruhe",n.classList.add("ok"),n.innerHTML="⚠";break;case"BAD":i.classList.add("bad"),i.textContent="✗ Warnung: Signal instabil!",n.classList.add("bad"),n.innerHTML="✗";break}const a=document.getElementById("quality-issues"),s=document.getElementById("quality-issues-list");a&&s&&(e.issues.length>0?(s.innerHTML="",e.issues.forEach(o=>{const c=document.createElement("li");c.textContent=o,s.appendChild(c)}),a.style.display="block"):a.style.display="none")}handleReviewDiscard(){r.info("🗑️ User discarded recording"),this.hideReviewModal(),this.currentAudioBuffer=null,this.currentFeatures=[],this.currentQualityResult=null,this.currentTrainingData=null,this.recordedBlob=null,this.capturedReferenceImage=null,p.info("Sie können eine neue Referenzaufnahme starten.",{title:"Aufnahme verworfen"})}async handleReviewSave(){if(!this.machine||!this.machine.id){r.error("Cannot save: machine data is invalid or missing"),p.error("Maschinendaten fehlen",new Error("Machine ID missing"),{title:"Fehler",duration:0});return}if(!this.currentTrainingData||!this.currentQualityResult){r.error("Cannot save: missing training data or quality result");return}if(this.currentQualityResult.rating==="BAD"&&this.currentQualityResult.score<30){r.error("Recording quality too low for training - blocking save"),p.error(`Aufnahme zu schlecht für Training. Bitte in ruhiger Umgebung mit deutlichem Maschinensignal erneut aufnehmen.

Probleme:
`+this.currentQualityResult.issues.map(i=>`• ${i}`).join(`
`),new Error("Quality too low"),{duration:0});return}const e=this.currentQualityResult.metadata?.signalMagnitude??.5;if(e<.01&&this.currentQualityResult.score<60||e<.03&&this.currentQualityResult.score<50){r.error("Brown noise or weak signal detected - blocking save"),p.error(`Signal zu schwach oder diffus (möglicherweise nur Rauschen).

Signal-Stärke (RMS): ${e.toFixed(4)} (Minimum: 0.03)
Qualität: ${this.currentQualityResult.score}%

Bitte sicherstellen:
• Mikrofon ist nah genug an der Maschine (10-30cm)
• Maschine läuft mit ausreichend Lautstärke
• Kein reines Hintergrundrauschen wird aufgenommen

Probleme:
`+this.currentQualityResult.issues.map(i=>`• ${i}`).join(`
`),new Error("Signal too weak or noisy"),{duration:0,title:"Ungeeignetes Signal"});return}if(this.currentQualityResult.rating==="BAD"&&!confirm(`⚠️ WARNUNG: Schlechte Aufnahmequalität

Die Qualität dieser Aufnahme ist schlecht. Das Training könnte unzuverlässig sein.

Probleme:
`+this.currentQualityResult.issues.map(n=>`• ${n}`).join(`
`)+`

Möchten Sie trotzdem speichern?`)){r.info("User cancelled save due to bad quality warning");return}try{let i,n;const a=this.machine.referenceModels;if(!a||a.length===0)i="Baseline",n="healthy",r.info('First recording - using label: "Baseline", type: "healthy"');else{const h=prompt(`Geben Sie einen Namen für diesen Maschinenzustand ein:

Beispiele:
• Normale Betriebszustände: "Leerlauf", "Volllast", "Teillast"
• Fehler: "Unwucht simuliert", "Lagerschaden", "Lüfterfehler"`,"");if(!h||h.trim()===""){r.info("User cancelled - no label provided"),p.warning("Bitte einen Namen eingeben",{title:"Abgebrochen"});return}i=h.trim(),n=confirm(`Zustand: "${i}"

Ist dies ein NORMALER Betriebszustand?

🟢 OK (Ja) → Normaler Zustand (z.B. "Leerlauf", "Volllast")
🔴 Abbrechen (Nein) → Bekannter Fehler (z.B. "Unwucht", "Lagerschaden")

Hinweis: Diese Wahl bestimmt, ob eine Diagnose als "gesund" oder "fehlerhaft" angezeigt wird.`)?"healthy":"faulty",r.info(`Additional recording - using label: "${i}", type: "${n}"`)}r.info("💾 Saving reference model..."),r.debug("💾 Reference Save Debug:",{machineId:this.machine.id,machineName:this.machine.name,label:i,type:n,existingModels:this.machine.referenceModels?.length||0});const s=Se(this.currentTrainingData,this.machine.id);r.info(`✅ Model trained successfully (scaling constant: ${s.scalingConstant.toFixed(3)})`),r.info("🎯 Performing self-test for baseline score calibration...");const o=Math.min(20,this.currentFeatures.length),c=Math.max(1,Math.floor(this.currentFeatures.length/o)),d=[];for(let h=0;h<o;h++){const f=Math.min(h*c,this.currentFeatures.length-1),S=this.currentFeatures[f];try{const b=K([s],S,this.currentTrainingData.config.sampleRate);d.push(b.healthScore)}catch(b){r.warn(`⚠️ Self-test sample ${h} failed:`,b)}}if(d.length===0)throw new Error("Self-test failed: No valid scores could be calculated");const u=d.reduce((h,f)=>h+f,0)/d.length;r.info(`✅ Baseline Score: ${u.toFixed(1)}% (averaged from ${d.length} samples)`),r.info(`   Score range: ${Math.min(...d).toFixed(1)}% - ${Math.max(...d).toFixed(1)}%`);const g=75;if(u<g){r.error(`❌ Baseline score too low: ${u.toFixed(1)}% (minimum: ${g}%)`),p.error(`Referenzaufnahme zu undeutlich oder verrauscht.

Selbsterkennungs-Score: ${u.toFixed(1)}%
Minimum erforderlich: ${g}%

Mögliche Ursachen:
• Signal zu schwach oder instabil
• Zu viel Hintergrundgeräusch
• Maschine läuft nicht konstant

Bitte Aufnahme unter besseren Bedingungen wiederholen:
• Mikrofon näher an der Maschine (10-30cm)
• Ruhige Umgebung
• Maschine läuft stabil während gesamter Aufnahme`,new Error("Baseline score too low"),{title:"Referenzaufnahme ungeeignet",duration:0});return}if(r.info(`✅ Quality Gate passed: Baseline score ${u.toFixed(1)}% ≥ ${g}%`),s.baselineScore=u,s.label=i,s.type=n,await de(this.machine.id,s),r.info(`✅ Reference model "${i}" trained and saved!`),this.capturedReferenceImage){const{getMachine:h,saveMachine:f}=await U(async()=>{const{getMachine:b,saveMachine:M}=await import("./data-CHglu3FA.js").then(B=>B.h);return{getMachine:b,saveMachine:M}},__vite__mapDeps([0,1]),import.meta.url),S=await h(this.machine.id);S&&(S.referenceImage=this.capturedReferenceImage,await f(S),r.info(`📸 Reference image saved to machine (${this.capturedReferenceImage.size} bytes)`))}const{getMachine:y}=await U(async()=>{const{getMachine:h}=await import("./data-CHglu3FA.js").then(f=>f.h);return{getMachine:h}},__vite__mapDeps([0,1]),import.meta.url),v=await y(this.machine.id);v&&(this.machine=v,this.onMachineUpdated&&this.onMachineUpdated(v)),this.hideReviewModal(),this.showSuccessWithExport(),this.showMulticlassStatus(),this.currentAudioBuffer=null,this.currentFeatures=[],this.currentQualityResult=null,this.currentTrainingData=null}catch(i){r.error("Save error:",i),p.error("Speichern fehlgeschlagen",i,{title:"Fehler beim Speichern",duration:0})}}showMulticlassStatus(){let e=document.getElementById("multiclass-status");if(!e){const s=document.querySelector("#record-reference-content .container-content");if(!s)return;e=document.createElement("div"),e.id="multiclass-status",e.className="multiclass-status",s.appendChild(e)}e.innerHTML="";const t=document.createElement("h3");t.textContent="Trainierte Zustände",e.appendChild(t);const i=document.createElement("ul");i.className="state-list";const n=this.machine.referenceModels;n&&n.length>0&&n.forEach(s=>{const o=document.createElement("li");o.className="state-item";const c=s.trainingDate?new Date(s.trainingDate).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"unbekannt",d=document.createElement("span");d.className="state-label",d.textContent=s.label;const u=document.createElement("span");u.className="state-date",u.textContent=c,o.appendChild(d),o.appendChild(u),i.appendChild(o)}),e.appendChild(i);const a=document.createElement("button");a.id="train-another-btn",a.className="btn btn-secondary",a.textContent="Weiteren Zustand trainieren",a.onclick=()=>this.startRecording(),e.appendChild(a),e.style.display="block"}applyAppShellLayout(){const e=document.getElementById("recording-modal");if(e){const n=e.querySelector(".modal-content");if(n){n.classList.add("app-shell-container");const a=n.querySelector(".modal-header"),s=n.querySelector(".modal-body"),o=n.querySelector(".modal-actions");if(a?.classList.add("shell-header"),s?.classList.add("shell-content"),o?.classList.add("shell-footer"),a&&!a.querySelector("#reference-instruction")){const c=document.createElement("p");c.id="reference-instruction",c.className="modal-instruction",c.textContent="Halten Sie das Mikrofon 10–30 cm vor die Maschine.",a.appendChild(c)}if(s){let c=s.querySelector("#visualizer-container");c||(c=document.createElement("div"),c.id="visualizer-container",c.className="visualizer-container");const d=s.querySelector("#waveform-canvas"),u=s.querySelector("#health-gauge-canvas");d&&d.parentElement!==c&&c.appendChild(d),u&&u.parentElement!==c&&c.appendChild(u),c.parentElement?s.firstChild!==c&&s.insertBefore(c,s.firstChild):s.insertBefore(c,s.firstChild)}}}const t=document.getElementById("review-modal");if(!t)return;const i=t.querySelector(".modal-content");i&&(i.classList.add("app-shell-container"),i.querySelector(".modal-header")?.classList.add("shell-header"),i.querySelector(".modal-body")?.classList.add("shell-content"),i.querySelector(".modal-actions")?.classList.add("shell-footer"))}destroy(){if(this.cleanup(),this.recordButtonClickHandler){const e=document.getElementById("record-btn");e&&e.removeEventListener("click",this.recordButtonClickHandler),this.recordButtonClickHandler=null}this.visualizer&&(this.visualizer.destroy(),this.visualizer=null),this.audioChunks=[],this.recordedBlob=null}}class V{constructor(e){l(this,"canvas");l(this,"ctx");l(this,"score",0);l(this,"customStatus");l(this,"animationFrame",null);l(this,"colors",{healthy:"#00E676",warning:"#FFB74D",error:"#FF5252",text:"#FFFFFF",textMuted:"#888888",background:"#2a2a2a"});const t=document.getElementById(e);if(!t)throw new Error(`Canvas element not found: ${e}`);this.canvas=t;const i=t.getContext("2d");if(!i)throw new Error("Could not get 2D context");this.ctx=i,this.setCanvasSize(),this.updateThemeColors(),this.observeThemeChanges()}updateThemeColors(){const e=getComputedStyle(document.documentElement);this.colors={healthy:e.getPropertyValue("--status-healthy").trim()||"#00E676",warning:e.getPropertyValue("--status-warning").trim()||"#FFB74D",error:e.getPropertyValue("--status-error").trim()||"#FF5252",text:e.getPropertyValue("--text-primary").trim()||"#FFFFFF",textMuted:e.getPropertyValue("--text-muted").trim()||"#888888",background:e.getPropertyValue("--bg-tertiary").trim()||"#2a2a2a"}}observeThemeChanges(){new MutationObserver(t=>{t.forEach(i=>{i.attributeName==="data-theme"&&(this.updateThemeColors(),this.render())})}).observe(document.documentElement,{attributes:!0,attributeFilter:["data-theme"]})}setCanvasSize(){const e=window.devicePixelRatio||1,t=this.canvas.getBoundingClientRect();this.canvas.width=t.width*e,this.canvas.height=t.height*e,this.ctx.setTransform(1,0,0,1,0,0),this.ctx.scale(e,e)}draw(e,t){!isFinite(e)||e<0||e>100?(r.error(`❌ HealthGauge: Invalid score: ${e}, using 0`),this.score=0):this.score=Math.max(0,Math.min(100,e)),t!==void 0?["healthy","uncertain","faulty","UNKNOWN"].includes(t)?this.customStatus=t:(r.error(`❌ HealthGauge: Invalid status: ${t}, using UNKNOWN`),this.customStatus="UNKNOWN"):this.customStatus=t,this.render()}updateScore(e,t=!0){(!isFinite(e)||e<0||e>100)&&(r.error(`❌ HealthGauge.updateScore: Invalid score: ${e}, using 0`),e=0);const i=Math.max(0,Math.min(100,e));this.customStatus=void 0,t?this.animateToScore(i):(this.score=i,this.render())}animateToScore(e){const t=this.score,i=e-t,n=1e3,a=Date.now(),s=()=>{const o=Date.now()-a,c=Math.min(o/n,1),d=1-Math.pow(1-c,3);this.score=t+i*d,this.render(),c<1&&(this.animationFrame=requestAnimationFrame(s))};this.animationFrame&&cancelAnimationFrame(this.animationFrame),s()}render(){const e=this.canvas.width/(window.devicePixelRatio||1),t=this.canvas.height/(window.devicePixelRatio||1),i=e/2,n=t/2,a=Math.max(0,Math.min(e,t)/2-20);this.ctx.clearRect(0,0,e,t),this.drawArc(i,n,a,0,100,this.colors.background,8);const s=this.getScoreColor(this.score);this.drawArc(i,n,a,0,this.score,s,10),this.drawText(i,n,this.score)}drawArc(e,t,i,n,a,s,o){const c=this.scoreToAngle(n),d=this.scoreToAngle(a);this.ctx.beginPath(),this.ctx.arc(e,t,i,c,d),this.ctx.strokeStyle=s,this.ctx.lineWidth=o,this.ctx.lineCap="round",this.ctx.stroke()}scoreToAngle(e){const t=-135*(Math.PI/180),i=270*(Math.PI/180);return t+e/100*i}drawText(e,t,i){this.ctx.font="bold 48px system-ui, -apple-system, sans-serif",this.ctx.fillStyle=this.colors.text,this.ctx.textAlign="center",this.ctx.textBaseline="middle",this.ctx.fillText(Math.round(i).toString(),e,t-10),this.ctx.font="24px system-ui, -apple-system, sans-serif",this.ctx.fillStyle=this.colors.textMuted,this.ctx.fillText("%",e,t+30);const n=this.customStatus!==void 0?this.customStatus:this.getStatusLabel(i);this.ctx.font="16px system-ui, -apple-system, sans-serif",this.ctx.fillStyle=this.getScoreColor(i),this.ctx.fillText(n,e,t+60)}getScoreColor(e){return e>=75?this.colors.healthy:e>=50?this.colors.warning:this.colors.error}getStatusLabel(e){return e>=75?"UNAUFFÄLLIG":e>=50?"ABWEICHUNG":"AUFFÄLLIG"}destroy(){this.animationFrame&&cancelAnimationFrame(this.animationFrame)}}class ze{constructor(e,t){l(this,"machine");l(this,"selectedDeviceId");l(this,"audioContext",null);l(this,"mediaStream",null);l(this,"cameraStream",null);l(this,"audioWorkletManager",null);l(this,"visualizer",null);l(this,"healthGauge",null);l(this,"activeModels",[]);l(this,"isProcessing",!1);l(this,"scoreHistory");l(this,"labelHistory");l(this,"lastProcessedScore",0);l(this,"lastProcessedStatus","UNKNOWN");l(this,"lastDetectedState","UNKNOWN");l(this,"hasValidMeasurement",!1);l(this,"useAudioWorklet",!0);l(this,"isStarting",!1);l(this,"isSaving",!1);l(this,"lastDebugValues",null);l(this,"chunkSize");l(this,"requestedSampleRate",48e3);l(this,"actualSampleRate",48e3);l(this,"dspConfig");l(this,"diagnoseButtonClickHandler",null);this.machine=e,this.selectedDeviceId=t,r.debug("🔬 DiagnosePhase Constructor:",{machineId:e.id,machineName:e.name,numModels:e.referenceModels?.length||0}),this.chunkSize=Math.floor(E.windowSize*this.requestedSampleRate),this.dspConfig={...E},this.scoreHistory=new we,this.labelHistory=new be}setMachine(e){this.machine=e,r.debug("🔄 Machine updated in DiagnosePhase:",{machineId:e.id,machineName:e.name,numModels:e.referenceModels?.length||0})}init(){this.applyAppShellLayout();const e=document.getElementById("diagnose-btn");e&&(this.diagnoseButtonClickHandler=()=>this.startDiagnosis(),e.addEventListener("click",this.diagnoseButtonClickHandler))}async startDiagnosis(){if(this.isStarting||this.isProcessing||this.mediaStream){p.warning("Eine Diagnose läuft bereits.");return}try{const e=await I(this.machine.id);if(e)this.machine=e;else{p.error("Maschine nicht gefunden. Bitte neu auswählen.");return}if(r.debug("🤖 Diagnosis Start Debug:",{machineId:this.machine.id,machineName:this.machine.name,numModels:this.machine.referenceModels?.length||0,models:this.machine.referenceModels?.map(s=>({label:s.label,trainingDate:new Date(s.trainingDate).toLocaleString(),sampleRate:s.sampleRate,weightMagnitude:s.metadata?.weightMagnitude?.toFixed(6)||"N/A"}))||[]}),!this.machine.referenceModels||this.machine.referenceModels.length===0){p.error("Kein Referenzmodell gefunden. Bitte zuerst eine Referenzaufnahme erstellen.");return}if(r.info("🔴 Starting REAL-TIME diagnosis with Smart Start..."),this.useAudioWorklet=te(),!this.useAudioWorklet){r.error("❌ AudioWorklet not supported - Real-time diagnosis requires AudioWorklet"),p.error("Ihr Browser unterstützt keine Real-Time-Diagnose. Bitte verwenden Sie Chrome, Edge oder Safari.",new Error("AudioWorklet not supported"),{title:"Browser nicht kompatibel",duration:0});return}this.isStarting=!0,this.hasValidMeasurement=!1,this.lastProcessedScore=0,this.lastProcessedStatus="UNKNOWN",this.lastDetectedState="UNKNOWN",this.scoreHistory.clear(),this.labelHistory.clear();const t=this.machine.referenceModels[0]?.sampleRate;if(!t){p.error("Kein Referenzmodell mit gültiger Sample Rate gefunden."),this.isStarting=!1;return}const i=[...new Set(this.machine.referenceModels.map(s=>s.sampleRate))];i.length>1&&r.warn(`⚠️ Multiple sample rates in models: ${i.join(", ")}Hz`),this.mediaStream=await C(this.selectedDeviceId);try{this.cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:!1}),r.info("📷 Camera access granted for ghost overlay")}catch(s){r.warn("⚠️ Camera access denied or not available - continuing without ghost overlay",s),p.info("Kamera nicht verfügbar. Diagnose wird ohne Positionshilfe fortgesetzt.",{title:"Kamera optional"}),this.cameraStream=null}if(this.audioContext=new AudioContext({sampleRate:t}),this.actualSampleRate=this.audioContext.sampleRate,this.actualSampleRate!==t&&(r.warn(`⚠️ AudioContext sample rate is ${this.actualSampleRate}Hz instead of requested ${t}Hz`),r.warn(`⚠️ This indicates hardware does not support ${t}Hz - sample rate mismatch!`)),this.activeModels=this.machine.referenceModels.filter(s=>s.sampleRate===this.actualSampleRate),this.activeModels.length===0){const s=[...new Set(this.machine.referenceModels.map(o=>o.sampleRate))].sort((o,c)=>o-c).join(", ");r.error(`❌ Sample Rate Mismatch: Hardware=${this.actualSampleRate}Hz, ModelRates=[${s}]`),p.error(`Audio-Setup Fehler: Ihr Mikrofon läuft bei ${this.actualSampleRate}Hz, aber kein Referenzmodell wurde bei dieser Sample Rate trainiert (Modelle: ${s}Hz). Bitte verwenden Sie das gleiche Audio-Setup wie beim Training oder erstellen Sie ein neues Referenzmodell mit der aktuellen Sample Rate.`,new Error("Sample Rate Mismatch"),{title:"Inkompatible Sample Rate",duration:0}),this.cleanup();return}this.activeModels.length<this.machine.referenceModels.length&&r.warn(`⚠️ Sample Rate Filter: ${this.activeModels.length}/${this.machine.referenceModels.length} Modelle kompatibel (${this.actualSampleRate}Hz)`),r.info(`✅ Sample Rate validation passed: ${this.actualSampleRate}Hz (matches model training)`),this.chunkSize=Math.floor(E.windowSize*this.actualSampleRate),this.dspConfig={...E,sampleRate:this.actualSampleRate,frequencyRange:[0,this.actualSampleRate/2]},r.debug(`📊 DSP Config: sampleRate=${this.dspConfig.sampleRate}Hz, chunkSize=${this.chunkSize} samples, windowSize=${E.windowSize}s`),this.showRecordingModal(),document.getElementById("health-gauge-canvas")&&(this.healthGauge=new V("health-gauge-canvas"),this.healthGauge.draw(0,"UNKNOWN")),document.getElementById("waveform-canvas")&&(this.visualizer=new ee("waveform-canvas"),this.visualizer.start(this.audioContext,this.mediaStream)),this.audioWorkletManager=new $({bufferSize:this.chunkSize*2,warmUpDuration:Re.warmUpDuration,onAudioChunk:s=>{this.isProcessing&&this.processChunkDirectly(s)},onSmartStartStateChange:s=>{const o=Y(s);this.updateSmartStartStatus(o)},onSmartStartComplete:s=>{r.info(`✅ Smart Start: Signal detected! RMS: ${s.toFixed(4)}`),this.updateSmartStartStatus("Diagnose läuft"),this.isProcessing=!0},onSmartStartTimeout:()=>{r.warn("⏱️ Smart Start timeout - cleaning up resources"),p.warning("Bitte näher an die Maschine gehen und erneut versuchen.",{title:"Kein Signal erkannt"}),this.cleanup(),this.hideRecordingModal()}}),await this.audioWorkletManager.init(this.audioContext,this.mediaStream),this.audioWorkletManager.startSmartStart(),r.info("✅ Real-time diagnosis initialized!")}catch(e){r.error("Diagnosis error:",e),p.error("Mikrofonzugriff fehlgeschlagen",e,{title:"Zugriff verweigert",duration:0}),this.cleanup(),this.hideRecordingModal()}finally{this.isStarting=!1}}cleanup(){if(this.isProcessing=!1,this.isStarting=!1,this.hasValidMeasurement=!1,this.lastProcessedScore=0,this.lastProcessedStatus="UNKNOWN",this.lastDetectedState="UNKNOWN",this.scoreHistory.clear(),this.labelHistory.clear(),this.audioWorkletManager&&(this.audioWorkletManager.cleanup(),this.audioWorkletManager=null),this.visualizer&&this.visualizer.stop(),this.mediaStream&&(this.mediaStream.getTracks().forEach(t=>t.stop()),this.mediaStream=null),this.cameraStream&&(this.cameraStream.getTracks().forEach(t=>t.stop()),this.cameraStream=null),this.audioContext&&this.audioContext.state!=="closed")try{this.audioContext.close()}catch(t){r.warn("⚠️ Error closing AudioContext:",t)}finally{this.audioContext=null}const e=document.getElementById("recording-modal");e&&(e.querySelectorAll(".live-display").forEach(n=>n.remove()),e.querySelectorAll("#smart-start-status").forEach(n=>n.remove())),r.debug("🧹 Cleanup complete")}processChunkDirectly(e){if(this.isProcessing&&!(!this.activeModels||this.activeModels.length===0))try{if(!e||!(e instanceof Float32Array)){r.error("❌ Invalid chunk received: not a Float32Array");return}if(e.length===0){r.debug("⏳ Empty chunk received, skipping");return}if(e.length<this.chunkSize){r.debug(`⏳ Chunk too small: ${e.length} < ${this.chunkSize} samples, waiting for more data`);return}const t=e.slice(0,this.chunkSize),i=ye(t,this.dspConfig),n=K(this.activeModels,i,this.actualSampleRate);this.scoreHistory.addScore(n.healthScore);const a=typeof n.metadata?.detectedState=="string"?n.metadata.detectedState:"UNKNOWN";this.labelHistory.addLabel(a);const s=this.scoreHistory.getFilteredScore(),o=Me(s);if(n.metadata?.debug){const c=n.metadata.debug;this.lastDebugValues=c,r.debug("✅ Debug values stored:",this.lastDebugValues)}else r.warn("⚠️ No debug values in diagnosis.metadata!",n.metadata);this.updateLiveDisplay(s,o,a),this.updateDebugDisplay(),this.lastProcessedScore=s,this.lastProcessedStatus=o,this.lastDetectedState=a,this.hasValidMeasurement=!0,this.scoreHistory.getAllScores().length%10===0&&r.debug(`📊 Live Score: ${s.toFixed(1)}% | State: ${a} (${o})`)}catch(t){r.error("Chunk processing error:",t),t instanceof Error&&t.message.includes("Sample Rate Mismatch")&&(this.isProcessing=!1,p.error(`Audio-Setup Fehler: Die Sample Rate Ihres Mikrofons (${this.actualSampleRate}Hz) stimmt nicht mit der Sample Rate des trainierten Modells überein. Bitte verwenden Sie das gleiche Audio-Setup wie beim Training oder erstellen Sie ein neues Referenzmodell.`,t,{title:"Inkompatible Sample Rate",duration:0}),this.cleanup(),this.hideRecordingModal())}}updateSmartStartStatus(e){const t=document.getElementById("smart-start-status");if(t){let i=e;e.includes("Stabilisierung")?i=`🎙️ ${e}
(Mikrofon pegelt ein, OS-Filter werden stabilisiert...)`:e.includes("Warte")&&(i=`🔍 ${e}`),t.textContent=i,e.includes("läuft")&&(t.style.display="none")}}updateDebugDisplay(){if(!this.lastDebugValues){r.warn("⚠️ updateDebugDisplay: No debug values available!");return}r.debug("🔧 Updating debug display with values:",this.lastDebugValues);const e=this.lastDebugValues,t=(i,n,a=!1)=>{const s=document.getElementById(i);s?(s.textContent=n,a&&(s.style.color="#ff8800",s.style.fontWeight="700"),r.debug(`  ✓ Updated ${i}: ${n}`)):r.error(`  ✗ Element not found: ${i}`)};t("debug-weight-magnitude",`weightMagnitude: ${e.weightMagnitude.toFixed(6)}`),t("debug-feature-magnitude",`featureMagnitude: ${e.featureMagnitude.toFixed(6)}`),t("debug-magnitude-factor",`magnitudeFactor: ${e.magnitudeFactor.toFixed(4)}`,e.magnitudeFactor<.5),t("debug-cosine",`cosine: ${e.cosine.toFixed(4)}`),t("debug-adjusted-cosine",`adjustedCosine: ${e.adjustedCosine.toFixed(4)}`),t("debug-scaling-constant",`scalingConstant: ${e.scalingConstant.toFixed(4)}`),t("debug-raw-score",`RAW SCORE: ${e.rawScore.toFixed(1)}%`,e.rawScore===0)}updateLiveDisplay(e,t,i){this.healthGauge&&this.healthGauge.draw(e,t);const n=document.getElementById("live-health-score");if(n){const o=e.toFixed(1);n.querySelector(".live-score-unit")?n.childNodes[0].textContent=o:n.textContent=`${o}%`}const a=document.getElementById("live-score-display");a&&(a.classList.remove("score-healthy","score-uncertain","score-faulty"),e>=75?a.classList.add("score-healthy"):e>=50?a.classList.add("score-uncertain"):a.classList.add("score-faulty"));const s=document.getElementById("live-status");s&&(e>=F&&i&&i!=="UNKNOWN"?s.textContent=`${t} | ${i}`:s.textContent=t,s.className=`live-status status-${t.toLowerCase()}`)}stopRecording(){if(this.isSaving){r.warn("⚠️ Stop already in progress, ignoring duplicate call");return}this.isSaving=!0,r.info("⏹️ Stopping diagnosis...");const e=this.hasValidMeasurement,t=this.lastProcessedScore,i=this.lastProcessedStatus,n=this.scoreHistory.getAllScores().slice(),a=this.labelHistory.getMajorityLabel(),s=this.labelHistory.getAllLabels().slice();r.info(`🗳️ Majority voting: ${a} (from ${s.length} chunks: ${s.slice(-5).join(", ")})`),this.cleanup(),e?this.saveFinalDiagnosis(t,i,a,n):(r.warn("⚠️ No valid measurement data - skipping save"),this.hideRecordingModal())}async saveFinalDiagnosis(e,t,i,n){try{if(!this.machine||!this.machine.id)throw new Error("Machine data is invalid or missing");if(!this.machine.referenceModels||this.machine.referenceModels.length===0)throw new Error("No reference models available");const a=P(e),s=e>=F?i:"UNKNOWN";let o=a.recommendation;s!=="UNKNOWN"&&(t==="healthy"?o=`Maschine läuft im Normalzustand "${s}" (${e.toFixed(1)}%). Keine Anomalien erkannt.`:t==="faulty"&&(o=`Fehlerzustand erkannt: "${s}" (${e.toFixed(1)}%). Sofortige Inspektion empfohlen.`));const c=Math.random().toString(36).substring(2,9),d=t==="UNKNOWN"?"uncertain":t,u={id:`diag-${Date.now()}-${c}`,machineId:this.machine.id,timestamp:Date.now(),healthScore:e,status:d,confidence:a.confidence,rawCosineSimilarity:0,metadata:{processingMode:"real-time",totalScores:n.length,scoreHistory:n.slice(-10),detectedState:s,multiclassMode:!0,evaluatedModels:this.activeModels.length},analysis:{hint:o}};r.info(`💾 Saving final diagnosis: ${e.toFixed(1)}% | State: ${i} (${t})`),await G(u),this.hideRecordingModal(),this.showResults(u),r.info("✅ Diagnosis saved successfully!")}catch(a){r.error("Save error:",a),p.error("Diagnose konnte nicht gespeichert werden",a,{title:"Speicherfehler",duration:0}),this.hideRecordingModal()}finally{this.isSaving=!1}}showRecordingModal(){const e=document.getElementById("recording-modal");e&&(e.style.display="flex");const t=document.getElementById("machine-id");t&&(t.textContent=this.machine.name,r.debug("✅ Modal machine name updated:",this.machine.name));const i=document.getElementById("stop-recording-btn");i&&(i.textContent=ie.STOP_DIAGNOSE,i.onclick=()=>this.stopRecording());const n=document.querySelector("#recording-modal .modal-header h3");n&&(n.textContent=Le.RECORDING_DIAGNOSE);const a=document.querySelector("#recording-modal .modal-body");if(a&&e&&!e.querySelector(".live-display")){const s=this.activeModels.length>0?this.activeModels.map(c=>{const d=new Date(c.trainingDate).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});return`${c.label} (${d})`}).join(", "):"Keine Modelle geladen",o=document.createElement("div");o.className="live-display",o.innerHTML=`
        <div id="smart-start-status" class="smart-start-status">Initialisierung...</div>
        <div class="reference-model-info" style="background: rgba(0, 212, 255, 0.1); border-left: 3px solid var(--primary-color); padding: 8px 12px; margin: 12px 0; border-radius: 4px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">REFERENZMODELL(E):</div>
          <div style="font-size: 0.85rem; color: var(--text-primary); font-weight: 500;">${s}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">${this.activeModels.length} Zustand(e) trainiert</div>
        </div>
        <div class="debug-info" data-view-level="expert" style="background: rgba(255, 136, 0, 0.1); border-left: 3px solid #ff8800; padding: 8px 12px; margin: 12px 0; border-radius: 4px; font-family: monospace; font-size: 0.75rem;">
          <div style="color: var(--text-muted); margin-bottom: 4px; font-weight: 600;">🔍 DEBUG VALUES:</div>
          <div id="debug-weight-magnitude" style="color: var(--text-primary);">weightMagnitude: --</div>
          <div id="debug-feature-magnitude" style="color: var(--text-primary);">featureMagnitude: --</div>
          <div id="debug-magnitude-factor" style="color: var(--text-primary);">magnitudeFactor: --</div>
          <div id="debug-cosine" style="color: var(--text-primary);">cosine: --</div>
          <div id="debug-adjusted-cosine" style="color: var(--text-primary);">adjustedCosine: --</div>
          <div id="debug-scaling-constant" style="color: var(--text-primary);">scalingConstant: --</div>
          <div id="debug-raw-score" style="color: var(--text-primary); font-weight: 600; margin-top: 4px;">RAW SCORE: --</div>
        </div>
        <div class="live-score-container">
          <p class="live-hint">Telefon näher an die Maschine halten für optimales Signal</p>
          <div id="live-score-display" class="live-score-display is-active">
            <div class="live-score-ring"></div>
            <p class="live-score-label">Übereinstimmung</p>
            <p id="live-health-score" class="live-score">--<span class="live-score-unit">%</span></p>
          </div>
          <p id="live-status" class="live-status">ANALYSIERE...</p>
        </div>
      `,a.appendChild(o)}if(this.cameraStream&&this.machine.referenceImage&&a){const s=document.createElement("div");s.id="ghost-overlay-container",s.className="ghost-overlay-container",s.style.cssText=`
        position: relative;
        width: 100%;
        max-width: 300px;
        margin: 12px auto;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid var(--primary-color);
      `;const o=document.createElement("video");o.id="diagnosis-video",o.autoplay=!0,o.playsInline=!0,o.muted=!0,o.style.cssText=`
        width: 100%;
        height: auto;
        display: block;
      `,o.srcObject=this.cameraStream;const c=document.createElement("img");c.id="ghost-overlay-image",c.className="ghost-overlay-image",c.style.cssText=`
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.4;
        pointer-events: none;
        z-index: 10;
      `;const d=URL.createObjectURL(this.machine.referenceImage);c.src=d;const u=document.createElement("p");u.className="ghost-overlay-hint",u.style.cssText=`
        font-size: 0.75rem;
        color: var(--text-muted);
        text-align: center;
        margin-top: 8px;
      `,u.textContent="👻 Bewegen Sie das Handy, bis Live-Bild und Referenzbild übereinstimmen",s.appendChild(o),s.appendChild(c),a.insertBefore(s,a.firstChild),a.insertBefore(u,s.nextSibling),r.info("✅ Ghost overlay added to diagnosis modal")}}hideRecordingModal(){const e=document.getElementById("recording-modal");if(e){e.style.display="none";const t=e.querySelector(".live-display");t&&t.remove();const i=e.querySelector("#ghost-overlay-container");if(i){const a=i.querySelector("#ghost-overlay-image");a&&a.src&&URL.revokeObjectURL(a.src),i.remove()}const n=e.querySelector(".ghost-overlay-hint");n&&n.remove()}}showResults(e){const t=document.getElementById("diagnosis-modal");if(!t)return;const i=document.getElementById("machine-barcode");i&&(i.textContent=this.machine.name),document.getElementById("health-gauge-canvas")&&(this.healthGauge&&this.healthGauge.destroy(),this.healthGauge=new V("health-gauge-canvas"),this.healthGauge.draw(e.healthScore,e.status));const a=document.getElementById("result-status");if(a){const d=e.metadata?.detectedState;d&&d!=="UNKNOWN"?a.textContent=`${e.status} | ${d}`:a.textContent=e.status,a.className=`result-status status-${e.status.toLowerCase()}`}const s=document.getElementById("result-confidence");s&&(s.textContent=e.confidence.toFixed(1));const o=document.getElementById("analysis-hint");if(o)if(e.analysis?.hint)o.textContent=e.analysis.hint;else{const d=P(e.healthScore);o.textContent=d.recommendation}t.style.display="flex";const c=document.getElementById("close-diagnosis-modal");c&&(c.onclick=()=>{t.style.display="none"})}applyAppShellLayout(){const e=document.getElementById("diagnosis-modal");if(!e)return;const t=e.querySelector(".modal-content");t&&(t.classList.add("app-shell-container"),t.querySelector(".modal-header")?.classList.add("shell-header"),t.querySelector(".modal-body")?.classList.add("shell-content"),t.querySelector(".modal-actions")?.classList.add("shell-footer"))}destroy(){if(this.cleanup(),this.diagnoseButtonClickHandler){const e=document.getElementById("diagnose-btn");e&&e.removeEventListener("click",this.diagnoseButtonClickHandler),this.diagnoseButtonClickHandler=null}this.visualizer&&(this.visualizer.destroy(),this.visualizer=null),this.healthGauge&&(this.healthGauge.destroy(),this.healthGauge=null),this.scoreHistory.clear(),this.labelHistory.clear()}}const ne="zanobo-detection-mode";function $e(){try{const m=localStorage.getItem(ne);if(m==="STATIONARY"||m==="CYCLIC")return m}catch{}return"STATIONARY"}function Ne(m){try{localStorage.setItem(ne,m)}catch{}}const x={STATIONARY:{mode:"STATIONARY",name:"Level 1: Stationäre Geräusche (GMIA)",description:"Für kontinuierlich laufende Maschinen wie Ventilatoren, Pumpen, Kompressoren",icon:"📊",features:["Frequenzanalyse mit FFT","Gaussian Model für statistische Erkennung","Schnelle lokale Verarbeitung","Keine ML-Bibliothek erforderlich"]},CYCLIC:{mode:"CYCLIC",name:"Level 2: Zyklische Geräusche (ML)",description:"Für Maschinen mit wiederkehrenden Abläufen wie Verpackungsmaschinen, Montagelinien",icon:"🔄",features:["YAMNet Deep Learning Model","Referenzlauf-Vergleich","Mel-Spektrogramm Visualisierung","WebGPU-beschleunigte Inferenz"]}};class Pe{constructor(){l(this,"currentMode");l(this,"listeners",new Set);this.currentMode=$e()}getMode(){return this.currentMode}setMode(e){if(e===this.currentMode)return;const t=this.currentMode;this.currentMode=e,Ne(e),this.listeners.forEach(i=>{try{i(e,t)}catch(n){console.error("Mode change listener error:",n)}})}toggleMode(){const e=this.currentMode==="STATIONARY"?"CYCLIC":"STATIONARY";return this.setMode(e),e}onModeChange(e){return this.listeners.add(e),()=>this.listeners.delete(e)}getModeConfig(){return x[this.currentMode]}isLevel2(){return this.currentMode==="CYCLIC"}isLevel1(){return this.currentMode==="STATIONARY"}}let D=null;function N(){return D||(D=new Pe),D}class Fe{constructor(){l(this,"container",null);l(this,"modeManager",N());l(this,"onChange");this.modeManager.onModeChange((e,t)=>{r.info(`Mode changed: ${t} → ${e}`),this.updateUI()})}render(e){if(this.container=document.getElementById(e),!this.container){r.error(`Container not found: ${e}`);return}this.container.innerHTML=this.getTemplate(),this.attachEventListeners(),this.updateUI()}getTemplate(){const e=this.modeManager.getMode();return`
      <div class="mode-selector-component">
        <h3 class="mode-selector-title">🎯 Analysemodus</h3>
        <p class="mode-selector-description">
          Wählen Sie den passenden Modus für Ihre Maschine
        </p>

        <div class="mode-cards">
          ${this.renderModeCard(x.STATIONARY,e==="STATIONARY")}
          ${this.renderModeCard(x.CYCLIC,e==="CYCLIC")}
        </div>

        <div class="mode-info" id="mode-info">
          ${this.renderModeInfo(x[e])}
        </div>
      </div>
    `}renderModeCard(e,t){return`
      <label class="mode-card ${t?"selected":""}" data-mode="${e.mode}">
        <input
          type="radio"
          name="detection-mode"
          value="${e.mode}"
          ${t?"checked":""}
        >
        <div class="mode-card-icon">${e.icon}</div>
        <div class="mode-card-content">
          <strong class="mode-card-name">${e.name}</strong>
          <span class="mode-card-description">${e.description}</span>
        </div>
        <div class="mode-card-check">
          ${t?"✓":""}
        </div>
      </label>
    `}renderModeInfo(e){return`
      <div class="mode-features">
        <h4>${e.icon} Funktionen von ${e.mode==="STATIONARY"?"Level 1":"Level 2"}:</h4>
        <ul>
          ${e.features.map(t=>`<li>✓ ${t}</li>`).join("")}
        </ul>
      </div>
    `}attachEventListeners(){this.container?.querySelectorAll('input[name="detection-mode"]')?.forEach(i=>{i.addEventListener("change",n=>{const s=n.target.value;this.selectMode(s)})}),this.container?.querySelectorAll(".mode-card")?.forEach(i=>{i.addEventListener("click",()=>{const n=i.getAttribute("data-mode"),a=i.querySelector("input");a&&!a.checked&&(a.checked=!0,this.selectMode(n))})})}selectMode(e){const t=this.modeManager.getMode();if(e===t)return;this.modeManager.setMode(e);const i=x[e];p.success(`Modus geändert: ${i.name}`),this.onChange?.(e)}updateUI(){if(!this.container)return;const e=this.modeManager.getMode();this.container.querySelectorAll(".mode-card").forEach(n=>{const s=n.getAttribute("data-mode")===e;n.classList.toggle("selected",s);const o=n.querySelector(".mode-card-check");o&&(o.textContent=s?"✓":"");const c=n.querySelector("input");c&&(c.checked=s)});const i=this.container.querySelector("#mode-info");i&&(i.innerHTML=this.renderModeInfo(x[e]))}getCurrentMode(){return this.modeManager.getMode()}setOnChange(e){this.onChange=e}destroy(){this.container=null}}function qe(){if(document.getElementById("mode-selector-styles"))return;const m=document.createElement("style");m.id="mode-selector-styles",m.textContent=`
    .mode-selector-component {
      padding: 16px;
    }

    .mode-selector-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary, #1a2332);
    }

    .mode-selector-description {
      font-size: 14px;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 16px;
    }

    .mode-cards {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    @media (max-width: 600px) {
      .mode-cards {
        flex-direction: column;
      }
    }

    .mode-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border: 2px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--bg-secondary, #ffffff);
      position: relative;
    }

    .mode-card:hover {
      border-color: var(--accent-color, #00d4ff);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
    }

    .mode-card.selected {
      border-color: var(--accent-color, #00d4ff);
      background: rgba(0, 212, 255, 0.1);
    }

    .mode-card input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .mode-card-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .mode-card-content {
      text-align: center;
    }

    .mode-card-name {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #1a2332);
      margin-bottom: 4px;
    }

    .mode-card-description {
      display: block;
      font-size: 12px;
      color: var(--text-secondary, #6b7280);
      line-height: 1.4;
    }

    .mode-card-check {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--accent-color, #00d4ff);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
    }

    .mode-info {
      background: var(--bg-tertiary, #f3f4f6);
      border-radius: 8px;
      padding: 16px;
    }

    .mode-features h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary, #1a2332);
    }

    .mode-features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .mode-features li {
      font-size: 13px;
      color: var(--text-secondary, #6b7280);
      padding: 4px 0;
    }

    /* Level 2 specific styles */
    .level2-reference-phase,
    .level2-diagnose-phase {
      padding: 20px;
    }

    .phase-header {
      margin-bottom: 24px;
    }

    .phase-header h2 {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .phase-description {
      color: var(--text-secondary, #6b7280);
    }

    .machine-info {
      background: var(--bg-tertiary, #f3f4f6);
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .machine-label {
      font-size: 12px;
      color: var(--text-secondary, #6b7280);
    }

    .machine-name {
      font-weight: 600;
      margin-left: 8px;
    }

    .recording-status,
    .diagnosis-status {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--bg-secondary, #ffffff);
      border-radius: 12px;
      margin-bottom: 20px;
      border: 1px solid var(--border-color, #e5e7eb);
    }

    .status-icon {
      font-size: 32px;
    }

    .status-text {
      font-size: 16px;
      color: var(--text-primary, #1a2332);
    }

    .progress-container {
      margin-bottom: 20px;
    }

    .progress-bar {
      height: 8px;
      background: var(--bg-tertiary, #e5e7eb);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background: var(--accent-color, #00d4ff);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 12px;
      color: var(--text-secondary, #6b7280);
    }

    .timer-display {
      text-align: center;
      padding: 20px;
      background: var(--bg-tertiary, #f3f4f6);
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .timer-value {
      font-size: 48px;
      font-weight: bold;
      color: var(--accent-color, #00d4ff);
    }

    .timer-unit {
      display: block;
      font-size: 14px;
      color: var(--text-secondary, #6b7280);
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .btn-large {
      padding: 16px 32px;
      font-size: 16px;
    }

    .info-box {
      background: rgba(0, 212, 255, 0.1);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .info-box h4 {
      margin-bottom: 8px;
      color: var(--text-primary, #1a2332);
    }

    .info-box ul {
      margin: 0;
      padding-left: 20px;
    }

    .info-box li {
      font-size: 14px;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 4px;
    }

    .backend-info {
      text-align: center;
      padding: 8px;
      color: var(--text-secondary, #6b7280);
    }

    .similarity-container {
      margin-bottom: 20px;
    }

    .similarity-label {
      font-size: 14px;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 8px;
    }

    .similarity-meter {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .meter-bar {
      flex: 1;
      height: 24px;
      background: var(--bg-tertiary, #e5e7eb);
      border-radius: 12px;
      overflow: hidden;
    }

    .meter-fill {
      height: 100%;
      border-radius: 12px;
      transition: width 0.5s ease-out;
    }

    .meter-value {
      font-size: 24px;
      font-weight: bold;
      min-width: 80px;
      text-align: right;
    }

    .health-status {
      margin-bottom: 20px;
    }

    .health-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }

    .health-message {
      font-size: 18px;
      font-weight: 600;
    }

    .spectrogram-container {
      margin-bottom: 20px;
    }

    .spectrogram-container h4 {
      margin-bottom: 12px;
    }

    #spectrogram-canvas {
      width: 100%;
      max-width: 600px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
    }

    .result-details {
      background: var(--bg-secondary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 16px;
    }

    .result-details h4 {
      margin-bottom: 12px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 12px;
      color: var(--text-secondary, #6b7280);
    }

    .detail-value {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary, #1a2332);
    }
  `,document.head.appendChild(m)}class Oe{constructor(){l(this,"modeSelector",null);l(this,"unsubscribeModeChange")}init(){const e=document.getElementById("export-data-btn");e&&e.addEventListener("click",()=>this.handleExportData());const t=document.getElementById("import-data-btn");t&&t.addEventListener("click",()=>this.handleImportData());const i=document.getElementById("clear-data-btn");i&&i.addEventListener("click",()=>this.handleClearData());const n=document.getElementById("show-stats-btn");n&&n.addEventListener("click",()=>this.showStats()),this.initVisualizerScaleSettings(),this.initModeSelector(),this.showStats()}initModeSelector(){qe(),this.modeSelector=new Fe,this.modeSelector.render("analysis-mode-selector");const e=N();this.unsubscribeModeChange=e.onModeChange(t=>{this.updateModeVisibility(t)}),this.updateModeVisibility(e.getMode()),r.info("🎛️ Mode selector initialized")}updateModeVisibility(e){document.body.setAttribute("data-detection-mode",e);const t=document.getElementById("mode-settings-info");t&&t.querySelectorAll("[data-detection-mode]").forEach(n=>{const a=n.getAttribute("data-detection-mode");n.style.display=a===e?"flex":"none"}),r.debug(`Mode visibility updated: ${e}`)}initVisualizerScaleSettings(){const e=document.getElementById("frequency-scale-toggle"),t=document.getElementById("amplitude-scale-toggle");if(!e&&!t)return;const i=X();e&&(e.checked=i.frequencyScale==="log",e.addEventListener("change",()=>{W({frequencyScale:e.checked?"log":"linear"})})),t&&(t.checked=i.amplitudeScale==="log",t.addEventListener("change",()=>{W({amplitudeScale:t.checked?"log":"linear"})}))}async handleExportData(){try{r.info("📦 Exporting database...");const e=await he(),t=JSON.stringify(e,null,2),i=new Blob([t],{type:"application/json"}),a=`zanobot-backup-${new Date().toISOString().replace(/[:.]/g,"-").slice(0,-5)}.json`,s=URL.createObjectURL(i),o=document.createElement("a");o.href=s,o.download=a,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(s),r.info(`✅ Database exported: ${a}`),p.success(`Datei: ${a}

Maschinen: ${e.machines.length}
Aufnahmen: ${e.recordings.length}
Diagnosen: ${e.diagnoses.length}`,{title:"Datenbank exportiert"})}catch(e){r.error("Export error:",e),p.error("Fehler beim Exportieren der Datenbank",e)}}async handleImportData(){try{const e=document.createElement("input");e.type="file",e.accept="application/json,.json",e.onchange=async t=>{const n=t.target.files?.[0];if(n){r.info(`📥 Importing database from: ${n.name}`);try{const a=await n.text(),s=JSON.parse(a);if(!s.machines&&!s.recordings&&!s.diagnoses)throw new Error("Invalid backup file format");const o=confirm(`Datenbank importieren aus: ${n.name}

Möchten Sie die Daten ZUSAMMENFÜHREN?

JA = Zusammenführen mit bestehenden Daten
NEIN = Alle bestehenden Daten ERSETZEN`);if(!o&&!confirm(`⚠️ ACHTUNG!

Alle bestehenden Daten werden GELÖSCHT und durch die Import-Daten ersetzt!

Möchten Sie fortfahren?`))return;await ue(s,o);const c={machines:s.machines?.length||0,recordings:s.recordings?.length||0,diagnoses:s.diagnoses?.length||0};p.success(`Maschinen: ${c.machines}
Aufnahmen: ${c.recordings}
Diagnosen: ${c.diagnoses}

Modus: ${o?"Zusammengeführt":"Ersetzt"}`,{title:"Datenbank importiert"}),this.showStats(),r.info("✅ Database import complete")}catch(a){r.error("Import error:",a),p.error("Fehler beim Importieren",a,{duration:0})}}},e.click()}catch(e){r.error("Import setup error:",e),p.error("Fehler beim Vorbereiten des Imports",e)}}async handleClearData(){if(!(!confirm(`⚠️ ACHTUNG!

Alle Daten werden UNWIDERRUFLICH gelöscht:
- Alle Maschinen
- Alle Referenzmodelle
- Alle Aufnahmen
- Alle Diagnosen

Möchten Sie fortfahren?`)||!confirm(`Sind Sie ABSOLUT SICHER?

Diese Aktion kann NICHT rückgängig gemacht werden!`)))try{r.info("🗑️ Clearing all data..."),await me(),p.success("Alle Daten wurden gelöscht",{title:"Datenbank geleert"}),this.showStats(),r.info("✅ All data cleared")}catch(i){r.error("Clear error:",i),p.error("Fehler beim Löschen der Daten",i,{duration:0})}}async showStats(){try{const e=await j(),t=document.getElementById("stats-machines"),i=document.getElementById("stats-recordings"),n=document.getElementById("stats-diagnoses");t&&(t.textContent=e.machines.toString()),i&&(i.textContent=e.recordings.toString()),n&&(n.textContent=e.diagnoses.toString()),r.debug("📊 Database stats:",e)}catch(e){r.error("Stats error:",e)}}destroy(){this.modeSelector&&(this.modeSelector.destroy(),this.modeSelector=null),this.unsubscribeModeChange&&(this.unsubscribeModeChange(),this.unsubscribeModeChange=void 0)}}class Ue{constructor(e,t){l(this,"machine");l(this,"detector");l(this,"selectedDeviceId");l(this,"state","idle");l(this,"mediaRecorder",null);l(this,"audioChunks",[]);l(this,"recordingDuration",1e4);l(this,"cameraStream",null);l(this,"capturedReferenceImage",null);l(this,"container",null);l(this,"statusElement",null);l(this,"progressElement",null);l(this,"startButton",null);l(this,"timerElement",null);l(this,"onComplete");l(this,"onError");this.machine=e,this.selectedDeviceId=t,this.detector=new Q({onProgress:(i,n)=>this.updateProgress(i,n),onError:i=>this.handleError(i),onReferenceCreated:i=>this.handleReferenceCreated(i)}),r.info("🔄 Level2ReferencePhase initialized for machine:",e.id)}async initialize(){try{this.setState("processing"),this.updateProgress(0,"Initialisiere ML-Modell..."),await this.detector.initialize(),this.setState("idle")}catch(e){this.handleError(e)}}render(e){if(this.container=document.getElementById(e),!this.container){r.error(`Container element not found: ${e}`);return}this.container.innerHTML=this.getTemplate(),this.bindElements(),this.attachEventListeners()}getTemplate(){return`
      <div class="level2-reference-phase">
        <div class="phase-header">
          <h2>🔄 Level 2: Referenzlauf (ML)</h2>
          <p class="phase-description">
            Nehmen Sie einen Referenzlauf Ihrer Maschine im Normalzustand auf.
            Diese Aufnahme wird verwendet, um zukünftige Abweichungen zu erkennen.
          </p>
        </div>

        <div class="machine-info">
          <span class="machine-label">Maschine:</span>
          <span class="machine-name">${this.machine.name}</span>
        </div>

        <div class="recording-status" id="level2-status">
          <div class="status-icon">🎤</div>
          <div class="status-text">Bereit für Aufnahme</div>
        </div>

        <div class="progress-container" id="level2-progress" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-text">0%</div>
        </div>

        <div class="timer-display" id="level2-timer" style="display: none;">
          <span class="timer-value">10</span>
          <span class="timer-unit">Sekunden</span>
        </div>

        <!-- VISUAL POSITIONING: Camera preview for reference image -->
        <div class="camera-preview-container" id="level2-camera-container" style="display: none;">
          <video id="level2-camera-preview" autoplay playsinline muted></video>
          <p class="camera-hint">📷 Position für Referenzbild - halten Sie das Gerät ruhig</p>
        </div>

        <div class="action-buttons">
          <button id="level2-start-btn" class="btn btn-primary btn-large">
            🎤 Referenz aufnehmen
          </button>
        </div>

        <div class="info-box">
          <h4>ℹ️ Hinweise für gute Aufnahmen:</h4>
          <ul>
            <li>Stellen Sie sicher, dass die Maschine im Normalzustand läuft</li>
            <li>Halten Sie das Mikrofon konstant in Position</li>
            <li>Vermeiden Sie Störgeräusche während der Aufnahme</li>
            <li>Die Aufnahme dauert 10 Sekunden</li>
          </ul>
        </div>

        <div class="backend-info" id="level2-backend-info"></div>
      </div>
    `}bindElements(){this.statusElement=this.container?.querySelector("#level2-status")||null,this.progressElement=this.container?.querySelector("#level2-progress")||null,this.startButton=this.container?.querySelector("#level2-start-btn")||null,this.timerElement=this.container?.querySelector("#level2-timer")||null;const e=this.container?.querySelector("#level2-backend-info");if(e&&this.detector.isReady()){const t=this.detector.getBackendInfo();e.innerHTML=`
        <small>Backend: ${t?.backend||"nicht geladen"} ${t?.isGPU?"(GPU)":"(CPU)"}</small>
      `}}attachEventListeners(){this.startButton?.addEventListener("click",()=>this.startRecording())}async startRecording(){if(this.state==="idle")try{this.setState("countdown"),this.updateStatus("🎤 Aufnahme startet...","info");const e=await navigator.mediaDevices.getUserMedia({audio:{deviceId:this.selectedDeviceId?{exact:this.selectedDeviceId}:void 0,echoCancellation:!1,noiseSuppression:!1,autoGainControl:!1}});try{this.cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:!1}),r.info("📷 Camera access granted for reference image"),this.setupCameraPreview()}catch(i){r.warn("⚠️ Camera access denied - continuing without reference image",i),this.cameraStream=null}await this.countdown(3),this.setState("recording"),this.audioChunks=[],this.mediaRecorder=new MediaRecorder(e),this.mediaRecorder.ondataavailable=i=>{i.data.size>0&&this.audioChunks.push(i.data)},this.mediaRecorder.onstop=async()=>{e.getTracks().forEach(i=>i.stop()),this.cleanupCamera(),await this.processRecording()},this.showTimer(this.recordingDuration/1e3),this.mediaRecorder.start(),this.updateStatus("🔴 Aufnahme läuft...","recording");const t=this.recordingDuration/2;setTimeout(()=>{this.captureReferenceSnapshot()},t),setTimeout(()=>{this.mediaRecorder?.state==="recording"&&this.mediaRecorder.stop()},this.recordingDuration)}catch(e){this.handleError(e)}}setupCameraPreview(){const e=this.container?.querySelector("#level2-camera-container"),t=this.container?.querySelector("#level2-camera-preview");!e||!t||!this.cameraStream||(t.srcObject=this.cameraStream,e.style.display="block",r.info("📷 Camera preview activated"))}captureReferenceSnapshot(){if(!this.cameraStream){r.info("📷 No camera stream - skipping reference snapshot");return}const e=this.container?.querySelector("#level2-camera-preview");if(!e||e.readyState<2){r.warn("⚠️ Video element not ready - skipping snapshot");return}try{const t=document.createElement("canvas");t.width=e.videoWidth,t.height=e.videoHeight;const i=t.getContext("2d");if(!i)return;i.drawImage(e,0,0),t.toBlob(n=>{n&&(this.capturedReferenceImage=n,r.info(`📸 Reference snapshot captured: ${n.size} bytes (${t.width}x${t.height})`))},"image/jpeg",.85)}catch(t){r.warn("⚠️ Failed to capture snapshot:",t)}}cleanupCamera(){const e=this.container?.querySelector("#level2-camera-container");e&&(e.style.display="none"),this.cameraStream&&(this.cameraStream.getTracks().forEach(t=>t.stop()),this.cameraStream=null),r.info("📷 Camera cleaned up")}async countdown(e){for(let t=e;t>0;t--)this.updateStatus(`⏱️ Aufnahme startet in ${t}...`,"countdown"),await this.sleep(1e3)}showTimer(e){if(!this.timerElement)return;this.timerElement.style.display="block";const t=this.timerElement.querySelector(".timer-value");let i=e;const n=setInterval(()=>{i--,t&&(t.textContent=String(i)),i<=0&&(clearInterval(n),this.timerElement.style.display="none")},1e3)}async processRecording(){this.setState("processing"),this.updateStatus("🔄 Verarbeite Aufnahme...","processing"),this.showProgress();try{const t=await new Blob(this.audioChunks,{type:"audio/webm"}).arrayBuffer(),i=new AudioContext,n=await i.decodeAudioData(t);i.close(),await this.detector.createReference(n,this.machine.id,"Baseline")}catch(e){this.handleError(e)}}async handleReferenceCreated(e){this.setState("complete"),this.updateStatus("✅ Referenz erfolgreich erstellt!","success"),this.hideProgress(),await this.saveReferenceImage(),p.success("Level 2 Referenz wurde gespeichert"),this.startButton&&(this.startButton.textContent="✅ Referenz erstellt",this.startButton.disabled=!0),this.onComplete?.(e),r.info("✅ Level 2 reference created:",{machineId:e.machineId,duration:e.duration,embeddingSize:e.embedding.length,hasReferenceImage:!!this.capturedReferenceImage})}async saveReferenceImage(){if(!this.capturedReferenceImage){r.info("📷 No reference image to save");return}try{const e=await I(this.machine.id);if(!e){r.warn("⚠️ Machine not found for image save");return}e.referenceImage=this.capturedReferenceImage,await L(e),this.machine=e,r.info(`📸 Reference image saved to machine (${this.capturedReferenceImage.size} bytes)`)}catch(e){r.error("❌ Failed to save reference image:",e)}}handleError(e){this.setState("error"),this.updateStatus(`❌ Fehler: ${e.message}`,"error"),this.hideProgress(),p.error(e.message,e),this.startButton&&(this.startButton.textContent="🎤 Referenz aufnehmen",this.startButton.disabled=!1),this.onError?.(e),r.error("Level 2 Reference error:",e)}updateStatus(e,t){if(!this.statusElement)return;const i={info:"🎤",recording:"🔴",processing:"🔄",success:"✅",error:"❌",countdown:"⏱️"},n=this.statusElement.querySelector(".status-text"),a=this.statusElement.querySelector(".status-icon");n&&(n.textContent=e),a&&(a.textContent=i[t]||"🎤"),this.statusElement.className=`recording-status status-${t}`}updateProgress(e,t){if(!this.progressElement)return;const i=this.progressElement.querySelector(".progress-fill"),n=this.progressElement.querySelector(".progress-text");i&&(i.style.width=`${e}%`),n&&(n.textContent=t)}showProgress(){this.progressElement&&(this.progressElement.style.display="block")}hideProgress(){this.progressElement&&(this.progressElement.style.display="none")}setState(e){this.state=e,this.startButton&&(this.startButton.disabled=e!=="idle"&&e!=="complete"&&e!=="error")}sleep(e){return new Promise(t=>setTimeout(t,e))}setOnComplete(e){this.onComplete=e}setOnError(e){this.onError=e}destroy(){this.mediaRecorder?.state==="recording"&&this.mediaRecorder.stop(),this.cleanupCamera(),this.capturedReferenceImage=null,this.detector.dispose(),this.container=null,r.info("🧹 Level2ReferencePhase destroyed")}}class He{constructor(e,t){l(this,"machine");l(this,"detector");l(this,"specGen");l(this,"selectedDeviceId");l(this,"state","idle");l(this,"mediaRecorder",null);l(this,"audioChunks",[]);l(this,"recordingDuration",1e4);l(this,"lastResult",null);l(this,"cameraStream",null);l(this,"audioStream",null);l(this,"audioContext",null);l(this,"analyserNode",null);l(this,"waterfallCanvas",null);l(this,"waterfallCtx",null);l(this,"waterfallAnimationId",null);l(this,"waterfallData",[]);l(this,"waterfallStartTime",0);l(this,"container",null);l(this,"statusElement",null);l(this,"resultElement",null);l(this,"spectrogramCanvas",null);l(this,"startButton",null);l(this,"similarityMeter",null);l(this,"onComplete");l(this,"onError");this.machine=e,this.selectedDeviceId=t,this.specGen=new Ee,this.detector=new Q({onProgress:(i,n)=>this.updateProgress(i,n),onError:i=>this.handleError(i),onAnalysisComplete:i=>this.handleAnalysisComplete(i)}),r.info("🔍 Level2DiagnosePhase initialized for machine:",e.id)}async initialize(){try{this.setState("loading-reference"),await this.detector.initialize(),await this.detector.loadReferenceFromStorage(this.machine.id)?(this.setState("idle"),this.updateStatus("✅ Referenz geladen. Bereit für Diagnose.","ready")):(this.setState("no-reference"),this.updateStatus("⚠️ Keine Referenz vorhanden. Bitte zuerst Referenz erstellen.","warning"))}catch(e){this.handleError(e)}}render(e){if(this.container=document.getElementById(e),!this.container){r.error(`Container element not found: ${e}`);return}this.container.innerHTML=this.getTemplate(),this.bindElements(),this.attachEventListeners()}getTemplate(){return`
      <div class="level2-diagnose-phase">
        <div class="phase-header">
          <h2>🔍 Level 2: Maschine prüfen (ML)</h2>
          <p class="phase-description">
            Vergleichen Sie den aktuellen Maschinenzustand mit der Referenz.
          </p>
        </div>

        <div class="machine-info">
          <span class="machine-label">Maschine:</span>
          <span class="machine-name">${this.machine.name}</span>
        </div>

        <div class="diagnosis-status" id="level2-diag-status">
          <div class="status-icon">🔍</div>
          <div class="status-text">Initialisiere...</div>
        </div>

        <!-- VISUAL POSITIONING: Ghost overlay container (hidden initially) -->
        <div class="ghost-overlay-container" id="level2-ghost-container" style="display: none;">
          <div class="ghost-overlay-wrapper">
            <video id="level2-live-video" autoplay playsinline muted></video>
            <img id="level2-ghost-image" class="ghost-overlay-image" alt="Reference position" />
          </div>
          <p class="ghost-hint">👻 Bewegen Sie das Handy, bis Live-Bild und Referenzbild übereinstimmen</p>
        </div>

        <!-- LIVE WATERFALL: Real-time spectrogram during recording -->
        <div class="waterfall-container" id="level2-waterfall-container" style="display: none;">
          <h4>🌊 Live-Aufnahme</h4>
          <canvas id="level2-waterfall-canvas" width="400" height="150"></canvas>
          <div class="waterfall-time-indicator">
            <span id="waterfall-elapsed">0</span>s / 10s
          </div>
        </div>

        <div class="similarity-container" id="level2-similarity" style="display: none;">
          <div class="similarity-label">Übereinstimmung mit Referenz</div>
          <div class="similarity-meter">
            <div class="meter-bar">
              <div class="meter-fill" id="similarity-fill" style="width: 0%"></div>
            </div>
            <div class="meter-value" id="similarity-value">0%</div>
          </div>
        </div>

        <!-- TRAFFIC LIGHT: Enhanced health status display -->
        <div class="traffic-light-status" id="level2-traffic-light" style="display: none;">
          <div class="traffic-light">
            <div class="light red" id="light-red"></div>
            <div class="light yellow" id="light-yellow"></div>
            <div class="light green" id="light-green"></div>
          </div>
          <div class="traffic-light-info">
            <div class="traffic-light-label" id="traffic-light-label">-</div>
            <div class="traffic-light-score" id="traffic-light-score">-</div>
          </div>
        </div>

        <div class="health-status" id="level2-health-status" style="display: none;">
          <div class="health-icon"></div>
          <div class="health-message"></div>
        </div>

        <div class="spectrogram-container" id="level2-spectrogram" style="display: none;">
          <h4>📊 Spektrogramm (Analyse)</h4>
          <canvas id="spectrogram-canvas" width="600" height="200"></canvas>
        </div>

        <div class="action-buttons">
          <button id="level2-diag-btn" class="btn btn-primary btn-large" disabled>
            🔍 Maschine prüfen
          </button>
        </div>

        <div class="result-details" id="level2-result-details" style="display: none;">
          <h4>📊 Analyseergebnis</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Ähnlichkeit:</span>
              <span class="detail-value" id="detail-similarity">-</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status:</span>
              <span class="detail-value" id="detail-status">-</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Analysezeit:</span>
              <span class="detail-value" id="detail-time">-</span>
            </div>
          </div>
        </div>

        <div class="backend-info" id="level2-diag-backend-info"></div>
      </div>
    `}bindElements(){this.statusElement=this.container?.querySelector("#level2-diag-status")||null,this.resultElement=this.container?.querySelector("#level2-result-details")||null,this.startButton=this.container?.querySelector("#level2-diag-btn")||null,this.similarityMeter=this.container?.querySelector("#level2-similarity")||null,this.spectrogramCanvas=this.container?.querySelector("#spectrogram-canvas")||null,this.waterfallCanvas=this.container?.querySelector("#level2-waterfall-canvas")||null,this.waterfallCanvas&&(this.waterfallCtx=this.waterfallCanvas.getContext("2d"));const e=this.container?.querySelector("#level2-diag-backend-info");if(e&&this.detector.isReady()){const t=this.detector.getBackendInfo();e.innerHTML=`
        <small>Backend: ${t?.backend||"nicht geladen"} ${t?.isGPU?"(GPU)":"(CPU)"}</small>
      `}}attachEventListeners(){this.startButton?.addEventListener("click",()=>this.startDiagnosis())}async startDiagnosis(){if(!(this.state!=="idle"&&this.state!=="complete")){if(!this.detector.hasLoadedReference()){p.error("Keine Referenz vorhanden. Bitte zuerst Referenz erstellen.");return}try{this.setState("recording"),this.updateStatus("🎤 Aufnahme läuft...","recording");const e=await I(this.machine.id);e&&(this.machine=e),this.audioStream=await navigator.mediaDevices.getUserMedia({audio:{deviceId:this.selectedDeviceId?{exact:this.selectedDeviceId}:void 0,echoCancellation:!1,noiseSuppression:!1,autoGainControl:!1}});try{this.cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:!1}),r.info("📷 Camera access granted for ghost overlay"),this.setupGhostOverlay()}catch{r.warn("⚠️ Camera access denied - continuing without ghost overlay"),this.cameraStream=null}this.audioContext=new AudioContext,this.analyserNode=this.audioContext.createAnalyser(),this.analyserNode.fftSize=256,this.analyserNode.smoothingTimeConstant=.7,this.audioContext.createMediaStreamSource(this.audioStream).connect(this.analyserNode),this.startWaterfallVisualization(),this.audioChunks=[],this.mediaRecorder=new MediaRecorder(this.audioStream),this.mediaRecorder.ondataavailable=i=>{i.data.size>0&&this.audioChunks.push(i.data)},this.mediaRecorder.onstop=async()=>{this.cleanupAudioStream(),this.stopWaterfallVisualization(),this.cleanupCameraStream(),await this.processRecording()},this.mediaRecorder.start(),this.showRecordingTimer(this.recordingDuration/1e3),setTimeout(()=>{this.mediaRecorder?.state==="recording"&&this.mediaRecorder.stop()},this.recordingDuration)}catch(e){this.handleError(e)}}}setupGhostOverlay(){const e=this.container?.querySelector("#level2-ghost-container"),t=this.container?.querySelector("#level2-live-video"),i=this.container?.querySelector("#level2-ghost-image");if(!(!e||!t||!i)){if(this.cameraStream&&(t.srcObject=this.cameraStream),this.machine.referenceImage){const n=URL.createObjectURL(this.machine.referenceImage);i.src=n,i.onload=()=>{}}e.style.display="block",r.info("✅ Ghost overlay activated")}}cleanupAudioStream(){this.audioStream&&(this.audioStream.getTracks().forEach(e=>e.stop()),this.audioStream=null,r.debug("🎤 Audio stream released - microphone is now available for other apps"))}cleanupCameraStream(){this.cameraStream&&(this.cameraStream.getTracks().forEach(i=>i.stop()),this.cameraStream=null);const e=this.container?.querySelector("#level2-ghost-container");e&&(e.style.display="none");const t=this.container?.querySelector("#level2-ghost-image");t&&t.src&&(URL.revokeObjectURL(t.src),t.src="")}startWaterfallVisualization(){const e=this.container?.querySelector("#level2-waterfall-container");e&&(e.style.display="block"),this.waterfallData=[],this.waterfallStartTime=Date.now();const t=()=>{if(!this.analyserNode||!this.waterfallCanvas||!this.waterfallCtx)return;const i=this.analyserNode.frequencyBinCount,n=new Uint8Array(i);this.analyserNode.getByteFrequencyData(n);const a=Array.from(n).map(d=>d/255);this.waterfallData.push(a);const s=this.waterfallCanvas.width;this.waterfallData.length>s&&this.waterfallData.shift(),this.renderWaterfall();const o=Math.floor((Date.now()-this.waterfallStartTime)/1e3),c=this.container?.querySelector("#waterfall-elapsed");c&&(c.textContent=o.toString()),this.waterfallAnimationId=requestAnimationFrame(t)};t()}renderWaterfall(){if(!this.waterfallCanvas||!this.waterfallCtx||this.waterfallData.length===0)return;const e=this.waterfallCtx,t=this.waterfallCanvas.width,i=this.waterfallCanvas.height;e.fillStyle="#1a1a2e",e.fillRect(0,0,t,i);const n=Math.max(1,Math.floor(t/(this.recordingDuration/1e3*30))),a=this.waterfallData.length;for(let c=0;c<a;c++){const d=this.waterfallData[c],u=c*n;for(let g=0;g<d.length;g++){const y=d[g],v=i-g/d.length*i,h=i/d.length,f=this.getWaterfallColor(y);e.fillStyle=f,e.fillRect(u,v-h,n,h)}}const s=(Date.now()-this.waterfallStartTime)/this.recordingDuration,o=Math.min(s*t,t-2);e.strokeStyle="#00f3ff",e.lineWidth=2,e.beginPath(),e.moveTo(o,0),e.lineTo(o,i),e.stroke()}getWaterfallColor(e){const t=Math.max(0,Math.min(1,e));if(t<.2){const i=t/.2;return`rgb(${Math.floor(20+20*i)}, ${Math.floor(10+30*i)}, ${Math.floor(60+40*i)})`}else if(t<.4){const i=(t-.2)/.2;return`rgb(${Math.floor(40*(1-i))}, ${Math.floor(40+180*i)}, ${Math.floor(100+155*i)})`}else if(t<.6){const i=(t-.4)/.2;return`rgb(${Math.floor(100*i)}, ${Math.floor(220-20*i)}, ${Math.floor(255-155*i)})`}else if(t<.8){const i=(t-.6)/.2;return`rgb(${Math.floor(100+155*i)}, ${Math.floor(200+55*i)}, ${Math.floor(100-100*i)})`}else{const i=(t-.8)/.2;return`rgb(255, ${Math.floor(255-200*i)}, ${Math.floor(i*50)})`}}stopWaterfallVisualization(){this.waterfallAnimationId&&(cancelAnimationFrame(this.waterfallAnimationId),this.waterfallAnimationId=null),this.audioContext&&this.audioContext.state!=="closed"&&(this.audioContext.close(),this.audioContext=null),this.analyserNode=null;const e=this.container?.querySelector("#level2-waterfall-container");e&&(e.style.display="none")}showRecordingTimer(e){let t=e;const i=setInterval(()=>{t--,this.updateStatus(`🔴 Aufnahme läuft... (${t}s)`,"recording"),t<=0&&clearInterval(i)},1e3)}async processRecording(){this.setState("analyzing"),this.updateStatus("🔄 Analysiere Aufnahme...","analyzing");try{const t=await new Blob(this.audioChunks,{type:"audio/webm"}).arrayBuffer(),i=new AudioContext,n=await i.decodeAudioData(t);i.close(),await this.detector.analyzeAudio(n)}catch(e){this.handleError(e)}}async handleAnalysisComplete(e){this.lastResult=e,this.setState("complete"),this.updateSimilarityMeter(e.percentage),this.updateHealthStatus(e.status),this.updateTrafficLight(e.percentage,e.status),this.renderSpectrogram(e.spectrogram),this.showResultDetails(e),this.updateStatus(`✅ Analyse abgeschlossen: ${e.percentage.toFixed(1)}%`,"complete"),e.status.status==="HEALTHY"?p.success(e.status.message):e.status.status==="WARNING"?p.warning(e.status.message):p.error(e.status.message),await this.saveDiagnosisResult(e),this.onComplete?.(e),r.info("✅ Level 2 analysis complete:",{similarity:e.percentage,status:e.status.status,analysisTime:e.analysisTime})}async saveDiagnosisResult(e){try{const t={HEALTHY:"healthy",WARNING:"uncertain",CRITICAL:"faulty"},i={id:`diag-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,machineId:this.machine.id,timestamp:e.timestamp,healthScore:e.percentage,status:t[e.status.status]||"uncertain",confidence:e.similarity*100,rawCosineSimilarity:e.similarity,metadata:{analysisMethod:"YAMNet",level:2,analysisTime:e.analysisTime,statusMessage:e.status.message}};await G(i),r.info("💾 Level 2 diagnosis saved to database"),p.info("Diagnose gespeichert")}catch(t){r.error("❌ Failed to save diagnosis:",t),p.error("Diagnose konnte nicht gespeichert werden")}}updateTrafficLight(e,t){const i=this.container?.querySelector("#level2-traffic-light");if(!i)return;i.style.display="flex";const n=this.container?.querySelector("#light-red"),a=this.container?.querySelector("#light-yellow"),s=this.container?.querySelector("#light-green"),o=this.container?.querySelector("#traffic-light-label"),c=this.container?.querySelector("#traffic-light-score");[n,a,s].forEach(d=>{d&&d.classList.remove("active")}),t.status==="HEALTHY"?(s?.classList.add("active"),o&&(o.textContent="GESUND",o.style.color="#10b981")):t.status==="WARNING"?(a?.classList.add("active"),o&&(o.textContent="WARNUNG",o.style.color="#f59e0b")):(n?.classList.add("active"),o&&(o.textContent="KRITISCH",o.style.color="#ef4444")),c&&(c.textContent=`${e.toFixed(1)}%`,c.style.color=t.color)}updateSimilarityMeter(e){if(!this.similarityMeter)return;this.similarityMeter.style.display="block";const t=document.getElementById("similarity-fill"),i=document.getElementById("similarity-value");t&&(t.style.width=`${e}%`,t.style.transition="width 0.5s ease-out",e>=85?t.style.background="linear-gradient(to right, #10b981, #34d399)":e>=70?t.style.background="linear-gradient(to right, #f59e0b, #fbbf24)":t.style.background="linear-gradient(to right, #ef4444, #f87171)"),i&&(i.textContent=`${e.toFixed(1)}%`)}updateHealthStatus(e){const t=this.container?.querySelector("#level2-health-status");if(!t)return;t.style.display="block",t.style.backgroundColor=e.color,t.style.padding="20px",t.style.borderRadius="12px",t.style.textAlign="center",t.style.color="white";const i=t.querySelector(".health-icon"),n=t.querySelector(".health-message");i&&(i.textContent=e.icon),n&&(n.textContent=e.message)}renderSpectrogram(e){const t=this.container?.querySelector("#level2-spectrogram");!t||!this.spectrogramCanvas||(t.style.display="block",this.specGen.renderToCanvas(e,this.spectrogramCanvas))}showResultDetails(e){if(!this.resultElement)return;this.resultElement.style.display="block";const t=document.getElementById("detail-similarity"),i=document.getElementById("detail-status"),n=document.getElementById("detail-time");t&&(t.textContent=`${e.percentage.toFixed(1)}%`),i&&(i.textContent=e.status.status,i.style.color=e.status.color),n&&(n.textContent=`${e.analysisTime.toFixed(0)} ms`)}updateStatus(e,t){if(!this.statusElement)return;const i={ready:"✅",recording:"🔴",analyzing:"🔄",complete:"✅",error:"❌",warning:"⚠️"},n=this.statusElement.querySelector(".status-text"),a=this.statusElement.querySelector(".status-icon");n&&(n.textContent=e),a&&(a.textContent=i[t]||"🔍"),this.statusElement.className=`diagnosis-status status-${t}`}updateProgress(e,t){}handleError(e){this.setState("error"),this.updateStatus(`❌ Fehler: ${e.message}`,"error"),p.error(e.message,e),this.startButton&&(this.startButton.textContent="🔍 Maschine prüfen",this.startButton.disabled=!1),this.onError?.(e),r.error("Level 2 Diagnose error:",e)}setState(e){this.state=e,this.startButton&&(this.startButton.disabled=e!=="idle",e==="complete"&&(this.startButton.textContent="🔍 Erneut prüfen",this.startButton.disabled=!1))}async reloadReference(){try{return this.setState("loading-reference"),this.updateStatus("🔄 Lade neue Referenz...","loading"),await this.detector.loadReferenceFromStorage(this.machine.id)?(this.setState("idle"),this.updateStatus("✅ Neue Referenz geladen. Bereit für Diagnose.","ready"),r.info("✅ Level2DiagnosePhase: Reference reloaded successfully"),!0):(this.setState("no-reference"),this.updateStatus("⚠️ Keine Referenz vorhanden. Bitte zuerst Referenz erstellen.","warning"),!1)}catch(e){return r.error("❌ Error reloading reference:",e),this.handleError(e),!1}}setOnComplete(e){this.onComplete=e}setOnError(e){this.onError=e}getLastResult(){return this.lastResult}destroy(){this.mediaRecorder?.state==="recording"&&this.mediaRecorder.stop(),this.cleanupAudioStream(),this.stopWaterfallVisualization(),this.cleanupCameraStream(),this.detector.dispose(),this.container=null,r.info("🧹 Level2DiagnosePhase destroyed")}}class We{constructor(){l(this,"currentMachine",null);l(this,"identifyPhase");l(this,"settingsPhase");l(this,"referencePhase",null);l(this,"diagnosePhase",null);l(this,"level2ReferencePhase",null);l(this,"level2DiagnosePhase",null);l(this,"modeManager",N());l(this,"unsubscribeModeChange");this.identifyPhase=new Ae(e=>this.onMachineSelected(e)),this.identifyPhase.init(),this.settingsPhase=new Oe,this.settingsPhase.init(),this.lockPhases(),this.updateModeVisibility(this.modeManager.getMode()),this.unsubscribeModeChange=this.modeManager.onModeChange((e,t)=>{r.info(`🔄 Detection mode changed: ${t} → ${e}`),this.handleModeChange(e)})}onMachineSelected(e){r.info(`🤖 Machine selected: ${e.name} (${e.id})`),r.debug("🎯 Machine Selection Debug:",{machineId:e.id,machineName:e.name,createdAt:new Date(e.createdAt).toLocaleString(),numModels:e.referenceModels?.length||0,models:e.referenceModels?.map(t=>({label:t.label,trainingDate:new Date(t.trainingDate).toLocaleString(),weightMagnitude:t.metadata?.weightMagnitude?.toFixed(6)||"N/A"}))||[]}),this.identifyPhase.cleanup(),this.currentMachine=e,this.updateMachineDisplay(e),this.unlockPhases(),this.collapseSection("select-machine-content"),this.initializePhases(e)}initializePhases(e){this.cleanupAllPhases();const t=this.identifyPhase.getSelectedDeviceId();r.info(`📱 Using microphone device: ${t||"default"}`);const i=this.modeManager.getMode();r.info(`🎯 Initializing phases for mode: ${i}`),i==="STATIONARY"?this.initializeLevel1Phases(e,t):this.initializeLevel2Phases(e,t),this.updateModeVisibility(i)}initializeLevel1Phases(e,t){r.info("📊 Initializing Level 1 (GMIA) phases"),this.referencePhase=new Te(e,t),this.referencePhase.init(),this.diagnosePhase=new ze(e,t),this.diagnosePhase.init(),this.referencePhase.setOnMachineUpdated(i=>{this.diagnosePhase&&this.diagnosePhase.setMachine(i),this.updateMachineDisplay(i)})}async initializeLevel2Phases(e,t){r.info("🔄 Initializing Level 2 (YAMNet) phases"),this.level2ReferencePhase=new Ue(e,t),this.level2DiagnosePhase=new He(e,t),this.level2ReferencePhase.render("level2-reference-container"),this.level2DiagnosePhase.render("level2-diagnose-container"),this.level2ReferencePhase.setOnComplete(async()=>{r.info("🔄 Level 2 reference created, reloading in diagnose phase..."),this.level2DiagnosePhase&&await this.level2DiagnosePhase.reloadReference()});try{await Promise.all([this.level2ReferencePhase.initialize(),this.level2DiagnosePhase.initialize()]),r.info("✅ Level 2 phases initialized successfully")}catch(i){r.error("❌ Error initializing Level 2 phases:",i)}}cleanupAllPhases(){if(this.referencePhase){try{this.referencePhase.destroy()}catch(e){r.warn("⚠️ Error destroying reference phase:",e)}this.referencePhase=null}if(this.diagnosePhase){try{this.diagnosePhase.destroy()}catch(e){r.warn("⚠️ Error destroying diagnose phase:",e)}this.diagnosePhase=null}if(this.level2ReferencePhase){try{this.level2ReferencePhase.destroy()}catch(e){r.warn("⚠️ Error destroying Level 2 reference phase:",e)}this.level2ReferencePhase=null}if(this.level2DiagnosePhase){try{this.level2DiagnosePhase.destroy()}catch(e){r.warn("⚠️ Error destroying Level 2 diagnose phase:",e)}this.level2DiagnosePhase=null}}handleModeChange(e){this.updateModeVisibility(e),this.currentMachine&&this.initializePhases(this.currentMachine)}updateModeVisibility(e){document.body.setAttribute("data-detection-mode",e);const t=document.querySelectorAll('[data-detection-mode="STATIONARY"]'),i=document.querySelectorAll('[data-detection-mode="CYCLIC"]');t.forEach(n=>{n.style.display=e==="STATIONARY"?"":"none"}),i.forEach(n=>{n.style.display=e==="CYCLIC"?"":"none"}),r.debug(`Mode visibility updated: ${e}`)}lockPhases(){this.setPhaseState("record-reference-content",!1),this.setPhaseState("run-diagnosis-content",!1)}unlockPhases(){this.setPhaseState("record-reference-content",!0),this.setPhaseState("run-diagnosis-content",!0)}setPhaseState(e,t){const i=document.getElementById(e);if(!i)return;i.querySelectorAll("button").forEach(a=>{a.disabled=!t,a.style.opacity=t?"1":"0.5",a.style.cursor=t?"pointer":"not-allowed"})}updateMachineDisplay(e){const t=document.getElementById("user-name");t&&(t.textContent=e.name);const i=document.getElementById("record-reference-content");if(i){const a=i.querySelector(".sub-description");if(a)if(e.referenceModels&&e.referenceModels.length>0){const s=e.referenceModels.length,c=[...e.referenceModels].sort((u,g)=>(g.trainingDate||0)-(u.trainingDate||0))[0]?.trainingDate,d=c?new Date(c).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"unbekannt";a.textContent=`${s} Zustand${s>1?"e":""} trainiert (zuletzt: ${d}) - Weitere hinzufügen`}else a.textContent="10-Sekunden Referenzaufnahme (Erforderlich für Diagnose)"}const n=document.getElementById("run-diagnosis-content");if(n){const a=n.querySelector(".sub-description");a&&(e.referenceModels&&e.referenceModels.length>0?a.textContent="Live-Analyse durchführen":a.textContent="⚠️ Bitte erst Referenz aufnehmen")}}collapseSection(e){const t=document.getElementById(e);if(!t)return;if(!t.dataset.originalDisplay){const s=window.getComputedStyle(t);t.dataset.originalDisplay=s.display}window.getComputedStyle(t).display!=="none"&&(t.style.display="none");const a=document.querySelector(`.section-header[data-target="${e}"]`)?.querySelector(".collapse-icon");a&&a.classList.remove("rotated")}}const Ve={showDetails:!1};class _e{constructor(e){l(this,"config");l(this,"isInitialized",!1);l(this,"errorHandler",null);l(this,"rejectionHandler",null);this.config={...Ve,...e}}init(){if(this.isInitialized){r.warn("Error boundary already initialized");return}this.errorHandler=e=>{this.handleError(e.error||new Error(e.message),"error"),e.preventDefault()},window.addEventListener("error",this.errorHandler),this.rejectionHandler=e=>{const t=e.reason instanceof Error?e.reason:new Error(String(e.reason));this.handleError(t,"rejection"),e.preventDefault()},window.addEventListener("unhandledrejection",this.rejectionHandler),this.isInitialized=!0,r.info("✅ Error boundary initialized")}destroy(){this.isInitialized&&(this.errorHandler&&(window.removeEventListener("error",this.errorHandler),this.errorHandler=null),this.rejectionHandler&&(window.removeEventListener("unhandledrejection",this.rejectionHandler),this.rejectionHandler=null),this.isInitialized=!1,r.info("Error boundary destroyed"))}handleError(e,t){const i=Date.now(),n={type:t,timestamp:i};if(r.error(`Uncaught ${t}:`,e),this.config.onError)try{this.config.onError(e,n)}catch(a){r.error("Error in custom error handler:",a)}this.showErrorMessage(e)}showErrorMessage(e){let t="Ein unerwarteter Fehler ist aufgetreten.",i="";e.name==="NotAllowedError"||e.message.includes("Permission")?(t="Zugriff verweigert",i="Bitte erlauben Sie den Zugriff auf Mikrofon/Kamera in Ihren Browser-Einstellungen."):e.name==="NotFoundError"?(t="Hardware nicht gefunden",i="Bitte stellen Sie sicher, dass Ihr Mikrofon/Kamera angeschlossen ist."):e.name==="QuotaExceededError"?(t="Speicherplatz voll",i="Bitte löschen Sie alte Diagnosen oder Referenzaufnahmen."):e.message.includes("Network")?(t="Netzwerkfehler",i="Bitte überprüfen Sie Ihre Internetverbindung."):e.message.includes("AudioContext")&&(t="Audio-System-Fehler",i="Bitte laden Sie die Seite neu. Falls das Problem weiterhin besteht, verwenden Sie einen aktuellen Browser.");const n=this.config.showDetails?`

Technische Details:
${e.name}: ${e.message}
${e.stack||"Kein Stack Trace verfügbar"}`:"";p.error(`${t}

${i}${n}`,e,{title:"Unerwarteter Fehler",duration:0})}configure(e){this.config={...this.config,...e}}}const _=new _e;function Ge(m){m&&_.configure(m),_.init()}const je="zanobot:view-level-change",ae="zanobot.view-level",R="basic",re=["basic","advanced","expert"],Ke=()=>{try{const m=localStorage.getItem(ae);return m&&re.includes(m)?m:R}catch{return R}},Qe=m=>{re.includes(m)||(m=R);try{localStorage.setItem(ae,m)}catch{}return document.documentElement.setAttribute("data-view-level",m),window.dispatchEvent(new CustomEvent(je,{detail:m})),m},Ye=()=>{const m=Ke();return document.documentElement.setAttribute("data-view-level",m),m};class Ze{constructor(){l(this,"router",null);this.init()}async init(){Ge({showDetails:!1}),r.info("🤖 Zanobo AI Assistant starting..."),r.info("   Version: 2.0.0 (GMIA Algorithm)"),document.readyState==="loading"&&await new Promise(e=>{let t=!1;const i=()=>{t||(t=!0,e())};document.addEventListener("DOMContentLoaded",i,{once:!0}),document.readyState!=="loading"&&(document.removeEventListener("DOMContentLoaded",i),i()),setTimeout(()=>{!t&&document.readyState!=="loading"&&(r.warn("⚠️ DOM ready but DOMContentLoaded did not fire, proceeding anyway"),i())},100)}),await this.setup()}checkBrowserCompatibility(){const e=[];typeof AudioContext<"u"||typeof window.webkitAudioContext<"u"||e.push("- Web Audio API (required for audio processing)"),typeof MediaRecorder>"u"&&e.push("- MediaRecorder API (required for audio recording)"),typeof indexedDB>"u"&&e.push("- IndexedDB (required for data storage)");try{typeof AudioContext<"u"&&!("audioWorklet"in AudioContext.prototype)&&e.push("- AudioWorklet (required for real-time diagnosis)")}catch{}return{isCompatible:e.length===0,missing:e}}async setup(){const e=this.checkBrowserCompatibility();if(!e.isCompatible){r.error("❌ Browser compatibility check failed"),r.error("   Missing features:"),e.missing.forEach(i=>r.error(`   ${i}`)),p.error(`Ihr Browser ist nicht kompatibel mit Zanobo.

Fehlende Features:
`+e.missing.join(`
`)+`

Bitte verwenden Sie einen modernen Browser wie Chrome, Edge, Firefox oder Safari.`,new Error("Browser incompatible"),{title:"Browser nicht unterstützt",duration:0});return}r.info("✅ Browser compatibility check passed");let t=!1;try{r.info("📦 Initializing database..."),await fe();const i=await j();r.info(`   Machines: ${i.machines}`),r.info(`   Recordings: ${i.recordings}`),r.info(`   Diagnoses: ${i.diagnoses}`),t=!0}catch(i){r.error("❌ Database initialization failed:",i),r.warn("⚠️ Continuing without database - functionality will be limited"),p.error("Datenbank nicht verfügbar. Bitte erlauben Sie IndexedDB in Ihren Browser-Einstellungen oder deaktivieren Sie den strikten Privacy-Modus.",i,{title:"Datenbank-Fehler",duration:0})}try{r.info("🔀 Initializing router..."),this.router=new We,this.setupCollapsibleSections(),this.setupThemeSwitcher(),this.setupQuickThemeToggle(),this.setupViewLevelSelector(),this.setupFooterLinks(),t?r.info("✅ Zanobo initialized successfully!"):(r.warn("⚠️ Zanobo initialized with limited functionality (no database)"),r.warn("   Some features may not work correctly without database access"))}catch(i){r.error("❌ UI initialization failed:",i),p.error("Benutzeroberfläche konnte nicht geladen werden",i,{title:"Schwerwiegender Fehler",duration:0})}}setupCollapsibleSections(){const e=document.querySelectorAll(".section-header");let t=!1;const i=()=>{const a=Array.from(document.querySelectorAll(".collapsible-content")).some(s=>window.getComputedStyle(s).display!=="none");document.body.classList.toggle("compact-expanded",a)};e.forEach(n=>{n.addEventListener("click",()=>{if(t)return;t=!0;const a=n.getAttribute("data-target");if(!a){t=!1;return}const s=document.getElementById(a);if(!s){t=!1;return}if(!s.dataset.originalDisplay){const u=window.getComputedStyle(s);s.dataset.originalDisplay=u.display}if(window.getComputedStyle(s).display!=="none")s.style.display="none";else{e.forEach(g=>{if(g===n)return;const y=g.getAttribute("data-target");if(!y)return;const v=document.getElementById(y);if(!v)return;window.getComputedStyle(v).display!=="none"&&(v.style.display="none");const h=g.querySelector(".collapse-icon");h&&h.classList.remove("rotated")});const u=s.dataset.originalDisplay;s.style.display=u&&u!=="none"?u:""}const d=n.querySelector(".collapse-icon");d&&d.classList.toggle("rotated"),i(),setTimeout(()=>{t=!1},300)})}),i()}setupThemeSwitcher(){const e=document.querySelectorAll(".theme-card");e.forEach(i=>{i.addEventListener("click",()=>{const n=i.getAttribute("data-theme");n&&(document.documentElement.setAttribute("data-theme",n),localStorage.setItem("zanobot-theme",n),e.forEach(a=>a.classList.remove("active")),i.classList.add("active"))})});const t=localStorage.getItem("zanobot-theme")||"brand";document.documentElement.setAttribute("data-theme",t),e.forEach(i=>{i.getAttribute("data-theme")===t&&i.classList.add("active")})}setupQuickThemeToggle(){const e=Array.from(document.querySelectorAll(".quick-theme-toggle")),t=document.getElementById("quick-theme-toggle");t&&!e.includes(t)&&e.push(t),e.forEach(i=>{i.addEventListener("click",()=>{window.ZanobotTheme?.toggleTheme&&(window.ZanobotTheme.toggleTheme(),r.debug("🎨 Theme toggled via quick toggle button"))})})}setupViewLevelSelector(){const e=Ye();r.info(`👁️ View level set to: ${e}`);const t=document.querySelectorAll(".view-level-btn[data-level]");t.forEach(i=>{i.getAttribute("data-level")===e?i.classList.add("active"):i.classList.remove("active")}),t.forEach(i=>{i.addEventListener("click",()=>{const n=i.getAttribute("data-level");n&&(Qe(n),r.debug(`👁️ View level changed to: ${n}`),t.forEach(a=>{a.getAttribute("data-level")===n?a.classList.add("active"):a.classList.remove("active")}))})})}setupFooterLinks(){const e=f=>{f.style.display="none"},t=f=>{f.style.display="flex"},i=document.getElementById("impressum-btn"),n=document.getElementById("impressum-modal"),a=document.getElementById("close-impressum-modal"),s=document.getElementById("close-impressum-btn");i&&n&&i.addEventListener("click",()=>t(n)),a&&n&&a.addEventListener("click",()=>e(n)),s&&n&&s.addEventListener("click",()=>e(n));const o=document.getElementById("datenschutz-btn"),c=document.getElementById("datenschutz-modal"),d=document.getElementById("close-datenschutz-modal"),u=document.getElementById("close-datenschutz-btn");o&&c&&o.addEventListener("click",()=>t(c)),d&&c&&d.addEventListener("click",()=>e(c)),u&&c&&u.addEventListener("click",()=>e(c));const g=document.getElementById("about-btn"),y=document.getElementById("about-modal"),v=document.getElementById("close-about-modal"),h=document.getElementById("close-about-btn");g&&y&&g.addEventListener("click",()=>t(y)),v&&y&&v.addEventListener("click",()=>e(y)),h&&y&&h.addEventListener("click",()=>e(y)),[n,c,y].forEach(f=>{f&&f.addEventListener("click",S=>{S.target===f&&e(f)})}),document.addEventListener("keydown",f=>{f.key==="Escape"&&[n,c,y].forEach(S=>{S&&window.getComputedStyle(S).display!=="none"&&e(S)})})}}new Ze;
//# sourceMappingURL=index-B89Mh_RT.js.map
