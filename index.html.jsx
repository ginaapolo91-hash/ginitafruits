import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "inventario-data";
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbxGoGV9iB2Ns9ydwACjSXJ7Ovd_YfEHwfZEopcywE41Ph8lJtB_SOg8OeZj5cKIM9MgLg/exec";

// ─── Utility helpers ───────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};
const fmtMoney = (n) => `$${Number(n).toFixed(2)}`;

// ─── Google Sheets integration ─────────────────────────────────
async function sendToSheets(payload) {
  try {
    const res = await fetch(SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (e) {
    console.error("Sheets error:", e);
    return false;
  }
}

// ─── Icons (inline SVG) ───────────────────────────────────────
const Icons = {
  Search: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
  ),
  Plus: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
  ),
  BoxIn: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><rect x="3" y="15" width="18" height="6" rx="2"/></svg>
  ),
  BoxOut: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 15V3m0 0-4 4m4-4 4 4"/><rect x="3" y="15" width="18" height="6" rx="2"/></svg>
  ),
  Package: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m16.5 9.4-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/></svg>
  ),
  Trash: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>
  ),
  History: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  ),
  Check: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
  ),
  X: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
  ),
  Alert: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
  ),
  Send: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
  ),
  Cloud: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
  ),
};

// ─── Persistent storage helper ────────────────────────────────
async function loadData() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    return result ? JSON.parse(result.value) : null;
  } catch {
    return null;
  }
}
async function saveData(data) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Storage save error:", e);
  }
}

const defaultData = {
  products: [
  { id: uid(), code: '0019585', name: 'ACEITUNA ENTERA X LB  ALFRESCO', cost: 2.77 },
  { id: uid(), code: '0023459', name: 'ACEITUNA NEGRA DESHUESADA X L', cost: 3.49 },
  { id: uid(), code: 'A1125', name: 'ACELGA', cost: 0.12 },
  { id: uid(), code: 'A1145', name: 'ACHOCCHA 6 X 1.00', cost: 0.1 },
  { id: uid(), code: 'A1160', name: 'ACHOTILLO 15 X 1', cost: 0.05 },
  { id: uid(), code: '7868000737417', name: 'AGRICOLA ARENAS ESPARRAGO DE 250 GR.', cost: 0.94 },
  { id: uid(), code: '7868000737424', name: 'AGRICOLA ARENAS UVILLA    275G', cost: 0.93 },
  { id: uid(), code: '0018273', name: 'AGRICOLA EL COLMENAR FRAMBRUESA', cost: 1.9 },
  { id: uid(), code: '7868000738711', name: 'AGRICOLA LECHUGA CRIOLLA', cost: 0.46 },
  { id: uid(), code: 'A1121', name: 'AGUACATE GRANDE', cost: 0.71 },
  { id: uid(), code: 'A1122', name: 'AGUACATE SERRANO', cost: 0.38 },
  { id: uid(), code: 'A1159', name: 'AJI ESCABECHI', cost: 0.57 },
  { id: uid(), code: '0024200', name: 'AJI JALAPEÑO EN PLATO', cost: 1.0 },
  { id: uid(), code: 'A1129', name: 'AJI ROKOTO', cost: 2.0 },
  { id: uid(), code: 'A1128', name: 'AJO CASCARA', cost: 0.95 },
  { id: uid(), code: 'A1127', name: 'AJO PELADO X LBR', cost: 1.4 },
  { id: uid(), code: '7862115530017', name: 'ALBAHACA FINCA PRISCILA 70G', cost: 0.5 },
  { id: uid(), code: '7862134110016', name: 'ALBAHACA VIVER 70 GR', cost: 0.63 },
  { id: uid(), code: 'A1132', name: 'ALCACHOFA', cost: 0.79 },
  { id: uid(), code: '2622220020675', name: 'ALFRESCO CEREZAS MARRASQUINO X LB', cost: 3.99 },
  { id: uid(), code: '7868001157528', name: 'ALMENDR EN TARRINA 70 GRA', cost: 1.0 },
  { id: uid(), code: '786100025212', name: 'ANTONELLA ROMANA LECHUGA', cost: 0.41 },
  { id: uid(), code: 'A1126', name: 'APIO', cost: 0.32 },
  { id: uid(), code: '7861000145879', name: 'APIO EN TALLO LA HUERTA', cost: 0.71 },
  { id: uid(), code: '7868001126906', name: 'ARANDANO AZUL STANDARP 125 MG', cost: 1.55 },
  { id: uid(), code: '0012797', name: 'ARANDANO DESIDRATADO X LBR', cost: 67.83 },
  { id: uid(), code: '8437006505246', name: 'ARANDANO IDEL BLUE 125 G', cost: 0.92 },
  { id: uid(), code: '0025183', name: 'ARANDANO ORGANICO AZUL', cost: 1.25 },
  { id: uid(), code: '7868000873269', name: 'ARANDANO PITUFOS 65 GR', cost: 0.75 },
  { id: uid(), code: '7861223810486', name: 'ARANDANO VASITO JUMBO', cost: 2.68 },
  { id: uid(), code: '7861223810479', name: 'ARANDANO VASO', cost: 1.85 },
  { id: uid(), code: '7861223802542', name: 'ARANDANOS FRESCOS SUPERMAXI 250G', cost: 2.92 },
  { id: uid(), code: 'B1120', name: 'BABACO', cost: 0.67 },
  { id: uid(), code: '033844001056', name: 'BADIA CEBOLLA PICADA', cost: 4.24 },
  { id: uid(), code: '7861000271974', name: 'BAYARDOS DULCE DE HIGOS 500 G', cost: 2.21 },
  { id: uid(), code: 'B1122', name: 'BERENJENA', cost: 0.5 },
  { id: uid(), code: 'B1123', name: 'BOROJO', cost: 1.0 },
  { id: uid(), code: 'B1121', name: 'BROCOLI', cost: 0.5 },
  { id: uid(), code: 'C1127', name: 'CAMOTE X LB', cost: 0.28 },
  { id: uid(), code: '0022328', name: 'CANASTA NAVIDEÑA PEQ', cost: 0.0 },
  { id: uid(), code: 'C1123', name: 'CEBOLLA BLANCA', cost: 0.27 },
  { id: uid(), code: 'C1121', name: 'CEBOLLA COLORADA X L', cost: 0.38 },
  { id: uid(), code: 'C1122', name: 'CEBOLLA PERLA X LB', cost: 0.24 },
  { id: uid(), code: '7862123410820', name: 'CEBOLLA PUERRO RC', cost: 0.39 },
  { id: uid(), code: '0007477', name: 'CEBOLLIN', cost: 0.44 },
  { id: uid(), code: '0025425', name: 'CEDRON FRESCO', cost: 0.1 },
  { id: uid(), code: '002307', name: 'CEREZA X LB', cost: 1.75 },
  { id: uid(), code: '7861042567332', name: 'CHAMP PORTOBELLO SOMBRILLA 230 G', cost: 2.81 },
  { id: uid(), code: '7861003530092', name: 'CHAMPIÑON FRESCO 100G', cost: 0.76 },
  { id: uid(), code: '7861003530139', name: 'CHAMPIÑONES ENTEROS', cost: 1.49 },
  { id: uid(), code: '7862115180229', name: 'CHAMPIÑONES LAMINADOS CEPA 200G', cost: 1.0 },
  { id: uid(), code: '7868000742404', name: 'CHERRY DALYS', cost: 1.05 },
  { id: uid(), code: 'C1120', name: 'CHIRIMOYA X LB', cost: 1.11 },
  { id: uid(), code: '0024980', name: 'CHOCLO COCINADO X LB', cost: 1.0 },
  { id: uid(), code: 'C1132', name: 'CHOCLO DESGRANADO', cost: 1.0 },
  { id: uid(), code: 'C1130', name: 'CHOCLO ENTERO SERRANO', cost: 0.39 },
  { id: uid(), code: '0016911', name: 'CIDRA X UNIDAD', cost: 0.16 },
  { id: uid(), code: '0015820', name: 'CIRUELA PASA X 1/2 LB', cost: 0.92 },
  { id: uid(), code: '0013024', name: 'CIRUELA PASA XLIBRA', cost: 1.91 },
  { id: uid(), code: 'C1136', name: 'CIRUELAS UNIDADES 20 X 1.00', cost: 0.01 },
  { id: uid(), code: '7862140890018', name: 'COCO DAY PELADO MEDIANO', cost: 1.99 },
  { id: uid(), code: '7861000164528', name: 'COCO FREEZE EMPACADO', cost: 1.23 },
  { id: uid(), code: 'C1124', name: 'COCO SECO', cost: 1.25 },
  { id: uid(), code: '0026274', name: 'COL DE BRUSELAS EN BANDEJA', cost: 1.0 },
  { id: uid(), code: 'C1129', name: 'COL MORADA REPOLLO', cost: 0.88 },
  { id: uid(), code: 'C1128', name: 'COL REPOLLO', cost: 1.0 },
  { id: uid(), code: 'C1126', name: 'COLIFLOR', cost: 0.6 },
  { id: uid(), code: '7861000170963', name: 'COLIFLOR EL VERGEL', cost: 0.82 },
  { id: uid(), code: '7861223802559', name: 'COLIFLOR HS', cost: 0.39 },
  { id: uid(), code: '7861223803419', name: 'COOLTIVA ARANDANO JUMBO AT', cost: 2.7 },
  { id: uid(), code: '7861042581208', name: 'COOLTIVA ARANDANO VASITO 125 G', cost: 1.5 },
  { id: uid(), code: '7861223803402', name: 'COOLTIVA ARANDANO VASITO AT', cost: 1.5 },
  { id: uid(), code: '7861223800364', name: 'COOLTIVA FRAMBUESA EG', cost: 1.19 },
  { id: uid(), code: '7861223800357', name: 'COOLTIVA FRAMBUESA PA', cost: 1.19 },
  { id: uid(), code: '7861223801354', name: 'COOLTIVA UVILLA PA', cost: 0.55 },
  { id: uid(), code: '7861042593997', name: 'COOLTIVA UVILLA VASITO', cost: 0.55 },
  { id: uid(), code: '7861042500933', name: 'COOLTIVA UVILLA VASO', cost: 0.57 },
  { id: uid(), code: '7861000248310', name: 'CORAZONES DE APLMITO CARLO 371 GR', cost: 0.0 },
  { id: uid(), code: 'C1131', name: 'CULANTRO / YERBITA', cost: 1.0 },
  { id: uid(), code: '0024892', name: 'CURCUMA FRESCA X LB', cost: 1.0 },
  { id: uid(), code: '7868000842371', name: 'DAMISAN LECHUGA CRESPA HIDROPONICA', cost: 0.5 },
  { id: uid(), code: '786800087920', name: 'DE MI SUEGRA PICO DE GALLO', cost: 1.88 },
  { id: uid(), code: '797701001442', name: 'DEDITOS DE YUCA FAC 400G', cost: 3.1 },
  { id: uid(), code: '764451779464', name: 'DELYFRUT ALMENDRA TARRINA  90 GR', cost: 1.15 },
  { id: uid(), code: '0024391', name: 'DELYFRUT ARANDANOS TARRINA', cost: 1.0 },
  { id: uid(), code: '764451779488', name: 'DELYFRUT NUEZ TARRINA 60 GR', cost: 1.0 },
  { id: uid(), code: '7868000932300', name: 'DON QUINO ZAPALLO PICADO', cost: 1.44 },
  { id: uid(), code: 'D1156', name: 'DURAZNO', cost: 0.18 },
  { id: uid(), code: 'D16600', name: 'DURAZNO ABRIDOR', cost: 0.27 },
  { id: uid(), code: '7868000989717', name: 'DURAZNO EN MALLA PEQUEÑO', cost: 0.85 },
  { id: uid(), code: '7862123410158', name: 'ECUA HORT MAIZ DULCE', cost: 1.98 },
  { id: uid(), code: '7862123410264', name: 'ECUAHORT ENELDO 100 G', cost: 0.72 },
  { id: uid(), code: '7862123410332', name: 'ECUAHORT LECHUGA CRESPA', cost: 0.42 },
  { id: uid(), code: '7862123410578', name: 'ECUAHORT APIO HIDROPONICO', cost: 0.91 },
  { id: uid(), code: '7862123410585', name: 'ECUAHORT NABO CHINO HIDROPONICO', cost: 0.69 },
  { id: uid(), code: '7862118990030', name: 'ECUAORGANIC LECHUGA ROJA', cost: 1.28 },
  { id: uid(), code: '7868001003627', name: 'ECUVEGETAL GRANADA', cost: 1.32 },
  { id: uid(), code: 'E1121', name: 'ENSALADAS DE FRUTAS', cost: 1.5 },
  { id: uid(), code: '7862124620594', name: 'ES VIDA ARSAICO UVILLA 200 GR', cost: 1.2 },
  { id: uid(), code: '7862124620457', name: 'ES VIDA RUCULA ORGANICA', cost: 1.43 },
  { id: uid(), code: '7861042594291', name: 'ESPARRAGO MORADO', cost: 0.0 },
  { id: uid(), code: '7868000837810', name: 'ESPARRAGOS PROAGRO TORRES 250', cost: 0.95 },
  { id: uid(), code: 'E1120', name: 'ESPINACA', cost: 0.46 },
  { id: uid(), code: 'M1122', name: 'ESTRACTO PURO DE MARACUYA', cost: 1.0 },
  { id: uid(), code: '7861042594925', name: 'ET LO NABO CHINO', cost: 0.39 },
  { id: uid(), code: '7861042513681', name: 'FINCA PRISCILA ALBAHACA CAPUCHON', cost: 0.5 },
  { id: uid(), code: '7862107783735', name: 'FLOR DE JAMAICA NATURES HEART', cost: 1.41 },
  { id: uid(), code: '7862107785876', name: 'FLOR DE JAMICA', cost: 0.59 },
  { id: uid(), code: '7868000717709', name: 'FRAMBUESA 125G', cost: 1.98 },
  { id: uid(), code: '7861223802092', name: 'FRAMBUESA EN VASO90GR', cost: 1.6 },
  { id: uid(), code: '7868000521221', name: 'FRAMBUESA GUADAPRODUCTS', cost: 1.82 },
  { id: uid(), code: '7861000250986', name: 'FRAMBUESAS AGRICOLA EL COLMENAR', cost: 2.24 },
  { id: uid(), code: '7861000140973', name: 'FRAMBUESAS OTOMS', cost: 2.39 },
  { id: uid(), code: '7861042596868', name: 'FRANBUESA CONGELADO 1 KG', cost: 0.0 },
  { id: uid(), code: 'F1121', name: 'FREJOL BLANCO', cost: 0.8 },
  { id: uid(), code: 'FB1121', name: 'FREJOL BLANCO RAYADO', cost: 1.5 },
  { id: uid(), code: '0017382', name: 'FREJOL BOLON BLANCO XLB', cost: 1.5 },
  { id: uid(), code: 'F11251', name: 'FREJOL BOLON ROJO TIERNO XLB', cost: 1.8 },
  { id: uid(), code: 'F1124', name: 'FREJOL CRIOLLO', cost: 1.15 },
  { id: uid(), code: '0025811', name: 'FREJOL CRIOLLO EN CASCARA', cost: 1.0 },
  { id: uid(), code: '0014286', name: 'FREJOL SECO BOCA NEGRA LB', cost: 1.0 },
  { id: uid(), code: '7868000963151', name: 'FRESH VEGGIES JUVAL TOMATE 200 G', cost: 0.65 },
  { id: uid(), code: '7862104260246', name: 'FRESHKITA MARACUYA PULPA FRESCA', cost: 2.18 },
  { id: uid(), code: '7862105710023', name: 'FRUTASI MORA PULPA 250 G', cost: 1.25 },
  { id: uid(), code: '786210571005', name: 'FRUTASI TOMATE DULCE PULPA 250 G', cost: 0.83 },
  { id: uid(), code: 'F1120', name: 'FRUTILLA X LB', cost: 1.37 },
  { id: uid(), code: '7862114870152', name: 'GERMINATU GERMINADO DE CEBOLLA', cost: 3.35 },
  { id: uid(), code: 'G1120', name: 'GRANADILLA', cost: 0.22 },
  { id: uid(), code: '7862103431265', name: 'GREE/GAR AJI JALAPENO VERDE 150G', cost: 0.71 },
  { id: uid(), code: '7862103432699', name: 'GREENGAR ZANAHORIA RALLADA 220 G', cost: 0.99 },
  { id: uid(), code: '7100000149976', name: 'GREENLAB LECHUGA HIDROPONICA ROSA VERDE', cost: 0.71 },
  { id: uid(), code: '0017063', name: 'GROSELLA CHINA', cost: 0.08 },
  { id: uid(), code: '7861223803242', name: 'GROSELLAS SALADITAS 280 GR', cost: 0.7 },
  { id: uid(), code: '0023337', name: 'GUABA X UNID', cost: 0.5 },
  { id: uid(), code: '0024562', name: 'GUABAS', cost: 1.5 },
  { id: uid(), code: 'G145', name: 'GUANABANA XLB', cost: 0.6 },
  { id: uid(), code: 'G1122', name: 'GUAYABAS UND 5 X 1.00', cost: 0.11 },
  { id: uid(), code: 'G8067', name: 'GUINEO CEDA CRIOLLO', cost: 0.05 },
  { id: uid(), code: 'G1124', name: 'GUINEO MADURO', cost: 0.06 },
  { id: uid(), code: 'G1125', name: 'GUINEO ORITO', cost: 0.83 },
  { id: uid(), code: 'G1123', name: 'GUINEO VERDE 12 X 1.00', cost: 0.04 },
  { id: uid(), code: '7861034910207', name: 'GUIPI CHAMPINON REBANADO BANDEJA 400 G', cost: 3.55 },
  { id: uid(), code: '7861034910436', name: 'GUIPI CHAMPIÑONES REB 125 G', cost: 1.18 },
  { id: uid(), code: '7861034910221', name: 'GUIPI CHAMPIÑONES REBANADO 200 G', cost: 1.76 },
  { id: uid(), code: '7861034910153', name: 'GUIPI CRIMINI ENTERO', cost: 2.34 },
  { id: uid(), code: '786103491037', name: 'GUIPI CRIMINI REBANADO', cost: 1.41 },
  { id: uid(), code: '0018151', name: 'H. HIERBAS COLADA MORADA.', cost: 0.79 },
  { id: uid(), code: '786104256620', name: 'H. PEREJIL', cost: 0.41 },
  { id: uid(), code: '0017408', name: 'HABA MANABA', cost: 1.0 },
  { id: uid(), code: '0017407', name: 'HABA REPELADA X LB.', cost: 1.5 },
  { id: uid(), code: '0002321', name: 'HABA SECA X LB', cost: 1.0 },
  { id: uid(), code: 'H1121', name: 'HABA X LBR', cost: 1.14 },
  { id: uid(), code: '7868001101729', name: 'HDC LECHUGA CRESPA', cost: 0.45 },
  { id: uid(), code: '7861042566137', name: 'HIERBA BUENA 100 G', cost: 0.37 },
  { id: uid(), code: '0024563', name: 'HIERBABUENA FRESCA', cost: 0.0 },
  { id: uid(), code: '7862103430169', name: 'HIERBABUENA GREEN GARDEN', cost: 0.65 },
  { id: uid(), code: '0017567', name: 'HIERBALUISA FRESCA', cost: 0.24 },
  { id: uid(), code: 'H16638', name: 'HIGOS', cost: 0.03 },
  { id: uid(), code: '7862101630578', name: 'HOJAS BABY DE REMOLACHA', cost: 0.0 },
  { id: uid(), code: '7861000216388', name: 'HONGOS SECOS DE PINO 50 GR', cost: 2.27 },
  { id: uid(), code: '7861182301537', name: 'HONGOS SECOS SALINERITO 50 GR', cost: 1.63 },
  { id: uid(), code: '7862101901166', name: 'HORTANA ALBAHACA', cost: 0.75 },
  { id: uid(), code: '7862101901876', name: 'HORTANA BABY LECHUGAS SALANOVA', cost: 0.79 },
  { id: uid(), code: '7862101901180', name: 'HORTANA BABY MIX 230 G', cost: 2.17 },
  { id: uid(), code: '786210190157', name: 'HORTANA COL MORADA', cost: 0.66 },
  { id: uid(), code: '7862101900800', name: 'HORTANA COL SLAW ENSALADA', cost: 1.82 },
  { id: uid(), code: '7862101904075', name: 'HORTANA COLIFLOR VERDE 400 G', cost: 0.79 },
  { id: uid(), code: '7862101901456', name: 'HORTANA KALE EMPACADO', cost: 1.39 },
  { id: uid(), code: '7862101901913', name: 'HORTANA KALE LISTO 100 G', cost: 2.74 },
  { id: uid(), code: '7861000111768', name: 'HORTANA LECGUGA CRIOLLA', cost: 0.73 },
  { id: uid(), code: '7862101900060', name: 'HORTANA LECHUGA CRESPA', cost: 0.97 },
  { id: uid(), code: '7862101901302', name: 'HORTANA LECHUGA ROMANA', cost: 1.07 },
  { id: uid(), code: '7862101900039', name: 'HORTANA PEREJIL CRESPO 100G', cost: 0.61 },
  { id: uid(), code: '7862101902187', name: 'HORTANA RADICHO 200 G', cost: 1.03 },
  { id: uid(), code: '7862101900725', name: 'HORTANA RUCULA 100G', cost: 1.3 },
  { id: uid(), code: '7862101900213', name: 'HORTANA TOMATE CHERRY 300 G', cost: 1.0 },
  { id: uid(), code: '7862101903719', name: 'HORTANA TOMATE CHERRY AMARILLO 200 G', cost: 1.59 },
  { id: uid(), code: '7862101901142', name: 'HORTANA ZANAHORIA RALLADA 250G', cost: 0.98 },
  { id: uid(), code: '7861000150927', name: 'HORTIFRESH COLIFLOR', cost: 0.78 },
  { id: uid(), code: '7861000179898', name: 'HORTIFRESH COLIFLOR PLATO 250G', cost: 0.6 },
  { id: uid(), code: '7861000168953', name: 'HORTIFRESH LECHUGA CRIOLLA', cost: 0.6 },
  { id: uid(), code: '7862115860022', name: 'HORTIFRESH PEPINO GOURMET', cost: 0.98 },
  { id: uid(), code: '7862113110136', name: 'HORTILISTO SAMBO PICADO 600 G', cost: 1.57 },
  { id: uid(), code: '7861000225724', name: 'HORTILISTO ZAPALLO PICADO 700 G', cost: 1.18 },
  { id: uid(), code: '7868001235103', name: 'ILARU ARANDANO DE ALTUR 125 MG', cost: 1.59 },
  { id: uid(), code: '7861022900913', name: 'INDAVES BLANC EXTRA GRAND OMEGA3', cost: 3.34 },
  { id: uid(), code: '0015569', name: 'ISHPINGO', cost: 1.25 },
  { id: uid(), code: '0016105', name: 'JAMAICA FRESCA X LB', cost: 1.2 },
  { id: uid(), code: '0016544', name: 'JAMAICA SECA 1/4 LB', cost: 1.0 },
  { id: uid(), code: '0012459', name: 'JAMAICA SECA X 1.75', cost: 1.3 },
  { id: uid(), code: '0000537', name: 'JAMAICA SECA XLB', cost: 2.27 },
  { id: uid(), code: '7861042578963', name: 'JC LO PAPA CECILIA', cost: 0.79 },
  { id: uid(), code: 'J11258', name: 'JENGIBRE  XLIBRAS', cost: 1.0 },
  { id: uid(), code: '7861000267380', name: 'JUVAL TOMATE CHERRY ROJO PERITA', cost: 1.53 },
  { id: uid(), code: '0012379', name: 'KAKI', cost: 0.22 },
  { id: uid(), code: '7861003530160', name: 'KENNET CHAMPINON FRESCO BANDEJA ENTEROS 400 G', cost: 1.49 },
  { id: uid(), code: '7861003530177', name: 'KENNET CHAMPINON LAMINADOS 400 G', cost: 2.88 },
  { id: uid(), code: '7861003530122', name: 'KENNET CHAMPIÑON REBANADO 200G', cost: 1.49 },
  { id: uid(), code: '7861003530085', name: 'KENNET CRIMINI CHAMPINONES ENTERO', cost: 0.0 },
  { id: uid(), code: '786100353002', name: 'KENNET PORTOBELLO SOMBRILLA ENTERO', cost: 2.33 },
  { id: uid(), code: 'K1120', name: 'KIWI', cost: 0.2 },
  { id: uid(), code: '7861223805581', name: 'KIWI L O FNDA X 4', cost: 0.79 },
  { id: uid(), code: '7862103903878', name: 'LA CUENCANA CHOCHO LIMON', cost: 0.91 },
  { id: uid(), code: '7862103904585', name: 'LA CUENCANA FREJOL ROJO 400 G', cost: 1.86 },
  { id: uid(), code: '7861000215770', name: 'LA PARCELA LECHUGA CRESPA', cost: 0.64 },
  { id: uid(), code: '786102980542', name: 'LA VALERIA MIX CEBOLLAS AL VACIO', cost: 1.51 },
  { id: uid(), code: '7861000140249', name: 'LA VERDE SUPER CHOCHO 360 G', cost: 0.0 },
  { id: uid(), code: '7862127210082', name: 'LA ZAMBICENA HIERBA BUENA', cost: 0.31 },
  { id: uid(), code: '7862101900053', name: 'LECHUGA CESAR ROMANA', cost: 0.78 },
  { id: uid(), code: '7861000141130', name: 'LECHUGA CRESPA LA HUERTA', cost: 0.54 },
  { id: uid(), code: '7861223804591', name: 'LECHUGA CRESPA LA ORIGINAL', cost: 0.4 },
  { id: uid(), code: '7862118990016', name: 'LECHUGA CRESPA ORGANICA ECUAORGANIC', cost: 1.02 },
  { id: uid(), code: '7861042531012', name: 'LECHUGA CRESPA SUPERMAXI', cost: 0.49 },
  { id: uid(), code: '7868001101712', name: 'LECHUGA CRIOLLA HERENCIA DE CAMPO 300-600G', cost: 0.51 },
  { id: uid(), code: '7861000252102', name: 'LECHUGA ORGANICA  ANTONELLA', cost: 0.42 },
  { id: uid(), code: 'L1121', name: 'LECHUGA REDONDA ORG.', cost: 0.62 },
  { id: uid(), code: '7861223829143', name: 'LECHUGA ROJA SEMBRAO', cost: 0.63 },
  { id: uid(), code: '7862118990023', name: 'LECHUGA ROMANA', cost: 1.08 },
  { id: uid(), code: 'L1125', name: 'LIMAS', cost: 0.1 },
  { id: uid(), code: 'L1120', name: 'LIMON GRANDE 20X 1 DOLAR', cost: 0.03 },
  { id: uid(), code: '7861021203350', name: 'LINAZA 40G', cost: 0.25 },
  { id: uid(), code: '7861042585121', name: 'LO CHAMPIÑONES REBA 145G', cost: 0.78 },
  { id: uid(), code: '7861223801125', name: 'LO CHERRY AMARILLO', cost: 0.79 },
  { id: uid(), code: '7861042592853', name: 'LO LIMON GRANDE EN MALLA', cost: 0.79 },
  { id: uid(), code: '7861042593928', name: 'LO NABO CHINO ECONOMICO', cost: 0.55 },
  { id: uid(), code: '7861042582281', name: 'LO TOMATE CHERRY', cost: 0.79 },
  { id: uid(), code: '7861042581123', name: 'LO TOMATE DULCE MALLA', cost: 0.79 },
  { id: uid(), code: '7861042580478', name: 'LO TOMATE RINON FDA', cost: 0.79 },
  { id: uid(), code: '786104250146', name: 'LO ZANAHORIA BABY', cost: 0.95 },
  { id: uid(), code: '7861042576761', name: 'LO.HUEVOS DE CODORNIZ', cost: 1.47 },
  { id: uid(), code: '7861223822700', name: 'LO.LECHUGA CRESPA JR', cost: 0.4 },
  { id: uid(), code: '7861223807578', name: 'LO.LECHUGA CRESPA URP', cost: 0.4 },
  { id: uid(), code: '786104258628', name: 'LO.ZANAHORIA RALLADA DMS', cost: 0.75 },
  { id: uid(), code: '7861042576341', name: 'LO.ZAPALLO PICADO', cost: 0.95 },
  { id: uid(), code: '7862122481463', name: 'LOS PAISAS GLASEADO DE MARACUYA 1.5 KG', cost: 3.12 },
  { id: uid(), code: '7862122481937', name: 'LOS PAISAS MERMELADA DE FRUTILLA 1.5 KG', cost: 3.42 },
  { id: uid(), code: '7862122481920', name: 'LOS PAISAS MERMELADA DE MORA 1.5 KG', cost: 3.95 },
  { id: uid(), code: '7862113114899', name: 'MAIZ AMARILLO TIERNO ORTILISTO', cost: 2.6 },
  { id: uid(), code: '797701001121', name: 'MAIZ DULCE FIESTA FAC 500G', cost: 2.08 },
  { id: uid(), code: 'M24900', name: 'MANDARINA SERRANA', cost: 0.15 },
  { id: uid(), code: 'M11346', name: 'MANGO EDWARE N° 18', cost: 0.4 },
  { id: uid(), code: 'M1158', name: 'MANGO VERDE TOMY', cost: 0.59 },
  { id: uid(), code: 'M11545', name: 'MANZANA PILEY 150', cost: 0.22 },
  { id: uid(), code: 'M11424', name: 'MANZANA ROJA 150', cost: 0.29 },
  { id: uid(), code: 'M1172', name: 'MANZANA ROJA 88', cost: 0.36 },
  { id: uid(), code: 'M24372', name: 'MANZANA ROYAL 100', cost: 0.34 },
  { id: uid(), code: '0017224', name: 'MANZANA ROYAL 113', cost: 0.31 },
  { id: uid(), code: 'M1178', name: 'MANZANA ROYAL 150', cost: 0.18 },
  { id: uid(), code: 'M18735', name: 'MANZANA ROYAL 198', cost: 0.18 },
  { id: uid(), code: 'M1179', name: 'MANZANA ROYAL 88', cost: 0.35 },
  { id: uid(), code: 'M1124', name: 'MANZANA VERDE 150', cost: 0.23 },
  { id: uid(), code: 'M1126', name: 'MANZANA WINTER 4X1.00', cost: 0.24 },
  { id: uid(), code: 'M1137', name: 'MANZANILLA HIERB', cost: 0.17 },
  { id: uid(), code: 'M1127', name: 'MARACUYA  X UND', cost: 0.22 },
  { id: uid(), code: '7792750000937', name: 'MARBELLA ANCHOAS AC', cost: 5.13 },
  { id: uid(), code: 'MELLOCOS', name: 'MELLOCO X LB', cost: 0.8 },
  { id: uid(), code: '000130', name: 'MELON X LB', cost: 0.36 },
  { id: uid(), code: '7862103430237', name: 'MENTA GREEN GARDEN', cost: 0.65 },
  { id: uid(), code: '7868000318609', name: 'MIKY COL DE BRUSELA', cost: 1.38 },
  { id: uid(), code: '7861000278799', name: 'MINI CARROTS 500 GR', cost: 1.62 },
  { id: uid(), code: '0019699', name: 'MIX DE GRANOS EN BANDEJA', cost: 0.8 },
  { id: uid(), code: '7868000218213', name: 'MONTEROS FREJOL ROJO 250 G', cost: 1.05 },
  { id: uid(), code: '0018206', name: 'MONTES PARA COLADA MORADA', cost: 0.75 },
  { id: uid(), code: 'M1120', name: 'MORA X LB', cost: 1.43 },
  { id: uid(), code: '0018539', name: 'MORINGA EN HOJA', cost: 0.87 },
  { id: uid(), code: 'M15892', name: 'MORTIÑO XLB', cost: 3.0 },
  { id: uid(), code: '7868000855807', name: 'MUNDOLOMA MAIZ DULCE 950G', cost: 1.99 },
  { id: uid(), code: '0020004', name: 'NABO CHINO', cost: 1.29 },
  { id: uid(), code: '7868000410235', name: 'NABO CHINO CAMPECHANO', cost: 0.56 },
  { id: uid(), code: '7861042591634', name: 'NABO CHINO FRESCO Y SANO LO', cost: 0.69 },
  { id: uid(), code: 'N1120', name: 'NARANJA GRANDE UND', cost: 0.09 },
  { id: uid(), code: 'N1129', name: 'NARANJA INJERTA 80', cost: 0.56 },
  { id: uid(), code: 'N1122', name: 'NARANJILLA 5 X 1 DOLAR', cost: 0.12 },
  { id: uid(), code: '7862100740889', name: 'NATURALIA REFRESCO DE COCO', cost: 1.34 },
  { id: uid(), code: 'N16469', name: 'NECTARINO', cost: 0.19 },
  { id: uid(), code: '0024901', name: 'OCA', cost: 0.27 },
  { id: uid(), code: '7868001213606', name: 'ORBERRIES FRAMBUESA ROJA 125 GR', cost: 1.44 },
  { id: uid(), code: '786210163057', name: 'ORG TERRA.S HOJA DE REMOLACHA BABY', cost: 1.99 },
  { id: uid(), code: '7861000177047', name: 'PALMITO NATURAL', cost: 0.0 },
  { id: uid(), code: 'P1125', name: 'PAPA BOLONA X LB', cost: 0.16 },
  { id: uid(), code: 'P1136', name: 'PAPA CHAUCHA X  LB', cost: 0.5 },
  { id: uid(), code: 'P1127', name: 'PAPA CHINA X LB', cost: 0.36 },
  { id: uid(), code: 'P1124', name: 'PAPA CHOLA LAVADA X LB', cost: 0.33 },
  { id: uid(), code: 'P15891', name: 'PAPA CHOLA SUCIA X LB', cost: 0.3 },
  { id: uid(), code: 'P1126', name: 'PAPA SEMI LAVADA X LB', cost: 0.16 },
  { id: uid(), code: 'P1169', name: 'PAPAYA CAMILA GRANDE', cost: 1.83 },
  { id: uid(), code: 'P1120', name: 'PAPAYA HAWAYANA', cost: 0.53 },
  { id: uid(), code: '0013397', name: 'PASAS X LIBRAS', cost: 1.27 },
  { id: uid(), code: '0026196', name: 'PEPINILLOS EN PLATO', cost: 1.0 },
  { id: uid(), code: 'P1137', name: 'PEPINO DULCE X LB', cost: 0.39 },
  { id: uid(), code: 'P1131', name: 'PEPINOS', cost: 0.18 },
  { id: uid(), code: 'P1142', name: 'PERA CHINA', cost: 0.58 },
  { id: uid(), code: '0018059', name: 'PERA COSCIA', cost: 0.14 },
  { id: uid(), code: 'P1122', name: 'PERA VERDE 150', cost: 0.2 },
  { id: uid(), code: 'P1161', name: 'PEREJIL', cost: 0.24 },
  { id: uid(), code: '7862118990733', name: 'PEREJIL CRESPO ORGANICO 120 GR', cost: 0.81 },
  { id: uid(), code: 'P1135', name: 'PICADILLO X LB', cost: 0.75 },
  { id: uid(), code: 'P1134', name: 'PIMIENTO AMARILLO/ROJO X LB', cost: 0.52 },
  { id: uid(), code: 'P1141', name: 'PIMIENTO VERDE', cost: 0.1 },
  { id: uid(), code: 'P1129', name: 'PIÑA  HAWUAYANA', cost: 1.67 },
  { id: uid(), code: 'P1130', name: 'PIÑA BLANCA G', cost: 1.31 },
  { id: uid(), code: 'P1148', name: 'PIÑA EN RODAJAS', cost: 0.3 },
  { id: uid(), code: 'P1333', name: 'PIÑA HAWUAYANA PEQ', cost: 0.0 },
  { id: uid(), code: 'P1166', name: 'PLATANO RACIMO MEDIANO', cost: 10.0 },
  { id: uid(), code: 'P1140', name: 'PLATANO V / M X  UND.  6X 1', cost: 0.14 },
  { id: uid(), code: '7868001007229', name: 'PROAGBA BRAMBUESA 85 G', cost: 1.18 },
  { id: uid(), code: '7868001007212', name: 'PROAGBA FRAMBUESA', cost: 1.32 },
  { id: uid(), code: '7868000837827', name: 'PROAGROTORRES ATADO DE ESPARRAGO 250 G', cost: 1.04 },
  { id: uid(), code: 'PF1121', name: 'PULPA DE FRUTILLA 1.5 LB', cost: 1.75 },
  { id: uid(), code: '0015173', name: 'PULPA DE GUANABANA', cost: 1.54 },
  { id: uid(), code: 'PM1121', name: 'PULPA DE MARACUYA X LB', cost: 2.85 },
  { id: uid(), code: 'R1122', name: 'RABANO X LB', cost: 0.24 },
  { id: uid(), code: 'R1123', name: 'REINACLAUDIA AMARILLA', cost: 0.08 },
  { id: uid(), code: 'R1155', name: 'REINACLAUDIA ROJA AMERICANA G.', cost: 0.18 },
  { id: uid(), code: 'R1121', name: 'REMOLACHA X LB', cost: 0.21 },
  { id: uid(), code: '7862133340728', name: 'REMU JALAPEÑO 100 G', cost: 0.48 },
  { id: uid(), code: '7861042585282', name: 'SABILA PACK X3', cost: 0.79 },
  { id: uid(), code: '0013519', name: 'SACO DE MARACUYA', cost: 7.0 },
  { id: uid(), code: '0025371', name: 'SAL PRIETA GRAND', cost: 2.25 },
  { id: uid(), code: 'SAM1', name: 'SAMBO ENTERO', cost: 1.67 },
  { id: uid(), code: 'SP2', name: 'SAMBO X PEDAZO', cost: 0.56 },
  { id: uid(), code: 'S1123', name: 'SANDIA EN RODAJAS', cost: 0.5 },
  { id: uid(), code: 'S1120', name: 'SANDIA GRANDE X UND', cost: 2.35 },
  { id: uid(), code: 'SANGO', name: 'SANGO X LIBRAS', cost: 1.5 },
  { id: uid(), code: '7861042592006', name: 'SEMBRAO ALBAHACA', cost: 0.62 },
  { id: uid(), code: '7861042592013', name: 'SEMBRAO CEBOLLIN', cost: 0.62 },
  { id: uid(), code: '7861042592020', name: 'SEMBRAO CEDRON', cost: 0.62 },
  { id: uid(), code: '7861042592037', name: 'SEMBRAO HIERBA BUENA', cost: 0.62 },
  { id: uid(), code: '7861042592044', name: 'SEMBRAO HIERBA LUISA', cost: 0.62 },
  { id: uid(), code: '7861042594000', name: 'SEMBRAO JALAPENO', cost: 0.54 },
  { id: uid(), code: '786104250133', name: 'SEMBRAO LECHUGA CRESPA', cost: 0.36 },
  { id: uid(), code: '7861223817638', name: 'SEMBRAO LECHUGA CRIOLLA', cost: 0.39 },
  { id: uid(), code: '7861223842104', name: 'SEMBRAO LECHUGA ROJA CRESPA', cost: 0.43 },
  { id: uid(), code: '7861042592068', name: 'SEMBRAO MENTA  50 G', cost: 0.62 },
  { id: uid(), code: '786104258437', name: 'SEMBRAO NABO CHINO', cost: 0.6 },
  { id: uid(), code: '7861042592075', name: 'SEMBRAO ROMERO 50 G', cost: 0.62 },
  { id: uid(), code: '7861223805758', name: 'SEMBRAO TOMATE CHERRY GP 350 GR', cost: 1.17 },
  { id: uid(), code: '7861042592266', name: 'SEMBRAO TOMATE CHERRY HA', cost: 0.98 },
  { id: uid(), code: '7861042595021', name: 'SEMBRAO TOMATE CHERRY PD', cost: 1.17 },
  { id: uid(), code: '786104259208', name: 'SEMBRAO TOMILLO', cost: 0.62 },
  { id: uid(), code: '7861001912692', name: 'SNOB ACEITUNA CON HUESO', cost: 2.77 },
  { id: uid(), code: '7861001912654', name: 'SNOB ACEITUNAS ENTERAS 240 GR', cost: 2.14 },
  { id: uid(), code: '0018538', name: 'STEVIA EN HOJA', cost: 0.45 },
  { id: uid(), code: 'SA15824', name: 'SUQUINI AMARILLO X LB', cost: 0.23 },
  { id: uid(), code: 'S1122', name: 'SUQUINI ENSALADA X LB', cost: 0.32 },
  { id: uid(), code: 'S11585', name: 'SUQUINI GRANDE X UNIDAD', cost: 0.91 },
  { id: uid(), code: '786122380243', name: 'SX ARANDANO VASITO', cost: 1.48 },
  { id: uid(), code: '7861042540991', name: 'SX CHAMP REBANADO GUP 220 G', cost: 1.85 },
  { id: uid(), code: '7861042529187', name: 'SX.CHAMPINONES ENTEROS K. 220G', cost: 1.48 },
  { id: uid(), code: 'T1121', name: 'TAMARINDO  X LB', cost: 0.8 },
  { id: uid(), code: 'T16606', name: 'TAXO', cost: 0.03 },
  { id: uid(), code: '7862101630301', name: 'TERRASANA BABY ESPINACA  ORG 90-110G', cost: 2.23 },
  { id: uid(), code: '7862101630271', name: 'TERRASANA RUCULA ORG', cost: 1.81 },
  { id: uid(), code: '0024945', name: 'TOMATE CHERRY EN TARRINA', cost: 1.0 },
  { id: uid(), code: '7862103431029', name: 'TOMATE CHERRY ESP GRE/GAR 330 G', cost: 1.4 },
  { id: uid(), code: '7861042578918', name: 'TOMATE CHERRY LO FDA 340 G', cost: 0.79 },
  { id: uid(), code: '7868000749601', name: 'TOMATE CHERRY PERA CR 350 G', cost: 1.05 },
  { id: uid(), code: '7868001205502', name: 'TOMATE CHERRY PERITA C/V 200 G', cost: 0.73 },
  { id: uid(), code: '7862101902941', name: 'TOMATE CHERRY TARRINA', cost: 1.85 },
  { id: uid(), code: 'T1122', name: 'TOMATE DE ARBOL', cost: 0.17 },
  { id: uid(), code: 'T1120', name: 'TOMATE DE CARNE X LB', cost: 0.33 },
  { id: uid(), code: '7861000292795', name: 'TOMATE PERITA 330 G', cost: 1.14 },
  { id: uid(), code: '7861042592082', name: 'TOMILLO FRESCO', cost: 0.64 },
  { id: uid(), code: 'T1123', name: 'TUNA', cost: 0.24 },
  { id: uid(), code: 'U1126554', name: 'UVA ICA', cost: 1.0 },
  { id: uid(), code: 'U1101', name: 'UVA NEGRA PERUANA XLB', cost: 1.12 },
  { id: uid(), code: 'U1124', name: 'UVA NEGRA SIN PEPA', cost: 1.67 },
  { id: uid(), code: 'U1120', name: 'UVA ROJA CHILENA X LB', cost: 1.44 },
  { id: uid(), code: 'P1149', name: 'UVA ROJA PERUANA X LB', cost: 1.39 },
  { id: uid(), code: 'U1121', name: 'UVA VERDE AMERICANA X LB', cost: 1.67 },
  { id: uid(), code: 'U1159', name: 'UVA VERDE PERUANA', cost: 1.56 },
  { id: uid(), code: '7861223803549', name: 'UVILLAS EN VASO COOLTIVA 125 G', cost: 0.55 },
  { id: uid(), code: 'V1120', name: 'VAINITA X LB', cost: 0.88 },
  { id: uid(), code: '044695105619', name: 'VEGETALES MIXTOS FAC 500G', cost: 2.12 },
  { id: uid(), code: 'V1150', name: 'VERDURA X UND', cost: 0.75 },
  { id: uid(), code: '0025624', name: 'VERDURABLES TARRINA', cost: 1.75 },
  { id: uid(), code: '7861042580454', name: 'VERDURAS ATADO VAINITA 300 G', cost: 1.63 },
  { id: uid(), code: '7868000384147', name: 'VERMONTINA BROCOLI 450 G', cost: 0.44 },
  { id: uid(), code: 'Y1120', name: 'YUCA X LB', cost: 0.35 },
  { id: uid(), code: '7862101630349', name: 'ZANAHORIA BABY ORGANICA', cost: 2.17 },
  { id: uid(), code: 'Z1185', name: 'ZANAHORIA BLANCA', cost: 0.47 },
  { id: uid(), code: '0026273', name: 'ZANAHORIA EN BANDEJA', cost: 1.0 },
  { id: uid(), code: '7862101900022', name: 'ZANAHORIA HORTANA 300G', cost: 0.92 },
  { id: uid(), code: 'Z1121', name: 'ZANAHORIA X  LB', cost: 0.17 },
  { id: uid(), code: 'Z1115', name: 'ZAPALLO  X PEDAZOS X LB', cost: 0.13 },
  { id: uid(), code: 'Z1123', name: 'ZAPOTE X UND', cost: 0.29 },
  ],   // { id, code, name, cost }
  entries: [],    // { id, productId, quantity, price, date, supplier, responsible, notes }
  exits: [],      // { id, productId, quantity, price, date, reason, supplier, responsible, notes }
};

// ─── Toast Component ──────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : type === "sending" ? "#6366f1" : "#d97706";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: bg, color: "#fff", padding: "12px 20px",
      borderRadius: 10, fontSize: 14, fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,0,0,.25)",
      display: "flex", alignItems: "center", gap: 8,
      animation: "slideUp .3s ease",
    }}>
      {type === "success" ? <Icons.Check /> : type === "sending" ? <Icons.Cloud /> : <Icons.Alert />}
      {message}
    </div>
  );
}

// ─── Product Search + Select ──────────────────────────────────
function ProductPicker({ products, onSelect, onAddNew }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const filtered = query.trim()
    ? products.filter(p =>
        p.code.toLowerCase().includes(query.toLowerCase()) ||
        p.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const showDropdown = focused && query.trim().length > 0;

  return (
    <div style={{ position: "relative" }}>
      <label style={styles.label}>Buscar Producto</label>
      <div style={styles.searchBox}>
        <Icons.Search />
        <input
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Código o nombre del producto..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
        />
      </div>
      {showDropdown && (
        <div style={styles.dropdown}>
          {filtered.length > 0 ? filtered.map(p => (
            <div
              key={p.id}
              style={styles.dropdownItem}
              onMouseDown={() => { onSelect(p); setQuery(""); }}
            >
              <span style={styles.prodCode}>{p.code}</span>
              <span style={styles.prodName}>{p.name}</span>
              <span style={styles.prodCost}>{fmtMoney(p.cost)}</span>
            </div>
          )) : (
            <div style={styles.dropdownEmpty}>
              <p style={{ margin: 0, color: "#94a3b8" }}>No se encontró "{query}"</p>
              <button style={styles.addNewBtn} onMouseDown={onAddNew}>
                <Icons.Plus /> Añadir producto manualmente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Product Modal ────────────────────────────────────────
function AddProductModal({ onSave, onClose, initial }) {
  const [code, setCode] = useState(initial || "");
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Añadir Nuevo Producto</h3>
          <button style={styles.closeBtn} onClick={onClose}><Icons.X /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={styles.label}>Código</label>
            <input style={styles.input} value={code} onChange={e => setCode(e.target.value)} placeholder="Ej: 7861000123" />
          </div>
          <div>
            <label style={styles.label}>Nombre</label>
            <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Arroz 1kg" />
          </div>
          <div>
            <label style={styles.label}>Costo ($)</label>
            <input style={styles.input} type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <button
          style={{ ...styles.primaryBtn, width: "100%", marginTop: 18 }}
          disabled={!code.trim() || !name.trim() || !cost}
          onClick={() => {
            if (code.trim() && name.trim() && cost) {
              onSave({ id: uid(), code: code.trim(), name: name.trim(), cost: parseFloat(cost) });
            }
          }}
        >
          <Icons.Check /> Guardar Producto
        </button>
      </div>
    </div>
  );
}

// ─── Validation Note ──────────────────────────────────────────
function ValidationNote() {
  return (
    <div style={styles.validationNote}>
      <Icons.Alert />
      <span>
        <strong>Requerido:</strong> No se puede registrar sin seleccionar un producto, ingresar cantidad, precio, proveedor y responsable.
      </span>
    </div>
  );
}

// ─── Entry Form (Ingreso) ─────────────────────────────────────
function EntryForm({ products, onSubmit, onAddProduct }) {
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [responsible, setResponsible] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(today());
  const [showAdd, setShowAdd] = useState(false);
  const [sending, setSending] = useState(false);

  const isValid = selected && qty > 0 && price && supplier.trim() && responsible.trim();

  const handleSubmit = async () => {
    if (!isValid) return;
    setSending(true);
    const entry = {
      id: uid(),
      productId: selected.id,
      quantity: parseInt(qty),
      price: parseFloat(price),
      date,
      supplier: supplier.trim(),
      responsible: responsible.trim(),
      notes,
    };
    await onSubmit(entry, selected);
    setSelected(null); setQty(""); setPrice(""); setSupplier(""); setResponsible(""); setNotes(""); setDate(today());
    setSending(false);
  };

  return (
    <div style={styles.formCard}>
      <div style={styles.formTitle}><Icons.BoxIn /> Registrar Ingreso</div>
      <p style={styles.formSubtitle}>Compras sin factura — ingreso a bodega</p>
      <ValidationNote />

      {!selected ? (
        <ProductPicker products={products} onSelect={setSelected} onAddNew={() => setShowAdd(true)} />
      ) : (
        <div style={styles.selectedProduct}>
          <div>
            <span style={styles.prodCode}>{selected.code}</span>
            <span style={styles.prodName}>{selected.name}</span>
            <span style={styles.prodCost}>{fmtMoney(selected.cost)}</span>
          </div>
          <button style={styles.removeBtn} onClick={() => setSelected(null)}><Icons.X /></button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <div>
          <label style={styles.label}>Cantidad <span style={styles.required}>*</span></label>
          <input style={styles.input} type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label style={styles.label}>Precio unitario ($) <span style={styles.required}>*</span></label>
          <input style={styles.input} type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label style={styles.label}>Proveedor <span style={styles.required}>*</span></label>
          <input style={styles.input} value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nombre del proveedor..." />
        </div>
        <div>
          <label style={styles.label}>Responsable <span style={styles.required}>*</span></label>
          <input style={styles.input} value={responsible} onChange={e => setResponsible(e.target.value)} placeholder="Nombre del responsable..." />
        </div>
        <div>
          <label style={styles.label}>Fecha</label>
          <input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label style={styles.label}>Notas (opcional)</label>
          <input style={styles.input} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." />
        </div>
      </div>

      <button
        style={{ ...styles.primaryBtn, marginTop: 16, opacity: isValid ? 1 : 0.5 }}
        disabled={!isValid || sending}
        onClick={handleSubmit}
      >
        {sending ? <><Icons.Cloud /> Enviando...</> : <><Icons.Check /> Registrar Ingreso</>}
      </button>

      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onSave={(p) => { onAddProduct(p); setSelected(p); setShowAdd(false); }}
        />
      )}
    </div>
  );
}

// ─── Exit Form (Salida) ──────────────────────────────────────
function ExitForm({ products, onSubmit, onAddProduct }) {
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("Caducado");
  const [supplier, setSupplier] = useState("");
  const [responsible, setResponsible] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(today());
  const [showAdd, setShowAdd] = useState(false);
  const [sending, setSending] = useState(false);

  const isValid = selected && qty > 0 && price && supplier.trim() && responsible.trim();

  const handleSubmit = async () => {
    if (!isValid) return;
    setSending(true);
    const exit = {
      id: uid(),
      productId: selected.id,
      quantity: parseInt(qty),
      price: parseFloat(price),
      date,
      reason,
      supplier: supplier.trim(),
      responsible: responsible.trim(),
      notes,
    };
    await onSubmit(exit, selected);
    setSelected(null); setQty(""); setPrice(""); setSupplier(""); setResponsible(""); setNotes(""); setDate(today());
    setSending(false);
  };

  return (
    <div style={{ ...styles.formCard, borderColor: "#dc2626" }}>
      <div style={{ ...styles.formTitle, color: "#dc2626" }}><Icons.BoxOut /> Registrar Salida</div>
      <p style={styles.formSubtitle}>Productos caducados — salida de bodega</p>
      <ValidationNote />

      {!selected ? (
        <ProductPicker products={products} onSelect={setSelected} onAddNew={() => setShowAdd(true)} />
      ) : (
        <div style={{ ...styles.selectedProduct, borderColor: "#fca5a5" }}>
          <div>
            <span style={styles.prodCode}>{selected.code}</span>
            <span style={styles.prodName}>{selected.name}</span>
            <span style={styles.prodCost}>{fmtMoney(selected.cost)}</span>
          </div>
          <button style={styles.removeBtn} onClick={() => setSelected(null)}><Icons.X /></button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <div>
          <label style={styles.label}>Cantidad <span style={styles.required}>*</span></label>
          <input style={styles.input} type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label style={styles.label}>Precio unitario ($) <span style={styles.required}>*</span></label>
          <input style={styles.input} type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label style={styles.label}>Proveedor <span style={styles.required}>*</span></label>
          <input style={styles.input} value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nombre del proveedor..." />
        </div>
        <div>
          <label style={styles.label}>Responsable <span style={styles.required}>*</span></label>
          <input style={styles.input} value={responsible} onChange={e => setResponsible(e.target.value)} placeholder="Nombre del responsable..." />
        </div>
        <div>
          <label style={styles.label}>Motivo</label>
          <select style={styles.input} value={reason} onChange={e => setReason(e.target.value)}>
            <option>Caducado</option>
            <option>Dañado</option>
            <option>Merma</option>
            <option>Otro</option>
          </select>
        </div>
        <div>
          <label style={styles.label}>Fecha</label>
          <input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={styles.label}>Notas (opcional)</label>
          <input style={styles.input} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." />
        </div>
      </div>

      <button
        style={{ ...styles.primaryBtn, marginTop: 16, background: "#dc2626", opacity: isValid ? 1 : 0.5 }}
        disabled={!isValid || sending}
        onClick={handleSubmit}
      >
        {sending ? <><Icons.Cloud /> Enviando...</> : <><Icons.Check /> Registrar Salida</>}
      </button>

      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onSave={(p) => { onAddProduct(p); setSelected(p); setShowAdd(false); }}
        />
      )}
    </div>
  );
}

// ─── History Table ────────────────────────────────────────────
function HistoryTable({ entries, exits, products, onDeleteEntry, onDeleteExit }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const getName = (pid) => products.find(p => p.id === pid)?.name || "—";
  const getCode = (pid) => products.find(p => p.id === pid)?.code || "—";

  const allRecords = [
    ...entries.map(e => ({ ...e, type: "entry" })),
    ...exits.map(e => ({ ...e, type: "exit" })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const filtered = allRecords
    .filter(r => filter === "all" || r.type === filter)
    .filter(r => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return getName(r.productId).toLowerCase().includes(q) ||
             getCode(r.productId).toLowerCase().includes(q) ||
             (r.supplier || "").toLowerCase().includes(q) ||
             (r.responsible || "").toLowerCase().includes(q);
    });

  return (
    <div style={styles.historyCard}>
      <div style={styles.formTitle}><Icons.History /> Historial de Movimientos</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "entry", "exit"].map(f => (
          <button
            key={f}
            style={{
              ...styles.filterBtn,
              ...(filter === f ? styles.filterActive : {}),
              ...(f === "exit" && filter === f ? { background: "#dc2626", borderColor: "#dc2626" } : {}),
            }}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todos" : f === "entry" ? "Ingresos" : "Salidas"}
          </button>
        ))}
        <div style={{ ...styles.searchBox, flex: 1, minWidth: 180 }}>
          <Icons.Search />
          <input style={styles.searchInput} placeholder="Filtrar por producto, proveedor, responsable..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <Icons.Package />
          <p>No hay movimientos registrados</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Cant.</th>
                <th style={styles.th}>Precio</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Proveedor</th>
                <th style={styles.th}>Responsable</th>
                <th style={styles.th}>Detalle</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={styles.tr}>
                  <td style={styles.td}>{fmtDate(r.date)}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: r.type === "entry" ? "#dcfce7" : "#fee2e2",
                      color: r.type === "entry" ? "#16a34a" : "#dc2626",
                    }}>
                      {r.type === "entry" ? "Ingreso" : "Salida"}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{getCode(r.productId)}</td>
                  <td style={styles.td}>{getName(r.productId)}</td>
                  <td style={{ ...styles.td, fontWeight: 700 }}>{r.quantity}</td>
                  <td style={styles.td}>{r.price ? fmtMoney(r.price) : "—"}</td>
                  <td style={{ ...styles.td, fontWeight: 700 }}>{r.price && r.quantity ? fmtMoney(r.price * r.quantity) : "—"}</td>
                  <td style={{ ...styles.td, fontSize: 13 }}>{r.supplier || "—"}</td>
                  <td style={{ ...styles.td, fontSize: 13 }}>{r.responsible || "—"}</td>
                  <td style={{ ...styles.td, color: "#94a3b8", fontSize: 13 }}>{r.notes || r.reason || "—"}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => r.type === "entry" ? onDeleteEntry(r.id) : onDeleteExit(r.id)}
                      title="Eliminar"
                    >
                      <Icons.Trash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Products List ────────────────────────────────────────────
function ProductsList({ products, entries, exits, onDelete }) {
  const [search, setSearch] = useState("");

  const getStock = (pid) => {
    const inQty = entries.filter(e => e.productId === pid).reduce((s, e) => s + e.quantity, 0);
    const outQty = exits.filter(e => e.productId === pid).reduce((s, e) => s + e.quantity, 0);
    return inQty - outQty;
  };

  const filtered = products.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  });

  return (
    <div style={styles.historyCard}>
      <div style={styles.formTitle}><Icons.Package /> Catálogo de Productos</div>
      <div style={{ ...styles.searchBox, marginBottom: 16 }}>
        <Icons.Search />
        <input style={styles.searchInput} placeholder="Buscar en catálogo..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div style={styles.emptyState}><Icons.Package /><p>No hay productos registrados</p></div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Costo</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const stock = getStock(p.id);
                return (
                  <tr key={p.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{p.code}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{p.name}</td>
                    <td style={styles.td}>{fmtMoney(p.cost)}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: stock > 0 ? "#dcfce7" : stock < 0 ? "#fee2e2" : "#f1f5f9",
                        color: stock > 0 ? "#16a34a" : stock < 0 ? "#dc2626" : "#64748b",
                      }}>
                        {stock}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.deleteBtn} onClick={() => onDelete(p.id)} title="Eliminar producto"><Icons.Trash /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Summary Cards ────────────────────────────────────────────
function SummaryCards({ products, entries, exits }) {
  const totalIn = entries.reduce((s, e) => s + e.quantity, 0);
  const totalOut = exits.reduce((s, e) => s + e.quantity, 0);
  const totalCostIn = entries.reduce((s, e) => s + (e.price || 0) * e.quantity, 0);
  const totalCostOut = exits.reduce((s, e) => s + (e.price || 0) * e.quantity, 0);

  const cards = [
    { label: "Productos", value: products.length, color: "#6366f1", icon: <Icons.Package /> },
    { label: "Ingresos", value: totalIn, color: "#16a34a", icon: <Icons.BoxIn /> },
    { label: "Comprado ($)", value: fmtMoney(totalCostIn), color: "#0891b2", icon: <Icons.BoxIn /> },
    { label: "Salidas", value: totalOut, color: "#dc2626", icon: <Icons.BoxOut /> },
    { label: "Pérdida ($)", value: fmtMoney(totalCostOut), color: "#d97706", icon: <Icons.Alert /> },
  ];

  return (
    <div style={styles.summaryGrid}>
      {cards.map((c, i) => (
        <div key={i} style={{ ...styles.summaryCard, borderTop: `3px solid ${c.color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{c.label}</span>
            <span style={{ color: c.color }}>{c.icon}</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 6 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function InventoryApp() {
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("entry");
  const [toast, setToast] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    loadData().then(d => {
      if (d) setData(d);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) saveData(data);
  }, [data, loaded]);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const addProduct = (p) => {
    setData(prev => ({ ...prev, products: [...prev.products, p] }));
    notify(`Producto "${p.name}" añadido`);
  };

  const deleteProduct = (id) => {
    setData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
    notify("Producto eliminado", "warning");
  };

  const addEntry = async (e, product) => {
    setData(prev => ({ ...prev, entries: [...prev.entries, e] }));
    notify(`Enviando ingreso a Google Sheets...`, "sending");
    const ok = await sendToSheets({
      type: "ingreso",
      fecha: e.date,
      codigo: product.code,
      producto: product.name,
      cantidad: e.quantity,
      precio: e.price,
      total: e.price * e.quantity,
      proveedor: e.supplier,
      responsable: e.responsible,
      notas: e.notes || "",
      email: "bryanligabow@gmail.com",
    });
    notify(ok ? `✓ Ingreso registrado y enviado: ${e.quantity}x ${product.name}` : `Ingreso guardado (sin conexión a Sheets)`, ok ? "success" : "warning");
  };

  const deleteEntry = (id) => {
    setData(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }));
    notify("Ingreso eliminado", "warning");
  };

  const addExit = async (e, product) => {
    setData(prev => ({ ...prev, exits: [...prev.exits, e] }));
    notify(`Enviando salida a Google Sheets...`, "sending");
    const ok = await sendToSheets({
      type: "salida",
      fecha: e.date,
      codigo: product.code,
      producto: product.name,
      cantidad: e.quantity,
      precio: e.price,
      total: e.price * e.quantity,
      motivo: e.reason,
      proveedor: e.supplier,
      responsable: e.responsible,
      notas: e.notes || "",
      email: "bryanligabow@gmail.com",
    });
    notify(ok ? `✓ Salida registrada y enviada: ${e.quantity}x ${product.name}` : `Salida guardada (sin conexión a Sheets)`, ok ? "error" : "warning");
  };

  const deleteExit = (id) => {
    setData(prev => ({ ...prev, exits: prev.exits.filter(e => e.id !== id) }));
    notify("Salida eliminada", "warning");
  };

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: "#94a3b8", fontSize: 16 }}>Cargando inventario...</p>
    </div>
  );

  const tabs = [
    { key: "entry", label: "Ingreso", icon: <Icons.BoxIn /> },
    { key: "exit", label: "Salida", icon: <Icons.BoxOut /> },
    { key: "products", label: "Productos", icon: <Icons.Package /> },
    { key: "history", label: "Historial", icon: <Icons.History /> },
  ];

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        input:focus, select:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,.15) !important; }
        button:hover:not(:disabled) { filter: brightness(1.05); }
        button:active:not(:disabled) { transform: scale(0.98); }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        table { border-collapse: collapse; }
        ::selection { background: #c7d2fe; }
        tr:hover td { background: #f8fafc; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={styles.logo}><Icons.Package /></div>
            <div>
              <h1 style={styles.title}>Inventario Bodega</h1>
              <p style={styles.subtitle}>Control de ingresos y salidas · Sincronizado con Google Sheets</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.sheetsIndicator}>
              <Icons.Cloud /> <span>Google Sheets</span>
            </div>
            <button style={styles.addProductHeaderBtn} onClick={() => setShowAddProduct(true)}>
              <Icons.Plus /> Nuevo Producto
            </button>
          </div>
        </div>
      </header>

      <SummaryCards products={data.products} entries={data.entries} exits={data.exits} />

      <nav style={styles.tabNav}>
        {tabs.map(t => (
          <button
            key={t.key}
            style={{ ...styles.tabBtn, ...(tab === t.key ? styles.tabActive : {}) }}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      <div style={{ animation: "fadeIn .3s ease" }}>
        {tab === "entry" && <EntryForm products={data.products} onSubmit={addEntry} onAddProduct={addProduct} />}
        {tab === "exit" && <ExitForm products={data.products} onSubmit={addExit} onAddProduct={addProduct} />}
        {tab === "products" && <ProductsList products={data.products} entries={data.entries} exits={data.exits} onDelete={deleteProduct} />}
        {tab === "history" && <HistoryTable entries={data.entries} exits={data.exits} products={data.products} onDeleteEntry={deleteEntry} onDeleteExit={deleteExit} />}
      </div>

      {showAddProduct && (
        <AddProductModal
          onClose={() => setShowAddProduct(false)}
          onSave={(p) => { addProduct(p); setShowAddProduct(false); }}
        />
      )}

      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = {
  container: {
    fontFamily: "'DM Sans', sans-serif",
    background: "#f1f5f9",
    minHeight: "100vh",
    padding: "0 0 40px",
    color: "#0f172a",
  },
  header: {
    background: "#0f172a",
    padding: "20px 24px",
    borderBottom: "3px solid #6366f1",
  },
  headerInner: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  logo: {
    width: 42, height: 42,
    background: "#6366f1",
    borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff",
  },
  title: { fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.5, margin: 0 },
  subtitle: { fontSize: 12, color: "#94a3b8", margin: 0 },
  sheetsIndicator: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 14px",
    background: "rgba(99,102,241,.15)",
    border: "1px solid rgba(99,102,241,.3)",
    borderRadius: 8,
    color: "#a5b4fc",
    fontSize: 13,
    fontWeight: 600,
  },
  addProductHeaderBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "10px 18px",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  summaryGrid: {
    maxWidth: 1100,
    margin: "20px auto 0",
    padding: "0 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 14,
  },
  summaryCard: {
    background: "#fff",
    borderRadius: 12,
    padding: "16px 18px",
    boxShadow: "0 1px 4px rgba(0,0,0,.06)",
  },
  tabNav: {
    maxWidth: 1100,
    margin: "20px auto 0",
    padding: "0 24px",
    display: "flex",
    gap: 6,
    overflowX: "auto",
  },
  tabBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "10px 18px",
    background: "#fff",
    border: "2px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#64748b",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
    transition: "all .15s",
  },
  tabActive: {
    background: "#6366f1",
    borderColor: "#6366f1",
    color: "#fff",
  },
  formCard: {
    maxWidth: 1100,
    margin: "20px 24px 0",
    padding: "24px",
    background: "#fff",
    borderRadius: 14,
    border: "2px solid #16a34a",
    boxShadow: "0 2px 12px rgba(0,0,0,.05)",
  },
  formTitle: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 18, fontWeight: 800, color: "#16a34a",
    marginBottom: 4,
  },
  formSubtitle: { fontSize: 13, color: "#94a3b8", marginBottom: 12, marginTop: 0 },
  validationNote: {
    display: "flex", alignItems: "flex-start", gap: 8,
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#92400e",
    marginBottom: 16,
    lineHeight: 1.5,
  },
  required: { color: "#dc2626", fontWeight: 700 },
  historyCard: {
    maxWidth: 1100,
    margin: "20px 24px 0",
    padding: "24px",
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 12px rgba(0,0,0,.05)",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "2px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "#0f172a",
    background: "#f8fafc",
    transition: "all .15s",
    boxSizing: "border-box",
  },
  searchBox: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 14px",
    border: "2px solid #e2e8f0",
    borderRadius: 8,
    background: "#f8fafc",
    color: "#94a3b8",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "#0f172a",
    background: "transparent",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0, right: 0,
    marginTop: 4,
    background: "#fff",
    border: "2px solid #e2e8f0",
    borderRadius: 10,
    boxShadow: "0 12px 40px rgba(0,0,0,.12)",
    zIndex: 100,
    maxHeight: 240,
    overflowY: "auto",
  },
  dropdownItem: {
    padding: "12px 16px",
    display: "flex", alignItems: "center", gap: 12,
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
    transition: "background .1s",
  },
  dropdownEmpty: {
    padding: "18px 16px",
    textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
  },
  addNewBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 16px",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  selectedProduct: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 16px",
    background: "#f0fdf4",
    border: "2px solid #86efac",
    borderRadius: 10,
  },
  prodCode: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    background: "#e2e8f0",
    padding: "2px 8px",
    borderRadius: 4,
    marginRight: 8,
    fontWeight: 600,
  },
  prodName: { fontWeight: 600, marginRight: 8 },
  prodCost: { color: "#16a34a", fontWeight: 700, fontSize: 13 },
  removeBtn: { background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 },
  primaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "12px 24px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all .15s",
  },
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(15,23,42,.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9000,
    animation: "fadeIn .2s ease",
    padding: 24,
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    padding: "28px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 24px 64px rgba(0,0,0,.2)",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 20,
  },
  closeBtn: { background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 },
  filterBtn: {
    padding: "8px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    fontSize: 13,
    fontWeight: 600,
    color: "#64748b",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all .15s",
  },
  filterActive: { background: "#16a34a", borderColor: "#16a34a", color: "#fff" },
  table: { width: "100%", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#94a3b8",
    borderBottom: "2px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" },
  tr: { transition: "background .1s" },
  badge: { padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, display: "inline-block" },
  deleteBtn: { background: "transparent", border: "none", cursor: "pointer", color: "#cbd5e1", padding: 4, transition: "color .15s" },
  emptyState: { textAlign: "center", padding: "40px 20px", color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
};
