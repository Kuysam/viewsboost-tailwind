import { useRef, useEffect } from "react";
import { fabric } from "fabric";
import { useEditorStore } from "../store/useEditorStore";

export default function CanvasStage() {
	const elRef = useRef<HTMLCanvasElement>(null);
	const setCanvas = useEditorStore(s => s.setCanvas);

	useEffect(() => {
		const el = elRef.current!;
		const canvas = new fabric.Canvas(el, { 
			preserveObjectStacking: true,
			backgroundColor: '#ffffff'
		});
		
		// Set a large default size similar to Canva
		canvas.setWidth(1200);
		canvas.setHeight(675); // 16:9 aspect ratio
		setCanvas(canvas);

		// Handle window resize to maintain responsiveness
		const handleResize = () => {
			const container = el.parentElement;
			if (!container) return;
			
			const containerRect = container.getBoundingClientRect();
			const maxWidth = Math.min(1200, containerRect.width - 40);
			const maxHeight = Math.min(675, containerRect.height - 40);
			
			// Maintain aspect ratio
			const aspectRatio = 16 / 9;
			let newWidth = maxWidth;
			let newHeight = newWidth / aspectRatio;
			
			if (newHeight > maxHeight) {
				newHeight = maxHeight;
				newWidth = newHeight * aspectRatio;
			}
			
			canvas.setDimensions({ 
				width: Math.max(800, newWidth), 
				height: Math.max(450, newHeight) 
			});
			canvas.requestRenderAll();
		};

		// Initial size check
		setTimeout(handleResize, 100);
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			canvas.dispose();
			setCanvas(null);
		};
	}, [setCanvas]);

	return (
		<div className="w-full h-full flex justify-center items-center">
			<canvas 
				data-testid="editor-canvas" 
				id="editor2-canvas" 
				ref={elRef} 
				className="rounded-xl border border-gray-200 shadow-lg bg-white" 
				style={{ maxWidth: '100%', maxHeight: '100%' }}
			/>
		</div>
	);
}


