import { useEditorStore } from "../store/useEditorStore";

export default function PagesPanel() {
	const pages = useEditorStore(s => s.pages);
	const active = useEditorStore(s => s.activePage);
	const load = useEditorStore(s => s.loadPage);
	const add = useEditorStore(s => s.addPage);
	const dup = useEditorStore(s => s.duplicatePage);
	const rem = useEditorStore(s => s.removePage);
	const suggest = useEditorStore(s => s.smartSuggestNextPage);

	return (
		<div className="p-2">
			<div className="flex items-center justify-between mb-2">
				<div className="text-xs font-semibold text-gray-500">Pages</div>
        <div className="flex gap-1">
          <button className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800" onClick={add}>Add</button>
          <button className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800" onClick={dup}>Duplicate</button>
          <button className="px-2 py-1 text-xs rounded bg-indigo-600 text-white" onClick={suggest}>Smart Next</button>
				</div>
			</div>
			<div className="space-y-1">
				{pages.map((p, i)=> (
          <div key={p.id} className={`flex items-center justify-between px-2 py-1 rounded ${i===active?'bg-indigo-50':'bg-gray-50'}`}>
            <button className="text-left text-sm flex-1 text-gray-800" onClick={()=>load(i)}>{p.name}</button>
						{pages.length>1 && <button className="text-xs text-rose-600" onClick={()=>rem(i)}>✕</button>}
					</div>
				))}
			</div>
		</div>
	);
}


