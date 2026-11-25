"""Los 10 países con más riesgo del mundo según INFORM Mid 2026 (para la frase de Haití).
Uso: python3 -I tools/top-mundo.py datos/fuente/INFORM_Risk_Mid_2026_v073.xlsx > datos/top10_mundo.csv"""
import sys, warnings, csv
import openpyxl
warnings.filterwarnings("ignore")
wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
rows = list(wb["INFORM Risk 2026 (a-z)"].iter_rows(values_only=True))
col = {h: i for i, h in enumerate(rows[1])}
top = sorted([r for r in rows[3:] if isinstance(r[col["Rank"]], (int, float))], key=lambda r: r[col["Rank"]])[:12]
w = csv.writer(sys.stdout)
w.writerow(["puesto", "pais_en", "iso3", "riesgo"])
for r in top:
    w.writerow([r[col["Rank"]], r[0], r[1], r[col["INFORM RISK"]]])
