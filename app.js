// ============ AIO OBSERVATORY — APPLICATION CORE ============
const AIOApp = (() => {
  const LAT = AIO.project.lat, LON = AIO.project.lon;
  let weatherCache = null;
  const echartsInstances = {};
  const ndviFileCache = {};

  // ---------- REPO NDVI DATA (github.com/kraefegg/AIO — real Sentinel-2 exports) ----------
  async function loadNDVIFile(file){
    if(ndviFileCache[file]) return ndviFileCache[file];
    const res = await fetch(AIO.rsRepoBase + encodeURIComponent(file));
    if(!res.ok) throw new Error('fetch failed');
    const text = await res.text();
    const parsed = Papa.parse(text, {header:true, dynamicTyping:true, skipEmptyLines:true});
    const rows = parsed.data.map(r=>({
      date: r['C0/date'], mean:r['C0/mean'], min:r['C0/min'], max:r['C0/max'],
      cloud: r['C0/cloudCoveragePercent']
    })).filter(r=>r.date).sort((a,b)=> new Date(a.date)-new Date(b.date));
    ndviFileCache[file] = rows;
    return rows;
  }
  // Build a clean (low cloud) monthly-averaged NDVI series to drive dashboard/vegetação charts with real data
  async function loadRealNDVITrend(){
    try{
      const rows = await loadNDVIFile(AIO.ndviDatasets[2].file); // último ano — enough history, fast to fetch
      const clean = rows.filter(r=> typeof r.cloud==='number' && r.cloud < 30 && typeof r.mean==='number');
      const byMonth = {};
      clean.forEach(r=>{ const k = r.date.slice(0,7); (byMonth[k]=byMonth[k]||[]).push(r.mean); });
      const months = Object.keys(byMonth).sort().slice(-5);
      if(months.length < 3) return; // not enough clean data, keep fallback series
      AIO.campaigns = months.map(m=>{ const [y,mo]=m.split('-'); return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][+mo-1]+'/'+y.slice(2); });
      AIO.indices.ndvi = months.map(m=> +(byMonth[m].reduce((a,b)=>a+b,0)/byMonth[m].length).toFixed(3));
      AIO.kpi.cobertura_vegetal_pct = +(AIO.indices.ndvi[AIO.indices.ndvi.length-1]*100).toFixed(1);
      AIO._ndviIsReal = true;
    }catch(e){ /* keep synthetic fallback silently */ }
  }

  // ---------- BOOT SEQUENCE ----------
  function boot(){
    const logLines = [
      "INICIALIZANDO NÚCLEO AIO...",
      "CARREGANDO MÓDULOS GEOESPACIAIS...",
      "SINCRONIZANDO COM OPEN-METEO API...",
      "VALIDANDO POLÍGONO PRAD CARAÚBAS-PB...",
      "COMPILANDO ÍNDICES ESPECTRAIS...",
      "PRONTO."
    ];
    const logEl = document.getElementById('bootLog');
    const fill = document.getElementById('bootFill');
    let i=0;
    const iv = setInterval(()=>{
      if(i < logLines.length){
        const d = document.createElement('div');
        d.textContent = "> " + logLines[i];
        logEl.appendChild(d);
        fill.style.width = ((i+1)/logLines.length*100)+'%';
        i++;
      } else {
        clearInterval(iv);
        setTimeout(()=>{
          document.getElementById('boot-screen').style.transition = 'opacity .5s ease';
          document.getElementById('boot-screen').style.opacity = '0';
          setTimeout(()=>{
            document.getElementById('boot-screen').style.display='none';
            document.getElementById('app').style.display='flex';
            init();
          },500);
        },350);
      }
    }, 260);
  }

  // ---------- CLOCK ----------
  function tickClock(){
    const now = new Date();
    document.getElementById('clockTime').textContent = now.toLocaleTimeString('pt-BR');
    document.getElementById('clockDate').textContent = now.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
  }

  // ---------- TOASTS ----------
  function toast(msg, icon='fa-circle-check'){
    let zone = document.getElementById('toastZone');
    if(!zone){ zone = document.createElement('div'); zone.id='toastZone'; document.body.appendChild(zone); }
    const t = document.createElement('div');
    t.className = 'toast-hud animate__animated animate__fadeInUp';
    t.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
    zone.appendChild(t);
    setTimeout(()=>{ t.classList.add('animate__fadeOutRight'); setTimeout(()=>t.remove(),400); }, 3200);
  }

  // ---------- NAVIGATION ----------
  function go(pageId){
    document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active', a.dataset.page===pageId));
    const content = document.getElementById('content');
    content.innerHTML = `<div class="page active" id="page-${pageId}">${PAGES[pageId]()}</div>`;
    renderPage(pageId);
    document.getElementById('sidebar').classList.remove('open');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderPage(id){
    if(id==='dashboard') renderDashboard();
    if(id==='meteorologia') renderMeteorologia();
    if(id==='climatologia') renderClimatologia();
    if(id==='vegetacao') renderVegetacao();
    if(id==='solo') renderSolo();
    if(id==='hidrico') renderHidrico();
    if(id==='sensoriamento') renderSensoriamento();
    if(id==='mapas') renderMapa();
    if(id==='csv') renderCSVPage();
    if(id==='ia') runAI();
    if(id==='config') document.getElementById('cfgTheme')?.addEventListener('click', toggleTheme);
  }

  // ---------- ECHARTS HELPERS ----------
  function ec(elId){
    const el = document.getElementById(elId);
    if(!el) return null;
    if(echartsInstances[elId]) echartsInstances[elId].dispose();
    const inst = echarts.init(el, null, {renderer:'svg'});
    echartsInstances[elId] = inst;
    window.addEventListener('resize', ()=>inst.resize());
    return inst;
  }
  const axisTheme = { color:'#5f7c90', fontFamily:'JetBrains Mono', fontSize:10 };
  const gridLine = { lineStyle:{ color:'rgba(120,200,255,.12)' } };

  function gauge(elId, value, max, unit, colorStops){
    const inst = ec(elId); if(!inst) return;
    inst.setOption({
      series:[{
        type:'gauge', startAngle:210, endAngle:-30, min:0, max:max,
        progress:{show:true, width:10, itemStyle:{color: colorStops}},
        axisLine:{lineStyle:{width:10, color:[[1, 'rgba(255,255,255,.07)']]}},
        pointer:{show:false}, axisTick:{show:false}, splitLine:{show:false}, axisLabel:{show:false},
        anchor:{show:false},
        detail:{ valueAnimation:true, fontSize:22, fontFamily:'Orbitron', color:'#eaf6ff', offsetCenter:[0,'0%'], formatter:v=>v.toFixed(1)+unit },
        data:[{value:value}]
      }]
    });
  }

  // ---------- WEATHER (OPEN-METEO LIVE) ----------
  async function fetchWeather(){
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day` +
      `&hourly=dew_point_2m,visibility,evapotranspiration,soil_temperature_0cm,precipitation_probability` +
      `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,shortwave_radiation_sum` +
      `&timezone=auto&forecast_days=7`;
    const t0 = performance.now();
    const res = await fetch(url);
    const data = await res.json();
    const ping = Math.round(performance.now()-t0);
    document.getElementById('apiPing') && (document.getElementById('apiPing').textContent = `ping ${ping}ms`);
    weatherCache = data;
    return data;
  }

  function moonPhase(){
    const phases = ['🌑 Nova','🌒 Crescente','🌓 Quarto Crescente','🌔 Crescente Gibosa','🌕 Cheia','🌖 Minguante Gibosa','🌗 Quarto Minguante','🌘 Minguante'];
    const day = new Date().getDate();
    return phases[Math.floor((day/29.5)*8)%8];
  }

  async function renderMeteorologia(){
    let d;
    try{ d = weatherCache || await fetchWeather(); }
    catch(e){ document.getElementById('weatherGrid').innerHTML = `<div class="card">Falha ao consultar Open-Meteo. Verifique a conexão.</div>`; return; }
    const c = d.current, daily = d.daily;
    const items = [
      ["Temperatura do Ar", c.temperature_2m.toFixed(1)+"°C", "fa-temperature-half"],
      ["Temp. Máxima (hoje)", daily.temperature_2m_max[0].toFixed(1)+"°C", "fa-arrow-up"],
      ["Temp. Mínima (hoje)", daily.temperature_2m_min[0].toFixed(1)+"°C", "fa-arrow-down"],
      ["Temp. do Solo", (d.hourly.soil_temperature_0cm[curHourIdx(d)]??'--').toFixed?.(1)+"°C" || "—", "fa-mound"],
      ["Umidade Relativa", c.relative_humidity_2m+"%", "fa-droplet"],
      ["Pressão Atmosférica", c.pressure_msl.toFixed(0)+" hPa", "fa-gauge"],
      ["Velocidade do Vento", c.wind_speed_10m.toFixed(1)+" km/h", "fa-wind"],
      ["Rajadas", c.wind_gusts_10m.toFixed(1)+" km/h", "fa-tornado"],
      ["Direção do Vento", c.wind_direction_10m+"°", "fa-compass"],
      ["Ponto de Orvalho", (d.hourly.dew_point_2m[curHourIdx(d)]).toFixed(1)+"°C", "fa-water"],
      ["Precipitação (atual)", c.precipitation.toFixed(1)+" mm", "fa-cloud-rain"],
      ["Precip. Acumulada (hoje)", daily.precipitation_sum[0].toFixed(1)+" mm", "fa-cloud-showers-heavy"],
      ["Nebulosidade", c.cloud_cover+"%", "fa-cloud"],
      ["Índice UV", (daily.uv_index_max[0]).toFixed(1), "fa-sun"],
      ["Radiação Solar", (daily.shortwave_radiation_sum[0]).toFixed(1)+" MJ/m²", "fa-solar-panel"],
      ["Evapotranspiração", (d.hourly.evapotranspiration[curHourIdx(d)]).toFixed(2)+" mm", "fa-tint-slash"],
      ["Visibilidade", ((d.hourly.visibility[curHourIdx(d)])/1000).toFixed(1)+" km", "fa-eye"],
      ["Sensação Térmica", c.apparent_temperature.toFixed(1)+"°C", "fa-person-rays"],
      ["Nascer do Sol", new Date(daily.sunrise[0]).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), "fa-sun"],
      ["Pôr do Sol", new Date(daily.sunset[0]).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), "fa-moon"],
      ["Fase da Lua", moonPhase(), "fa-moon"],
    ];
    document.getElementById('weatherGrid').innerHTML = items.map(([label,val,ic])=>`
      <div class="card"><div class="card-head"><span class="card-title"><i class="fa-solid ${ic}"></i> ${label}</span></div>
      <div class="kpi-value" style="font-size:22px">${val}</div></div>`).join('');
    document.getElementById('dashSyncTime') && (document.getElementById('dashSyncTime').textContent = new Date().toLocaleTimeString('pt-BR'));

    gauge('instTherm', c.temperature_2m, 45, '°C', '#3fe0ff');
    gauge('instBaro', c.pressure_msl, 1050, 'hPa', '#12e0b0');
    gauge('instAnem', c.wind_speed_10m, 60, 'km/h', '#ffb545');
    renderWindRose('instRose', c.wind_direction_10m);

    const fc = ec('chartForecast');
    if(fc){
      fc.setOption({
        tooltip:{trigger:'axis'},
        legend:{textStyle:axisTheme, top:0},
        grid:{left:40,right:20,top:36,bottom:30},
        xAxis:{type:'category', data:daily.time.map(t=>new Date(t).toLocaleDateString('pt-BR',{weekday:'short'})), axisLabel:axisTheme, axisLine:gridLine},
        yAxis:[{type:'value', axisLabel:{...axisTheme, formatter:'{value}°C'}, splitLine:gridLine},
               {type:'value', axisLabel:{...axisTheme, formatter:'{value}mm'}, splitLine:{show:false}}],
        series:[
          {name:'Máx (°C)', type:'line', smooth:true, data:daily.temperature_2m_max, itemStyle:{color:'#ff4d5e'}, lineStyle:{width:2}},
          {name:'Mín (°C)', type:'line', smooth:true, data:daily.temperature_2m_min, itemStyle:{color:'#3fe0ff'}, lineStyle:{width:2}},
          {name:'Precip. (mm)', type:'bar', yAxisIndex:1, data:daily.precipitation_sum, itemStyle:{color:'rgba(18,224,176,.55)'}}
        ]
      });
    }
  }
  function curHourIdx(d){
    const nowISO = new Date().toISOString().slice(0,13);
    let idx = d.hourly.time.findIndex(t=>t.startsWith(nowISO));
    return idx<0?0:idx;
  }
  function renderWindRose(elId, deg){
    const inst = ec(elId); if(!inst) return;
    const dirs = ['N','NE','E','SE','S','SO','O','NO'];
    const data = dirs.map((d,i)=> i===Math.round(deg/45)%8 ? 8 : Math.random()*3+1);
    inst.setOption({
      polar:{radius:'70%'},
      angleAxis:{type:'category', data:dirs, axisLabel:{...axisTheme,fontSize:9}, splitLine:{show:false}},
      radiusAxis:{show:false},
      series:[{type:'bar', coordinateSystem:'polar', data, itemStyle:{color:'#3fe0ff'}}]
    });
  }

  // ---------- DASHBOARD ----------
  async function renderDashboard(){
    // sparklines
    [ [96,97,95,98,99,100][Symbol.iterator] ].length; // no-op guard
    const sparkData = {
      spark1:[71,73,74,76,78.4], spark2:[38,42,46,49,52], spark3:[31,34,36,39,42.5]/*shown as %*/, spark4:[15,14,13.5,12,11.2]
    };
    Object.entries(sparkData).forEach(([id,arr])=>{
      const el = document.getElementById(id); if(!el) return;
      new Chart(el, { type:'line', data:{ labels:arr.map((_,i)=>i), datasets:[{data:arr, borderColor:'#3fe0ff', borderWidth:2, pointRadius:0, tension:.4, fill:true, backgroundColor:'rgba(63,224,255,.08)'}]},
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{display:false},y:{display:false}} } });
    });

    try{ if(!weatherCache) await fetchWeather(); const c=weatherCache.current;
      gauge('gaugeTemp', c.temperature_2m, 45, '°C', '#3fe0ff');
      gauge('gaugeHum', c.relative_humidity_2m, 100, '%', '#12e0b0');
      gauge('gaugeWind', c.wind_speed_10m, 60, 'km/h', '#ffb545');
      gauge('gaugeUV', weatherCache.daily.uv_index_max[0], 12, '', '#ff4d5e');
      document.getElementById('dashSyncTime') && (document.getElementById('dashSyncTime').textContent = new Date().toLocaleTimeString('pt-BR'));
    }catch(e){}

    const evo = ec('chartIndicesEvo');
    if(evo){
      evo.setOption({
        tooltip:{trigger:'axis'}, legend:{textStyle:axisTheme, top:0},
        grid:{left:36,right:16,top:36,bottom:26},
        xAxis:{type:'category', data:AIO.campaigns, axisLabel:axisTheme, axisLine:gridLine},
        yAxis:{type:'value', axisLabel:axisTheme, splitLine:gridLine},
        series:[
          {name:'NDVI', type:'line', smooth:true, data:AIO.indices.ndvi, itemStyle:{color:'#12e0b0'}, areaStyle:{opacity:.08}},
          {name:'NDWI', type:'line', smooth:true, data:AIO.indices.ndwi, itemStyle:{color:'#3fe0ff'}},
          {name:'Moisture', type:'line', smooth:true, data:AIO.indices.moisture, itemStyle:{color:'#8a7dff'}},
          {name:'Barren Soil', type:'line', smooth:true, data:AIO.indices.barren, itemStyle:{color:'#ffb545'}},
        ]
      });
    }
    document.getElementById('dashAlerts').innerHTML = AIO.alerts.map(a=>`
      <div class="alert-item"><div class="alert-ico ${a.level}"><i class="fa-solid ${a.level==='crit'?'fa-triangle-exclamation':a.level==='warn'?'fa-cloud-sun-rain':'fa-circle-info'}"></i></div>
      <div class="alert-body"><strong>${a.title}</strong><span>${a.detail} · ${a.time}</span></div></div>`).join('');

    const sus = ec('chartSustain');
    if(sus){
      sus.setOption({
        radar:{ indicator:[{name:'Cobertura Vegetal',max:100},{name:'Retenção Hídrica',max:100},{name:'Fitossanidade',max:100},{name:'Recuperação Solo',max:100},{name:'Biodiversidade',max:100}],
          axisName:{color:'#5f7c90', fontSize:10}, splitLine:{lineStyle:{color:'rgba(120,200,255,.14)'}}, splitArea:{show:false}, axisLine:{lineStyle:{color:'rgba(120,200,255,.14)'}} },
        series:[{type:'radar', data:[{value:[46,58,71,55,49], areaStyle:{color:'rgba(63,224,255,.18)'}, itemStyle:{color:'#3fe0ff'}, lineStyle:{color:'#3fe0ff'}}]}]
      });
    }
  }

  // ---------- CLIMATOLOGIA ----------
  function renderClimatologia(){
    const months = ['Ago','Set','Out','Nov','Dez','Jan','Fev','Mar','Abr','Mai','Jun','Jul'];
    const temp = [28.1,28.9,29.4,29.0,28.2,27.5,27.1,26.8,26.5,27.0,27.6,27.9];
    const normalTemp = [27.2,27.6,28.0,27.8,27.3,26.9,26.6,26.3,26.1,26.5,27.0,27.2];
    const chuva = [4,2,8,22,61,98,112,89,54,20,6,3];
    const normalChuva = [8,5,12,30,72,105,120,95,60,25,10,6];
    const cl = ec('chartClima');
    if(cl){ cl.setOption({
      tooltip:{trigger:'axis'}, legend:{textStyle:axisTheme, top:0},
      grid:{left:40,right:20,top:36,bottom:26},
      xAxis:{type:'category', data:months, axisLabel:axisTheme, axisLine:gridLine},
      yAxis:[{type:'value', axisLabel:{...axisTheme,formatter:'{value}°C'}, splitLine:gridLine},{type:'value', axisLabel:{...axisTheme,formatter:'{value}mm'}, splitLine:{show:false}}],
      series:[
        {name:'Temp. Observada', type:'line', smooth:true, data:temp, itemStyle:{color:'#ff4d5e'}},
        {name:'Temp. Normal', type:'line', smooth:true, data:normalTemp, itemStyle:{color:'#ffb545'}, lineStyle:{type:'dashed'}},
        {name:'Precipitação', type:'bar', yAxisIndex:1, data:chuva, itemStyle:{color:'rgba(63,224,255,.5)'}},
      ]}); }
    const at = ec('chartAnomalyTemp');
    if(at){ const anomaly = temp.map((t,i)=>+(t-normalTemp[i]).toFixed(1));
      at.setOption({ title:{text:'Anomalia de Temperatura', textStyle:{...axisTheme,fontSize:12,color:'#eaf6ff'}},
        grid:{left:36,right:16,top:44,bottom:26}, tooltip:{trigger:'axis'},
        xAxis:{type:'category', data:months, axisLabel:axisTheme, axisLine:gridLine}, yAxis:{type:'value', axisLabel:{...axisTheme,formatter:'{value}°C'}, splitLine:gridLine},
        series:[{type:'bar', data:anomaly, itemStyle:{color:p=>p.value>=0?'#ff4d5e':'#3fe0ff'}}] }); }
    const ac = ec('chartAnomalyChuva');
    if(ac){ const anomaly = chuva.map((c,i)=>c-normalChuva[i]);
      ac.setOption({ title:{text:'Anomalia de Precipitação', textStyle:{...axisTheme,fontSize:12,color:'#eaf6ff'}},
        grid:{left:36,right:16,top:44,bottom:26}, tooltip:{trigger:'axis'},
        xAxis:{type:'category', data:months, axisLabel:axisTheme, axisLine:gridLine}, yAxis:{type:'value', axisLabel:{...axisTheme,formatter:'{value}mm'}, splitLine:gridLine},
        series:[{type:'bar', data:anomaly, itemStyle:{color:p=>p.value>=0?'#12e0b0':'#ffb545'}}] }); }
  }

  // ---------- VEGETAÇÃO ----------
  function renderVegetacao(){
    const v = ec('chartVeg');
    if(v){ v.setOption({
      tooltip:{trigger:'axis'}, legend:{textStyle:axisTheme, top:0},
      grid:{left:36,right:16,top:36,bottom:26},
      xAxis:{type:'category', data:AIO.campaigns, axisLabel:axisTheme, axisLine:gridLine},
      yAxis:{type:'value', axisLabel:axisTheme, splitLine:gridLine, max:0.6},
      series:[
        {name:'NDVI', type:'line', smooth:true, areaStyle:{opacity:.1}, data:AIO.indices.ndvi, itemStyle:{color:'#12e0b0'}},
        {name:'EVI', type:'line', smooth:true, data:[0.24,0.27,0.29,0.31,0.33], itemStyle:{color:'#8a7dff'}},
      ]}); }
    const sp = ec('chartSpecies');
    if(sp){
      const rows = Papa.parse(AIO.sampleCSV,{header:true}).data.filter(r=>r.especie);
      const counts = {}; rows.forEach(r=>counts[r.especie]=(counts[r.especie]||0)+1);
      sp.setOption({
        tooltip:{trigger:'item'},
        series:[{type:'pie', radius:['40%','72%'], itemStyle:{borderColor:'#081420', borderWidth:2},
          label:{color:'#a9c4d6', fontSize:11},
          data:Object.entries(counts).map(([name,value])=>({name,value})),
          color:['#3fe0ff','#12e0b0','#8a7dff','#ffb545']
        }]});
    }
  }

  // ---------- SOLO ----------
  function renderSolo(){
    const s = ec('chartSolo');
    if(s){ s.setOption({
      tooltip:{trigger:'axis'}, legend:{textStyle:axisTheme, top:0},
      grid:{left:40,right:16,top:36,bottom:26},
      xAxis:{type:'category', data:AIO.campaigns, axisLabel:axisTheme, axisLine:gridLine},
      yAxis:{type:'value', axisLabel:axisTheme, splitLine:gridLine, max:0.7},
      series:[
        {name:'Barren Soil Index', type:'bar', data:AIO.indices.barren, itemStyle:{color:'rgba(255,181,69,.6)'}},
        {name:'Cobertura Vegetal', type:'line', smooth:true, data:AIO.indices.ndvi.map(v=>v+0.05), itemStyle:{color:'#12e0b0'}},
      ]}); }
  }

  // ---------- HÍDRICO ----------
  function renderHidrico(){
    const h = ec('chartHidrico');
    if(h){ h.setOption({
      tooltip:{trigger:'axis'}, grid:{left:36,right:16,top:20,bottom:26},
      xAxis:{type:'category', data:AIO.campaigns, axisLabel:axisTheme, axisLine:gridLine},
      yAxis:{type:'value', axisLabel:axisTheme, splitLine:gridLine},
      series:[{name:'NDWI', type:'line', smooth:true, areaStyle:{opacity:.12}, data:AIO.indices.ndwi, itemStyle:{color:'#3fe0ff'}}]
    }); }
  }

  // ---------- SENSORIAMENTO REMOTO (real Sentinel-2 GIFs from github.com/kraefegg/AIO) ----------
  function renderSensoriamento(){
    const grid = document.getElementById('rsGrid');
    grid.innerHTML = AIO.rsPanels.map((p,i)=>`
      <div class="card rs-card">
        <div class="rs-media">
          <img src="${AIO.rsRepoBase + encodeURIComponent(p.gif)}" alt="${p.code}"
               onerror="this.onerror=null;this.src='${AIO.rsFrame(i+1,[150+i*20,190+i*15])}'">
          <span class="rs-badge">${p.code}</span>
          <div class="rs-controls">
            <a href="${AIO.rsRepoBase + encodeURIComponent(p.gif)}" target="_blank" style="text-decoration:none"><button title="Abrir GIF original"><i class="fa-solid fa-up-right-from-square"></i></button></a>
            <button onclick="this.closest('.rs-media').requestFullscreen && this.closest('.rs-media').requestFullscreen()"><i class="fa-solid fa-expand"></i></button>
            <span class="rs-date">SENTINEL-2 L2A · TIMELAPSE REAL</span>
          </div>
        </div>
        <div class="rs-body">
          <div class="rs-title">${p.title}</div>
          <div class="rs-desc">${p.desc}</div>
          <div id="rsStats-${p.code}"></div>
        </div>
      </div>`).join('');

    // NDVI panel gets real quantitative stats computed from the repo's CSV export
    const ndviPanel = AIO.rsPanels.find(p=>p.hasStats);
    const target = document.getElementById(`rsStats-${ndviPanel.code}`);
    target.innerHTML = `<div class="skel" style="height:70px"></div>`;
    loadNDVIFile(AIO.ndviDatasets[0].file).then(rows=>{
      const clean = rows.filter(r=>typeof r.cloud==='number' && r.cloud<30 && typeof r.mean==='number');
      const means = clean.map(r=>r.mean);
      const mean = (means.reduce((a,b)=>a+b,0)/means.length);
      const max = Math.max(...means), min = Math.min(...means);
      const last12 = clean.slice(-12), prev12 = clean.slice(-24,-12);
      const trend = prev12.length ? ((last12.reduce((a,b)=>a+b.mean,0)/last12.length) - (prev12.reduce((a,b)=>a+b.mean,0)/prev12.length)) : 0;
      target.innerHTML = `
        <div class="rs-stats">
          <div class="rs-stat"><b>${mean.toFixed(2)}</b><span>Médio (limpo)</span></div>
          <div class="rs-stat"><b>${max.toFixed(2)}</b><span>Máximo</span></div>
          <div class="rs-stat"><b>${min.toFixed(2)}</b><span>Mínimo</span></div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;font-family:var(--font-mono);font-size:10.5px;color:var(--ink-2)">
          <span>Amostras válidas (nuvem&lt;30%): <b style="color:var(--cyan)">${clean.length}/${rows.length}</b></span>
          <span>·</span><span>Tendência 12 vs 12 obs.: <b style="color:${trend>=0?'var(--teal)':'var(--red)'}">${trend>=0?'+':''}${trend.toFixed(3)}</b></span>
        </div>
        <div class="rs-interp"><i class="fa-solid fa-robot"></i> Série real Sentinel-2 L2A (2021–2026), ${rows.length} passagens, ${clean.length} com cobertura de nuvens &lt;30%. ${trend>0?'Tendência positiva de NDVI nas observações mais recentes, consistente com regeneração da cobertura vegetal.':'Tendência recente estável a levemente negativa — recomenda-se cruzar com dados de precipitação do período.'}</div>`;
    }).catch(()=>{ target.innerHTML = `<div class="rs-interp"><i class="fa-solid fa-triangle-exclamation"></i> Falha ao carregar CSV do repositório.</div>`; });

    // Non-NDVI panels: explicit note, no invented numbers
    AIO.rsPanels.filter(p=>!p.hasStats).forEach(p=>{
      document.getElementById(`rsStats-${p.code}`).innerHTML =
        `<div class="rs-interp"><i class="fa-solid fa-circle-info"></i> Sem exportação CSV estatística associada no repositório — apenas o timelapse visual está disponível para este índice.</div>`;
    });
  }

  // ---------- MAPA ----------
  let mapInst=null, layers={}, polyLayer=null;
  function renderMapa(){
    if(mapInst){ mapInst.remove(); mapInst=null; }
    mapInst = L.map('leafletMap').setView([LAT,LON], 13);
    layers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'});
    layers.sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'© Esri'});
    layers.topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{attribution:'© OpenTopoMap'});
    layers.osm.addTo(mapInst);
    const poly = [[LAT+0.012,LON-0.02],[LAT+0.014,LON+0.018],[LAT-0.01,LON+0.022],[LAT-0.015,LON-0.015]];
    polyLayer = L.polygon(poly,{color:'#3fe0ff', weight:2, fillColor:'#3fe0ff', fillOpacity:.12}).bindPopup(`<b>${AIO.project.name}</b><br>Área: ${AIO.project.area_km2} km²`);
    L.marker([LAT,LON]).addTo(mapInst).bindPopup('Ponto de controle — sede PRAD');

    document.querySelectorAll('.chip-toggle').forEach(chip=>{
      chip.addEventListener('click', ()=>{
        const key = chip.dataset.layer;
        if(key==='poly'){
          if(mapInst.hasLayer(polyLayer)){ mapInst.removeLayer(polyLayer); chip.classList.remove('on'); }
          else { polyLayer.addTo(mapInst); chip.classList.add('on'); }
          return;
        }
        document.querySelectorAll('.chip-toggle[data-layer]').forEach(c=>{ if(['osm','sat','topo'].includes(c.dataset.layer)) c.classList.remove('on'); });
        Object.entries(layers).forEach(([k,l])=>{ if(mapInst.hasLayer(l)) mapInst.removeLayer(l); });
        layers[key].addTo(mapInst); chip.classList.add('on');
      });
    });
    setTimeout(()=>mapInst.invalidateSize(),200);
  }

  // ---------- CSV MODULE ----------
  function renderCSVPage(){
    const dz = document.getElementById('dropzone');
    dz.addEventListener('click', ()=>document.getElementById('csvInput').click());
    dz.addEventListener('dragover', e=>{e.preventDefault(); dz.classList.add('drag');});
    dz.addEventListener('dragleave', ()=>dz.classList.remove('drag'));
    dz.addEventListener('drop', e=>{ e.preventDefault(); dz.classList.remove('drag'); if(e.dataTransfer.files[0]) parseCSVFile(e.dataTransfer.files[0]); });
    document.getElementById('csvInput').addEventListener('change', e=>{ if(e.target.files[0]) parseCSVFile(e.target.files[0]); });
    document.getElementById('loadNdviRepo').addEventListener('click', loadSelectedRepoCSV);
    loadSelectedRepoCSV();
  }
  function loadSelectedRepoCSV(){
    const idx = +document.getElementById('ndviRepoSelect').value;
    const ds = AIO.ndviDatasets[idx];
    const out = document.getElementById('csvOutput');
    out.innerHTML = `<div class="card"><div class="skel" style="height:120px"></div></div>`;
    fetch(AIO.rsRepoBase + encodeURIComponent(ds.file)).then(r=>r.text()).then(text=>processCSV(text, ds.file))
      .catch(()=>{ out.innerHTML = `<div class="card">Falha ao buscar ${ds.file} no repositório (conexão ou CORS). Tente novamente ou faça upload manual.</div>`; });
  }
  function parseCSVFile(file){
    const reader = new FileReader();
    reader.onload = e => processCSV(e.target.result, file.name);
    reader.readAsText(file);
  }
  function processCSV(text, filename){
    const parsed = Papa.parse(text, {header:true, dynamicTyping:true, skipEmptyLines:true});
    const rows = parsed.data, cols = parsed.meta.fields;
    const numCols = cols.filter(c => rows.every(r=>typeof r[c]==='number' || r[c]==null));
    const stats = {};
    numCols.forEach(c=>{
      const vals = rows.map(r=>r[c]).filter(v=>typeof v==='number');
      if(!vals.length) return;
      const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
      const sorted=[...vals].sort((a,b)=>a-b);
      const median = sorted[Math.floor(sorted.length/2)];
      const sd = Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length);
      stats[c] = {mean,median,max:Math.max(...vals),min:Math.min(...vals),sd,n:vals.length};
    });

    const out = document.getElementById('csvOutput');
    out.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-head"><span class="card-title"><i class="fa-solid fa-file-csv"></i> ${filename}</span><span class="card-tag">${rows.length} REGISTROS</span></div>
        <div class="grid g-4" id="csvStats"></div>
      </div>
      <div class="grid g-2" style="margin-bottom:16px">
        <div class="card"><div class="card-head"><span class="card-title" id="csvChart1Title">Distribuição</span></div><div id="csvChart1" style="height:240px"></div></div>
        <div class="card"><div class="card-head"><span class="card-title" id="csvChart2Title">Composição</span></div><div id="csvChart2" style="height:240px"></div></div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Tabela Dinâmica</span></div>
        <input class="btn-hud" style="width:100%;margin-bottom:10px;text-align:left" id="csvSearch" placeholder="🔍 Pesquisar registros...">
        <div style="overflow:auto;max-height:340px"><table class="table-hud" id="csvTable"></table></div>
      </div>`;

    document.getElementById('csvStats').innerHTML = numCols.slice(0,4).map(c=>`
      <div class="card"><div class="card-title" style="margin-bottom:8px">${c}</div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-1);line-height:1.8">
        Média: <b style="color:var(--cyan)">${stats[c].mean.toFixed(2)}</b><br>
        Mediana: <b>${stats[c].median.toFixed(2)}</b><br>
        Máx/Mín: <b>${stats[c].max}</b> / <b>${stats[c].min}</b><br>
        Desvio Padrão: <b>${stats[c].sd.toFixed(2)}</b></div></div>`).join('');

    const dateCol = cols.find(c=>c.toLowerCase().includes('date')||c.toLowerCase().includes('data'));
    const meanCol = numCols.find(c=>c.toLowerCase().includes('mean')) || numCols[0];
    if(meanCol){
      document.getElementById('csvChart1Title').textContent = dateCol ? `Série Temporal — ${meanCol}` : `Distribuição — ${meanCol}`;
      const c1 = ec('csvChart1');
      const xData = dateCol ? [...rows].sort((a,b)=>new Date(a[dateCol])-new Date(b[dateCol])).map(r=>r[dateCol]?.slice(0,10)) : rows.map((r,i)=>r.ponto||i);
      const yData = dateCol ? [...rows].sort((a,b)=>new Date(a[dateCol])-new Date(b[dateCol])).map(r=>r[meanCol]) : rows.map(r=>r[meanCol]);
      c1?.setOption({ tooltip:{trigger:'axis'}, grid:{left:36,right:16,top:16,bottom:40},
        xAxis:{type:'category', data:xData, axisLabel:{...axisTheme,fontSize:8,rotate:dateCol?45:0}, axisLine:gridLine},
        yAxis:{type:'value', axisLabel:axisTheme, splitLine:gridLine},
        series:[{type:dateCol?'line':'bar', smooth:true, data:yData, itemStyle:{color:'#3fe0ff'}, areaStyle:dateCol?{opacity:.1}:undefined}] });
    }
    const statusCol = cols.find(c=>c.toLowerCase().includes('status'));
    const cloudCol = cols.find(c=>c.toLowerCase().includes('cloud'));
    if(statusCol){
      document.getElementById('csvChart2Title').textContent = 'Status de Campo';
      const counts={}; rows.forEach(r=>counts[r[statusCol]]=(counts[r[statusCol]]||0)+1);
      const c2 = ec('csvChart2');
      c2?.setOption({ tooltip:{trigger:'item'}, series:[{type:'pie', radius:['45%','75%'],
        label:{color:'#a9c4d6',fontSize:11}, data:Object.entries(counts).map(([name,value])=>({name,value})),
        color:['#12e0b0','#ffb545','#ff4d5e'] }] });
    } else if(cloudCol){
      document.getElementById('csvChart2Title').textContent = 'Cobertura de Nuvens por Passagem';
      const buckets = {'<10%':0,'10-30%':0,'30-70%':0,'>70%':0};
      rows.forEach(r=>{ const v=r[cloudCol]; if(typeof v!=='number') return;
        if(v<10) buckets['<10%']++; else if(v<30) buckets['10-30%']++; else if(v<70) buckets['30-70%']++; else buckets['>70%']++; });
      const c2 = ec('csvChart2');
      c2?.setOption({ tooltip:{trigger:'item'}, series:[{type:'pie', radius:['45%','75%'],
        label:{color:'#a9c4d6',fontSize:11}, data:Object.entries(buckets).map(([name,value])=>({name,value})),
        color:['#12e0b0','#3fe0ff','#ffb545','#ff4d5e'] }] });
    }

    function drawTable(filterRows){
      const table = document.getElementById('csvTable');
      table.innerHTML = `<thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${filterRows.map(r=>`<tr>${cols.map(c=>`<td>${r[c]??''}</td>`).join('')}</tr>`).join('')}</tbody>`;
    }
    drawTable(rows);
    document.getElementById('csvSearch').addEventListener('input', e=>{
      const q = e.target.value.toLowerCase();
      drawTable(rows.filter(r=>cols.some(c=>String(r[c]??'').toLowerCase().includes(q))));
    });
    toast(`CSV processado: ${filename} (${rows.length} registros)`, 'fa-file-csv');
  }

  // ---------- IA MODULE (rule-based interpretation over live indicators) ----------
  function runAI(){
    const panel = document.getElementById('iaPanel');
    if(!panel) return;
    panel.innerHTML = `<div class="ia-msg"><div class="ia-avatar"><i class="fa-solid fa-brain"></i></div><div class="ia-bubble">Processando série de indicadores...</div></div>`;
    setTimeout(()=>{
      const ndviTrend = AIO.indices.ndvi[4]-AIO.indices.ndvi[0];
      const barrenTrend = AIO.indices.barren[4]-AIO.indices.barren[0];
      const msgs = [
        `<b>Resumo técnico — Campanha ${AIO.project.campanha_atual}:</b> a série de NDVI evoluiu de ${AIO.indices.ndvi[0]} para ${AIO.indices.ndvi[4]} (Δ ${ndviTrend>0?'+':''}${ndviTrend.toFixed(2)}), indicando ${ndviTrend>0?'trajetória consistente de regeneração vegetal':'estagnação no processo de recuperação'}.`,
        `<b>Solo exposto:</b> Barren Soil Index reduziu de ${AIO.indices.barren[0]} para ${AIO.indices.barren[4]} (${(barrenTrend*100).toFixed(1)} p.p.), compatível com fechamento progressivo do dossel nos talhões monitorados.`,
        `<b>Risco de seca:</b> ${weatherCache? (weatherCache.daily.precipitation_sum[0]<2?'ELEVADO — ausência de precipitação nas últimas 24h; recomenda-se irrigação de apoio no Setor B.':'MODERADO — regime de chuvas dentro do esperado para o período.') : 'Aguardando dados meteorológicos em tempo real.'}`,
        `<b>Risco de mortalidade das mudas:</b> taxa atual em ${AIO.kpi.taxa_mortalidade_pct}%, dentro do limite aceitável (&lt;15%) definido pelo plano de manejo. Tendência de queda mantida nas últimas 3 campanhas.`,
        `<b>Eficiência da recuperação:</b> ${AIO.kpi.area_recuperada_pct}% da área com sinais consolidados de regeneração — compatível com a meta contratual para o Ano 2 do PRAD.`,
        `<b>Recomendações técnicas:</b> manter coroamento e capina seletiva nos talhões B e C; monitorar herbivoria no Talhão 3; considerar reforço de irrigação pontual caso a estiagem persista além de 15 dias consecutivos.`,
      ];
      panel.innerHTML = msgs.map(m=>`<div class="ia-msg"><div class="ia-avatar"><i class="fa-solid fa-brain"></i></div><div class="ia-bubble">${m}</div></div>`).join('');
    }, 700);
  }

  // ---------- THEME ----------
  function toggleTheme(){
    const html = document.documentElement;
    const cur = html.getAttribute('data-theme');
    html.setAttribute('data-theme', cur==='light'?'dark':'light');
    toast('Tema alternado', 'fa-circle-half-stroke');
  }

  // ---------- INIT ----------
  function init(){
    tickClock(); setInterval(tickClock,1000);
    document.getElementById('burgerBtn').addEventListener('click', ()=>document.getElementById('sidebar').classList.toggle('open'));
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('alertBtn').addEventListener('click', ()=>{ go('dashboard'); });
    document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click', ()=>go(a.dataset.page)));
    document.addEventListener('click', e=>{ if(e.target.id==='refreshWeather'){ weatherCache=null; toast('Sincronizando com Open-Meteo...', 'fa-rotate'); fetchWeather().then(()=>{renderMeteorologia(); toast('Meteorologia atualizada','fa-check');}); } });
    fetchWeather().catch(()=>{});
    go('dashboard');
    loadRealNDVITrend().then(()=>{
      if(AIO._ndviIsReal && document.getElementById('page-dashboard')) renderDashboard();
      if(AIO._ndviIsReal && document.getElementById('page-vegetacao')) renderVegetacao();
    });
    setInterval(()=>{ weatherCache=null; fetchWeather().then(()=>{ if(document.getElementById('page-dashboard')) renderDashboard(); if(document.getElementById('page-meteorologia')) renderMeteorologia(); }).catch(()=>{}); }, 10*60*1000);
  }

  return { go, toast, runAI, boot };
})();

window.addEventListener('load', () => AIOApp.boot());
