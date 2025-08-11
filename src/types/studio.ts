export type LayerType = 'text'|'rect'|'image';
export interface Layer { id: string; type: LayerType; props: any; }
export interface DesignDoc {
  id?: string; ownerId: string; title: string;
  width: number; height: number; bg: string;
  layers: Layer[]; schemaVersion: number;
  createdAt?: any; updatedAt?: any; status?: 'draft'|'ready';
}
export interface TemplateDoc extends Omit<DesignDoc,'ownerId'> {
  public: true; tags: string[]; previewURL: string;
}
