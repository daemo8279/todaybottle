import { db, requireAdmin } from "../_db.js";

function clamp5(v){ return Math.max(1,Math.min(5,Number(v)||3)); }

export default async function handler(req,res){
  if(!requireAdmin(req,res)) return;
  const sql=db();
  if(!sql) return res.status(503).json({error:"DATABASE_URL is not configured"});

  try{
    if(req.method==="GET"){
      const rows=await sql`
        select * from wines order by created_at desc limit 300
      `;
      return res.status(200).json({wines:rows});
    }

    if(req.method==="POST"){
      const b=req.body||{};
      if(!b.wine_name || !b.wine_type || !b.style_description || !b.mood_description){
        return res.status(400).json({error:"required wine fields are missing"});
      }
      const rows=await sql`
        insert into wines (
          wine_name,producer,wine_type,country,region,grape,vintage,price_krw,
          sweetness,acidity,tannin,body,alcohol,fruit_intensity,aroma_intensity,
          oak_intensity,freshness,mineral,complexity,novelty_level,approachability,
          traditional_score,blend_yn,aroma_family,food_pairing_tags,occasion_tags,
          style_description,mood_description,source_url,source_text,ai_model,ai_confidence,verified
        ) values (
          ${b.wine_name},${b.producer||""},${b.wine_type},${b.country||""},${b.region||""},
          ${b.grape||""},${b.vintage||""},${Math.max(0,Number(b.price_krw)||0)},
          ${clamp5(b.sweetness)},${clamp5(b.acidity)},${clamp5(b.tannin)},${clamp5(b.body)},
          ${clamp5(b.alcohol)},${clamp5(b.fruit_intensity)},${clamp5(b.aroma_intensity)},
          ${clamp5(b.oak_intensity)},${clamp5(b.freshness)},${clamp5(b.mineral)},
          ${clamp5(b.complexity)},${clamp5(b.novelty_level)},${clamp5(b.approachability)},
          ${clamp5(b.traditional_score)},${!!b.blend_yn},
          ${sql.json(Array.isArray(b.aroma_family)?b.aroma_family:[])},
          ${sql.json(Array.isArray(b.food_pairing_tags)?b.food_pairing_tags:[])},
          ${sql.json(Array.isArray(b.occasion_tags)?b.occasion_tags:[])},
          ${b.style_description},${b.mood_description},${b.source_url||""},${b.source_text||""},
          ${b.ai_model||""},${Number(b.ai_confidence)||0},${!!b.verified}
        )
        returning *
      `;
      return res.status(201).json({ok:true,wine:rows[0]});
    }

    if(req.method==="PATCH"){
      const {id,verified}=req.body||{};
      if(!id) return res.status(400).json({error:"id is required"});
      const rows=await sql`
        update wines set verified=${!!verified}, updated_at=now()
        where id=${Number(id)}
        returning *
      `;
      return res.status(200).json({ok:true,wine:rows[0]||null});
    }

    res.setHeader("Allow","GET, POST, PATCH");
    return res.status(405).json({error:"method not allowed"});
  }catch(error){
    console.error(error);
    return res.status(500).json({error:"database operation failed"});
  }
}
