"use client";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";

export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom intensity={1.15} luminanceThreshold={0.32} luminanceSmoothing={0.18} mipmapBlur radius={0.72} />
      <Noise opacity={0.045} />
      <Vignette eskil={false} offset={0.18} darkness={0.86} />
    </EffectComposer>
  );
}
