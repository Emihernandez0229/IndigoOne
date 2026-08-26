
"""
Junta base_email.html + email.css + un componente de escenario (ej. password_reset.html)
en un único archivo HTML listo para enviar por correo.
Ejemplo:
    python3 build_email.py password_reset.html password_reset_email.html
"""
import re
import sys
from pathlib import Path
 
BASE_DIR = Path(__file__).parent                       # emails/
TEMPLATES_DIR = BASE_DIR / "templates"                  # emails/templates
CSS_FILE = BASE_DIR / "styles" / "email.css"            # emails/styles/email.css
BASE_HTML = TEMPLATES_DIR / "base_email.html"
 
 
def build(scenario_path: Path, output_path: Path) -> None:
    if not BASE_HTML.exists():
        sys.exit(f"ERROR: no encontré base_email.html en {BASE_HTML}")
    if not CSS_FILE.exists():
        sys.exit(f"ERROR: no encontré email.css en {CSS_FILE} (ajusta CSS_FILE en el script si tu ruta es distinta)")
    if not scenario_path.exists():
        sys.exit(f"ERROR: no encontré el escenario en {scenario_path}")
 
    base_html = BASE_HTML.read_text(encoding="utf-8")
    css = CSS_FILE.read_text(encoding="utf-8")
    scenario_html = scenario_path.read_text(encoding="utf-8")
 
    # 1. Reemplaza el <link rel="stylesheet"> por el CSS embebido en <style>.
    #    (Los clientes de correo no cargan hojas de estilo externas: hay que embeberlo.)
    style_block = f"<style>\n{css}\n</style>"
    merged = re.sub(
        r'<link\s+rel="stylesheet"\s+href="[^"]*"\s*/?>',
        style_block,
        base_html,
    )
 
    # 2. Inyecta el contenido del escenario en el placeholder.
    merged = merged.replace("{{EMAIL_CONTENT}}", scenario_html.strip())
 
    output_path.write_text(merged, encoding="utf-8")
    print(f"OK -> {output_path}")
 
 
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
 
    # Los escenarios y la salida viven dentro de templates/
    scenario_arg = TEMPLATES_DIR / sys.argv[1]
    output_arg = TEMPLATES_DIR / sys.argv[2]
    build(scenario_arg, output_arg)