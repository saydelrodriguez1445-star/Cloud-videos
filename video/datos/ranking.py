"""Ranking de resistencia a inundaciones en Latinoamérica a partir de INFORM Risk Mid 2026 (JRC, Comisión Europea).

Fórmula: la misma que usa INFORM (media geométrica de sus tres dimensiones), pero con la dimensión
de amenaza reducida solo a inundaciones (río + costa, combinadas como hace INFORM con las amenazas naturales):
    agua = 10 * (1 - (1 - rio/10) * (1 - costa/10))
    riesgo_inundacion = (agua * vulnerabilidad * falta_de_respuesta) ** (1/3)
Menos es mejor. Uso: python3 -I ranking.py fuente/INFORM_Risk_Mid_2026_v073.xlsx > ranking_latam.csv
"""
import csv, sys, warnings
import openpyxl

warnings.filterwarnings("ignore")
LATAM = "ARG BOL BRA CHL COL CRI CUB DOM ECU SLV GTM HTI HND MEX NIC PAN PRY PER URY VEN".split()
ES = {"ARG": "Argentina", "BOL": "Bolivia", "BRA": "Brasil", "CHL": "Chile", "COL": "Colombia", "CRI": "Costa Rica",
      "CUB": "Cuba", "DOM": "República Dominicana", "ECU": "Ecuador", "SLV": "El Salvador", "GTM": "Guatemala",
      "HTI": "Haití", "HND": "Honduras", "MEX": "México", "NIC": "Nicaragua", "PAN": "Panamá", "PRY": "Paraguay",
      "PER": "Perú", "URY": "Uruguay", "VEN": "Venezuela"}

wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
rows = list(wb["INFORM Risk 2026 (a-z)"].iter_rows(values_only=True))
col = {h: i for i, h in enumerate(rows[1])}
out = []
for r in rows[3:]:
    if r[1] not in LATAM:
        continue
    rio, costa = r[col["River Flood"]] or 0, r[col["Coastal flood"]] or 0
    vul, lcc = r[col["VULNERABILITY"]], r[col["LACK OF COPING CAPACITY"]]
    agua = 10 * (1 - (1 - rio / 10) * (1 - costa / 10))
    out.append({"pais": ES[r[1]], "iso3": r[1], "rio": rio, "costa": costa, "agua": round(agua, 2),
                "fragilidad": vul, "falta_respuesta": lcc,
                "riesgo_inundacion": round((agua * vul * lcc) ** (1 / 3), 2),
                "inform_riesgo_total": r[col["INFORM RISK"]], "inform_puesto_mundial_1_mas_riesgo": r[col["Rank"]]})
out.sort(key=lambda d: d["riesgo_inundacion"])
w = csv.DictWriter(sys.stdout, fieldnames=["puesto"] + list(out[0].keys()))
w.writeheader()
for i, d in enumerate(out, 1):
    w.writerow({"puesto": i, **d})
