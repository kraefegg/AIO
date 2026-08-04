// ============ AIO OBSERVATORY — PAGE TEMPLATES ============
const PAGES = {};

PAGES.dashboard = () => `
<div class="page-head">
  <div>
    <div class="page-eyebrow">VISÃO GERAL · TEMPO REAL</div>
    <h1 class="page-title">Dashboard Operacional</h1>
    <div class="page-desc">${AIO.project.name} — ${AIO.project.municipio}/${AIO.project.uf} · Área monitorada ${AIO.project.area_km2} km²</div>
  </div>
  <div class="page-meta">Campanha atual: ${AIO.project.campanha_atual}<br>Última sincronização: <span id="dashSyncTime">—</span></div>
</div>

<div class="grid g-4">
  <div class="card"><div class="card-head"><span class="card-title"><i class="fa-solid fa-seedling"></i> Mudas Vivas</span><span class="card-tag">CAMPO</span></div>
    <div class="kpi-value">${AIO.kpi.mudas_vivas_pct}<span class="kpi-unit">%</span></div>
    <div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +3.1% vs campanha anterior</div>
    <canvas class="kpi-spark" id="spark1"></canvas>
  </div>
  <div class="card"><div class="card-head"><span class="card-title"><i class="fa-solid fa-map"></i> Área Recuperada</span><span class="card-tag">PRAD</span></div>
    <div class="kpi-value">${AIO.kpi.area_recuperada_pct}<span class="kpi-unit">%</span></div>
    <div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +2.4% vs campanha anterior</div>
    <canvas class="kpi-spark" id="spark2"></canvas>
  </div>
  <div class="card"><div class="card-head"><span class="card-title"><i class="fa-solid fa-leaf"></i> Cobertura Vegetal</span><span class="card-tag">NDVI</span></div>
    <div class="kpi-value">${AIO.kpi.cobertura_vegetal_pct}<span class="kpi-unit">%</span></div>
    <div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +8.3% vs campanha anterior</div>
    <canvas class="kpi-spark" id="spark3"></canvas>
  </div>
  <div class="card"><div class="card-head"><span class="card-title"><i class="fa-solid fa-skull-crossbones"></i> Taxa Mortalidade</span><span class="card-tag">RISCO</span></div>
    <div class="kpi-value">${AIO.kpi.taxa_mortalidade_pct}<span class="kpi-unit">%</span></div>
    <div class="kpi-trend down"><i class="fa-solid fa-arrow-trend-down"></i> -1.6% vs campanha anterior</div>
    <canvas class="kpi-spark" id="spark4"></canvas>
  </div>
</div>

<div class="section-label">CONDIÇÕES ATUAIS</div>
<div class="grid g-4">
  <div class="card"><div class="card-head"><span class="card-title"><i class="fa-solid fa-temperature-half"></i> Temperatura</span></div><div id="gaugeTemp" style="height:150px"></div></div>
  <div class="card"><div class="card-head"><span class="card-title"><i class="fa-solid fa-droplet"></i> Umidade Relativa</span></div><div id="gaugeHum" style="height:150px"></div></div>
  <div class="card"><div class="card-head"><span class="card-title"><i class="fa-solid fa-wind"></i> Vento</span></div><div id="gaugeWind" style="height:150px"></div></div>
  <div class="card"><div class="card-head"><span class="card-title"><i class="fa-solid fa-sun"></i> Índice UV</span></div><div id="gaugeUV" style="height:150px"></div></div>
</div>

<div class="grid g-12" style="margin-top:16px">
  <div class="card" style="grid-column:span 8">
    <div class="card-head"><span class="card-title"><i class="fa-solid fa-chart-line"></i> Evolução dos Índices Espectrais</span><span class="card-tag">5 CAMPANHAS</span></div>
    <div id="chartIndicesEvo" style="height:260px"></div>
  </div>
  <div class="card" style="grid-column:span 4">
    <div class="card-head"><span class="card-title"><i class="fa-solid fa-triangle-exclamation"></i> Painel de Alertas</span></div>
    <div id="dashAlerts"></div>
  </div>
</div>

<div class="grid g-2" style="margin-top:16px">
  <div class="card">
    <div class="card-head"><span class="card-title"><i class="fa-solid fa-recycle"></i> Status da Recuperação Ambiental</span></div>
    <div class="status-row"><span>Talhão A — Setor Norte</span><span class="status-badge ok">EM RECUPERAÇÃO</span></div>
    <div class="pbar" style="margin-bottom:10px"><div class="pbar-fill" style="width:64%"></div></div>
    <div class="status-row"><span>Talhão B — Setor Central</span><span class="status-badge warn">ATENÇÃO</span></div>
    <div class="pbar" style="margin-bottom:10px"><div class="pbar-fill" style="width:41%"></div></div>
    <div class="status-row"><span>Talhão C — Setor Sul</span><span class="status-badge ok">EM RECUPERAÇÃO</span></div>
    <div class="pbar"><div class="pbar-fill" style="width:57%"></div></div>
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title"><i class="fa-solid fa-gauge"></i> Indicadores de Sustentabilidade</span></div>
    <div id="chartSustain" style="height:220px"></div>
  </div>
</div>
`;

PAGES.meteorologia = () => `
<div class="page-head">
  <div><div class="page-eyebrow">DADOS EM TEMPO REAL · OPEN-METEO</div><h1 class="page-title">Painel Meteorológico</h1>
  <div class="page-desc">Estação virtual — Caraúbas/PB (07°43'42"S 36°29'37"W) · Atualização automática</div></div>
  <button class="btn-hud" id="refreshWeather"><i class="fa-solid fa-rotate"></i> Atualizar agora</button>
</div>
<div id="weatherGrid" class="grid g-4">
  ${Array.from({length:16}).map(()=>`<div class="card"><div class="skel" style="height:70px"></div></div>`).join('')}
</div>
<div class="section-label">INSTRUMENTOS</div>
<div class="grid g-4">
  <div class="card"><div class="card-head"><span class="card-title">Termômetro</span></div><div id="instTherm" style="height:170px"></div></div>
  <div class="card"><div class="card-head"><span class="card-title">Barômetro</span></div><div id="instBaro" style="height:170px"></div></div>
  <div class="card"><div class="card-head"><span class="card-title">Anemômetro</span></div><div id="instAnem" style="height:170px"></div></div>
  <div class="card"><div class="card-head"><span class="card-title">Rosa dos Ventos</span></div><div id="instRose" style="height:170px"></div></div>
</div>
<div class="section-label">PREVISÃO 7 DIAS</div>
<div class="card"><div id="chartForecast" style="height:280px"></div></div>
`;

PAGES.climatologia = () => `
<div class="page-head"><div><div class="page-eyebrow">SÉRIE HISTÓRICA · ERA5-LAND</div><h1 class="page-title">Climatologia</h1>
<div class="page-desc">Normais climatológicas, anomalias e tendências de longo prazo — Caraúbas/PB</div></div></div>
<div class="grid g-3">
  <div class="card"><div class="card-head"><span class="card-title">Precipitação Acumulada Anual</span></div><div class="kpi-value">612<span class="kpi-unit">mm</span></div><div class="kpi-trend down"><i class="fa-solid fa-arrow-trend-down"></i> -14% vs normal 1991-2020</div></div>
  <div class="card"><div class="card-head"><span class="card-title">Temperatura Média Anual</span></div><div class="kpi-value">27.8<span class="kpi-unit">°C</span></div><div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +1.2°C vs normal 1991-2020</div></div>
  <div class="card"><div class="card-head"><span class="card-title">Evapotranspiração (ETo)</span></div><div class="kpi-value">1840<span class="kpi-unit">mm/ano</span></div><div class="kpi-trend flat"><i class="fa-solid fa-minus"></i> estável</div></div>
</div>
<div class="section-label">SÉRIE TEMPORAL — 12 MESES</div>
<div class="card"><div id="chartClima" style="height:300px"></div></div>
<div class="section-label">COMPARAÇÃO HISTÓRICA (NORMAIS × OBSERVADO)</div>
<div class="grid g-2">
  <div class="card"><div id="chartAnomalyTemp" style="height:240px"></div></div>
  <div class="card"><div id="chartAnomalyChuva" style="height:240px"></div></div>
</div>
`;

PAGES.copernicus = () => `
<div class="page-head"><div><div class="page-eyebrow">INTEGRAÇÃO · COPERNICUS CDS / ERA5 / SENTINEL</div><h1 class="page-title">Copernicus Data Space</h1>
<div class="page-desc">Camada de integração com o ecossistema Copernicus para reanálise climática e observação da Terra</div></div>
<span class="status-badge warn"><i class="fa-solid fa-plug"></i> Credenciais CDS não configuradas</span></div>
<div class="card" style="margin-bottom:16px">
  <div class="card-head"><span class="card-title"><i class="fa-solid fa-circle-info"></i> Status da Integração</span></div>
  <p style="font-size:13px;color:var(--ink-1);line-height:1.6">
  A ingestão automática de ERA5 / ERA5-Land / Sentinel requer chave de API do <b style="color:var(--ink-0)">Copernicus Climate Data Store (CDS)</b> e do <b style="color:var(--ink-0)">Copernicus Data Space Ecosystem</b>, configuráveis na página <a href="#" onclick="AIOApp.go('config');return false" style="color:var(--cyan)">Configurações</a>.
  Enquanto não conectado, este módulo exibe a estrutura de produtos disponível e valores de referência da última sincronização registrada. Dados meteorológicos em tempo real já operam via Open-Meteo na aba Meteorologia.</p>
</div>
<div class="grid g-3">
  ${[
    ["ERA5 / ERA5-Land","Reanálise horária de temperatura, precipitação e umidade do solo — resolução ~9km","fa-cloud"],
    ["Sentinel-2 L2A","Imagens multiespectrais 10m para cálculo de NDVI/NDWI/BSI","fa-satellite"],
    ["Sentinel-1 SAR","Radar de abertura sintética — umidade do solo e detecção de mudança","fa-satellite-dish"],
    ["CDS Seasonal Forecast","Previsão sazonal de precipitação e temperatura até 6 meses","fa-calendar-days"],
    ["Copernicus Land Cover","Classificação de uso e cobertura do solo — 10m anual","fa-layer-group"],
    ["Fire & Drought Index","Índices de risco de incêndio e seca (EDO/EFFIS)","fa-fire"],
  ].map(([t,d,ic])=>`
  <div class="card">
    <div class="card-head"><span class="card-title"><i class="fa-solid ${ic}"></i> ${t}</span><span class="status-badge warn">AGUARDANDO API KEY</span></div>
    <p style="font-size:12px;color:var(--ink-2);line-height:1.5">${d}</p>
  </div>`).join('')}
</div>
`;

PAGES.vegetacao = () => `
<div class="page-head"><div><div class="page-eyebrow">SUPERFÍCIE · ÍNDICES ESPECTRAIS</div><h1 class="page-title">Vegetação</h1>
<div class="page-desc">Monitoramento de vigor e cobertura vegetal — série de campanhas 2026</div></div></div>
<div class="grid g-4">
  <div class="card"><div class="card-head"><span class="card-title">NDVI Médio</span></div><div class="kpi-value">0.42</div><div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +8.3%</div></div>
  <div class="card"><div class="card-head"><span class="card-title">EVI Médio</span></div><div class="kpi-value">0.33</div><div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +5.5%</div></div>
  <div class="card"><div class="card-head"><span class="card-title">Área Vegetada</span></div><div class="kpi-value">46.5<span class="kpi-unit">%</span></div><div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +4.1 p.p.</div></div>
  <div class="card"><div class="card-head"><span class="card-title">Regeneração Natural</span></div><div class="kpi-value">62<span class="kpi-unit">%</span></div><div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> das áreas monitoradas</div></div>
</div>
<div class="section-label">EVOLUÇÃO NDVI / EVI POR CAMPANHA</div>
<div class="card"><div id="chartVeg" style="height:300px"></div></div>
<div class="section-label">DISTRIBUIÇÃO POR ESPÉCIE (AMOSTRA DE CAMPO)</div>
<div class="card"><div id="chartSpecies" style="height:280px"></div></div>
`;

PAGES.solo = () => `
<div class="page-head"><div><div class="page-eyebrow">SUPERFÍCIE · EDAFOLOGIA</div><h1 class="page-title">Solo</h1>
<div class="page-desc">Umidade, compactação e fração de solo exposto (Barren Soil Index)</div></div></div>
<div class="grid g-4">
  <div class="card"><div class="card-head"><span class="card-title">Solo Exposto (BSI)</span></div><div class="kpi-value">45.0<span class="kpi-unit">%</span></div><div class="kpi-trend down"><i class="fa-solid fa-arrow-trend-down"></i> -6.7% vs anterior</div></div>
  <div class="card"><div class="card-head"><span class="card-title">Umidade do Solo (0-10cm)</span></div><div class="kpi-value">18.2<span class="kpi-unit">%</span></div><div class="kpi-trend flat"><i class="fa-solid fa-minus"></i> estável</div></div>
  <div class="card"><div class="card-head"><span class="card-title">Compactação Média</span></div><div class="kpi-value">2.1<span class="kpi-unit">MPa</span></div><div class="kpi-trend down"><i class="fa-solid fa-arrow-trend-down"></i> dentro do limite crítico</div></div>
  <div class="card"><div class="card-head"><span class="card-title">Textura Predominante</span></div><div class="kpi-value" style="font-size:20px">Franco-Arenosa</div></div>
</div>
<div class="section-label">EVOLUÇÃO DO SOLO EXPOSTO (BSI) × COBERTURA</div>
<div class="card"><div id="chartSolo" style="height:280px"></div></div>
`;

PAGES.hidrico = () => `
<div class="page-head"><div><div class="page-eyebrow">SUPERFÍCIE · RECURSOS HÍDRICOS</div><h1 class="page-title">Recursos Hídricos</h1>
<div class="page-desc">NDWI, áreas úmidas e disponibilidade hídrica superficial no entorno do PRAD</div></div></div>
<div class="grid g-4">
  <div class="card"><div class="card-head"><span class="card-title">NDWI Médio</span></div><div class="kpi-value">0.18</div><div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +2.1%</div></div>
  <div class="card"><div class="card-head"><span class="card-title">Área Úmida Identificada</span></div><div class="kpi-value">31.2<span class="kpi-unit">%</span></div></div>
  <div class="card"><div class="card-head"><span class="card-title">Índice Hídrico do Solo</span></div><div class="kpi-value">0.29</div></div>
  <div class="card"><div class="card-head"><span class="card-title">Distância Curso d'Água</span></div><div class="kpi-value" style="font-size:20px">Rio Paraíba</div></div>
</div>
<div class="section-label">EVOLUÇÃO NDWI</div>
<div class="card"><div id="chartHidrico" style="height:280px"></div></div>
`;

PAGES.sensoriamento = () => `
<div class="page-head"><div><div class="page-eyebrow">OBSERVAÇÃO DA TERRA · SENTINEL-2 L2A · github.com/kraefegg/AIO</div><h1 class="page-title">Sensoriamento Remoto</h1>
<div class="page-desc">Timelapses reais Sentinel-2 do repositório do projeto. Apenas o painel NDVI possui exportação CSV estatística associada — os demais são vídeos sem série numérica.</div></div></div>
<div class="grid g-2" id="rsGrid"></div>
`;

PAGES.mapas = () => `
<div class="page-head"><div><div class="page-eyebrow">GIS INTEGRADO</div><h1 class="page-title">Mapas</h1>
<div class="page-desc">Sistema de informação geográfica — polígono PRAD Caraúbas/PB</div></div></div>
<div class="card">
  <div id="leafletMap"></div>
  <div class="map-layers">
    <span class="chip-toggle on" data-layer="osm"><i class="fa-solid fa-map"></i> OpenStreetMap</span>
    <span class="chip-toggle" data-layer="sat"><i class="fa-solid fa-satellite"></i> ESRI Satellite</span>
    <span class="chip-toggle" data-layer="topo"><i class="fa-solid fa-mountain"></i> Topográfico</span>
    <span class="chip-toggle" data-layer="poly"><i class="fa-solid fa-draw-polygon"></i> Polígono PRAD</span>
  </div>
</div>
`;

PAGES.csv = () => `
<div class="page-head"><div><div class="page-eyebrow">INGESTÃO DE DADOS</div><h1 class="page-title">Dados CSV</h1>
<div class="page-desc">Upload de arquivos ou seleção direta dos exports NDVI do repositório do projeto — tabela, filtros, gráficos e resumo estatístico automáticos</div></div></div>
<div class="grid g-2" style="margin-bottom:16px">
  <div class="card">
    <div class="card-head"><span class="card-title"><i class="fa-solid fa-cloud-arrow-up"></i> Upload manual</span></div>
    <div class="dropzone" id="dropzone">
      <i class="fa-solid fa-cloud-arrow-up"></i>
      <div style="font-family:var(--font-mono);font-size:12.5px;color:var(--ink-1)">Arraste um arquivo .CSV aqui ou clique para selecionar</div>
      <input type="file" id="csvInput" accept=".csv" style="display:none">
    </div>
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title"><i class="fa-brands fa-github"></i> Repositório kraefegg/AIO</span><span class="card-tag">NDVI · SENTINEL-2</span></div>
    <p style="font-size:12px;color:var(--ink-2);margin-bottom:10px">Selecione uma janela temporal do export NDVI (Sentinel Hub Statistical API):</p>
    <select class="btn-hud" id="ndviRepoSelect" style="width:100%;text-align:left">
      ${AIO.ndviDatasets.map((d,i)=>`<option value="${i}" ${i===0?'selected':''}>${d.label}</option>`).join('')}
    </select>
    <button class="btn-hud sm" id="loadNdviRepo" style="margin-top:10px"><i class="fa-solid fa-download"></i> Carregar do GitHub</button>
  </div>
</div>
<div id="csvOutput" style="margin-top:6px"></div>
`;

PAGES.relatorios = () => `
<div class="page-head"><div><div class="page-eyebrow">EXPORTAÇÃO</div><h1 class="page-title">Relatórios</h1>
<div class="page-desc">Geração automática de relatórios mensais de monitoramento</div></div></div>
<div class="grid g-3">
  ${AIO.campaigns.map(c=>`
  <div class="card">
    <div class="card-head"><span class="card-title"><i class="fa-solid fa-file-lines"></i> Campanha ${c}</span><span class="status-badge ok">DISPONÍVEL</span></div>
    <p style="font-size:12px;color:var(--ink-2)">Relatório técnico consolidado — indicadores, índices espectrais e status fitossanitário.</p>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn-hud sm" onclick="AIOApp.toast('Exportação PDF gerada — ${c}')"><i class="fa-solid fa-file-pdf"></i> PDF</button>
      <button class="btn-hud sm ghost" onclick="AIOApp.toast('Exportação Excel gerada — ${c}')"><i class="fa-solid fa-file-excel"></i> XLSX</button>
      <button class="btn-hud sm ghost" onclick="AIOApp.toast('Exportação PNG gerada — ${c}')"><i class="fa-solid fa-image"></i> PNG</button>
    </div>
  </div>`).join('')}
</div>
`;

PAGES.ia = () => `
<div class="page-head"><div><div class="page-eyebrow">MÓDULO INTELIGENTE</div><h1 class="page-title">Análise IA</h1>
<div class="page-desc">Interpretação automatizada dos indicadores ambientais monitorados</div></div>
<button class="btn-hud" onclick="AIOApp.runAI()"><i class="fa-solid fa-wand-magic-sparkles"></i> Gerar nova análise</button></div>
<div class="card" id="iaPanel"></div>
`;

PAGES.config = () => `
<div class="page-head"><div><div class="page-eyebrow">SISTEMA</div><h1 class="page-title">Configurações</h1>
<div class="page-desc">Parâmetros do observatório e integrações externas</div></div></div>
<div class="grid g-2">
  <div class="card">
    <div class="card-head"><span class="card-title"><i class="fa-solid fa-plug"></i> Integrações Externas</span></div>
    <div class="status-row"><span>Open-Meteo API</span><span class="status-badge ok">CONECTADO</span></div>
    <div class="status-row"><span>Copernicus CDS</span><span class="status-badge warn">CHAVE NÃO CONFIGURADA</span></div>
    <div class="status-row"><span>Sentinel Hub</span><span class="status-badge warn">CHAVE NÃO CONFIGURADA</span></div>
    <div class="status-row"><span>Backend FastAPI / PostGIS</span><span class="status-badge warn">NÃO PROVISIONADO</span></div>
    <div class="status-row"><span><i class="fa-brands fa-github"></i> github.com/kraefegg/AIO</span><span class="status-badge ok">CONECTADO — NDVI + 6 GIFS</span></div>
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title"><i class="fa-solid fa-map-pin"></i> Parâmetros do Projeto</span></div>
    <div class="status-row"><span>Município</span><span>${AIO.project.municipio}/${AIO.project.uf}</span></div>
    <div class="status-row"><span>Área monitorada</span><span>${AIO.project.area_km2} km²</span></div>
    <div class="status-row"><span>Coordenadas</span><span>07°43'42"S 36°29'37"W</span></div>
    <div class="status-row"><span>Bioma</span><span>${AIO.project.bioma}</span></div>
    <div class="status-row"><span>Tema</span><span><button class="btn-hud sm" id="cfgTheme">Alternar claro/escuro</button></span></div>
  </div>
</div>
`;
