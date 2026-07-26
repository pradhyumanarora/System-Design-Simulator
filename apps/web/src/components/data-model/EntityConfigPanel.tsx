import type {
  DataFieldType,
  DataModelField,
  RelationCardinality,
} from '@sds/shared/src/index';
import { useDesignStore } from '../../store/useDesignStore';

const FIELD_TYPES: DataFieldType[] = [
  'uuid',
  'string',
  'text',
  'integer',
  'decimal',
  'boolean',
  'timestamp',
  'json',
];

const CARDINALITIES: Array<{ value: RelationCardinality; label: string }> = [
  { value: 'one-to-one', label: 'One to one (1:1)' },
  { value: 'one-to-many', label: 'One to many (1:N)' },
  { value: 'many-to-many', label: 'Many to many (N:N)' },
];

export function EntityConfigPanel() {
  const {
    schema,
    selectedEntityId,
    updateEntity,
    removeEntity,
    updateRelation,
    removeRelation,
  } = useDesignStore();
  const entity = schema.entities.find((item) => item.id === selectedEntityId);

  if (!entity) {
    return (
      <aside style={panelStyle}>
        <div style={sectionTitleStyle}>ENTITY CONFIGURATION</div>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          Select an entity to edit its name, fields and relationships.
        </p>
      </aside>
    );
  }

  const updateField = (id: string, patch: Partial<DataModelField>) => {
    updateEntity(entity.id, {
      fields: entity.fields.map((field) =>
        field.id === id ? { ...field, ...patch } : field
      ),
    });
  };

  const addField = () => {
    updateEntity(entity.id, {
      fields: [
        ...entity.fields,
        {
          id: crypto.randomUUID(),
          name: `field_${entity.fields.length + 1}`,
          dataType: 'string',
          isPrimaryKey: false,
          isNullable: true,
        },
      ],
    });
  };

  const relationships = schema.relations.filter(
    (relation) => relation.source === entity.id || relation.target === entity.id
  );

  return (
    <aside style={panelStyle}>
      <div style={sectionTitleStyle}>ENTITY CONFIGURATION</div>
      <label style={labelStyle}>
        Entity name
        <input
          value={entity.name}
          onChange={(event) => updateEntity(entity.id, { name: event.target.value })}
          style={inputStyle}
        />
      </label>

      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 22 }}>
        <div style={sectionTitleStyle}>FIELDS</div>
        <button onClick={addField} style={smallButtonStyle}>+ Add field</button>
      </div>

      {entity.fields.map((field) => (
        <div key={field.id} style={fieldCardStyle}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={field.name}
              onChange={(event) => updateField(field.id, { name: event.target.value })}
              style={inputStyle}
            />
            <button
              onClick={() => updateEntity(entity.id, {
                fields: entity.fields.filter((item) => item.id !== field.id),
              })}
              style={iconButtonStyle}
              aria-label={`Delete ${field.name}`}
            >
              🗑
            </button>
          </div>
          <select
            value={field.dataType}
            onChange={(event) => updateField(field.id, {
              dataType: event.target.value as DataFieldType,
            })}
            style={{ ...inputStyle, marginTop: 8 }}
          >
            {FIELD_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 14, marginTop: 9 }}>
            <Checkbox
              label="Primary key"
              checked={field.isPrimaryKey}
              onChange={(checked) => updateField(field.id, {
                isPrimaryKey: checked,
                isNullable: checked ? false : field.isNullable,
              })}
            />
            <Checkbox
              label="Nullable"
              checked={field.isNullable}
              disabled={field.isPrimaryKey}
              onChange={(checked) => updateField(field.id, { isNullable: checked })}
            />
          </div>
        </div>
      ))}

      <div style={{ ...sectionTitleStyle, marginTop: 22 }}>RELATIONSHIPS</div>
      {relationships.length === 0 && (
        <p style={{ color: '#64748b', fontSize: 12 }}>No relationships yet.</p>
      )}
      {relationships.map((relation) => {
        const otherId = relation.source === entity.id ? relation.target : relation.source;
        const other = schema.entities.find((item) => item.id === otherId);
        return (
          <div key={relation.id} style={fieldCardStyle}>
            <div style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 8 }}>
              {relation.source === entity.id ? 'To' : 'From'} {other?.name ?? 'Unknown entity'}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={relation.cardinality}
                onChange={(event) => updateRelation(relation.id, {
                  cardinality: event.target.value as RelationCardinality,
                })}
                style={inputStyle}
              >
                {CARDINALITIES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                onClick={() => removeRelation(relation.id)}
                style={iconButtonStyle}
                aria-label="Delete relationship"
              >
                🗑
              </button>
            </div>
          </div>
        );
      })}

      <button onClick={() => removeEntity(entity.id)} style={deleteButtonStyle}>
        Delete entity
      </button>
    </aside>
  );
}

function Checkbox({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={{ alignItems: 'center', color: '#94a3b8', display: 'flex', fontSize: 11, gap: 5 }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

const panelStyle: React.CSSProperties = {
  background: '#1e293b',
  borderLeft: '1px solid #334155',
  boxSizing: 'border-box',
  color: '#e2e8f0',
  overflowY: 'auto',
  padding: 18,
  width: 300,
};

const sectionTitleStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.08em',
};

const labelStyle: React.CSSProperties = {
  color: '#94a3b8',
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  marginTop: 16,
};

const inputStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #475569',
  borderRadius: 6,
  boxSizing: 'border-box',
  color: '#e2e8f0',
  minWidth: 0,
  padding: '7px 8px',
  width: '100%',
};

const fieldCardStyle: React.CSSProperties = {
  background: '#162033',
  border: '1px solid #334155',
  borderRadius: 8,
  marginTop: 10,
  padding: 10,
};

const smallButtonStyle: React.CSSProperties = {
  background: '#334155',
  border: 'none',
  borderRadius: 5,
  color: '#e2e8f0',
  cursor: 'pointer',
  fontSize: 11,
  padding: '5px 8px',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: 5,
};

const deleteButtonStyle: React.CSSProperties = {
  background: '#7f1d1d',
  border: '1px solid #b91c1c',
  borderRadius: 6,
  color: '#fecaca',
  cursor: 'pointer',
  marginTop: 24,
  padding: '8px 10px',
  width: '100%',
};
