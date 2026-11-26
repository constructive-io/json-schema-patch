import JSONSchemaPatch from '../src';

describe('JSONSchemaPatch - Remove Complex allOf References', () => {
  it('should remove properties with allOf references and clean up the schema', () => {
    const schema = {
      $defs: {
        asset: { type: "object", properties: { id: { type: "number" } } },
        product: { type: "object", properties: { name: { type: "string" } } }
      },
      properties: {
        name: { type: "string" },
        item: {
          allOf: [
            { $ref: "#/$defs/asset" },
            { $ref: "#/$defs/product" }
          ]
        },
        equipment: {
          allOf: [
            { $ref: "#/$defs/asset" }
          ]
        }
      },
      required: ["name", "item", "equipment"]
    };
    const patcher = new JSONSchemaPatch(schema);

    // Removing both 'asset' and 'product' definitions used in allOf structures
    patcher.removeDefinition('asset');
    patcher.removeDefinition('product');

    // After removing the definitions, check that the 'item' and 'equipment' properties are also removed
    expect(schema).toEqual({
      $defs: {},
      properties: {
        name: { type: "string" }
      },
      required: ["name"] // 'item' and 'equipment' should be removed from required as their conditions fail
    });
  });
});

describe('JSONSchemaPatch - Remove definitions from compositions with other rules', () => {
  it('keeps a property that still has other rules and its required entry', () => {
    const schema = {
      $defs: { asset: { type: "object" } },
      properties: {
        item: { description: "an item", allOf: [{ $ref: "#/$defs/asset" }] }
      },
      required: ["item"]
    };
    new JSONSchemaPatch(schema).removeDefinition('asset');
    expect(schema).toEqual({
      $defs: {},
      properties: { item: { description: "an item" } },
      required: ["item"]
    });
  });

  it('handles several references to the same definition on one property', () => {
    const schema = {
      $defs: { asset: { type: "object" } },
      properties: {
        item: {
          allOf: [{ $ref: "#/$defs/asset" }],
          anyOf: [{ $ref: "#/$defs/asset" }, { $ref: "#/$defs/asset" }]
        },
        name: { type: "string" }
      },
      required: ["item", "name"]
    };
    new JSONSchemaPatch(schema).removeDefinition('asset');
    expect(schema).toEqual({
      $defs: {},
      properties: { name: { type: "string" } },
      required: ["name"]
    });
  });
});
