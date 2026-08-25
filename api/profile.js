import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let sql;

function getSql() {
  if (!connectionString) return null;
  if (!sql) {
    sql = postgres(connectionString, {
      ssl: "require",
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10
    });
  }
  return sql;
}

function send(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, GET, OPTIONS");
    return res.status(204).end();
  }

  const db = getSql();
  if (!db) {
    return send(res, 503, {
      error: "DATABASE_URL is not configured",
      hint: "Connect a Postgres database in Vercel and add DATABASE_URL."
    });
  }

  try {
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { client_id, taste_answers, situation_answers, tarot, recommendations } = body || {};

      if (!client_id || !taste_answers || !situation_answers || !tarot || !recommendations) {
        return send(res, 400, { error: "missing required fields" });
      }

      await db.begin(async tx => {
        await tx`
          insert into users (client_id)
          values (${client_id})
          on conflict (client_id) do update set updated_at = now()
        `;

        await tx`
          insert into profiles (
            client_id, taste_answers, updated_at
          )
          values (
            ${client_id},
            ${tx.json(taste_answers)},
            now()
          )
          on conflict (client_id) do update
          set taste_answers = excluded.taste_answers,
              updated_at = now()
        `;

        const visitRows = await tx`
          insert into visits (
            client_id, situation_answers,
            tarot_card_id, tarot_card_name, tarot_card_name_ko,
            tarot_keyword, tarot_modifier
          )
          values (
            ${client_id},
            ${tx.json(situation_answers)},
            ${tarot.card_id},
            ${tarot.card_name},
            ${tarot.card_name_ko},
            ${tarot.keyword},
            ${tarot.modifier}
          )
          returning id
        `;

        const visitId = visitRows[0].id;
        const taste = recommendations.my_taste;
        const card = recommendations.my_card;

        await tx`
          insert into recommendations (
            visit_id, recommendation_type, wine_id, wine_name, score
          )
          values
            (${visitId}, 'MY_TASTE', ${taste.wine_id}, ${taste.wine_name}, ${taste.score}),
            (${visitId}, 'MY_CARD', ${card.wine_id}, ${card.wine_name}, ${card.score})
        `;
      });

      return send(res, 200, { ok: true });
    }

    if (req.method === "GET") {
      const clientId = req.query?.client_id;
      if (!clientId) return send(res, 400, { error: "client_id is required" });

      const rows = await db`
        select
          p.taste_answers,
          p.updated_at,
          (
            select json_build_object(
              'visit_id', v.id,
              'situation_answers', v.situation_answers,
              'tarot_card_id', v.tarot_card_id,
              'tarot_card_name', v.tarot_card_name,
              'tarot_card_name_ko', v.tarot_card_name_ko,
              'tarot_keyword', v.tarot_keyword,
              'tarot_modifier', v.tarot_modifier,
              'created_at', v.created_at
            )
            from visits v
            where v.client_id = p.client_id
            order by v.created_at desc
            limit 1
          ) as latest_visit
        from profiles p
        where p.client_id = ${clientId}
        limit 1
      `;

      return send(res, 200, { profile: rows[0] || null });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return send(res, 405, { error: "method not allowed" });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: "database operation failed" });
  }
}
