import { db } from "./_db.js";

export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"method not allowed"});
  const sql=db();
  if(!sql) return res.status(200).json({wines:[]});

  try{
    const rows=await sql`
      select
        id,wine_name,wine_type,country,region,grape,price_krw,
        acidity,tannin,body,aroma_intensity,oak_intensity,freshness,
        fruit_intensity,complexity,novelty_level,
        food_pairing_tags,occasion_tags,style_description,mood_description
      from wines
      where verified=true
      order by created_at desc
      limit 1000
    `;

    const wines=rows.map(w=>({
      id:`DB${w.id}`,
      name:w.wine_name,
      type:w.wine_type,
      price:Number(w.price_krw)||0,
      country:w.country||"",
      region:w.region||"",
      grape:w.grape||"",
      acidity:Number(w.acidity),
      tannin:Number(w.tannin),
      body:Number(w.body),
      aroma:Number(w.aroma_intensity),
      oak:Number(w.oak_intensity),
      fresh:Number(w.freshness),
      fruit:Number(w.fruit_intensity),
      complex:Number(w.complexity),
      novelty:Number(w.novelty_level),
      style:w.style_description,
      mood:w.mood_description,
      tags:[...(w.food_pairing_tags||[]),...(w.occasion_tags||[])]
    }));

    res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({wines});
  }catch(error){
    console.error(error);
    return res.status(200).json({wines:[]});
  }
}
