export default async function handler(req, res) {
  const { user, date, action } = req.query;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  async function supabase(path, method, body) {
    return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });
  }

  function validarFecha(date) {
    const match = /^(\d{1,2})\/(\d{1,2})$/.exec(date);
    if (!match) return null;

    let d = parseInt(match[1]);
    let m = parseInt(match[2]);

    if (d < 1 || d > 31 || m < 1 || m > 12) return null;

    return { d, m };
  }

  // GUARDAR cumpleaños
  if (action === "set") {
    const val = validarFecha(date);
    if (!val) return res.send("❌ Usa formato DD/MM");

    await supabase("cumpleaños", "POST", {
      user_name: user.toLowerCase(),
      day: val.d,
      month: val.m
    });

    return res.send(`✅ ${user}, guardé tu cumpleaños (${date})`);
  }

  // CONSULTAR cumpleaños
  const target = (user || "").toLowerCase();

  if (!target) {
    return res.send("❌ Usuario no especificado");
  }

  const response = await supabase(
    `cumpleaños?user_name=eq.${target}`,
    "GET"
  );

  const data = await response.json();

  if (!data.length) {
    return res.send(`❌ No tengo el cumpleaños de ${user}`);
  }

  const { day, month } = data[0];

  const today = new Date();
  let next = new Date(today.getFullYear(), month - 1, day);

  if (next < today) next.setFullYear(today.getFullYear() + 1);

  const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24));

  if (diff === 0) {
    return res.send(`🎉 ¡Hoy cumple ${user}!`);
  }

  if (diff === 1) {
    return res.send(`⏰ ${user} cumple mañana`);
  }

  return res.send(`🎂 A ${user} le faltan ${diff} días`);
}
