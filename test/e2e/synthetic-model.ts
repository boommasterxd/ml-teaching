/** Tiny isolated feature extractor; real TF graph parsing, WebGL and KNN remain active. */
export const syntheticModel = {
  format: 'graph-model',
  generatedBy: 'ML Teaching synthetic browser fixture',
  convertedBy: 'ML Teaching synthetic browser fixture',
  modelTopology: {
    node: [
      {
        name: 'images',
        op: 'Placeholder',
        attr: {
          dtype: { type: 'DT_FLOAT' },
          shape: {
            shape: { dim: [{ size: '-1' }, { size: '224' }, { size: '224' }, { size: '3' }] },
          },
        },
      },
      {
        name: 'axes',
        op: 'Const',
        attr: {
          dtype: { type: 'DT_INT32' },
          value: {
            tensor: { dtype: 'DT_INT32', tensorShape: { dim: [{ size: '2' }] }, intVal: [1, 2] },
          },
        },
      },
      {
        name: 'module_apply_default/MobilenetV2/Logits/AvgPool',
        op: 'Mean',
        input: ['images', 'axes'],
        attr: { T: { type: 'DT_FLOAT' }, Tidx: { type: 'DT_INT32' }, keep_dims: { b: true } },
      },
    ],
    versions: { producer: 1, minConsumer: 0 },
  },
  weightsManifest: [
    { paths: ['synthetic-weights.bin'], weights: [{ name: 'axes', shape: [2], dtype: 'int32' }] },
  ],
};
