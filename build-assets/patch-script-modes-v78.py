from pathlib import Path

p = Path('www/script-modes.js')
s = p.read_text(encoding='utf-8')

start = s.find('const complexRoles=')
if start < 0:
    raise SystemExit('complexRoles declaration not found')
end = s.find(';', start)
if end < 0:
    raise SystemExit('complexRoles terminator not found')
new = r"const complexRoles=/\b(transformation|operations|strategy|enablement|excellence|business partner|program|portfolio|digital|change|shared services|innovation|growth|planning lead|performance management|finance and administration|administration|enterprise performance|corporate planning|business planning|workforce planning|revenue operations|sales operations|commercial planning|integrated business planning|enterprise applications?|application portfolio|business systems?|systems? manager|systems? owner|sap|erp|process owner|application owner|applications? manager|applications? director|technology architecture|solution architecture|enterprise architecture|integration architecture|data architecture|master data|data governance|business intelligence|bi manager|analytics manager|data & analytics|reporting & analytics|information systems)\b/i;"
s = s[:start] + new + s[end + 1:]

old_dec = "if(complexRoles.test(all))return{ai:true,reason:'Role/function is cross-functional or complex; AI can better align the message to the evidence.'};"
new_dec = "if(complexRoles.test(role))return{ai:true,reason:'Specialist responsibility role detected; AI should align to the exact ownership and process lens.'};if(complexRoles.test(all))return{ai:true,reason:'Role/function is cross-functional or complex; AI can better align the message to the evidence.'};"
if old_dec not in s:
    raise SystemExit('decision anchor not found')
s = s.replace(old_dec, new_dec, 1)

p.write_text(s, encoding='utf-8')
print('v78 local intelligence patch applied')
