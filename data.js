// ============ AIO OBSERVATORY — CORE DATA MODULE ============
const AIO = {
  project:{
    name:"PRAD Rio do Peixe I e II",
    municipio:"Caraúbas", uf:"PB", pais:"Brasil",
    area_km2:5.47, lat:-7.7283, lon:-36.4935,
    inicio:"2024-11", campanha_atual:"Julho/2026",
    bioma:"Caatinga"
  },
  // NDVI / spectral index synthetic monitoring series (campaign-based, consistent with monthly PRAD cadence)
  campaigns:["Mar/26","Abr/26","Mai/26","Jun/26","Jul/26"],
  indices:{
    ndvi:   [0.31,0.34,0.36,0.39,0.42],
    ndwi:   [0.12,0.14,0.13,0.16,0.18],
    moisture:[0.22,0.25,0.24,0.27,0.29],
    barren: [0.61,0.57,0.54,0.49,0.45],
  },
  kpi:{
    mudas_vivas_pct:78.4,
    area_recuperada_pct:52.0,
    cobertura_vegetal_pct:46.5,
    taxa_mortalidade_pct:11.2,
  },
  alerts:[
    {level:"warn", title:"Estiagem prolongada — Setor B", detail:"14 dias sem precipitação registrada > 1mm", time:"há 6h"},
    {level:"crit", title:"Herbivoria detectada — Talhão 3", detail:"Rebrota comprometida em 8% das mudas monitoradas", time:"há 1d"},
    {level:"info", title:"Campanha Jul/2026 concluída", detail:"Relatório mensal disponível para exportação", time:"há 2d"},
  ],
  // Sample field CSV (auto-loaded into the CSV module as demonstration dataset)
  sampleCSV:`data,ponto,especie,altura_cm,diametro_colo_mm,status,setor
2026-07-02,P01,Mimosa tenuiflora,86,14.2,vivo,A
2026-07-02,P02,Anadenanthera colubrina,64,10.8,vivo,A
2026-07-02,P03,Aspidosperma pyrifolium,41,7.5,estressado,A
2026-07-02,P04,Mimosa tenuiflora,92,15.1,vivo,B
2026-07-02,P05,Cenostigma pyramidale,38,6.9,morto,B
2026-07-02,P06,Anadenanthera colubrina,77,12.4,vivo,B
2026-07-02,P07,Aspidosperma pyrifolium,55,9.0,vivo,C
2026-07-02,P08,Mimosa tenuiflora,102,16.7,vivo,C
2026-07-02,P09,Cenostigma pyramidale,29,5.1,morto,C
2026-07-02,P10,Anadenanthera colubrina,68,11.0,estressado,A
2026-07-02,P11,Mimosa tenuiflora,95,15.8,vivo,B
2026-07-02,P12,Aspidosperma pyrifolium,47,8.2,vivo,C`,
  // Remote sensing panels — GIFs and NDVI series are REAL exports from github.com/kraefegg/AIO (Sentinel Hub / EO Browser).
  // Only NDVI has a quantitative CSV time series in the repo; the other 5 layers are timelapse GIFs without
  // accompanying stat exports, so their numeric fields are left null (UI shows "sem export CSV" instead of invented numbers).
  // Panel order assumed = order requested in the original brief (NDVI, Moisture, Moisture Stress, Barren Soil, Agriculture, NDWI);
  // filenames are opaque Sentinel Hub export IDs, so correct this mapping in Configurações if it does not match.
  rsRepoBase:"https://raw.githubusercontent.com/kraefegg/AIO/main/",
  rsPanels:[
    {code:"NDVI", gif:"Sentinel-2_L2A-1065485713259736-timelapse.gif", title:"Índice de Vegetação por Diferença Normalizada",
      desc:"Vigor fotossintético da cobertura vegetal, calculado via Sentinel-2 L2A. Único índice com série estatística (CSV) disponível no repositório.",
      hasStats:true},
    {code:"MOISTURE", gif:"Sentinel-2_L2A-1112016969931582-timelapse.gif", title:"Índice de Umidade (Moisture Index)",
      desc:"Conteúdo de água na vegetação, derivado de bandas NIR/SWIR do Sentinel-2 L2A.", hasStats:false},
    {code:"MSI", gif:"Sentinel-2_L2A-1292750752764826-timelapse.gif", title:"Estresse por Umidade (Moisture Stress Index)",
      desc:"Sensibilidade da vegetação ao déficit hídrico — valores elevados indicam estresse por seca.", hasStats:false},
    {code:"BSI", gif:"Sentinel-2_L2A-1574036575296061-timelapse.gif", title:"Índice de Solo Exposto (Barren Soil Index)",
      desc:"Fração de solo exposto sem cobertura vegetal — indicador direto de progresso da recuperação.", hasStats:false},
    {code:"AGRI", gif:"Sentinel-2_L2A-228009384174236-timelapse.gif", title:"Índice de Vigor Agrícola (Agriculture)",
      desc:"Combinação espectral (NIR/SWIR/Red) para monitoramento de vigor em áreas de manejo e entorno.", hasStats:false},
    {code:"NDWI", gif:"Sentinel-2_L2A-291278969510833-timelapse.gif", title:"Índice de Água por Diferença Normalizada",
      desc:"Conteúdo de água em corpos hídricos superficiais e vegetação próximos à área de recuperação.", hasStats:false},
  ],
  // NDVI CSV exports available in the repo (Sentinel Hub Statistical API format)
  ndviDatasets:[
    {label:"Histórico completo (2021–2026)", file:"Sentinel-2_L2A-3_NDVI-2021-08-02T00_00_00_000Z-2026-08-02T23_59_59_999Z.csv"},
    {label:"Últimos 2 anos (2024–2026)", file:"Sentinel-2_L2A-3_NDVI-2024-08-02T00_00_00_000Z-2026-08-02T23_59_59_999Z.csv"},
    {label:"Último ano (2025–2026)", file:"Sentinel-2_L2A-3_NDVI-2025-08-02T00_00_00_000Z-2026-08-02T23_59_59_999Z.csv"},
    {label:"Últimos 6 meses (Fev–Ago/2026)", file:"Sentinel-2_L2A-3_NDVI-2026-02-02T00_00_00_000Z-2026-08-02T23_59_59_999Z.csv"},
    {label:"Últimos 3 meses (Mai–Ago/2026)", file:"Sentinel-2_L2A-3_NDVI-2026-05-02T00_00_00_000Z-2026-08-02T23_59_59_999Z.csv"},
    {label:"Último mês (Jul–Ago/2026)", file:"Sentinel-2_L2A-3_NDVI-2026-07-02T00_00_00_000Z-2026-08-02T23_59_59_999Z.csv"},
  ],
};

// SVG fallback frame (used only if a repo GIF fails to load — e.g. offline)
AIO.rsFrame = function(seed, hue){
  const c = hue||[160,190];
  return `data:image/svg+xml;utf8,` + encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'>
    <defs>
      <linearGradient id='g${seed}' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='hsl(${c[0]},60%,10%)'/>
        <stop offset='100%' stop-color='hsl(${c[1]},70%,22%)'/>
      </linearGradient>
      <filter id='n${seed}'><feTurbulence baseFrequency='0.012 0.05' numOctaves='3' seed='${seed}' result='n'/><feColorMatrix in='n' type='matrix' values='0 0 0 0 0  0 0 0 0 0.6  0 0 0 0 0.6  0 0 0 0.35 0'/></filter>
    </defs>
    <rect width='640' height='400' fill='url(#g${seed})'/>
    <rect width='640' height='400' filter='url(#n${seed})' opacity='0.55'/>
    <g stroke='hsl(${c[1]},80%,60%)' stroke-width='0.4' opacity='0.25'>
      ${Array.from({length:8}).map((_,i)=>`<line x1='0' y1='${i*50}' x2='640' y2='${i*50}'/>`).join('')}
    </g>
  </svg>`);
};
