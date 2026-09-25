
const fs = require("fs");
let code = fs.readFileSync("src/components/ideas/InteractiveGraphCanvas.tsx", "utf8");

const startIdx = code.indexOf("  // Wheel zoom around cursor with passive: false to prevent page scroll");
if (startIdx !== -1) {
  const endIdx = code.indexOf("  }, []);", startIdx);
  if (endIdx !== -1) {
    const replacement = `  // Wheel zoom around cursor with passive: false to prevent page scroll
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
    code = code.substring(0, startIdx) + replacement + code.substring(endIdx + 9);
    fs.writeFileSync("src/components/ideas/InteractiveGraphCanvas.tsx", code);
    console.log("Replaced correctly!");
  }
}

