import { useEffect, useMemo, useState } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { fabric } from "fabric";

export default function Layers() {
	const cv = useEditorStore(s => s.canvas);
	const [objs, setObjs] = useState<fabric.Object[]>([]);
	const [invertOrder, setInvertOrder] = useState<boolean>(false);
	const [activeId, setActiveId] = useState<string | null>(null);
	useEffect(() => {
		if (!cv) return;
		const update = () => setObjs(cv.getObjects().slice());
		update();
		cv.on("object:added", update);
		cv.on("object:removed", update);
		cv.on("object:modified", update);
		cv.on("selection:created", () => {
			const a = cv.getActiveObject() as any;
			setActiveId(a ? (a.id || a.__uid || String(a.__uid)) : null);
		});
		cv.on("selection:updated", () => {
			const a = cv.getActiveObject() as any;
			setActiveId(a ? (a.id || a.__uid || String(a.__uid)) : null);
		});
		cv.on("selection:cleared", () => setActiveId(null));
		return () => { cv.off("object:added", update); cv.off("object:removed", update); cv.off("object:modified", update); };
	}, [cv]);
	const ordered = useMemo(() => {
		const list = objs.slice();
		const topFirst = list.slice().reverse();
		return invertOrder ? list : topFirst;
	}, [objs, invertOrder]);

	if (!cv) return (
		<div className="p-2 text-gray-800">
			<div className="text-xs font-semibold text-gray-700">Layers</div>
			<div className="text-xs text-gray-500 mt-1">Canvas not ready…</div>
		</div>
	);

	const selectLayer = (o: fabric.Object) => {
		if (!cv) return;
		cv.setActiveObject(o);
		cv.requestRenderAll();
	};

	const moveUp = (o: fabric.Object) => {
		if (!cv) return;
		cv.bringForward(o);
		cv.requestRenderAll();
		setObjs(cv.getObjects().slice());
	};

	const moveDown = (o: fabric.Object) => {
		if (!cv) return;
		cv.sendBackwards(o);
		cv.requestRenderAll();
		setObjs(cv.getObjects().slice());
	};

	const moveTop = (o: fabric.Object) => {
		if (!cv) return;
		cv.bringToFront(o);
		cv.requestRenderAll();
		setObjs(cv.getObjects().slice());
	};

	const moveBottom = (o: fabric.Object) => {
		if (!cv) return;
		cv.sendToBack(o);
		cv.requestRenderAll();
		setObjs(cv.getObjects().slice());
	};

	return (
		<div className="p-2 text-gray-800">
			<div className="flex items-center justify-between mb-2">
				<div className="text-xs font-semibold text-gray-700">Layers</div>
				<button
					className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-800"
					title={invertOrder ? "Show top-first" : "Show bottom-first"}
					onClick={() => setInvertOrder(v => !v)}
				>
					{invertOrder ? "Bottom→Top" : "Top→Bottom"}
				</button>
			</div>
			<div className="space-y-1">
				{ordered.map((o, i) => {
					const isVideo = Boolean((o as any).__isVideo);
					const label = isVideo ? "video" : ((o as any).name || o.type || `Layer ${i+1}`);
					const isActive = activeId ? ((o as any).id === activeId) : (cv.getActiveObject() === o);
					return (
						<div key={(o as any).__uid || i} className={`flex items-center gap-1`}>
							<button
								className={`flex-1 text-left px-2 py-1 rounded text-sm ${isActive ? 'bg-indigo-100' : 'bg-gray-50 hover:bg-gray-100'} text-gray-800`}
								onClick={() => selectLayer(o)}
								onDoubleClick={() => {
									const a: any = o;
									if (a && a.type === 'textbox' && typeof a.enterEditing === 'function') {
										cv.setActiveObject(a);
										a.enterEditing();
										a.hiddenTextarea && a.hiddenTextarea.focus();
									}
								}}
								title={label}
							>
								{label}
							</button>
							<button className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-800" onClick={() => moveUp(o)} title="Bring Forward">↑</button>
							<button className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-800" onClick={() => moveDown(o)} title="Send Backward">↓</button>
							<button className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-800" onClick={() => moveTop(o)} title="Bring To Front">⤴</button>
							<button className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-800" onClick={() => moveBottom(o)} title="Send To Back">⤵</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}


