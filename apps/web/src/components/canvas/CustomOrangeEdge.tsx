import { BaseEdge, getStraightPath } from '@xyflow/react';

export function CustomOrangeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: any) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: '#f97316',
        strokeWidth: 3,
      }}
    />
  );
}
