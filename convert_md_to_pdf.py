"""
TILI - Markdown to Professional PDF Converter
Uses xhtml2pdf with simple inline layout (no @frame to avoid overlap bugs).
"""

import os
import sys
import argparse
import logging
import markdown
from xhtml2pdf import pisa
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DEFAULT_INPUT_DIR = "docs"
DEFAULT_OUTPUT_DIR = os.path.join("docs", "pdf")

# ─── Simple, clean CSS — NO @frame directives ───
STYLE = """
@page {
    size: A4;
    margin: 2.5cm 2cm 2.5cm 2cm;
}

body {
    font-family: Helvetica;
    font-size: 10pt;
    color: #222222;
    line-height: 1.55;
}

/* ── Header banner (inline, first element) ── */
.pdf-header {
    background-color: #E8F4F8;
    border-bottom: 3px solid #2980b9;
    padding: 12px 18px;
    margin-bottom: 22px;
}
.pdf-header .logo {
    font-size: 22pt;
    font-weight: bold;
    color: #2980b9;
}
.pdf-header .subtitle {
    font-size: 9pt;
    color: #555555;
}
.pdf-header .date {
    font-size: 8pt;
    color: #888888;
}

/* ── Document meta box ── */
.meta-box {
    background-color: #F8F9FA;
    border: 1px solid #DEE2E6;
    padding: 10px 14px;
    margin-bottom: 20px;
    font-size: 9pt;
    color: #555555;
}

/* ── Headings ── */
h1 {
    font-size: 17pt;
    font-weight: bold;
    color: #1a1a2e;
    border-bottom: 2px solid #2980b9;
    padding-bottom: 4px;
    margin-top: 18px;
    margin-bottom: 10px;
}
h2 {
    font-size: 14pt;
    font-weight: bold;
    color: #2980b9;
    margin-top: 16px;
    margin-bottom: 8px;
}
h3 {
    font-size: 12pt;
    font-weight: bold;
    color: #16a085;
    margin-top: 12px;
    margin-bottom: 6px;
}
h4 {
    font-size: 11pt;
    font-weight: bold;
    color: #333333;
    margin-top: 10px;
    margin-bottom: 4px;
}

/* ── Tables – clean professional look ── */
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    margin-bottom: 14px;
    font-size: 9pt;
}
th {
    background-color: #2980b9;
    color: #ffffff;
    font-weight: bold;
    padding: 6px 8px;
    border: 1px solid #2471a3;
    text-align: left;
}
td {
    padding: 5px 8px;
    border: 1px solid #cccccc;
}
tr:nth-child(even) td {
    background-color: #f2f2f2;
}

/* ── Lists ── */
ul, ol {
    margin-left: 14px;
    margin-top: 4px;
    margin-bottom: 8px;
}
li {
    margin-bottom: 3px;
}

/* ── Horizontal rule ── */
hr {
    border: none;
    border-top: 1px solid #cccccc;
    margin: 16px 0;
}

/* ── Blockquote ── */
blockquote {
    border-left: 3px solid #2980b9;
    padding-left: 12px;
    color: #555555;
    font-style: italic;
    margin: 10px 0;
}

/* ── Code ── */
pre {
    background-color: #f4f4f4;
    border: 1px solid #dddddd;
    padding: 8px;
    font-size: 9pt;
    font-family: Courier;
}
code {
    font-family: Courier;
    font-size: 9pt;
    background-color: #f4f4f4;
    padding: 1px 3px;
}

/* ── Bold / Strong emphasis ── */
strong {
    font-weight: bold;
}
em {
    font-style: italic;
}

/* ── Links ── */
a {
    color: #2980b9;
    text-decoration: none;
}
"""


def convert_md_to_pdf(input_file, output_file):
    """Convert a single Markdown file to a clean professional PDF."""
    try:
        logger.info(f"  -> Converting: {os.path.basename(input_file)}")

        with open(input_file, 'r', encoding='utf-8') as f:
            md_content = f.read()

        # Convert markdown to HTML
        html_body = markdown.markdown(
            md_content,
            extensions=['tables', 'fenced_code', 'toc', 'attr_list', 'def_list']
        )

        file_name = os.path.basename(input_file)
        doc_title = file_name.replace('.md', '').replace('_', ' ')
        date_str = datetime.now().strftime("%d/%m/%Y")

        # Build complete HTML — simple inline structure, NO @frame
        html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>{STYLE}</style>
</head>
<body>

<!-- HEADER BANNER -->
<div class="pdf-header">
  <table width="100%" style="border:none;">
    <tr>
      <td style="border:none; width:50%; vertical-align:middle;">
        <span class="logo">TILI</span>
      </td>
      <td style="border:none; width:50%; text-align:right; vertical-align:middle;">
        <span class="subtitle">Tunisia Inclusive Labor Institute</span><br/>
        <span class="date">Document g&eacute;n&eacute;r&eacute; le {date_str}</span>
      </td>
    </tr>
  </table>
</div>

<!-- META -->
<div class="meta-box">
  <strong>Document :</strong> {doc_title}<br/>
  <strong>R&eacute;f&eacute;rence :</strong> {os.path.splitext(file_name)[0]}
</div>

<!-- CONTENT -->
{html_body}

</body>
</html>"""

        # Write PDF
        with open(output_file, "wb") as f_out:
            status = pisa.CreatePDF(html, dest=f_out, encoding='utf-8')

        if status.err:
            logger.error(f"  !! Error on: {file_name}")
            return False

        size_kb = os.path.getsize(output_file) / 1024
        logger.info(f"  OK: {os.path.basename(output_file)} ({size_kb:.0f} KB)")
        return True

    except Exception as e:
        logger.error(f"  !! FAILED {os.path.basename(input_file)}: {e}")
        return False


def batch_convert(input_dir, output_dir):
    """Batch convert all .md files."""
    if not os.path.isdir(input_dir):
        logger.error(f"Input folder not found: {input_dir}")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    md_files = sorted([f for f in os.listdir(input_dir) if f.lower().endswith('.md')])
    if not md_files:
        logger.warning("No .md files found.")
        return

    total = len(md_files)
    logger.info(f"Found {total} Markdown files in '{input_dir}'")
    logger.info(f"Output directory: '{output_dir}'")
    print()

    ok = 0
    fail = 0
    for i, fn in enumerate(md_files, 1):
        print(f"[{i}/{total}] ", end="")
        src = os.path.join(input_dir, fn)
        dst = os.path.join(output_dir, fn.replace('.md', '.pdf'))
        if convert_md_to_pdf(src, dst):
            ok += 1
        else:
            fail += 1

    # Report
    print()
    print("=" * 55)
    print("  TILI - CONVERSION REPORT")
    print("=" * 55)
    print(f"  Total files:   {total}")
    print(f"  Success:       {ok}")
    print(f"  Failed:        {fail}")
    print(f"  Output:        {os.path.abspath(output_dir)}")
    print("=" * 55)


def main():
    parser = argparse.ArgumentParser(description="TILI MD→PDF Converter")
    parser.add_argument('--input', '-i', default=DEFAULT_INPUT_DIR)
    parser.add_argument('--output', '-o', default=DEFAULT_OUTPUT_DIR)
    parser.add_argument('--single', '-s', help='Single file name to convert')
    args = parser.parse_args()

    if args.single:
        src = os.path.join(args.input, args.single)
        if not os.path.isfile(src):
            logger.error(f"File not found: {src}")
            sys.exit(1)
        os.makedirs(args.output, exist_ok=True)
        dst = os.path.join(args.output, args.single.replace('.md', '.pdf'))
        convert_md_to_pdf(src, dst)
    else:
        batch_convert(args.input, args.output)


if __name__ == "__main__":
    main()
