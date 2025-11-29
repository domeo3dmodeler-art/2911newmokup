#!/usr/bin/env python3
import json, os, re, sys

SPEC_MD="master_spec.md"
OPENAPI="app/app/api/openapi.json"

def norm_path(p: str) -> str:
  if not p: return p
  # убрать /api префикс для сравнения
  if p.startswith("/api/"): p = p[4:]
  # убрать конечный /
  if len(p) > 1 and p.endswith("/"): p = p[:-1]
  # схлопнуть // (на всякий)
  p = re.sub(r"/{2,}", "/", p)
  return p

def expand_brace_variants(p: str) -> list[str]:
  # поддержка вида /cart/export/doors/{kp|invoice|factory}
  m = re.search(r"\{([^{}]+)\}", p)
  if not m: return [p]
  variants = m.group(1).split("|")
  head = p[:m.start()]
  tail = p[m.end():]
  out = []
  for v in variants:
    out.extend(expand_brace_variants(head + v + tail))
  return out

def parse_expected_endpoints(text: str) -> set[tuple[str,str]]:
  eps=set()
  for line in text.splitlines():
    m=re.search(r'\b(GET|POST|PUT|PATCH|DELETE)\s+(/[\w\-/{}|]+)', line, re.I)
    if not m: 
      continue
    method = m.group(1).upper()
    raw_path = m.group(2)
    for p in expand_brace_variants(raw_path):
      eps.add((method, norm_path(p)))
  return eps

def parse_openapi(p:str) -> set[tuple[str,str]]:
  if not os.path.exists(p):
    print(f"::warning ::{p} not found; skipping")
    return set()
  with open(p,"r",encoding="utf-8") as f:
    o=json.load(f)
  eps=set()
  for path,item in (o.get("paths") or {}).items():
    for method in item.keys():
      if method.upper() in ["GET","POST","PUT","PATCH","DELETE"]:
        eps.add((method.upper(), norm_path(path)))
  return eps

def main():
  if not os.path.exists(SPEC_MD):
    print(f"::warning ::{SPEC_MD} not found; skipping")
    sys.exit(0)
  exp=parse_expected_endpoints(open(SPEC_MD,"r",encoding="utf-8").read())
  act=parse_openapi(OPENAPI)
  missing=exp-act
  extra=act-exp
  if missing: print("::error ::Endpoints missing in OpenAPI:", missing)
  if extra:   print("::warning ::Extra endpoints not in Master Spec:", extra)
  sys.exit(1 if missing else 0)

if __name__=="__main__":
  main()
