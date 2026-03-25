// src/components/AvatarCanvas.tsx
// SVG-based body silhouette avatar driven by BodyModelParams
// Uses react-native-svg (Expo SDK 55 compatible, no expo-gl required)

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, {
  Circle, Rect, Path, Defs, LinearGradient, Stop, ClipPath, G,
} from 'react-native-svg';
import { BodyModelParams } from '../services/bodyRatio.service';
import { Colors } from '../constants/colors';

interface Props {
  params: BodyModelParams;
  garmentColor?: string; // accent colour overlay when "dressed"
  size?: number;         // canvas width; height = size * 2.2
}

// ---------------------------------------------------------------------------
// Geometry helpers — translate 0–1 params → SVG pixel coordinates
// ---------------------------------------------------------------------------
function buildGeometry(params: BodyModelParams, W: number, H: number) {
  const cx = W / 2;

  // Heights (from top, in proportion to total canvas height)
  const headR        = W * 0.10;
  const headCY       = H * 0.09;
  const neckTop      = headCY + headR;
  const neckBot      = neckTop + H * 0.06;
  const neckW        = W * 0.06;

  // Shoulder width driven by param (min 30%, max 70% of canvas width)
  const shoulderW    = W * (0.30 + params.shoulderScale * 0.40);
  const shoulderY    = neckBot;
  const waistY       = shoulderY + H * 0.22;
  const hipY         = waistY + H * 0.14;
  const legBotY      = H * (0.88 + params.heightScale * 0.07);

  // Waist width (min 20%, max 50%)
  const waistW       = W * (0.20 + params.waistScale * 0.30);
  // Hip width (min 28%, max 65%)
  const hipW         = W * (0.28 + params.hipScale  * 0.37);
  // Leg gap at base
  const legSepW      = hipW * 0.44;

  return {
    cx, headR, headCY, neckTop, neckBot, neckW,
    shoulderW, shoulderY, waistY, hipY, legBotY,
    waistW, hipW, legSepW,
  };
}

export default function AvatarCanvas({ params, garmentColor, size = 160 }: Props) {
  const W = size;
  const H = size * 2.2;
  const g = buildGeometry(params, W, H);

  // Body torso path — smooth bezier from shoulder → waist → hip
  const torsoPath = [
    // left shoulder to left waist
    `M ${g.cx - g.shoulderW / 2} ${g.shoulderY}`,
    `C ${g.cx - g.shoulderW / 2} ${g.shoulderY + 20},`,
    `${g.cx - g.waistW / 2} ${g.waistY - 20},`,
    `${g.cx - g.waistW / 2} ${g.waistY}`,
    // left waist to left hip
    `C ${g.cx - g.waistW / 2} ${g.waistY + 20},`,
    `${g.cx - g.hipW / 2} ${g.hipY - 10},`,
    `${g.cx - g.hipW / 2} ${g.hipY}`,
    // left hip to left leg bottom
    `L ${g.cx - g.legSepW} ${g.legBotY}`,
    // inside leg seam (gap)
    `L ${g.cx - g.legSepW * 0.25} ${g.legBotY}`,
    `L ${g.cx - g.legSepW * 0.25} ${g.hipY + (g.legBotY - g.hipY) * 0.5}`, // crotch
    `L ${g.cx + g.legSepW * 0.25} ${g.hipY + (g.legBotY - g.hipY) * 0.5}`,
    `L ${g.cx + g.legSepW * 0.25} ${g.legBotY}`,
    // right leg to right hip
    `L ${g.cx + g.legSepW} ${g.legBotY}`,
    `L ${g.cx + g.hipW / 2} ${g.hipY}`,
    // right hip to right waist
    `C ${g.cx + g.hipW / 2} ${g.hipY - 10},`,
    `${g.cx + g.waistW / 2} ${g.waistY + 20},`,
    `${g.cx + g.waistW / 2} ${g.waistY}`,
    // right waist to right shoulder
    `C ${g.cx + g.waistW / 2} ${g.waistY - 20},`,
    `${g.cx + g.shoulderW / 2} ${g.shoulderY + 20},`,
    `${g.cx + g.shoulderW / 2} ${g.shoulderY}`,
    `Z`,
  ].join(' ');

  // Garment clip region (torso only — shoulders to hips)
  const garmentPath = [
    `M ${g.cx - g.shoulderW / 2} ${g.shoulderY}`,
    `C ${g.cx - g.shoulderW / 2} ${g.shoulderY + 20},`,
    `  ${g.cx - g.waistW / 2} ${g.waistY - 20},`,
    `  ${g.cx - g.waistW / 2} ${g.waistY}`,
    `C ${g.cx - g.waistW / 2} ${g.waistY + 20},`,
    `  ${g.cx - g.hipW / 2} ${g.hipY - 10},`,
    `  ${g.cx - g.hipW / 2} ${g.hipY}`,
    `L ${g.cx + g.hipW / 2} ${g.hipY}`,
    `C ${g.cx + g.hipW / 2} ${g.hipY - 10},`,
    `  ${g.cx + g.waistW / 2} ${g.waistY + 20},`,
    `  ${g.cx + g.waistW / 2} ${g.waistY}`,
    `C ${g.cx + g.waistW / 2} ${g.waistY - 20},`,
    `  ${g.cx + g.shoulderW / 2} ${g.shoulderY + 20},`,
    `  ${g.cx + g.shoulderW / 2} ${g.shoulderY}`,
    `Z`,
  ].join(' ');

  return (
    <View style={[styles.container, { width: W, height: H }]}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          {/* Body gradient */}
          <LinearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={Colors.charcoal} stopOpacity="1" />
            <Stop offset="0.5" stopColor="#2a2a2a" stopOpacity="1" />
            <Stop offset="1" stopColor={Colors.charcoal} stopOpacity="1" />
          </LinearGradient>
          {/* Accent skin gradient (lighter centre) */}
          <LinearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.accent} stopOpacity="0.25" />
            <Stop offset="1" stopColor={Colors.accent} stopOpacity="0.08" />
          </LinearGradient>
          {/* Garment gradient */}
          <LinearGradient id="garmentGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={garmentColor ?? Colors.accent} stopOpacity="0.85" />
            <Stop offset="1" stopColor={garmentColor ?? Colors.accent} stopOpacity="0.40" />
          </LinearGradient>
        </Defs>

        {/* ── Body silhouette ── */}
        <Path d={torsoPath} fill="url(#bodyGrad)" stroke={Colors.silver} strokeWidth={0.5} strokeOpacity={0.3} />
        {/* Subtle skin tone overlay */}
        <Path d={torsoPath} fill="url(#skinGrad)" />

        {/* ── Neck ── */}
        <Rect
          x={g.cx - g.neckW / 2}
          y={g.neckTop}
          width={g.neckW}
          height={g.neckBot - g.neckTop}
          fill="url(#bodyGrad)"
          rx={g.neckW / 2}
        />

        {/* ── Head ── */}
        <Circle
          cx={g.cx}
          cy={g.headCY}
          r={g.headR}
          fill="url(#bodyGrad)"
          stroke={Colors.silver}
          strokeWidth={0.5}
          strokeOpacity={0.3}
        />
        {/* Face accent */}
        <Circle cx={g.cx} cy={g.headCY} r={g.headR * 0.6} fill={Colors.accent} fillOpacity={0.07} />

        {/* ── Garment overlay (shown when garmentColor is provided) ── */}
        {garmentColor && (
          <Path
            d={garmentPath}
            fill="url(#garmentGrad)"
            stroke={garmentColor}
            strokeWidth={1}
            strokeOpacity={0.6}
          />
        )}

        {/* ── Shoulder accent lines ── */}
        <Path
          d={`M ${g.cx - g.shoulderW / 2} ${g.shoulderY} L ${g.cx + g.shoulderW / 2} ${g.shoulderY}`}
          stroke={Colors.accent}
          strokeWidth={1.5}
          strokeOpacity={0.6}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
