TOKENS = {
    "surface": "#202124",
    "surfaceRaised": "#2B2D31",
    "border": "#3A3D43",
    "textPrimary": "#F4F4F5",
    "textMuted": "#A1A1AA",
    "success": "#22C55E",
    "warning": "#F59E0B",
    "danger": "#EF4444",
    "info": "#38BDF8",
}


def stylesheet() -> str:
    return f"""
    QWidget {{
        background: {TOKENS["surface"]};
        color: {TOKENS["textPrimary"]};
        font-size: 12px;
    }}
    QGroupBox {{
        background: {TOKENS["surfaceRaised"]};
        border: 1px solid {TOKENS["border"]};
        border-radius: 8px;
        margin-top: 16px;
        padding: 16px;
        font-weight: 600;
    }}
    QPushButton {{
        background: {TOKENS["info"]};
        border: 0;
        border-radius: 6px;
        color: #071015;
        min-height: 28px;
        padding: 6px 12px;
        font-weight: 600;
    }}
    QTextEdit {{
        border: 1px solid {TOKENS["border"]};
        border-radius: 6px;
        font-family: Consolas, monospace;
        font-size: 11px;
    }}
    """
