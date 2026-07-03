/* eslint-disable no-restricted-globals */
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, getDoc, collection, onSnapshot, deleteDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const C = {
  bg:"#F7F4EE",white:"#FFFFFF",surface:"#FFFFFF",surfaceAlt:"#F0EBE0",border:"#DDD5C0",
  accent:"#E8A830",accentLight:"#FEF6E0",text:"#3D3228",textMid:"#5C4A3A",muted:"#9A8878",
  danger:"#C0392B",dangerLight:"#FDECEA",success:"#8BAF8A",successLight:"#EEF5EE",
  warning:"#C07A00",warningLight:"#FFF8E1",fixo:"#6B8FAF",fixoLight:"#EAF2FA",
  verde:"#8BAF8A",verdeLight:"#EEF5EE",
  mostarda:"#E8A830",mostardaLight:"#FEF6E0",
};

const DIAS_SEMANA=["dom","seg","ter","qua","qui","sex","sab"];
const DIAS_LABEL={dom:"Dom",seg:"Seg",ter:"Ter",qua:"Qua",qui:"Qui",sex:"Sex",sab:"Sáb"};
const MONTH_FULL=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTH_SHORT=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];


const LOGO_VERDE = "data:image/jpeg;base64,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+dZDgBgxkJGcHBOOOaALoAks/HDtyTJIh+gtkx/On6MSfEOklvvHQVz/AN9pVTWVudObxBYpE5fXHRbJgpKtI8YjcE9FIClue3StDVoLvR9V07U7HT7i+SKzksmigxuGdpQ4JHGVwT2zQBnW5EvgEQZx9u1F4B7iS6IP/juapXMs8Pw/tXs41kuLHU2ESMeCY5nwPyxWr/wj12th4Y0l0cw28jXF5NFJt2uEYjBBzy79vSm2elXtnpt1Z/ZZ5Ei1tZYt7bi8LSIzNknnGW6+lAEOpwfYPAWhQWTrM32izMbTZCuxdWy2OQCT2rV8Qmf7LoIuViFwdTt94iJKhuc4J5x1rNnsr+PwhZ2sljcSy6ZqEQCRqC0sMco2sozz8mPyNXtemur7T9FvrfS71vK1GOaS2KASqgDgkjOO470AHjSJL22stNbkTvK5HskLt/6FtrX8PXH2rw3pdwTkyWkTE+5UZrGmsZ/EWv2dzPbX1pYw2Mm0s5hkEruAQdpz91fpyK0PCNtdWfhWwtbyFop4EMRRuuFYhT+IANAG3RRRQAUUUUAFFFFABRRRQAUUUUAFFFFABTJpY7eCSaVtscalmb0AGSafUVzAl1bS28mfLlQo2Dg4IwaAK8Wq2MygpOu7OCjAq4OdvKnkcn0pX1WwSPf9rhYbSw2OGJAOCQB1qq/h3T3dCsbRoqBPLjO1SN27nHJ59TSHw7aNs8yW4cKoXDMOdoIXoOwYj8ec0AXTqViMf6ZByxQDzByw6j6+1SQXVvc5EMyOVALKDyuRkZHasiXwxAZIjFcSoAw3g8lkBUhB6AbRzyatWWiQafdNPbyzAsFVgzBgVAIA6dBnP4elAFLVDa69YwfZdSW1liuklt53jyC6noA2NwIyOD3rSOq2cYiEtwivI/loDwWPqB6Y5z6EVTbwxYySF3knYmUSsNwAYjGMgDHbr196T/hF7EpseW5dSMOGcfOAMAHjsPTFAGoL21McUguYdkp2xtvGHPoPWoP7XsPtE0DXKI8P+s3gqB0HU8dx+dQ/2BZeVZoQx+ysWQ4Xkk5ORjHUDsDxUNx4Y0+5uZ55PN3zNvOCMA8e3P3R1z3xQBfGqWJVi13CoXdne4XhSVJ57ZHWpobmC4LLDNHIUxuCMDjPTNZT+GLBmkZTLGZEKNtI6ZJ4yOOpGOmDirljpcFhc3M8bSNJcEFy7Z6EkY4/2j/kUAXqKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//Z";
const LOGO_AMARELO = "data:image/jpeg;base64,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";

const DEFAULT_CONFIG={
  valorHoraAvulsa:35,nomeClinica:"Casa Aquarela",horaInicio:"08:00",horaFim:"21:00",
  salas:[
    {id:"sala1",label:"Sala 1",cor:"#B5590A",corLight:"#FDEFD8"},
    {id:"sala2",label:"Sala 2",cor:"#4A7C4E",corLight:"#E8F5E9"},
  ],
  periodos:{
    manha:{label:"Manhã",inicio:"09:00",fim:"13:00",valor:100},
    tarde:{label:"Tarde",inicio:"13:00",fim:"17:00",valor:100},
    noite:{label:"Noite",inicio:"17:00",fim:"21:00",valor:120},
  },
};

const uid=()=>Math.random().toString(36).slice(2,10);
const today=()=>new Date().toISOString().slice(0,10);
const fmt=d=>d?new Date(d+"T12:00:00").toLocaleDateString("pt-BR"):"—";
const fmtR=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const diaSem=d=>DIAS_SEMANA[new Date(d+"T12:00:00").getDay()];
const calcHoras=(ini,fim)=>{const[h1,m1]=ini.split(":").map(Number),[h2,m2]=fim.split(":").map(Number);const diff=(h2*60+m2)-(h1*60+m1);return diff>0?diff/60:0;};
const horaParaMin=h=>{const[hh,mm]=h.split(":").map(Number);return hh*60+mm;};
const conflito=(reservas,nova,excludeIds=[])=>reservas.some(r=>!excludeIds.includes(r.id)&&r.date===nova.date&&r.sala===nova.sala&&horaParaMin(r.horaInicio)<horaParaMin(nova.horaFim)&&horaParaMin(r.horaFim)>horaParaMin(nova.horaInicio));
const addDays=(dateStr,days)=>{const d=new Date(dateStr+"T12:00:00");d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);};
const addMonths=(dateStr,months)=>{const d=new Date(dateStr+"T12:00:00");d.setMonth(d.getMonth()+months);return d.toISOString().slice(0,10);};

const gerarRecorrentes=(base,recorrencia)=>{
  if(!recorrencia||recorrencia==="unica")return[base];
  const resultados=[];
  const serieId=uid();
  let dataAtual=base.date;
  const dataFim=addMonths(base.date,6);
  let i=0;
  while(dataAtual<=dataFim&&i<200){
    resultados.push({...base,id:uid(),date:dataAtual,serieId,recorrencia,serieInicio:base.date,serieFim:dataFim});
    if(recorrencia==="semanal")dataAtual=addDays(dataAtual,7);
    else if(recorrencia==="quinzenal")dataAtual=addDays(dataAtual,14);
    else if(recorrencia==="mensal_rec")dataAtual=addMonths(dataAtual,1);
    else break;
    i++;
  }
  return resultados;
};



const calcMulta=(reserva)=>{
  if(!reserva.date||!reserva.horaInicio)return{multa:0,pct:0,msg:"Sem cobrança"};
  const agora=new Date();
  const dataReserva=new Date(reserva.date+"T"+reserva.horaInicio+":00");
  const diffHoras=(dataReserva-agora)/(1000*60*60);
  const valor=Number(reserva.valor||0);
  if(diffHoras>=24)return{multa:0,pct:0,msg:"Cancelamento gratuito (mais de 24h de antecedência)"};
  if(diffHoras>=12)return{multa:valor*0.5,pct:50,msg:`Cancelamento com 50% de multa (entre 12h e 24h de antecedência)`};
  if(diffHoras>0)return{multa:valor,pct:100,msg:`Cancelamento com 100% de multa (menos de 12h de antecedência)`};
  return{multa:valor,pct:100,msg:"Ausência — 100% do valor será cobrado"};
};

const vencimentoMes=(mesStr)=>{
  const [ano,mes]=mesStr.split("-").map(Number);
  const proximoMes=mes===12?1:mes+1;
  const proximoAno=mes===12?ano+1:ano;
  return `${proximoAno}-${String(proximoMes).padStart(2,"0")}-05`;
};

const cleanObj=(obj)=>Object.fromEntries(Object.entries(obj).filter(([,v])=>v!==undefined));

const Card=({children,style={}})=>(<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:20,...style}}>{children}</div>);
const Badge=({label,bg,color})=>(<span style={{background:bg,color,border:`1px solid ${color}44`,borderRadius:6,padding:"2px 9px",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{label}</span>);
const Btn=({children,onClick,variant="primary",small,style={},disabled,full})=>{
  const v={
    primary:{background:C.accent,color:"#fff",border:`1px solid ${C.accent}`},
    secondary:{background:C.white,color:C.text,border:`1px solid ${C.border}`},
    danger:{background:C.dangerLight,color:C.danger,border:`1px solid ${C.danger}44`},
    ghost:{background:"transparent",color:C.muted,border:"none"},
    success:{background:C.successLight,color:C.success,border:`1px solid ${C.success}44`},
    warning:{background:C.warningLight,color:C.warning,border:`1px solid ${C.warning}44`},
  };
  return(<button onClick={disabled?undefined:onClick} style={{...v[variant],borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontWeight:600,fontSize:small?12:14,padding:small?"5px 11px":"9px 18px",fontFamily:"inherit",opacity:disabled?0.5:1,width:full?"100%":undefined,...style}}>{children}</button>);
};
const Field=({label,value,onChange,type="text",options,placeholder,style={},helper})=>(
  <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>{label}</label>}
    {options?<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 11px",fontSize:14,fontFamily:"inherit",...style}}>{options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}</select>
    :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 11px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",...style}}/>}
    {helper&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{helper}</div>}
  </div>
);
const Modal=({title,onClose,children,wide})=>(
  <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"#00000060",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28,width:"100%",maxWidth:wide?680:500,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px #0003"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <h3 style={{margin:0,color:C.text,fontSize:18,fontWeight:700}}>{title}</h3>
        <Btn variant="ghost" small onClick={onClose}>✕</Btn>
      </div>
      {children}
    </div>
  </div>
);
const Stat=({label,value,color=C.accent,sub})=>(
  <Card style={{padding:"18px 20px"}}>
    <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{label}</div>
    <div style={{fontSize:26,fontWeight:800,color,marginBottom:sub?3:0}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:C.muted}}>{sub}</div>}
  </Card>
);
const SalaTag=({salaId,salas})=>{const s=salas?.find(x=>x.id===salaId);if(!s)return null;return<Badge label={s.label} bg={s.corLight} color={s.cor}/>;};

function LoginScreen({onLogin}){
  const[tela,setTela]=useState("login"); // login | cadastro
  const[email,setEmail]=useState("");
  const[senha,setSenha]=useState("");
  const[nome,setNome]=useState("");
  const[confirma,setConfirma]=useState("");
  const[erro,setErro]=useState("");
  const[show,setShow]=useState(false);
  const[loading,setLoading]=useState(false);

  const entrar=async()=>{
    setErro("");setLoading(true);
    try{
      await signInWithEmailAndPassword(auth,email,senha);
    }catch(e){
      setErro("E-mail ou senha incorretos.");
    }
    setLoading(false);
  };

  const cadastrar=async()=>{
    setErro("");
    if(!nome.trim())return setErro("Informe seu nome completo.");
    if(!email.trim())return setErro("Informe seu e-mail.");
    if(senha.length<6)return setErro("A senha precisa ter pelo menos 6 caracteres.");
    if(senha!==confirma)return setErro("As senhas não coincidem.");
    setLoading(true);
    try{
      const cred=await createUserWithEmailAndPassword(auth,email,senha);
      await setDoc(doc(db,"users",cred.user.uid),{
        uid:cred.user.uid,
        email:email,
        nome:nome.trim(),
        role:"professional",
        color:"#8BAF8A",
        criadoEm:new Date().toISOString()
      });
    }catch(e){
      if(e.code==="auth/email-already-in-use")setErro("Este e-mail já está cadastrado.");
      else if(e.code==="auth/weak-password")setErro("A senha precisa ter pelo menos 6 caracteres.");
      else if(e.code==="auth/invalid-email")setErro("E-mail inválido.");
      else setErro("Erro ao cadastrar. Tente novamente.");
    }
    setLoading(false);
  };

  const trocarTela=(t)=>{setTela(t);setErro("");setEmail("");setSenha("");setNome("");setConfirma("");};

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,-apple-system,sans-serif",padding:20}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <img src={LOGO_VERDE} alt="Casa Aquarela" style={{width:140,height:140,objectFit:"contain",margin:"0 auto 8px",display:"block"}}/>
          <p style={{color:C.muted,margin:0,fontSize:13}}>Agenda & Salas</p>
        </div>

        {/* Abas login/cadastro */}
        <div style={{display:"flex",background:C.surfaceAlt,borderRadius:10,padding:4,marginBottom:20}}>
          <button onClick={()=>trocarTela("login")} style={{flex:1,padding:"9px",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:14,background:tela==="login"?C.white:"transparent",color:tela==="login"?C.text:C.muted,boxShadow:tela==="login"?"0 1px 4px #00000015":"none",transition:"all 0.15s"}}>
            Entrar
          </button>
          <button onClick={()=>trocarTela("cadastro")} style={{flex:1,padding:"9px",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:14,background:tela==="cadastro"?C.white:"transparent",color:tela==="cadastro"?C.text:C.muted,boxShadow:tela==="cadastro"?"0 1px 4px #00000015":"none",transition:"all 0.15s"}}>
            Criar conta
          </button>
        </div>

        <Card>
          {tela==="login"?(
            <>
              <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com"/>
              <div style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>Senha</label>
                <div style={{position:"relative"}}>
                  <input type={show?"text":"password"} value={senha} onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==="Enter"&&entrar()} placeholder="••••••••" style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 40px 8px 11px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box"}}/>
                  <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14}}>{show?"🙈":"👁️"}</button>
                </div>
              </div>
              {erro&&<div style={{background:C.dangerLight,color:C.danger,border:`1px solid ${C.danger}33`,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:14}}>{erro}</div>}
              <Btn full onClick={entrar} disabled={loading} style={{padding:"11px 18px",fontSize:15}}>{loading?"Entrando...":"Entrar"}</Btn>
              <div style={{textAlign:"center",marginTop:12}}>
                <button onClick={async()=>{
                  if(!email){setErro("Digite seu e-mail acima primeiro.");return;}
                  try{
                    await sendPasswordResetEmail(auth,email);
                    setErro("");
                    alert("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
                  }catch(e){
                    setErro("E-mail não encontrado.");
                  }
                }} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,textDecoration:"underline",padding:0}}>
                  Esqueci minha senha
                </button>
              </div>
            </>
          ):(
            <>
              <Field label="Nome completo *" value={nome} onChange={setNome} placeholder="Nome Sobrenome"/>
              <Field label="E-mail *" type="email" value={email} onChange={setEmail} placeholder="seu@email.com"/>
              <div style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>Senha *</label>
                <div style={{position:"relative"}}>
                  <input type={show?"text":"password"} value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 40px 8px 11px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box"}}/>
                  <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14}}>{show?"🙈":"👁️"}</button>
                </div>
              </div>
              <Field label="Confirmar senha *" type="password" value={confirma} onChange={setConfirma} placeholder="Repita a senha"/>
              {erro&&<div style={{background:C.dangerLight,color:C.danger,border:`1px solid ${C.danger}33`,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:14}}>{erro}</div>}
              <Btn full onClick={cadastrar} disabled={loading} style={{padding:"11px 18px",fontSize:15}}>{loading?"Cadastrando...":"Criar minha conta"}</Btn>
              <p style={{textAlign:"center",color:C.muted,fontSize:12,margin:"12px 0 0"}}>Ao criar uma conta você concorda com as regras de uso da Casa Aquarela.</p>
            </>
          )}
        </Card>
        <p style={{textAlign:"center",color:C.muted,fontSize:12,marginTop:16}}>
          {tela==="login"?"Não tem conta? ":"Já tem conta? "}
          <button onClick={()=>trocarTela(tela==="login"?"cadastro":"login")} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,padding:0}}>
            {tela==="login"?"Criar conta":"Fazer login"}
          </button>
        </p>
      </div>
    </div>
  );
}

function ModalExcluir({reserva,onClose,onConfirm}){
  const[opcao,setOpcao]=useState("somente");
  const temSerie=!!reserva.serieId;
  return(
    <Modal title="Excluir reserva" onClose={onClose}>
      {temSerie&&(
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>O que deseja excluir?</label>
          {[["somente","Somente esta reserva"],["proximos","Esta e as próximas da série"],["todos","Todas as reservas desta série"]].map(([v,l])=>(
            <label key={v} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",border:`1px solid ${opcao===v?C.accent:C.border}`,borderRadius:8,marginBottom:8,cursor:"pointer",background:opcao===v?C.accentLight:C.white}}>
              <input type="radio" checked={opcao===v} onChange={()=>setOpcao(v)} style={{accentColor:C.accent}}/>
              <span style={{fontSize:14,color:C.text}}>{l}</span>
            </label>
          ))}
        </div>
      )}
      {!temSerie&&<p style={{color:C.textMid,fontSize:14,marginBottom:16}}>Confirma a exclusão desta reserva?</p>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn variant="danger" onClick={()=>onConfirm(opcao)}>Excluir</Btn>
      </div>
    </Modal>
  );
}

function ModalReserva({onClose,onSave,reservas,config,userProfile,editando,inicial}){
  const base=editando||inicial||{};
  const isEdit=!!editando;
  const salas=config.salas||[];
  const periodos=config.periodos;
  const[sala,setSala]=useState(base.sala||salas[0]?.id||"sala1");
  const[data,setData]=useState(base.date||today());
  const[modo,setModo]=useState(base.modo||"avulsa");
  const[periodo,setPeriodo]=useState(base.periodo||"manha");
  const[hIni,setHIni]=useState(base.horaInicio||"09:00");
  const[hFim,setHFim]=useState(base.horaFim||"10:00");
  const[mesMensal,setMesMensal]=useState(base.mesMensal||today().slice(0,7));
  const[recorrencia,setRecorrencia]=useState(base.recorrencia||"unica");
  const[modalidade,setModalidade]=useState(base.modalidade||"presencial");
  const[mensal,setMensal]=useState(base.modo==="mensal");
  const[notes,setNotes]=useState(base.notes||"");
  const[erro,setErro]=useState("");

  const hStart=horaParaMin(config.horaInicio||"08:00");
  const hEnd=horaParaMin(config.horaFim||"21:00");
  const horaOptions=[];
  for(let m=hStart;m<=hEnd;m+=30){const hh=Math.floor(m/60),mn=m%60;const ts=String(hh).padStart(2,"0")+":"+String(mn).padStart(2,"0");horaOptions.push({value:ts,label:ts});}

  let horaInicio="",horaFim="",valor=0,resumoValor="";
  if(!mensal){
    if(modo==="avulsa"){horaInicio=hIni;horaFim=hFim;const h=calcHoras(hIni,hFim);valor=+(h*config.valorHoraAvulsa).toFixed(2);resumoValor=fmtR(valor);}
    else if(modo==="periodo"){const p=periodos[periodo];horaInicio=p.inicio;horaFim=p.fim;valor=Number(p.valor||0);resumoValor=fmtR(valor);}
  } else {horaInicio="00:00";horaFim="23:59";valor=0;resumoValor="A combinar com gestores";}

  const salvar=()=>{
    setErro("");
    if(!mensal&&!data)return setErro("Preencha a data.");
    if(!sala)return setErro("Selecione uma sala.");
    if(!mensal&&modo==="avulsa"&&horaParaMin(hFim)<=horaParaMin(hIni))return setErro("Horário de fim deve ser após o início.");
    const dadosBase={
      id:isEdit?editando.id:uid(),
      date:mensal?today():data,sala,horaInicio,horaFim,
      modo:mensal?"mensal":modo,
      periodo:modo==="periodo"&&!mensal?periodo:null,
      mesMensal:mensal?mesMensal:null,
      valor:valor||0,userId:userProfile.uid,userName:userProfile.displayName||userProfile.nome||userProfile.email||"",userColor:userProfile.color||"#B5590A",
      notes:notes||"",pago:false,modalidade:modalidade||"presencial",
      recorrencia:mensal?"unica":recorrencia||"unica",
      serieId:null,serieInicio:null,serieFim:null
    };
    if(!mensal&&!isEdit){
      const nova={date:data,sala,horaInicio,horaFim};
      if(conflito(reservas,nova,[]))return setErro("Já existe uma reserva nessa sala nesse horário.");
    }
    const geradas=isEdit?[dadosBase]:gerarRecorrentes(dadosBase,mensal?"unica":recorrencia);
    onSave(geradas,isEdit);
    onClose();
  };

  const modoBtn=(m,label,sub)=>(<button onClick={()=>{setModo(m);setMensal(false);}} style={{flex:1,padding:"10px 8px",border:`2px solid ${!mensal&&modo===m?C.accent:C.border}`,borderRadius:10,background:!mensal&&modo===m?C.accentLight:C.white,cursor:"pointer",fontFamily:"inherit"}}><div style={{fontWeight:700,fontSize:13,color:!mensal&&modo===m?C.accent:C.text}}>{label}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div></button>);

  return(
    <Modal title={isEdit?"Editar Reserva":"Nova Reserva"} onClose={onClose}>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Sala</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {salas.map(s=>(<button key={s.id} onClick={()=>setSala(s.id)} style={{flex:1,minWidth:80,padding:"10px",border:`2px solid ${sala===s.id?s.cor:C.border}`,borderRadius:10,background:sala===s.id?s.corLight:C.white,cursor:"pointer",fontFamily:"inherit",fontWeight:700,color:sala===s.id?s.cor:C.textMid,fontSize:14}}>{s.label}</button>))}
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Modalidade</label>
        <div style={{display:"flex",gap:8}}>
          {[["presencial","🏢 Presencial"],["online","💻 Online"]].map(([v,l])=>(<button key={v} onClick={()=>setModalidade(v)} style={{flex:1,padding:"9px",border:`2px solid ${modalidade===v?C.accent:C.border}`,borderRadius:10,background:modalidade===v?C.accentLight:C.white,cursor:"pointer",fontFamily:"inherit",fontWeight:700,color:modalidade===v?C.accent:C.textMid,fontSize:13}}>{l}</button>))}
        </div>
      </div>
      {!mensal&&(<>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Tipo de reserva</label>
          <div style={{display:"flex",gap:8}}>{modoBtn("avulsa","Hora Avulsa",fmtR(config.valorHoraAvulsa)+"/h")}{modoBtn("periodo","Período","valor por período")}</div>
        </div>
        <Field label="Data" type="date" value={data} onChange={setData}/>
        {modo==="avulsa"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Início" value={hIni} onChange={setHIni} options={horaOptions}/><Field label="Fim" value={hFim} onChange={setHFim} options={horaOptions}/></div>}
        {modo==="periodo"&&(<div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Período</label>
          <div style={{display:"flex",gap:8}}>{Object.entries(periodos).map(([k,p])=>(<button key={k} onClick={()=>setPeriodo(k)} style={{flex:1,padding:"10px 8px",border:`2px solid ${periodo===k?C.accent:C.border}`,borderRadius:10,background:periodo===k?C.accentLight:C.white,cursor:"pointer",fontFamily:"inherit"}}><div style={{fontWeight:700,fontSize:13,color:periodo===k?C.accent:C.text}}>{p.label}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{p.inicio}–{p.fim}</div><div style={{fontSize:12,color:periodo===k?C.accent:C.textMid,fontWeight:600,marginTop:2}}>{fmtR(p.valor)}</div></button>))}</div>
        </div>)}
        {!isEdit&&<Field label="Recorrência" value={recorrencia} onChange={setRecorrencia} options={[{value:"unica",label:"Não se repete"},{value:"semanal",label:"Toda semana (por 6 meses)"},{value:"quinzenal",label:"A cada 2 semanas (por 6 meses)"},{value:"mensal_rec",label:"Todo mês (por 6 meses)"}]}/>}
        <div style={{background:C.accentLight,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:14,color:C.text,fontWeight:600}}>
          {resumoValor}
          {recorrencia!=="unica"&&<span style={{color:C.warning,marginLeft:8,fontWeight:500,fontSize:12}}>· até {fmt(addMonths(data,6))}</span>}
        </div>
      </>)}
      <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",border:`1px solid ${mensal?C.accent:C.border}`,borderRadius:10,cursor:"pointer",background:mensal?C.accentLight:C.white,marginBottom:14}}>
        <input type="checkbox" checked={mensal} onChange={e=>setMensal(e.target.checked)} style={{accentColor:C.accent,width:16,height:16}}/>
        <div><div style={{fontWeight:700,fontSize:14,color:mensal?C.accent:C.text}}>Mensalidade fixa</div><div style={{fontSize:12,color:C.muted}}>Valor a combinar com os gestores</div></div>
      </label>
      {mensal&&<Field label="Mês de referência" type="month" value={mesMensal} onChange={setMesMensal}/>}
      <Field label="Observações" value={notes} onChange={setNotes} placeholder="Opcional..."/>
      {erro&&<div style={{background:C.dangerLight,color:C.danger,border:`1px solid ${C.danger}33`,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:12}}>{erro}</div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={onClose}>Cancelar</Btn><Btn onClick={salvar}>Confirmar Reserva</Btn></div>
    </Modal>
  );
}

function GradeSemanal({reservas,users,semanaBase,onSlotClick,onBlockClick,config}){
  const salas=config.salas||[];
  const hStart=horaParaMin(config.horaInicio||"08:00");
  const hEnd=horaParaMin(config.horaFim||"21:00");
  const horas=[];
  for(let m=hStart;m<hEnd;m+=60)horas.push(m/60);
  const dias=Array.from({length:7},(_,i)=>{const d=new Date(semanaBase);d.setDate(d.getDate()+i);return d.toISOString().slice(0,10);});
  const getR=(dia,h,salaId)=>reservas.filter(r=>r.date===dia&&r.sala===salaId&&horaParaMin(r.horaInicio)<=h*60&&horaParaMin(r.horaFim)>h*60);
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,tableLayout:"fixed"}}>
        <thead>
          <tr>
            <th style={{width:44,borderBottom:`2px solid ${C.border}`}}></th>
            {dias.map(d=>{const isT=d===today();return<th key={d} colSpan={salas.length} style={{padding:"5px 3px",textAlign:"center",borderBottom:`2px solid ${C.border}`,color:isT?C.accent:C.textMid,fontWeight:isT?800:600}}><div>{DIAS_LABEL[diaSem(d)]}</div><div style={{fontSize:10,color:C.muted}}>{d.slice(8)}/{d.slice(5,7)}</div></th>;})}
          </tr>
          <tr>
            <th></th>
            {dias.map(d=>salas.map(s=>(<th key={d+s.id} style={{padding:"3px 2px",textAlign:"center",fontSize:10,fontWeight:700,color:s.cor,background:s.corLight,borderBottom:`1px solid ${C.border}`}}>{s.label.replace("Sala ","S")}</th>)))}
          </tr>
        </thead>
        <tbody>
          {horas.map(h=>(
            <tr key={h}>
              <td style={{padding:"2px 5px",color:C.muted,fontSize:10,textAlign:"right",verticalAlign:"top",paddingTop:4}}>{String(h).padStart(2,"0")}:00</td>
              {dias.map(d=>salas.map(sala=>{
                const rs=getR(d,h,sala.id);const r=rs[0];
                const isFirst=r&&horaParaMin(r.horaInicio)===h*60;
                const nome=r?.userName||"—";
                const corPro=r?.userColor||sala.cor;
                const corProLight=r?.userColorLight||(corPro+"22");
                return(
                  <td key={d+sala.id+h}
                    onClick={r ? ()=>onBlockClick&&onBlockClick(r) : ()=>onSlotClick(d,h,sala.id)}
                    title={r ? (r.userName + " · " + r.horaInicio + "–" + r.horaFim) : "Clique para reservar"}
                    style={{border:`1px solid ${corPro}44`,padding:0,verticalAlign:"top",height:26,
                      background:r?corPro:C.surfaceAlt,
                      cursor:r?"pointer":"cell",
                      opacity:r?.status==="cancelado"?0.4:1}}>
                    {isFirst&&(
                      <div style={{background:"rgba(0,0,0,0.18)",color:"#fff",padding:"2px 4px",fontSize:9,fontWeight:700,lineHeight:1.3,overflow:"hidden",whiteSpace:"nowrap"}}>
                        {nome.split(" ").slice(0,2).join(" ")}{r.recorrencia&&r.recorrencia!=="unica"?" ↻":""}{r.modalidade==="online"?" 💻":""}
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

function AlertasVencimento({reservas}){
  const hoje=today();const em30=addDays(hoje,30);
  const series={};
  reservas.forEach(r=>{if(r.serieId&&r.serieFim){if(!series[r.serieId]||r.serieFim>series[r.serieId].serieFim)series[r.serieId]=r;}});
  const vencendo=Object.values(series).filter(r=>r.serieFim>=hoje&&r.serieFim<=em30);
  if(!vencendo.length)return null;
  return(
    <div style={{background:C.warningLight,border:`1px solid ${C.warning}44`,borderRadius:10,padding:"12px 16px",marginBottom:20}}>
      <div style={{fontWeight:700,color:C.warning,marginBottom:6,fontSize:14}}>⚠️ Recorrências vencendo em 30 dias</div>
      {vencendo.map(r=>(<div key={r.serieId} style={{fontSize:13,color:C.textMid,marginBottom:2}}>
        Série de <strong>{r.userName}</strong> — iniciada em {fmt(r.serieInicio)}, vence em <strong>{fmt(r.serieFim)}</strong>
      </div>))}
    </div>
  );
}



function ModalAcoes({reserva,onClose,onEditar,onCancelar,onExcluir,isManager,salas}){
  const valor=Number(reserva.valor||0);
  const{pct,msg}=calcMulta(reserva);
  const cancelado=reserva.status==="cancelado";
  return(
    <Modal title="Reserva" onClose={onClose}>
      {/* Detalhes da reserva */}
      <div style={{background:C.surfaceAlt,borderRadius:10,padding:14,marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:6}}>{reserva.userName}</div>
        <div style={{fontSize:13,color:C.textMid,marginBottom:3}}>📅 {fmt(reserva.date)} · {reserva.horaInicio}–{reserva.horaFim}</div>
        <div style={{fontSize:13,color:C.textMid,marginBottom:3}}>🏢 {salas?.find(s=>s.id===reserva.sala)?.label||reserva.sala}</div>
        <div style={{fontSize:13,color:C.textMid,marginBottom:3}}>{reserva.modalidade==="online"?"💻 Online":"🏢 Presencial"}</div>
        <div style={{fontSize:14,fontWeight:700,color:C.text,marginTop:8}}>{valor?fmtR(valor):"A combinar"}</div>
      </div>

      {cancelado?(
        <div style={{background:C.dangerLight,border:`1px solid ${C.danger}44`,borderRadius:10,padding:12,marginBottom:16,textAlign:"center",color:C.danger,fontWeight:600}}>
          ✕ Reserva cancelada
        </div>
      ):(
        <>
          <div style={{background:pct===0?C.successLight:C.warningLight,border:`1px solid ${pct===0?C.success:C.warning}44`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13}}>
            <span style={{fontWeight:600,color:pct===0?C.success:C.warning}}>
              {pct===0?"✓ Sem multa agora":`⚠️ Cancelar agora = multa de ${pct}% (${fmtR(Number(reserva.valor||0)*pct/100)})`}
            </span>
            <div style={{color:C.textMid,fontSize:12,marginTop:2}}>{msg}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Btn variant="danger" full onClick={onCancelar}>
              ✕ Cancelar reserva{reserva.serieId?" (escolher escopo)":""}
            </Btn>
            <Btn variant="secondary" full onClick={onEditar}>
              ✏️ Editar horário / sala
            </Btn>
            {isManager&&reserva.serieId&&(
              <Btn variant="warning" full onClick={onExcluir}>
                🗑️ Excluir (escolher escopo da série)
              </Btn>
            )}
          </div>
        </>
      )}

      <div style={{marginTop:12}}>
        <Btn variant="ghost" full onClick={onClose}>Fechar</Btn>
      </div>
    </Modal>
  );
}

function ModalCancelamento({reserva,onClose,onConfirm}){
  const{multa,pct,msg}=calcMulta(reserva);
  const valor=Number(reserva.valor||0);
  const temSerie=!!reserva.serieId;
  const[escopo,setEscopo]=useState("somente");

  return(
    <Modal title="Cancelar Reserva" onClose={onClose}>
      <div style={{background:C.surfaceAlt,borderRadius:10,padding:14,marginBottom:14}}>
        <div style={{fontSize:13,color:C.textMid,marginBottom:4}}>
          <strong>{fmt(reserva.date)}</strong> · {reserva.horaInicio}–{reserva.horaFim}
        </div>
        <div style={{fontSize:13,color:C.textMid}}>Valor: <strong>{fmtR(valor)}</strong></div>
      </div>

      {temSerie&&(
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>O que deseja cancelar?</label>
          {[
            ["somente","Somente este horário","Cancela apenas esta data específica"],
            ["proximos","Este e todos os seguintes","Cancela esta data e todas as futuras da série"],
          ].map(([v,l,sub])=>(
            <label key={v} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",border:`1px solid ${escopo===v?C.danger:C.border}`,borderRadius:8,marginBottom:8,cursor:"pointer",background:escopo===v?C.dangerLight:C.white}}>
              <input type="radio" checked={escopo===v} onChange={()=>setEscopo(v)} style={{accentColor:C.danger,marginTop:2}}/>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:C.text}}>{l}</div>
                <div style={{fontSize:12,color:C.muted}}>{sub}</div>
              </div>
            </label>
          ))}
        </div>
      )}

      <div style={{background:pct===0?C.successLight:C.dangerLight,border:`1px solid ${pct===0?C.success:C.danger}44`,borderRadius:10,padding:12,marginBottom:14}}>
        <div style={{fontWeight:700,color:pct===0?C.success:C.danger,fontSize:14}}>
          {pct===0?"✓ Sem multa":`⚠️ Multa de ${pct}% = ${fmtR(multa)}`}
          {escopo==="proximos"&&multa>0&&<span style={{fontSize:12,fontWeight:400}}> (por reserva cancelada)</span>}
        </div>
        <div style={{fontSize:12,color:C.textMid,marginTop:2}}>{msg}</div>
      </div>

      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onClose}>Voltar</Btn>
        <Btn variant="danger" onClick={()=>onConfirm(multa,escopo)}>Confirmar Cancelamento</Btn>
      </div>
    </Modal>
  );
}

function AgendaView({reservas,setReservas,userProfile,config,isManager}){
  const[semOff,setSemOff]=useState(0);
  const[modalAberto,setModalAberto]=useState(false);
  const[editando,setEditando]=useState(null);
  const[excluindo,setExcluindo]=useState(null);
  const[cancelando,setCancelando]=useState(null);
  const[acoes,setAcoes]=useState(null);
  const[slotPre,setSlotPre]=useState(null);
  const[viewMode,setViewMode]=useState("semana");
  const[filtroDt,setFiltroDt]=useState("");
  const salas=config.salas||[];
  const[dataSelecionada,setDataSelecionada]=useState(today());
  const semanaBase=(()=>{
    const base=new Date(dataSelecionada+"T12:00:00");
    base.setDate(base.getDate()-base.getDay()+1);
    const d=new Date(base);
    d.setDate(d.getDate()+semOff*7);
    return d.toISOString().slice(0,10);
  })();

  const minhasReservas=isManager?reservas:reservas.filter(r=>r.userId===userProfile.uid);
  const lista=minhasReservas.filter(r=>!filtroDt||r.date===filtroDt).sort((a,b)=>(a.date+a.horaInicio).localeCompare(b.date+b.horaInicio));

  const abrirNovo=(date,hora,salaId)=>{
    const hh=hora!=null?String(Math.floor(hora)).padStart(2,"0")+":00":"09:00";
    const hf=hora!=null?String(Math.floor(hora)+1).padStart(2,"0")+":00":"10:00";
    setSlotPre({date:date||today(),horaInicio:hh,horaFim:hf,sala:salaId||salas[0]?.id});
    setEditando(null);setModalAberto(true);
  };
  const abrirEditar=(r)=>{
    if(!r) return;
    const isOwn=r.userId===userProfile.uid;
    if(isManager||isOwn){
      setAcoes(r);
    }
    // se não é dono e não é gestor: não abre nada
  };
  const salvarReservas=async(geradas,isEdit)=>{
    if(isEdit){
      // verifica se tem permissão
      if(!isManager&&editando.userId!==userProfile.uid){
        alert("Você não tem permissão para editar esta reserva.");return;
      }
      // verifica conflito excluindo a própria reserva
      const nova={date:geradas[0].date,sala:geradas[0].sala,horaInicio:geradas[0].horaInicio,horaFim:geradas[0].horaFim};
      if(conflito(reservas,nova,[editando.id])){
        alert("Já existe uma reserva nessa sala nesse horário.");return;
      }
      // salva histórico de edição
      await setDoc(doc(db,"historico",uid()),cleanObj({
        tipo:"edicao",reservaId:editando.id,
        userId:userProfile.uid,userName:userProfile.nome||userProfile.email,
        antes:{date:editando.date,horaInicio:editando.horaInicio,horaFim:editando.horaFim,sala:editando.sala},
        depois:{date:geradas[0].date,horaInicio:geradas[0].horaInicio,horaFim:geradas[0].horaFim,sala:geradas[0].sala},
        editadoEm:new Date().toISOString()
      }));
      await setDoc(doc(db,"reservas",editando.id),cleanObj(geradas[0]));
      setReservas(prev=>prev.map(r=>r.id===editando.id?geradas[0]:r));
    } else {
      // verifica conflito para cada reserva gerada
      for(const g of geradas){
        if(g.modo!=="mensal"){
          const nova={date:g.date,sala:g.sala,horaInicio:g.horaInicio,horaFim:g.horaFim};
          if(conflito(reservas,nova,[])){
            alert(`Conflito detectado em ${fmt(g.date)} ${g.horaInicio}–${g.horaFim} na ${g.sala}. Reserva não criada para este horário.`);
            continue;
          }
        }
        await setDoc(doc(db,"reservas",g.id),cleanObj(g));
        setReservas(prev=>[...prev,g]);
      }
    }
  };
  const confirmarExcluir=async(opcao)=>{
    const r=excluindo;
    let ids=[];
    if(opcao==="somente")ids=[r.id];
    else if(opcao==="proximos")ids=reservas.filter(x=>x.serieId===r.serieId&&x.date>=r.date).map(x=>x.id);
    else if(opcao==="todos")ids=reservas.filter(x=>x.serieId===r.serieId).map(x=>x.id);
    else ids=[r.id];
    for(const id of ids)await deleteDoc(doc(db,"reservas",id));
    setReservas(prev=>prev.filter(x=>!ids.includes(x.id)));
    setExcluindo(null);
  };

  const confirmarCancelamento=async(multa,escopo="somente")=>{
    const r=cancelando;
    // Define quais reservas cancelar
    let paraCancel=[r];
    if(escopo==="proximos"&&r.serieId){
      paraCancel=reservas.filter(x=>x.serieId===r.serieId&&x.date>=r.date);
    }
    // Cancela cada reserva
    for(const res of paraCancel){
      const multaRes=escopo==="proximos"?calcMulta(res).multa:multa;
      // Salva histórico
      await setDoc(doc(db,"historico",uid()),cleanObj({
        tipo:"cancelamento",reservaId:res.id,
        userId:res.userId,userName:res.userName,
        sala:res.sala,date:res.date,
        horaInicio:res.horaInicio,horaFim:res.horaFim,
        valor:res.valor||0,multa:multaRes||0,
        canceladoEm:new Date().toISOString(),
        escopo:escopo
      }));
      // Remove da agenda
      await deleteDoc(doc(db,"reservas",res.id));
      // Lança multa se houver
      if(multaRes>0){
        await setDoc(doc(db,"lancamentos",uid()),cleanObj({
          userId:res.userId,userName:res.userName,
          tipo:"multa_cancelamento",valor:multaRes,pago:false,
          date:res.date,
          descricao:`Multa de cancelamento - ${fmt(res.date)} ${res.horaInicio}–${res.horaFim}`,
          criadoEm:new Date().toISOString()
        }));
      }
    }
    setReservas(prev=>prev.filter(x=>!paraCancel.find(r=>r.id===x.id)));
    setCancelando(null);
  };

  const togglePago=async(id)=>{
    const r=reservas.find(x=>x.id===id);if(!r)return;
    const updated={...r,pago:!r.pago};
    await setDoc(doc(db,"reservas",id),updated);
    setReservas(prev=>prev.map(x=>x.id===id?updated:x));
  };

  const modoLabel={avulsa:"Hora Avulsa",periodo:"Período",mensal:"Mensal"};
  const recLabel={unica:"",semanal:"↻ Semanal",quinzenal:"↻ Quinzenal",mensal_rec:"↻ Mensal"};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <h2 style={{margin:0,color:C.text,fontSize:22,fontWeight:800}}>Agenda de Salas</h2>
        <div style={{display:"flex",gap:8}}>
          <Btn variant={viewMode==="semana"?"primary":"secondary"} small onClick={()=>setViewMode("semana")}>Grade</Btn>
          <Btn variant={viewMode==="lista"?"primary":"secondary"} small onClick={()=>setViewMode("lista")}>Lista</Btn>
          <Btn onClick={()=>abrirNovo()}>+ Reservar Sala</Btn>
        </div>
      </div>
      <AlertasVencimento reservas={isManager?reservas:reservas.filter(r=>r.userId===userProfile.uid)}/>
      {viewMode==="semana"&&(
        <Card style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:10}}>
            <Btn variant="secondary" small onClick={()=>setSemOff(o=>o-1)}>← Anterior</Btn>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontWeight:700,color:C.text,fontSize:14}}>Semana de {fmt(semanaBase)}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <label style={{fontSize:12,color:C.muted,fontWeight:500}}>Ir para:</label>
                <input type="date" value={dataSelecionada} onChange={e=>{setDataSelecionada(e.target.value);setSemOff(0);}}
                  style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"4px 8px",fontSize:13,fontFamily:"inherit",cursor:"pointer"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn variant="secondary" small onClick={()=>{setSemOff(0);setDataSelecionada(today());}}>Hoje</Btn>
              <Btn variant="secondary" small onClick={()=>setSemOff(o=>o+1)}>Próxima →</Btn>
            </div>
          </div>
          <GradeSemanal reservas={reservas} semanaBase={semanaBase} onSlotClick={abrirNovo} onBlockClick={abrirEditar} config={config}/>
          <div style={{display:"flex",gap:12,marginTop:12,flexWrap:"wrap"}}>
            {salas.map(s=>(<div key={s.id} style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:12,height:12,borderRadius:3,background:s.cor}}/><span style={{fontSize:12,color:C.textMid}}>{s.label}</span></div>))}
            <div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:12,height:12,borderRadius:3,background:C.surfaceAlt,border:`1px solid ${C.border}`}}/><span style={{fontSize:12,color:C.muted}}>Clique para reservar</span></div>
          </div>
        </Card>
      )}
      {viewMode==="lista"&&(
        <Card style={{marginBottom:20}}>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <div style={{width:160}}><Field label="Filtrar por data" type="date" value={filtroDt} onChange={setFiltroDt}/></div>
            {filtroDt&&<div style={{display:"flex",alignItems:"flex-end",paddingBottom:14}}><Btn variant="ghost" small onClick={()=>setFiltroDt("")}>Limpar</Btn></div>}
          </div>
          {lista.length===0&&<p style={{color:C.muted,margin:0}}>Nenhuma reserva encontrada.</p>}
          {lista.map(r=>{
            const isOwn=r.userId===userProfile.uid;
            const cancelado=r.status==="cancelado";
            return(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`1px solid ${C.border}`,opacity:cancelado?0.6:1}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text}}>{r.userName}</div>
                  <div style={{fontSize:12,color:C.textMid}}>{fmt(r.date)} · {r.horaInicio}–{r.horaFim} {r.modalidade==="online"?"💻":""}</div>
                  {cancelado&&r.multa>0&&<div style={{fontSize:11,color:C.danger,fontWeight:600}}>Multa: {fmtR(r.multa)}</div>}
                </div>
                <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                  <SalaTag salaId={r.sala} salas={salas}/>
                  <Badge label={modoLabel[r.modo]||r.modo} bg={C.accentLight} color={C.accent}/>
                  {r.recorrencia&&r.recorrencia!=="unica"&&<Badge label={recLabel[r.recorrencia]||"↻"} bg={C.fixoLight} color={C.fixo}/>}
                  {cancelado
                    ? <Badge label="Cancelado" bg={C.dangerLight} color={C.danger}/>
                    : <Badge label={r.pago?"Pago":"Pendente"} bg={r.pago?C.successLight:C.warningLight} color={r.pago?C.success:C.warning}/>
                  }
                  <span style={{fontSize:14,fontWeight:700,color:C.text}}>{r.valor?fmtR(r.valor):"A combinar"}</span>
                  {isManager&&!cancelado&&<Btn variant="success" small onClick={()=>togglePago(r.id)}>{r.pago?"✓ Pago":"Marcar Pago"}</Btn>}
                  {(isManager||isOwn)&&!cancelado&&<Btn variant="secondary" small onClick={()=>setAcoes(r)}>Ver opções</Btn>}
                  {isManager&&<Btn variant="danger" small onClick={()=>setExcluindo(r)}>✕</Btn>}
                </div>
              </div>
            );
          })}
        </Card>
      )}
      {modalAberto&&editando&&<ModalReserva onClose={()=>{setModalAberto(false);setEditando(null);}} onSave={salvarReservas} reservas={reservas} config={config} userProfile={userProfile} editando={editando} inicial={null}/>}
      {modalAberto&&!editando&&<ModalReserva onClose={()=>{setModalAberto(false);setSlotPre(null);}} onSave={salvarReservas} reservas={reservas} config={config} userProfile={userProfile} editando={null} inicial={slotPre}/>}
      {excluindo&&<ModalExcluir reserva={excluindo} onClose={()=>setExcluindo(null)} onConfirm={confirmarExcluir}/>}
      {cancelando&&<ModalCancelamento reserva={cancelando} onClose={()=>setCancelando(null)} onConfirm={confirmarCancelamento}/>}
      {acoes&&<ModalAcoes reserva={acoes} salas={salas} isManager={isManager}
        onClose={()=>setAcoes(null)}
        onCancelar={()=>{setCancelando(acoes);setAcoes(null);}}
        onEditar={()=>{setEditando(acoes);setSlotPre(null);setModalAberto(true);setAcoes(null);}}
        onExcluir={()=>{setExcluindo(acoes);setAcoes(null);}}
      />}
    </div>
  );
}

function PendenciasView({userProfile,config}){
  const salas=config.salas||[];
  const[lancamentos,setLancamentos]=useState([]);
  const[minhas,setMinhas]=useState([]);

  useEffect(()=>{
    // Busca reservas em tempo real do Firebase
    const unsubR=onSnapshot(collection(db,"reservas"),snap=>{
      const todas=snap.docs.map(d=>({id:d.id,...d.data()}));
      setMinhas(todas.filter(r=>r.userId===userProfile.uid).sort((a,b)=>b.date.localeCompare(a.date)));
    });
    // Busca lançamentos (multas) em tempo real
    const unsubL=onSnapshot(collection(db,"lancamentos"),snap=>{
      setLancamentos(snap.docs.map(d=>({id:d.id,...d.data()})).filter(l=>l.userId===userProfile.uid));
    });
    return()=>{unsubR();unsubL();};
  },[userProfile.uid]);
  const modoLabel={avulsa:"Hora Avulsa",periodo:"Período",mensal:"Mensal"};

  const totalReservas=minhas.reduce((s,r)=>s+Number(r.valor||0),0);
  const multasPendentes=lancamentos.filter(l=>!l.pago&&l.valor>0).reduce((s,l)=>s+Number(l.valor||0),0);
  const multasPagas=lancamentos.filter(l=>l.pago).reduce((s,l)=>s+Number(l.valor||0),0);
  const totalPendente=minhas.filter(r=>!r.pago).reduce((s,r)=>s+Number(r.valor||0),0)+multasPendentes;

  return(
    <div>
      <h2 style={{margin:"0 0 24px",color:C.text,fontSize:22,fontWeight:800}}>Minhas Pendências</h2>
      <AlertasVencimento reservas={minhas}/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:24}}>
        <Stat label="Total a pagar" value={fmtR(totalPendente)} color={C.warning}/>
        <Stat label="Reservas" value={fmtR(totalReservas)} color={C.text} sub="valor total"/>
        {multasPendentes>0&&<Stat label="Multas pendentes" value={fmtR(multasPendentes)} color={C.danger}/>}
        {multasPagas>0&&<Stat label="Multas pagas" value={fmtR(multasPagas)} color={C.muted}/>}
      </div>

      {/* Multas */}
      {lancamentos.length>0&&(
        <Card style={{marginBottom:16,border:`1px solid ${C.danger}33`}}>
          <h3 style={{margin:"0 0 14px",color:C.danger,fontSize:15,fontWeight:700}}>⚠️ Multas por cancelamento</h3>
          {lancamentos.map(l=>(
            <div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>{l.descricao}</div>
                {l.justificativa&&<div style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>📝 {l.justificativa}</div>}
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:800,color:l.valor===0?C.muted:C.danger}}>
                  {l.valor===0?"Dispensada":fmtR(l.valor)}
                </div>
                <Badge label={l.pago||l.valor===0?"✓ Quitada":"Pendente"} bg={l.pago||l.valor===0?C.successLight:C.dangerLight} color={l.pago||l.valor===0?C.success:C.danger}/>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Reservas */}
      <Card>
        <h3 style={{margin:"0 0 14px",color:C.text,fontSize:15,fontWeight:700}}>📅 Minhas reservas</h3>
        {minhas.length===0&&<p style={{color:C.muted,margin:0}}>Você ainda não tem reservas.</p>}
        {minhas.map(r=>(<div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:C.text}}>{fmt(r.date)} · {r.horaInicio}–{r.horaFim} {r.modalidade==="online"?"💻":""}</div>
            <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>
              <SalaTag salaId={r.sala} salas={salas}/>
              <Badge label={modoLabel[r.modo]||r.modo} bg={C.accentLight} color={C.accent}/>
              {r.recorrencia&&r.recorrencia!=="unica"&&<Badge label="↻ Recorrente" bg={C.fixoLight} color={C.fixo}/>}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:15,fontWeight:800,color:C.text}}>{r.valor?fmtR(r.valor):"A combinar"}</div>
            <Badge label={r.pago?"✓ Pago":"Pendente"} bg={r.pago?C.successLight:C.warningLight} color={r.pago?C.success:C.warning}/>
          </div>
        </div>))}
      </Card>
    </div>
  );
}

function DashboardView({reservas,config}){
  const salas=config.salas||[];
  const mes=today().slice(0,7);
  const mesRes=reservas.filter(r=>r.date?.slice(0,7)===mes||(r.modo==="mensal"&&r.mesMensal===mes));
  const totalValor=mesRes.reduce((s,r)=>s+Number(r.valor||0),0);
  const totalPago=mesRes.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const hojRes=reservas.filter(r=>r.date===today()).sort((a,b)=>a.horaInicio.localeCompare(b.horaInicio));
  const nomes={};reservas.forEach(r=>{if(r.userId&&r.userName)nomes[r.userId]=r.userName;});
  const byUser=Object.entries(nomes).map(([uid,name])=>{
    const rs=mesRes.filter(r=>r.userId===uid);
    return{uid,name,reservas:rs.length,horas:rs.filter(r=>r.modo!=="mensal").reduce((s,r)=>s+calcHoras(r.horaInicio,r.horaFim),0),valor:rs.reduce((s,r)=>s+Number(r.valor||0),0),pago:rs.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0)};
  }).filter(p=>p.reservas>0);
  const porSala=salas.map(s=>{const rs=mesRes.filter(r=>r.sala===s.id&&r.modo!=="mensal");return{...s,horas:rs.reduce((t,r)=>t+calcHoras(r.horaInicio,r.horaFim),0),reservas:rs.length};});
  return(
    <div>
      <h2 style={{margin:"0 0 24px",color:C.text,fontSize:22,fontWeight:800}}>Dashboard — {MONTH_FULL[new Date().getMonth()]}</h2>
      <AlertasVencimento reservas={reservas}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:16,marginBottom:28}}>
        <Stat label="Reservas no mês" value={mesRes.length}/>
        <Stat label="Faturamento" value={fmtR(totalValor)} color={C.text}/>
        <Stat label="Recebido" value={fmtR(totalPago)} color={C.success}/>
        <Stat label="A receber" value={fmtR(totalValor-totalPago)} color={C.warning}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        <Card>
          <h3 style={{margin:"0 0 14px",color:C.text,fontSize:15,fontWeight:700}}>Hoje — {fmt(today())}</h3>
          {hojRes.length===0?<p style={{color:C.muted,fontSize:14,margin:0}}>Nenhuma reserva hoje.</p>:hojRes.map(r=>(<div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}><div style={{fontSize:13,color:C.textMid,minWidth:90,fontWeight:600}}>{r.horaInicio}–{r.horaFim}</div><div style={{flex:1,fontSize:13,color:C.text,fontWeight:600}}>{r.userName?.split(" ").slice(0,2).join(" ")} {r.modalidade==="online"?"💻":""}</div><SalaTag salaId={r.sala} salas={salas}/></div>))}
        </Card>
        <Card>
          <h3 style={{margin:"0 0 14px",color:C.text,fontSize:15,fontWeight:700}}>Ocupação das salas</h3>
          {porSala.map(s=>(<div key={s.id} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:s.cor}}>{s.label}</span><span style={{fontSize:12,color:C.textMid}}>{s.horas.toFixed(1)}h</span></div><div style={{background:C.surfaceAlt,borderRadius:6,height:8}}><div style={{width:`${Math.min(s.horas/80*100,100)}%`,background:s.cor,borderRadius:6,height:8}}/></div></div>))}
        </Card>
      </div>
      {byUser.length>0&&<Card><h3 style={{margin:"0 0 16px",color:C.text,fontSize:15,fontWeight:700}}>Por profissional</h3>{byUser.map(pro=>(<div key={pro.uid} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:C.text}}>{pro.name}</div><div style={{fontSize:11,color:C.muted}}>{pro.reservas} reservas · {pro.horas.toFixed(1)}h</div></div><div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:C.text}}>{fmtR(pro.valor)}</div>{pro.valor-pro.pago>0&&<div style={{fontSize:11,color:C.warning}}>{fmtR(pro.valor-pro.pago)} pend.</div>}</div></div>))}</Card>}
    </div>
  );
}

function CobrancasView({reservas,setReservas,config}){
  const salas=config.salas||[];
  const[mes,setMes]=useState(new Date().getMonth());
  const[ano,setAno]=useState(new Date().getFullYear());
  const mesStr=`${ano}-${String(mes+1).padStart(2,"0")}`;
  const modoLabel={avulsa:"Hora Avulsa",periodo:"Período",mensal:"Mensal"};
  const lista=reservas.filter(r=>(r.date?.slice(0,7)===mesStr)||(r.modo==="mensal"&&r.mesMensal===mesStr));
  const totalValor=lista.reduce((s,r)=>s+Number(r.valor||0),0);
  const totalPago=lista.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const nomes={};reservas.forEach(r=>{if(r.userId&&r.userName)nomes[r.userId]=r.userName;});
  const togglePago=async(id)=>{const r=reservas.find(x=>x.id===id);if(!r)return;const u=cleanObj({...r,pago:!r.pago});await setDoc(doc(db,"reservas",id),u);setReservas(prev=>prev.map(x=>x.id===id?u:x));};
  const quitarTudo=async(userId)=>{const ids=lista.filter(r=>r.userId===userId&&!r.pago).map(r=>r.id);for(const id of ids){const r=reservas.find(x=>x.id===id);if(r){const u={...r,pago:true};await setDoc(doc(db,"reservas",id),u);}}setReservas(prev=>prev.map(r=>ids.includes(r.id)?{...r,pago:true}:r));};
  const porUser=Object.entries(nomes).map(([uid,name])=>{const rs=lista.filter(r=>r.userId===uid);if(!rs.length)return null;return{uid,name,reservas:rs,total:rs.reduce((s,r)=>s+Number(r.valor||0),0),pago:rs.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0)};}).filter(Boolean);
  return(
    <div>
      <h2 style={{margin:"0 0 24px",color:C.text,fontSize:22,fontWeight:800}}>Cobranças</h2>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{width:140}}><Field label="Mês" value={mes} onChange={v=>setMes(Number(v))} options={MONTH_SHORT.map((n,i)=>({value:i,label:n}))}/></div>
        <div style={{width:90}}><Field label="Ano" value={ano} onChange={v=>setAno(Number(v))} options={[2024,2025,2026,2027].map(y=>({value:y,label:String(y)}))}/></div>
      </div>
      <div style={{background:C.warningLight,border:`1px solid ${C.warning}33`,borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:13,color:C.textMid}}>
        📅 Vencimento das reservas de <strong>{MONTH_FULL[mes]}/{ano}</strong>: <strong style={{color:C.danger}}>{fmt(vencimentoMes(mesStr))}</strong>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:24}}>
        <Stat label="Total gerado" value={fmtR(totalValor)} color={C.text}/>
        <Stat label="Recebido" value={fmtR(totalPago)} color={C.success}/>
        <Stat label="Pendente" value={fmtR(totalValor-totalPago)} color={C.warning}/>
        <Stat label="Reservas" value={lista.length} sub={`${lista.filter(r=>r.pago).length} quitadas`}/>
      </div>
      {porUser.length===0&&<Card><p style={{color:C.muted,margin:0}}>Nenhuma reserva neste período.</p></Card>}
      {porUser.map(pro=>(<Card key={pro.uid} style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontWeight:700,color:C.text,fontSize:15}}>{pro.name}</span>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:14,fontWeight:700,color:C.text}}>{fmtR(pro.total)}</span>
            {pro.total-pro.pago>0?<><span style={{fontSize:13,color:C.warning,fontWeight:600}}>{fmtR(pro.total-pro.pago)} pendente</span><Btn variant="success" small onClick={()=>quitarTudo(pro.uid)}>Quitar tudo</Btn></>:<span style={{fontSize:13,color:C.success,fontWeight:600}}>✓ Quitado</span>}
          </div>
        </div>
        {pro.reservas.map(r=>(<div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:13,color:C.textMid,minWidth:86}}>{fmt(r.date)}</div>
          <SalaTag salaId={r.sala} salas={salas}/>
          <Badge label={modoLabel[r.modo]||r.modo} bg={C.accentLight} color={C.accent}/>
          <span style={{flex:1}}/>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:14,fontWeight:600,color:C.text}}>{r.valor?fmtR(r.valor):"A combinar"}</div>
            {r.status==="cancelado"&&r.multa>0&&<div style={{fontSize:11,color:C.danger,fontWeight:600}}>Multa: {fmtR(r.multa)}</div>}
          </div>
          {r.status==="cancelado"
            ? <Badge label="Cancelado" bg={C.dangerLight} color={C.danger}/>
            : <button onClick={()=>togglePago(r.id)} style={{background:r.pago?C.successLight:C.warningLight,color:r.pago?C.success:C.warning,border:`1px solid ${r.pago?C.success:C.warning}44`,borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{r.pago?"✓ Pago":"Pendente"}</button>
          }
        </div>))}
      </Card>))}
    </div>
  );
}

function ProfissionaisView(){
  const[users,setUsers]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const[editando,setEditando]=useState(null);
  const[form,setForm]=useState({nome:"",email:"",senha:"",role:"professional",color:"#B5590A"});
  const[erro,setErro]=useState("");
  const[saving,setSaving]=useState(false);

  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"users"),snap=>{
      setUsers(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    });
    return unsub;
  },[]);

  const abrirNovo=()=>{setEditando(null);setForm({nome:"",email:"",senha:"",role:"professional",color:"#B5590A"});setErro("");setModal(true);};
  const abrirEditar=(u)=>{setEditando(u);setForm({nome:u.nome||"",email:u.email||"",senha:"",role:u.role||"professional",color:u.color||"#B5590A"});setErro("");setModal(true);};

  const salvar=async()=>{
    setErro("");setSaving(true);
    try{
      if(editando){
        await setDoc(doc(db,"users",editando.uid),cleanObj({...editando,nome:form.nome,role:form.role,color:form.color}));
        setModal(false);
      } else {
        const cred=await createUserWithEmailAndPassword(auth,form.email,form.senha);
        await setDoc(doc(db,"users",cred.user.uid),{uid:cred.user.uid,email:form.email,nome:form.nome,role:form.role,color:form.color||"#B5590A",criadoEm:new Date().toISOString()});
        setModal(false);setForm({nome:"",email:"",senha:"",role:"professional",color:"#B5590A"});
      }
    }catch(e){
      if(e.code==="auth/email-already-in-use")setErro("Este e-mail já está cadastrado.");
      else if(e.code==="auth/weak-password")setErro("A senha precisa ter pelo menos 6 caracteres.");
      else setErro("Erro ao salvar. Tente novamente.");
    }
    setSaving(false);
  };

  const profissionais=users.filter(u=>u.role==="professional");

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{margin:0,color:C.text,fontSize:22,fontWeight:800}}>Profissionais</h2>
        <Btn onClick={abrirNovo}>+ Cadastrar</Btn>
      </div>
      {loading?<p style={{color:C.muted}}>Carregando...</p>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {profissionais.map(u=>(<Card key={u.id} style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:u.color||C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#fff",fontSize:16,flexShrink:0}}>
              {u.nome?.charAt(0)?.toUpperCase()||"?"}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>{u.nome}</div>
              <div style={{fontSize:12,color:C.muted}}>{u.email}</div>
              <span style={{background:u.role==="manager"?C.warningLight:C.accentLight,color:u.role==="manager"?C.warning:C.accent,padding:"1px 6px",borderRadius:4,fontSize:11,fontWeight:600}}>
                {u.role==="manager"?"Gestor":"Profissional"}
              </span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:u.color||C.accent,border:`2px solid ${C.border}`}}/>
              <Btn variant="secondary" small onClick={()=>abrirEditar(u)}>✏️ Editar</Btn>
            </div>
          </Card>))}
          {profissionais.length===0&&<Card><p style={{color:C.muted,margin:0}}>Nenhum profissional cadastrado ainda.</p></Card>}
        </div>
      )}
      {modal&&(
        <Modal title={editando?"Editar Profissional":"Novo Profissional"} onClose={()=>setModal(false)}>
          {editando&&<div style={{background:C.accentLight,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"8px 12px",fontSize:13,color:C.textMid,marginBottom:14}}>
            Editando: <strong>{editando.nome}</strong> — e-mail não pode ser alterado aqui.
          </div>}
          <Field label="Nome completo *" value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))} placeholder="Nome Sobrenome"/>
          {!editando&&<Field label="E-mail *" type="email" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} placeholder="nome@email.com"/>}
          {!editando&&<Field label="Senha inicial *" type="password" value={form.senha} onChange={v=>setForm(f=>({...f,senha:v}))} placeholder="Mínimo 6 caracteres" helper="O profissional usará esta senha para entrar"/>}
          <Field label="Tipo de acesso" value={form.role} onChange={v=>setForm(f=>({...f,role:v}))} options={[{value:"professional",label:"Profissional"},{value:"manager",label:"Gestor"}]}/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>Cor na agenda</label>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <input type="color" value={form.color||"#B5590A"} onChange={e=>setForm(f=>({...f,color:e.target.value}))} style={{width:44,height:36,border:`1px solid ${C.border}`,borderRadius:8,cursor:"pointer"}}/>
              <div style={{width:32,height:32,borderRadius:"50%",background:form.color||"#B5590A"}}/>
              <span style={{fontSize:13,color:C.textMid}}>Cor nos blocos da agenda</span>
            </div>
          </div>
          {erro&&<div style={{background:C.dangerLight,color:C.danger,border:`1px solid ${C.danger}33`,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:12}}>{erro}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={salvar} disabled={saving}>{saving?"Salvando...":(editando?"Salvar":"Cadastrar")}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}


function ConfigView({config,setConfig}){
  const[form,setForm]=useState(JSON.parse(JSON.stringify(config)));
  const[salvo,setSalvo]=useState(false);
  const[novasSalas,setNovasSalas]=useState(form.salas||[]);
  const salvar=async()=>{
    const novo={...form,salas:novasSalas};
    await setDoc(doc(db,"config","main"),novo);
    setConfig(novo);setSalvo(true);setTimeout(()=>setSalvo(false),2000);
  };
  const setPeriodo=(k,campo,val)=>setForm(f=>({...f,periodos:{...f.periodos,[k]:{...f.periodos[k],[campo]:val}}}));
  const addSala=()=>setNovasSalas(s=>[...s,{id:uid(),label:`Sala ${s.length+1}`,cor:"#6366F1",corLight:"#EEF2FF"}]);
  const removeSala=(id)=>{if(novasSalas.length<=1)return alert("Precisa ter ao menos uma sala.");setNovasSalas(s=>s.filter(x=>x.id!==id));};
  const editSala=(id,campo,val)=>setNovasSalas(s=>s.map(x=>x.id===id?{...x,[campo]:val}:x));
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{margin:0,color:C.text,fontSize:22,fontWeight:800}}>Configurações</h2>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>{salvo&&<span style={{color:C.success,fontSize:13,fontWeight:600}}>✓ Salvo!</span>}<Btn onClick={salvar}>Salvar configurações</Btn></div>
      </div>
      <Card style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 16px",color:C.text,fontSize:16,fontWeight:700}}>Identidade & horários</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <Field label="Nome da clínica" value={form.nomeClinica} onChange={v=>setForm(f=>({...f,nomeClinica:v}))}/>
          <Field label="Abertura" type="time" value={form.horaInicio} onChange={v=>setForm(f=>({...f,horaInicio:v}))}/>
          <Field label="Fechamento" type="time" value={form.horaFim} onChange={v=>setForm(f=>({...f,horaFim:v}))}/>
        </div>
      </Card>
      <Card style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,color:C.text,fontSize:16,fontWeight:700}}>Salas</h3>
          <Btn small onClick={addSala}>+ Nova Sala</Btn>
        </div>
        {novasSalas.map(s=>(<div key={s.id} style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,padding:12,background:C.surfaceAlt,borderRadius:10}}>
          <input value={s.label} onChange={e=>editSala(s.id,"label",e.target.value)} style={{flex:1,background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",fontSize:14,fontFamily:"inherit",color:C.text}}/>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <label style={{fontSize:10,color:C.muted}}>Cor</label>
            <input type="color" value={s.cor} onChange={e=>editSala(s.id,"cor",e.target.value)} style={{width:36,height:30,border:"none",borderRadius:6,cursor:"pointer"}}/>
          </div>
          {novasSalas.length>1&&<Btn variant="danger" small onClick={()=>removeSala(s.id)}>✕</Btn>}
        </div>))}
      </Card>
      <Card style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 16px",color:C.text,fontSize:16,fontWeight:700}}>Valores de sublocação</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          <Field label="Hora avulsa (R$/h)" type="number" value={form.valorHoraAvulsa} onChange={v=>setForm(f=>({...f,valorHoraAvulsa:Number(v)}))} helper={`Exemplo: 2h = ${fmtR((form.valorHoraAvulsa||0)*2)}`}/>
          <div>
            <div style={{fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>Mensalidade</div>
            <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:14,color:C.muted,fontStyle:"italic"}}>A combinar com gestores</div>
          </div>
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16}}>
          <div style={{fontSize:13,color:C.textMid,marginBottom:12,fontWeight:600}}>Períodos do dia — valores fixos</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>
            {Object.entries(form.periodos).map(([k,p])=>(<div key={k} style={{background:C.surfaceAlt,borderRadius:10,padding:14,border:`1px solid ${C.border}`}}>
              <Field label="Nome" value={p.label} onChange={v=>setPeriodo(k,"label",v)}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><Field label="Início" type="time" value={p.inicio} onChange={v=>setPeriodo(k,"inicio",v)}/><Field label="Fim" type="time" value={p.fim} onChange={v=>setPeriodo(k,"fim",v)}/></div>
              <Field label="Valor (R$)" type="number" value={p.valor||0} onChange={v=>setPeriodo(k,"valor",Number(v))}/>
              <div style={{background:C.accentLight,borderRadius:8,padding:"7px 12px",fontSize:13,color:C.accent,fontWeight:700,textAlign:"center"}}>{p.label}: {fmtR(p.valor||0)}</div>
            </div>))}
          </div>
        </div>
      </Card>
    </div>
  );
}


function HistoricoView(){
  const[historico,setHistorico]=useState([]);
  const[lancamentos,setLancamentos]=useState([]);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    const u1=onSnapshot(collection(db,"historico"),snap=>{
      const items=snap.docs.map(d=>({id:d.id,...d.data()}))
        .sort((a,b)=>b.canceladoEm?.localeCompare(a.canceladoEm||"")||b.editadoEm?.localeCompare(a.editadoEm||"")||0);
      setHistorico(items);
    });
    const u2=onSnapshot(collection(db,"lancamentos"),snap=>{
      setLancamentos(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    });
    return()=>{u1();u2();};
  },[]);

  const totalMultas=lancamentos.reduce((s,l)=>s+Number(l.valor||0),0);
  const multasPagas=lancamentos.filter(l=>l.pago).reduce((s,l)=>s+Number(l.valor||0),0);

  const[editandoMulta,setEditandoMulta]=useState(null);
  const[novoValorMulta,setNovoValorMulta]=useState("");
  const[justificativa,setJustificativa]=useState("");

  const togglePagoMulta=async(id)=>{
    const l=lancamentos.find(x=>x.id===id);if(!l)return;
    const u={...l,pago:!l.pago};
    await setDoc(doc(db,"lancamentos",id),u);
    setLancamentos(prev=>prev.map(x=>x.id===id?u:x));
  };

  const salvarEdicaoMulta=async()=>{
    const l=editandoMulta;
    const u={...l,valor:Number(novoValorMulta)||0,justificativa:justificativa,editadoPor:"gestor",editadoEm:new Date().toISOString()};
    await setDoc(doc(db,"lancamentos",l.id),u);
    setLancamentos(prev=>prev.map(x=>x.id===l.id?u:x));
    setEditandoMulta(null);setNovoValorMulta("");setJustificativa("");
  };

  const zerarMulta=async(id)=>{
    const l=lancamentos.find(x=>x.id===id);if(!l)return;
    const u={...l,valor:0,pago:true,justificativa:"Multa dispensada pelo gestor",editadoEm:new Date().toISOString()};
    await setDoc(doc(db,"lancamentos",id),u);
    setLancamentos(prev=>prev.map(x=>x.id===id?u:x));
  };

  if(loading)return<div style={{color:C.muted,padding:20}}>Carregando...</div>;

  return(
    <div>
      <h2 style={{margin:"0 0 24px",color:C.text,fontSize:22,fontWeight:800}}>Histórico & Multas</h2>

      {lancamentos.length>0&&(
        <Card style={{marginBottom:20}}>
          <h3 style={{margin:"0 0 16px",color:C.text,fontSize:15,fontWeight:700}}>💰 Multas por cancelamento</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:16}}>
            <Stat label="Total multas" value={fmtR(totalMultas)} color={C.danger}/>
            <Stat label="Recebido" value={fmtR(multasPagas)} color={C.success}/>
            <Stat label="Pendente" value={fmtR(totalMultas-multasPagas)} color={C.warning}/>
          </div>
          {lancamentos.map(l=>(
            <div key={l.id} style={{background:C.surfaceAlt,borderRadius:10,padding:12,marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:l.justificativa?6:0}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:C.text}}>{l.userName}</div>
                  <div style={{fontSize:12,color:C.textMid}}>{l.descricao}</div>
                  {l.justificativa&&<div style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>📝 {l.justificativa}</div>}
                </div>
                <span style={{fontSize:15,fontWeight:800,color:l.valor===0?C.muted:C.danger}}>{l.valor===0?"Dispensada":fmtR(l.valor)}</span>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>togglePagoMulta(l.id)} style={{background:l.pago?C.successLight:C.warningLight,color:l.pago?C.success:C.warning,border:`1px solid ${l.pago?C.success:C.warning}44`,borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  {l.pago?"✓ Pago":"Pendente"}
                </button>
                <button onClick={()=>{setEditandoMulta(l);setNovoValorMulta(String(l.valor||0));setJustificativa(l.justificativa||"");}} style={{background:C.accentLight,color:C.accent,border:`1px solid ${C.accent}44`,borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  ✏️ Editar valor
                </button>
                {l.valor>0&&<button onClick={()=>zerarMulta(l.id)} style={{background:C.successLight,color:C.success,border:`1px solid ${C.success}44`,borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  Dispensar multa
                </button>}
              </div>
            </div>
          ))}
          {editandoMulta&&(
            <div style={{position:"fixed",inset:0,background:"#00000060",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,width:"100%",maxWidth:400}}>
                <h3 style={{margin:"0 0 16px",color:C.text}}>Editar Multa</h3>
                <p style={{color:C.textMid,fontSize:13,margin:"0 0 14px"}}>Profissional: <strong>{editandoMulta.userName}</strong></p>
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>Novo valor (R$)</label>
                  <input type="number" value={novoValorMulta} onChange={e=>setNovoValorMulta(e.target.value)} style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 11px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:16}}>
                  <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:5,fontWeight:600}}>Justificativa</label>
                  <input type="text" value={justificativa} onChange={e=>setJustificativa(e.target.value)} placeholder="Ex: Benefício concedido pelo gestor" style={{width:"100%",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 11px",fontSize:14,fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
                <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                  <Btn variant="secondary" onClick={()=>setEditandoMulta(null)}>Cancelar</Btn>
                  <Btn onClick={salvarEdicaoMulta}>Salvar</Btn>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h3 style={{margin:"0 0 16px",color:C.text,fontSize:15,fontWeight:700}}>📋 Log de atividades</h3>
        {historico.length===0&&<p style={{color:C.muted,margin:0}}>Nenhuma atividade registrada.</p>}
        {historico.map(h=>(
          <div key={h.id} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:h.tipo==="cancelamento"?C.danger:C.accent,flexShrink:0,marginTop:5}}/>
            <div style={{flex:1}}>
              {h.tipo==="cancelamento"&&(
                <>
                  <div style={{fontSize:14,fontWeight:600,color:C.text}}>
                    Cancelamento — {h.userName}
                  </div>
                  <div style={{fontSize:12,color:C.textMid}}>
                    {fmt(h.date)} · {h.horaInicio}–{h.horaFim} · {h.sala}
                  </div>
                  {h.multa>0&&<div style={{fontSize:12,color:C.danger,fontWeight:600}}>Multa: {fmtR(h.multa)}</div>}
                  <div style={{fontSize:11,color:C.muted}}>{h.canceladoEm?new Date(h.canceladoEm).toLocaleString("pt-BR"):""}</div>
                </>
              )}
              {h.tipo==="edicao"&&(
                <>
                  <div style={{fontSize:14,fontWeight:600,color:C.text}}>
                    Edição — {h.userName}
                  </div>
                  <div style={{fontSize:12,color:C.textMid}}>
                    {fmt(h.antes?.date)} {h.antes?.horaInicio}–{h.antes?.horaFim} → {fmt(h.depois?.date)} {h.depois?.horaInicio}–{h.depois?.horaFim}
                  </div>
                  <div style={{fontSize:11,color:C.muted}}>{h.editadoEm?new Date(h.editadoEm).toLocaleString("pt-BR"):""}</div>
                </>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function App(){
  const[authUser,setAuthUser]=useState(undefined);
  const[userProfile,setUserProfile]=useState(null);
  const[reservas,setReservas]=useState([]);
  const[config,setConfig]=useState(DEFAULT_CONFIG);
  const[view,setView]=useState("dashboard");
  const[loadingData,setLoadingData]=useState(true);

  useEffect(()=>{
    const unsub=auth.onAuthStateChanged(async user=>{
      setAuthUser(user);
      if(user){
        const snap=await getDoc(doc(db,"users",user.uid));
        if(snap.exists())setUserProfile({uid:user.uid,...snap.data()});
        else setUserProfile({uid:user.uid,email:user.email,nome:user.displayName||user.email,role:"professional"});
      } else {
        setUserProfile(null);
      }
    });
    return unsub;
  },[]);

  useEffect(()=>{
    if(!authUser)return;
    const unsubR=onSnapshot(collection(db,"reservas"),snap=>{
      setReservas(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    const loadConfig=async()=>{
      const snap=await getDoc(doc(db,"config","main"));
      if(snap.exists())setConfig(snap.data());
      setLoadingData(false);
    };
    loadConfig();
    return()=>unsubR();
  },[authUser]);

  useEffect(()=>{
    if(userProfile)setView(userProfile.role==="manager"?"dashboard":"agenda");
  },[userProfile]);

  const isManager=userProfile?.role==="manager";

  if(authUser===undefined)return<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"system-ui"}}>Carregando...</div>;
  if(!authUser||!userProfile)return<LoginScreen onLogin={()=>{}}/>;
  if(loadingData)return<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"system-ui"}}>Carregando dados...</div>;

  const navManager=[{id:"dashboard",icon:"📊",label:"Dashboard"},{id:"agenda",icon:"📅",label:"Agenda"},{id:"cobrancas",icon:"💰",label:"Cobranças"},{id:"historico",icon:"📋",label:"Histórico"},{id:"profissionais",icon:"👥",label:"Profissionais"},{id:"configuracoes",icon:"⚙️",label:"Config"}];
  const navPro=[{id:"agenda",icon:"📅",label:"Reservar"},{id:"pendencias",icon:"💰",label:"Pendências"}];
  const navItems=isManager?navManager:navPro;
  const isMobile=window.innerWidth<768;

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"system-ui,-apple-system,sans-serif"}}>
      {/* Header mobile e desktop */}
      <div style={{background:"#3D3228",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px #00000033"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src={LOGO_AMARELO} alt="Casa Aquarela" style={{width:36,height:36,objectFit:"contain",borderRadius:8,background:"#fff"}}/>
          <span style={{fontWeight:800,color:"#fff",fontSize:15}}>{config.nomeClinica}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:12,color:"#ffffffcc"}}>{userProfile?.nome?.split(" ")[0]||userProfile?.email?.split("@")[0]}</span>
          <button onClick={()=>signOut(auth)} style={{fontSize:12,color:"#fff",background:"#ffffff22",border:"1px solid #ffffff44",borderRadius:6,cursor:"pointer",fontFamily:"inherit",padding:"4px 10px",fontWeight:600}}>Sair</button>
        </div>
      </div>

      {/* Nav horizontal */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,overflowX:"auto",whiteSpace:"nowrap",boxShadow:"0 1px 4px #00000011"}}>
        <div style={{display:"inline-flex",padding:"0 8px"}}>
          {navItems.map(item=>{const active=view===item.id;return(
            <button key={item.id} onClick={()=>setView(item.id)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"12px 14px",background:"transparent",border:"none",borderBottom:`3px solid ${active?C.accent:"transparent"}`,cursor:"pointer",color:active?C.accent:C.textMid,fontFamily:"inherit",fontSize:13,fontWeight:active?700:500,whiteSpace:"nowrap"}}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          );})}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{padding:"20px 16px",maxWidth:900,margin:"0 auto"}}>
        {view==="dashboard"&&isManager&&<DashboardView reservas={reservas} config={config}/>}
        {view==="agenda"&&<AgendaView reservas={reservas} setReservas={setReservas} userProfile={userProfile} config={config} isManager={isManager}/>}
        {view==="cobrancas"&&isManager&&<CobrancasView reservas={reservas} setReservas={setReservas} config={config}/>}
        {view==="pendencias"&&!isManager&&<PendenciasView userProfile={userProfile} config={config}/>}
        {view==="historico"&&isManager&&<HistoricoView/>}
        {view==="profissionais"&&isManager&&<ProfissionaisView/>}
        {view==="configuracoes"&&isManager&&<ConfigView config={config} setConfig={setConfig}/>}
      </div>
    </div>
  );
}
