from datetime import datetime
from io import BytesIO

from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet


def gerar_pdf(titulo: str, colunas: list[str], linhas: list[list], subtitulo: str = "") -> BytesIO:
    """Gera um PDF simples de tabela, em paisagem, com cabeçalho e linhas zebradas."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    estilos = getSampleStyleSheet()

    elementos = [Paragraph(titulo, estilos["Title"])]
    if subtitulo:
        elementos.append(Paragraph(subtitulo, estilos["Normal"]))
    elementos.append(Spacer(1, 0.5 * cm))

    dados_tabela = [colunas] + [[str(c) if c is not None else "—" for c in linha] for linha in linhas]
    tabela = Table(dados_tabela, repeatRows=1)
    tabela.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f7")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elementos.append(tabela)

    rodape = Paragraph(
        f"Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')} — Controle de Frota",
        estilos["Normal"],
    )
    elementos.append(Spacer(1, 0.5 * cm))
    elementos.append(rodape)

    doc.build(elementos)
    buffer.seek(0)
    return buffer


def gerar_excel(titulo: str, colunas: list[str], linhas: list[list]) -> BytesIO:
    """Gera um .xlsx simples de uma aba, com cabeçalho estilizado e colunas auto-ajustadas."""
    wb = Workbook()
    ws = wb.active
    ws.title = titulo[:31]  # limite do Excel para nome de aba

    ws.append(colunas)
    for celula in ws[1]:
        celula.font = Font(bold=True, color="FFFFFF")
        celula.fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")

    for linha in linhas:
        ws.append(["—" if c is None else c for c in linha])

    for coluna in ws.columns:
        largura_maxima = max((len(str(celula.value)) for celula in coluna if celula.value is not None), default=10)
        ws.column_dimensions[coluna[0].column_letter].width = min(largura_maxima + 4, 50)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def resposta_pdf(buffer: BytesIO, nome_arquivo: str) -> StreamingResponse:
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'},
    )


def resposta_excel(buffer: BytesIO, nome_arquivo: str) -> StreamingResponse:
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'},
    )
