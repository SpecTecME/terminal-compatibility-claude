import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NODE_W = 140;
const NODE_H = 48;
const H_GAP = 100;
const V_GAP = 80;
const STORAGE_KEY = (wfId) => `wf_diagram_v2_${wfId}`;

// ─── Auto layout ────────────────────────────────────────────────────────────
function layoutNodes(statuses, transitions) {
  const initialTargets = new Set(transitions.filter(t => !t.from_status_id).map(t => t.to_status_id));
  const level0 = statuses.filter(s => s.is_initial || initialTargets.has(s.id)).map(s => s.id);
  const toIds = new Set(transitions.map(t => t.to_status_id));
  const fallbackLevel0 = statuses.filter(s => !toIds.has(s.id)).map(s => s.id);
  const roots = level0.length > 0 ? level0 : (fallbackLevel0.length > 0 ? fallbackLevel0 : [statuses[0]?.id].filter(Boolean));

  const levelMap = {};
  const queue = [...roots.map(id => ({ id, level: 0 }))];
  const visited = new Set(roots);
  roots.forEach(id => { levelMap[id] = 0; });
  while (queue.length) {
    const { id, level } = queue.shift();
    transitions.filter(t => t.from_status_id === id && t.is_active !== false).forEach(t => {
      if (!visited.has(t.to_status_id)) {
        visited.add(t.to_status_id);
        levelMap[t.to_status_id] = level + 1;
        queue.push({ id: t.to_status_id, level: level + 1 });
      }
    });
  }
  const maxLevel = Math.max(0, ...Object.values(levelMap));
  statuses.forEach(s => { if (levelMap[s.id] === undefined) levelMap[s.id] = maxLevel + 1; });

  const levels = {};
  statuses.forEach(s => {
    const l = levelMap[s.id] ?? 0;
    if (!levels[l]) levels[l] = [];
    levels[l].push(s.id);
  });
  const levelNums = Object.keys(levels).map(Number).sort((a, b) => a - b);
  const maxPerLevel = Math.max(...levelNums.map(l => levels[l].length));
  const positions = {};
  levelNums.forEach(l => {
    const group = levels[l];
    const totalH = group.length * NODE_H + (group.length - 1) * V_GAP;
    const startY = (maxPerLevel * (NODE_H + V_GAP) - totalH) / 2;
    group.forEach((id, i) => {
      positions[id] = { x: l * (NODE_W + H_GAP), y: startY + i * (NODE_H + V_GAP) };
    });
  });
  return {
    positions,
    totalW: levelNums.length * (NODE_W + H_GAP),
    totalH: maxPerLevel * (NODE_H + V_GAP),
  };
}

// ─── Edge path ───────────────────────────────────────────────────────────────
function getEdgePath(from, to, offset = 0, midOverride = null) {
  const fromCX = from.x + NODE_W / 2;
  const fromCY = from.y + NODE_H / 2;
  const toCX = to.x + NODE_W / 2;
  const toCY = to.y + NODE_H / 2;
  const dx = toCX - fromCX;
  const dy = toCY - fromCY;
  const R = 6;
  const BYPASS = 30;
  const offsetStep = offset * 14;

  // Self-loop
  if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
    const x1 = from.x + NODE_W, y1 = fromCY - 8, lx = x1 + 55, y2 = fromCY + 8;
    return { d: `M ${x1} ${y1} L ${lx - R} ${y1} Q ${lx} ${y1} ${lx} ${y1 + R} L ${lx} ${y2 - R} Q ${lx} ${y2} ${lx - R} ${y2} L ${x1} ${y2}`, autoMx: lx + 20, autoMy: fromCY };
  }

  if (Math.abs(dx) < 10) {
    // Same column
    const goDown = dy > 0;
    const x1 = fromCX, y1 = goDown ? from.y + NODE_H : from.y;
    const x2 = toCX, y2 = goDown ? to.y : to.y + NODE_H;
    const midY = (y1 + y2) / 2;
    const jx = fromCX + BYPASS + 30 + Math.abs(offsetStep);
    const d = [
      `M ${x1} ${y1}`, `L ${x1} ${midY - R}`, `Q ${x1} ${midY} ${x1 + R} ${midY}`,
      `L ${jx - R} ${midY}`, `Q ${jx} ${midY} ${jx} ${midY + (goDown ? R : -R)}`,
      `L ${jx} ${y2 + (goDown ? -R : R)}`, `Q ${jx} ${y2} ${jx - R} ${y2}`, `L ${x2} ${y2}`,
    ].join(' ');
    return { d, autoMx: jx + 14, autoMy: midY };
  }

  if (dx < -10) {
    // Backward edge
    const x1 = from.x, y1 = fromCY + offsetStep;
    const x2 = to.x + NODE_W, y2 = toCY + offsetStep;
    const topY = Math.min(from.y, to.y) - BYPASS - Math.abs(offsetStep);
    const d = [
      `M ${x1} ${y1}`, `L ${x1 - BYPASS} ${y1}`,
      `L ${x1 - BYPASS} ${topY + R}`, `Q ${x1 - BYPASS} ${topY} ${x1 - BYPASS + R} ${topY}`,
      `L ${x2 + BYPASS - R} ${topY}`, `Q ${x2 + BYPASS} ${topY} ${x2 + BYPASS} ${topY + R}`,
      `L ${x2 + BYPASS} ${y2 - R}`, `Q ${x2 + BYPASS} ${y2} ${x2 + BYPASS - R} ${y2}`, `L ${x2} ${y2}`,
    ].join(' ');
    return { d, autoMx: (x1 + x2) / 2, autoMy: topY - 12 };
  }

  // Forward edge
  const x1 = from.x + NODE_W, y1 = fromCY + offsetStep;
  const x2 = to.x, y2 = toCY + offsetStep;
  const midX = (x1 + x2) / 2;
  if (Math.abs(dy) < 5) {
    return { d: `M ${x1} ${y1} L ${x2} ${y2}`, autoMx: midX, autoMy: y1 };
  }
  const turnDir = dy > 0 ? 1 : -1;
  const d = [
    `M ${x1} ${y1}`, `L ${midX - R} ${y1}`, `Q ${midX} ${y1} ${midX} ${y1 + turnDir * R}`,
    `L ${midX} ${y2 - turnDir * R}`, `Q ${midX} ${y2} ${midX + R} ${y2}`, `L ${x2} ${y2}`,
  ].join(' ');
  return { d, autoMx: midX, autoMy: (y1 + y2) / 2 };
}

const START_X = -NODE_W - H_GAP / 2;

// ─── Component ───────────────────────────────────────────────────────────────
export default function WorkflowDiagramTab({ workflowId }) {
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef(null);

  // Saved layout (persisted) — source of truth on load
  const [savedLayout, setSavedLayout] = useState(null); // { nodes: {}, edges: {} }
  // Working (unsaved) layout — what's shown
  const [workingLayout, setWorkingLayout] = useState({ nodes: {}, edges: {} });
  const [isDirty, setIsDirty] = useState(false);

  // dragging state
  const [dragging, setDragging] = useState(null);
  // { type: 'node'|'edge', id, startMouseX, startMouseY, startX, startY }

  const { data: transitions = [] } = useQuery({
    queryKey: ['workflowTransitions', workflowId],
    queryFn: () => base44.entities.WorkflowTransition.filter({ workflow_definition_id: workflowId })
  });
  const { data: statuses = [] } = useQuery({
    queryKey: ['workflowStatuses', workflowId],
    queryFn: () => base44.entities.WorkflowStatus.filter({ workflow_definition_id: workflowId })
  });
  const { data: actions = [] } = useQuery({
    queryKey: ['workflowActions', workflowId],
    queryFn: () => base44.entities.WorkflowAction.filter({ workflow_definition_id: workflowId })
  });

  const actionMap = useMemo(() => { const m = {}; actions.forEach(a => { m[a.id] = a; }); return m; }, [actions]);

  const usedStatusIds = useMemo(() => new Set([
    ...transitions.map(t => t.from_status_id).filter(Boolean),
    ...transitions.map(t => t.to_status_id).filter(Boolean),
  ]), [transitions]);
  const visibleStatuses = useMemo(() => statuses.filter(s => usedStatusIds.has(s.id)), [statuses, usedStatusIds]);

  const { positions: autoPositions, totalW: autoTotalW, totalH: autoTotalH } = useMemo(
    () => visibleStatuses.length ? layoutNodes(visibleStatuses, transitions) : { positions: {}, totalW: 400, totalH: 200 },
    [visibleStatuses, transitions]
  );

  // Load from localStorage on mount / workflowId change
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(workflowId));
      const loaded = raw ? JSON.parse(raw) : { nodes: {}, edges: {} };
      setSavedLayout(loaded);
      setWorkingLayout(loaded);
      setIsDirty(false);
    } catch {
      setSavedLayout({ nodes: {}, edges: {} });
      setWorkingLayout({ nodes: {}, edges: {} });
    }
  }, [workflowId]);

  // Effective node positions
  const positions = useMemo(() => {
    const merged = { ...autoPositions };
    Object.keys(workingLayout.nodes || {}).forEach(id => {
      if (merged[id] !== undefined) merged[id] = workingLayout.nodes[id];
    });
    return merged;
  }, [autoPositions, workingLayout.nodes]);

  // Compute viewBox
  const { totalW, totalH } = useMemo(() => {
    const xs = Object.values(positions).map(p => p.x);
    const ys = Object.values(positions).map(p => p.y);
    if (!xs.length) return { totalW: 400, totalH: 200 };
    return {
      totalW: Math.max(...xs) + NODE_W - Math.min(...xs),
      totalH: Math.max(...ys) + NODE_H - Math.min(...ys),
    };
  }, [positions]);

  const hasInitialTransitions = transitions.some(t => !t.from_status_id);
  const PAD = 80;
  const startX = hasInitialTransitions ? START_X - PAD : -PAD;
  const viewW = totalW + Math.abs(startX) + PAD * 2;
  const viewH = totalH + PAD * 2;

  const pairMap = useMemo(() => {
    const m = {};
    transitions.forEach(t => {
      const key = `${t.from_status_id}__${t.to_status_id}`;
      if (!m[key]) m[key] = [];
      m[key].push(t);
    });
    return m;
  }, [transitions]);

  // ─── SVG coordinate helper ──────────────────────────────────────────────
  const getSVGPoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }, []);

  // ─── Mouse down ─────────────────────────────────────────────────────────
  const onNodeMouseDown = useCallback((e, id) => {
    e.preventDefault(); e.stopPropagation();
    const svgPt = getSVGPoint(e.clientX, e.clientY);
    const pos = positions[id] || { x: 0, y: 0 };
    setDragging({ type: 'node', id, startMouseX: svgPt.x, startMouseY: svgPt.y, startX: pos.x, startY: pos.y });
  }, [positions, getSVGPoint]);

  const onEdgeMouseDown = useCallback((e, transitionId, currentMx, currentMy) => {
    e.preventDefault(); e.stopPropagation();
    const svgPt = getSVGPoint(e.clientX, e.clientY);
    setDragging({ type: 'edge', id: transitionId, startMouseX: svgPt.x, startMouseY: svgPt.y, startX: currentMx, startY: currentMy });
  }, [getSVGPoint]);

  // ─── Mouse move ─────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    const svgPt = getSVGPoint(e.clientX, e.clientY);
    const nx = dragging.startX + (svgPt.x - dragging.startMouseX);
    const ny = dragging.startY + (svgPt.y - dragging.startMouseY);

    if (dragging.type === 'node') {
      setWorkingLayout(prev => ({ ...prev, nodes: { ...prev.nodes, [dragging.id]: { x: nx, y: ny } } }));
    } else {
      setWorkingLayout(prev => ({ ...prev, edges: { ...prev.edges, [dragging.id]: { x: nx, y: ny } } }));
    }
    setIsDirty(true);
  }, [dragging, getSVGPoint]);

  // ─── Mouse up ───────────────────────────────────────────────────────────
  const onMouseUp = useCallback(() => { setDragging(null); }, []);

  // ─── Save / Discard ─────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY(workflowId), JSON.stringify(workingLayout)); } catch {}
    setSavedLayout(workingLayout);
    setIsDirty(false);
  }, [workingLayout, workflowId]);

  const handleDiscard = useCallback(() => {
    const fallback = savedLayout || { nodes: {}, edges: {} };
    setWorkingLayout(fallback);
    setIsDirty(false);
  }, [savedLayout]);

  const handleReset = useCallback(() => {
    const empty = { nodes: {}, edges: {} };
    localStorage.removeItem(STORAGE_KEY(workflowId));
    setSavedLayout(empty);
    setWorkingLayout(empty);
    setIsDirty(false);
  }, [workflowId]);

  // ─── Early return ────────────────────────────────────────────────────────
  if (!statuses.length || !transitions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-sm">Add statuses and transitions to see the diagram</p>
      </div>
    );
  }

  const hasSavedCustomLayout = savedLayout && (
    Object.keys(savedLayout.nodes || {}).length > 0 ||
    Object.keys(savedLayout.edges || {}).length > 0
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-gray-500">Drag nodes or connector labels to rearrange.</p>
        <div className="flex gap-1 items-center flex-wrap">
          {/* Save / Discard */}
          {isDirty && (
            <>
              <Button size="sm" className="h-8 gap-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave}>
                <Save className="w-3.5 h-3.5" /> Save layout
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-gray-600" onClick={handleDiscard}>
                <X className="w-3.5 h-3.5" /> Discard
              </Button>
            </>
          )}
          {!isDirty && hasSavedCustomLayout && (
            <Button variant="outline" size="sm" className="h-8 gap-1 text-gray-500" onClick={handleReset}>
              <RotateCcw className="w-3 h-3" /> Reset layout
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.4, +(z - 0.15).toFixed(2)))}><ZoomOut className="w-4 h-4" /></Button>
          <span className="text-xs text-gray-500 self-center w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(2, +(z + 0.15).toFixed(2)))}><ZoomIn className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(1)}><Maximize2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Unsaved indicator */}
      {isDirty && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          You have unsaved layout changes. Click <strong>Save layout</strong> to keep them, or <strong>Discard</strong> to revert.
        </div>
      )}

      {/* SVG canvas */}
      <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-auto" style={{ minHeight: 300 }}>
        <svg
          ref={svgRef}
          viewBox={`${startX - PAD} ${-PAD} ${viewW} ${viewH}`}
          width={viewW * zoom}
          height={viewH * zoom}
          style={{ display: 'block', cursor: dragging ? 'grabbing' : 'default' }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#6B7280" />
            </marker>
            <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#3B82F6" />
            </marker>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
            </filter>
            <filter id="shadowDrag" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.22" />
            </filter>
          </defs>

          {/* "On Create" virtual node */}
          {hasInitialTransitions && (
            <g>
              <rect x={START_X} y={totalH / 2 - NODE_H / 2} width={NODE_W} height={NODE_H}
                rx="24" ry="24" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5 3" filter="url(#shadow)" />
              <text x={START_X + NODE_W / 2} y={totalH / 2} textAnchor="middle" dominantBaseline="middle"
                fontSize="12" fontWeight="600" fill="#2563EB">● On Create</text>
            </g>
          )}

          {/* Edges */}
          {transitions.map((t) => {
            const isInitialTrans = !t.from_status_id;
            const fromPos = isInitialTrans ? { x: START_X, y: totalH / 2 - NODE_H / 2 } : positions[t.from_status_id];
            const toPos = positions[t.to_status_id];
            if (!fromPos || !toPos) return null;

            const key = `${t.from_status_id}__${t.to_status_id}`;
            const group = pairMap[key] || [t];
            const posInGroup = group.indexOf(t);
            const offset = posInGroup - (group.length - 1) / 2;

            const { d, autoMx, autoMy } = getEdgePath(fromPos, toPos, offset);
            const edgeOverride = (workingLayout.edges || {})[t.id];
            const mx = edgeOverride ? edgeOverride.x : autoMx;
            const my = edgeOverride ? edgeOverride.y : autoMy;

            const action = actionMap[t.workflow_action_id];
            const isInactive = t.is_active === false;
            const labelText = action?.action_name || '';
            const labelW = Math.max(60, labelText.length * 6.5 + 16);
            const isDraggingEdge = dragging?.type === 'edge' && dragging.id === t.id;

            return (
              <g key={t.id} opacity={isInactive ? 0.35 : 1}>
                <path d={d} fill="none"
                  stroke={isInitialTrans ? '#3B82F6' : '#6B7280'}
                  strokeWidth="1.5"
                  strokeDasharray={isInactive ? '5 3' : undefined}
                  markerEnd={isInitialTrans ? 'url(#arrowBlue)' : 'url(#arrow)'} />
                {labelText && (
                  <g
                    style={{ cursor: isDraggingEdge ? 'grabbing' : 'grab' }}
                    onMouseDown={(e) => onEdgeMouseDown(e, t.id, mx, my)}
                  >
                    <rect x={mx - labelW / 2} y={my - 10} width={labelW} height={20} rx="10"
                      fill={isInitialTrans ? '#EFF6FF' : '#F9FAFB'}
                      stroke={isDraggingEdge ? '#3B82F6' : (isInitialTrans ? '#93C5FD' : '#E5E7EB')}
                      strokeWidth={isDraggingEdge ? 1.5 : 1}
                      filter={isDraggingEdge ? 'url(#shadowDrag)' : undefined} />
                    <text x={mx} y={my + 1} textAnchor="middle" dominantBaseline="middle"
                      fontSize="10" fill={isInitialTrans ? '#2563EB' : '#374151'} fontWeight="500"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}>
                      {labelText}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes (on top, draggable) */}
          {visibleStatuses.map(s => {
            const pos = positions[s.id];
            if (!pos) return null;
            const color = s.color_code || '#9CA3AF';
            const isInitial = s.is_initial, isFinal = s.is_final;
            const isDraggingThis = dragging?.type === 'node' && dragging.id === s.id;
            return (
              <g key={s.id} style={{ cursor: isDraggingThis ? 'grabbing' : 'grab' }}
                onMouseDown={(e) => onNodeMouseDown(e, s.id)}>
                <rect x={pos.x} y={pos.y} width={NODE_W} height={NODE_H}
                  rx={isFinal ? 24 : 8} ry={isFinal ? 24 : 8}
                  fill="white"
                  stroke={isDraggingThis ? '#3B82F6' : color}
                  strokeWidth={isDraggingThis ? 2.5 : (isInitial || isFinal ? 2.5 : 1.5)}
                  filter={isDraggingThis ? 'url(#shadowDrag)' : 'url(#shadow)'} />
                <rect x={pos.x} y={pos.y + 6} width={4} height={NODE_H - 12} rx="2" fill={color} />
                <text x={pos.x + NODE_W / 2 + 2} y={pos.y + NODE_H / 2 - (s.status_code ? 6 : 0)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="12" fontWeight="600" fill="#111827"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}>{s.status_name}</text>
                {s.status_code && (
                  <text x={pos.x + NODE_W / 2 + 2} y={pos.y + NODE_H / 2 + 10}
                    textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#9CA3AF"
                    style={{ userSelect: 'none', pointerEvents: 'none' }}>{s.status_code}</text>
                )}
                {isInitial && <circle cx={pos.x + NODE_W - 10} cy={pos.y + 10} r={5} fill="#10B981" />}
                {isFinal && <circle cx={pos.x + NODE_W - 10} cy={pos.y + 10} r={5} fill="#EF4444" />}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-emerald-500" /> Initial status</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-500" /> Final status</span>
        <span className="flex items-center gap-1.5"><svg width="24" height="12"><line x1="0" y1="6" x2="20" y2="6" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 2" /></svg> On Create transition</span>
        <span className="flex items-center gap-1.5"><svg width="24" height="12"><line x1="0" y1="6" x2="20" y2="6" stroke="#6B7280" strokeWidth="1.5" strokeDasharray="4 2" /></svg> Inactive transition</span>
      </div>
    </div>
  );
}