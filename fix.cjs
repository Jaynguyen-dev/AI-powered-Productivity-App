const fs = require("fs");
let code = fs.readFileSync("src/components/ideas/InteractiveGraphCanvas.tsx", "utf8");

const wheelStart = code.indexOf("  // Wheel zoom around cursor");
const wheelEnd = code.indexOf("  };", wheelStart);
if (wheelStart !== -1 && wheelEnd !== -1) {
  const newWheelCode = `  // Wheel zoom around cursor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleNativeWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(2.5, Math.max(0.35, zoom * zoomFactor));
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const newPanX = mouseX - ((mouseX - pan.x) / zoom) * newZoom;
      const newPanY = mouseY - ((mouseY - pan.y) / zoom) * newZoom;
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };
    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleNativeWheel);
  }, [zoom, pan]);`;
  
  code = code.substring(0, wheelStart) + newWheelCode + code.substring(wheelEnd + 4);
}

code = code.replace("onWheel={handleWheel}", "");

const tbStart = code.indexOf("{viewStyle === 'canvas' && (\n              <>");
if (tbStart !== -1) {
  const tbEnd = code.indexOf("</>\n            )}", tbStart);
  if (tbEnd !== -1) {
    code = code.substring(0, tbStart) + code.substring(tbEnd + 18);
  } else {
    console.log("Could not find end of toolbar");
  }
} else {
  console.log("Could not find start of toolbar");
}

fs.writeFileSync("src/components/ideas/InteractiveGraphCanvas.tsx", code);
