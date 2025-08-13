// Embedded JSON template data to avoid HTTP loading issues
export const embeddedTemplates: Record<string, any> = {
  'tiktok': {
    "version": "5.3.0",
    "objects": [
      {
        "type": "rect",
        "left": 0,
        "top": 0,
        "width": 1152,
        "height": 768,
        "fill": {
          "type": "linear",
          "gradientUnits": "pixels",
          "coords": { "x1": 0, "y1": 0, "x2": 1152, "y2": 768 },
          "colorStops": [
            { "offset": 0, "color": "#0ea5e9" },
            { "offset": 1, "color": "#111827" }
          ]
        },
        "selectable": false,
        "evented": false,
        "name": "TikTok-background"
      },
      {
        "type": "circle",
        "name": "TikTok-accent-circle",
        "left": 864.0,
        "top": -80,
        "radius": 180,
        "fill": "#ff5c8a",
        "stroke": "rgba(255,255,255,0.15)",
        "strokeWidth": 8,
        "opacity": 0.15
      },
      {
        "type": "rect",
        "name": "TikTok-image",
        "left": 92.16,
        "top": 138.24,
        "width": 483.84,
        "height": 460.79999999999995,
        "rx": 24,
        "ry": 24,
        "fill": "rgba(255,255,255,0.06)",
        "stroke": "rgba(255,255,255,0.45)",
        "strokeWidth": 3
      },
      {
        "type": "textbox",
        "name": "TikTok-title",
        "text": "TikTok Title",
        "left": 633.6,
        "top": 192.0,
        "width": 403.2,
        "fontFamily": "Inter",
        "fontSize": 64,
        "fontWeight": 800,
        "fill": "#ffffff",
        "shadow": "rgba(0,0,0,0.2) 0px 4px 24px"
      },
      {
        "type": "textbox",
        "name": "TikTok-subtitle",
        "text": "Add subtitle / tagline here",
        "left": 633.6,
        "top": 272.0,
        "width": 403.2,
        "fontFamily": "Inter",
        "fontSize": 28,
        "fontWeight": 500,
        "fill": "#e5e7eb",
        "lineHeight": 1.3
      },
      {
        "type": "rect",
        "name": "TikTok-cta-bg",
        "left": 633.6,
        "top": 352.0,
        "width": 220,
        "height": 56,
        "rx": 14,
        "ry": 14,
        "fill": "#ff5c8a"
      },
      {
        "type": "textbox",
        "name": "TikTok-cta",
        "text": "Call to Action",
        "left": 653.6,
        "top": 360.0,
        "width": 180,
        "fontFamily": "Inter",
        "fontSize": 22,
        "fontWeight": 700,
        "fill": "#0b1220"
      }
    ],
    "width": 1152,
    "height": 768
  },

  'instagram': {
    "version": "5.3.0",
    "objects": [
      {
        "type": "rect",
        "left": 0,
        "top": 0,
        "width": 1152,
        "height": 768,
        "fill": {
          "type": "linear",
          "gradientUnits": "pixels",
          "coords": { "x1": 0, "y1": 0, "x2": 1152, "y2": 768 },
          "colorStops": [
            { "offset": 0, "color": "#ec4899" },
            { "offset": 1, "color": "#8b5cf6" }
          ]
        },
        "selectable": false,
        "evented": false,
        "name": "Instagram-background"
      },
      {
        "type": "textbox",
        "name": "Instagram-title",
        "text": "Instagram Post",
        "left": 100,
        "top": 200,
        "width": 950,
        "fontFamily": "Inter",
        "fontSize": 72,
        "fontWeight": 800,
        "fill": "#ffffff",
        "textAlign": "center"
      }
    ],
    "width": 1152,
    "height": 768
  },

  'youtube': {
    "version": "5.3.0", 
    "objects": [
      {
        "type": "rect",
        "left": 0,
        "top": 0,
        "width": 1152,
        "height": 768,
        "fill": "#ef4444",
        "selectable": false,
        "evented": false,
        "name": "YouTube-background"
      },
      {
        "type": "textbox",
        "name": "YouTube-title",
        "text": "YouTube Template",
        "left": 100,
        "top": 250,
        "width": 950,
        "fontFamily": "Inter",
        "fontSize": 64,
        "fontWeight": 800,
        "fill": "#ffffff",
        "textAlign": "center"
      }
    ],
    "width": 1152,
    "height": 768
  },

  'thumbnails': {
    "version": "5.3.0",
    "objects": [
      {
        "type": "rect",
        "left": 0,
        "top": 0,
        "width": 1152,
        "height": 768,
        "fill": {
          "type": "linear",
          "gradientUnits": "pixels", 
          "coords": { "x1": 0, "y1": 0, "x2": 1152, "y2": 768 },
          "colorStops": [
            { "offset": 0, "color": "#111827" },
            { "offset": 1, "color": "#1f2937" }
          ]
        },
        "selectable": false,
        "evented": false,
        "name": "Thumbnails-background"
      },
      {
        "type": "textbox",
        "name": "Thumbnails-title",
        "text": "Thumbnail Title",
        "left": 100,
        "top": 200,
        "width": 950,
        "fontFamily": "Inter",
        "fontSize": 68,
        "fontWeight": 800,
        "fill": "#ffffff",
        "textAlign": "center"
      }
    ],
    "width": 1152,
    "height": 768
  },

  'shorts_video': {
    "version": "5.3.0",
    "objects": [
      {
        "type": "rect",
        "left": 0,
        "top": 0,
        "width": 1152,
        "height": 768,
        "fill": {
          "type": "linear",
          "gradientUnits": "pixels",
          "coords": { "x1": 0, "y1": 0, "x2": 1152, "y2": 768 },
          "colorStops": [
            { "offset": 0, "color": "#ef4444" },
            { "offset": 1, "color": "#f97316" }
          ]
        },
        "selectable": false,
        "evented": false,
        "name": "Shorts-background"
      },
      {
        "type": "textbox",
        "name": "Shorts-title",
        "text": "Shorts Video",
        "left": 100,
        "top": 250,
        "width": 950,
        "fontFamily": "Inter",
        "fontSize": 64,
        "fontWeight": 800,
        "fill": "#ffffff",
        "textAlign": "center"
      }
    ],
    "width": 1152,
    "height": 768
  },

  'business': {
    "version": "5.3.0",
    "objects": [
      {
        "type": "rect",
        "left": 0,
        "top": 0,
        "width": 1152,
        "height": 768,
        "fill": {
          "type": "linear",
          "gradientUnits": "pixels",
          "coords": { "x1": 0, "y1": 0, "x2": 1152, "y2": 768 },
          "colorStops": [
            { "offset": 0, "color": "#059669" },
            { "offset": 1, "color": "#047857" }
          ]
        },
        "selectable": false,
        "evented": false,
        "name": "Business-background"
      },
      {
        "type": "textbox",
        "name": "Business-title",
        "text": "Business Template",
        "left": 100,
        "top": 200,
        "width": 950,
        "fontFamily": "Inter",
        "fontSize": 64,
        "fontWeight": 800,
        "fill": "#ffffff",
        "textAlign": "center"
      }
    ],
    "width": 1152,
    "height": 768
  },

  'social': {
    "version": "5.3.0",
    "objects": [
      {
        "type": "rect",
        "left": 0,
        "top": 0,
        "width": 1152,
        "height": 768,
        "fill": {
          "type": "linear",
          "gradientUnits": "pixels",
          "coords": { "x1": 0, "y1": 0, "x2": 1152, "y2": 768 },
          "colorStops": [
            { "offset": 0, "color": "#0ea5e9" },
            { "offset": 1, "color": "#0284c7" }
          ]
        },
        "selectable": false,
        "evented": false,
        "name": "Social-background"
      },
      {
        "type": "textbox",
        "name": "Social-title",
        "text": "Social Media Post",
        "left": 100,
        "top": 200,
        "width": 950,
        "fontFamily": "Inter",
        "fontSize": 64,
        "fontWeight": 800,
        "fill": "#ffffff",
        "textAlign": "center"
      }
    ],
    "width": 1152,
    "height": 768
  },

  'docs': {
    "version": "5.3.0",
    "objects": [
      {
        "type": "rect",
        "left": 0,
        "top": 0,
        "width": 1152,
        "height": 768,
        "fill": "#ffffff",
        "selectable": false,
        "evented": false,
        "name": "Document-background"
      },
      {
        "type": "rect",
        "left": 50,
        "top": 50,
        "width": 1052,
        "height": 100,
        "fill": "#f3f4f6",
        "stroke": "#d1d5db",
        "strokeWidth": 1,
        "name": "Document-header"
      },
      {
        "type": "textbox",
        "name": "Document-title",
        "text": "Document Title",
        "left": 80,
        "top": 80,
        "width": 400,
        "fontFamily": "Inter",
        "fontSize": 32,
        "fontWeight": 700,
        "fill": "#111827"
      },
      {
        "type": "textbox",
        "name": "Document-content",
        "text": "Add your document content here...\n\nThis is a template for creating professional documents.",
        "left": 80,
        "top": 200,
        "width": 992,
        "fontFamily": "Inter",
        "fontSize": 16,
        "fill": "#374151",
        "lineHeight": 1.5
      }
    ],
    "width": 1152,
    "height": 768
  },

  'fashion': {
    "version": "5.3.0",
    "objects": [
      {
        "type": "rect",
        "left": 0,
        "top": 0,
        "width": 1152,
        "height": 768,
        "fill": {
          "type": "linear",
          "gradientUnits": "pixels",
          "coords": { "x1": 0, "y1": 0, "x2": 1152, "y2": 768 },
          "colorStops": [
            { "offset": 0, "color": "#8b5cf6" },
            { "offset": 1, "color": "#7c3aed" }
          ]
        },
        "selectable": false,
        "evented": false,
        "name": "Fashion-background"
      },
      {
        "type": "rect",
        "name": "Fashion-image-placeholder",
        "left": 100,
        "top": 100,
        "width": 300,
        "height": 400,
        "fill": "rgba(255,255,255,0.2)",
        "stroke": "rgba(255,255,255,0.5)",
        "strokeWidth": 2,
        "rx": 12,
        "ry": 12
      },
      {
        "type": "textbox",
        "name": "Fashion-title",
        "text": "Fashion Collection",
        "left": 450,
        "top": 150,
        "width": 600,
        "fontFamily": "Inter",
        "fontSize": 58,
        "fontWeight": 800,
        "fill": "#ffffff"
      },
      {
        "type": "textbox",
        "name": "Fashion-subtitle",
        "text": "Discover the latest trends",
        "left": 450,
        "top": 230,
        "width": 500,
        "fontFamily": "Inter",
        "fontSize": 24,
        "fill": "rgba(255,255,255,0.9)"
      }
    ],
    "width": 1152,
    "height": 768
  }
};

// Get embedded template data
export function getEmbeddedTemplate(templateKey: string): any | null {
  return embeddedTemplates[templateKey] || null;
}