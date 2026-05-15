export type Meta = { grupoPosicao: string; clube: string };

const goleiros = ["alisson", "ederson", "bento", "weverton"];
const defesas = ["danilo", "marquinhos", "gabriel magalhaes", "gabriel magalhães", "beraldo", "bremer", "thiago silva", "dodo", "dodô", "caio henrique", "wendell", "yan couto", "alex sandro", "eder militao", "éder militão", "militao", "militão"];
const meias = ["casemiro", "bruno guimaraes", "bruno guimarães", "joao gomes", "joão gomes", "andrey santos", "andre", "andré", "lucas paquetá", "lucas paqueta", "douglas luiz", "joelinton", "fabinho", "gerson"];
const ataques = ["neymar", "vinicius", "vini", "rodrygo", "endrick", "raphinha", "richarlison", "gabriel jesus", "martinelli", "antony", "matheus cunha", "joao pedro", "joão pedro", "savio", "sávio", "kaiki", "vitinho", "estevao", "estêvão"];

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function inferMeta(nome: string): Meta {
  const n = norm(nome);
  if (goleiros.some(x => n.includes(norm(x)))) return { grupoPosicao: "Goleiro", clube: "" };
  if (defesas.some(x => n.includes(norm(x)))) return { grupoPosicao: "Defesa", clube: "" };
  if (meias.some(x => n.includes(norm(x)))) return { grupoPosicao: "Meio-campo", clube: "" };
  if (ataques.some(x => n.includes(norm(x)))) return { grupoPosicao: "Ataque", clube: "" };
  return { grupoPosicao: "Ataque", clube: "" };
}
