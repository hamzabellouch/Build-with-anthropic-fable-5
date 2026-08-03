// ---------- media ----------
export interface ProbeInfo {
  path: string;
  container: string;
  durationS: number;
  width: number;
  height: number;
  fps: number;
  vcodec: string;
  hasAudio: boolean;
  acodec: string | null;
}

export interface Seg {
  start: number;
  end: number;
}

export interface SceneScore {
  t: number;
  score: number;
}

// ---------- transcript ----------
export interface Token {
  text: string;
  startS: number;
  endS: number;
  confidence: number;
  speaker?: string;
}

export interface Transcript {
  model: string;
  text: string;
  tokens: Token[];
}

export interface Utterance {
  idx: number;
  startS: number;
  endS: number;
  text: string;
}

// ---------- edit plan ----------
export type CutKind = 'silence' | 'lead' | 'tail' | 'retake' | 'false-start' | 'filler' | 'mistake';

export interface Cut {
  id: string;
  startS: number;
  endS: number;
  kind: CutKind;
  reason: string;
  confidence: number; // 0..1
  enabled: boolean;
}

export type OverlayKind = 'intro' | 'concept';
/** Preconfigured design elements — the model picks one, templates render it. */
export type ElementKind = 'info-card' | 'lower-third' | 'arrow' | 'highlight' | 'subscribe';

/** Normalized [0..1] region in the frame (top-left origin). w=h=0 means a point. */
export interface RegionTarget {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayerAnim {
  /** seconds after overlay start before this layer appears */
  delay: number;
  fadeIn: number;
  fadeOut: number;
  /** initial pixel offset that eases to 0 (slide-in) */
  slideX: number;
  slideY: number;
  slideDur: number;
}

export interface OverlayLayer {
  /** PNG filename relative to <project>/overlays/ */
  file: string;
  anim: LayerAnim;
}

export interface IntroSpec {
  /** small category chip, Arabic (e.g. "درس جديد") */
  kicker: string;
  /** Arabic title, very short */
  title: string;
  /** Arabic supporting line */
  subtitle: string;
  /** English brief for the AI-generated backdrop illustration ('' = none) */
  backdrop?: string;
  /** PNG path (inside work/) once the backdrop has been generated */
  backdropFile?: string;
}

export interface ConceptSpec {
  element: ElementKind;
  /** Arabic headline / arrow-highlight label */
  headline: string;
  /** Arabic supporting line ('' = none) */
  sub?: string;
  /** info-card only: 0-3 very short Arabic points */
  lines: string[];
  /** arrow (point) / highlight (box) target, normalized */
  target?: RegionTarget;
  /** cards: which side of the frame is safe to cover */
  side: 'left' | 'right';
  durationS: number;
  /** info-card only: English brief for a small flat illustration ('' = none) */
  illustration?: string;
  /** PNG path (inside work/) once the illustration has been generated */
  illustrationFile?: string;
}

export interface Overlay {
  id: string;
  kind: OverlayKind;
  /** 'output' (intro pins to t=0 of the edited video) or 'source' (concept pins to source time) */
  anchorSpace: 'output' | 'source';
  anchorS: number;
  durationS: number;
  spec: IntroSpec | ConceptSpec;
  layers: OverlayLayer[];
  enabled: boolean;
  note?: string;
}

export interface PlanSettings {
  introSeconds: number;
  minSilenceGap: number;
  keepAfterSpeech: number;
  keepBeforeSpeech: number;
  minKeepSegment: number;
  staleMinSeconds: number;
  staleScoreMax: number;
  maxGraphics: number;
}

export interface EditPlan {
  version: 1;
  project: string;
  createdAt: string;
  mock: boolean;
  source: ProbeInfo;
  /** browser-safe preview file name inside the project dir */
  preview: string;
  cuts: Cut[];
  overlays: Overlay[];
  settings: PlanSettings;
  models: { stt: string; edit: string; video: string; image: string };
}

// ---------- resolved render timeline ----------
export interface ResolvedLayer {
  pngPath: string;
  anim: LayerAnim;
}

export interface ResolvedOverlay {
  id: string;
  kind: OverlayKind;
  startOut: number;
  endOut: number;
  layers: ResolvedLayer[];
}

export interface ResolvedTimeline {
  keeps: Seg[];
  outDuration: number;
  overlays: ResolvedOverlay[];
}
