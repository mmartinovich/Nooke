import React, { useState, useEffect, useRef, memo } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { StreakState } from '../types';

interface ElectricBoltProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  state: StreakState;
  consecutiveDays: number;
  boltIndex: number;
}

const SEGMENTS = 12;
const MAX_OFFSET = 8;

function generateBoltPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): string {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return '';

  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;

  const points: string[] = [`M ${fromX} ${fromY}`];

  for (let i = 1; i <= SEGMENTS; i++) {
    const t = i / (SEGMENTS + 1);
    const taper = Math.sin(t * Math.PI);
    const offset = (Math.random() * 2 - 1) * MAX_OFFSET * taper;

    const x = fromX + dx * t + px * offset;
    const y = fromY + dy * t + py * offset;
    points.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  points.push(`L ${toX} ${toY}`);
  return points.join(' ');
}

function ElectricBoltComponent({
  fromX,
  fromY,
  toX,
  toY,
  state,
  consecutiveDays,
  boltIndex,
}: ElectricBoltProps) {
  const [pathD, setPathD] = useState(() => generateBoltPath(fromX, fromY, toX, toY));
  const opacityAnim = useRef(new Animated.Value(state === 'active' ? 0.85 : 0.4)).current;

  // Jitter: regenerate path periodically
  useEffect(() => {
    const interval = state === 'active' ? 120 : 450;
    const id = setInterval(() => {
      setPathD(generateBoltPath(fromX, fromY, toX, toY));
    }, interval);
    return () => clearInterval(id);
  }, [fromX, fromY, toX, toY, state]);

  // Pulse opacity
  useEffect(() => {
    const min = state === 'active' ? 0.7 : 0.3;
    const max = state === 'active' ? 1.0 : 0.5;
    const duration = state === 'active' ? 800 : 1400;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: max,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: min,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [state]);

  // Stroke width scales with streak strength
  const strokeWidth = Math.min(1.5 + consecutiveDays * 0.5, 6);
  const gradientId = `bolt-grad-${boltIndex}`;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: opacityAnim,
      }}
      pointerEvents="none"
    >
      <Svg style={{ flex: 1 }}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1={fromX} y1={fromY} x2={toX} y2={toY} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={state === 'active' ? '#00f0ff' : 'rgba(0,240,255,0.4)'} />
            <Stop offset="0.5" stopColor={state === 'active' ? '#3B82F6' : 'rgba(59,130,246,0.3)'} />
            <Stop offset="1" stopColor={state === 'active' ? '#b537f2' : 'rgba(181,55,242,0.3)'} />
          </SvgLinearGradient>
        </Defs>
        {/* Outer glow */}
        <Path
          d={pathD}
          stroke={`url(#${gradientId})`}
          strokeWidth={state === 'fading' ? Math.max(strokeWidth - 1, 1.5) : strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* White hot core */}
        <Path
          d={pathD}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={state === 'fading' ? 0.5 : Math.min(strokeWidth * 0.35, 1.5)}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

export const ElectricBolt = memo(ElectricBoltComponent);
