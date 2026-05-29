import React, { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "../supabase.js";

/* ─── STYLES ─── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    :root{--cream:#f5f0e8;--warm:#e8dcc8;--gold:#c9a84c;--gold-light:#e8c97a;--dark:#1a1208;--dark2:#2a1f0e;--red:#8b2c2c;--text:#3a2a1a;--muted:#8a7a6a;}
    html{scroll-behavior:smooth;}
    input,select,textarea,button{font-family:'DM Sans',sans-serif;}
    input[type=range]{accent-color:var(--gold);}
    ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:var(--cream);}::-webkit-scrollbar-thumb{background:var(--gold);border-radius:3px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);}}
    @keyframes shimmer{0%{background-position:-200% center;}100%{background-position:200% center;}}
    @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);}}
    @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
    .f1{animation:fadeUp .7s .1s both;}.f2{animation:fadeUp .7s .3s both;}.f3{animation:fadeUp .7s .5s both;}.f4{animation:fadeUp .7s .7s both;}.f5{animation:fadeUp .7s .9s both;}
    .card-h{transition:transform .25s,box-shadow .25s;}.card-h:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(26,18,8,.12);}
    .btn-g{background:linear-gradient(135deg,var(--gold),var(--gold-light));color:var(--dark);border:none;cursor:pointer;font-weight:600;transition:all .2s;}
    .btn-g:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(201,168,76,.4);}
    .btn-o{background:transparent;border:1.5px solid var(--gold);color:var(--gold);cursor:pointer;transition:all .2s;}
    .btn-o:hover{background:var(--gold);color:var(--dark);}
    .btn-red{background:transparent;border:1.5px solid var(--red);color:var(--red);cursor:pointer;transition:all .2s;}
    .btn-red:hover{background:var(--red);color:#fff;}
  `}</style>
);

/* ─── CONSTANTS ─── */
const FOOD_TYPES = [
  "🍔 Hamburguesas",
  "🍕 Pizza",
  "🍝 Italiano / Pasta",
  "🍣 Sushi / Japonés",
  "🥩 Parrilla",
  "🇦🇷 Argentino",
  "🌮 Mexicano",
  "🥘 Mediterráneo / Español",
  "🍜 Asiático",
  "🐟 Marisco",
  "🥘 Arroces",
  "🌱 Vegano / Healthy",
  "🍷 Gourmet",
  "🍽️ Fusión"
];

const PRICE_RANGES = [
  {key:"budget",  label:"Menos de 30€", emoji:"💶",    color:"#4caf50"},
  {key:"mid",     label:"30€ – 50€",    emoji:"💶💶",   color:"#8bc34a"},
  {key:"midplus", label:"50€ – 70€",    emoji:"💶💶💶",  color:"#e6a817"},
  {key:"high",    label:"70€ o más",   emoji:"💶💶💶💶", color:"#ff7043"},
  {key:"luxury",  label:"Estrella michelín",  emoji:"⭐",    color:"#9c27b0"},
];

const CRITERIA = [
  {key:"sabor",     label:"Sabor",          icon:"😋", desc:"¿Estaba rico?", questions:[
    {q:"¿Cuánto te gustó el sabor de los platos en general?",            hint:"1 soso → 10 espectacular"},
    {q:"¿Cuánto disfrutaste comiendo ahí?",                              hint:"1 no lo disfruté → 10 me encantó"},
    {q:"¿Cuánto destacaría algún plato concreto por encima del resto?",  hint:"1 nada especial → 10 plato memorable"},
  ]},
  {key:"rcp",       label:"Calidad/Precio", icon:"💰", desc:"¿Vale lo que cuesta?", questions:[
    {q:"¿Cuánto te pareció justo el precio respecto a lo recibido?",     hint:"1 caro sin justificación → 10 muy justo"},
    {q:"¿Cuánto te convencieron las raciones para el precio pagado?",    hint:"1 escasas → 10 muy generosas"},
    {q:"¿Cuántas ganas tienes de volver sabiendo lo que cuesta?",        hint:"1 ninguna → 10 sin dudarlo"},
  ]},
  {key:"ambiente",  label:"Ambiente",       icon:"🏠", desc:"Decoración y comodidad", questions:[
    {q:"¿Cuánto te gustó la decoración y diseño del espacio?",           hint:"1 sin personalidad → 10 me encantó"},
    {q:"¿Cuánto te convenció el nivel de ruido para conversar?",         hint:"1 imposible hablar → 10 perfecto"},
    {q:"¿Cuánta comodidad sentiste durante toda la visita?",             hint:"1 muy incómodo → 10 muy cómodo"},
  ]},
  {key:"servicio",  label:"Servicio",       icon:"🤵", desc:"Atención y tiempos", questions:[
    {q:"¿Cuánto te convenció la amabilidad y trato del personal?",       hint:"1 frío o maleducado → 10 excelente"},
    {q:"¿Cuánto te pareció correcto el ritmo entre platos?",             hint:"1 desesperante → 10 perfecto"},
    {q:"¿Cuánto dominio de la carta demostró el equipo?",                hint:"1 no sabían nada → 10 expertos"},
  ]},
  {key:"repetiria", label:"Repetiría",      icon:"🔄", desc:"¿Volvéis?", questions:[
    {q:"¿Con cuántas ganas volveríais en los próximos meses?",           hint:"1 nunca más → 10 esta semana"},
    {q:"¿Con qué convicción lo recomendaríais a alguien cercano?",       hint:"1 no lo haría → 10 sin dudarlo"},
    {q:"¿Cuánto peso tiene en vuestra memoria gastronómica?",            hint:"1 ya olvidado → 10 memorable"},
  ]},
  {key:"wow",       label:"Factor Wow",     icon:"✨", desc:"Ese algo especial", questions:[
    {q:"¿Cuánto os sorprendió algún plato o momento?",                   hint:"1 nada → 10 fue una revelación"},
    {q:"¿En qué medida superó vuestras expectativas previas?",           hint:"1 por debajo → 10 muy por encima"},
    {q:"¿Cuánta personalidad única tiene respecto a otros?",             hint:"1 igual que todos → 10 único en su estilo"},
  ]},
  {key:"experiencia",label:"Experiencia",   icon:"😊", desc:"¿Saliste contento?", questions:[
    {q:"¿Cuánto disfrutaste la visita de principio a fin?",              hint:"1 mala tarde → 10 noche perfecta"},
    {q:"¿Cuánto mejoró tu estado de ánimo al salir?",                   hint:"1 salí peor → 10 salí feliz"},
    {q:"¿Cuántas ganas te quedaron de repetir la experiencia?",          hint:"1 ninguna → 10 quiero volver ya"},
  ]},
];

const INITIAL_RESTAURANTS = [
  {name:"80 Grados",visited:true,lat:40.4245,lng:-3.7034},
  {name:"El Kiosko",visited:true,lat:40.430,lng:-3.695},
  {name:"Grillao",visited:true,lat:40.4168,lng:-3.7038},
  {name:"Agarimo",visited:false,lat:40.423,lng:-3.692},
  {name:"La Maruca",visited:false,lat:40.435,lng:-3.69},
  {name:"Hermanos Vinagre",visited:false,lat:40.422,lng:-3.698},
  {name:"Casa Fonzo",visited:false,lat:40.415,lng:-3.71},
  {name:"Riverita Taberna",visited:false,lat:40.426,lng:-3.705},
  {name:"Garelos",visited:false,lat:40.418,lng:-3.702},
  {name:"Colosimo",visited:false,lat:40.429,lng:-3.687},
  {name:"Pimiento Verde",visited:true,lat:40.433,lng:-3.696},
  {name:"Café Comercial",visited:false,lat:40.428,lng:-3.706},
  {name:"Haranita",visited:false,lat:40.419,lng:-3.703},
  {name:"El Viajero",visited:false,lat:40.412,lng:-3.707},
  {name:"Florida Park",visited:false,lat:40.42,lng:-3.682},
  {name:"Fratelli Figurato",visited:false,lat:40.436,lng:-3.693},
  {name:"Manzoni",visited:false,lat:40.431,lng:-3.694},
  {name:"Mo de Movimiento",visited:false,lat:40.424,lng:-3.701},
  {name:"Bosco de Lobos",visited:false,lat:40.427,lng:-3.699},
  {name:"Numa Pompilio",visited:true,lat:40.438,lng:-3.689},
  {name:"Bibo",visited:true,lat:40.439,lng:-3.688},
  {name:"Lobito de Mar",visited:true,lat:40.44,lng:-3.687},
  {name:"Leña",visited:true,lat:40.437,lng:-3.692},
  {name:"Lana",visited:false,lat:40.416,lng:-3.709},
  {name:"Charrúa",visited:false,lat:40.4175,lng:-3.705},
  {name:"Café de París",visited:false,lat:40.4195,lng:-3.697},
  {name:"Taberna de Pedraza",visited:false,lat:40.421,lng:-3.694},
  {name:"Julián de Tolosa",visited:true,lat:40.4225,lng:-3.696},
  {name:"Piantao",visited:true,lat:40.414,lng:-3.708},
  {name:"Las Reses",visited:false,lat:40.4155,lng:-3.706},
  {name:"Carbón",visited:true,lat:40.4165,lng:-3.704},
  {name:"Raza",visited:true,lat:40.4185,lng:-3.7015},
  {name:"Morgana",visited:false,lat:40.434,lng:-3.6945},
  {name:"Tripea",visited:false,lat:40.413,lng:-3.7095},
  {name:"Restaurante Balear",visited:false,lat:40.425,lng:-3.7025},
  {name:"Taberna Delfín",visited:false,lat:40.4135,lng:-3.7085},
  {name:"Monster Sushi",visited:true,lat:40.4345,lng:-3.6955},
  {name:"Divorare",visited:true,lat:40.4285,lng:-3.7065},
  {name:"Haramboure",visited:false,lat:40.4265,lng:-3.7045},
  {name:"Doña Tecla",visited:false,lat:40.4215,lng:-3.6955},
  {name:"Café Santander",visited:true,lat:40.4275,lng:-3.7075},
  {name:"Restaurante Tramo",visited:true,lat:40.4305,lng:-3.6935},
  {name:"Takos al Pastor",visited:false,lat:40.4145,lng:-3.707},
  {name:"Saku Izakaya",visited:false,lat:40.4235,lng:-3.7005},
  {name:"Nacca",visited:false,lat:40.4125,lng:-3.709},
  {name:"Symental",visited:false,lat:40.4205,lng:-3.6945},
  {name:"La Vaca y la Huerta",visited:false,lat:40.4315,lng:-3.6925},
  {name:"Asador Gonzaba",visited:false,lat:40.417,lng:-3.7055},
  {name:"Restaurante Cardumen",visited:false,lat:40.4255,lng:-3.703},
  {name:"Varro",visited:true,lat:40.432,lng:-3.693},
  {name:"Toque",visited:true,lat:40.4295,lng:-3.6865},
  {name:"Nos",visited:false,lat:40.4355,lng:-3.691},
  {name:"La Fonda Lironda",visited:true,lat:40.4325,lng:-3.694},
  {name:"Chez Pepito",visited:false,lat:40.423,lng:-3.693},
  {name:"La Pagoda",visited:false,lat:40.428,lng:-3.704},
  {name:"Pink Monkey",visited:false,lat:40.42,lng:-3.69},
  {name:"Beata Pasta",visited:true,lat:40.4365,lng:-3.6915},
  {name:"Josefita",visited:false,lat:40.4245,lng:-3.7015},
  {name:"Mercado Vallehermoso (Krudo)",visited:false,lat:40.4335,lng:-3.702},
  {name:"Ichikani",visited:true,lat:40.4375,lng:-3.6895},
  {name:"Castelados",visited:false,lat:40.4185,lng:-3.701},
  {name:"La Castela",visited:false,lat:40.4175,lng:-3.6985},
  {name:"Mercado de Chamberí",visited:true,lat:40.4355,lng:-3.7025},
  {name:"Enkai Buffet Sushi",visited:false,lat:40.4215,lng:-3.6975},
  {name:"Revuelto",visited:false,lat:40.429,lng:-3.708},
  {name:"Casa Orellana",visited:true,lat:40.4175,lng:-3.6995},
  {name:"Fogata",visited:false,lat:40.416,lng:-3.7045},
  {name:"El Enemigo",visited:false,lat:40.415,lng:-3.7065},
  {name:"Dum Dum",visited:true,lat:40.4165,lng:-3.6985},
  {name:"Manifesto13",visited:true,lat:40.4225,lng:-3.7055},
  {name:"Her",visited:false,lat:40.427,lng:-3.6905},
  {name:"Alto Bardero",visited:false,lat:40.431,lng:-3.696},
  {name:"Olea",visited:false,lat:40.43,lng:-3.6945},
  {name:"Ristolab",visited:false,lat:40.424,lng:-3.7025},
  {name:"Casa Rivas",visited:false,lat:40.4155,lng:-3.7075},
  {name:"La Notaría",visited:false,lat:40.4195,lng:-3.6965},
  {name:"Kaito",visited:false,lat:40.4235,lng:-3.6915},
  {name:"Yamate",visited:false,lat:40.425,lng:-3.7},
  {name:"Casa Corea",visited:false,lat:40.422,lng:-3.691},
  {name:"Trattoria de Alfredo",visited:false,lat:40.4285,lng:-3.7},
  {name:"The Omar",visited:false,lat:40.42,lng:-3.6955},
  {name:"Tetsu",visited:false,lat:40.421,lng:-3.6935},
  {name:"Playing Solo",visited:false,lat:40.426,lng:-3.706},
  {name:"Sacha",visited:false,lat:40.439,lng:-3.683},
  {name:"Casa Pei",visited:false,lat:40.4145,lng:-3.7095},
  {name:"Nakeima",visited:false,lat:40.4185,lng:-3.7025},
  {name:"Biribiri",visited:false,lat:40.413,lng:-3.71},
  {name:"Umaki",visited:false,lat:40.4225,lng:-3.6945},
  {name:"Chitón",visited:false,lat:40.4275,lng:-3.7055},
  {name:"Taquería El Puerco",visited:false,lat:40.4135,lng:-3.711},
  {name:"Gabos",visited:false,lat:40.433,lng:-3.697},
  {name:"Tribeca",visited:false,lat:40.4205,lng:-3.6925},
  {name:"Tonton",visited:false,lat:40.425,lng:-3.7045},
  {name:"Biri Biri",visited:true,lat:40.4115,lng:-3.7085},
  {name:"Gozá",visited:false,lat:40.4315,lng:-3.695},
  {name:"Gastón",visited:false,lat:40.418,lng:-3.7035},
  {name:"Casa Victoria",visited:false,lat:40.4265,lng:-3.7035},
  {name:"Hiro",visited:false,lat:40.4215,lng:-3.6995},
  {name:"Nacha",visited:true,lat:40.4295,lng:-3.6875},
  {name:"Caja de Cerillas",visited:false,lat:40.4305,lng:-3.6915},
  {name:"Myo",visited:true,lat:40.436,lng:-3.6935},
  {name:"Marciano",visited:false,lat:40.423,lng:-3.704},
  {name:"Isa",visited:false,lat:40.419,lng:-3.704},
  {name:"Casa Isabella",visited:false,lat:40.4255,lng:-3.6895},
  {name:"Ancho Madrid",visited:false,lat:40.414,lng:-3.706},
  {name:"Araia",visited:false,lat:40.417,lng:-3.7},
  {name:"Nuga Castellana",visited:true,lat:40.442,lng:-3.686},
  {name:"Pilar Akaneya",visited:false,lat:40.4245,lng:-3.6905},
  {name:"Hotaru",visited:false,lat:40.422,lng:-3.6985},
  {name:"Gaman",visited:false,lat:40.4235,lng:-3.6975},
  {name:"Palique Pozuelo",visited:true,lat:40.438,lng:-3.8},
  {name:"Luma",visited:false,lat:40.4275,lng:-3.6915},
  {name:"Baro Sushi",visited:false,lat:40.4295,lng:-3.6855},
  {name:"Nato",visited:false,lat:40.416,lng:-3.703},
  {name:"Aredna",visited:false,lat:40.4155,lng:-3.7015},
  {name:"Nolita Madrid",visited:false,lat:40.432,lng:-3.696},
  {name:"Casa Mortero",visited:false,lat:40.419,lng:-3.706},
  {name:"Casa Macareno",visited:false,lat:40.4205,lng:-3.707},
  {name:"Güsto Mercado de San Antón",visited:true,lat:40.4220,lng:-3.6920},
  {name:"Chirón",visited:true,lat:40.4180,lng:-3.6980},
  {name:"Origine",visited:true,lat:40.4260,lng:-3.7010},
  {name:"StreetXO",visited:true,lat:40.4390,lng:-3.6870},
];

/* ─── HELPERS ─── */
function getAvg(ratings) {
  if (!ratings) return null;
  const v = CRITERIA.map(c => ratings[c.key]).filter(x => x != null);
  if (!v.length) return null;
  return (v.reduce((a,b)=>a+b,0)/v.length).toFixed(1);
}
function initAnswers() {
  return Object.fromEntries(CRITERIA.map(c=>[c.key,c.questions.map(()=>5)]));
}
function answersToRatings(ans) {
  return Object.fromEntries(CRITERIA.map(c=>{
    const a=ans[c.key];
    return [c.key, Math.round((a.reduce((x,y)=>x+y,0)/a.length)*10)/10];
  }));
}
function ratingsToAnswers(ratings) {
  return Object.fromEntries(CRITERIA.map(c=>[c.key,c.questions.map(()=>ratings[c.key]||5)]));
}
function googleUrl(name) {
  return `https://www.google.com/search?q=${encodeURIComponent(name+" restaurante Madrid")}`;
}

/* ─── UI ATOMS ─── */
function ScoreBadge({value,size=48}) {
  const c=value>=8?"#4caf50":value>=6?"#e6a817":value>=4?"#f44336":"#9e9e9e";
  return <div style={{width:size,height:size,borderRadius:"50%",border:`2.5px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",background:`${c}18`,flexShrink:0}}><span style={{color:c,fontWeight:800,fontSize:size*.3,fontFamily:"'Playfair Display',serif"}}>{value}</span></div>;
}
function PriceBadge({priceKey}) {
  const p=PRICE_RANGES.find(x=>x.key===priceKey);
  if (!p) return null;
  return <span style={{fontSize:11,background:`${p.color}18`,color:p.color,border:`1px solid ${p.color}44`,padding:"2px 8px",borderRadius:20,fontWeight:600,whiteSpace:"nowrap"}}>{p.emoji} {p.label}</span>;
}
function Avatar({name}) {
  const C=["#c9a84c","#8b2c2c","#2a7d4f","#1a4a8a","#6a2a8a","#b05a00","#006878"];
  const B=["#c9a84c18","#8b2c2c18","#2a7d4f18","#1a4a8a18","#6a2a8a18","#b05a0018","#00687818"];
  const i=name.charCodeAt(0)%C.length;
  return <div style={{height:100,background:B[i],display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6}}><div style={{width:48,height:48,borderRadius:"50%",background:C[i],display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 16px ${C[i]}55`}}><span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"#fff"}}>{name.charAt(0)}</span></div><span style={{fontSize:10,color:C[i],fontWeight:700,letterSpacing:1,textTransform:"uppercase",maxWidth:160,textAlign:"center",padding:"0 8px"}}>{name}</span></div>;
}
function Spinner() {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60}}><div style={{width:36,height:36,border:"3px solid var(--warm)",borderTopColor:"var(--gold)",borderRadius:"50%",animation:"spin 1s linear infinite"}}/></div>;
}

/* ─── MODAL ─── */
function Modal({onClose,children}) {
  return <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,.72)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(6px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div style={{background:"var(--cream)",borderRadius:20,padding:28,maxWidth:520,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(26,18,8,.35)"}}>{children}</div></div>;
}

/* ─── CRITERION BLOCK ─── */
function CriterionBlock({criterion,answers,onChange}) {
  const avg=answers.length?(answers.reduce((a,b)=>a+b,0)/answers.length).toFixed(1):"—";
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:8,borderBottom:"1px solid var(--warm)"}}>
        <span style={{fontSize:18}}>{criterion.icon}</span>
        <div style={{flex:1}}><span style={{fontWeight:700,color:"var(--dark)",fontSize:14}}>{criterion.label}</span><span style={{color:"var(--muted)",fontSize:11,marginLeft:6}}>— {criterion.desc}</span></div>
        <span style={{fontWeight:800,color:"var(--gold)",fontSize:16}}>{avg}</span>
      </div>
      {criterion.questions.map((q,i)=>(
        <div key={i} style={{marginBottom:11}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
            <div style={{flex:1,paddingRight:8}}><p style={{fontSize:12,color:"var(--text)",fontWeight:600}}>{q.q}</p><p style={{fontSize:11,color:"var(--muted)"}}>{q.hint}</p></div>
            <span style={{fontWeight:700,color:"var(--gold)",fontSize:13,minWidth:24,textAlign:"right"}}>{answers[i]??5}</span>
          </div>
          <input type="range" min={1} max={10} value={answers[i]??5} onChange={e=>{const n=[...answers];n[i]=Number(e.target.value);onChange(n);}} style={{width:"100%"}}/>
        </div>
      ))}
    </div>
  );
}

/* ─── PRICE SELECTOR ─── */
function PriceSelector({value,onChange}) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:8,borderBottom:"1px solid var(--warm)"}}>
        <span style={{fontSize:18}}>💶</span>
        <div style={{flex:1}}><span style={{fontWeight:700,color:"var(--dark)",fontSize:14}}>Precio medio por persona</span><span style={{color:"var(--muted)",fontSize:11,marginLeft:6}}>— Incluyendo bebida</span></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {PRICE_RANGES.map(p=><button key={p.key} onClick={()=>onChange(p.key)} style={{padding:"10px 14px",borderRadius:10,border:`1.5px solid ${value===p.key?p.color:p.color+"44"}`,background:value===p.key?`${p.color}18`:"#fff",color:value===p.key?p.color:"var(--muted)",cursor:"pointer",textAlign:"left",fontWeight:value===p.key?700:400,fontSize:13,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:16}}>{p.emoji}</span><span>{p.label}</span>{value===p.key&&<span style={{marginLeft:"auto"}}>✓</span>}</button>)}
      </div>
    </div>
  );
}

/* ─── FOOD TYPE SELECTOR ─── */
function FoodTypeSelector({value,onChange}) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:8,borderBottom:"1px solid var(--warm)"}}>
        <span style={{fontSize:18}}>🍽️</span>
        <div style={{flex:1}}><span style={{fontWeight:700,color:"var(--dark)",fontSize:14}}>Tipo de cocina</span></div>
      </div>
      <select value={value||""} onChange={e=>onChange(e.target.value||null)}
        style={{width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid var(--warm)",background:"#fff",fontSize:14,color:value?"var(--dark)":"var(--muted)",outline:"none",cursor:"pointer"}}>
        <option value="">Seleccionar tipo de cocina...</option>
        {FOOD_TYPES.map(f=><option key={f} value={f}>{f}</option>)}
      </select>
    </div>
  );
}

/* ─── PIN MODAL ─── */
const EDIT_PIN = "2024";
function PinModal({onSuccess,onClose}) {
  const [pin,setPin]=useState("");
  const [err,setErr]=useState(false);
  const check=()=>{ if(pin===EDIT_PIN){onSuccess();}else{setErr(true);setPin("");} };
  return(
    <Modal onClose={onClose}>
      <div style={{textAlign:"center",paddingBottom:8}}>
        <div style={{fontSize:36,marginBottom:12}}>🔒</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"var(--dark)",marginBottom:6}}>Acceso protegido</h2>
        <p style={{color:"var(--muted)",fontSize:14,marginBottom:20}}>Introduce el PIN para editar valoraciones</p>
        <input type="password" placeholder="PIN" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&check()}
          style={{width:"100%",padding:"12px",borderRadius:10,border:`1.5px solid ${err?"var(--red)":"var(--warm)"}`,background:"#fff",fontSize:18,textAlign:"center",letterSpacing:6,outline:"none",marginBottom:8}}/>
        {err&&<p style={{color:"var(--red)",fontSize:13,marginBottom:8}}>PIN incorrecto</p>}
        <div style={{display:"flex",gap:10,marginTop:12}}>
          <button onClick={onClose} className="btn-o" style={{flex:1,padding:"12px",borderRadius:12,fontSize:14}}>Cancelar</button>
          <button onClick={check} className="btn-g" style={{flex:1,padding:"12px",borderRadius:12,fontSize:14}}>Entrar</button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── RATING MODAL ─── */
function RatingModal({restaurant,onSave,onClose}) {
  const [unlocked,setUnlocked]=useState(false);
  const [answers,setAnswers]=useState(restaurant.ratings?ratingsToAnswers(restaurant.ratings):initAnswers());
  const [priceRange,setPriceRange]=useState(restaurant.price_range||null);
  const [foodType,setFoodType]=useState(restaurant.food_type||null);
  const ratings=answersToRatings(answers);
  const avg=getAvg(ratings);
  if (!unlocked) return <PinModal onSuccess={()=>setUnlocked(true)} onClose={onClose}/>;
  return (
    <Modal onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div><p style={{fontSize:11,color:"var(--gold)",fontWeight:600,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Valorando</p><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"var(--dark)"}}>{restaurant.name}</h2></div>
        {avg&&<ScoreBadge value={parseFloat(avg)} size={56}/>}
      </div>
      <FoodTypeSelector value={foodType} onChange={setFoodType}/>
      <div style={{marginBottom:16}}>
        <p style={{fontSize:13,color:"var(--text)",fontWeight:600,marginBottom:6}}>💬 Comentario / Notas</p>
        <textarea placeholder="¿Qué recordáis? Platos destacados, qué pedir la próxima vez..." value={comment} onChange={e=>setComment(e.target.value)} rows={3}
          style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid var(--warm)",background:"#fff",fontSize:13,color:"var(--dark)",outline:"none",resize:"vertical",lineHeight:1.5}}/>
      </div>
      <PriceSelector value={priceRange} onChange={setPriceRange}/>
      {CRITERIA.map(c=><CriterionBlock key={c.key} criterion={c} answers={answers[c.key]} onChange={vals=>setAnswers(a=>({...a,[c.key]:vals}))}/>)}
      <div style={{display:"flex",gap:10,marginTop:20}}>
        <button onClick={onClose} className="btn-o" style={{flex:1,padding:"12px",borderRadius:12,fontSize:14}}>Cancelar</button>
        <button onClick={()=>onSave(ratings,priceRange,foodType)} className="btn-g" style={{flex:2,padding:"12px",borderRadius:12,fontSize:15}}>Guardar ★</button>
      </div>
    </Modal>
  );
}

/* ─── COMMENT MODAL ─── */
function CommentModal({restaurant,onSave,onClose}) {
  const [text,setText]=useState(restaurant.comment||"");
  return (
    <Modal onClose={onClose}>
      <p style={{fontSize:11,color:"var(--gold)",fontWeight:600,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Comentario</p>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"var(--dark)",marginBottom:16}}>{restaurant.name}</h2>
      <textarea placeholder="¿Qué recordáis de este sitio? Platos que pedisteis, anécdotas, qué pedir la próxima vez..." value={text} onChange={e=>setText(e.target.value)} rows={6}
        style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid var(--warm)",background:"#fff",fontSize:14,color:"var(--dark)",outline:"none",resize:"vertical",lineHeight:1.6}}/>
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <button onClick={onClose} className="btn-o" style={{flex:1,padding:"12px",borderRadius:12,fontSize:14}}>Cancelar</button>
        <button onClick={()=>onSave(text)} className="btn-g" style={{flex:2,padding:"12px",borderRadius:12,fontSize:15}}>Guardar 💬</button>
      </div>
    </Modal>
  );
}

/* ─── ADD MODAL ─── */
function AddModal({onSave,onClose}) {
  const [form,setForm]=useState({name:"",visited:false});
  const [answers,setAnswers]=useState(initAnswers());
  const [priceRange,setPriceRange]=useState(null);
  const [foodType,setFoodType]=useState(null);
  const [comment,setComment]=useState("");
  const ratings=answersToRatings(answers);
  return (
    <Modal onClose={onClose}>
      <p style={{fontSize:11,color:"var(--gold)",fontWeight:600,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Nuevo restaurante</p>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"var(--dark)",marginBottom:20}}>Agregar</h2>
      <input placeholder="Nombre del restaurante" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
        style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid var(--warm)",background:"#fff",fontSize:15,marginBottom:14,color:"var(--dark)",outline:"none"}}/>
      <label style={{display:"flex",alignItems:"center",gap:10,color:"var(--text)",marginBottom:20,cursor:"pointer",fontSize:14}}>
        <input type="checkbox" checked={form.visited} onChange={e=>setForm(f=>({...f,visited:e.target.checked}))}/>
        Ya lo hemos visitado — puntuar ahora
      </label>
      <FoodTypeSelector value={foodType} onChange={setFoodType}/>
      {form.visited&&<><PriceSelector value={priceRange} onChange={setPriceRange}/>{CRITERIA.map(c=><CriterionBlock key={c.key} criterion={c} answers={answers[c.key]} onChange={vals=>setAnswers(a=>({...a,[c.key]:vals}))}/>)}</>}
      <div style={{display:"flex",gap:10,marginTop:20}}>
        <button onClick={onClose} className="btn-o" style={{flex:1,padding:"12px",borderRadius:12,fontSize:14}}>Cancelar</button>
        <button onClick={()=>{if(!form.name.trim())return;onSave({...form,ratings:form.visited?ratings:null,price_range:form.visited?priceRange:null,food_type:foodType,comment:comment||null,comment:comment||null,lat:40.4168+(Math.random()-.5)*.04,lng:-3.7038+(Math.random()-.5)*.04});}} className="btn-g" style={{flex:2,padding:"12px",borderRadius:12,fontSize:15}}>Agregar</button>
      </div>
    </Modal>
  );
}

/* ─── RANK CARD ─── */
function RankCard({r,rank,onRate}) {
  const avg=getAvg(r.ratings);
  const [open,setOpen]=useState(false);
  const waze=`waze://?ll=${r.lat},${r.lng}&navigate=yes`;
  const wazeFb=`https://waze.com/ul?ll=${r.lat},${r.lng}&navigate=yes`;
  const gmUrl=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name+" Madrid")}`;
  return (
    <div className="card-h" style={{background:"#fff",borderRadius:14,border:"1px solid var(--warm)",overflow:"hidden"}}>
      <div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:22,color:rank<=3?"var(--gold)":"var(--warm)",minWidth:32,textAlign:"center"}}>{rank<=3?["🥇","🥈","🥉"][rank-1]:rank}</span>
        <div style={{flex:1}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"var(--dark)",marginBottom:4}}>{r.name}</h3>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
            {r.food_type&&<span style={{fontSize:10,background:"#1a120812",color:"var(--text)",padding:"1px 7px",borderRadius:20,fontWeight:600}}>{r.food_type}</span>}
            {r.price_range&&<PriceBadge priceKey={r.price_range}/>}
            {r.ratings&&CRITERIA.map(c=><span key={c.key} style={{fontSize:10,color:"var(--muted)",background:"var(--cream)",padding:"1px 6px",borderRadius:6}}>{c.icon}<strong style={{color:"var(--text)"}}>{r.ratings[c.key]}</strong></span>)}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {avg?<ScoreBadge value={parseFloat(avg)}/>:<button onClick={e=>{e.stopPropagation();onRate(r);}} className="btn-o" style={{fontSize:12,padding:"6px 12px",borderRadius:8}}>Valorar</button>}
          {avg&&<button onClick={e=>{e.stopPropagation();onRate(r);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"var(--muted)"}}>✏️</button>}
          <span style={{color:"var(--muted)",fontSize:12}}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open&&<div style={{padding:"0 18px 16px",borderTop:"1px solid var(--cream)",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>window.open(googleUrl(r.name),"_blank")} className="btn-g" style={{flex:1,padding:"8px",borderRadius:10,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",minWidth:100}}>🔍 Google</button>
        <button onClick={()=>window.open(gmUrl,"_blank")} style={{flex:1,padding:"8px",borderRadius:10,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",background:"#4285f4",color:"#fff",minWidth:100}}>📍 Maps</button>
        <button onClick={()=>{window.location.href=waze;setTimeout(()=>window.open(wazeFb,"_blank"),1500);}} style={{flex:1,padding:"8px",borderRadius:10,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",background:"#05c8f7",color:"#1a1208",minWidth:100}}>🚗 Waze</button>
      </div>}
    </div>
  );
}

/* ─── STATS TAB ─── */
function StatsTab({rests}) {
  const [drill,setDrill]=useState(null);
  const rated=rests.filter(r=>r.ratings);
  const avgs=rated.map(r=>parseFloat(getAvg(r.ratings)));
  const avg=avgs.length?(avgs.reduce((a,b)=>a+b,0)/avgs.length).toFixed(1):"—";
  const top=[...rated].sort((a,b)=>parseFloat(getAvg(b.ratings))-parseFloat(getAvg(a.ratings)))[0]?.name||"Ninguno aún";

  const drillData=useMemo(()=>{
    if (!drill) return [];
    if (drill==="total") return [...rests].sort((a,b)=>a.name.localeCompare(b.name));
    if (drill==="visitados") return rests.filter(r=>r.visited).sort((a,b)=>a.name.localeCompare(b.name));
    if (drill==="rated") return [...rated].sort((a,b)=>(parseFloat(getAvg(b.ratings))||0)-(parseFloat(getAvg(a.ratings))||0));
    if (drill==="pending") return rests.filter(r=>!r.visited).sort((a,b)=>a.name.localeCompare(b.name));
    return [];
  },[drill,rests]);

  const drillLabel={total:"Todos los restaurantes",visitados:"Restaurantes visitados",rated:"Restaurantes puntuados",pending:"Restaurantes pendientes"};
  const cards=[
    {key:"total",   label:"Restaurantes", value:rests.length,              icon:"🍽️", sub:"en la lista"},
    {key:"visitados",label:"Visitados",   value:rests.filter(r=>r.visited).length, icon:"✅", sub:"de aventura"},
    {key:"rated",   label:"Puntuados",    value:rated.length,               icon:"⭐", sub:"con nota"},
    {key:"pending", label:"Pendientes",   value:rests.filter(r=>!r.visited).length,icon:"⏳", sub:"por descubrir"},
  ];

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12,marginBottom:22}}>
        {cards.map(s=>(
          <div key={s.key} onClick={()=>setDrill(drill===s.key?null:s.key)} className="card-h"
            style={{background:drill===s.key?"linear-gradient(135deg,var(--dark),var(--dark2))":"#fff",borderRadius:14,padding:18,textAlign:"center",border:`1px solid ${drill===s.key?"var(--gold)":"var(--warm)"}`,cursor:"pointer"}}>
            <div style={{fontSize:26,marginBottom:8}}>{s.icon}</div>
            <div style={{fontSize:26,fontWeight:800,color:"var(--gold)",fontFamily:"'Playfair Display',serif",marginBottom:2}}>{s.value}</div>
            <div style={{fontSize:12,color:drill===s.key?"var(--cream)":"var(--dark)",fontWeight:600}}>{s.label}</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>{drill===s.key?"▲ cerrar":"▼ ver lista"}</div>
          </div>
        ))}
        <div className="card-h" style={{background:"#fff",borderRadius:14,padding:18,textAlign:"center",border:"1px solid var(--warm)"}}>
          <div style={{fontSize:26,marginBottom:8}}>📊</div>
          <div style={{fontSize:26,fontWeight:800,color:"var(--gold)",fontFamily:"'Playfair Display',serif",marginBottom:2}}>{avg}</div>
          <div style={{fontSize:12,color:"var(--dark)",fontWeight:600}}>Nota media</div>
          <div style={{fontSize:11,color:"var(--muted)"}}>sobre 10</div>
        </div>
      </div>

      {/* Drill overlay */}
      {drill&&drillData.length>0&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,.6)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setDrill(null)}>
          <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:600,maxHeight:"80vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 20px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid var(--warm)"}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",color:"var(--dark)",fontSize:18}}>{drillLabel[drill]}</h3>
              <button onClick={()=>setDrill(null)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:20}}>✕</button>
            </div>
            <div style={{overflowY:"auto",padding:"12px 20px 24px",display:"flex",flexDirection:"column",gap:8}}>
              {drillData.map(r=>{
                const a=getAvg(r.ratings);
                return (
                  <div key={r.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:10,background:"var(--cream)",gap:10}}>
                    <div style={{flex:1}}>
                      <p style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"var(--dark)"}}>{r.name}</p>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:2}}>
                        {r.visited&&<span style={{fontSize:10,color:"var(--red)"}}>✅ Visitado</span>}
                        {r.price_range&&<PriceBadge priceKey={r.price_range}/>}
                        {r.food_type&&<span style={{fontSize:10,background:"#1a120812",color:"var(--text)",padding:"1px 6px",borderRadius:10}}>{r.food_type}</span>}
                      </div>
                    </div>
                    {a&&<ScoreBadge value={parseFloat(a)} size={36}/>}
                    {!a&&r.visited&&<span style={{fontSize:11,color:"var(--muted)"}}>Sin nota</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {top!=="Ninguno aún"&&(
        <div style={{background:"linear-gradient(135deg,var(--dark),var(--dark2))",borderRadius:16,padding:"18px 22px",marginBottom:22,display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontSize:32}}>🏆</span>
          <div><p style={{color:"var(--gold)",fontSize:10,letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>Vuestro favorito hasta ahora</p><p style={{fontFamily:"'Playfair Display',serif",color:"var(--cream)",fontSize:20,fontStyle:"italic"}}>{top}</p></div>
        </div>
      )}

      <div style={{background:"#fff",borderRadius:16,padding:22,border:"1px solid var(--warm)",marginBottom:22}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",color:"var(--dark)",marginBottom:18,fontSize:18}}>Nota media por criterio</h3>
        {CRITERIA.map(c=>{
          const r2=rests.filter(r=>r.ratings&&r.ratings[c.key]);
          const a2=r2.length?(r2.reduce((a,r)=>a+r.ratings[c.key],0)/r2.length):0;
          return <div key={c.key} style={{marginBottom:13}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:"var(--text)"}}>{c.icon} {c.label}</span><span style={{fontWeight:700,color:"var(--gold)",fontSize:13}}>{a2?a2.toFixed(1):"—"}</span></div><div style={{background:"var(--warm)",borderRadius:6,height:8,overflow:"hidden"}}><div style={{width:`${a2*10}%`,height:"100%",background:"linear-gradient(90deg,var(--red),var(--gold))",borderRadius:6}}/></div></div>;
        })}
      </div>

      <div style={{background:"#fff",borderRadius:16,padding:22,border:"1px solid var(--warm)"}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",color:"var(--dark)",marginBottom:18,fontSize:18}}>💶 Distribución por precio</h3>
        {PRICE_RANGES.map(p=>{
          const count=rests.filter(r=>r.price_range===p.key).length;
          const total=rests.filter(r=>r.price_range).length||1;
          return <div key={p.key} style={{marginBottom:13}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:"var(--text)"}}>{p.emoji} {p.label}</span><span style={{fontWeight:700,color:p.color,fontSize:13}}>{count}</span></div><div style={{background:"var(--warm)",borderRadius:6,height:8,overflow:"hidden"}}><div style={{width:`${(count/total)*100}%`,height:"100%",background:p.color,borderRadius:6}}/></div></div>;
        })}
      </div>
    </div>
  );
}

/* ─── FRONT PAGE ─── */
function FrontPage({onEnter,total,visited}) {
  return (
    <div style={{minHeight:"100vh",background:"var(--dark)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",padding:24}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(ellipse at 20% 50%, #8b2c2c1a 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, #c9a84c12 0%, transparent 55%)"}}/>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",userSelect:"none"}}>
        <span style={{fontSize:"45vw",fontWeight:900,color:"#fff",opacity:.025,fontFamily:"'Playfair Display',serif",lineHeight:1,letterSpacing:"-4vw"}}>27</span>
      </div>
      <div style={{position:"absolute",top:"18%",right:"7%",fontSize:72,opacity:.04,animation:"float 7s ease-in-out infinite"}}>🍽️</div>
      <div style={{position:"absolute",bottom:"18%",left:"7%",fontSize:56,opacity:.04,animation:"float 9s ease-in-out infinite 2s"}}>🍷</div>
      <div style={{position:"relative",textAlign:"center",maxWidth:580}}>
        <p className="f1" style={{fontSize:10,color:"var(--gold)",letterSpacing:5,textTransform:"uppercase",marginBottom:28,fontWeight:500}}>Madrid · Guía Gastronómica Personal</p>
        <div className="f2">
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(58px,11vw,104px)",fontWeight:900,lineHeight:.92,background:"linear-gradient(135deg,var(--cream) 0%,var(--gold-light) 40%,var(--cream) 70%,var(--gold) 100%)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 4s linear infinite",letterSpacing:"-2px"}}>Mesa</h1>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(58px,11vw,104px)",fontWeight:900,lineHeight:.92,fontStyle:"italic",background:"linear-gradient(135deg,var(--gold) 0%,var(--cream) 50%,var(--gold-light) 100%)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 4s linear infinite .5s",letterSpacing:"-2px"}}>para Dos</h1>
        </div>
        <div className="f3" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,margin:"30px 0"}}>
          <div style={{height:1,width:56,background:"linear-gradient(90deg,transparent,var(--gold))"}}/>
          <p style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"var(--warm)",fontSize:19}}>por Iker & Sandra</p>
          <div style={{height:1,width:56,background:"linear-gradient(90deg,var(--gold),transparent)"}}/>
        </div>
        <p className="f4" style={{color:"#6a5a4a",fontSize:15,lineHeight:1.8,maxWidth:380,margin:"0 auto 44px",fontWeight:300}}>Nuestra guía íntima de los mejores rincones gastronómicos de Madrid.</p>
        <div className="f5">
          <button onClick={onEnter} className="btn-g" style={{padding:"16px 52px",borderRadius:50,fontSize:16,letterSpacing:.5,fontFamily:"'Playfair Display',serif",fontStyle:"italic",boxShadow:"0 0 50px rgba(201,168,76,.25)"}}>Abrir la guía →</button>
          <p style={{color:"#3a2a1a",fontSize:12,marginTop:18}}>{total} restaurantes · {visited} visitados</p>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ─── */
export default function App() {
  const [page,setPage]=useState("front");
  const [rests,setRests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("ranking");
  const [target,setTarget]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [sortBy,setSortBy]=useState("avg");
  const [search,setSearch]=useState("");
  const [pendSearch,setPendSearch]=useState("");
  const [listSearch,setListSearch]=useState("");
  const [showFilters,setShowFilters]=useState(false);
  const [commentTarget,setCommentTarget]=useState(null);
  const [filterType,setFilterType]=useState(null);
  const [showTypeFilter,setShowTypeFilter]=useState(false);

  /* ── Supabase: load all restaurants ── */
  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("restaurants_with_ratings")
        .select("*")
        .order("name");
      if (error) throw error;
      // Map DB fields to local shape
      const mapped = (data||[]).map(r => ({
        ...r,
        ratings: r.sabor != null ? {
          sabor:r.sabor, rcp:r.rcp, ambiente:r.ambiente,
          servicio:r.servicio, repetiria:r.repetiria, wow:r.wow, experiencia:r.experiencia
        } : null,
      }));
      setRests(mapped);
    } catch(e) {
      console.error("Error loading:", e);
      // Fallback to initial data if Supabase not configured
      setRests(INITIAL_RESTAURANTS.map((r,i)=>({...r,id:i+1,ratings:null,price_range:null,food_type:null})));
    }
    setLoading(false);
  }, []);

  /* ── Seed initial data if DB is empty ── */
  useEffect(() => {
    if (page !== "app") return;
    (async () => {
      await loadRestaurants();
      // Check if we need to seed
      const { count } = await supabase.from("restaurants").select("*", {count:"exact",head:true});
      if (count === 0) {
        const { error } = await supabase.from("restaurants").insert(
          INITIAL_RESTAURANTS.map(r => ({name:r.name, visited:r.visited, lat:r.lat, lng:r.lng}))
        );
        if (!error) await loadRestaurants();
      }
    })();
  }, [page]);

  /* ── Save rating ── */
  const saveRating = useCallback(async (id, ratings, priceRange, foodType) => {
    try {
      // Update restaurant meta
      await supabase.from("restaurants").update({
        visited: true,
        price_range: priceRange,
        food_type: foodType,
      }).eq("id", id);
      // Upsert rating
      await supabase.from("ratings").upsert({
        restaurant_id: id,
        ...ratings,
        updated_at: new Date().toISOString(),
      }, { onConflict: "restaurant_id" });
      await loadRestaurants();
    } catch(e) { console.error("Save error:", e); }
    setTarget(null);
  }, [loadRestaurants]);

  /* ── Save comment ── */
  const saveComment = useCallback(async (id, comment) => {
    await supabase.from("restaurants").update({ comment }).eq("id", id);
    await loadRestaurants();
    setCommentTarget(null);
  }, [loadRestaurants]);

  /* ── Mark visited ── */
  const markVisited = useCallback(async (id) => {
    await supabase.from("restaurants").update({ visited: true }).eq("id", id);
    await loadRestaurants();
  }, [loadRestaurants]);

  /* ── Delete visited ── */
  const deleteRestaurant = useCallback(async (id) => {
    // Confirmación nativa para evitar borrados por error
    const confirmacion = window.confirm("¿Seguro que quieres eliminar este restaurante de la lista?");
    if (!confirmacion) return;
  
    try {
      const { error } = await supabase
        .from("restaurants")
        .delete()
        .eq("id", id);
  
      if (error) throw error;
  
      // Actualizamos el estado local para quitar el restaurante de la vista de inmediato
      setRests((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error al eliminar el restaurante:", error);
      alert("No se pudo eliminar el restaurante. Inténtalo de nuevo.");
    }
  }, []);

  /* ── Add new restaurant ── */
  const addRestaurant = useCallback(async (data) => {
    try {
      const { data: inserted, error } = await supabase.from("restaurants").insert([{
        name: data.name, visited: data.visited,
        price_range: data.price_range, food_type: data.food_type,
        comment: data.comment||null,
        lat: data.lat, lng: data.lng,
      }]).select().single();
      if (error) throw error;
      if (data.ratings && inserted) {
        await supabase.from("ratings").insert([{
          restaurant_id: inserted.id, ...data.ratings,
          updated_at: new Date().toISOString(),
        }]);
      }
      await loadRestaurants();
    } catch(e) { console.error("Add error:", e); }
    setShowAdd(false);
  }, [loadRestaurants]);

  /* ── Derived lists ── */
  const rankingList = useMemo(()=>{
    let l=rests.filter(r=>r.ratings);
    if(search) l=l.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));
    if(filterType) l=l.filter(r=>r.food_type===filterType);
    l.sort((a,b)=>sortBy==="avg"?(parseFloat(getAvg(b.ratings))||0)-(parseFloat(getAvg(a.ratings))||0):(b.ratings?.[sortBy]||0)-(a.ratings?.[sortBy]||0));
    return l.slice(0,20);
  },[rests,sortBy,search,filterType]);

  const valorarList = useMemo(()=>{
    const v=rests.filter(r=>r.visited);
    return {
      unrated:v.filter(r=>!r.ratings).sort((a,b)=>a.name.localeCompare(b.name)),
      rated:v.filter(r=>r.ratings).sort((a,b)=>(parseFloat(getAvg(b.ratings))||0)-(parseFloat(getAvg(a.ratings))||0)),
    };
  },[rests]);

  const pendList = useMemo(()=>rests.filter(r=>!r.visited).sort((a,b)=>a.name.localeCompare(b.name)),[rests]);

  const fullList = useMemo(()=>{
    if (!listSearch) return [...rests].sort((a,b)=>a.name.localeCompare(b.name));
    return rests.filter(r=>r.name.toLowerCase().includes(listSearch.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name));
  },[rests,listSearch]);

  if (page==="front") return <><FontLoader/><FrontPage onEnter={()=>setPage("app")} total={rests.length||INITIAL_RESTAURANTS.length} visited={rests.filter(r=>r.visited).length||INITIAL_RESTAURANTS.filter(r=>r.visited).length}/></>;

  const TABS=[
    {id:"ranking",   label:"🏆 Ranking"},
    {id:"lista",     label:"📋 Lista"},
    {id:"valorar",   label:"⭐ Valorar"},
    {id:"pendientes",label:"📍 Pendientes"},
    {id:"stats",     label:"📊 Stats"},
  ];

  return (
    <>
      <FontLoader/>
      <div style={{minHeight:"100vh",background:"var(--cream)",fontFamily:"'DM Sans',sans-serif",color:"var(--text)"}}>
        {/* NAV */}
        <div style={{background:"var(--dark)",borderBottom:"1px solid #2a1f0e",position:"sticky",top:0,zIndex:100}}>
          <div style={{maxWidth:1000,margin:"0 auto",padding:"0 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:8,paddingBottom:4}}>
              <button onClick={()=>setPage("front")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:6,background:"linear-gradient(135deg,var(--gold),var(--gold-light))",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:14,fontWeight:900,color:"var(--dark)"}}>M</span></div>
                <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:14,color:"var(--gold)"}}>Mesa para Dos</span>
              </button>
              <button onClick={()=>setShowAdd(true)} className="btn-g" style={{padding:"7px 14px",borderRadius:20,fontSize:13}}>+ Agregar</button>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 2px",background:"none",border:"none",color:tab===t.id?"var(--gold)":"#4a3a2a",fontSize:11,fontWeight:500,cursor:"pointer",borderBottom:tab===t.id?"2px solid var(--gold)":"2px solid transparent",whiteSpace:"nowrap",textAlign:"center"}}>{t.label}</button>)}
            </div>
          </div>
        </div>

        <div style={{maxWidth:1000,margin:"0 auto",padding:"28px 16px"}}>
          {loading && <Spinner/>}
          {!loading && <>

          {/* RANKING */}
          {tab==="ranking"&&<div>
            {rankingList.length>=1&&(()=>{
              const top3=rankingList.slice(0,3);
              const order=top3.length>=2?[top3[1],top3[0],top3[2]].filter(Boolean):[top3[0]];
              return <div style={{marginBottom:28,background:"linear-gradient(135deg,var(--dark),var(--dark2))",borderRadius:20,padding:"22px 16px",display:"flex",gap:10,justifyContent:"center",alignItems:"flex-end"}}>
                {order.map(r=>{const rk=rankingList.indexOf(r)+1;const isF=rk===1;return <div key={r.id} style={{textAlign:"center",flex:1,maxWidth:200,transform:isF?"scale(1.08)":"scale(1)"}}>
                  <div style={{fontSize:isF?28:20,marginBottom:8}}>{["🥇","🥈","🥉"][rk-1]}</div>
                  <ScoreBadge value={parseFloat(getAvg(r.ratings))} size={isF?58:46}/>
                  <p style={{fontFamily:"'Playfair Display',serif",color:"var(--cream)",fontSize:isF?14:12,marginTop:10,fontWeight:700}}>{r.name}</p>
                  {r.price_range&&<div style={{marginTop:4}}><PriceBadge priceKey={r.price_range}/></div>}
                </div>;})}
              </div>;
            })()}
            {rankingList.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:"var(--muted)",marginBottom:24}}><div style={{fontSize:52,marginBottom:12}}>⭐</div><h2 style={{fontFamily:"'Playfair Display',serif",color:"var(--dark)",marginBottom:6}}>Sin valoraciones aún</h2><p>Ve a <strong>Valorar</strong> para puntuar los restaurantes visitados</p></div>}
            <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center"}}>
              <input placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,padding:"9px 13px",borderRadius:10,border:"1.5px solid var(--warm)",background:"#fff",fontSize:13,color:"var(--dark)",outline:"none"}}/>
              <div style={{position:"relative"}}>
                <button onClick={()=>setShowFilters(f=>!f)} style={{padding:"9px 16px",borderRadius:10,border:"1.5px solid var(--warm)",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text)",fontWeight:500}}>
                  <span>⚙️</span><span>Filtrar</span>
                  {sortBy!=="avg"&&<span style={{width:7,height:7,borderRadius:"50%",background:"var(--gold)",display:"inline-block"}}/>}
                </button>
                {showFilters&&<div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:"#fff",borderRadius:14,border:"1px solid var(--warm)",boxShadow:"0 8px 24px rgba(26,18,8,.12)",zIndex:200,padding:12,minWidth:200}}>
                  <p style={{fontSize:11,color:"var(--muted)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Ordenar por</p>
                  {[{key:"avg",label:"Nota global",icon:"★"},...CRITERIA].map(c=>(
                    <button key={c.key} onClick={()=>{setSortBy(c.key);setShowFilters(false);}}
                      style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 10px",borderRadius:8,border:"none",background:sortBy===c.key?"linear-gradient(135deg,var(--gold),var(--gold-light))":"transparent",color:sortBy===c.key?"var(--dark)":"var(--text)",cursor:"pointer",fontSize:13,fontWeight:sortBy===c.key?700:400,marginBottom:2,textAlign:"left"}}>
                      <span>{c.icon}</span><span>{c.label}</span>{sortBy===c.key&&<span style={{marginLeft:"auto"}}>✓</span>}
                    </button>
                  ))}
                  <div style={{height:1,background:"var(--warm)",margin:"8px 0"}}/>
                  <button onClick={()=>setShowTypeFilter(t=>!t)}
                    style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 10px",borderRadius:8,border:"none",background:filterType?"linear-gradient(135deg,var(--gold),var(--gold-light))":"transparent",color:filterType?"var(--dark)":"var(--text)",cursor:"pointer",fontSize:13,fontWeight:filterType?700:400,textAlign:"left"}}>
                    <span>🍽️</span><span>Tipos</span>
                    {filterType&&<span style={{fontSize:11,marginLeft:4}}>({filterType})</span>}
                    <span style={{marginLeft:"auto"}}>{showTypeFilter?"▲":"▼"}</span>
                  </button>
                  {showTypeFilter&&<div style={{marginTop:4,paddingLeft:8}}>
                    <button onClick={()=>{setFilterType(null);setShowTypeFilter(false);}}
                      style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 10px",borderRadius:8,border:"none",background:!filterType?"#f0e8d0":"transparent",color:"var(--text)",cursor:"pointer",fontSize:12,marginBottom:2,textAlign:"left",fontWeight:!filterType?700:400}}>
                      Todos{!filterType&&<span style={{marginLeft:"auto"}}>✓</span>}
                    </button>
                    {FOOD_TYPES.map(ft=>(
                      <button key={ft} onClick={()=>{setFilterType(ft);setShowTypeFilter(false);setShowFilters(false);}}
                        style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 10px",borderRadius:8,border:"none",background:filterType===ft?"linear-gradient(135deg,var(--gold),var(--gold-light))":"transparent",color:filterType===ft?"var(--dark)":"var(--text)",cursor:"pointer",fontSize:12,marginBottom:2,textAlign:"left",fontWeight:filterType===ft?700:400}}>
                        {ft}{filterType===ft&&<span style={{marginLeft:"auto"}}>✓</span>}
                      </button>
                    ))}
                  </div>}
                </div>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>{rankingList.map((r,i)=><RankCard key={r.id} r={r} rank={i+1} onRate={setTarget}/>)}</div>
            {rankingList.length>0&&<p style={{textAlign:"center",color:"var(--muted)",fontSize:12,marginTop:16}}>Top {rankingList.length} restaurantes puntuados</p>}
          </div>}

          {/* LISTA COMPLETA */}
          {tab==="lista"&&<div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"var(--dark)",marginBottom:6}}>Todos los restaurantes</h2>
            <p style={{color:"var(--muted)",fontSize:14,marginBottom:16}}>{rests.length} restaurantes en la guía</p>
            <input placeholder="🔍 Buscar..." value={listSearch} onChange={e=>setListSearch(e.target.value)}
              style={{width:"100%",padding:"11px 16px",borderRadius:12,border:"1.5px solid var(--warm)",background:"#fff",fontSize:14,color:"var(--dark)",outline:"none",marginBottom:16}}/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {fullList.map(r=>{
                const avg=getAvg(r.ratings);
                const isVisited=r.visited;
                return (
                  <div key={r.id} className="card-h" style={{background:"#fff",borderRadius:12,padding:"14px 18px",border:`1.5px solid ${isVisited?"var(--gold)":"var(--warm)"}`,display:"flex",alignItems:"center",gap:12,borderLeft:`4px solid ${isVisited?"var(--gold)":"var(--warm)"}`}}>
                    <div style={{flex:1}}>
                      <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"var(--dark)",marginBottom:3}}>{r.name}</p>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
                        <span style={{fontSize:11,color:isVisited?"var(--red)":"var(--muted)"}}>{isVisited?"✅ Visitado":"⏳ Pendiente"}</span>
                        {r.food_type&&<span style={{fontSize:10,background:"#1a120812",color:"var(--text)",padding:"1px 7px",borderRadius:20,fontWeight:600}}>{r.food_type}</span>}
                        {r.price_range&&<PriceBadge priceKey={r.price_range}/>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {avg&&<ScoreBadge value={parseFloat(avg)} size={38}/>}
                      <button onClick={()=>window.open(googleUrl(r.name),"_blank")} className="btn-g"
                        style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                        🔍 Google
                      </button>
                      <button onClick={()=>setCommentTarget(r)}
                        style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,border:`1.5px solid ${r.comment?"var(--gold)":"var(--warm)"}`,background:r.comment?"#c9a84c22":"#fff",color:r.comment?"var(--gold)":"var(--muted)",cursor:"pointer",whiteSpace:"nowrap"}}>
                        {r.comment?"💬 Ver":"💬 Nota"}
                      </button>
                    </div>
                  </div>
                  {r.comment&&<p style={{fontSize:12,color:"var(--muted)",marginTop:4,fontStyle:"italic",paddingLeft:2}}>"{r.comment}"</p>}
                );
              })}
            </div>
          </div>}

          {/* VALORAR */}
          {tab==="valorar"&&<div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"var(--dark)",marginBottom:6}}>Valorar restaurantes</h2>
            <p style={{color:"var(--muted)",fontSize:14,marginBottom:24}}>Solo aparecen los restaurantes que ya habéis visitado.</p>
            {valorarList.unrated.length>0&&<>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><div style={{height:1,flex:1,background:"var(--warm)"}}/><span style={{fontSize:12,color:"var(--red)",fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Pendientes de valorar ({valorarList.unrated.length})</span><div style={{height:1,flex:1,background:"var(--warm)"}}/></div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28}}>
                {valorarList.unrated.map(r=><div key={r.id} className="card-h" style={{background:"#fff",borderRadius:12,padding:"14px 18px",border:"1.5px solid #e8b4b4",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,borderLeft:"4px solid var(--red)"}}>
                  <div><p style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"var(--dark)",marginBottom:2}}>{r.name}</p><p style={{fontSize:12,color:"var(--red)"}}>Sin valorar</p></div>
                  <button onClick={()=>setTarget(r)} className="btn-red" style={{padding:"8px 18px",borderRadius:10,fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>⭐ Valorar</button>
                </div>)}
              </div>
            </>}
            {valorarList.rated.length>0&&<>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><div style={{height:1,flex:1,background:"var(--warm)"}}/><span style={{fontSize:12,color:"var(--muted)",fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Ya valorados ({valorarList.rated.length})</span><div style={{height:1,flex:1,background:"var(--warm)"}}/></div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {valorarList.rated.map(r=>{const a=getAvg(r.ratings);return <div key={r.id} className="card-h" style={{background:"#fff",borderRadius:12,padding:"14px 18px",border:"1px solid var(--warm)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1}}><p style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"var(--dark)",marginBottom:4}}>{r.name}</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>{r.price_range&&<PriceBadge priceKey={r.price_range}/>}{CRITERIA.map(c=><span key={c.key} style={{fontSize:10,color:"var(--muted)",background:"var(--cream)",padding:"1px 6px",borderRadius:6}}>{c.icon}<strong style={{color:"var(--text)"}}>{r.ratings[c.key]}</strong></span>)}</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}><ScoreBadge value={parseFloat(a)} size={44}/><button onClick={()=>setTarget(r)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"var(--muted)"}}>✏️</button></div>
                </div>;})}
              </div>
            </>}
            {valorarList.unrated.length===0&&valorarList.rated.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:"var(--muted)"}}><p>No hay restaurantes visitados. Márcalos desde <strong>Pendientes</strong>.</p></div>}
          </div>}

          {/* PENDIENTES */}
          {tab==="pendientes"&&<div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"var(--dark)",marginBottom:6}}>Por descubrir</h2>
            <p style={{color:"var(--muted)",fontSize:14,marginBottom:16}}>{pendList.length} restaurantes que aún no habéis visitado.</p>
            <input placeholder="🔍 Buscar restaurante pendiente..." value={pendSearch} onChange={e=>setPendSearch(e.target.value)}
              style={{width:"100%",padding:"11px 16px",borderRadius:12,border:"1.5px solid var(--warm)",background:"#fff",fontSize:14,color:"var(--dark)",outline:"none",marginBottom:16}}/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {pendList.filter(r=>r.name.toLowerCase().includes(pendSearch.toLowerCase())).map(r=>(
                <div key={r.id} className="card-h" style={{background:"#fff",borderRadius:12,padding:"14px 18px",border:"1px solid var(--warm)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"var(--dark)",flex:1}}>{r.name}</p>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <button onClick={()=>window.open(googleUrl(r.name),"_blank")} className="btn-g"
                      style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,border:"none",cursor:"pointer"}}>
                      🔍 Google
                    </button>
                    <button onClick={()=>{markVisited(r.id);setPendSearch("");}} className="btn-o"
                      style={{padding:"7px 14px",borderRadius:10,fontSize:13,whiteSpace:"nowrap"}}>✅ Ya fui</button>
                    
                    {/* 🗑️ NUEVO BOTÓN DE BORRADO */}
                    <button onClick={() => deleteRestaurant(r.id)} 
                      style={{
                        padding: "7px 10px", 
                        borderRadius: 10, 
                        fontSize: 13, 
                        background: "none", 
                        border: "1px solid var(--red)", 
                        color: "var(--red)", 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {pendList.filter(r=>r.name.toLowerCase().includes(pendSearch.toLowerCase())).length===0&&<p style={{textAlign:"center",color:"var(--muted)",padding:"32px 0"}}>Sin resultados para "{pendSearch}"</p>}
            </div>
          </div>}

          {/* STATS */}
          {tab==="stats"&&<div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"var(--dark)",marginBottom:24}}>Vuestras estadísticas</h2>
            <StatsTab rests={rests}/>
          </div>}

          </>}
        </div>
      </div>

      {commentTarget&&<CommentModal restaurant={commentTarget} onSave={(text)=>saveComment(commentTarget.id,text)} onClose={()=>setCommentTarget(null)}/> }
      {commentTarget&&<CommentModal restaurant={commentTarget} onSave={(text)=>saveComment(commentTarget.id,text)} onClose={()=>setCommentTarget(null)}/>}
      {target&&<RatingModal restaurant={target} onSave={(r,p,f)=>saveRating(target.id,r,p,f)} onClose={()=>setTarget(null)}/>}
      {showAdd&&<AddModal onSave={addRestaurant} onClose={()=>setShowAdd(false)}/>}
    </>
  );
}
