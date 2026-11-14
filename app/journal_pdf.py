"""Readable bilingual exports using ReportLab's pagination and embedded fonts."""

from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from threading import Lock
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer


FONT_PATH = Path(__file__).resolve().parent.parent / "assets/fonts/JournalSans-Regular.ttf"
FONT_NAME = "JournalSans"
_font_lock = Lock()

LABELS = {
    "en": {
        "date": "Exported", "total": "Total questions", "normal": "Regular records",
        "starred": "Important difficulties", "question": "Question", "answer": "AI answer",
        "empty": "No records in this section.", "source": "Sources", "page": "Page",
        "chat": "AI Chat", "explain": "Explain", "rag": "Documents / Local RAG",
    },
    "zh": {
        "date": "导出日期", "total": "总问题数量", "normal": "普通记录",
        "starred": "重点难题", "question": "原始问题", "answer": "AI 回答",
        "empty": "本部分暂无记录。", "source": "资料来源", "page": "页",
        "chat": "AI 对话", "explain": "知识讲解", "rag": "学习资料 / 本地 RAG",
    },
}


def generate_journal_pdf(entries, language="en", utc_offset=0):
    with _font_lock:
        if FONT_NAME not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))

    labels = LABELS[language]
    local_timezone = timezone(timedelta(minutes=utc_offset))
    now = datetime.now(timezone.utc).astimezone(local_timezone)
    output = BytesIO()
    document = SimpleDocTemplate(
        output, pagesize=A4, rightMargin=46, leftMargin=46,
        topMargin=55, bottomMargin=50, title="My Learning Journal",
        author="AI Study Assistant", pageCompression=1,
    )
    body = ParagraphStyle(
        "JournalBody", fontName=FONT_NAME, fontSize=10, leading=16,
        textColor=colors.HexColor("#34343a"), spaceAfter=9,
        wordWrap="CJK", splitLongWords=True,
    )
    muted = ParagraphStyle(
        "JournalMetadata", parent=body, fontSize=8, leading=13,
        textColor=colors.HexColor("#73737c"),
    )
    heading = ParagraphStyle(
        "JournalHeading", parent=body, fontSize=16, leading=23,
        spaceBefore=12, spaceAfter=16, keepWithNext=True,
    )
    title = ParagraphStyle(
        "JournalTitle", parent=body, fontSize=12, leading=19,
        spaceBefore=14, spaceAfter=5, keepWithNext=True,
    )
    important_title = ParagraphStyle(
        "JournalImportantTitle", parent=title, textColor=colors.HexColor("#bb303b")
    )

    def paragraph(text, style=body):
        # No model-provided markup or external resources reach ReportLab's parser.
        safe_text = escape(text).replace("\t", "    ").replace("\n", "<br/>")
        return Paragraph(safe_text, style)

    def text_blocks(text):
        return [paragraph(block) for block in text.replace("\r", "").split("\n\n") if block]

    def page_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont(FONT_NAME, 8)
        canvas.setFillColor(colors.HexColor("#73737c"))
        canvas.drawString(46, 29, "AI Study Assistant")
        canvas.drawRightString(A4[0] - 46, 29, f"{labels['page']} {doc.page}")
        canvas.restoreState()

    starred_count = sum(entry["starred"] for entry in entries)
    story = [Spacer(1, 80), paragraph("My Learning Journal", ParagraphStyle(
        "Cover", parent=heading, fontSize=27, leading=36,
    ))]
    if language == "zh":
        story.append(paragraph("我的学习记录", heading))
    story.extend([
        paragraph(f"{labels['date']}: {now:%Y-%m-%d %H:%M %z}", muted), Spacer(1, 28),
        paragraph(f"{labels['total']}: {len(entries)}"),
        paragraph(f"{labels['normal']}: {len(entries) - starred_count}"),
        paragraph(f"{labels['starred']}: {starred_count}"), PageBreak(),
    ])
    for starred in (True, False):
        section_entries = [entry for entry in entries if entry["starred"] == starred]
        story.append(paragraph(labels["starred" if starred else "normal"], heading))
        if not section_entries:
            story.append(paragraph(labels["empty"], muted))
        for entry in section_entries:
            short_title = " ".join(entry["question"].split())[:90]
            if len(entry["question"]) > 90:
                short_title += "…"
            story.append(paragraph(
                ("★ " if starred else "") + short_title,
                important_title if starred else title,
            ))
            timestamp = datetime.fromisoformat(entry["created_at"]).astimezone(local_timezone)
            story.append(paragraph(
                f"{timestamp:%Y-%m-%d %H:%M %z}  |  {labels[entry['module']]}\nID: {entry['id']}",
                muted,
            ))
            story.append(paragraph(labels["question"], muted))
            story.extend(text_blocks(entry["question"]))
            story.append(paragraph(labels["answer"], muted))
            story.extend(text_blocks(entry["answer"]))
            if entry.get("sources"):
                story.append(paragraph(labels["source"], muted))
                for source in entry["sources"]:
                    location = source.get("page_number")
                    suffix = f" · {labels['page']} {location}" if location else ""
                    story.append(paragraph(source["filename"] + suffix, muted))
            story.append(HRFlowable(width="100%", color=colors.HexColor("#e7e7ea")))
        if starred:
            story.append(PageBreak())
    document.build(story, onFirstPage=page_footer, onLaterPages=page_footer)
    return output.getvalue()
