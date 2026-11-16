import { describe, expect, it, vi } from 'vitest';
import { createTopographyRenderer } from '@/components/hero/topography-renderer';

function gpu() {
  const gl = {
    getExtension: vi.fn(() => ({})),
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    detachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    deleteProgram: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    createTexture: vi.fn(() => ({})),
    deleteBuffer: vi.fn(),
    deleteTexture: vi.fn(),
    useProgram: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    bindTexture: vi.fn(),
    pixelStorei: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    getUniformLocation: vi.fn(() => null),
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform4fv: vi.fn(),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    drawArrays: vi.fn(),
    isContextLost: vi.fn(() => false),
  };
  const canvas = { getContext: vi.fn(() => gl) } as unknown as HTMLCanvasElement;
  return { canvas, gl };
}

describe('optional contour GPU resources', () => {
  it('releases shaders after linking, disposes every retained allocation once and prevents later draws', () => {
    const { canvas, gl } = gpu();
    const renderer = createTopographyRenderer(canvas)!;
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    const frame = {
      width: 720,
      height: 620,
      dpr: 2,
      time: 0,
      lift: 0,
      hill: [0, 0] as [number, number],
      ripples: new Float32Array(16),
      color: [1, 0, 0] as [number, number, number],
    };
    renderer.draw(frame);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    renderer.dispose();
    renderer.dispose();
    renderer.draw(frame);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('fails back to the static scene and releases partial allocations when shader linking fails', () => {
    const { canvas, gl } = gpu();
    gl.getProgramParameter.mockReturnValue(false);
    expect(createTopographyRenderer(canvas)).toBeNull();
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.createBuffer).not.toHaveBeenCalled();
  });
});
