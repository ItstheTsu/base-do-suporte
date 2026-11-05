import { randomBytes, randomUUID, createHash, timingSafeEqual } from "node:crypto";
import { httpError } from "./article.js";
const digest = value => createHash("sha256").update(value).digest();
const fileTypes = new Set(["image/png","image/jpeg"]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export function mediaService(store) {
  const db=store.db;
  db.exec("CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY,mime TEXT NOT NULL,content BLOB NOT NULL,created_at INTEGER NOT NULL,preview_hash BLOB NOT NULL,preview_expires INTEGER NOT NULL)");
  const reference = (id,published=false) => Boolean(db.prepare(`SELECT 1 FROM articles a,json_tree(a.document,'$.procedureSections') j WHERE j.key='id' AND j.value=? ${published?"AND a.status='published' AND a.deleted_at IS NULL":""} LIMIT 1`).get(id));
  return {
    create(content,mime) {
      if (!fileTypes.has(mime)) throw httpError(415,"Envie apenas PNG ou JPG.");
      if (!Buffer.isBuffer(content) || !content.length || content.length > MAX_IMAGE_BYTES) throw httpError(413,"Cada imagem pode ter até 5 MB.");
      const png=content.length>=24&&content.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      const jpg=content.length>=4&&content[0]===255&&content[1]===216&&content[2]===255&&content[content.length-2]===255&&content[content.length-1]===217;
      if (!(mime==="image/png"?png:jpg)) throw httpError(422,"O conteúdo não corresponde a uma imagem PNG/JPG.");
      const now=Date.now();
      for(const row of db.prepare("SELECT id FROM media WHERE created_at<?").all(now-24*60*60*1000)) if(!reference(row.id)) db.prepare("DELETE FROM media WHERE id=?").run(row.id);
      const size=db.prepare("SELECT COALESCE(SUM(length(content)),0) AS bytes FROM media").get().bytes;
      if(size+content.length>512*1024*1024)throw httpError(413,"O limite de armazenamento de imagens foi atingido. Solicite revisão ao suporte.");
      const id=randomUUID(),token=randomBytes(32).toString("hex");
      db.prepare("INSERT INTO media VALUES(?,?,?,?,?,?)").run(id,mime,content,now,digest(token),now+30*60*1000);
      return {id,url:"/api/uploads/"+id,previewUrl:"/api/uploads/"+id+"?preview="+token};
    },
    read(id,token,support) {
      const row=db.prepare("SELECT * FROM media WHERE id=?").get(id);
      if(!row)throw httpError(404,"Imagem não encontrada.");
      const preview=typeof token==="string"&&/^[a-f0-9]{64}$/.test(token)&&row.preview_expires>Date.now()&&timingSafeEqual(digest(token),Buffer.from(row.preview_hash));
      if(!support&&!reference(id,true)&&!preview)throw httpError(404,"Imagem não encontrada.");
      return row;
    },
    validate(document) {
      for(const section of document.procedureSections || [])for(const image of section.images)
        if(!db.prepare("SELECT 1 FROM media WHERE id=?").get(image.id))throw httpError(422,"Uma imagem não está mais disponível. Envie-a novamente.");
      return document;
    }
  };
}
