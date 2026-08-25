import OpenAI from "openai";
import { requireAdmin } from "../_db.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "wine_name","producer","wine_type","country","region","grape","vintage","price_krw",
    "sweetness","acidity","tannin","body","alcohol","fruit_intensity","aroma_intensity",
    "oak_intensity","freshness","mineral","complexity","novelty_level","approachability",
    "traditional_score","blend_yn","aroma_family","food_pairing_tags","occasion_tags",
    "style_description","mood_description","ai_confidence"
  ],
  properties: {
    wine_name:{type:"string"},
    producer:{type:"string"},
    wine_type:{type:"string",enum:["RED","WHITE","SPARKLING","ROSE","ORANGE"]},
    country:{type:"string"},
    region:{type:"string"},
    grape:{type:"string"},
    vintage:{type:"string"},
    price_krw:{type:"integer",minimum:0,maximum:10000000},
    sweetness:{type:"integer",minimum:1,maximum:5},
    acidity:{type:"integer",minimum:1,maximum:5},
    tannin:{type:"integer",minimum:1,maximum:5},
    body:{type:"integer",minimum:1,maximum:5},
    alcohol:{type:"integer",minimum:1,maximum:5},
    fruit_intensity:{type:"integer",minimum:1,maximum:5},
    aroma_intensity:{type:"integer",minimum:1,maximum:5},
    oak_intensity:{type:"integer",minimum:1,maximum:5},
    freshness:{type:"integer",minimum:1,maximum:5},
    mineral:{type:"integer",minimum:1,maximum:5},
    complexity:{type:"integer",minimum:1,maximum:5},
    novelty_level:{type:"integer",minimum:1,maximum:5},
    approachability:{type:"integer",minimum:1,maximum:5},
    traditional_score:{type:"integer",minimum:1,maximum:5},
    blend_yn:{type:"boolean"},
    aroma_family:{type:"array",items:{type:"string"},maxItems:8},
    food_pairing_tags:{type:"array",items:{type:"string"},maxItems:10},
    occasion_tags:{type:"array",items:{type:"string"},maxItems:8},
    style_description:{type:"string"},
    mood_description:{type:"string"},
    ai_confidence:{type:"number",minimum:0,maximum:1}
  }
};

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"method not allowed"});
  if(!requireAdmin(req,res)) return;
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"OPENAI_API_KEY is not configured"});

  const { wine_name, source_url="", source_text="" } = req.body || {};
  if(!wine_name || typeof wine_name!=="string"){
    return res.status(400).json({error:"wine_name is required"});
  }

  const source = String(source_text||"").slice(0,12000);
  const prompt = `
You are a wine database curator for a recommendation app.
Convert the supplied wine information into the exact structured schema.

Rules:
- Never invent a producer, region, grape, vintage, or price when the source does not support it.
- For unknown text fields use an empty string. For unknown price use 0.
- Sensory attributes are recommendation-engine estimates on a 1–5 scale. Infer conservatively.
- tannin should normally be 1 for white/sparkling wines unless skin contact justifies otherwise.
- novelty_level means how unfamiliar this style is to a mainstream Korean casual wine drinker, not wine quality.
- style_description: 1–2 Korean sentences explaining aroma, flavor, texture.
- mood_description: 1 concise Korean sentence explaining the drinking impression.
- food_pairing_tags and occasion_tags must be short uppercase English codes.
- ai_confidence must reflect how sufficient the supplied source is.
- Do not claim web verification. You only have the text supplied below.

Wine name: ${wine_name}
Source URL (reference only; do not claim you opened it): ${source_url}
Source text:
${source || "(no source text supplied)"}
`;

  try{
    const response = await client.responses.create({
      model: process.env.OPENAI_WINE_MODEL || "gpt-5.6-luna",
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "wine_profile",
          strict: true,
          schema
        }
      }
    });
    const data = JSON.parse(response.output_text);
    return res.status(200).json({ ok:true, wine:data, model:process.env.OPENAI_WINE_MODEL || "gpt-5.6-luna" });
  }catch(error){
    console.error(error);
    return res.status(500).json({error:"AI analysis failed"});
  }
}
