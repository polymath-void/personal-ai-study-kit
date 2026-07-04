"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

export interface MindMapNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: "root" | "main" | "detail";
}

export interface MindMapLink {
  source: string;
  target: string;
}

interface MindMapProps {
  nodes: MindMapNode[];
  links: MindMapLink[];
}

export default function MindMap({ nodes, links }: MindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);

  // Deep copy nodes and links to avoid mutating props during simulation
  const simulationNodes = useRef<MindMapNode[]>([]);
  const simulationLinks = useRef<any[]>([]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    // Clear previous elements
    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll("*").remove();

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 500;

    // Clone data for safety
    simulationNodes.current = nodes.map((n) => ({ ...n }));
    simulationLinks.current = links.map((l) => ({
      source: l.source,
      target: l.target,
    }));

    // Setup main SVG container
    svgElement
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("background-color", "rgb(249, 250, 251)"); // Gray-50

    // Zoom and pan container
    const gContainer = svgElement.append("g").attr("class", "mindmap-content");

    // Add marker for arrowheads
    svgElement
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28) // Offset to sit right at the boundary of a capsule node
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#cbd5e1"); // Slate-300

    // Zoom setup
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        gContainer.attr("transform", event.transform);
      });

    svgElement.call(zoomBehavior);

    // Initial Zoom/Centering
    svgElement.call(
      zoomBehavior.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85)
    );

    // Forces Setup
    const simulation = d3
      .forceSimulation<MindMapNode>(simulationNodes.current)
      .force(
        "link",
        d3
          .forceLink<MindMapNode, any>(simulationLinks.current)
          .id((d) => d.id)
          .distance((d) => {
            if (d.source.group === "root" || d.target.group === "root") return 150;
            return 100;
          })
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("collide", d3.forceCollide().radius(65))
      .force("center", d3.forceCenter(0, 0)); // Center around the origin because we translate the zoom container to half width/height

    // Draw Links
    const link = gContainer
      .append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(simulationLinks.current)
      .enter()
      .append("path")
      .attr("stroke", "#e2e8f0") // Slate-200
      .attr("stroke-width", (d) => {
        if (d.source.group === "root" || d.target.group === "root") return 3;
        return 1.5;
      })
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)");

    // Draw Nodes (Capsules)
    const node = gContainer
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(simulationNodes.current)
      .enter()
      .append("g")
      .attr("class", "node-group")
      .style("cursor", "grab")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        // Highlight active paths
        highlightSelectedNode(d.id);
      })
      .call(
        d3
          .drag<SVGGElement, MindMapNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Append card/rect for nodes
    node
      .append("rect")
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", (d) => {
        if (d.group === "root") return "#3b82f6"; // Blue-500
        if (d.group === "main") return "#8b5cf6"; // Violet-500
        return "#ffffff"; // White for detail nodes
      })
      .attr("stroke", (d) => {
        if (d.group === "root") return "#1d4ed8"; // Blue-700
        if (d.group === "main") return "#6d28d9"; // Violet-700
        return "#94a3b8"; // Slate-400
      })
      .attr("stroke-width", (d) => (d.group === "detail" ? 1.5 : 2))
      .attr("filter", "drop-shadow(0 4px 6px -1px rgb(0 0 0 / 0.05))");

    // Append text to nodes
    node
      .append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("font-size", (d) => (d.group === "root" ? "14px" : "12px"))
      .style("font-family", "inherit")
      .style("font-weight", (d) => (d.group === "root" ? "600" : "500"))
      .style("fill", (d) => (d.group === "detail" ? "#1e293b" : "#ffffff"))
      .style("pointer-events", "none");

    // Dynamic sizing of the node capsule based on text length
    node.each(function (d) {
      const groupNode = d3.select(this);
      const textElement = groupNode.select("text").node() as SVGTextElement;
      const bbox = textElement.getBBox();
      const paddingX = 24;
      const paddingY = 14;
      const rectWidth = Math.max(bbox.width + paddingX, 100);
      const rectHeight = bbox.height + paddingY;

      groupNode
        .select("rect")
        .attr("x", -rectWidth / 2)
        .attr("y", -rectHeight / 2)
        .attr("width", rectWidth)
        .attr("height", rectHeight);
    });

    // Handle background click to deselect node and clear highlight
    svgElement.on("click", () => {
      setSelectedNode(null);
      clearHighlights();
    });

    // Tick function
    simulation.on("tick", () => {
      // Draw smooth Bezier curves or simple direct paths
      link.attr("d", (d) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Controls curve bend
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Helper functions for Drag
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(event.sourceEvent.target.parentNode).style("cursor", "grabbing");
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      d3.select(event.sourceEvent.target.parentNode).style("cursor", "grab");
    }

    // Highlight Selected Node and Connected Links
    function highlightSelectedNode(nodeId: string) {
      // Fade others
      node.style("opacity", (d) => {
        const isConnected =
          d.id === nodeId ||
          links.some(
            (l) =>
              (l.source === nodeId && l.target === d.id) ||
              (l.target === nodeId && l.source === d.id)
          );
        return isConnected ? 1 : 0.35;
      });

      link
        .attr("stroke", (d) => {
          const isConnected = d.source.id === nodeId || d.target.id === nodeId;
          return isConnected ? "#6366f1" : "#e2e8f0"; // Indigo-500 or light gray
        })
        .attr("stroke-width", (d) => {
          const isConnected = d.source.id === nodeId || d.target.id === nodeId;
          return isConnected ? 3 : 1.5;
        });
    }

    function clearHighlights() {
      node.style("opacity", 1);
      link
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", (d) => {
          if (d.source.group === "root" || d.target.group === "root") return 3;
          return 1.5;
        });
    }

    // Custom Control functions
    const zoomReset = () => {
      svgElement
        .transition()
        .duration(750)
        .call(
          zoomBehavior.transform,
          d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85)
        );
    };

    const zoomInFn = () => {
      svgElement.transition().duration(300).call(zoomBehavior.scaleBy, 1.3);
    };

    const zoomOutFn = () => {
      svgElement.transition().duration(300).call(zoomBehavior.scaleBy, 0.7);
    };

    // Attach control listeners via state indicators
    const resetBtn = document.getElementById("mindmap-reset");
    const zoomInBtn = document.getElementById("mindmap-zoomin");
    const zoomOutBtn = document.getElementById("mindmap-zoomout");

    if (resetBtn) resetBtn.onclick = zoomReset;
    if (zoomInBtn) zoomInBtn.onclick = zoomInFn;
    if (zoomOutBtn) zoomOutBtn.onclick = zoomOutFn;

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 shadow-inner">
      {/* Mindmap Canvas */}
      <div ref={containerRef} className="w-full h-full">
        <svg id="mindmap-svg" ref={svgRef} className="w-full h-full" />
      </div>

      {/* Floating Interactive HUD Controls */}
      <div className="absolute bottom-4 left-4 flex gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-100/50">
        <button
          id="mindmap-zoomin"
          title="Zoom In"
          className="p-1.5 hover:bg-slate-50 active:bg-slate-100 rounded-md text-slate-600 transition"
        >
          <ZoomIn size={18} />
        </button>
        <button
          id="mindmap-zoomout"
          title="Zoom Out"
          className="p-1.5 hover:bg-slate-50 active:bg-slate-100 rounded-md text-slate-600 transition"
        >
          <ZoomOut size={18} />
        </button>
        <button
          id="mindmap-reset"
          title="Recenter Mind Map"
          className="p-1.5 hover:bg-slate-50 active:bg-slate-100 rounded-md text-slate-600 transition flex items-center gap-1 text-xs font-medium"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
      </div>

      {/* Info Panel HUD */}
      <div className="absolute top-4 right-4 max-w-xs bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-md border border-slate-100/50">
        {selectedNode ? (
          <div>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase mb-1.5 ${
                selectedNode.group === "root"
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : selectedNode.group === "main"
                  ? "bg-purple-50 text-purple-600 border border-purple-100"
                  : "bg-slate-50 text-slate-600 border border-slate-100"
              }`}
            >
              {selectedNode.group === "root"
                ? "Central Topic"
                : selectedNode.group === "main"
                ? "Core Theme"
                : "Supporting Detail"}
            </span>
            <h4 className="font-semibold text-slate-800 text-sm">{selectedNode.label}</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Drag to organize, or zoom and click other nodes to explore the connections.
            </p>
          </div>
        ) : (
          <div>
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <Maximize2 size={14} className="text-indigo-500" />
              Interactive Canvas
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Click any concept node to isolate its pathways, or drag nodes around to re-sculpt your study map.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
