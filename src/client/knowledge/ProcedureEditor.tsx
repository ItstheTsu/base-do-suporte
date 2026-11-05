import { useRef, useState } from "react";
import type { ClipboardEvent } from "react";
import { errorMessage } from "./api";
import type { ArticleImage, ProcedureSection } from "./types";

interface Upload extends ArticleImage { previewUrl: string }
let sequence=0;
function sectionId(){ return "section-"+Date.now().toString(36)+"-"+(++sequence); }
async function prepare(file:File):Promise<Blob>{
 if(!["image/png","image/jpeg"].includes(file.type))throw new Error("Envie apenas PNG ou JPG.");
 if(file.size>5*1024*1024)throw new Error("Cada imagem pode ter até 5 MB.");
 if(typeof createImageBitmap!=="function")return file;
 const bitmap=await createImageBitmap(file);
 try {
  if(bitmap.width<=2400&&bitmap.height<=2400&&file.size<1024*1024)return file;
  const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
  canvas.getContext("2d")?.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,file.type,0.86));
  return blob&&(scale<1||blob.size<file.size)?blob:file;
 } finally {bitmap.close();}
}
export default function ProcedureEditor({value,steps,onChange,onBusy,onPreview}:{value:ProcedureSection[];steps:string[];onChange:(value:ProcedureSection[])=>void;onBusy:(value:boolean)=>void;onPreview:(id:string,url:string)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [previews,setPreviews]=useState<Record<string,string>>({});
 const current=useRef(value);current.current=value;
 function update(index:number,next:ProcedureSection){onChange(current.current.map((section,i)=>i===index?next:section));}
 async function upload(index:number,files:File[]){
  if(busy||!files.length)return;
  const section=current.current[index];
  if(section.images.length+files.length>10){setError("Use até 10 imagens por seção.");return;}
  setBusy(true);onBusy(true);setError("");
  try{
   const uploaded:ArticleImage[]=[];
   for(const file of files){
    const content=await prepare(file);
    const response=await fetch("/api/uploads",{method:"POST",credentials:"same-origin",headers:{"Content-Type":content.type},body:content});
    const data=await response.json();if(!response.ok)throw new Error(data.message||"Não foi possível enviar a imagem.");
    const image=data as Upload;
    uploaded.push({id:image.id,url:image.url,caption:""});
    setPreviews(old=>({...old,[image.id]:image.previewUrl}));
    onPreview(image.id,image.previewUrl);
   }
   update(index,{...current.current[index],images:[...current.current[index].images,...uploaded]});
  }catch(error){setError(errorMessage(error));}finally{setBusy(false);onBusy(false);}
 }
 function paste(event:ClipboardEvent<HTMLTextAreaElement>,index:number){
  const files=Array.from(event.clipboardData.files).filter(file=>file.type==="image/png"||file.type==="image/jpeg");
  if(files.length){event.preventDefault();void upload(index,files);}
 }
 return <section className="kb-editor-section"><div className="kb-procedure-heading"><div><h2>Procedimentos com imagens</h2><p>Organize o atendimento em seções e vincule cada print ao passo correspondente.</p></div><button type="button" className="kb-secondary" disabled={busy||value.length>=20} onClick={()=>onChange([...value,{id:sectionId(),title:value.length?"Nova seção":"Procedimento",steps:value.length?[""]:steps,images:[]}])}>+ Seção</button></div>
  {error&&<p role="alert" className="kb-error-text">{error}</p>}{busy&&<p role="status">Enviando e preparando imagens…</p>}
  {value.map((section,index)=><fieldset key={section.id} disabled={busy} className="kb-procedure-section"><legend>Seção {index+1}</legend><label className="kb-field"><span>Título da seção {index+1}</span><input required minLength={2} maxLength={120} value={section.title} onChange={e=>update(index,{...section,title:e.target.value})}/></label><label className="kb-field"><span>Passos da seção {index+1} — um por linha</span><textarea rows={5} value={section.steps.join("\n")} onChange={e=>update(index,{...section,steps:e.target.value.split("\n")})}/></label>
   <label className="kb-field"><span>Adicionar prints à seção {index+1}</span><input aria-label={"Adicionar prints à seção "+(index+1)} type="file" accept="image/png,image/jpeg" multiple onChange={e=>{void upload(index,Array.from(e.target.files||[]));e.target.value="";}}/><small>PNG ou JPG · até 5 MB por imagem · até 10 por seção.</small></label>
   <label className="kb-field"><span>Colar print da seção {index+1}</span><textarea aria-label={"Colar print da seção "+(index+1)} rows={2} placeholder="Clique aqui e pressione Ctrl+V" onPaste={e=>paste(e,index)}/></label>
   <div className="kb-images-editor">{section.images.map((image,imageIndex)=><div key={image.id} className="kb-image-editor"><img src={previews[image.id]||image.url} alt={image.caption||"Print do procedimento"} loading="lazy"/><label className="kb-field"><span>Legenda do print {imageIndex+1}</span><input maxLength={500} value={image.caption} onChange={e=>update(index,{...section,images:section.images.map((item,i)=>i===imageIndex?{...item,caption:e.target.value}:item)})}/></label><label className="kb-field"><span>Vincular ao passo</span><select value={image.step||""} onChange={e=>update(index,{...section,images:section.images.map((item,i)=>i===imageIndex?{...item,step:e.target.value?Number(e.target.value):undefined}:item)})}><option value="">Seção inteira</option>{section.steps.filter(step=>step.trim()).map((_,i)=><option key={i} value={i+1}>Passo {i+1}</option>)}</select></label><button type="button" className="kb-text-button kb-error-text" onClick={()=>update(index,{...section,images:section.images.filter(item=>item.id!==image.id)})}>Remover print {imageIndex+1}</button></div>)}</div>
   <button type="button" className="kb-text-button" onClick={()=>onChange(current.current.filter((_,i)=>i!==index))}>Remover seção {index+1}</button>
  </fieldset>)}
 </section>;
}
