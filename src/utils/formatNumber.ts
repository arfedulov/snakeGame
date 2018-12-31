export default function formatNumber(n: number, pad: number, fill = '0') {
  let nStr = n.toString(10);
  while (nStr.length < pad) {
    nStr = fill + nStr;
  }

  return nStr;
}
