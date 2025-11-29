// Простой RUB → прописью (целые рубли)
const UNITS = ["ноль","один","два","три","четыре","пять","шесть","семь","восемь","девять"];
const TEENS = ["десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
const TENS = ["","десять","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
const HUNDS = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];

function chunkToWords(n: number): string {
  const h = Math.floor(n/100);
  const t = Math.floor((n%100)/10);
  const u = n%10;
  const parts: string[] = [];
  if (h) parts.push(HUNDS[h]);
  if (t === 1) parts.push(TEENS[u]);
  else {
    if (t) parts.push(TENS[t]);
    if (u) parts.push(UNITS[u]);
  }
  return parts.join(" ");
}
export function rubToWords(n: number): string {
  if (n === 0) return "ноль рублей";
  const parts: string[] = [];
  let rest = Math.abs(n);

  const thousands = Math.floor(rest / 1000);
  const rem = rest % 1000;

  if (thousands) {
    parts.push(chunkToWords(thousands));
    const last2 = thousands % 100;
    const last = thousands % 10;
    const tWord = last2>=11 && last2<=14 ? "тысяч" : (last===1 ? "тысяча" : (last>=2 && last<=4 ? "тысячи" : "тысяч"));
    parts.push(tWord);
  }
  if (rem) parts.push(chunkToWords(rem));

  const last2 = rem % 100;
  const last = rem % 10;
  const rWord = last2>=11 && last2<=14 ? "рублей" : (last===1 ? "рубль" : (last>=2 && last<=4 ? "рубля" : "рублей"));
  return (n<0 ? "минус " : "") + parts.join(" ").replace(/\s+/g," ").trim() + " " + rWord;
}
