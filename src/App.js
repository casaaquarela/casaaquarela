import { useState, useEffect, useCallback } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#F4F6FA", white: "#FFFFFF", surface: "#FFFFFF",
  surfaceAlt: "#F0F2F7", border: "#E2E6EF",
  accent: "#1B6CA8", accentLight: "#EBF3FB", accentHover: "#155A8E",
  sala1: "#D97706", sala1Light: "#FEF3C7",
  sala2: "#059669", sala2Light: "#D1FAE5",
  text: "#1A1F2E", textMid: "#4B5563", muted: "#9CA3AF",
  danger: "#DC2626", dangerLight: "#FEE2E2",
  success: "#059669", successLight: "#D1FAE5",
  warning: "#D97706", warningLight: "#FEF3C7",
  fixo: "#6366F1", fixoLight: "#EEF2FF",
};

const SALA_INFO = {
  sala1: { label: "Sala 1", bg: "#FEF3C7", text: "#D97706" },
  sala2: { label: "Sala 2", bg: "#D1FAE5", text: "#059669" },
};

const DIAS_SEMANA = ["dom","seg","ter","qua","qui","sex","sab"];
const DIAS_LABEL  = { dom:"Dom",seg:"Seg",ter:"Ter",qua:"Qua",qui:"Qui",sex:"Sex",sab:"Sáb" };
const MONTH_FULL  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTH_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ── Defaults de configuração ──────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  valorHoraAvulsa: 35,
  valorMensal: 800,
  periodos: {
    manha: { label: "Manhã",  inicio: "09:00", fim: "13:00", valor: 100 },
    tarde:  { label: "Tarde",  inicio: "13:00", fim: "17:00", valor: 100 },
    noite:  { label: "Noite",  inicio: "17:00", fim: "21:00", valor: 120 },
  },
  nomeClinica: "Casa Aquarela",
};

// ── Dados iniciais ────────────────────────────────────────────────────────────
const INITIAL_USERS = [
  { id:"g1", login:"gestor1",  senha:"gestor123", role:"manager",      name:"Gestor 1",           specialty:"" },
  { id:"g2", login:"gestor2",  senha:"admin456",  role:"manager",      name:"Gestor 2",           specialty:"" },
  { id:"p1", login:"ana",      senha:"ana123",    role:"professional", name:"Dra. Ana Lima",      specialty:"Psicologia Clínica",  color:"#1B6CA8" },
  { id:"p2", login:"carlos",   senha:"carlos123", role:"professional", name:"Dr. Carlos Mendes",  specialty:"Neuropsicologia",      color:"#7C3AED" },
  { id:"p3", login:"beatriz",  senha:"bia123",    role:"professional", name:"Dra. Beatriz Souza", specialty:"Psicologia Infantil",  color:"#0891B2" },
];

// ── Utils ─────────────────────────────────────────────────────────────────────
const uid    = () => Math.random().toString(36).slice(2,10);
const today  = () => new Date().toISOString().slice(0,10);
const fmt    = d => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR") : "—";
const fmtR   = v => Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const diaSem = d => DIAS_SEMANA[new Date(d+"T12:00:00").getDay()];

const calcHoras = (ini, fim) => {
  const [h1,m1]=ini.split(":").map(Number), [h2,m2]=fim.split(":").map(Number);
  const diff=(h2*60+m2)-(h1*60+m1); return diff>0?diff/60:0;
};

const horaParaMin = h => { const [hh,mm]=h.split(":").map(Number); return hh*60+mm; };

const conflito = (reservas, nova, excludeId) =>
  reservas.some(r =>
    r.id!==excludeId && r.date===nova.date && r.sala===nova.sala &&
    horaParaMin(r.horaInicio)<horaParaMin(nova.horaFim) &&
    horaParaMin(r.horaFim)>horaParaMin(nova.horaInicio)
  );

const save = async (k,v) => { try { await window.storage.set(k,JSON.stringify(v)); } catch {} };
const load = async (k,fb) => { try { const r=await window.storage.get(k); return r?JSON.parse(r.value):fb; } catch { return fb; } };

// ── Componentes base ──────────────────────────────────────────────────────────
const Card = ({children,style={}}) => (
  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:20,...style}}>{children}</div>
);

const Badge = ({label,bg,color}) => (
  <span style={{background:bg,color,border:`1px solid ${color}44`,borderRadius:6,padding:"2px 9px",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{label}</span>
);

const Btn = ({children,onClick,variant="primary",small,style={},disabled,full}) => {
  const v = {
    primary:   {background:C.accent,     color:"#fff",      border:`1px solid ${C.accent}`},
    secondary: {background:C.white,      color:C.text,      border:`1px solid ${C.border}`},
    danger:    {background:C.dangerLight,color:C.danger,    border:`1px solid ${C.danger}44`},
    ghost:     {background:"transparent",color:C.muted,     border:"none"},
    success:   {background:C.successLight,color:C.success,  border:`1px solid ${C.success}44`},
    warning:   {background:C.warningLight,color:C.warning,  border:`1px solid ${C.warning}44`},
  };
  return (
    <button onClick={disabled?undefined:onClick} style={{
      ...v[variant],borderRadius:8,cursor:disabled?"not-allowed":"pointer",
      fontWeight:600,fontSize:small?12:14,padding:small?"5px 11px":"9px 18px",
      fontFamily:"inherit",opacity:disabled?0.5:1,width:full?"100%":undefined,...style
    }}>{children}</button>
  );
};

const Field = ({label,value,onChange,type="text",options,placeholder,style={},helper}) => (
  <div style={{marginBottom:14}}>
    {label && <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>{label}</label>}
    {options
      ? <select value={value} onChange={e=>onChange(e.target.value)}
          style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 11px",fontSize:14,fontFamily:"inherit",...style}}>
          {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
        </select>
      : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 11px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",...style}}/>
    }
    {helper && <div style={{fontSize:11,color:C.muted,marginTop:4}}>{helper}</div>}
  </div>
);

const Modal = ({title,onClose,children,wide}) => (
  <div onClick={e=>e.target===e.currentTarget&&onClose()}
    style={{position:"fixed",inset:0,background:"#00000060",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28,width:"100%",maxWidth:wide?680:500,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px #0003"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <h3 style={{margin:0,color:C.text,fontSize:18,fontWeight:700}}>{title}</h3>
        <Btn variant="ghost" small onClick={onClose}>✕</Btn>
      </div>
      {children}
    </div>
  </div>
);

const Stat = ({label,value,color=C.accent,sub}) => (
  <Card style={{padding:"18px 20px"}}>
    <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{label}</div>
    <div style={{fontSize:26,fontWeight:800,color,marginBottom:sub?3:0}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:C.muted}}>{sub}</div>}
  </Card>
);

const SalaTag = ({salaId}) => {
  const s=SALA_INFO[salaId]; if(!s) return null;
  return <Badge label={s.label} bg={s.bg} color={s.text}/>;
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({users,onLogin}) {
  const [login,setLogin]=useState("");
  const [senha,setSenha]=useState("");
  const [erro,setErro]=useState("");
  const [showSenha,setShowSenha]=useState(false);

  const tentar = () => {
    const u = users.find(u=>u.login.toLowerCase()===login.toLowerCase()&&u.senha===senha);
    if(u) onLogin(u);
    else { setErro("Login ou senha incorretos."); setSenha(""); }
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,-apple-system,sans-serif",padding:20}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,background:C.accent,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 14px"}}>🏥</div>
          <h1 style={{color:C.text,margin:"0 0 4px",fontSize:24,fontWeight:800}}>Casa Aquarela</h1>
          <p style={{color:C.muted,margin:0,fontSize:14}}>Agenda & Salas</p>
        </div>
        <Card>
          <Field label="Login" value={login} onChange={setLogin} placeholder="seu.login" />
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>Senha</label>
            <div style={{position:"relative"}}>
              <input type={showSenha?"text":"password"} value={senha} onChange={e=>setSenha(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&tentar()}
                placeholder="••••••••"
                style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 40px 8px 11px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box"}}/>
              <button onClick={()=>setShowSenha(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14}}>
                {showSenha?"🙈":"👁️"}
              </button>
            </div>
          </div>
          {erro && <div style={{background:C.dangerLight,color:C.danger,border:`1px solid ${C.danger}33`,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:14}}>{erro}</div>}
          <Btn full onClick={tentar} style={{padding:"11px 18px",fontSize:15}}>Entrar</Btn>
        </Card>
        <p style={{textAlign:"center",color:C.muted,fontSize:12,marginTop:16}}>Acesse com o login fornecido pela gestão.</p>
      </div>
    </div>
  );
}

// ── RESERVA: modal para profissional ─────────────────────────────────────────
function ModalReserva({onClose,onSave,reservas,config,userId,excludeId,initial}) {
  const periodos = config.periodos;
  const [sala,setSala]   = useState(initial?.sala||"sala1");
  const [data,setData]   = useState(initial?.date||today());
  const [modo,setModo]   = useState(initial?.modo||"avulsa"); // avulsa | periodo | mensal
  const [periodo,setPeriodo] = useState(initial?.periodo||"manha");
  const [hIni,setHIni]   = useState(initial?.horaInicio||"09:00");
  const [hFim,setHFim]   = useState(initial?.horaFim||"10:00");
  const [mesMensal,setMesMensal] = useState(initial?.mesMensal||today().slice(0,7));
  const [notes,setNotes] = useState(initial?.notes||"");
  const [erro,setErro]   = useState("");

  const horaOptions = Array.from({length:33},(_,i)=>{
    const tot=7*60+i*30, h=Math.floor(tot/60), m=tot%60;
    return h<24?{value:`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`,label:`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`}:null;
  }).filter(Boolean);

  // Calcula valor e horários conforme modo
  let horaInicio="", horaFim="", valor=0, resumo="";
  if(modo==="avulsa"){
    horaInicio=hIni; horaFim=hFim;
    const h=calcHoras(hIni,hFim);
    valor=+(h*config.valorHoraAvulsa).toFixed(2);
    resumo=`${h>0?h.toFixed(1):"?"}h × ${fmtR(config.valorHoraAvulsa)}/h = ${fmtR(valor)}`;
  } else if(modo==="periodo"){
    const p=periodos[periodo];
    horaInicio=p.inicio; horaFim=p.fim;
    valor=Number(p.valor||0);
    resumo=`${p.label}: ${p.inicio}–${p.fim} → valor fixo ${fmtR(valor)}`;
  } else {
    horaInicio="00:00"; horaFim="23:59";
    valor=config.valorMensal;
    resumo=`Mensalidade fixa: ${fmtR(valor)}`;
  }

  const salvar = () => {
    setErro("");
    if(!data||!sala) return setErro("Preencha todos os campos.");
    if(modo==="avulsa"&&horaParaMin(hFim)<=horaParaMin(hIni)) return setErro("Horário de fim deve ser após o início.");
    if(modo!=="mensal"){
      const nova={date:data,sala,horaInicio,horaFim};
      if(conflito(reservas,nova,excludeId)) return setErro("Já existe uma reserva nessa sala nesse horário.");
    }
    onSave({id:excludeId||uid(),date:data,sala,horaInicio,horaFim,modo,periodo:modo==="periodo"?periodo:undefined,mesMensal:modo==="mensal"?mesMensal:undefined,valor,userId,notes,pago:false});
    onClose();
  };

  const modoBtn=(m,label,sub)=>(
    <button onClick={()=>setModo(m)} style={{flex:1,padding:"10px 8px",border:`2px solid ${modo===m?C.accent:C.border}`,borderRadius:10,background:modo===m?C.accentLight:C.white,cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}}>
      <div style={{fontWeight:700,fontSize:13,color:modo===m?C.accent:C.text}}>{label}</div>
      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>
    </button>
  );

  return (
    <Modal title="Reservar Sala" onClose={onClose}>
      {/* Sala */}
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Sala</label>
        <div style={{display:"flex",gap:10}}>
          {["sala1","sala2"].map(s=>(
            <button key={s} onClick={()=>setSala(s)} style={{flex:1,padding:"10px",border:`2px solid ${sala===s?SALA_INFO[s].text:C.border}`,borderRadius:10,background:sala===s?SALA_INFO[s].bg:C.white,cursor:"pointer",fontFamily:"inherit",fontWeight:700,color:sala===s?SALA_INFO[s].text:C.textMid,fontSize:14}}>
              {SALA_INFO[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Modalidade */}
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Modalidade</label>
        <div style={{display:"flex",gap:8}}>
          {modoBtn("avulsa","Hora Avulsa",fmtR(config.valorHoraAvulsa)+"/h")}
          {modoBtn("periodo","Período",fmtR(config.valorHoraPeriodo)+"/h · mín 4h")}
          {modoBtn("mensal","Mensal",fmtR(config.valorMensal)+"/mês")}
        </div>
      </div>

      {/* Data */}
      {modo!=="mensal" && <Field label="Data" type="date" value={data} onChange={setData}/>}

      {/* Campos por modo */}
      {modo==="avulsa" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Início" value={hIni} onChange={setHIni} options={horaOptions}/>
          <Field label="Fim"    value={hFim} onChange={setHFim} options={horaOptions}/>
        </div>
      )}
      {modo==="periodo" && (
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Período</label>
          <div style={{display:"flex",gap:8}}>
            {Object.entries(periodos).map(([k,p])=>(
              <button key={k} onClick={()=>setPeriodo(k)} style={{flex:1,padding:"10px 8px",border:`2px solid ${periodo===k?C.accent:C.border}`,borderRadius:10,background:periodo===k?C.accentLight:C.white,cursor:"pointer",fontFamily:"inherit"}}>
                <div style={{fontWeight:700,fontSize:13,color:periodo===k?C.accent:C.text}}>{p.label}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{p.inicio}–{p.fim}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {modo==="mensal" && (
        <Field label="Mês de referência" type="month" value={mesMensal} onChange={setMesMensal}/>
      )}

      {/* Resumo de valor */}
      <div style={{background:C.accentLight,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13,color:C.textMid}}>
        <strong style={{color:C.accent}}>Valor: </strong>{resumo}
      </div>

      <Field label="Observações" value={notes} onChange={setNotes} placeholder="Opcional..."/>
      {erro && <div style={{background:C.dangerLight,color:C.danger,border:`1px solid ${C.danger}33`,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:12}}>{erro}</div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={salvar}>Confirmar Reserva</Btn>
      </div>
    </Modal>
  );
}

// ── GRADE SEMANAL ─────────────────────────────────────────────────────────────
function GradeSemanal({reservas,users,semanaBase,onSlotClick}) {
  const horas=Array.from({length:17},(_,i)=>i+7);
  const dias=Array.from({length:7},(_,i)=>{const d=new Date(semanaBase);d.setDate(d.getDate()+i);return d.toISOString().slice(0,10);});
  const getR=(dia,hora,sala)=>reservas.filter(r=>r.date===dia&&r.sala===sala&&horaParaMin(r.horaInicio)<=hora*60&&horaParaMin(r.horaFim)>hora*60);
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,tableLayout:"fixed"}}>
        <thead>
          <tr>
            <th style={{width:44,borderBottom:`2px solid ${C.border}`}}></th>
            {dias.map(d=>{
              const isT=d===today();
              return <th key={d} colSpan={2} style={{padding:"6px 4px",textAlign:"center",borderBottom:`2px solid ${C.border}`,color:isT?C.accent:C.textMid,fontWeight:isT?800:600}}>
                <div>{DIAS_LABEL[diaSem(d)]}</div>
                <div style={{fontSize:11,color:C.muted}}>{d.slice(8)}/{d.slice(5,7)}</div>
              </th>;
            })}
          </tr>
          <tr>
            <th></th>
            {dias.map(d=>["sala1","sala2"].map(s=>(
              <th key={d+s} style={{padding:"3px 2px",textAlign:"center",fontSize:11,fontWeight:700,color:SALA_INFO[s].text,background:SALA_INFO[s].bg,borderBottom:`1px solid ${C.border}`}}>
                {s==="sala1"?"S1":"S2"}
              </th>
            )))}
          </tr>
        </thead>
        <tbody>
          {horas.map(h=>(
            <tr key={h}>
              <td style={{padding:"2px 6px",color:C.muted,fontSize:11,textAlign:"right",verticalAlign:"top",paddingTop:5}}>{h}:00</td>
              {dias.map(d=>["sala1","sala2"].map(sala=>{
                const rs=getR(d,h,sala); const r=rs[0];
                const u=r?users.find(u=>u.id===r.userId):null;
                const isFirst=r&&horaParaMin(r.horaInicio)===h*60;
                return (
                  <td key={d+sala+h} onClick={!r?()=>onSlotClick(d,h,sala):undefined}
                    style={{border:`1px solid ${C.border}`,padding:2,verticalAlign:"top",height:28,
                      background:r?(sala==="sala1"?C.sala1Light:C.sala2Light):"#FAFBFD",
                      cursor:r?"default":"pointer"}}>
                    {isFirst&&(
                      <div style={{background:sala==="sala1"?C.sala1:C.sala2,color:"#fff",borderRadius:4,padding:"2px 4px",fontSize:10,fontWeight:600,lineHeight:1.3,overflow:"hidden",whiteSpace:"nowrap"}}>
                        {u?.name?.split(" ").slice(0,2).join(" ")||"—"}
                      </div>
                    )}
                  </td>
                );
              }))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── VIEW: Agenda ──────────────────────────────────────────────────────────────
function AgendaView({reservas,setReservas,users,config,currentUser,isManager}) {
  const [semOff,setSemOff]=useState(0);
  const [modalAberto,setModalAberto]=useState(false);
  const [editando,setEditando]=useState(null);
  const [slotPre,setSlotPre]=useState(null);
  const [viewMode,setViewMode]=useState("semana");
  const [filtroPro,setFiltroPro]=useState("");
  const [filtroDt,setFiltroDt]=useState("");

  const semanaBase=(()=>{
    const d=new Date();d.setDate(d.getDate()-d.getDay()+1+semOff*7);return d.toISOString().slice(0,10);
  })();

  const profissionais=users.filter(u=>u.role==="professional");

  const abrirNovo=(date,hora,sala)=>{
    const hi=hora!=null?String(hora).padStart(2,"0")+":00":"09:00";
    const hf=hora!=null?String(hora+1).padStart(2,"0")+":00":"10:00";
    setSlotPre({date:date||today(),horaInicio:hi,horaFim:hf,sala:sala||"sala1"});
    setEditando(null); setModalAberto(true);
  };
  const abrirEditar=(r)=>{setEditando(r);setSlotPre(null);setModalAberto(true);};

  const salvarReserva=(dados)=>{
    if(editando) setReservas(prev=>prev.map(r=>r.id===editando.id?dados:r));
    else setReservas(prev=>[...prev,{...dados,userId:currentUser.id}]);
  };

  const remover=(id)=>{if(window.confirm("Remover esta reserva?")) // eslint-disable-line no-restricted-globalssetReservas(prev=>prev.filter(r=>r.id!==id));};
  const togglePago=(id)=>setReservas(prev=>prev.map(r=>r.id===id?{...r,pago:!r.pago}:r));

  const lista=reservas.filter(r=>{
    if(!isManager&&r.userId!==currentUser.id) return false;
    if(filtroPro&&r.userId!==filtroPro) return false;
    if(filtroDt&&r.date!==filtroDt) return false;
    return true;
  }).sort((a,b)=>(a.date+a.horaInicio).localeCompare(b.date+b.horaInicio));

  const modoLabel={avulsa:"Hora Avulsa",periodo:"Período",mensal:"Mensal"};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <h2 style={{margin:0,color:C.text,fontSize:22,fontWeight:800}}>Agenda de Salas</h2>
        <div style={{display:"flex",gap:8}}>
          <Btn variant={viewMode==="semana"?"primary":"secondary"} small onClick={()=>setViewMode("semana")}>Grade</Btn>
          <Btn variant={viewMode==="lista"?"primary":"secondary"} small onClick={()=>setViewMode("lista")}>Lista</Btn>
          <Btn onClick={()=>abrirNovo()}>+ Reservar Sala</Btn>
        </div>
      </div>

      {viewMode==="semana"&&(
        <Card style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <Btn variant="secondary" small onClick={()=>setSemOff(o=>o-1)}>← Anterior</Btn>
            <span style={{fontWeight:700,color:C.text,fontSize:14}}>Semana de {fmt(semanaBase)}</span>
            <div style={{display:"flex",gap:8}}>
              <Btn variant="secondary" small onClick={()=>setSemOff(0)}>Hoje</Btn>
              <Btn variant="secondary" small onClick={()=>setSemOff(o=>o+1)}>Próxima →</Btn>
            </div>
          </div>
          <GradeSemanal reservas={reservas} users={users} semanaBase={semanaBase} onSlotClick={(d,h,s)=>abrirNovo(d,h,s)}/>
          <div style={{display:"flex",gap:16,marginTop:12}}>
            <div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:12,height:12,borderRadius:3,background:C.sala1}}/><span style={{fontSize:12,color:C.textMid}}>Sala 1</span></div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:12,height:12,borderRadius:3,background:C.sala2}}/><span style={{fontSize:12,color:C.textMid}}>Sala 2</span></div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:12,height:12,borderRadius:3,background:C.surfaceAlt,border:`1px solid ${C.border}`}}/><span style={{fontSize:12,color:C.muted}}>Disponível — clique para reservar</span></div>
          </div>
        </Card>
      )}

      {viewMode==="lista"&&(
        <Card style={{marginBottom:20}}>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            {isManager&&(
              <div style={{width:220}}>
                <Field label="Profissional" value={filtroPro} onChange={setFiltroPro}
                  options={[{value:"",label:"Todos"},...profissionais.map(p=>({value:p.id,label:p.name}))]}/>
              </div>
            )}
            <div style={{width:160}}><Field label="Data" type="date" value={filtroDt} onChange={setFiltroDt}/></div>
            {filtroDt&&<div style={{display:"flex",alignItems:"flex-end",paddingBottom:14}}><Btn variant="ghost" small onClick={()=>setFiltroDt("")}>Limpar data</Btn></div>}
          </div>
          {lista.length===0&&<p style={{color:C.muted,margin:0}}>Nenhuma reserva encontrada.</p>}
          {lista.map(r=>{
            const u=users.find(u=>u.id===r.userId);
            const isOwn=r.userId===currentUser.id;
            return (
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{width:4,height:44,borderRadius:2,background:u?.color||C.accent,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u?.name}</div>
                  <div style={{fontSize:12,color:C.textMid}}>{fmt(r.date)} · {r.horaInicio}–{r.horaFim}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <SalaTag salaId={r.sala}/>
                  <Badge label={modoLabel[r.modo]||r.modo} bg={C.accentLight} color={C.accent}/>
                  <Badge label={r.pago?"Pago":"Pendente"} bg={r.pago?C.successLight:C.warningLight} color={r.pago?C.success:C.warning}/>
                  <span style={{fontSize:14,fontWeight:700,color:C.text}}>{fmtR(r.valor)}</span>
                  {isManager&&<Btn variant="success" small onClick={()=>togglePago(r.id)}>{r.pago?"✓ Pago":"Marcar Pago"}</Btn>}
                  {(isManager||isOwn)&&<Btn variant="secondary" small onClick={()=>abrirEditar(r)}>Editar</Btn>}
                  {(isManager||isOwn)&&<Btn variant="danger" small onClick={()=>remover(r.id)}>✕</Btn>}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {modalAberto&&(
        <ModalReserva
          onClose={()=>setModalAberto(false)}
          onSave={salvarReserva}
          reservas={reservas}
          config={config}
          userId={currentUser.id}
          excludeId={editando?.id}
          initial={editando||slotPre}
        />
      )}
    </div>
  );
}

// ── VIEW: Minhas Pendências (profissional) ────────────────────────────────────
function PendenciasView({reservas,currentUser}) {
  const minhas=reservas.filter(r=>r.userId===currentUser.id).sort((a,b)=>b.date.localeCompare(a.date));
  const pendente=minhas.filter(r=>!r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const pago=minhas.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const modoLabel={avulsa:"Hora Avulsa",periodo:"Período",mensal:"Mensal"};
  return (
    <div>
      <h2 style={{margin:"0 0 24px",color:C.text,fontSize:22,fontWeight:800}}>Minhas Pendências</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:24}}>
        <Stat label="A pagar" value={fmtR(pendente)} color={C.warning} sub={`${minhas.filter(r=>!r.pago).length} reservas`}/>
        <Stat label="Já pago" value={fmtR(pago)} color={C.success} sub={`${minhas.filter(r=>r.pago).length} reservas`}/>
        <Stat label="Total gerado" value={fmtR(pendente+pago)} color={C.text} sub="histórico completo"/>
      </div>
      <Card>
        {minhas.length===0&&<p style={{color:C.muted,margin:0}}>Você ainda não tem reservas.</p>}
        {minhas.map(r=>(
          <div key={r.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{fmt(r.date)} · {r.horaInicio}–{r.horaFim}</div>
              <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                <SalaTag salaId={r.sala}/>
                <Badge label={modoLabel[r.modo]||r.modo} bg={C.accentLight} color={C.accent}/>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:15,fontWeight:800,color:C.text}}>{fmtR(r.valor)}</div>
              <Badge label={r.pago?"✓ Pago":"Pendente"} bg={r.pago?C.successLight:C.warningLight} color={r.pago?C.success:C.warning}/>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── VIEW: Dashboard (gestor) ──────────────────────────────────────────────────
function DashboardView({reservas,users,config}) {
  const mes=today().slice(0,7);
  const mesRes=reservas.filter(r=>r.date?.slice(0,7)===mes||(r.modo==="mensal"&&r.mesMensal===mes));
  const totalValor=mesRes.reduce((s,r)=>s+Number(r.valor||0),0);
  const totalPago=mesRes.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const hojRes=reservas.filter(r=>r.date===today()).sort((a,b)=>a.horaInicio.localeCompare(b.horaInicio));
  const profissionais=users.filter(u=>u.role==="professional");

  const byPro=profissionais.map(pro=>{
    const rs=mesRes.filter(r=>r.userId===pro.id);
    return{...pro,reservas:rs.length,horas:rs.filter(r=>r.modo!=="mensal").reduce((s,r)=>s+calcHoras(r.horaInicio,r.horaFim),0),valor:rs.reduce((s,r)=>s+Number(r.valor||0),0),pago:rs.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0)};
  }).filter(p=>p.reservas>0);

  return (
    <div>
      <h2 style={{margin:"0 0 24px",color:C.text,fontSize:22,fontWeight:800}}>Dashboard — {MONTH_FULL[new Date().getMonth()]}</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:16,marginBottom:28}}>
        <Stat label="Reservas no mês" value={mesRes.length}/>
        <Stat label="Faturamento" value={fmtR(totalValor)} color={C.text}/>
        <Stat label="Recebido" value={fmtR(totalPago)} color={C.success}/>
        <Stat label="A receber" value={fmtR(totalValor-totalPago)} color={C.warning}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        <Card>
          <h3 style={{margin:"0 0 14px",color:C.text,fontSize:15,fontWeight:700}}>Hoje — {fmt(today())}</h3>
          {hojRes.length===0?<p style={{color:C.muted,fontSize:14,margin:0}}>Nenhuma reserva hoje.</p>
          :hojRes.map(r=>{const u=users.find(u=>u.id===r.userId);return(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontSize:13,color:C.textMid,minWidth:90,fontWeight:600}}>{r.horaInicio}–{r.horaFim}</div>
              <div style={{flex:1,fontSize:13,color:C.text,fontWeight:600}}>{u?.name?.split(" ").slice(0,2).join(" ")}</div>
              <SalaTag salaId={r.sala}/>
            </div>
          );})}
        </Card>
        <Card>
          <h3 style={{margin:"0 0 14px",color:C.text,fontSize:15,fontWeight:700}}>Por profissional</h3>
          {byPro.length===0?<p style={{color:C.muted,fontSize:14,margin:0}}>Sem reservas este mês.</p>
          :byPro.map(pro=>(
            <div key={pro.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:pro.color||C.accent,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{pro.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{pro.reservas} reservas · {pro.horas.toFixed(1)}h</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{fmtR(pro.valor)}</div>
                {pro.valor-pro.pago>0&&<div style={{fontSize:11,color:C.warning}}>{fmtR(pro.valor-pro.pago)} pend.</div>}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── VIEW: Cobranças (gestor) ──────────────────────────────────────────────────
function CobrancasView({reservas,setReservas,users}) {
  const [mes,setMes]=useState(new Date().getMonth());
  const [ano,setAno]=useState(new Date().getFullYear());
  const [filtroPro,setFiltroPro]=useState("");
  const mesStr=`${ano}-${String(mes+1).padStart(2,"0")}`;
  const profissionais=users.filter(u=>u.role==="professional");
  const modoLabel={avulsa:"Hora Avulsa",periodo:"Período",mensal:"Mensal"};

  const lista=reservas.filter(r=>{
    const noMes=(r.date?.slice(0,7)===mesStr)||(r.modo==="mensal"&&r.mesMensal===mesStr);
    if(!noMes) return false;
    if(filtroPro&&r.userId!==filtroPro) return false;
    return true;
  });

  const totalValor=lista.reduce((s,r)=>s+Number(r.valor||0),0);
  const totalPago=lista.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0);

  const togglePago=(id)=>setReservas(prev=>prev.map(r=>r.id===id?{...r,pago:!r.pago}:r));
  const quitarTudo=(userId)=>{
    const ids=lista.filter(r=>r.userId===userId&&!r.pago).map(r=>r.id);
    setReservas(prev=>prev.map(r=>ids.includes(r.id)?{...r,pago:true}:r));
  };

  const porPro=profissionais.map(pro=>{
    const rs=lista.filter(r=>r.userId===pro.id);
    if(!rs.length) return null;
    return{...pro,reservas:rs,total:rs.reduce((s,r)=>s+Number(r.valor||0),0),pago:rs.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0)};
  }).filter(Boolean);

  return (
    <div>
      <h2 style={{margin:"0 0 24px",color:C.text,fontSize:22,fontWeight:800}}>Cobranças</h2>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{width:140}}><Field label="Mês" value={mes} onChange={v=>setMes(Number(v))} options={MONTH_SHORT.map((n,i)=>({value:i,label:n}))}/></div>
        <div style={{width:90}}><Field label="Ano" value={ano} onChange={v=>setAno(Number(v))} options={[2024,2025,2026,2027].map(y=>({value:y,label:String(y)}))}/></div>
        <div style={{width:220}}><Field label="Profissional" value={filtroPro} onChange={setFiltroPro} options={[{value:"",label:"Todos"},...profissionais.map(p=>({value:p.id,label:p.name}))]}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:24}}>
        <Stat label="Total gerado" value={fmtR(totalValor)} color={C.text}/>
        <Stat label="Recebido" value={fmtR(totalPago)} color={C.success}/>
        <Stat label="Pendente" value={fmtR(totalValor-totalPago)} color={C.warning}/>
        <Stat label="Reservas" value={lista.length} sub={`${lista.filter(r=>r.pago).length} quitadas`}/>
      </div>
      {porPro.length===0&&<Card><p style={{color:C.muted,margin:0}}>Nenhuma reserva neste período.</p></Card>}
      {porPro.map(pro=>(
        <Card key={pro.id} style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:pro.color||C.accent}}/>
              <span style={{fontWeight:700,color:C.text,fontSize:15}}>{pro.name}</span>
              <span style={{fontSize:12,color:C.muted}}>{pro.specialty}</span>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:700,color:C.text}}>{fmtR(pro.total)}</span>
              {pro.total-pro.pago>0
                ?<><span style={{fontSize:13,color:C.warning,fontWeight:600}}>{fmtR(pro.total-pro.pago)} pendente</span>
                  <Btn variant="success" small onClick={()=>quitarTudo(pro.id)}>Quitar tudo</Btn></>
                :<span style={{fontSize:13,color:C.success,fontWeight:600}}>✓ Quitado</span>}
            </div>
          </div>
          {pro.reservas.map(r=>(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderTop:`1px solid ${C.border}`}}>
              <div style={{fontSize:13,color:C.textMid,minWidth:86}}>{fmt(r.date)}</div>
              <div style={{fontSize:13,color:C.textMid,minWidth:100}}>{r.horaInicio}–{r.horaFim}</div>
              <SalaTag salaId={r.sala}/>
              <Badge label={modoLabel[r.modo]||r.modo} bg={C.accentLight} color={C.accent}/>
              <span style={{flex:1}}/>
              <span style={{fontSize:14,fontWeight:600,color:C.text}}>{fmtR(r.valor)}</span>
              <button onClick={()=>togglePago(r.id)} style={{background:r.pago?C.successLight:C.warningLight,color:r.pago?C.success:C.warning,border:`1px solid ${r.pago?C.success:C.warning}44`,borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                {r.pago?"✓ Pago":"Pendente"}
              </button>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

// ── VIEW: Profissionais (gestor) ──────────────────────────────────────────────
function ProfissionaisView({users,setUsers}) {
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [form,setForm]=useState({name:"",specialty:"",color:"#1B6CA8",login:"",senha:"",role:"professional"});
  const [erro,setErro]=useState("");
  const [mostrarSenha,setMostrarSenha]=useState({});

  const profissionais=users.filter(u=>u.role==="professional");

  const abrirNovo=()=>{setEditando(null);setForm({name:"",specialty:"",color:"#1B6CA8",login:"",senha:"",role:"professional"});setErro("");setModal(true);};
  const abrirEditar=(u)=>{setEditando(u.id);setForm({...u,senha:""});setErro("");setModal(true);};

  const salvar=()=>{
    setErro("");
    if(!form.name||!form.login) return setErro("Nome e login são obrigatórios.");
    if(!editando&&!form.senha) return setErro("Informe a senha inicial.");
    const duplicado=users.find(u=>u.login.toLowerCase()===form.login.toLowerCase()&&u.id!==editando);
    if(duplicado) return setErro("Este login já está em uso.");
    if(editando){
      setUsers(prev=>prev.map(u=>u.id===editando?{...u,...form,senha:form.senha||u.senha,id:editando}:u));
    } else {
      setUsers(prev=>[...prev,{...form,id:uid()}]);
    }
    setModal(false);
  };

  const remover=(id)=>{if(confirm("Remover este profissional?"))setUsers(prev=>prev.filter(u=>u.id!==id));};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{margin:0,color:C.text,fontSize:22,fontWeight:800}}>Profissionais</h2>
        <Btn onClick={abrirNovo}>+ Cadastrar</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {profissionais.map(pro=>(
          <Card key={pro.id} style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:pro.color||C.accent,flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>{pro.name}</div>
              <div style={{fontSize:12,color:C.textMid}}>{pro.specialty}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>Login: <strong>{pro.login}</strong> &nbsp;·&nbsp; Senha: {mostrarSenha[pro.id]?pro.senha:"••••••"} <button onClick={()=>setMostrarSenha(s=>({...s,[pro.id]:!s[pro.id]}))} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:11}}>{mostrarSenha[pro.id]?"ocultar":"ver"}</button></div>
            </div>
            <Btn variant="secondary" small onClick={()=>abrirEditar(pro)}>Editar</Btn>
            <Btn variant="danger"    small onClick={()=>remover(pro.id)}>✕</Btn>
          </Card>
        ))}
      </div>
      {modal&&(
        <Modal title={editando?"Editar Profissional":"Novo Profissional"} onClose={()=>setModal(false)}>
          <Field label="Nome completo *" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))}/>
          <Field label="Especialidade" value={form.specialty} onChange={v=>setForm(f=>({...f,specialty:v}))} placeholder="Ex: Psicologia Clínica"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Login *" value={form.login} onChange={v=>setForm(f=>({...f,login:v}))} placeholder="nome.sobrenome"/>
            <Field label={editando?"Nova senha (deixe em branco para manter)":"Senha *"} type="password" value={form.senha} onChange={v=>setForm(f=>({...f,senha:v}))} placeholder="••••••••"/>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>Cor de identificação</label>
            <input type="color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} style={{width:48,height:36,border:`1px solid ${C.border}`,borderRadius:8,cursor:"pointer"}}/>
          </div>
          {erro&&<div style={{background:C.dangerLight,color:C.danger,border:`1px solid ${C.danger}33`,borderRadius:8,padding:"8px 12px",fontSize:13,margin:"12px 0"}}>{erro}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:14}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={salvar}>{editando?"Salvar":"Cadastrar"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── VIEW: Configurações (gestor) ──────────────────────────────────────────────
function ConfigView({config,setConfig}) {
  const [form,setForm]=useState({...config,periodos:{...config.periodos,manha:{...config.periodos.manha},tarde:{...config.periodos.tarde},noite:{...config.periodos.noite}}});
  const [salvo,setSalvo]=useState(false);

  const salvar=()=>{
    setConfig(form);
    setSalvo(true);
    setTimeout(()=>setSalvo(false),2000);
  };

  const setPeriodo=(k,campo,val)=>setForm(f=>({...f,periodos:{...f.periodos,[k]:{...f.periodos[k],[campo]:val}}}));

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{margin:0,color:C.text,fontSize:22,fontWeight:800}}>Configurações</h2>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {salvo&&<span style={{color:C.success,fontSize:13,fontWeight:600}}>✓ Salvo!</span>}
          <Btn onClick={salvar}>Salvar configurações</Btn>
        </div>
      </div>

      <Card style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 18px",color:C.text,fontSize:16,fontWeight:700}}>Identidade</h3>
        <div style={{maxWidth:320}}>
          <Field label="Nome da clínica" value={form.nomeClinica} onChange={v=>setForm(f=>({...f,nomeClinica:v}))}/>
        </div>
      </Card>

      <Card style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 18px",color:C.text,fontSize:16,fontWeight:700}}>Valores de sublocação</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:20}}>
          <div>
            <Field label="Hora avulsa (R$/h)" type="number" value={form.valorHoraAvulsa} onChange={v=>setForm(f=>({...f,valorHoraAvulsa:Number(v)}))} helper="Cobrado por hora, sem mínimo de horas"/>
            <div style={{background:C.accentLight,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.textMid}}>
              Exemplo: 2h = <strong style={{color:C.accent}}>{fmtR(form.valorHoraAvulsa*2)}</strong>
            </div>
          </div>
          <div>
            <Field label="Mensalidade (R$/mês)" type="number" value={form.valorMensal} onChange={v=>setForm(f=>({...f,valorMensal:Number(v)}))} helper="Valor fixo independente do uso no mês"/>
          </div>
        </div>
      </Card>

      <Card style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 6px",color:C.text,fontSize:16,fontWeight:700}}>Períodos do dia</h3>
        <p style={{color:C.muted,fontSize:13,margin:"0 0 18px"}}>Cada período tem horário e valor fixo próprios. O profissional escolhe um período inteiro ao reservar.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:16}}>
          {Object.entries(form.periodos).map(([k,p])=>(
            <div key={k} style={{background:C.surfaceAlt,borderRadius:10,padding:16,border:`1px solid ${C.border}`}}>
              <Field label="Nome do período" value={p.label} onChange={v=>setPeriodo(k,"label",v)}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Field label="Início" type="time" value={p.inicio} onChange={v=>setPeriodo(k,"inicio",v)}/>
                <Field label="Fim"    type="time" value={p.fim}    onChange={v=>setPeriodo(k,"fim",v)}/>
              </div>
              <Field label="Valor fixo do período (R$)" type="number" value={p.valor||0} onChange={v=>setPeriodo(k,"valor",Number(v))} helper={`${calcHoras(p.inicio,p.fim).toFixed(0)}h de duração`}/>
              <div style={{background:C.accentLight,borderRadius:8,padding:"8px 12px",fontSize:13,color:C.accent,fontWeight:700,textAlign:"center"}}>
                {p.label}: {fmtR(p.valor||0)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 style={{margin:"0 0 12px",color:C.text,fontSize:15,fontWeight:700}}>Google Agenda</h3>
        <p style={{color:C.muted,fontSize:13,marginBottom:12}}>Para ativar a sincronização com o Google Agenda é necessário configurar OAuth 2.0 na Google Cloud Console. Entre em contato com o desenvolvedor para ativar.</p>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.warning}}/>
          <span style={{fontSize:13,color:C.muted}}>Não conectado</span>
        </div>
      </Card>
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [carregando,setCarregando]=useState(true);
  const [usuario,setUsuario]=useState(null);
  const [view,setView]=useState("dashboard");
  const [users,setUsers_]=useState(INITIAL_USERS);
  const [reservas,setReservas_]=useState([]);
  const [config,setConfig_]=useState(DEFAULT_CONFIG);

  const setUsers    = useCallback(fn=>{setUsers_(p=>{const n=typeof fn==="function"?fn(p):fn;save("users_v3",n);return n;});},[]);
  const setReservas = useCallback(fn=>{setReservas_(p=>{const n=typeof fn==="function"?fn(p):fn;save("reservas_v3",n);return n;});},[]);
  const setConfig   = useCallback(fn=>{setConfig_(p=>{const n=typeof fn==="function"?fn(p):fn;save("config_v3",n);return n;});},[]);

  useEffect(()=>{
    (async()=>{
      const u=await load("users_v3",INITIAL_USERS);
      const r=await load("reservas_v3",[]);
      const c=await load("config_v3",DEFAULT_CONFIG);
      setUsers_(u); setReservas_(r); setConfig_(c);
      setCarregando(false);
    })();
  },[]);

  const isManager=usuario?.role==="manager";

  const handleLogin=(u)=>{
    setUsuario(u);
    setView(isManager||u.role==="manager"?"dashboard":"agenda");
  };

  if(carregando) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"system-ui"}}>Carregando...</div>;
  if(!usuario)   return <LoginScreen users={users} onLogin={handleLogin}/>;

  const navManager=[
    {id:"dashboard",    icon:"📊", label:"Dashboard"},
    {id:"agenda",       icon:"📅", label:"Agenda"},
    {id:"cobrancas",    icon:"💰", label:"Cobranças"},
    {id:"profissionais",icon:"👥", label:"Profissionais"},
    {id:"configuracoes",icon:"⚙️", label:"Configurações"},
  ];
  const navPro=[
    {id:"agenda",    icon:"📅", label:"Reservar Sala"},
    {id:"pendencias",icon:"💰", label:"Minhas Pendências"},
  ];
  const navItems=isManager?navManager:navPro;

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"system-ui,-apple-system,sans-serif",display:"flex"}}>
      {/* Sidebar */}
      <div style={{width:220,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:100}}>
        <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:30,height:30,background:C.accent,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🏥</div>
            <span style={{fontWeight:800,color:C.text,fontSize:15}}>{config.nomeClinica}</span>
          </div>
          <div style={{fontSize:11,color:C.muted,paddingLeft:40}}>
            {isManager?"Gestor":usuario.name?.split(" ").slice(0,2).join(" ")}
          </div>
        </div>
        <nav style={{flex:1,padding:"8px 0"}}>
          {navItems.map(item=>{
            const active=view===item.id;
            return(
              <button key={item.id} onClick={()=>setView(item.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 20px",background:active?C.accentLight:"transparent",border:"none",borderLeft:`3px solid ${active?C.accent:"transparent"}`,cursor:"pointer",color:active?C.accent:C.textMid,fontFamily:"inherit",fontSize:14,fontWeight:active?700:500,textAlign:"left"}}>
                <span>{item.icon}</span>{item.label}
              </button>
            );
          })}
        </nav>
        <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:6}}>
            {isManager&&`Hora avulsa: ${fmtR(config.valorHoraAvulsa)}/h`}
          </div>
          <button onClick={()=>{setUsuario(null);setView("dashboard");}} style={{fontSize:13,color:C.muted,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0}}>
            ← Sair
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{marginLeft:220,flex:1,padding:32,maxWidth:"calc(100% - 220px)"}}>
        {view==="dashboard"     &&isManager&&<DashboardView     reservas={reservas} users={users} config={config}/>}
        {view==="agenda"                   &&<AgendaView        reservas={reservas} setReservas={setReservas} users={users} config={config} currentUser={usuario} isManager={isManager}/>}
        {view==="cobrancas"     &&isManager&&<CobrancasView     reservas={reservas} setReservas={setReservas} users={users}/>}
        {view==="pendencias"    &&!isManager&&<PendenciasView   reservas={reservas} currentUser={usuario}/>}
        {view==="profissionais" &&isManager&&<ProfissionaisView users={users} setUsers={setUsers}/>}
        {view==="configuracoes" &&isManager&&<ConfigView        config={config} setConfig={setConfig}/>}
      </div>
    </div>
  );
}import { useState, useEffect, useCallback } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#F4F6FA", white: "#FFFFFF", surface: "#FFFFFF",
  surfaceAlt: "#F0F2F7", border: "#E2E6EF",
  accent: "#1B6CA8", accentLight: "#EBF3FB", accentHover: "#155A8E",
  sala1: "#D97706", sala1Light: "#FEF3C7",
  sala2: "#059669", sala2Light: "#D1FAE5",
  text: "#1A1F2E", textMid: "#4B5563", muted: "#9CA3AF",
  danger: "#DC2626", dangerLight: "#FEE2E2",
  success: "#059669", successLight: "#D1FAE5",
  warning: "#D97706", warningLight: "#FEF3C7",
  fixo: "#6366F1", fixoLight: "#EEF2FF",
};

const SALA_INFO = {
  sala1: { label: "Sala 1", bg: "#FEF3C7", text: "#D97706" },
  sala2: { label: "Sala 2", bg: "#D1FAE5", text: "#059669" },
};

const DIAS_SEMANA = ["dom","seg","ter","qua","qui","sex","sab"];
const DIAS_LABEL  = { dom:"Dom",seg:"Seg",ter:"Ter",qua:"Qua",qui:"Qui",sex:"Sex",sab:"Sáb" };
const MONTH_FULL  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTH_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ── Defaults de configuração ──────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  valorHoraAvulsa: 35,
  valorMensal: 800,
  periodos: {
    manha: { label: "Manhã",  inicio: "09:00", fim: "13:00", valor: 100 },
    tarde:  { label: "Tarde",  inicio: "13:00", fim: "17:00", valor: 100 },
    noite:  { label: "Noite",  inicio: "17:00", fim: "21:00", valor: 120 },
  },
  nomeClinica: "Casa Aquarela",
};

// ── Dados iniciais ────────────────────────────────────────────────────────────
const INITIAL_USERS = [
  { id:"g1", login:"gestor1",  senha:"gestor123", role:"manager",      name:"Gestor 1",           specialty:"" },
  { id:"g2", login:"gestor2",  senha:"admin456",  role:"manager",      name:"Gestor 2",           specialty:"" },
  { id:"p1", login:"ana",      senha:"ana123",    role:"professional", name:"Dra. Ana Lima",      specialty:"Psicologia Clínica",  color:"#1B6CA8" },
  { id:"p2", login:"carlos",   senha:"carlos123", role:"professional", name:"Dr. Carlos Mendes",  specialty:"Neuropsicologia",      color:"#7C3AED" },
  { id:"p3", login:"beatriz",  senha:"bia123",    role:"professional", name:"Dra. Beatriz Souza", specialty:"Psicologia Infantil",  color:"#0891B2" },
];

// ── Utils ─────────────────────────────────────────────────────────────────────
const uid    = () => Math.random().toString(36).slice(2,10);
const today  = () => new Date().toISOString().slice(0,10);
const fmt    = d => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR") : "—";
const fmtR   = v => Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const diaSem = d => DIAS_SEMANA[new Date(d+"T12:00:00").getDay()];

const calcHoras = (ini, fim) => {
  const [h1,m1]=ini.split(":").map(Number), [h2,m2]=fim.split(":").map(Number);
  const diff=(h2*60+m2)-(h1*60+m1); return diff>0?diff/60:0;
};

const horaParaMin = h => { const [hh,mm]=h.split(":").map(Number); return hh*60+mm; };

const conflito = (reservas, nova, excludeId) =>
  reservas.some(r =>
    r.id!==excludeId && r.date===nova.date && r.sala===nova.sala &&
    horaParaMin(r.horaInicio)<horaParaMin(nova.horaFim) &&
    horaParaMin(r.horaFim)>horaParaMin(nova.horaInicio)
  );

const save = async (k,v) => { try { await window.storage.set(k,JSON.stringify(v)); } catch {} };
const load = async (k,fb) => { try { const r=await window.storage.get(k); return r?JSON.parse(r.value):fb; } catch { return fb; } };

// ── Componentes base ──────────────────────────────────────────────────────────
const Card = ({children,style={}}) => (
  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:20,...style}}>{children}</div>
);

const Badge = ({label,bg,color}) => (
  <span style={{background:bg,color,border:`1px solid ${color}44`,borderRadius:6,padding:"2px 9px",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{label}</span>
);

const Btn = ({children,onClick,variant="primary",small,style={},disabled,full}) => {
  const v = {
    primary:   {background:C.accent,     color:"#fff",      border:`1px solid ${C.accent}`},
    secondary: {background:C.white,      color:C.text,      border:`1px solid ${C.border}`},
    danger:    {background:C.dangerLight,color:C.danger,    border:`1px solid ${C.danger}44`},
    ghost:     {background:"transparent",color:C.muted,     border:"none"},
    success:   {background:C.successLight,color:C.success,  border:`1px solid ${C.success}44`},
    warning:   {background:C.warningLight,color:C.warning,  border:`1px solid ${C.warning}44`},
  };
  return (
    <button onClick={disabled?undefined:onClick} style={{
      ...v[variant],borderRadius:8,cursor:disabled?"not-allowed":"pointer",
      fontWeight:600,fontSize:small?12:14,padding:small?"5px 11px":"9px 18px",
      fontFamily:"inherit",opacity:disabled?0.5:1,width:full?"100%":undefined,...style
    }}>{children}</button>
  );
};

const Field = ({label,value,onChange,type="text",options,placeholder,style={},helper}) => (
  <div style={{marginBottom:14}}>
    {label && <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>{label}</label>}
    {options
      ? <select value={value} onChange={e=>onChange(e.target.value)}
          style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 11px",fontSize:14,fontFamily:"inherit",...style}}>
          {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
        </select>
      : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 11px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",...style}}/>
    }
    {helper && <div style={{fontSize:11,color:C.muted,marginTop:4}}>{helper}</div>}
  </div>
);

const Modal = ({title,onClose,children,wide}) => (
  <div onClick={e=>e.target===e.currentTarget&&onClose()}
    style={{position:"fixed",inset:0,background:"#00000060",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28,width:"100%",maxWidth:wide?680:500,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px #0003"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <h3 style={{margin:0,color:C.text,fontSize:18,fontWeight:700}}>{title}</h3>
        <Btn variant="ghost" small onClick={onClose}>✕</Btn>
      </div>
      {children}
    </div>
  </div>
);

const Stat = ({label,value,color=C.accent,sub}) => (
  <Card style={{padding:"18px 20px"}}>
    <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{label}</div>
    <div style={{fontSize:26,fontWeight:800,color,marginBottom:sub?3:0}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:C.muted}}>{sub}</div>}
  </Card>
);

const SalaTag = ({salaId}) => {
  const s=SALA_INFO[salaId]; if(!s) return null;
  return <Badge label={s.label} bg={s.bg} color={s.text}/>;
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({users,onLogin}) {
  const [login,setLogin]=useState("");
  const [senha,setSenha]=useState("");
  const [erro,setErro]=useState("");
  const [showSenha,setShowSenha]=useState(false);

  const tentar = () => {
    const u = users.find(u=>u.login.toLowerCase()===login.toLowerCase()&&u.senha===senha);
    if(u) onLogin(u);
    else { setErro("Login ou senha incorretos."); setSenha(""); }
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,-apple-system,sans-serif",padding:20}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,background:C.accent,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 14px"}}>🏥</div>
          <h1 style={{color:C.text,margin:"0 0 4px",fontSize:24,fontWeight:800}}>Casa Aquarela</h1>
          <p style={{color:C.muted,margin:0,fontSize:14}}>Agenda & Salas</p>
        </div>
        <Card>
          <Field label="Login" value={login} onChange={setLogin} placeholder="seu.login" />
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>Senha</label>
            <div style={{position:"relative"}}>
              <input type={showSenha?"text":"password"} value={senha} onChange={e=>setSenha(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&tentar()}
                placeholder="••••••••"
                style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 40px 8px 11px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box"}}/>
              <button onClick={()=>setShowSenha(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14}}>
                {showSenha?"🙈":"👁️"}
              </button>
            </div>
          </div>
          {erro && <div style={{background:C.dangerLight,color:C.danger,border:`1px solid ${C.danger}33`,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:14}}>{erro}</div>}
          <Btn full onClick={tentar} style={{padding:"11px 18px",fontSize:15}}>Entrar</Btn>
        </Card>
        <p style={{textAlign:"center",color:C.muted,fontSize:12,marginTop:16}}>Acesse com o login fornecido pela gestão.</p>
      </div>
    </div>
  );
}

// ── RESERVA: modal para profissional ─────────────────────────────────────────
function ModalReserva({onClose,onSave,reservas,config,userId,excludeId,initial}) {
  const periodos = config.periodos;
  const [sala,setSala]   = useState(initial?.sala||"sala1");
  const [data,setData]   = useState(initial?.date||today());
  const [modo,setModo]   = useState(initial?.modo||"avulsa"); // avulsa | periodo | mensal
  const [periodo,setPeriodo] = useState(initial?.periodo||"manha");
  const [hIni,setHIni]   = useState(initial?.horaInicio||"09:00");
  const [hFim,setHFim]   = useState(initial?.horaFim||"10:00");
  const [mesMensal,setMesMensal] = useState(initial?.mesMensal||today().slice(0,7));
  const [notes,setNotes] = useState(initial?.notes||"");
  const [erro,setErro]   = useState("");

  const horaOptions = Array.from({length:33},(_,i)=>{
    const tot=7*60+i*30, h=Math.floor(tot/60), m=tot%60;
    return h<24?{value:`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`,label:`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`}:null;
  }).filter(Boolean);

  // Calcula valor e horários conforme modo
  let horaInicio="", horaFim="", valor=0, resumo="";
  if(modo==="avulsa"){
    horaInicio=hIni; horaFim=hFim;
    const h=calcHoras(hIni,hFim);
    valor=+(h*config.valorHoraAvulsa).toFixed(2);
    resumo=`${h>0?h.toFixed(1):"?"}h × ${fmtR(config.valorHoraAvulsa)}/h = ${fmtR(valor)}`;
  } else if(modo==="periodo"){
    const p=periodos[periodo];
    horaInicio=p.inicio; horaFim=p.fim;
    valor=Number(p.valor||0);
    resumo=`${p.label}: ${p.inicio}–${p.fim} → valor fixo ${fmtR(valor)}`;
  } else {
    horaInicio="00:00"; horaFim="23:59";
    valor=config.valorMensal;
    resumo=`Mensalidade fixa: ${fmtR(valor)}`;
  }

  const salvar = () => {
    setErro("");
    if(!data||!sala) return setErro("Preencha todos os campos.");
    if(modo==="avulsa"&&horaParaMin(hFim)<=horaParaMin(hIni)) return setErro("Horário de fim deve ser após o início.");
    if(modo!=="mensal"){
      const nova={date:data,sala,horaInicio,horaFim};
      if(conflito(reservas,nova,excludeId)) return setErro("Já existe uma reserva nessa sala nesse horário.");
    }
    onSave({id:excludeId||uid(),date:data,sala,horaInicio,horaFim,modo,periodo:modo==="periodo"?periodo:undefined,mesMensal:modo==="mensal"?mesMensal:undefined,valor,userId,notes,pago:false});
    onClose();
  };

  const modoBtn=(m,label,sub)=>(
    <button onClick={()=>setModo(m)} style={{flex:1,padding:"10px 8px",border:`2px solid ${modo===m?C.accent:C.border}`,borderRadius:10,background:modo===m?C.accentLight:C.white,cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}}>
      <div style={{fontWeight:700,fontSize:13,color:modo===m?C.accent:C.text}}>{label}</div>
      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>
    </button>
  );

  return (
    <Modal title="Reservar Sala" onClose={onClose}>
      {/* Sala */}
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Sala</label>
        <div style={{display:"flex",gap:10}}>
          {["sala1","sala2"].map(s=>(
            <button key={s} onClick={()=>setSala(s)} style={{flex:1,padding:"10px",border:`2px solid ${sala===s?SALA_INFO[s].text:C.border}`,borderRadius:10,background:sala===s?SALA_INFO[s].bg:C.white,cursor:"pointer",fontFamily:"inherit",fontWeight:700,color:sala===s?SALA_INFO[s].text:C.textMid,fontSize:14}}>
              {SALA_INFO[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Modalidade */}
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Modalidade</label>
        <div style={{display:"flex",gap:8}}>
          {modoBtn("avulsa","Hora Avulsa",fmtR(config.valorHoraAvulsa)+"/h")}
          {modoBtn("periodo","Período",fmtR(config.valorHoraPeriodo)+"/h · mín 4h")}
          {modoBtn("mensal","Mensal",fmtR(config.valorMensal)+"/mês")}
        </div>
      </div>

      {/* Data */}
      {modo!=="mensal" && <Field label="Data" type="date" value={data} onChange={setData}/>}

      {/* Campos por modo */}
      {modo==="avulsa" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Início" value={hIni} onChange={setHIni} options={horaOptions}/>
          <Field label="Fim"    value={hFim} onChange={setHFim} options={horaOptions}/>
        </div>
      )}
      {modo==="periodo" && (
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Período</label>
          <div style={{display:"flex",gap:8}}>
            {Object.entries(periodos).map(([k,p])=>(
              <button key={k} onClick={()=>setPeriodo(k)} style={{flex:1,padding:"10px 8px",border:`2px solid ${periodo===k?C.accent:C.border}`,borderRadius:10,background:periodo===k?C.accentLight:C.white,cursor:"pointer",fontFamily:"inherit"}}>
                <div style={{fontWeight:700,fontSize:13,color:periodo===k?C.accent:C.text}}>{p.label}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{p.inicio}–{p.fim}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {modo==="mensal" && (
        <Field label="Mês de referência" type="month" value={mesMensal} onChange={setMesMensal}/>
      )}

      {/* Resumo de valor */}
      <div style={{background:C.accentLight,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13,color:C.textMid}}>
        <strong style={{color:C.accent}}>Valor: </strong>{resumo}
      </div>

      <Field label="Observações" value={notes} onChange={setNotes} placeholder="Opcional..."/>
      {erro && <div style={{background:C.dangerLight,color:C.danger,border:`1px solid ${C.danger}33`,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:12}}>{erro}</div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={salvar}>Confirmar Reserva</Btn>
      </div>
    </Modal>
  );
}

// ── GRADE SEMANAL ─────────────────────────────────────────────────────────────
function GradeSemanal({reservas,users,semanaBase,onSlotClick}) {
  const horas=Array.from({length:17},(_,i)=>i+7);
  const dias=Array.from({length:7},(_,i)=>{const d=new Date(semanaBase);d.setDate(d.getDate()+i);return d.toISOString().slice(0,10);});
  const getR=(dia,hora,sala)=>reservas.filter(r=>r.date===dia&&r.sala===sala&&horaParaMin(r.horaInicio)<=hora*60&&horaParaMin(r.horaFim)>hora*60);
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,tableLayout:"fixed"}}>
        <thead>
          <tr>
            <th style={{width:44,borderBottom:`2px solid ${C.border}`}}></th>
            {dias.map(d=>{
              const isT=d===today();
              return <th key={d} colSpan={2} style={{padding:"6px 4px",textAlign:"center",borderBottom:`2px solid ${C.border}`,color:isT?C.accent:C.textMid,fontWeight:isT?800:600}}>
                <div>{DIAS_LABEL[diaSem(d)]}</div>
                <div style={{fontSize:11,color:C.muted}}>{d.slice(8)}/{d.slice(5,7)}</div>
              </th>;
            })}
          </tr>
          <tr>
            <th></th>
            {dias.map(d=>["sala1","sala2"].map(s=>(
              <th key={d+s} style={{padding:"3px 2px",textAlign:"center",fontSize:11,fontWeight:700,color:SALA_INFO[s].text,background:SALA_INFO[s].bg,borderBottom:`1px solid ${C.border}`}}>
                {s==="sala1"?"S1":"S2"}
              </th>
            )))}
          </tr>
        </thead>
        <tbody>
          {horas.map(h=>(
            <tr key={h}>
              <td style={{padding:"2px 6px",color:C.muted,fontSize:11,textAlign:"right",verticalAlign:"top",paddingTop:5}}>{h}:00</td>
              {dias.map(d=>["sala1","sala2"].map(sala=>{
                const rs=getR(d,h,sala); const r=rs[0];
                const u=r?users.find(u=>u.id===r.userId):null;
                const isFirst=r&&horaParaMin(r.horaInicio)===h*60;
                return (
                  <td key={d+sala+h} onClick={!r?()=>onSlotClick(d,h,sala):undefined}
                    style={{border:`1px solid ${C.border}`,padding:2,verticalAlign:"top",height:28,
                      background:r?(sala==="sala1"?C.sala1Light:C.sala2Light):"#FAFBFD",
                      cursor:r?"default":"pointer"}}>
                    {isFirst&&(
                      <div style={{background:sala==="sala1"?C.sala1:C.sala2,color:"#fff",borderRadius:4,padding:"2px 4px",fontSize:10,fontWeight:600,lineHeight:1.3,overflow:"hidden",whiteSpace:"nowrap"}}>
                        {u?.name?.split(" ").slice(0,2).join(" ")||"—"}
                      </div>
                    )}
                  </td>
                );
              }))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── VIEW: Agenda ──────────────────────────────────────────────────────────────
function AgendaView({reservas,setReservas,users,config,currentUser,isManager}) {
  const [semOff,setSemOff]=useState(0);
  const [modalAberto,setModalAberto]=useState(false);
  const [editando,setEditando]=useState(null);
  const [slotPre,setSlotPre]=useState(null);
  const [viewMode,setViewMode]=useState("semana");
  const [filtroPro,setFiltroPro]=useState("");
  const [filtroDt,setFiltroDt]=useState("");

  const semanaBase=(()=>{
    const d=new Date();d.setDate(d.getDate()-d.getDay()+1+semOff*7);return d.toISOString().slice(0,10);
  })();

  const profissionais=users.filter(u=>u.role==="professional");

  const abrirNovo=(date,hora,sala)=>{
    const hi=hora!=null?String(hora).padStart(2,"0")+":00":"09:00";
    const hf=hora!=null?String(hora+1).padStart(2,"0")+":00":"10:00";
    setSlotPre({date:date||today(),horaInicio:hi,horaFim:hf,sala:sala||"sala1"});
    setEditando(null); setModalAberto(true);
  };
  const abrirEditar=(r)=>{setEditando(r);setSlotPre(null);setModalAberto(true);};

  const salvarReserva=(dados)=>{
    if(editando) setReservas(prev=>prev.map(r=>r.id===editando.id?dados:r));
    else setReservas(prev=>[...prev,{...dados,userId:currentUser.id}]);
  };

  const remover=(id)=>{if(confirm("Remover esta reserva?"))setReservas(prev=>prev.filter(r=>r.id!==id));};
  const togglePago=(id)=>setReservas(prev=>prev.map(r=>r.id===id?{...r,pago:!r.pago}:r));

  const lista=reservas.filter(r=>{
    if(!isManager&&r.userId!==currentUser.id) return false;
    if(filtroPro&&r.userId!==filtroPro) return false;
    if(filtroDt&&r.date!==filtroDt) return false;
    return true;
  }).sort((a,b)=>(a.date+a.horaInicio).localeCompare(b.date+b.horaInicio));

  const modoLabel={avulsa:"Hora Avulsa",periodo:"Período",mensal:"Mensal"};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <h2 style={{margin:0,color:C.text,fontSize:22,fontWeight:800}}>Agenda de Salas</h2>
        <div style={{display:"flex",gap:8}}>
          <Btn variant={viewMode==="semana"?"primary":"secondary"} small onClick={()=>setViewMode("semana")}>Grade</Btn>
          <Btn variant={viewMode==="lista"?"primary":"secondary"} small onClick={()=>setViewMode("lista")}>Lista</Btn>
          <Btn onClick={()=>abrirNovo()}>+ Reservar Sala</Btn>
        </div>
      </div>

      {viewMode==="semana"&&(
        <Card style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <Btn variant="secondary" small onClick={()=>setSemOff(o=>o-1)}>← Anterior</Btn>
            <span style={{fontWeight:700,color:C.text,fontSize:14}}>Semana de {fmt(semanaBase)}</span>
            <div style={{display:"flex",gap:8}}>
              <Btn variant="secondary" small onClick={()=>setSemOff(0)}>Hoje</Btn>
              <Btn variant="secondary" small onClick={()=>setSemOff(o=>o+1)}>Próxima →</Btn>
            </div>
          </div>
          <GradeSemanal reservas={reservas} users={users} semanaBase={semanaBase} onSlotClick={(d,h,s)=>abrirNovo(d,h,s)}/>
          <div style={{display:"flex",gap:16,marginTop:12}}>
            <div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:12,height:12,borderRadius:3,background:C.sala1}}/><span style={{fontSize:12,color:C.textMid}}>Sala 1</span></div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:12,height:12,borderRadius:3,background:C.sala2}}/><span style={{fontSize:12,color:C.textMid}}>Sala 2</span></div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:12,height:12,borderRadius:3,background:C.surfaceAlt,border:`1px solid ${C.border}`}}/><span style={{fontSize:12,color:C.muted}}>Disponível — clique para reservar</span></div>
          </div>
        </Card>
      )}

      {viewMode==="lista"&&(
        <Card style={{marginBottom:20}}>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            {isManager&&(
              <div style={{width:220}}>
                <Field label="Profissional" value={filtroPro} onChange={setFiltroPro}
                  options={[{value:"",label:"Todos"},...profissionais.map(p=>({value:p.id,label:p.name}))]}/>
              </div>
            )}
            <div style={{width:160}}><Field label="Data" type="date" value={filtroDt} onChange={setFiltroDt}/></div>
            {filtroDt&&<div style={{display:"flex",alignItems:"flex-end",paddingBottom:14}}><Btn variant="ghost" small onClick={()=>setFiltroDt("")}>Limpar data</Btn></div>}
          </div>
          {lista.length===0&&<p style={{color:C.muted,margin:0}}>Nenhuma reserva encontrada.</p>}
          {lista.map(r=>{
            const u=users.find(u=>u.id===r.userId);
            const isOwn=r.userId===currentUser.id;
            return (
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{width:4,height:44,borderRadius:2,background:u?.color||C.accent,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u?.name}</div>
                  <div style={{fontSize:12,color:C.textMid}}>{fmt(r.date)} · {r.horaInicio}–{r.horaFim}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <SalaTag salaId={r.sala}/>
                  <Badge label={modoLabel[r.modo]||r.modo} bg={C.accentLight} color={C.accent}/>
                  <Badge label={r.pago?"Pago":"Pendente"} bg={r.pago?C.successLight:C.warningLight} color={r.pago?C.success:C.warning}/>
                  <span style={{fontSize:14,fontWeight:700,color:C.text}}>{fmtR(r.valor)}</span>
                  {isManager&&<Btn variant="success" small onClick={()=>togglePago(r.id)}>{r.pago?"✓ Pago":"Marcar Pago"}</Btn>}
                  {(isManager||isOwn)&&<Btn variant="secondary" small onClick={()=>abrirEditar(r)}>Editar</Btn>}
                  {(isManager||isOwn)&&<Btn variant="danger" small onClick={()=>remover(r.id)}>✕</Btn>}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {modalAberto&&(
        <ModalReserva
          onClose={()=>setModalAberto(false)}
          onSave={salvarReserva}
          reservas={reservas}
          config={config}
          userId={currentUser.id}
          excludeId={editando?.id}
          initial={editando||slotPre}
        />
      )}
    </div>
  );
}

// ── VIEW: Minhas Pendências (profissional) ────────────────────────────────────
function PendenciasView({reservas,currentUser}) {
  const minhas=reservas.filter(r=>r.userId===currentUser.id).sort((a,b)=>b.date.localeCompare(a.date));
  const pendente=minhas.filter(r=>!r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const pago=minhas.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const modoLabel={avulsa:"Hora Avulsa",periodo:"Período",mensal:"Mensal"};
  return (
    <div>
      <h2 style={{margin:"0 0 24px",color:C.text,fontSize:22,fontWeight:800}}>Minhas Pendências</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:24}}>
        <Stat label="A pagar" value={fmtR(pendente)} color={C.warning} sub={`${minhas.filter(r=>!r.pago).length} reservas`}/>
        <Stat label="Já pago" value={fmtR(pago)} color={C.success} sub={`${minhas.filter(r=>r.pago).length} reservas`}/>
        <Stat label="Total gerado" value={fmtR(pendente+pago)} color={C.text} sub="histórico completo"/>
      </div>
      <Card>
        {minhas.length===0&&<p style={{color:C.muted,margin:0}}>Você ainda não tem reservas.</p>}
        {minhas.map(r=>(
          <div key={r.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{fmt(r.date)} · {r.horaInicio}–{r.horaFim}</div>
              <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                <SalaTag salaId={r.sala}/>
                <Badge label={modoLabel[r.modo]||r.modo} bg={C.accentLight} color={C.accent}/>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:15,fontWeight:800,color:C.text}}>{fmtR(r.valor)}</div>
              <Badge label={r.pago?"✓ Pago":"Pendente"} bg={r.pago?C.successLight:C.warningLight} color={r.pago?C.success:C.warning}/>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── VIEW: Dashboard (gestor) ──────────────────────────────────────────────────
function DashboardView({reservas,users,config}) {
  const mes=today().slice(0,7);
  const mesRes=reservas.filter(r=>r.date?.slice(0,7)===mes||(r.modo==="mensal"&&r.mesMensal===mes));
  const totalValor=mesRes.reduce((s,r)=>s+Number(r.valor||0),0);
  const totalPago=mesRes.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const hojRes=reservas.filter(r=>r.date===today()).sort((a,b)=>a.horaInicio.localeCompare(b.horaInicio));
  const profissionais=users.filter(u=>u.role==="professional");

  const byPro=profissionais.map(pro=>{
    const rs=mesRes.filter(r=>r.userId===pro.id);
    return{...pro,reservas:rs.length,horas:rs.filter(r=>r.modo!=="mensal").reduce((s,r)=>s+calcHoras(r.horaInicio,r.horaFim),0),valor:rs.reduce((s,r)=>s+Number(r.valor||0),0),pago:rs.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0)};
  }).filter(p=>p.reservas>0);

  return (
    <div>
      <h2 style={{margin:"0 0 24px",color:C.text,fontSize:22,fontWeight:800}}>Dashboard — {MONTH_FULL[new Date().getMonth()]}</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:16,marginBottom:28}}>
        <Stat label="Reservas no mês" value={mesRes.length}/>
        <Stat label="Faturamento" value={fmtR(totalValor)} color={C.text}/>
        <Stat label="Recebido" value={fmtR(totalPago)} color={C.success}/>
        <Stat label="A receber" value={fmtR(totalValor-totalPago)} color={C.warning}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        <Card>
          <h3 style={{margin:"0 0 14px",color:C.text,fontSize:15,fontWeight:700}}>Hoje — {fmt(today())}</h3>
          {hojRes.length===0?<p style={{color:C.muted,fontSize:14,margin:0}}>Nenhuma reserva hoje.</p>
          :hojRes.map(r=>{const u=users.find(u=>u.id===r.userId);return(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontSize:13,color:C.textMid,minWidth:90,fontWeight:600}}>{r.horaInicio}–{r.horaFim}</div>
              <div style={{flex:1,fontSize:13,color:C.text,fontWeight:600}}>{u?.name?.split(" ").slice(0,2).join(" ")}</div>
              <SalaTag salaId={r.sala}/>
            </div>
          );})}
        </Card>
        <Card>
          <h3 style={{margin:"0 0 14px",color:C.text,fontSize:15,fontWeight:700}}>Por profissional</h3>
          {byPro.length===0?<p style={{color:C.muted,fontSize:14,margin:0}}>Sem reservas este mês.</p>
          :byPro.map(pro=>(
            <div key={pro.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:pro.color||C.accent,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{pro.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{pro.reservas} reservas · {pro.horas.toFixed(1)}h</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{fmtR(pro.valor)}</div>
                {pro.valor-pro.pago>0&&<div style={{fontSize:11,color:C.warning}}>{fmtR(pro.valor-pro.pago)} pend.</div>}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── VIEW: Cobranças (gestor) ──────────────────────────────────────────────────
function CobrancasView({reservas,setReservas,users}) {
  const [mes,setMes]=useState(new Date().getMonth());
  const [ano,setAno]=useState(new Date().getFullYear());
  const [filtroPro,setFiltroPro]=useState("");
  const mesStr=`${ano}-${String(mes+1).padStart(2,"0")}`;
  const profissionais=users.filter(u=>u.role==="professional");
  const modoLabel={avulsa:"Hora Avulsa",periodo:"Período",mensal:"Mensal"};

  const lista=reservas.filter(r=>{
    const noMes=(r.date?.slice(0,7)===mesStr)||(r.modo==="mensal"&&r.mesMensal===mesStr);
    if(!noMes) return false;
    if(filtroPro&&r.userId!==filtroPro) return false;
    return true;
  });

  const totalValor=lista.reduce((s,r)=>s+Number(r.valor||0),0);
  const totalPago=lista.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0);

  const togglePago=(id)=>setReservas(prev=>prev.map(r=>r.id===id?{...r,pago:!r.pago}:r));
  const quitarTudo=(userId)=>{
    const ids=lista.filter(r=>r.userId===userId&&!r.pago).map(r=>r.id);
    setReservas(prev=>prev.map(r=>ids.includes(r.id)?{...r,pago:true}:r));
  };

  const porPro=profissionais.map(pro=>{
    const rs=lista.filter(r=>r.userId===pro.id);
    if(!rs.length) return null;
    return{...pro,reservas:rs,total:rs.reduce((s,r)=>s+Number(r.valor||0),0),pago:rs.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0)};
  }).filter(Boolean);

  return (
    <div>
      <h2 style={{margin:"0 0 24px",color:C.text,fontSize:22,fontWeight:800}}>Cobranças</h2>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{width:140}}><Field label="Mês" value={mes} onChange={v=>setMes(Number(v))} options={MONTH_SHORT.map((n,i)=>({value:i,label:n}))}/></div>
        <div style={{width:90}}><Field label="Ano" value={ano} onChange={v=>setAno(Number(v))} options={[2024,2025,2026,2027].map(y=>({value:y,label:String(y)}))}/></div>
        <div style={{width:220}}><Field label="Profissional" value={filtroPro} onChange={setFiltroPro} options={[{value:"",label:"Todos"},...profissionais.map(p=>({value:p.id,label:p.name}))]}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:24}}>
        <Stat label="Total gerado" value={fmtR(totalValor)} color={C.text}/>
        <Stat label="Recebido" value={fmtR(totalPago)} color={C.success}/>
        <Stat label="Pendente" value={fmtR(totalValor-totalPago)} color={C.warning}/>
        <Stat label="Reservas" value={lista.length} sub={`${lista.filter(r=>r.pago).length} quitadas`}/>
      </div>
      {porPro.length===0&&<Card><p style={{color:C.muted,margin:0}}>Nenhuma reserva neste período.</p></Card>}
      {porPro.map(pro=>(
        <Card key={pro.id} style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:pro.color||C.accent}}/>
              <span style={{fontWeight:700,color:C.text,fontSize:15}}>{pro.name}</span>
              <span style={{fontSize:12,color:C.muted}}>{pro.specialty}</span>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:700,color:C.text}}>{fmtR(pro.total)}</span>
              {pro.total-pro.pago>0
                ?<><span style={{fontSize:13,color:C.warning,fontWeight:600}}>{fmtR(pro.total-pro.pago)} pendente</span>
                  <Btn variant="success" small onClick={()=>quitarTudo(pro.id)}>Quitar tudo</Btn></>
                :<span style={{fontSize:13,color:C.success,fontWeight:600}}>✓ Quitado</span>}
            </div>
          </div>
          {pro.reservas.map(r=>(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderTop:`1px solid ${C.border}`}}>
              <div style={{fontSize:13,color:C.textMid,minWidth:86}}>{fmt(r.date)}</div>
              <div style={{fontSize:13,color:C.textMid,minWidth:100}}>{r.horaInicio}–{r.horaFim}</div>
              <SalaTag salaId={r.sala}/>
              <Badge label={modoLabel[r.modo]||r.modo} bg={C.accentLight} color={C.accent}/>
              <span style={{flex:1}}/>
              <span style={{fontSize:14,fontWeight:600,color:C.text}}>{fmtR(r.valor)}</span>
              <button onClick={()=>togglePago(r.id)} style={{background:r.pago?C.successLight:C.warningLight,color:r.pago?C.success:C.warning,border:`1px solid ${r.pago?C.success:C.warning}44`,borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                {r.pago?"✓ Pago":"Pendente"}
              </button>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

// ── VIEW: Profissionais (gestor) ──────────────────────────────────────────────
function ProfissionaisView({users,setUsers}) {
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [form,setForm]=useState({name:"",specialty:"",color:"#1B6CA8",login:"",senha:"",role:"professional"});
  const [erro,setErro]=useState("");
  const [mostrarSenha,setMostrarSenha]=useState({});

  const profissionais=users.filter(u=>u.role==="professional");

  const abrirNovo=()=>{setEditando(null);setForm({name:"",specialty:"",color:"#1B6CA8",login:"",senha:"",role:"professional"});setErro("");setModal(true);};
  const abrirEditar=(u)=>{setEditando(u.id);setForm({...u,senha:""});setErro("");setModal(true);};

  const salvar=()=>{
    setErro("");
    if(!form.name||!form.login) return setErro("Nome e login são obrigatórios.");
    if(!editando&&!form.senha) return setErro("Informe a senha inicial.");
    const duplicado=users.find(u=>u.login.toLowerCase()===form.login.toLowerCase()&&u.id!==editando);
    if(duplicado) return setErro("Este login já está em uso.");
    if(editando){
      setUsers(prev=>prev.map(u=>u.id===editando?{...u,...form,senha:form.senha||u.senha,id:editando}:u));
    } else {
      setUsers(prev=>[...prev,{...form,id:uid()}]);
    }
    setModal(false);
  };

  const remover=(id)=>{if(window.confirm("Remover este profissional?")) // eslint-disable-line no-restricted-globalssetUsers(prev=>prev.filter(u=>u.id!==id));};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{margin:0,color:C.text,fontSize:22,fontWeight:800}}>Profissionais</h2>
        <Btn onClick={abrirNovo}>+ Cadastrar</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {profissionais.map(pro=>(
          <Card key={pro.id} style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:pro.color||C.accent,flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>{pro.name}</div>
              <div style={{fontSize:12,color:C.textMid}}>{pro.specialty}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>Login: <strong>{pro.login}</strong> &nbsp;·&nbsp; Senha: {mostrarSenha[pro.id]?pro.senha:"••••••"} <button onClick={()=>setMostrarSenha(s=>({...s,[pro.id]:!s[pro.id]}))} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:11}}>{mostrarSenha[pro.id]?"ocultar":"ver"}</button></div>
            </div>
            <Btn variant="secondary" small onClick={()=>abrirEditar(pro)}>Editar</Btn>
            <Btn variant="danger"    small onClick={()=>remover(pro.id)}>✕</Btn>
          </Card>
        ))}
      </div>
      {modal&&(
        <Modal title={editando?"Editar Profissional":"Novo Profissional"} onClose={()=>setModal(false)}>
          <Field label="Nome completo *" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))}/>
          <Field label="Especialidade" value={form.specialty} onChange={v=>setForm(f=>({...f,specialty:v}))} placeholder="Ex: Psicologia Clínica"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Login *" value={form.login} onChange={v=>setForm(f=>({...f,login:v}))} placeholder="nome.sobrenome"/>
            <Field label={editando?"Nova senha (deixe em branco para manter)":"Senha *"} type="password" value={form.senha} onChange={v=>setForm(f=>({...f,senha:v}))} placeholder="••••••••"/>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>Cor de identificação</label>
            <input type="color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} style={{width:48,height:36,border:`1px solid ${C.border}`,borderRadius:8,cursor:"pointer"}}/>
          </div>
          {erro&&<div style={{background:C.dangerLight,color:C.danger,border:`1px solid ${C.danger}33`,borderRadius:8,padding:"8px 12px",fontSize:13,margin:"12px 0"}}>{erro}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:14}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={salvar}>{editando?"Salvar":"Cadastrar"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── VIEW: Configurações (gestor) ──────────────────────────────────────────────
function ConfigView({config,setConfig}) {
  const [form,setForm]=useState({...config,periodos:{...config.periodos,manha:{...config.periodos.manha},tarde:{...config.periodos.tarde},noite:{...config.periodos.noite}}});
  const [salvo,setSalvo]=useState(false);

  const salvar=()=>{
    setConfig(form);
    setSalvo(true);
    setTimeout(()=>setSalvo(false),2000);
  };

  const setPeriodo=(k,campo,val)=>setForm(f=>({...f,periodos:{...f.periodos,[k]:{...f.periodos[k],[campo]:val}}}));

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{margin:0,color:C.text,fontSize:22,fontWeight:800}}>Configurações</h2>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {salvo&&<span style={{color:C.success,fontSize:13,fontWeight:600}}>✓ Salvo!</span>}
          <Btn onClick={salvar}>Salvar configurações</Btn>
        </div>
      </div>

      <Card style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 18px",color:C.text,fontSize:16,fontWeight:700}}>Identidade</h3>
        <div style={{maxWidth:320}}>
          <Field label="Nome da clínica" value={form.nomeClinica} onChange={v=>setForm(f=>({...f,nomeClinica:v}))}/>
        </div>
      </Card>

      <Card style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 18px",color:C.text,fontSize:16,fontWeight:700}}>Valores de sublocação</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:20}}>
          <div>
            <Field label="Hora avulsa (R$/h)" type="number" value={form.valorHoraAvulsa} onChange={v=>setForm(f=>({...f,valorHoraAvulsa:Number(v)}))} helper="Cobrado por hora, sem mínimo de horas"/>
            <div style={{background:C.accentLight,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.textMid}}>
              Exemplo: 2h = <strong style={{color:C.accent}}>{fmtR(form.valorHoraAvulsa*2)}</strong>
            </div>
          </div>
          <div>
            <Field label="Mensalidade (R$/mês)" type="number" value={form.valorMensal} onChange={v=>setForm(f=>({...f,valorMensal:Number(v)}))} helper="Valor fixo independente do uso no mês"/>
          </div>
        </div>
      </Card>

      <Card style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 6px",color:C.text,fontSize:16,fontWeight:700}}>Períodos do dia</h3>
        <p style={{color:C.muted,fontSize:13,margin:"0 0 18px"}}>Cada período tem horário e valor fixo próprios. O profissional escolhe um período inteiro ao reservar.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:16}}>
          {Object.entries(form.periodos).map(([k,p])=>(
            <div key={k} style={{background:C.surfaceAlt,borderRadius:10,padding:16,border:`1px solid ${C.border}`}}>
              <Field label="Nome do período" value={p.label} onChange={v=>setPeriodo(k,"label",v)}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Field label="Início" type="time" value={p.inicio} onChange={v=>setPeriodo(k,"inicio",v)}/>
                <Field label="Fim"    type="time" value={p.fim}    onChange={v=>setPeriodo(k,"fim",v)}/>
              </div>
              <Field label="Valor fixo do período (R$)" type="number" value={p.valor||0} onChange={v=>setPeriodo(k,"valor",Number(v))} helper={`${calcHoras(p.inicio,p.fim).toFixed(0)}h de duração`}/>
              <div style={{background:C.accentLight,borderRadius:8,padding:"8px 12px",fontSize:13,color:C.accent,fontWeight:700,textAlign:"center"}}>
                {p.label}: {fmtR(p.valor||0)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 style={{margin:"0 0 12px",color:C.text,fontSize:15,fontWeight:700}}>Google Agenda</h3>
        <p style={{color:C.muted,fontSize:13,marginBottom:12}}>Para ativar a sincronização com o Google Agenda é necessário configurar OAuth 2.0 na Google Cloud Console. Entre em contato com o desenvolvedor para ativar.</p>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.warning}}/>
          <span style={{fontSize:13,color:C.muted}}>Não conectado</span>
        </div>
      </Card>
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [carregando,setCarregando]=useState(true);
  const [usuario,setUsuario]=useState(null);
  const [view,setView]=useState("dashboard");
  const [users,setUsers_]=useState(INITIAL_USERS);
  const [reservas,setReservas_]=useState([]);
  const [config,setConfig_]=useState(DEFAULT_CONFIG);

  const setUsers    = useCallback(fn=>{setUsers_(p=>{const n=typeof fn==="function"?fn(p):fn;save("users_v3",n);return n;});},[]);
  const setReservas = useCallback(fn=>{setReservas_(p=>{const n=typeof fn==="function"?fn(p):fn;save("reservas_v3",n);return n;});},[]);
  const setConfig   = useCallback(fn=>{setConfig_(p=>{const n=typeof fn==="function"?fn(p):fn;save("config_v3",n);return n;});},[]);

  useEffect(()=>{
    (async()=>{
      const u=await load("users_v3",INITIAL_USERS);
      const r=await load("reservas_v3",[]);
      const c=await load("config_v3",DEFAULT_CONFIG);
      setUsers_(u); setReservas_(r); setConfig_(c);
      setCarregando(false);
    })();
  },[]);

  const isManager=usuario?.role==="manager";

  const handleLogin=(u)=>{
    setUsuario(u);
    setView(isManager||u.role==="manager"?"dashboard":"agenda");
  };

  if(carregando) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"system-ui"}}>Carregando...</div>;
  if(!usuario)   return <LoginScreen users={users} onLogin={handleLogin}/>;

  const navManager=[
    {id:"dashboard",    icon:"📊", label:"Dashboard"},
    {id:"agenda",       icon:"📅", label:"Agenda"},
    {id:"cobrancas",    icon:"💰", label:"Cobranças"},
    {id:"profissionais",icon:"👥", label:"Profissionais"},
    {id:"configuracoes",icon:"⚙️", label:"Configurações"},
  ];
  const navPro=[
    {id:"agenda",    icon:"📅", label:"Reservar Sala"},
    {id:"pendencias",icon:"💰", label:"Minhas Pendências"},
  ];
  const navItems=isManager?navManager:navPro;

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"system-ui,-apple-system,sans-serif",display:"flex"}}>
      {/* Sidebar */}
      <div style={{width:220,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:100}}>
        <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:30,height:30,background:C.accent,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🏥</div>
            <span style={{fontWeight:800,color:C.text,fontSize:15}}>{config.nomeClinica}</span>
          </div>
          <div style={{fontSize:11,color:C.muted,paddingLeft:40}}>
            {isManager?"Gestor":usuario.name?.split(" ").slice(0,2).join(" ")}
          </div>
        </div>
        <nav style={{flex:1,padding:"8px 0"}}>
          {navItems.map(item=>{
            const active=view===item.id;
            return(
              <button key={item.id} onClick={()=>setView(item.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 20px",background:active?C.accentLight:"transparent",border:"none",borderLeft:`3px solid ${active?C.accent:"transparent"}`,cursor:"pointer",color:active?C.accent:C.textMid,fontFamily:"inherit",fontSize:14,fontWeight:active?700:500,textAlign:"left"}}>
                <span>{item.icon}</span>{item.label}
              </button>
            );
          })}
        </nav>
        <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:6}}>
            {isManager&&`Hora avulsa: ${fmtR(config.valorHoraAvulsa)}/h`}
          </div>
          <button onClick={()=>{setUsuario(null);setView("dashboard");}} style={{fontSize:13,color:C.muted,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0}}>
            ← Sair
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{marginLeft:220,flex:1,padding:32,maxWidth:"calc(100% - 220px)"}}>
        {view==="dashboard"     &&isManager&&<DashboardView     reservas={reservas} users={users} config={config}/>}
        {view==="agenda"                   &&<AgendaView        reservas={reservas} setReservas={setReservas} users={users} config={config} currentUser={usuario} isManager={isManager}/>}
        {view==="cobrancas"     &&isManager&&<CobrancasView     reservas={reservas} setReservas={setReservas} users={users}/>}
        {view==="pendencias"    &&!isManager&&<PendenciasView   reservas={reservas} currentUser={usuario}/>}
        {view==="profissionais" &&isManager&&<ProfissionaisView users={users} setUsers={setUsers}/>}
        {view==="configuracoes" &&isManager&&<ConfigView        config={config} setConfig={setConfig}/>}
      </div>
    </div>
  );
}
