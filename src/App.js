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


const LOGO_VERDE = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAC0ALQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6pooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKZNLHDGXmdUQYBZjgUTSxwxNLK4SNRksTwKV1sAskiRRs8jBUUZJJwAKp6fqtnqDultLudeoIIJHqM9q43xBrb6lIY4spaqeF7t7n/CsqCaSCZZYXKSKchh2rCVez02MXV10PVaKx/D+tR6lH5cmEulHzL2b3FbFbxkpK6NU01dBRRRTGFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRWbr97Pp9j9ot0jfawDB/Q+n41FWoqUHOWyHGLk7IyPHc7LBawD7rsWb3x0/nXOXmqXV5awW8z/uogBgfxEdz6mnaxqs+qyI0wVFQYVF6DPU1QFeBCpOri5VoP3Gv6/E2xDjGh7N/EmFFWbe3FxBMUY+fEN+z+8o649x1+lR3UDW1w8LkFkwDj6Zr0LdTzLDYpHhkWSJijqchh1Bru/D2uJqKCGbCXajkdn9x/hXDpbTSCPy0LGTO0Drx1P096jVmikDIxV0OQynofY1cajp6vYuDaeh6vRWD4d11b9RBckLdAcHoJPce/tW9XbCamuaOx0JhRRRVDCiiigAooooAKKKKACiiigAooooAKKKKACuC8XXslxqkkBYiKDCqvbOOT+td7Xm/iL/kN3n+/wD0FYYh+6ZVXoVUti9m9xGd3lsBIvdQejfTtRLbmO1gnByspYfQg9PywaSzupLSbzISM4wQRkMO4I7itmCTT9QsGtFP2KdpPMQOcx7sYIB7A+9cVGVKV402rroKcJ7z69zN0Viur2eO8qg/Q8H+dXLuyNxqd/cTv5NpHMwaQjqc/dUdzUEVpPp2r2i3UZQiVSD1DDI5BqbxTcSSatNCxxFEcIg6DIyT9TmtlpHUz2WpXv8AUWnRYLdPItEXaqDqw/2j3/lWdU1tF5zOM4Cxs5/AZp8llPFCJZk8tSMqHOC30HWvOx2Hq4nljF6dTrwleFHmnJXfQgRirBlJDA5BHUGvSNBu3vdKgml5kIIY+pBxmvNa9A8HnOhxezN/OuvL60ptx5XFLa4pU1CXxXb3sbVFFFeoAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAV514mQprt2D3YN+YFei1y3jTTWkVb6IZ2DbIB6djWGJjJ03ybkySdubY440opYzskVgcYOemf0res20iW5hcyNbyDIkBjxG4IIOOTt6/SvHwuFbqe3muWXVX0fmXWrJw9jB3j36lbTNTCotpf5ksyQQT96I9mU/0qXxZEf7cJjG7zkRl2857cflWbfWUtlL5cq/KfuOOVceoNdNLJHFpVnq74aaO3EMSkfx9M/hzXpK8k4vocq1VmVbW3h0iFy13bLqTrtKyEkRA89ADk9OtYF4Xa4ZpJ1nc8mRW3Z/Go3dndndizMcknqTTawrxVaDp7IcKvJJSS2EFeheE4ymhQE/xFm/MmuG0+0kvruO3hHzOeT6Dua9NtoUt7eOGMYRFCj6Cry+hKlG0pXN3NVZ86jYkooor0RhRRRQAUUUUAFFFFABRRRQAUUUUAFFFQX95b6fZT3d7MkNtAhkkkc4CqBkk0AT0MAwIYAg8EHvWVoGu2uuJM1pDexrGV5ubV4dwIyGXcBkVp+YmwvuXYM5bPAx1oA4nxDoD2jtcWaF7Y8lRyY//rVz1esFlCglgAe5NZ13oen3Tl5LdQ56shK5/KuedC7vExlSvqjh9O1DyENvcp59k5+aM/w+6+hrc8QQJb+GbOOGTzIRICr+oIYj+dPttK0K71S+0+3nma7shGZ4wx+TeCV5I7gVsyaTazaalgzOYYiMfN8w/H8aI05JNMFB2aZ5xUtrby3UyxW8bSSHoB/niu4Xw5pcJUyIzZOAHkPJrUtba2tB5dtHHFkZwowTUrDvqJUn1KPh/SE0yAliHuHHzsO3sPatagEHOCDjiiulJRVkbJWVkFFBIUEkgAckmgEEAg5BpjCiiigAooooAKKKKACiiigAooooAK5X4pAt4F1JQAS/lJg9OZUH9a6quf8AiBZT3/g3VoLRDJceSZI0HVmQhwB9SuKANq8uEtbOe4kOEiRpG+gBP9K8g0O3MPwzlttQBltLPVo5tQQjO6B2jmfcO6gSZI9FNdF4l8aaRrXg/ULfQr+K4vrq2SIRJktGZnEQD4+6QX6Hng1JoV1b6XqvjCDxFNYwQB7eVySViKPAEC/Me/lHigCP4wIv/CJWdrZ4RUmW4VY+AI4EaXA9vkA/GvQY3WSNXQ5VgCD7GvIBb6pqek6VpUYRJ7bw7O8guFYkCYCOMcdG2KevvXdWOrhPhtBq0W5iulrcKAMksIs4+ueKAOV+HcufGuq3pJxrFtJfc+kdzJGn/jmypPDifZYfBmsJ8t7q80i3rjgziWOSUbvXaVXHoOBxSeFdLv8ARPFHh2wvrmKcNoUsK7IPLMe1oiQxyd3J68d6XwzJ9osvAGnEf6RZmZ7hO8fkRPEcjt87qKAFiHmeE/DgkJY/8JDwScn5bqUj+VWpZGPxlt7jJ8oWZ07H+3t88/piqGjzJcXuk+HhIpv7HXLq6uIh96OFWldGYdgxkjwe+agt57uTXNO1t2hOn3HiSaOM4YSYMT26n02/IPzoAufDT5/FWu/ZgRFA88V2QcB5zdSsmR3YR459CBVbwammj4W65NpzOL5rO4F3Jl8mQLIQeeM4PVa1fB00Vn4w1CEFQuovc495YLh9w+uyVT9F9qoaFf2p+Cuo29vdwTXNrplyJokkDPGcSYDAHI/GgDd8Qq0vwwNtESHu7OG0TnnMuyMf+hVpeAJvP8F6Mc5KWqRH6oNp/Va57VNTh1Wy8KWGgXlncySXcbFlfzEUQxGQhtpyOQnHuK1fhizJ4XNpKVM9neXVtJtzjcsz9M9sEUAdZRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAEUdvDEXMcUaF23NtUDcfU+9QC4sLkT4ltpRE22XDK20rzg+hGDVyudm8J2TsrpLMkm+R3kDZZg+75eeijceBQBvSywxI8kjoiqPmZiBgD1pS8UUfVERQfYACudPhK2JTdcS7V3dFUEgk98Zzycn+LjPSq8ng1PtEJjumEQZjJlBuIxgbSBwfVurd6AOqlliiiaWV0SNASzsQAB35rm1tPs/i465Z/YTp13ZrDcyK2JN6uSjDAO4HcVPI6Drirdl4eS1s721+0vLDdF3cSxq3zNgZ6Y6DpjrzVP8A4RCPzDL/AGjeGXyxFvO0kDkHqOeCcZzjNAHRRtbm5l2GIzjCvjG71APf1pt1Pa2sIe6lhiiVh80jBQG/HvWHa+ErW31CG7E8rPFL5gDAYPpnHU/7R57UTeErWTT7i086ULNcm4LHBOTng569T+lAG7utxKgzF5h3OvTPbJH/AH0PzFEdvbIZBHDCpkzvCqBu9c+vWucfwVZPHKpuLg733ksQSeQcN69P84FW7LwzDa6nBei4lZ4nkkC7VUMXyDnA9Dj/AICPxANuK3hhz5UUaZOTtUDJp6qq52gDJycDvS0UAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAf/Z";
const LOGO_AMARELO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAA8ADwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6pooooAKKKjnnit0DTSLGpIALHHNJtJXY0m9ESUUUUxBRRRQAUUUUAV765S1gLOwBOQvIGTjPeuK1e6e/upWSRpIIhlN3GF7mug8TwNO9iApKiQ7sEA9M8Z4zwaxSsYupVgDb/KYRNswJOMjg9D+leBmc51JultFW+en9fgepg4xhHn6l/QNTngQw3it9nQD96f8AlnnoD7V1AORkdK4eCVIoHt5J4XAzIySAlXf0JHJx+VdlZArZwBhhhGoI98V1ZZWlKPs272/qxhjIJS5krXJqKKK9U4gqG8uEtLaSeQMVQZwoyT6AVNUF/b/a7SWHfsLDhsZ2nqDj60AUb6+024hnt7uQAIQsqkHKMduOR3y6/nWLFBbWWoSxPqAKwNtZZIzlSyEjB+n4dqkvNKh8y4S5vrkSSP5sjJbt8x+U4BAPy/KvHPTrTL21tJpnu47m4dLmX96DE3Ax/Dx/u/ka56uFpVZKc1qjWFacE4xejGWNrpdncq15fLI6fMECEDgMcn1/1bflXUR31vJMkKSAyuGIUgg/LgN+W4fnXLSaXZsUaS8uWeSMjJtWI5RlJxjj/WN+ftW1Y6YPtkN8LlmUB9iCPYMPycg89QMfSnQw9PDx5aasKpVnVd5s2KKKK3MwooooAKKKKACiiigAooooA//Z";

const DEFAULT_CONFIG={
  valorHoraAvulsa:38,valorHoraFixa:33,nomeClinica:"Casa Aquarela",horaInicio:"08:00",horaFim:"21:00",
  salas:[
    {id:"sala1",label:"Sala 1",cor:"#B5590A",corLight:"#FDEFD8"},
    {id:"sala2",label:"Sala 2",cor:"#4A7C4E",corLight:"#E8F5E9"},
  ],
  periodos:{
    manha:{label:"Manhã",inicio:"08:00",fim:"13:00",valor:115},
    tarde:{label:"Tarde",inicio:"13:00",fim:"17:00",valor:115},
    noite:{label:"Noite",inicio:"17:00",fim:"21:00",valor:125},
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



const podeEditar=(reserva)=>{
  if(!reserva.date||!reserva.horaInicio) return false;
  const agora=new Date();
  const dataReserva=new Date(reserva.date+"T"+reserva.horaInicio+":00");
  const diffHoras=(dataReserva-agora)/(1000*60*60);
  return diffHoras>=24;
};

const calcMulta=(reserva)=>{
  if(!reserva.date||!reserva.horaInicio)return{multa:0,pct:0,msg:"Sem cobrança",antecedencia:999};
  const agora=new Date();
  const dataReserva=new Date(reserva.date+"T"+reserva.horaInicio+":00");
  const diffHoras=(dataReserva-agora)/(1000*60*60);
  const valor=Number(reserva.valor||0);
  if(diffHoras>=24)return{multa:0,pct:0,msg:"Cancelamento com mais de 24h de antecedência — sem cobrança.",antecedencia:diffHoras};
  if(diffHoras>=12)return{multa:valor*0.5,pct:50,msg:"Cancelamento entre 12h e 24h antes do horário — multa de 50% do valor reservado.",antecedencia:diffHoras};
  if(diffHoras>0)return{multa:valor,pct:100,msg:"Cancelamento com menos de 12h antes do horário — multa de 100% do valor reservado.",antecedencia:diffHoras};
  return{multa:valor,pct:100,msg:"Horário já iniciado ou encerrado — 100% do valor será cobrado.",antecedencia:0};
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
  const[notes,setNotes]=useState(base.notes||"");
  const[erro,setErro]=useState("");

  const hStart=horaParaMin(config.horaInicio||"08:00");
  const hEnd=horaParaMin(config.horaFim||"21:00");
  const horaOptions=[];
  // Apenas horas cheias (08:00, 09:00, ..., 21:00)
  for(let m=hStart;m<=hEnd;m+=60){const hh=Math.floor(m/60);const ts=String(hh).padStart(2,"0")+":00";horaOptions.push({value:ts,label:ts});}

  let horaInicio="",horaFim="",valor=0,resumoValor="";
  if(modo==="avulsa"){
    horaInicio=hIni;horaFim=hFim;
    const h=calcHoras(hIni,hFim);
    const taxaHora=recorrencia==="semanal"?(config.valorHoraFixa||33):(config.valorHoraAvulsa||38);
    valor=+(h*taxaHora).toFixed(2);
    resumoValor=fmtR(valor)+(recorrencia==="semanal"?" (tarifa hora fixa)":"");
  }
  else if(modo==="periodo"){const p=periodos[periodo];horaInicio=p.inicio;horaFim=p.fim;valor=Number(p.valor||0);resumoValor=fmtR(valor);}

  const salvar=()=>{
    setErro("");
    if(!data)return setErro("Preencha a data.");
    if(!sala)return setErro("Selecione uma sala.");
    if(modo==="avulsa"&&horaParaMin(hFim)<=horaParaMin(hIni))return setErro("Horário de fim deve ser após o início.");
    const dadosBase={
      id:isEdit?editando.id:uid(),
      date:data,sala,horaInicio,horaFim,
      modo:modo,
      periodo:modo==="periodo"?periodo:null,
      valor:valor||0,
      userId:userProfile.uid,
      userName:userProfile.displayName||userProfile.nome||userProfile.email||"",
      userColor:userProfile.color||"#B5590A",
      notes:notes||"",pago:false,
      modalidade:modalidade||"presencial",
      recorrencia:recorrencia||"unica",
      serieId:null,serieInicio:null,serieFim:null
    };
    if(!isEdit){
      const nova={date:data,sala,horaInicio,horaFim};
      if(conflito(reservas,nova,[]))return setErro("Já existe uma reserva nessa sala nesse horário.");
    }
    const geradas=isEdit?[dadosBase]:gerarRecorrentes(dadosBase,recorrencia);
    onSave(geradas,isEdit);
    onClose();
  };

  const tarifaAvulsa=recorrencia==="semanal"?fmtR(config.valorHoraFixa||33)+"/h (fixa)":fmtR(config.valorHoraAvulsa||38)+"/h";
  const tarifaAvulsa=recorrencia==="semanal"?fmtR(config.valorHoraFixa||33)+"/h (fixa)":fmtR(config.valorHoraAvulsa||38)+"/h";
  const modoBtn=(m,label,sub)=>(<button onClick={()=>setModo(m)} style={{flex:1,padding:"10px 8px",border:`2px solid ${modo===m?C.accent:C.border}`,borderRadius:10,background:modo===m?C.accentLight:C.white,cursor:"pointer",fontFamily:"inherit"}}><div style={{fontWeight:700,fontSize:13,color:modo===m?C.accent:C.text}}>{label}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{m==="avulsa"?tarifaAvulsa:sub}</div></button>);

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
      <>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Tipo de reserva</label>
          <div style={{display:"flex",gap:8}}>{modoBtn("avulsa","Hora Avulsa",fmtR(config.valorHoraAvulsa)+"/h")}{modoBtn("periodo","Período","valor por período")}</div>
        </div>
        <Field label="Data" type="date" value={data} onChange={setData}/>
        {modo==="avulsa"&&(
          <div>
            <Field label="Início (fim automático: +1 hora)" value={hIni} onChange={v=>{
              setHIni(v);
              // Calcula fim automaticamente: +1 hora
              const[hh,mm]=v.split(":").map(Number);
              const fimH=hh+1;
              if(fimH<=23) setHFim(String(fimH).padStart(2,"0")+":"+String(mm).padStart(2,"0"));
            }} options={horaOptions}/>
            <div style={{background:C.accentLight,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"8px 14px",fontSize:13,color:C.textMid,marginTop:-8,marginBottom:14}}>
              Horário: <strong style={{color:C.accent}}>{hIni} – {hFim}</strong> (1 hora)
            </div>
          </div>
        )}
        {modo==="periodo"&&(<div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Período</label>
          <div style={{display:"flex",gap:8}}>{Object.entries(periodos).map(([k,p])=>(<button key={k} onClick={()=>setPeriodo(k)} style={{flex:1,padding:"10px 8px",border:`2px solid ${periodo===k?C.accent:C.border}`,borderRadius:10,background:periodo===k?C.accentLight:C.white,cursor:"pointer",fontFamily:"inherit"}}><div style={{fontWeight:700,fontSize:13,color:periodo===k?C.accent:C.text}}>{p.label}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{p.inicio}–{p.fim}</div><div style={{fontSize:12,color:periodo===k?C.accent:C.textMid,fontWeight:600,marginTop:2}}>{fmtR(p.valor)}</div></button>))}</div>
        </div>)}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>
            Recorrência <span style={{color:C.danger}}>*</span>
          </label>
          <div style={{display:"flex",gap:8}}>
            {[
              {value:"unica",label:"Avulsa"},
              {value:"semanal",label:"Semanal"},
              {value:"quinzenal",label:"Quinzenal"},
            ].map(op=>(
              <button key={op.value} onClick={()=>setRecorrencia(op.value)}
                style={{flex:1,padding:"10px 8px",border:`2px solid ${recorrencia===op.value?C.accent:C.border}`,borderRadius:10,background:recorrencia===op.value?C.accentLight:C.white,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:recorrencia===op.value?C.accent:C.textMid,transition:"all 0.12s"}}>
                {op.label}
              </button>
            ))}
          </div>
          {isEdit&&<div style={{fontSize:11,color:C.muted,marginTop:6}}>Ao salvar, cria novas reservas recorrentes a partir desta data.</div>}
        </div>
        <div style={{background:C.accentLight,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:14,color:C.text,fontWeight:600}}>
          {resumoValor}
          {recorrencia!=="unica"&&<span style={{color:C.warning,marginLeft:8,fontWeight:500,fontSize:12}}>· até {fmt(addMonths(data,6))}</span>}
        </div>
      </>
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
  // Sempre horas cheias: 8, 9, 10... 20
  const hStartH=Math.ceil(hStart/60);
  const hEndH=Math.floor(hEnd/60);
  for(let h=hStartH;h<hEndH;h++)horas.push(h);
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
      ):(()=>{
        const editavel=isManager||podeEditar(reserva);
        return(
          <>
            {/* Status de antecedência */}
            <div style={{background:pct===0?C.successLight:C.dangerLight,border:`1px solid ${pct===0?C.success:C.danger}44`,borderRadius:8,padding:"12px 14px",marginBottom:14,fontSize:13}}>
              <div style={{fontWeight:700,color:pct===0?C.success:C.danger,fontSize:14,marginBottom:4}}>
                {pct===0?"✓ Fora do prazo de multa":`⚠️ Dentro do prazo de multa — ${pct}%`}
              </div>
              <div style={{color:C.textMid,fontSize:13}}>{msg}</div>
              {pct>0&&<div style={{color:C.danger,fontWeight:700,fontSize:15,marginTop:6}}>
                Se cancelar agora: {fmtR(Number(reserva.valor||0)*pct/100)}
              </div>}
            </div>

            {/* Aviso de bloqueio de edição */}
            {!editavel&&(
              <div style={{background:C.warningLight,border:`1px solid ${C.warning}44`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13}}>
                <div style={{fontWeight:700,color:C.warning,marginBottom:4}}>🔒 Prazo de edição vencido</div>
                <div style={{color:C.textMid}}>Esta reserva não pode mais ser editada. Só é possível cancelá-la (com incidência de multa) ou entrar em contato com o gestor.</div>
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {/* Cancelar - bloqueado para semanal */}
              {reserva.recorrencia==="semanal"?(
                <div style={{background:C.warningLight,border:`1px solid ${C.warning}44`,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontWeight:700,color:C.warning,marginBottom:4,fontSize:14}}>🔒 Reserva fixa — não pode ser cancelada</div>
                  <div style={{fontSize:13,color:C.textMid}}>Reservas semanais funcionam como pacote de garantia mensal. O pagamento é obrigatório independente do uso. Somente a edição do horário é permitida (com mais de 24h de antecedência).</div>
                </div>
              ):(
                <Btn variant="danger" full onClick={onCancelar}>
                  ✕ Cancelar reserva{reserva.serieId?" (escolher escopo)":""}
                </Btn>
              )}

              {/* Editar - só se fora do prazo ou gestor */}
              {editavel?(
                <Btn variant="secondary" full onClick={onEditar}>
                  ✏️ Editar horário / sala / recorrência
                </Btn>
              ):(
                <div style={{background:C.surfaceAlt,borderRadius:8,padding:"10px 14px",textAlign:"center",fontSize:13,color:C.muted,fontStyle:"italic"}}>
                  ✏️ Prazo de edição vencido — entre em contato com o gestor
                </div>
              )}

              {/* Excluir série - só gestor */}
              {isManager&&(
                <Btn variant="warning" full onClick={onExcluir}>
                  🗑️ Excluir{reserva.serieId?" da série":""}
                </Btn>
              )}
            </div>
          </>
        );
      })()}

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

      <div style={{background:pct===0?C.successLight:C.dangerLight,border:`1px solid ${pct===0?C.success:C.danger}44`,borderRadius:10,padding:14,marginBottom:14}}>
        <div style={{fontWeight:700,color:pct===0?C.success:C.danger,fontSize:15,marginBottom:4}}>
          {pct===0?"✓ Cancelamento gratuito":`⚠️ Multa de ${pct}% — ${fmtR(multa)}`}
        </div>
        <div style={{fontSize:13,color:C.textMid,marginBottom:escopo==="proximos"&&multa>0?4:0}}>{msg}</div>
        {escopo==="proximos"&&multa>0&&(
          <div style={{fontSize:12,color:C.danger,marginTop:4}}>
            ⚠️ A multa será aplicada individualmente em cada reserva dentro do prazo.
          </div>
        )}
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
    const hNum=hora!=null?Math.floor(Number(hora)):9;
    const hh=String(hNum).padStart(2,"0")+":00";
    const hf=String(Math.min(hNum+1,21)).padStart(2,"0")+":00";
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
      // verifica permissão
      if(!isManager&&editando.userId!==userProfile.uid){
        alert("Você não tem permissão para editar esta reserva.");return;
      }
      // verifica se pode editar (prazo de 24h) - só para profissional
      if(!isManager&&!podeEditar(editando)){
        alert("Esta reserva está dentro do prazo de multa e não pode ser editada.");return;
      }
      // verifica conflito
      const nova={date:geradas[0].date,sala:geradas[0].sala,horaInicio:geradas[0].horaInicio,horaFim:geradas[0].horaFim};
      if(conflito(reservas,nova,[editando.id])){
        alert("Já existe uma reserva nessa sala nesse horário.");return;
      }
      // salva histórico de edição com todas as mudanças
      try{
        const mudancas=[];
        if(editando.date!==geradas[0].date) mudancas.push("data");
        if(editando.horaInicio!==geradas[0].horaInicio||editando.horaFim!==geradas[0].horaFim) mudancas.push("horario");
        if(editando.sala!==geradas[0].sala) mudancas.push("sala");
        if(editando.modalidade!==geradas[0].modalidade) mudancas.push("modalidade");
        const recAntes=editando.recorrencia||"unica";
        const recDepois=geradas[0].recorrencia||"unica";
        if(recAntes!==recDepois) mudancas.push("recorrencia");
        const hDocEdit={
          tipo:"edicao",
          reservaId:String(editando.id||""),
          userId:String(userProfile.uid||""),
          userName:String(userProfile.nome||userProfile.email||""),
          mudancas:mudancas.join(","),
          antesDate:String(editando.date||""),
          antesInicio:String(editando.horaInicio||""),
          antesFim:String(editando.horaFim||""),
          antesSala:String(editando.sala||""),
          antesModalidade:String(editando.modalidade||"presencial"),
          antesRecorrencia:String(editando.recorrencia||"unica"),
          depoisDate:String(geradas[0].date||""),
          depoisInicio:String(geradas[0].horaInicio||""),
          depoisFim:String(geradas[0].horaFim||""),
          depoisSala:String(geradas[0].sala||""),
          depoisModalidade:String(geradas[0].modalidade||"presencial"),
          depoisRecorrencia:String(geradas[0].recorrencia||"unica"),
          editadoEm:new Date().toISOString()
        };
        await setDoc(doc(db,"historico",uid()),hDocEdit);
      }catch(errH){
        console.error("Erro ao registrar histórico de edição:",errH);
      }
      // Atualiza a reserva atual
      await setDoc(doc(db,"reservas",editando.id),cleanObj(geradas[0]));
      setReservas(prev=>prev.map(r=>r.id===editando.id?geradas[0]:r));
      // Se tornou recorrente, cria as próximas
      if(geradas[0].recorrencia&&geradas[0].recorrencia!=="unica"){
        const serieId=uid();
        const dataFim=addMonths(geradas[0].date,6);
        let dataAtual=addDays(geradas[0].date,
          geradas[0].recorrencia==="semanal"?7:
          geradas[0].recorrencia==="quinzenal"?14:30
        );
        while(dataAtual<=dataFim){
          const novaRes=cleanObj({...geradas[0],id:uid(),date:dataAtual,serieId,serieInicio:geradas[0].date,serieFim:dataFim,recorrencia:geradas[0].recorrencia});
          if(!conflito(reservas,{date:dataAtual,sala:novaRes.sala,horaInicio:novaRes.horaInicio,horaFim:novaRes.horaFim},[])){
            await setDoc(doc(db,"reservas",novaRes.id),novaRes);
            setReservas(prev=>[...prev,novaRes]);
          }
          dataAtual=geradas[0].recorrencia==="semanal"?addDays(dataAtual,7):
                    geradas[0].recorrencia==="quinzenal"?addDays(dataAtual,14):
                    addMonths(dataAtual,1);
        }
      }
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
      // Registra criação no histórico
      try{
        const hId=uid();
        const hDoc={
          tipo:"criacao",
          userId:String(userProfile.uid||""),
          userName:String(userProfile.nome||userProfile.email||""),
          date:String(geradas[0].date||""),
          horaInicio:String(geradas[0].horaInicio||""),
          horaFim:String(geradas[0].horaFim||""),
          sala:String(geradas[0].sala||""),
          modo:String(geradas[0].modo||"avulsa"),
          recorrencia:String(geradas[0].recorrencia||"unica"),
          recorrenciaLabel:geradas[0].recorrencia==="semanal"?"Semanalmente":geradas[0].recorrencia==="quinzenal"?"Quinzenalmente":"Avulsa",
          totalGeradas:Number(geradas.length||1),
          criadoEm:new Date().toISOString()
        };
        await setDoc(doc(db,"historico",hId),hDoc);
      }catch(errH){
        console.error("Erro ao registrar histórico de criação:",errH);
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
          horaInicio:res.horaInicio,
          horaFim:res.horaFim,
          sala:res.sala,
          modoOriginal:res.modo,
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
                  {/* Profissional não pode excluir semanal */}
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
  const[mes,setMes]=useState(new Date().getMonth());
  const[ano,setAno]=useState(new Date().getFullYear());

  useEffect(()=>{
    const unsubR=onSnapshot(collection(db,"reservas"),snap=>{
      const todas=snap.docs.map(d=>({id:d.id,...d.data()}));
      setMinhas(todas.filter(r=>r.userId===userProfile.uid).sort((a,b)=>b.date.localeCompare(a.date)));
    });
    const unsubL=onSnapshot(collection(db,"lancamentos"),snap=>{
      setLancamentos(snap.docs.map(d=>({id:d.id,...d.data()})).filter(l=>l.userId===userProfile.uid));
    });
    return()=>{unsubR();unsubL();};
  },[userProfile.uid]);

  const mesStr=`${ano}-${String(mes+1).padStart(2,"0")}`;
  const vencimento=vencimentoMes(mesStr);
  const navMes=(dir)=>{
    if(dir===-1&&mes===0){setMes(11);setAno(a=>a-1);}
    else if(dir===1&&mes===11){setMes(0);setAno(a=>a+1);}
    else setMes(m=>m+dir);
  };

  const modoLabel={avulsa:"Hora Avulsa",periodo:"Período",mensal:"Mensal"};
  const reservasMes=minhas.filter(r=>r.date?.slice(0,7)===mesStr);
  const multasMes=lancamentos.filter(l=>(l.date?.slice(0,7)===mesStr)||(l.criadoEm?.slice(0,7)===mesStr));
  const pendenteReservas=reservasMes.filter(r=>!r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const pendenteMultas=multasMes.filter(l=>!l.pago&&l.valor>0).reduce((s,l)=>s+Number(l.valor||0),0);
  const totalPendente=pendenteReservas+pendenteMultas;
  const tudoPago=totalPendente===0&&(reservasMes.length>0||multasMes.length>0);

  return(
    <div>
      <h2 style={{margin:"0 0 20px",color:C.text,fontSize:22,fontWeight:800}}>Minhas Pendências</h2>

      {/* Navegação por mês */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 20px"}}>
        <button onClick={()=>navMes(-1)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:C.accent,fontWeight:700,padding:"0 8px"}}>←</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontWeight:800,color:C.text,fontSize:17}}>{MONTH_FULL[mes]} {ano}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>Vencimento: <strong>{fmt(vencimento)}</strong></div>
        </div>
        <button onClick={()=>navMes(1)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:C.accent,fontWeight:700,padding:"0 8px"}}>→</button>
      </div>

      {/* Totais */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{background:tudoPago?C.successLight:totalPendente>0?C.dangerLight:C.surfaceAlt,border:`1px solid ${tudoPago?C.success:totalPendente>0?C.danger:C.border}33`,borderRadius:12,padding:16}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Total a pagar</div>
          <div style={{fontSize:24,fontWeight:800,color:tudoPago?C.success:totalPendente>0?C.danger:C.muted}}>{fmtR(totalPendente)}</div>
          {tudoPago&&<div style={{fontSize:12,color:C.success,marginTop:2}}>✓ Tudo quitado!</div>}
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Composição</div>
          <div style={{fontSize:13,color:C.textMid}}>Reservas: <strong style={{color:C.text}}>{fmtR(pendenteReservas)}</strong></div>
          {pendenteMultas>0&&<div style={{fontSize:13,color:C.textMid,marginTop:3}}>Multas: <strong style={{color:C.danger}}>{fmtR(pendenteMultas)}</strong></div>}
          {pendenteMultas===0&&<div style={{fontSize:12,color:C.muted,marginTop:3}}>Sem multas este mês</div>}
        </div>
      </div>

      {/* Multas do mês */}
      {multasMes.length>0&&(
        <Card style={{marginBottom:16,border:`1px solid ${C.danger}33`}}>
          <h3 style={{margin:"0 0 14px",color:C.danger,fontSize:15,fontWeight:700}}>⚠️ Multas — {MONTH_FULL[mes]}</h3>
          {multasMes.map(l=>(
            <div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>{l.descricao}</div>
                {l.justificativa&&<div style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>📝 {l.justificativa}</div>}
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:800,color:l.valor===0?C.muted:C.danger}}>{l.valor===0?"Dispensada":fmtR(l.valor)}</div>
                <Badge label={l.pago||l.valor===0?"✓ Quitada":"Pendente"} bg={l.pago||l.valor===0?C.successLight:C.dangerLight} color={l.pago||l.valor===0?C.success:C.danger}/>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Reservas do mês */}
      <Card>
        <h3 style={{margin:"0 0 14px",color:C.text,fontSize:15,fontWeight:700}}>📅 Reservas — {MONTH_FULL[mes]}</h3>
        {reservasMes.length===0&&<p style={{color:C.muted,margin:0,fontSize:14}}>Nenhuma reserva neste mês.</p>}
        {reservasMes.map(r=>(<div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:C.text}}>{fmt(r.date)} · {r.horaInicio}–{r.horaFim}</div>
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
  const[lancamentos,setLancamentos]=useState([]);
  const[filtroPro,setFiltroPro]=useState("");

  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"lancamentos"),snap=>{
      setLancamentos(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return unsub;
  },[]);

  const mesStr=`${ano}-${String(mes+1).padStart(2,"0")}`;
  const modoLabel={avulsa:"Hora Avulsa",periodo:"Período",mensal:"Mensal"};

  const lista=reservas.filter(r=>(r.date?.slice(0,7)===mesStr)||(r.modo==="mensal"&&r.mesMensal===mesStr));
  const multasMes=lancamentos.filter(l=>(l.date?.slice(0,7)===mesStr)||(l.criadoEm?.slice(0,7)===mesStr));

  const todosIds={};
  lista.forEach(r=>{if(r.userId&&r.userName)todosIds[r.userId]=r.userName;});
  multasMes.forEach(l=>{if(l.userId&&l.userName)todosIds[l.userId]=l.userName;});

  // Filtra pelos dados do profissional selecionado (ou todos)
  const listaFiltrada=filtroPro?lista.filter(r=>r.userId===filtroPro):lista;
  const multasFiltradas=filtroPro?multasMes.filter(l=>l.userId===filtroPro):multasMes;

  const totalReservas=listaFiltrada.reduce((s,r)=>s+Number(r.valor||0),0);
  const totalMultas=multasFiltradas.reduce((s,l)=>s+Number(l.valor||0),0);
  const totalGeral=totalReservas+totalMultas;
  const pagoReservas=listaFiltrada.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const pagoMultas=multasFiltradas.filter(l=>l.pago||l.valor===0).reduce((s,l)=>s+Number(l.valor||0),0);
  const totalPago=pagoReservas+pagoMultas;

  const togglePago=async(id)=>{
    const r=reservas.find(x=>x.id===id);if(!r)return;
    const u=cleanObj({...r,pago:!r.pago});
    await setDoc(doc(db,"reservas",id),u);
    setReservas(prev=>prev.map(x=>x.id===id?u:x));
  };
  const togglePagoMulta=async(id)=>{
    const l=lancamentos.find(x=>x.id===id);if(!l)return;
    const u={...l,pago:!l.pago};
    await setDoc(doc(db,"lancamentos",id),u);
    setLancamentos(prev=>prev.map(x=>x.id===id?u:x));
  };
  const quitarTudo=async(userId)=>{
    const idsRes=lista.filter(r=>r.userId===userId&&!r.pago).map(r=>r.id);
    for(const id of idsRes){const r=reservas.find(x=>x.id===id);if(r){await setDoc(doc(db,"reservas",id),{...r,pago:true});}}
    setReservas(prev=>prev.map(r=>idsRes.includes(r.id)?{...r,pago:true}:r));
    const idsMultas=multasMes.filter(l=>l.userId===userId&&!l.pago&&l.valor>0).map(l=>l.id);
    for(const id of idsMultas){const l=lancamentos.find(x=>x.id===id);if(l){await setDoc(doc(db,"lancamentos",id),{...l,pago:true});}}
    setLancamentos(prev=>prev.map(l=>idsMultas.includes(l.id)?{...l,pago:true}:l));
  };

  const porUser=Object.entries(todosIds)
    .filter(([userId])=>!filtroPro||userId===filtroPro)
    .map(([userId,name])=>{
      const rs=lista.filter(r=>r.userId===userId);
      const ms=multasMes.filter(l=>l.userId===userId);
      const totalRes=rs.reduce((s,r)=>s+Number(r.valor||0),0);
      const totalMul=ms.reduce((s,l)=>s+Number(l.valor||0),0);
      const pagoRes=rs.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
      const pagoMul=ms.filter(l=>l.pago||l.valor===0).reduce((s,l)=>s+Number(l.valor||0),0);
      return{userId,name,reservas:rs,multas:ms,totalRes,totalMul,total:totalRes+totalMul,pago:pagoRes+pagoMul};
    }).filter(p=>p.reservas.length>0||p.multas.length>0);

  const opcoesProf=[{value:"",label:"Todos os profissionais"},...Object.entries(todosIds).map(([id,name])=>({value:id,label:name}))];

  // Componente de linha padrao
  const LinhaItem=({data,sala,tipo,horario,valor,pago,onToggle,isMulta,dispensada,justificativa})=>(
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 0",borderTop:`1px solid ${C.border}`,flexWrap:"wrap"}}>
      <div style={{fontSize:13,color:C.textMid,minWidth:86,flexShrink:0}}>{data}</div>
      {sala&&<SalaTag salaId={sala} salas={salas}/>}
      {tipo&&<Badge label={tipo} bg={isMulta?C.dangerLight:C.accentLight} color={isMulta?C.danger:C.accent}/>}
      {horario&&<span style={{fontSize:12,color:C.textMid}}>{horario}</span>}
      {justificativa&&<span style={{fontSize:11,color:C.muted,fontStyle:"italic",flex:1}}>📝 {justificativa}</span>}
      <span style={{flex:1}}/>
      <span style={{fontSize:14,fontWeight:700,color:isMulta&&!dispensada?C.danger:C.text,flexShrink:0}}>
        {dispensada?"Dispensada":fmtR(valor)}
      </span>
      {dispensada
        ?<Badge label="Dispensada" bg={C.successLight} color={C.success}/>
        :<button onClick={onToggle} style={{background:pago?C.successLight:isMulta?C.dangerLight:C.warningLight,color:pago?C.success:isMulta?C.danger:C.warning,border:`1px solid ${pago?C.success:isMulta?C.danger:C.warning}44`,borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
          {pago?"✓ Pago":"Pendente"}
        </button>
      }
    </div>
  );

  return(
    <div>
      <h2 style={{margin:"0 0 20px",color:C.text,fontSize:22,fontWeight:800}}>Cobranças</h2>

      {/* Filtros */}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{width:140}}><Field label="Mês" value={mes} onChange={v=>setMes(Number(v))} options={MONTH_SHORT.map((n,i)=>({value:i,label:n}))}/></div>
        <div style={{width:90}}><Field label="Ano" value={ano} onChange={v=>setAno(Number(v))} options={[2024,2025,2026,2027].map(y=>({value:y,label:String(y)}))}/></div>
        <div style={{flex:1,minWidth:200}}><Field label="Profissional" value={filtroPro} onChange={setFiltroPro} options={opcoesProf}/></div>
      </div>

      {/* Vencimento */}
      <div style={{background:C.warningLight,border:`1px solid ${C.warning}33`,borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:13,color:C.textMid}}>
        📅 Vencimento de <strong>{MONTH_FULL[mes]}/{ano}</strong>: <strong style={{color:C.danger}}>{fmt(vencimentoMes(mesStr))}</strong>
      </div>

      {/* Totais gerais */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:24}}>
        <Stat label="Reservas" value={fmtR(totalReservas)} color={C.text}/>
        <Stat label="Multas" value={fmtR(totalMultas)} color={C.danger}/>
        <Stat label="Total" value={fmtR(totalGeral)} color={C.text}/>
        <Stat label="Recebido" value={fmtR(totalPago)} color={C.success}/>
        <Stat label="Pendente" value={fmtR(totalGeral-totalPago)} color={C.warning}/>
      </div>

      {/* Por profissional */}
      {porUser.length===0&&<Card><p style={{color:C.muted,margin:0}}>Nenhuma movimentação neste período.</p></Card>}
      {porUser.map(pro=>(<Card key={pro.userId} style={{marginBottom:16}}>

        {/* Cabeçalho do profissional */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <span style={{fontWeight:800,color:C.text,fontSize:15}}>{pro.name}</span>
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{fontSize:13,color:C.textMid}}>
              Reservas: <strong>{fmtR(pro.totalRes)}</strong>
              {pro.totalMul>0&&<> · Multas: <strong style={{color:C.danger}}>{fmtR(pro.totalMul)}</strong></>}
            </div>
            {pro.total-pro.pago>0
              ?<><span style={{fontSize:13,color:C.warning,fontWeight:700}}>{fmtR(pro.total-pro.pago)} pendente</span>
                <Btn variant="success" small onClick={()=>quitarTudo(pro.userId)}>Quitar tudo</Btn></>
              :<span style={{fontSize:13,color:C.success,fontWeight:600}}>✓ Quitado</span>
            }
          </div>
        </div>

        {/* Reservas */}
        {pro.reservas.length>0&&(<>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:4,marginBottom:2}}>Reservas</div>
          {pro.reservas.map(r=>(
            <LinhaItem key={r.id}
              data={fmt(r.date)}
              sala={r.sala}
              tipo={modoLabel[r.modo]||r.modo}
              horario={r.horaInicio&&r.horaFim?`${r.horaInicio}–${r.horaFim}`:""}
              valor={r.valor||0}
              pago={r.pago}
              onToggle={()=>togglePago(r.id)}
              isMulta={false}
            />
          ))}
        </>)}

        {/* Multas */}
        {pro.multas.length>0&&(<>
          <div style={{fontSize:11,color:C.danger,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:14,marginBottom:2}}>Multas por cancelamento</div>
          {pro.multas.map(l=>(
            <LinhaItem key={l.id}
              data={fmt(l.date)}
              sala={l.sala||null}
              tipo={l.modoOriginal?modoLabel[l.modoOriginal]||"Cancelamento":"Cancelamento"}
              horario={l.horaInicio&&l.horaFim?`${l.horaInicio}–${l.horaFim}`:""}
              valor={l.valor||0}
              pago={l.pago}
              onToggle={()=>togglePagoMulta(l.id)}
              isMulta={true}
              dispensada={l.valor===0}
              justificativa={l.justificativa}
            />
          ))}
        </>)}

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
          <Field label="Hora avulsa (R$/h)" type="number" value={form.valorHoraAvulsa} onChange={v=>setForm(f=>({...f,valorHoraAvulsa:Number(v)}))} helper={`Tarifa para reservas avulsa e quinzenal`}/>
          <Field label="Hora fixa semanal (R$/h)" type="number" value={form.valorHoraFixa||33} onChange={v=>setForm(f=>({...f,valorHoraFixa:Number(v)}))} helper={`Tarifa para pacotes semanais`}/>
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
  const[users,setUsers]=useState([]);
  const[reservasAll,setReservasAll]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filtroPro,setFiltroPro]=useState("");
  const[filtroTipo,setFiltroTipo]=useState("todos");

  useEffect(()=>{
    const u1=onSnapshot(collection(db,"historico"),snap=>{
      setHistorico(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    const u2=onSnapshot(collection(db,"users"),snap=>{
      setUsers(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    const u3=onSnapshot(collection(db,"reservas"),snap=>{
      setReservasAll(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    });
    return()=>{u1();u2();u3();};
  },[]);

  const profissionais=users.filter(u=>u.role==="professional");
  const opcoesProf=[{value:"",label:"Todos os profissionais"},...profissionais.map(p=>({value:p.uid,label:p.nome||p.email}))];

  const fmtDtHr=(iso)=>{
    if(!iso)return"";
    return new Date(iso).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
  };

  const getSalaLabel=(salaId)=>{
    if(!salaId)return"";
    if(salaId==="sala1")return"Sala 1";
    if(salaId==="sala2")return"Sala 2";
    return salaId;
  };

  const getTimestamp=(h)=>h.canceladoEm||h.editadoEm||h.criadoEm||"";

  // Filtra e ordena
  const listaFiltrada=historico
    .filter(h=>{
      if(filtroPro&&h.userId!==filtroPro)return false;
      if(filtroTipo==="reservas"&&h.tipo!=="criacao")return false;
      if(filtroTipo==="cancelamentos"&&h.tipo!=="cancelamento")return false;
      if(filtroTipo==="edicoes"&&h.tipo!=="edicao")return false;
      return true;
    })
    .sort((a,b)=>getTimestamp(b).localeCompare(getTimestamp(a)));

  const TipoBadge=({tipo})=>{
    const cfg={
      cancelamento:{bg:C.dangerLight,color:C.danger,label:"Cancelamento"},
      criacao:{bg:C.successLight,color:C.success,label:"Nova reserva"},
      edicao:{bg:C.accentLight,color:C.accent,label:"Edição"},
    }[tipo]||{bg:C.surfaceAlt,color:C.muted,label:tipo};
    return<span style={{background:cfg.bg,color:cfg.color,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,flexShrink:0}}>{cfg.label}</span>;
  };

  const DotColor=({tipo})=>{
    const colors={cancelamento:C.danger,criacao:C.success,edicao:C.accent};
    return<div style={{width:8,height:8,borderRadius:"50%",background:colors[tipo]||C.muted,flexShrink:0,marginTop:6}}/>;
  };

  if(loading)return<div style={{color:C.muted,padding:20}}>Carregando...</div>;

  return(
    <div>
      <h2 style={{margin:"0 0 8px",color:C.text,fontSize:22,fontWeight:800}}>Histórico</h2>
      <p style={{color:C.muted,fontSize:13,margin:"0 0 20px"}}>Registro de todas as ações dos profissionais no sistema.</p>

      {/* Filtros */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{flex:1,minWidth:200}}><Field label="Profissional" value={filtroPro} onChange={setFiltroPro} options={opcoesProf}/></div>
        <div style={{display:"flex",gap:6,alignItems:"flex-end",paddingBottom:14}}>
          {[
            {value:"todos",label:"Tudo"},
            {value:"reservas",label:"🟢 Reservas"},
            {value:"cancelamentos",label:"🔴 Cancelamentos"},
            {value:"edicoes",label:"🔵 Edições"},
          ].map(op=>(
            <button key={op.value} onClick={()=>setFiltroTipo(op.value)}
              style={{padding:"8px 14px",border:`1px solid ${filtroTipo===op.value?C.accent:C.border}`,borderRadius:8,background:filtroTipo===op.value?C.accentLight:C.white,color:filtroTipo===op.value?C.accent:C.textMid,cursor:"pointer",fontFamily:"inherit",fontWeight:filtroTipo===op.value?700:500,fontSize:13}}>
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log unificado */}
      <Card>
        {listaFiltrada.length===0&&<p style={{color:C.muted,margin:0,fontSize:14}}>Nenhuma atividade encontrada.</p>}
        {listaFiltrada.map(h=>{
          const ts=getTimestamp(h);
          const nomeUser=h.userName||users.find(u=>u.uid===h.userId)?.nome||"—";
          return(
            <div key={h.id} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
              <DotColor tipo={h.tipo}/>
              <div style={{flex:1,minWidth:0}}>
                {/* Linha 1: badge + nome + timestamp */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <TipoBadge tipo={h.tipo}/>
                    <span style={{fontSize:13,fontWeight:600,color:C.text}}>{nomeUser}</span>
                  </div>
                  <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>🕐 {fmtDtHr(ts)}</span>
                </div>

                {/* Linha 2: detalhes */}
                {h.tipo==="criacao"&&(
                  <div style={{fontSize:13,color:C.textMid}}>
                    <strong>{fmt(h.date)}</strong> · {h.horaInicio}–{h.horaFim} · <strong>{getSalaLabel(h.sala)}</strong>
                    <span style={{
                      marginLeft:8,fontSize:12,fontWeight:600,
                      color:h.recorrencia==="unica"?C.muted:C.fixo,
                      background:h.recorrencia==="unica"?C.surfaceAlt:C.fixoLight,
                      borderRadius:4,padding:"1px 7px"
                    }}>
                      {h.recorrencia==="semanal"?"↻ Semanal":h.recorrencia==="quinzenal"?"↻ Quinzenal":"Avulsa"}
                      {h.recorrencia!=="unica"&&h.totalGeradas>1&&` · ${h.totalGeradas} reservas`}
                    </span>
                  </div>
                )}

                {h.tipo==="cancelamento"&&(
                  <div style={{fontSize:13,color:C.textMid}}>
                    <strong>{fmt(h.date)}</strong> · {h.horaInicio}–{h.horaFim} · <strong>{getSalaLabel(h.sala)}</strong>
                    {h.escopo&&h.escopo!=="somente"&&(
                      <span style={{color:C.warning,marginLeft:6,fontSize:12}}>
                        ({h.escopo==="proximos"?"este e seguintes":"todos da série"})
                      </span>
                    )}
                  </div>
                )}

                {h.tipo==="edicao"&&(
                  <div style={{fontSize:13,color:C.textMid}}>
                    {/* Mostra cada tipo de mudança detectada */}
                    {(()=>{
                      const mods=h.mudancas?h.mudancas.split(","):["data","horario","sala"];
                      const linhas=[];
                      const modLabel={
                        presencial:"🏢 Presencial",online:"💻 Online",
                        unica:"Avulsa",semanal:"Semanal",quinzenal:"Quinzenal"
                      };
                      if(mods.includes("data")||mods.includes("horario")||(!h.mudancas)){
                        linhas.push(
                          <div key="dh">
                            <strong>{fmt(h.antesDate||h.antes?.date)}</strong> {h.antesInicio||h.antes?.horaInicio}–{h.antesFim||h.antes?.horaFim}
                            <span style={{color:C.accent,margin:"0 6px",fontWeight:700}}>→</span>
                            <strong>{fmt(h.depoisDate||h.depois?.date)}</strong> {h.depoisInicio||h.depois?.horaInicio}–{h.depoisFim||h.depois?.horaFim}
                          </div>
                        );
                      }
                      if(mods.includes("sala")){
                        linhas.push(
                          <div key="sala" style={{marginTop:2}}>
                            Sala: <strong>{getSalaLabel(h.antesSala||h.antes?.sala)}</strong>
                            <span style={{color:C.accent,margin:"0 6px",fontWeight:700}}>→</span>
                            <strong>{getSalaLabel(h.depoisSala||h.depois?.sala)}</strong>
                          </div>
                        );
                      }
                      if(mods.includes("modalidade")){
                        linhas.push(
                          <div key="mod" style={{marginTop:2}}>
                            Modalidade: <strong>{modLabel[h.antesModalidade]||h.antesModalidade}</strong>
                            <span style={{color:C.accent,margin:"0 6px",fontWeight:700}}>→</span>
                            <strong>{modLabel[h.depoisModalidade]||h.depoisModalidade}</strong>
                          </div>
                        );
                      }
                      if(mods.includes("recorrencia")||(h.antesRecorrencia&&h.depoisRecorrencia&&h.antesRecorrencia!==h.depoisRecorrencia)){
                        const rLabel={unica:"Avulsa (não se repete)",semanal:"Semanalmente",quinzenal:"Quinzenalmente"};
                        linhas.push(
                          <div key="rec" style={{marginTop:2,background:C.fixoLight,borderRadius:6,padding:"4px 8px",display:"inline-flex",alignItems:"center",gap:6}}>
                            <span style={{color:C.fixo,fontWeight:600}}>↻ Recorrência:</span>
                            <strong style={{color:C.text}}>{rLabel[h.antesRecorrencia]||h.antesRecorrencia||"Avulsa"}</strong>
                            <span style={{color:C.accent,fontWeight:700}}>→</span>
                            <strong style={{color:C.text}}>{rLabel[h.depoisRecorrencia]||h.depoisRecorrencia||"Avulsa"}</strong>
                          </div>
                        );
                      }
                      if(linhas.length===0){
                        linhas.push(
                          <div key="gen" style={{color:C.muted,fontStyle:"italic"}}>
                            Edição realizada
                          </div>
                        );
                      }
                      return linhas;
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}



function FinanceiroView({reservas,config}){
  const[despesas,setDespesas]=useState([]);
  const[lancamentos,setLancamentos]=useState([]);
  const[mes,setMes]=useState(new Date().getMonth());
  const[ano,setAno]=useState(new Date().getFullYear());
  const[modal,setModal]=useState(false);
  const[editandoDespesa,setEditandoDespesa]=useState(null);
  const[form,setForm]=useState({nome:"",valor:"",categoria:"Aluguel",tipo:"fixa",diaVencimento:"18",vencimento:"",pago:false,observacao:""});

  const CATEGORIAS=["Aluguel","Água / Luz / Gás","Cartão de crédito","Internet","Material","Manutenção","Outros"];

  useEffect(()=>{
    const u1=onSnapshot(collection(db,"despesas"),snap=>{
      setDespesas(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    const u2=onSnapshot(collection(db,"lancamentos"),snap=>{
      setLancamentos(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return()=>{u1();u2();};
  },[]);

  const mesStr=`${ano}-${String(mes+1).padStart(2,"0")}`;
  const navMes=(dir)=>{
    if(dir===-1&&mes===0){setMes(11);setAno(a=>a-1);}
    else if(dir===1&&mes===11){setMes(0);setAno(a=>a+1);}
    else setMes(m=>m+dir);
  };

  // Entradas do mês (reservas pagas)
  const reservasMes=reservas.filter(r=>r.date?.slice(0,7)===mesStr||(r.modo==="mensal"&&r.mesMensal===mesStr));
  const entradasPagas=reservasMes.filter(r=>r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const entradasPendentes=reservasMes.filter(r=>!r.pago).reduce((s,r)=>s+Number(r.valor||0),0);
  const multasMes=lancamentos.filter(l=>l.date?.slice(0,7)===mesStr||l.criadoEm?.slice(0,7)===mesStr);
  const multasPagas=multasMes.filter(l=>l.pago).reduce((s,l)=>s+Number(l.valor||0),0);
  const totalEntradas=entradasPagas+multasPagas;

  // Despesas do mês
  const despesasMes=despesas.filter(d=>{
    if(d.tipo==="fixa"){
      // Despesa fixa: aparece em todo mês com vencimento no dia configurado
      return true;
    }
    return d.vencimento?.slice(0,7)===mesStr;
  }).map(d=>{
    if(d.tipo==="fixa"){
      // Gera vencimento do mês atual
      const dia=String(d.diaVencimento||1).padStart(2,"0");
      return{...d,vencimentoMes:`${mesStr}-${dia}`,pagoMes:d.pagoMeses?.[mesStr]||false};
    }
    return{...d,vencimentoMes:d.vencimento,pagoMes:d.pago||false};
  });

  const totalSaidas=despesasMes.reduce((s,d)=>s+Number(d.valor||0),0);
  const saidasPagas=despesasMes.filter(d=>d.pagoMes).reduce((s,d)=>s+Number(d.valor||0),0);
  const saldo=totalEntradas-saidasPagas;

  // Alertas: vencendo em 7 dias
  const hoje=today();
  const em7=addDays(hoje,7);
  const alertas=despesasMes.filter(d=>!d.pagoMes&&d.vencimentoMes>=hoje&&d.vencimentoMes<=em7);
  const vencidas=despesasMes.filter(d=>!d.pagoMes&&d.vencimentoMes<hoje);

  const togglePagoDespesa=async(desp)=>{
    if(desp.tipo==="fixa"){
      const pagoMeses={...desp.pagoMeses,[mesStr]:!desp.pagoMes};
      await setDoc(doc(db,"despesas",desp.id),{...desp,pagoMeses});
      setDespesas(prev=>prev.map(d=>d.id===desp.id?{...d,pagoMeses}:d));
    } else {
      const u={...desp,pago:!desp.pago};
      await setDoc(doc(db,"despesas",desp.id),u);
      setDespesas(prev=>prev.map(d=>d.id===desp.id?u:d));
    }
  };

  const abrirNova=()=>{
    setEditandoDespesa(null);
    setForm({nome:"",valor:"",categoria:"Aluguel",tipo:"fixa",diaVencimento:"18",vencimento:"",pago:false,observacao:""});
    setModal(true);
  };

  const abrirEditar=(d)=>{
    setEditandoDespesa(d);
    setForm({nome:d.nome,valor:String(d.valor||""),categoria:d.categoria||"Aluguel",tipo:d.tipo||"fixa",diaVencimento:String(d.diaVencimento||"18"),vencimento:d.vencimento||"",pago:d.pago||false,observacao:d.observacao||""});
    setModal(true);
  };

  const salvar=async()=>{
    const dados={
      nome:form.nome,valor:Number(form.valor)||0,categoria:form.categoria,
      tipo:form.tipo,diaVencimento:form.tipo==="fixa"?Number(form.diaVencimento):null,
      vencimento:form.tipo==="variavel"?form.vencimento:null,
      pago:form.tipo==="variavel"?form.pago:false,
      observacao:form.observacao,criadoEm:new Date().toISOString()
    };
    if(editandoDespesa){
      await setDoc(doc(db,"despesas",editandoDespesa.id),cleanObj({...editandoDespesa,...dados}));
    } else {
      await setDoc(doc(db,"despesas",uid()),cleanObj(dados));
    }
    setModal(false);
  };

  const excluirDespesa=async(id)=>{
    if(window.confirm("Excluir esta despesa?"))await deleteDoc(doc(db,"despesas",id));
  };

  return(
    <div>
      <h2 style={{margin:"0 0 8px",color:C.text,fontSize:22,fontWeight:800}}>Financeiro</h2>
      <p style={{color:C.muted,fontSize:13,margin:"0 0 20px"}}>Fluxo de caixa da clínica — entradas e saídas.</p>

      {/* Navegação por mês */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 20px"}}>
        <button onClick={()=>navMes(-1)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:C.accent,fontWeight:700,padding:"0 8px"}}>←</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontWeight:800,color:C.text,fontSize:17}}>{MONTH_FULL[mes]} {ano}</div>
        </div>
        <button onClick={()=>navMes(1)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:C.accent,fontWeight:700,padding:"0 8px"}}>→</button>
      </div>

      {/* Alertas */}
      {vencidas.length>0&&(
        <div style={{background:C.dangerLight,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontWeight:700,color:C.danger,marginBottom:6}}>🚨 {vencidas.length} despesa{vencidas.length>1?"s":""} vencida{vencidas.length>1?"s":""}</div>
          {vencidas.map(d=><div key={d.id} style={{fontSize:13,color:C.danger}}>{d.nome} — {fmtR(d.valor)} (venceu em {fmt(d.vencimentoMes)})</div>)}
        </div>
      )}
      {alertas.length>0&&(
        <div style={{background:C.warningLight,border:`1px solid ${C.warning}44`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontWeight:700,color:C.warning,marginBottom:6}}>⚠️ Vencendo nos próximos 7 dias</div>
          {alertas.map(d=><div key={d.id} style={{fontSize:13,color:C.warning}}>{d.nome} — {fmtR(d.valor)} (vence em {fmt(d.vencimentoMes)})</div>)}
        </div>
      )}

      {/* Cards resumo */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
        <Stat label="Entradas pagas" value={fmtR(totalEntradas)} color={C.success}/>
        <Stat label="A receber" value={fmtR(entradasPendentes)} color={C.textMid}/>
        <Stat label="Saídas" value={fmtR(totalSaidas)} color={C.danger}/>
        <Stat label="Saídas pagas" value={fmtR(saidasPagas)} color={C.textMid}/>
        <Stat label="Saldo" value={fmtR(saldo)} color={saldo>=0?C.success:C.danger} sub={saldo>=0?"✓ Positivo":"⚠️ Negativo"}/>
      </div>

      {/* Despesas */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,color:C.text,fontSize:15,fontWeight:700}}>💸 Despesas — {MONTH_FULL[mes]}</h3>
          <Btn small onClick={abrirNova}>+ Nova despesa</Btn>
        </div>

        {despesasMes.length===0&&<p style={{color:C.muted,margin:0,fontSize:14}}>Nenhuma despesa cadastrada.</p>}

        {/* Agrupa por categoria */}
        {CATEGORIAS.filter(cat=>despesasMes.some(d=>d.categoria===cat)).map(cat=>(
          <div key={cat} style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{cat}</div>
            {despesasMes.filter(d=>d.categoria===cat).map(d=>(
              <div key={d.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderTop:`1px solid ${C.border}`,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:C.text}}>{d.nome}</div>
                  <div style={{fontSize:12,color:C.muted}}>
                    {d.tipo==="fixa"?`Fixa · vence dia ${d.diaVencimento} de cada mês`:`Variável · vence ${fmt(d.vencimentoMes)}`}
                    {d.observacao&&<span> · {d.observacao}</span>}
                  </div>
                </div>
                <span style={{fontSize:15,fontWeight:800,color:C.text,flexShrink:0}}>{fmtR(d.valor)}</span>
                <button onClick={()=>togglePagoDespesa(d)} style={{background:d.pagoMes?C.successLight:C.warningLight,color:d.pagoMes?C.success:C.warning,border:`1px solid ${d.pagoMes?C.success:C.warning}44`,borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
                  {d.pagoMes?"✓ Pago":"Pendente"}
                </button>
                <Btn variant="ghost" small onClick={()=>abrirEditar(d)}>✏️</Btn>
                <Btn variant="danger" small onClick={()=>excluirDespesa(d.id)}>✕</Btn>
              </div>
            ))}
          </div>
        ))}

        {/* Linha de total */}
        {despesasMes.length>0&&(
          <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderTop:`2px solid ${C.border}`,marginTop:8}}>
            <span style={{fontWeight:700,color:C.text}}>Total despesas</span>
            <span style={{fontWeight:800,color:C.danger,fontSize:16}}>{fmtR(totalSaidas)}</span>
          </div>
        )}
      </Card>

      {/* Entradas resumidas */}
      <Card style={{marginTop:16}}>
        <h3 style={{margin:"0 0 14px",color:C.text,fontSize:15,fontWeight:700}}>💰 Entradas — {MONTH_FULL[mes]}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:14,color:C.textMid}}>Reservas pagas</span>
            <span style={{fontSize:14,fontWeight:700,color:C.success}}>{fmtR(entradasPagas)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:14,color:C.textMid}}>Multas recebidas</span>
            <span style={{fontSize:14,fontWeight:700,color:C.success}}>{fmtR(multasPagas)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:14,color:C.muted}}>Reservas pendentes (a receber)</span>
            <span style={{fontSize:14,fontWeight:600,color:C.muted}}>{fmtR(entradasPendentes)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderTop:`2px solid ${C.border}`}}>
            <span style={{fontWeight:700,color:C.text}}>Total entradas pagas</span>
            <span style={{fontWeight:800,color:C.success,fontSize:16}}>{fmtR(totalEntradas)}</span>
          </div>
        </div>
      </Card>

      {/* Modal nova/editar despesa */}
      {modal&&(
        <Modal title={editandoDespesa?"Editar Despesa":"Nova Despesa"} onClose={()=>setModal(false)}>
          <Field label="Nome da despesa *" value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))} placeholder="Ex: Aluguel, Conta de luz..."/>
          <Field label="Valor (R$) *" type="number" value={form.valor} onChange={v=>setForm(f=>({...f,valor:v}))}/>
          <Field label="Categoria" value={form.categoria} onChange={v=>setForm(f=>({...f,categoria:v}))} options={CATEGORIAS.map(c=>({value:c,label:c}))}/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>Tipo</label>
            <div style={{display:"flex",gap:8}}>
              {[["fixa","📅 Fixa (todo mês)"],["variavel","📌 Variável (única)"]].map(([v,l])=>(
                <button key={v} onClick={()=>setForm(f=>({...f,tipo:v}))} style={{flex:1,padding:"9px",border:`2px solid ${form.tipo===v?C.accent:C.border}`,borderRadius:10,background:form.tipo===v?C.accentLight:C.white,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,color:form.tipo===v?C.accent:C.textMid}}>{l}</button>
              ))}
            </div>
          </div>
          {form.tipo==="fixa"&&<Field label="Dia de vencimento (todo mês)" type="number" value={form.diaVencimento} onChange={v=>setForm(f=>({...f,diaVencimento:v}))} helper="Ex: 18 = vence todo dia 18"/>}
          {form.tipo==="variavel"&&<Field label="Data de vencimento" type="date" value={form.vencimento} onChange={v=>setForm(f=>({...f,vencimento:v}))}/>}
          <Field label="Observação" value={form.observacao} onChange={v=>setForm(f=>({...f,observacao:v}))} placeholder="Opcional..."/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={salvar}>{editandoDespesa?"Salvar":"Cadastrar"}</Btn>
          </div>
        </Modal>
      )}
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

  const navManager=[{id:"dashboard",icon:"📊",label:"Dashboard"},{id:"agenda",icon:"📅",label:"Agenda"},{id:"cobrancas",icon:"💰",label:"Cobranças"},{id:"financeiro",icon:"💵",label:"Financeiro"},{id:"historico",icon:"📋",label:"Histórico"},{id:"profissionais",icon:"👥",label:"Profissionais"},{id:"configuracoes",icon:"⚙️",label:"Config"}];
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
        {view==="financeiro"&&isManager&&<FinanceiroView reservas={reservas} config={config}/>}
        {view==="historico"&&isManager&&<HistoricoView/>}
        {view==="profissionais"&&isManager&&<ProfissionaisView/>}
        {view==="configuracoes"&&isManager&&<ConfigView config={config} setConfig={setConfig}/>}
      </div>
    </div>
  );
}
