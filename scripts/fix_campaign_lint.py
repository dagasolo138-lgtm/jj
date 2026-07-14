from pathlib import Path

path = Path("src/components/EconomyMonitorTab.jsx")
text = path.read_text()
old = "  const operatorMode = useMemo(resolveOperatorMode, []);"
new = "  const operatorMode = useMemo(() => resolveOperatorMode(), []);"
if text.count(old) != 1:
    raise RuntimeError(f"expected one operator memo anchor, found {text.count(old)}")
path.write_text(text.replace(old, new, 1))
