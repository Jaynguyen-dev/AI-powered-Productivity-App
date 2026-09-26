const fs = require("fs");
let code = fs.readFileSync("src/components/ideas/InteractiveGraphCanvas.tsx", "utf8");

const insertPos = code.indexOf("  const handleDoubleClick = (e: React.MouseEvent) => {");
if (insertPos !== -1) {
  const newWheelCode = `  // Wheel zoom around cursor with passive: false to prevent page scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleNativeWheel = (e) => {
      e.preventDefault();
      
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      
      setZoom((prevZoom) => {
        const newZoom = Math.min(2.5, Math.max(0.35, prevZoom * zoomFactor));
        
        setPan((prevPan) => {
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          const newPanX = mouseX - ((mouseX - prevPan.x) / prevZoom) * newZoom;
          const newPanY = mouseY - ((mouseY - prevPan.y) / prevZoom) * newZoom;
          return { x: newPanX, y: newPanY };
        });
        
        return newZoom;
      });
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleNativeWheel);
  }, []);

`;
  code = code.substring(0, insertPos) + newWheelCode + code.substring(insertPos);
  fs.writeFileSync("src/components/ideas/InteractiveGraphCanvas.tsx", code);
  console.log("Inserted wheel logic!");
} else {
  console.log("Failed to find insertion point");
}
