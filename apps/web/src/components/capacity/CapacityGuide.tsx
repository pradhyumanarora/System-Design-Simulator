export function CapacityGuide() {
  return (
    <aside style={guideStyle}>
      <div style={eyebrowStyle}>CAPACITY PLANNING</div>
      <div style={{ fontSize: 16, fontWeight: 800, marginTop: 12 }}>
        Back-of-the-envelope estimation
      </div>
      <p style={copyStyle}>
        Start with user activity, derive average traffic, then apply a peak multiplier.
      </p>
      <GuideStep number="1" text="Estimate daily requests from DAU and actions per user." />
      <GuideStep number="2" text="Split peak traffic into read and write QPS." />
      <GuideStep number="3" text="Estimate network bandwidth and retained storage." />
      <GuideStep number="4" text="Compare demand with your architecture configuration." />
      <div style={tipStyle}>
        Interview tip: state assumptions clearly and prefer round numbers you can calculate quickly.
      </div>
    </aside>
  );
}

function GuideStep({ number, text }: { number: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
      <span style={numberStyle}>{number}</span>
      <span style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}

const guideStyle: React.CSSProperties = {
  background: '#1e293b',
  borderRight: '1px solid #334155',
  boxSizing: 'border-box',
  color: '#e2e8f0',
  overflowY: 'auto',
  padding: '18px 16px',
  width: 240,
};

const eyebrowStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.1em',
};

const copyStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  lineHeight: 1.55,
};

const numberStyle: React.CSSProperties = {
  alignItems: 'center',
  background: '#f97316',
  borderRadius: '50%',
  color: '#fff',
  display: 'flex',
  flex: '0 0 22px',
  fontSize: 11,
  fontWeight: 800,
  height: 22,
  justifyContent: 'center',
};

const tipStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#94a3b8',
  fontSize: 11,
  lineHeight: 1.5,
  marginTop: 24,
  padding: 12,
};
