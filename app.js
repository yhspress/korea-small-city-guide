const state={cities:[],affiliate:null,current:null};
const $=s=>document.querySelector(s);
const mapCanvas=$("#mapCanvas"),pins=$("#mapPins"),cityList=$("#cityList"),modal=$("#cityModal");
const bounds={north:38.7,south:33,east:130.9,west:124.5};

async function loadData(){
  const [cityRes,affiliateRes]=await Promise.all([fetch("./data/cities.json"),fetch("./data/affiliate-links.json")]);
  const cityData=await cityRes.json(); state.affiliate=await affiliateRes.json(); state.cities=cityData.cities;
  renderCities();renderBookings();
}
function cityLabel(c){return `${c.ja}<small>${c.ko}</small>`}
function imageBox(){
  const img=mapCanvas.querySelector("img"),parent=mapCanvas.getBoundingClientRect(),rect=img.getBoundingClientRect();
  return {left:rect.left-parent.left,top:rect.top-parent.top,width:rect.width,height:rect.height};
}
function pinPosition(c){
  const b=imageBox();
  const x=(c.lng-bounds.west)/(bounds.east-bounds.west);
  const y=(bounds.north-c.lat)/(bounds.north-bounds.south);
  return {left:b.left+x*b.width,top:b.top+y*b.height};
}
function positionPins(){
  [...pins.children].forEach((button,i)=>{const p=pinPosition(state.cities[i]);button.style.left=p.left+"px";button.style.top=p.top+"px"});
}
function renderCities(){
  pins.innerHTML="";cityList.innerHTML="";
  state.cities.forEach((c,i)=>{
    const pin=document.createElement("button");pin.className="pin";pin.type="button";pin.title=`${c.ja} (${c.ko})`;pin.innerHTML=`<span>${i+1}</span>`;pin.addEventListener("click",()=>openCity(c));pins.append(pin);
    const button=document.createElement("button");button.className="city-button";button.type="button";button.innerHTML=`${c.ja}<small>${c.ko}</small>`;button.addEventListener("click",()=>openCity(c));cityList.append(button);
  });
  requestAnimationFrame(positionPins);
}
function renderBookings(){
  const grid=$("#bookingGrid");grid.innerHTML="";
  Object.values(state.affiliate.common).forEach(item=>{
    const a=document.createElement("a");a.className="booking-card";a.href=item.url;a.target="_blank";a.rel="sponsored noopener";
    a.innerHTML=`<span>PR · Trip.com</span><strong>${item.ja}<small>${item.ko}</small></strong><span>JPY · 日本語ページ →</span>`;grid.append(a);
  });
}
async function loadWikiImage(spot,box){
  try{
    const res=await fetch(`https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(spot.ko)}?redirect=true`);
    if(!res.ok)return;const data=await res.json();if(!data.thumbnail?.source)return;
    const img=new Image();img.alt=`${spot.ja}（${spot.ko}）`;img.loading="lazy";img.src=data.thumbnail.source;img.onerror=()=>img.remove();box.replaceChildren(img);
  }catch(_){}
}
function cityHotel(c){return state.affiliate.hotels.find(h=>h.slug===c.slug)}
function cityTrains(c){return state.affiliate.trains.filter(t=>t.slug.endsWith(c.slug))}
function openCity(c){
  state.current=c;$("#modalTitle").innerHTML=cityLabel(c);$("#modalNote").textContent=c.noteJa||"観光スポットと交通・ホテルをまとめて確認できます。";
  const spotGrid=$("#spotGrid");spotGrid.innerHTML="";
  c.spots.forEach((spot,index)=>{
    const article=document.createElement("article");article.className="spot";
    article.innerHTML=`<div class="spot-media"><span>PHOTO ${String(index+1).padStart(2,"0")}</span></div><div class="spot-body"><p class="eyebrow">SPOT ${String(index+1).padStart(2,"0")}</p><h3>${spot.ja}<small>${spot.ko}</small></h3><a class="map-link" href="${spot.mapUrl}" target="_blank" rel="noopener">Google Mapsで見る →</a></div>`;
    spotGrid.append(article);loadWikiImage(spot,article.querySelector(".spot-media"));
  });
  const actions=$("#cityActions");actions.innerHTML="";
  const hotel=cityHotel(c);
  if(hotel){const a=document.createElement("a");a.className="action";a.href=hotel.url;a.target="_blank";a.rel="sponsored noopener";a.innerHTML=`Trip.comでホテル <small>${c.ko} 호텔</small>`;actions.append(a)}
  cityTrains(c).forEach(route=>{const a=document.createElement("a");a.className="action train";a.href=route.url;a.target="_blank";a.rel="sponsored noopener";a.innerHTML=`${route.ja}<small>${route.ko}</small>`;actions.append(a)});
  modal.classList.add("open");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";$(".modal-close").focus();
}
function closeCity(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");document.body.style.overflow=""}
modal.addEventListener("click",e=>{if(e.target.matches("[data-close]"))closeCity()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeCity()});
window.addEventListener("resize",positionPins);
mapCanvas.querySelector("img").addEventListener("load",positionPins);
loadData().catch(()=>{cityList.innerHTML="<p>データを読み込めませんでした。ページを再読み込みしてください。</p>"});
